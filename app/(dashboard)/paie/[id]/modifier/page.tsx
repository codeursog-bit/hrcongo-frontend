'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, Save, Loader2, AlertCircle, DollarSign,
  Calendar, Clock, Gift, Minus, Plus, Check, RefreshCw,
  TrendingUp, TrendingDown, Minus as MinusIcon,
} from 'lucide-react';
import { api } from '@/services/api';
import { useAlert } from '@/components/providers/AlertProvider';

// ─── Types ────────────────────────────────────────────────────────────────────
interface PayrollEditData {
  id: string;
  status: string;
  month: number;
  year: number;
  baseSalary: number;
  grossSalary: number;
  netSalary: number;
  workDays: number;
  workedDays: number;
  absenceDays: number;
  cnssSalarial: number;
  its: number;
  overtimeHours10?: number;
  overtimeHours25?: number;
  overtimeHours50?: number;
  overtimeHours100?: number;
  employee?: {
    id: string;
    firstName?: string;
    lastName?: string;
    employeeNumber?: string;
    position?: string;
  };
}

interface EmployeeBonus {
  id: string;
  bonusType: string;
  amount: number | null;
  fixedAmount?: number | null;
  percentage: number | null;
  calculationType?: 'FIXED_AMOUNT' | 'PERCENTAGE';
  isRecurring?: boolean;
  frequency?: string;
  isActive?: boolean;
  isTaxable: boolean;
  isCnss: boolean;
}

// Résultat de simulation (aperçu recalcul)
interface SimPreview {
  grossSalary: number;
  netSalary: number;
  cnssSalarial: number;
  its: number;
  totalBonuses: number;
  totalOvertimeAmount: number;
}

const MONTHS = [
  'Janvier','Février','Mars','Avril','Mai','Juin',
  'Juillet','Août','Septembre','Octobre','Novembre','Décembre'
];

const fmt = (v: number) => Math.round(v ?? 0).toLocaleString('fr-FR');

// ─── Flèche de variation ──────────────────────────────────────────────────────
const Delta = ({ before, after }: { before: number; after: number }) => {
  const diff = after - before;
  if (Math.abs(diff) < 1) return null;
  const positive = diff > 0;
  return (
    <span className={`text-xs font-bold flex items-center gap-0.5 ${positive ? 'text-emerald-400' : 'text-red-400'}`}>
      {positive ? <TrendingUp size={11}/> : <TrendingDown size={11}/>}
      {positive ? '+' : ''}{fmt(diff)} F
    </span>
  );
};

// ─── Ligne heures sup ─────────────────────────────────────────────────────────
const OtRow = ({ label, sub, value, onChange }: {
  label: string; sub: string; value: number; onChange: (v: number) => void;
}) => (
  <div className="flex items-center gap-3 px-4 py-2.5 bg-orange-500/5 dark:bg-orange-900/10 rounded-xl mb-1.5">
    <div className="w-14 shrink-0">
      <span className="font-black text-orange-500 text-sm">{label}</span>
      <p className="text-[10px] text-gray-400 mt-0.5 leading-tight">{sub}</p>
    </div>
    <button onClick={() => onChange(Math.max(0, +(value - 0.5).toFixed(1)))}
      className="w-7 h-7 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700
                 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors cursor-pointer">
      <Minus size={11} />
    </button>
    <span className="w-12 text-center font-bold font-mono text-sm text-gray-900 dark:text-white">
      {value.toFixed(1)}
    </span>
    <button onClick={() => onChange(+(value + 0.5).toFixed(1))}
      className="w-7 h-7 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700
                 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors cursor-pointer">
      <Plus size={11} />
    </button>
    <span className="text-xs text-gray-400">h</span>
  </div>
);

