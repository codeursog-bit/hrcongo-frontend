'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, Save, Loader2, AlertCircle, RefreshCw,
  Clock, Calendar, ChevronRight
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
  overtime10?: number; overtimeAmount10?: number;
  overtime25?: number; overtimeAmount25?: number;
  overtime50?: number; overtimeAmount50?: number;
  overtime100?: number; overtimeAmount100?: number;
  cnssSalarial: number;
  cnssEmployer: number;
  its: number;
  totalDeductions: number;
  totalEmployerCost: number;
  employee?: {
    firstName?: string;
    lastName?: string;
    employeeNumber?: string;
    position?: string;
  };
}

interface SimulationResult {
  grossSalary: number;
  netSalary: number;
  cnssSalarial: number;
  cnssEmployer: number;
  its: number;
  totalDeductions: number;
  totalEmployerCost: number;
  overtime: {
    hours10: number; amount10: number;
    hours25: number; amount25: number;
    hours50: number; amount50: number;
    hours100: number; amount100: number;
    total: number;
  };
}

const MONTHS = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function EditPayrollPage({ params }: { params: { id: string } }) {
  const router  = useRouter();
  const alert   = useAlert();

  const [payroll, setPayroll]       = useState<PayrollEditData | null>(null);
  const [isLoading, setIsLoading]   = useState(true);
  const [isSaving, setIsSaving]     = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulation, setSimulation] = useState<SimulationResult | null>(null);

  // Champs modifiables
  const [workedDays,  setWorkedDays]  = useState(0);
  const [overtime10,  setOvertime10]  = useState(0);
  const [overtime25,  setOvertime25]  = useState(0);
  const [overtime50,  setOvertime50]  = useState(0);
  const [overtime100, setOvertime100] = useState(0);

  useEffect(() => { loadPayroll(); }, [params.id]);

  const loadPayroll = async () => {
    try {
      const data = await api.get<PayrollEditData>(`/payrolls/${params.id}`);

      // Garde-fou : seuls les DRAFT sont modifiables
      if (data.status !== 'DRAFT') {
        alert.error('Non modifiable', `Un bulletin "${data.status}" ne peut pas être modifié.`);
        router.push(`/paie/${params.id}`);
        return;
      }

      setPayroll(data);
      setWorkedDays(data.workedDays ?? data.workDays ?? 26);
      setOvertime10(Number(data.overtime10 ?? 0));
      setOvertime25(Number(data.overtime25 ?? 0));
      setOvertime50(Number(data.overtime50 ?? 0));
      setOvertime100(Number(data.overtime100 ?? 0));
    } catch (e: any) {
      alert.error('Erreur', 'Impossible de charger le bulletin.');
      router.push('/paie');
    } finally {
      setIsLoading(false);
    }
  };

  // ── Simulation avant sauvegarde ──────────────────────────────────────────
  const handleSimulate = async () => {
    if (!payroll) return;
    setIsSimulating(true);
    try {
      const result = await api.post<SimulationResult>('/payrolls/simulate', {
        employeeId: payroll.employee?.employeeNumber ? undefined : undefined,
        month: payroll.month,
        year: payroll.year,
      });
      setSimulation(result);
    } catch {
      // Simulation optionnelle, on continue sans
    } finally {
      setIsSimulating(false);
    }
  };

  // ── Sauvegarde ───────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!payroll) return;
    if (workedDays < 0 || workedDays > (payroll.workDays ?? 26)) {
      alert.error('Valeur invalide', `Les jours travaillés doivent être entre 0 et ${payroll.workDays ?? 26}.`);
      return;
    }

    setIsSaving(true);
    try {
      await api.patch(`/payrolls/${params.id}`, {
        workedDays,
        overtimeHours10:  overtime10,
        overtimeHours25:  overtime25,
        overtimeHours50:  overtime50,
        overtimeHours100: overtime100,
      });
      alert.success('Bulletin mis à jour', 'Les modifications ont été enregistrées. Recalculez si nécessaire.');
      router.push(`/paie/${params.id}`);
    } catch (e: any) {
      alert.error('Erreur', e.message || 'Impossible de sauvegarder.');
    } finally {
      setIsSaving(false);
    }
  };

  const fmt = (v: number) => (v ?? 0).toLocaleString('fr-FR');

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="animate-spin text-sky-500" size={32} />
    </div>
  );

  if (!payroll) return null;

  const absenceDays = Math.max(0, (payroll.workDays ?? 26) - workedDays);
  const totalOT = overtime10 + overtime25 + overtime50 + overtime100;

  return (
    <div className="max-w-2xl mx-auto pb-20 space-y-6">

      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()}
          className="p-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 transition-colors">
          <ArrowLeft size={20} className="text-gray-500" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Modifier le bulletin</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {payroll.employee?.firstName} {payroll.employee?.lastName} · {MONTHS[payroll.month - 1]} {payroll.year}
          </p>
        </div>
      </div>

      {/* Info : ce qu'on peut/ne peut pas modifier */}
      <div className="p-4 bg-sky-50 dark:bg-sky-900/20 border border-sky-200 dark:border-sky-800 rounded-2xl">
        <p className="text-sm text-sky-800 dark:text-sky-200 flex items-start gap-2">
          <AlertCircle size={16} className="shrink-0 mt-0.5" />
          <span>
            <strong>Champs modifiables :</strong> jours travaillés et heures supplémentaires.<br/>
            <strong>Champs fixes :</strong> salaire de base, primes configurées, taux fiscaux.
            Après modification, le bulletin sera <strong>recalculé automatiquement</strong> via l'endpoint de recalcul.
          </span>
        </p>
      </div>

      {/* Champs fixes — lecture seule */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="font-bold text-gray-900 dark:text-white mb-4 text-sm uppercase tracking-wider text-gray-400 dark:text-gray-500">
          Valeurs fixes (lecture seule)
        </h2>
        <div className="grid grid-cols-2 gap-4">
          {[
            { label: 'Salaire de base',   value: fmt(payroll.baseSalary) + ' FCFA' },
            { label: 'Jours ouvrables',   value: `${payroll.workDays ?? 26} jours` },
            { label: 'Brut actuel',       value: fmt(payroll.grossSalary) + ' FCFA' },
            { label: 'Net actuel',        value: fmt(payroll.netSalary) + ' FCFA' },
          ].map(({ label, value }) => (
            <div key={label} className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
              <p className="text-xs text-gray-400 dark:text-gray-500 font-bold uppercase tracking-wider mb-0.5">{label}</p>
              <p className="font-bold text-gray-900 dark:text-white font-mono">{value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Jours travaillés */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 space-y-4">
        <h2 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Calendar size={18} className="text-sky-500" /> Présence
        </h2>

        <div>
          <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
            Jours travaillés
            <span className="ml-2 text-xs font-normal text-gray-400">(sur {payroll.workDays ?? 26} jours ouvrables)</span>
          </label>
          <div className="flex items-center gap-3">
            <input
              type="number"
              min={0}
              max={payroll.workDays ?? 26}
              value={workedDays}
              onChange={e => setWorkedDays(Math.min(payroll.workDays ?? 26, Math.max(0, Number(e.target.value))))}
              className="w-28 p-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl font-bold text-xl text-gray-900 dark:text-white text-center outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500"
            />
            <div className="text-sm text-gray-500">
              {absenceDays > 0 && (
                <span className="text-orange-600 dark:text-orange-400 font-bold">
                  → {absenceDays} jour{absenceDays > 1 ? 's' : ''} d'absence déduit{absenceDays > 1 ? 's' : ''}
                </span>
              )}
              {absenceDays === 0 && (
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">✓ Mois complet</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Heures supplémentaires */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 space-y-4">
        <h2 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Clock size={18} className="text-orange-500" /> Heures supplémentaires
          <span className="text-xs font-normal text-gray-400 ml-auto">Décret n°78-360</span>
        </h2>

        <div className="space-y-3">
          {[
            { label: '+10%',  sub: '5 premières heures supplémentaires',  value: overtime10,  set: setOvertime10 },
            { label: '+25%',  sub: 'Heures suivantes (jours ouvrables)',  value: overtime25,  set: setOvertime25 },
            { label: '+50%',  sub: 'Nuit, repos légal ou jour férié',     value: overtime50,  set: setOvertime50 },
            { label: '+100%', sub: 'Nuit dimanche / jours fériés',        value: overtime100, set: setOvertime100 },
          ].map(({ label, sub, value, set }) => (
            <div key={label} className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
              <div className="w-16 flex-shrink-0">
                <span className="font-black text-orange-600 dark:text-orange-400 text-sm">{label}</span>
                <p className="text-[10px] text-gray-400 leading-tight mt-0.5">{sub}</p>
              </div>
              <input
                type="number"
                min={0}
                step={0.5}
                value={value}
                onChange={e => set(Math.max(0, Number(e.target.value)))}
                className="w-24 p-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg font-bold text-gray-900 dark:text-white text-center outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500"
              />
              <span className="text-xs text-gray-400">heures</span>
            </div>
          ))}
        </div>

        {totalOT > 0 && (
          <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-xl border border-orange-200 dark:border-orange-800">
            <p className="text-sm font-bold text-orange-700 dark:text-orange-300">
              Total : {totalOT.toFixed(1)} heure{totalOT > 1 ? 's' : ''} supplémentaire{totalOT > 1 ? 's' : ''}
            </p>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button onClick={() => router.back()}
          className="flex-1 py-4 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-bold rounded-xl hover:bg-gray-200 transition-all">
          Annuler
        </button>
        <button onClick={handleSave} disabled={isSaving}
          className="flex-1 py-4 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold rounded-xl shadow-lg transition-all flex justify-center items-center gap-2 disabled:opacity-50">
          {isSaving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
          Enregistrer
        </button>
      </div>

      <p className="text-xs text-center text-gray-400">
        Après sauvegarde, le bulletin sera recalculé. Vérifiez les montants sur le bulletin avant de le valider.
      </p>
    </div>
  );
}