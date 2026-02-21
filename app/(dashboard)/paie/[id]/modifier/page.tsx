'use client';

/**
 * ─────────────────────────────────────────────────────────────
 * VERSION PRODUCTION — src/app/paie/[id]/modifier/page.tsx
 * ─────────────────────────────────────────────────────────────
 * Modification d'un bulletin DRAFT existant.
 * Champs modifiables : salaire de base, primes, jours, heures sup.
 * Recalcul côté backend via PATCH /payrolls/:id
 * ─────────────────────────────────────────────────────────────
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, Save, Loader2, AlertCircle, RefreshCw,
  Clock, Calendar, DollarSign, Gift, ChevronRight,
  CheckCircle2, XCircle, Info
} from 'lucide-react';
import { api } from '@/services/api';

// ─── Types ───────────────────────────────────────────────────
interface PayrollData {
  id: string;
  status: string;
  month: number;
  year: number;
  baseSalary: number;
  grossSalary: number;
  netSalary: number;
  cnssSalarial: number;
  its: number;
  totalDeductions: number;
  totalEmployerCost: number;
  workDays: number;
  workedDays: number;
  absenceDays: number;
  overtimeHours10?: number;
  overtimeHours25?: number;
  overtimeHours50?: number;
  overtimeHours100?: number;
  employee?: {
    id?: string;
    firstName?: string;
    lastName?: string;
    employeeNumber?: string;
    position?: string;
    baseSalary?: number;
  };
  bonuses?: BonusItem[];
}

interface BonusItem {
  id: string;
  label: string;
  amount: number;
  isRecurring: boolean;
  isTaxable: boolean;
  isCnss: boolean;
}

interface SimResult {
  grossSalary: number;
  netSalary: number;
  cnssSalarial: number;
  its: number;
  totalDeductions: number;
  totalEmployerCost: number;
  absenceDeduction: number;
  totalOvertimeAmount: number;
  totalBonuses: number;
}

const MONTHS = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
const fmt = (v: number) => Math.round(v ?? 0).toLocaleString('fr-FR');

// ─── Composant ───────────────────────────────────────────────
export default function EditPayrollPage({ params }: { params: { id: string } }) {
  const router = useRouter();

  const [payroll, setPayroll]       = useState<PayrollData | null>(null);
  const [isLoading, setIsLoading]   = useState(true);
  const [isSaving, setIsSaving]     = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulation, setSimulation] = useState<SimResult | null>(null);
  const [saved, setSaved]           = useState(false);

  // ── Champs modifiables ──
  const [baseSalary,  setBaseSalary]  = useState(0);
  const [workedDays,  setWorkedDays]  = useState(0);
  const [overtime10,  setOvertime10]  = useState(0);
  const [overtime25,  setOvertime25]  = useState(0);
  const [overtime50,  setOvertime50]  = useState(0);
  const [overtime100, setOvertime100] = useState(0);
  const [bonuses,     setBonuses]     = useState<BonusItem[]>([]);

  useEffect(() => { load(); }, [params.id]);

  const load = async () => {
    try {
      const data = await api.get<PayrollData>(`/payrolls/${params.id}`);
      if (data.status !== 'DRAFT') {
        alert(`Ce bulletin est "${data.status}" et ne peut pas être modifié.`);
        router.push(`/paie/${params.id}`);
        return;
      }
      setPayroll(data);
      setBaseSalary(data.baseSalary ?? data.employee?.baseSalary ?? 0);
      setWorkedDays(data.workedDays ?? data.workDays ?? 26);
      setOvertime10(data.overtimeHours10  ?? 0);
      setOvertime25(data.overtimeHours25  ?? 0);
      setOvertime50(data.overtimeHours50  ?? 0);
      setOvertime100(data.overtimeHours100 ?? 0);
      setBonuses(data.bonuses ?? []);
    } catch {
      alert('Impossible de charger le bulletin.');
      router.push('/paie');
    } finally { setIsLoading(false); }
  };

  // ── Simulation (preview avant sauvegarde) ──
  const simulate = useCallback(async () => {
    if (!payroll) return;
    setIsSimulating(true);
    setSimulation(null);
    try {
      const result = await api.post<SimResult>('/payrolls/simulate', {
        employeeId:       payroll.employee?.id,
        baseSalary,
        workedDays,
        workDays:         payroll.workDays,
        month:            payroll.month,
        year:             payroll.year,
        overtimeHours10:  overtime10,
        overtimeHours25:  overtime25,
        overtimeHours50:  overtime50,
        overtimeHours100: overtime100,
        bonuses:          bonuses.map(b => ({ id: b.id, amount: b.amount })),
      });
      setSimulation(result);
    } catch (e: any) {
      alert(`Simulation échouée : ${e.message}`);
    } finally { setIsSimulating(false); }
  }, [payroll, baseSalary, workedDays, overtime10, overtime25, overtime50, overtime100, bonuses]);

  // ── Sauvegarde ──
  const save = async () => {
    if (!payroll) return;
    if (workedDays < 0 || workedDays > payroll.workDays) {
      alert(`Jours travaillés : entre 0 et ${payroll.workDays}.`);
      return;
    }
    setIsSaving(true);
    try {
      await api.patch(`/payrolls/${params.id}`, {
        baseSalary,
        workedDays,
        overtimeHours10:  overtime10,
        overtimeHours25:  overtime25,
        overtimeHours50:  overtime50,
        overtimeHours100: overtime100,
        bonuses: bonuses.map(b => ({ id: b.id, amount: b.amount })),
      });
      setSaved(true);
      setTimeout(() => router.push(`/paie/${params.id}`), 1200);
    } catch (e: any) {
      alert(`Erreur : ${e.message}`);
    } finally { setIsSaving(false); }
  };

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="animate-spin text-sky-500" size={32} />
    </div>
  );
  if (!payroll) return null;

  const absenceDays = Math.max(0, payroll.workDays - workedDays);
  const totalOT     = overtime10 + overtime25 + overtime50 + overtime100;
  const hasChanges  = baseSalary !== payroll.baseSalary
    || workedDays !== payroll.workedDays
    || overtime10 !== (payroll.overtimeHours10 ?? 0)
    || overtime25 !== (payroll.overtimeHours25 ?? 0)
    || overtime50 !== (payroll.overtimeHours50 ?? 0)
    || overtime100 !== (payroll.overtimeHours100 ?? 0);

  return (
    <div className="max-w-2xl mx-auto pb-24 space-y-5 px-4">

      {/* ── Header ── */}
      <div className="flex items-center gap-3 pt-2">
        <button onClick={() => router.back()}
          className="p-2.5 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 transition-colors flex-shrink-0">
          <ArrowLeft size={18} className="text-gray-500" />
        </button>
        <div className="min-w-0">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Modifier le bulletin</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
            {payroll.employee?.firstName} {payroll.employee?.lastName}
            {' · '}{MONTHS[payroll.month - 1]} {payroll.year}
          </p>
        </div>
        <span className="ml-auto px-3 py-1 rounded-full text-xs font-bold bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 flex-shrink-0">
          BROUILLON
        </span>
      </div>

      {/* ── Notice ── */}
      <div className="flex gap-3 p-4 bg-sky-50 dark:bg-sky-900/20 border border-sky-200 dark:border-sky-800 rounded-2xl">
        <Info size={15} className="text-sky-500 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-sky-700 dark:text-sky-300">
          Modifiez les valeurs puis cliquez sur <strong>Simuler</strong> pour voir le résultat avant d'enregistrer.
          Les montants CNSS et ITS seront recalculés automatiquement.
        </p>
      </div>

      {/* ── SALAIRE DE BASE ── */}
      <Card icon={<DollarSign size={16} className="text-emerald-500" />} title="Salaire de base">
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
              Salaire mensuel brut de base
            </label>
            <div className="flex items-center gap-3">
              <input
                type="number" min={70400} step={1000}
                value={baseSalary}
                onChange={e => setBaseSalary(Math.max(0, Number(e.target.value)))}
                className="flex-1 p-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl font-bold text-lg text-gray-900 dark:text-white text-right outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 font-mono"
              />
              <span className="text-sm text-gray-400 font-mono flex-shrink-0">FCFA</span>
            </div>
            {baseSalary < 70400 && baseSalary > 0 && (
              <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                <XCircle size={11} /> En dessous du SMIG (70 400 FCFA)
              </p>
            )}
          </div>
          <ReadonlyRow label="Valeur actuelle" value={`${fmt(payroll.baseSalary)} FCFA`} />
        </div>
      </Card>

      {/* ── PRÉSENCE ── */}
      <Card icon={<Calendar size={16} className="text-sky-500" />} title="Présence">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
              Jours travaillés{' '}
              <span className="normal-case font-normal text-gray-400">
                (sur {payroll.workDays} jours ouvrables)
              </span>
            </label>
            <div className="flex items-center gap-3">
              <button onClick={() => setWorkedDays(d => Math.max(0, d - 1))}
                className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-700 font-bold text-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex-shrink-0">
                −
              </button>
              <input
                type="number" min={0} max={payroll.workDays}
                value={workedDays}
                onChange={e => setWorkedDays(Math.min(payroll.workDays, Math.max(0, Number(e.target.value))))}
                className="flex-1 p-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl font-bold text-2xl text-gray-900 dark:text-white text-center outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500"
              />
              <button onClick={() => setWorkedDays(d => Math.min(payroll.workDays, d + 1))}
                className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-700 font-bold text-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex-shrink-0">
                +
              </button>
            </div>
          </div>

          {/* Barre visuelle */}
          <div>
            <div className="flex justify-between text-xs text-gray-400 mb-1">
              <span>0</span>
              <span>{payroll.workDays} jours</span>
            </div>
            <div className="h-3 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${(workedDays / payroll.workDays) * 100}%`,
                  background: absenceDays > 0 ? 'linear-gradient(90deg, #f97316, #ef4444)' : 'linear-gradient(90deg, #10b981, #0ea5e9)',
                }}
              />
            </div>
            <div className="flex justify-between text-xs mt-1">
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">{workedDays}j présent</span>
              {absenceDays > 0 && (
                <span className="text-red-500 font-bold">−{absenceDays}j absence</span>
              )}
              {absenceDays === 0 && (
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">✓ Mois complet</span>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* ── HEURES SUPPLÉMENTAIRES ── */}
      <Card icon={<Clock size={16} className="text-orange-500" />} title="Heures supplémentaires"
        badge="Décret n°78-360">
        <div className="space-y-2">
          {[
            { label: '+10%',  sub: '5 premières heures suppl.',        val: overtime10,  set: setOvertime10,  color: '#f97316' },
            { label: '+25%',  sub: 'Heures suivantes (jours ouvr.)',   val: overtime25,  set: setOvertime25,  color: '#ea580c' },
            { label: '+50%',  sub: 'Nuit, repos légal, jour férié',    val: overtime50,  set: setOvertime50,  color: '#c2410c' },
            { label: '+100%', sub: 'Nuit dimanche / jours fériés',     val: overtime100, set: setOvertime100, color: '#9a3412' },
          ].map(({ label, sub, val, set, color }) => (
            <div key={label}
              className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/40 rounded-xl border border-gray-100 dark:border-gray-700">
              <div className="w-14 flex-shrink-0 text-center">
                <span className="font-black text-sm" style={{ color }}>{label}</span>
                <p className="text-[9px] text-gray-400 leading-tight mt-0.5 text-center">{sub}</p>
              </div>
              <div className="flex items-center gap-2 flex-1">
                <button onClick={() => set(v => Math.max(0, v - 0.5))}
                  className="w-8 h-8 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 font-bold text-sm hover:bg-gray-100 transition-colors flex-shrink-0">
                  −
                </button>
                <input
                  type="number" min={0} step={0.5} value={val}
                  onChange={e => set(Math.max(0, Number(e.target.value)))}
                  className="flex-1 p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg font-bold text-gray-900 dark:text-white text-center outline-none focus:ring-2 focus:border-orange-500"
                  style={{ fontSize: 15 }}
                />
                <button onClick={() => set(v => v + 0.5)}
                  className="w-8 h-8 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 font-bold text-sm hover:bg-gray-100 transition-colors flex-shrink-0">
                  +
                </button>
              </div>
              <span className="text-xs text-gray-400 w-10 text-right flex-shrink-0">h</span>
            </div>
          ))}
        </div>
        {totalOT > 0 && (
          <div className="mt-3 p-2.5 bg-orange-50 dark:bg-orange-900/20 rounded-xl border border-orange-200 dark:border-orange-800">
            <p className="text-xs font-bold text-orange-700 dark:text-orange-300 text-center">
              Total HS : {totalOT.toFixed(1)} heure{totalOT > 1 ? 's' : ''}
            </p>
          </div>
        )}
      </Card>

      {/* ── PRIMES ── */}
      {bonuses.length > 0 && (
        <Card icon={<Gift size={16} className="text-cyan-500" />} title="Primes & Accessoires">
          <div className="space-y-3">
            {bonuses.map((b, i) => (
              <div key={b.id} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/40 rounded-xl border border-gray-100 dark:border-gray-700">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{b.label}</p>
                  <div className="flex gap-2 mt-0.5">
                    {b.isTaxable && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-red-50 text-red-600 font-bold">ITS</span>}
                    {b.isCnss    && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-sky-50 text-sky-600 font-bold">CNSS</span>}
                    {b.isRecurring && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-600 font-bold">Récurrente</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <input
                    type="number" min={0} step={500}
                    value={b.amount}
                    onChange={e => {
                      const updated = [...bonuses];
                      updated[i] = { ...b, amount: Math.max(0, Number(e.target.value)) };
                      setBonuses(updated);
                    }}
                    className="w-32 p-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg font-bold text-right text-gray-900 dark:text-white outline-none focus:ring-2 focus:border-cyan-500 font-mono"
                    style={{ fontSize: 13 }}
                  />
                  <span className="text-xs text-gray-400">F</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* ── RÉSULTAT SIMULATION ── */}
      {simulation && (
        <div className="rounded-2xl border-2 border-emerald-300 dark:border-emerald-700 overflow-hidden">
          <div className="bg-emerald-600 px-4 py-2.5 flex items-center gap-2">
            <CheckCircle2 size={16} className="text-white" />
            <span className="text-sm font-bold text-white">Résultat de la simulation</span>
          </div>
          <div className="p-4 bg-white dark:bg-gray-800 grid grid-cols-2 gap-3">
            {[
              { label: 'Salaire brut',     val: fmt(simulation.grossSalary),      color: '#059669' },
              { label: 'Net à payer',      val: fmt(simulation.netSalary),        color: '#0369a1' },
              { label: 'CNSS salarié',     val: `−${fmt(simulation.cnssSalarial)}`,color: '#dc2626' },
              { label: 'ITS',              val: `−${fmt(simulation.its)}`,         color: '#dc2626' },
              { label: 'Déd. absences',    val: `−${fmt(simulation.absenceDeduction)}`, color: '#f97316' },
              { label: 'Total HS',         val: `+${fmt(simulation.totalOvertimeAmount)}`, color: '#d97706' },
            ].map(r => (
              <div key={r.label} className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                <p className="text-xs text-gray-400 dark:text-gray-500 font-bold uppercase tracking-wider mb-1">{r.label}</p>
                <p className="font-black font-mono text-base" style={{ color: r.color }}>{r.val}</p>
                <p className="text-[10px] text-gray-400 font-mono">FCFA</p>
              </div>
            ))}
          </div>
          <div className="px-4 py-2 bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-between">
            <span className="text-xs text-emerald-700 dark:text-emerald-300 font-bold">Net à payer :</span>
            <span className="font-black font-mono text-lg text-emerald-700 dark:text-emerald-300">
              {fmt(simulation.netSalary)} FCFA
            </span>
          </div>
        </div>
      )}

      {/* ── ACTIONS ── */}
      <div className="space-y-3 pt-2">
        {/* Simuler */}
        <button onClick={simulate} disabled={isSimulating}
          className="w-full py-3.5 border-2 border-sky-400 text-sky-600 dark:text-sky-400 font-bold rounded-xl hover:bg-sky-50 dark:hover:bg-sky-900/20 transition-all flex justify-center items-center gap-2 disabled:opacity-50">
          {isSimulating ? <Loader2 className="animate-spin" size={18} /> : <RefreshCw size={18} />}
          {isSimulating ? 'Calcul en cours…' : 'Simuler avant enregistrement'}
        </button>

        {/* Enregistrer */}
        <button onClick={save} disabled={isSaving || !hasChanges}
          className="w-full py-4 font-bold rounded-xl shadow-lg flex justify-center items-center gap-2 disabled:opacity-50 transition-all text-white"
          style={{ background: hasChanges ? 'linear-gradient(135deg, #10b981, #0ea5e9)' : '#9ca3af' }}>
          {isSaving ? <Loader2 className="animate-spin" size={20} /> : saved ? <CheckCircle2 size={20} /> : <Save size={20} />}
          {isSaving ? 'Enregistrement…' : saved ? 'Sauvegardé !' : hasChanges ? 'Enregistrer les modifications' : 'Aucune modification'}
        </button>

        <button onClick={() => router.back()}
          className="w-full py-3 text-gray-500 dark:text-gray-400 font-bold rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-sm">
          Annuler
        </button>
      </div>

      <p className="text-xs text-center text-gray-400 pb-4">
        Après enregistrement, le bulletin sera recalculé avec les nouvelles valeurs. Vérifiez avant de valider.
      </p>
    </div>
  );
}

// ── Composant Card ──
function Card({
  icon, title, badge, children,
}: { icon: React.ReactNode; title: string; badge?: string; children: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center gap-2">
        {icon}
        <h2 className="font-bold text-gray-900 dark:text-white text-sm">{title}</h2>
        {badge && (
          <span className="ml-auto text-xs text-gray-400 font-mono">{badge}</span>
        )}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

// ── Ligne lecture seule ──
function ReadonlyRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center py-1.5">
      <span className="text-xs text-gray-400 dark:text-gray-500">{label}</span>
      <span className="text-xs font-mono font-bold text-gray-500 dark:text-gray-400">{value}</span>
    </div>
  );
}