// ─── Page principale ──────────────────────────────────────────────────────────
export default function EditPayrollPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const alert  = useAlert();

  const [payroll,   setPayroll]   = useState<PayrollEditData | null>(null);
  const [bonuses,   setBonuses]   = useState<EmployeeBonus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving,  setIsSaving]  = useState(false);
  const [saved,     setSaved]     = useState(false);

  // Champs modifiables
  const [baseSalary, setBaseSalary] = useState(0);
  const [workedDays, setWorkedDays] = useState(0);
  const [ot10,  setOt10]  = useState(0);
  const [ot25,  setOt25]  = useState(0);
  const [ot50,  setOt50]  = useState(0);
  const [ot100, setOt100] = useState(0);
  const [bonusEdits,   setBonusEdits]   = useState<Record<string, number>>({});
  const [dirtyBonuses, setDirtyBonuses] = useState<Set<string>>(new Set());

  // ✅ Aperçu recalcul temps réel
  const [preview,     setPreview]     = useState<SimPreview | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [previewTimer, setPreviewTimer] = useState<NodeJS.Timeout | null>(null);

  // ── Chargement ────────────────────────────────────────────────────────────
  useEffect(() => { loadPayroll(); }, [params.id]);

  const loadPayroll = async () => {
    try {
      const data = await api.get<PayrollEditData>(`/payrolls/${params.id}`);

      if (data.status !== 'DRAFT') {
        alert.error('Non modifiable', `Un bulletin "${data.status}" ne peut pas être modifié.`);
        router.push(`/paie/${params.id}`);
        return;
      }

      setPayroll(data);
      setBaseSalary(Number(data.baseSalary));
      setWorkedDays(data.workedDays ?? data.workDays ?? 26);
      setOt10(Number(data.overtimeHours10  ?? 0));
      setOt25(Number(data.overtimeHours25  ?? 0));
      setOt50(Number(data.overtimeHours50  ?? 0));
      setOt100(Number(data.overtimeHours100 ?? 0));

      if ((data as any).employee?.id) {
        try {
          const bonusData: any = await api.get(
            `/employee-bonuses?employeeId=${(data as any).employee.id}`
          );
          const list: EmployeeBonus[] = Array.isArray(bonusData) ? bonusData : bonusData?.data || [];
          const fixedBonuses = list.filter(b =>
            (b.isActive !== false) &&
            (b.calculationType === 'FIXED_AMOUNT' || (b.amount != null && b.percentage == null))
          );
          setBonuses(fixedBonuses);
          const initEdits: Record<string, number> = {};
          fixedBonuses.forEach(b => {
            initEdits[b.id] = Number(b.amount ?? b.fixedAmount ?? 0);
          });
          setBonusEdits(initEdits);
        } catch { /* non bloquant */ }
      }
    } catch {
      alert.error('Erreur', 'Impossible de charger le bulletin.');
      router.push('/paie');
    } finally {
      setIsLoading(false);
    }
  };

  // ── Recalcul en temps réel via /payrolls/simulate ─────────────────────────
  const triggerPreview = useCallback((
    newBaseSalary: number,
    newWorkedDays: number,
    newOt10: number, newOt25: number, newOt50: number, newOt100: number,
  ) => {
    if (!payroll?.employee?.id) return;

    // Debounce 600ms — évite un appel à chaque clic
    if (previewTimer) clearTimeout(previewTimer);

    const timer = setTimeout(async () => {
      if (newBaseSalary < 70400) return;
      setIsPreviewLoading(true);
      try {
        const result: any = await api.post('/payrolls/simulate', {
          employeeId:       payroll.employee!.id,
          month:            payroll.month,
          year:             payroll.year,
          baseSalary:       newBaseSalary,
          workedDays:       newWorkedDays,
          overtimeHours10:  newOt10,
          overtimeHours25:  newOt25,
          overtimeHours50:  newOt50,
          overtimeHours100: newOt100,
        });
        setPreview({
          grossSalary:         result.grossSalary,
          netSalary:           result.netSalary,
          cnssSalarial:        result.cnssSalarial,
          its:                 result.its,
          totalBonuses:        result.totalBonuses ?? 0,
          totalOvertimeAmount: result.overtime?.total ?? 0,
        });
      } catch {
        setPreview(null);
      } finally {
        setIsPreviewLoading(false);
      }
    }, 600);

    setPreviewTimer(timer);
  }, [payroll, previewTimer]);

  // Déclencher l'aperçu à chaque changement de valeur
  const handleBaseSalaryChange = (v: number) => {
    setBaseSalary(v);
    triggerPreview(v, workedDays, ot10, ot25, ot50, ot100);
  };
  const handleWorkedDaysChange = (v: number) => {
    setWorkedDays(v);
    triggerPreview(baseSalary, v, ot10, ot25, ot50, ot100);
  };
  const handleOt10Change  = (v: number) => { setOt10(v);  triggerPreview(baseSalary, workedDays, v,    ot25, ot50, ot100); };
  const handleOt25Change  = (v: number) => { setOt25(v);  triggerPreview(baseSalary, workedDays, ot10, v,    ot50, ot100); };
  const handleOt50Change  = (v: number) => { setOt50(v);  triggerPreview(baseSalary, workedDays, ot10, ot25, v,    ot100); };
  const handleOt100Change = (v: number) => { setOt100(v); triggerPreview(baseSalary, workedDays, ot10, ot25, ot50, v); };

  // ── Détection de changements ──────────────────────────────────────────────
  const hasChanges = payroll ? (
    baseSalary !== Number(payroll.baseSalary)                     ||
    workedDays !== (payroll.workedDays ?? payroll.workDays ?? 26) ||
    ot10       !== Number(payroll.overtimeHours10  ?? 0)          ||
    ot25       !== Number(payroll.overtimeHours25  ?? 0)          ||
    ot50       !== Number(payroll.overtimeHours50  ?? 0)          ||
    ot100      !== Number(payroll.overtimeHours100 ?? 0)          ||
    dirtyBonuses.size > 0
  ) : false;

  // ── Sauvegarde ────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!payroll) return;

    const workDays = payroll.workDays ?? 26;
    if (workedDays < 0 || workedDays > workDays) {
      alert.error('Valeur invalide', `Les jours travaillés doivent être entre 0 et ${workDays}.`);
      return;
    }
    if (baseSalary < 70400) {
      alert.error('Salaire invalide', 'Le salaire ne peut pas être inférieur au SMIG (70 400 FCFA).');
      return;
    }

    setIsSaving(true);
    const bonusErrors: string[] = [];

    try {
      await api.patch(`/payrolls/${params.id}`, {
        baseSalary,
        workedDays,
        overtimeHours10:  ot10,
        overtimeHours25:  ot25,
        overtimeHours50:  ot50,
        overtimeHours100: ot100,
      });

      if (dirtyBonuses.size > 0) {
        await Promise.all(
          Array.from(dirtyBonuses).map(async (bonusId) => {
            try {
              await api.patch(`/employee-bonuses/${bonusId}`, {
                amount:      bonusEdits[bonusId],
                fixedAmount: bonusEdits[bonusId],
              });
            } catch {
              bonusErrors.push(bonuses.find(b => b.id === bonusId)?.bonusType ?? bonusId);
            }
          })
        );
      }

      if (bonusErrors.length > 0) {
        alert.error('Bulletin sauvegardé', `${bonusErrors.length} prime(s) non modifiées : ${bonusErrors.join(', ')}.`);
      } else {
        setSaved(true);
        setTimeout(() => router.push(`/paie/${params.id}`), 800);
      }
    } catch (e: any) {
      alert.error('Erreur de sauvegarde', e?.response?.data?.message || e?.message || 'Impossible de sauvegarder.');
    } finally {
      setIsSaving(false);
    }
  };

  // ── Guards ────────────────────────────────────────────────────────────────
  if (isLoading) return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <Loader2 size={32} className="animate-spin text-indigo-500" />
    </div>
  );
  if (!payroll) return null;

  const workDays    = payroll.workDays ?? 26;
  const absenceDays = Math.max(0, workDays - workedDays);

  // Valeurs affichées (aperçu si disponible, sinon valeurs BDD)
  const displayGross = preview?.grossSalary  ?? payroll.grossSalary;
  const displayNet   = preview?.netSalary    ?? payroll.netSalary;
  const displayCnss  = preview?.cnssSalarial ?? payroll.cnssSalarial;
  const displayIts   = preview?.its          ?? payroll.its;

  return (
    <div className="max-w-[680px] mx-auto px-4 py-6 pb-20">

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.back()}
          className="w-9 h-9 rounded-xl border border-gray-200 dark:border-gray-700
                     bg-white dark:bg-gray-800 flex items-center justify-center
                     hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer">
          <ArrowLeft size={17} className="text-gray-500 dark:text-gray-400" />
        </button>
        <div>
          <h1 className="text-xl font-black text-gray-900 dark:text-white">Modifier le bulletin</h1>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {payroll.employee?.firstName} {payroll.employee?.lastName}
            {' · '}{MONTHS[payroll.month - 1]} {payroll.year}
          </p>
        </div>
        <span className="ml-auto text-[10px] font-bold px-2.5 py-1 rounded-lg
                         bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400
                         border border-amber-200 dark:border-amber-700">
          DRAFT
        </span>
      </div>

      {/* ── Notice ────────────────────────────────────────────────────────── */}
      <div className="flex items-start gap-2.5 p-3 mb-5 rounded-xl
                      bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
        <AlertCircle size={13} className="text-blue-500 dark:text-blue-400 mt-0.5 shrink-0" />
        <p className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
          <strong>Recalcul automatique</strong> — L'aperçu ci-dessous se met à jour en temps réel.
          Après sauvegarde, le backend recalcule CNSS, ITS et net à payer.
        </p>
      </div>

      {/* ── Aperçu résultat (recalcul temps réel) ─────────────────────────── */}
      <div className="bg-gray-900 dark:bg-black rounded-2xl p-5 mb-5 relative overflow-hidden">
        {isPreviewLoading && (
          <div className="absolute inset-0 bg-gray-900/60 dark:bg-black/60 flex items-center justify-center rounded-2xl z-10">
            <RefreshCw size={18} className="animate-spin text-white" />
          </div>
        )}

        <div className="flex items-center justify-between mb-4">
          <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">
            {preview ? '⚡ Aperçu recalculé' : 'Valeurs actuelles'}
          </p>
          {preview && (
            <span className="text-[10px] text-violet-400 font-semibold bg-violet-900/30 px-2 py-0.5 rounded-full">
              Simulation live
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3 mb-3">
          {/* Net à payer — le plus important */}
          <div className="col-span-2 bg-white/5 rounded-xl p-4">
            <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Net à payer</p>
            <div className="flex items-end gap-3">
              <p className="text-2xl font-black font-mono text-white tracking-tight">
                {fmt(displayNet)}
                <span className="text-sm font-normal text-gray-400 ml-1.5">FCFA</span>
              </p>
              {preview && <Delta before={payroll.netSalary} after={displayNet} />}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div className="bg-white/5 rounded-xl p-3">
            <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Brut</p>
            <p className="font-bold font-mono text-emerald-400 text-sm">{fmt(displayGross)} F</p>
            {preview && <Delta before={payroll.grossSalary} after={displayGross} />}
          </div>
          <div className="bg-white/5 rounded-xl p-3">
            <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">CNSS</p>
            <p className="font-bold font-mono text-red-400 text-sm">{fmt(displayCnss)} F</p>
            {preview && <Delta before={payroll.cnssSalarial} after={displayCnss} />}
          </div>
          <div className="bg-white/5 rounded-xl p-3">
            <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">ITS</p>
            <p className="font-bold font-mono text-red-400 text-sm">{fmt(displayIts)} F</p>
            {preview && <Delta before={payroll.its} after={displayIts} />}
          </div>
        </div>
      </div>

      {/* ── Salaire de base ───────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-5 mb-4">
        <div className="flex items-center gap-2 mb-3">
          <DollarSign size={15} className="text-emerald-500" />
          <h3 className="font-bold text-sm text-gray-900 dark:text-white">Salaire de base</h3>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={baseSalary}
            onChange={e => handleBaseSalaryChange(Number(e.target.value))}
            className={`flex-1 px-3 py-2.5 rounded-xl border text-base font-bold font-mono outline-none
                        transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                        focus:ring-2 focus:ring-violet-500/20
                        ${baseSalary < 70400
                          ? 'border-red-300 dark:border-red-700'
                          : baseSalary !== Number(payroll.baseSalary)
                            ? 'border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-900/10'
                            : 'border-gray-200 dark:border-gray-600'}`}
          />
          <span className="text-sm text-gray-400 whitespace-nowrap">FCFA</span>
        </div>
        {baseSalary < 70400 ? (
          <p className="text-xs text-red-500 mt-1.5">⚠ Inférieur au SMIG (70 400 FCFA)</p>
        ) : baseSalary !== Number(payroll.baseSalary) ? (
          <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1.5">
            {fmt(payroll.baseSalary)} → {fmt(baseSalary)} FCFA
          </p>
        ) : null}
      </div>

      {/* ── Présence ──────────────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-5 mb-4">
        <div className="flex items-center gap-2 mb-3">
          <Calendar size={15} className="text-violet-500" />
          <h3 className="font-bold text-sm text-gray-900 dark:text-white">Présence</h3>
          <span className="ml-auto text-[10px] text-gray-400">Base : {workDays} jours ouvrables</span>
        </div>

        <div className="flex items-center gap-2.5 mb-2">
          <button onClick={() => handleWorkedDaysChange(Math.max(0, workedDays - 1))}
            className="w-8 h-8 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700
                       flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors cursor-pointer">
            <Minus size={13} className="text-gray-600 dark:text-gray-300" />
          </button>
          <input
            type="number" min={0} max={workDays} value={workedDays}
            onChange={e => handleWorkedDaysChange(Math.min(workDays, Math.max(0, Number(e.target.value))))}
            className="w-16 text-center font-black text-lg font-mono border border-gray-200 dark:border-gray-600
                       rounded-xl py-1.5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white outline-none"
          />
          <button onClick={() => handleWorkedDaysChange(Math.min(workDays, workedDays + 1))}
            className="w-8 h-8 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700
                       flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors cursor-pointer">
            <Plus size={13} className="text-gray-600 dark:text-gray-300" />
          </button>
          {absenceDays > 0
            ? <span className="text-xs font-bold text-orange-500">→ {absenceDays}j d'absence</span>
            : <span className="text-xs font-bold text-emerald-500">✓ Mois complet</span>
          }
        </div>

        <div className="h-1.5 rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden">
          <div className="h-full rounded-full transition-all duration-300"
            style={{
              width: `${(workedDays / workDays) * 100}%`,
              background: absenceDays === 0 ? '#10b981' : '#f97316',
            }} />
        </div>
      </div>

      {/* ── Heures supplémentaires ────────────────────────────────────────── */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-5 mb-4">
        <div className="flex items-center gap-2 mb-3">
          <Clock size={15} className="text-orange-500" />
          <h3 className="font-bold text-sm text-gray-900 dark:text-white">Heures supplémentaires</h3>
          <span className="ml-auto text-[10px] text-gray-400">Décret 78-360</span>
        </div>
        <OtRow label="+10%"  sub="5 premières heures"   value={ot10}  onChange={handleOt10Change} />
        <OtRow label="+25%"  sub="Heures suivantes"     value={ot25}  onChange={handleOt25Change} />
        <OtRow label="+50%"  sub="Nuit / repos / férié" value={ot50}  onChange={handleOt50Change} />
        <OtRow label="+100%" sub="Nuit dim. / férié"    value={ot100} onChange={handleOt100Change} />

        {(ot10 + ot25 + ot50 + ot100) > 0 && (
          <div className="mt-2 px-3 py-2 bg-orange-50 dark:bg-orange-900/10 rounded-xl">
            <span className="text-xs font-bold text-orange-600 dark:text-orange-400">
              Total : {(ot10 + ot25 + ot50 + ot100).toFixed(1)} h sup
              {preview?.totalOvertimeAmount ? ` → +${fmt(preview.totalOvertimeAmount)} FCFA` : ''}
            </span>
          </div>
        )}
      </div>

      {/* ── Primes ────────────────────────────────────────────────────────── */}
      {bonuses.length > 0 && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-5 mb-4">
          <div className="flex items-center gap-2 mb-1">
            <Gift size={15} className="text-cyan-500" />
            <h3 className="font-bold text-sm text-gray-900 dark:text-white">Primes de l'employé</h3>
          </div>
          <p className="text-[10px] text-gray-400 mb-3">Seules les primes à montant fixe sont modifiables ici.</p>

          <div className="space-y-2">
            {bonuses.map(b => {
              const currentVal  = bonusEdits[b.id] ?? Number(b.amount ?? b.fixedAmount ?? 0);
              const isDirty     = dirtyBonuses.has(b.id);
              const origVal     = Number(b.amount ?? b.fixedAmount ?? 0);
              const isNonTaxable = b.isTaxable === false;
              const taxableOnly  = b.isTaxable === true && b.isCnss === false;

              return (
                <div key={b.id}
                  className={`flex items-center gap-3 p-3 rounded-xl border transition-all
                    ${isDirty
                      ? 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-800'
                      : 'bg-gray-50 dark:bg-gray-700/30 border-gray-100 dark:border-gray-700'
                    }`}>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">{b.bonusType}</span>
                    <span className="ml-2 text-[10px] text-gray-400">
                      {(b.isRecurring !== false || b.frequency === 'MONTHLY') ? 'mensuelle' : 'ponctuelle'}
                    </span>
                    <span className="inline-flex gap-1 ml-2 align-middle">
                      {!isNonTaxable && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full
                                         bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300
                                         border border-cyan-200 dark:border-cyan-700">ITS</span>
                      )}
                      {!isNonTaxable && !taxableOnly && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full
                                         bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300
                                         border border-emerald-200 dark:border-emerald-700">CNSS</span>
                      )}
                      {isNonTaxable && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full
                                         bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300
                                         border border-amber-200 dark:border-amber-700">Net direct</span>
                      )}
                      {taxableOnly && !isNonTaxable && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full
                                         bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300
                                         border border-indigo-200 dark:border-indigo-700">ITS seul</span>
                      )}
                    </span>
                  </div>

                  <input
                    type="number"
                    value={currentVal}
                    onChange={e => {
                      const v = Number(e.target.value);
                      setBonusEdits(prev => ({ ...prev, [b.id]: v }));
                      setDirtyBonuses(prev => {
                        const next = new Set(prev);
                        v !== origVal ? next.add(b.id) : next.delete(b.id);
                        return next;
                      });
                    }}
                    className="w-28 px-2.5 py-1.5 border border-gray-200 dark:border-gray-600
                               rounded-lg text-sm font-mono font-bold text-right outline-none
                               bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                  <span className="text-xs text-gray-400">F</span>
                  {isDirty && <span className="text-xs font-bold text-emerald-500 whitespace-nowrap">✓</span>}
                </div>
              );
            })}
          </div>
          <p className="text-[10px] text-orange-500 dark:text-orange-400 mt-3">
            ⚠ Modifier une prime ici change sa valeur permanente pour les prochains bulletins.
          </p>
        </div>
      )}

      {/* ── Boutons d'action ──────────────────────────────────────────────── */}
      <div className="flex gap-3">
        <button onClick={() => router.back()}
          className="flex-1 py-3 rounded-xl font-bold text-sm cursor-pointer transition-colors
                     bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300
                     hover:bg-gray-200 dark:hover:bg-gray-600 border border-transparent">
          Annuler
        </button>

        <button
          onClick={handleSave}
          disabled={isSaving || !hasChanges || saved}
          className={`flex-[2] py-3 rounded-xl font-black text-sm flex items-center justify-center gap-2
                      transition-all duration-200
                      ${saved
                        ? 'bg-emerald-500 text-white cursor-not-allowed'
                        : !hasChanges || isSaving
                          ? 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
                          : 'bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white shadow-lg shadow-violet-500/25 cursor-pointer'
                      }`}>
          {isSaving ? (
            <><Loader2 size={17} className="animate-spin" /> Sauvegarde...</>
          ) : saved ? (
            <><Check size={17} /> Sauvegardé !</>
          ) : (
            <>
              <Save size={17} />
              Enregistrer
              {dirtyBonuses.size > 0 ? ` + ${dirtyBonuses.size} prime${dirtyBonuses.size > 1 ? 's' : ''}` : ''}
            </>
          )}
        </button>
      </div>

      {!hasChanges && !saved && (
        <p className="text-center text-xs text-gray-400 mt-3">
          Aucune modification — modifiez au moins un champ pour activer la sauvegarde
        </p>
      )}
    </div>
  );
}