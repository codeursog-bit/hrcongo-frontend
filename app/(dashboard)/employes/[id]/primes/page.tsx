'use client';

/**
 * 📁 app/(dashboard)/employes/[id]/primes/page.tsx
 * ✅ Affiche les 3 catégories fiscales (NON_TAXABLE / TAXABLE_NO_CNSS / TAXABLE_CNSS)
 * ✅ Badge quantityMode (AUTO_DAYS, AUTO_WEEKS, FREE...)
 * ✅ Section "Quantités à saisir" pour les primes FREE avant bulletin
 * ✅ Saisie quantité mensuelle inline
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, Plus, Trash2, Loader2, Gift, Zap, Hand,
  DollarSign, Calendar, Save, AlertCircle, Settings2,
  ChevronRight, CheckCircle2, Building2, X, Timer,
  Hash, Clock, TrendingUp, Edit3, Check,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '@/services/api';
import { useAlert } from '@/components/providers/AlertProvider';
import type { BonusTemplate } from '@/app/(dashboard)/parametres/primes/page';
import { useBasePath } from '@/hooks/useBasePath';

// ── TYPES ─────────────────────────────────────────────────────────────────────

interface Bonus {
  id:              string;
  bonusType:       string;
  amount?:         number | null;
  percentage?:     number | null;
  baseCalculation?: string | null;
  isRecurring:     boolean;
  description?:    string | null;
  source:          'MANUAL' | 'AUTOMATIC';
  targetMonth?:    number;
  targetYear?:     number;
  isTaxable:       boolean;
  isCnss:          boolean;
  fiscalType?:     'TAXABLE_CNSS' | 'TAXABLE_NO_CNSS' | 'NON_TAXABLE' | null;
  // 🆕 Quantité
  unitAmount?:     number | null;
  quantityMode?:   'AUTO_DAYS' | 'AUTO_WEEKS' | 'AUTO_HOURS' | 'FREE' | null;
  defaultQuantity?: number | null;
  isProratized?:   boolean;
}

interface MonthlyQty {
  id?:             string;
  employeeBonusId: string;
  bonusType:       string;
  month:           number;
  year:            number;
  unitAmount:      number;
  quantity:        number;
  computedAmount:  number;
  note?:           string | null;
}

const MONTHS = [
  { value: 1, label: 'Janvier' },  { value: 2, label: 'Février' },
  { value: 3, label: 'Mars' },     { value: 4, label: 'Avril' },
  { value: 5, label: 'Mai' },      { value: 6, label: 'Juin' },
  { value: 7, label: 'Juillet' },  { value: 8, label: 'Août' },
  { value: 9, label: 'Septembre' },{ value: 10, label: 'Octobre' },
  { value: 11, label: 'Novembre' },{ value: 12, label: 'Décembre' },
];
const now   = new Date();
const YEARS = [now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1];

// ── BADGES ────────────────────────────────────────────────────────────────────

const FiscalBadge = ({ b }: { b: Bonus }) => {
  const ft = b.fiscalType ?? (
    !b.isTaxable && !b.isCnss ? 'NON_TAXABLE' :
    b.isTaxable && !b.isCnss  ? 'TAXABLE_NO_CNSS' : 'TAXABLE_CNSS'
  );
  if (ft === 'NON_TAXABLE') return (
    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-700">
      Indemnité
    </span>
  );
  if (ft === 'TAXABLE_NO_CNSS') return (
    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700">
      ITS seul.
    </span>
  );
  return (
    <span className="inline-flex gap-1">
      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-700">ITS</span>
      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-700">CNSS</span>
    </span>
  );
};

const QuantityBadge = ({ mode }: { mode?: string | null }) => {
  if (!mode) return null;
  const cfg: Record<string, { label: string; icon: any; cls: string }> = {
    AUTO_DAYS:  { label: '× jours', icon: Timer, cls: 'bg-cyan-100 text-cyan-700 border-cyan-200 dark:bg-cyan-900/30 dark:text-cyan-300 dark:border-cyan-700' },
    AUTO_WEEKS: { label: '× semaines', icon: Calendar, cls: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-700' },
    AUTO_HOURS: { label: '× heures', icon: Clock, cls: 'bg-sky-100 text-sky-700 border-sky-200 dark:bg-sky-900/30 dark:text-sky-300 dark:border-sky-700' },
    FREE:       { label: 'À saisir', icon: Hash, cls: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-700' },
  };
  const c = cfg[mode];
  if (!c) return null;
  const Icon = c.icon;
  return (
    <span className={`inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${c.cls}`}>
      <Icon size={9} /> {c.label}
    </span>
  );
};

// ── COMPOSANT MONTANT ────────────────────────────────────────────────────────

const BonusAmount = ({ bonus }: { bonus: Bonus }) => {
  if (bonus.quantityMode && bonus.unitAmount) {
    const labels: Record<string, string> = {
      AUTO_DAYS: '/jour', AUTO_WEEKS: '/sem', AUTO_HOURS: '/h', FREE: '/unité',
    };
    return (
      <div className="text-right">
        <p className="font-bold text-sm text-slate-900 dark:text-white font-mono">
          {Number(bonus.unitAmount).toLocaleString('fr-FR')}
          <span className="text-xs text-slate-400 ml-0.5">FCFA{labels[bonus.quantityMode!] ?? ''}</span>
        </p>
        {bonus.quantityMode === 'FREE' && bonus.defaultQuantity != null && (
          <p className="text-[10px] text-slate-400">défaut: ×{bonus.defaultQuantity}</p>
        )}
      </div>
    );
  }
  if (bonus.amount != null) return (
    <p className="font-bold text-lg text-slate-900 dark:text-white font-mono">
      +{Number(bonus.amount).toLocaleString()} <span className="text-xs text-slate-400">FCFA</span>
    </p>
  );
  if (bonus.percentage != null) return (
    <p className="font-bold text-lg text-purple-600 dark:text-purple-400">
      +{bonus.percentage}% <span className="text-xs text-slate-400">
        {bonus.baseCalculation === 'GROSS_SALARY' ? 'du brut' : 'du base'}
      </span>
    </p>
  );
  return <p className="text-xs text-slate-400 italic">Montant libre</p>;
};

// ── COMPOSANT PRINCIPAL ───────────────────────────────────────────────────────

export default function EmployeePrimesPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const alert  = useAlert();
  const { bp } = useBasePath();

  const backUrl = `/employes/${params.id}/primes`;

  const [employee,    setEmployee]    = useState<any>(null);
  const [bonuses,     setBonuses]     = useState<Bonus[]>([]);
  const [templates,   setTemplates]   = useState<BonusTemplate[]>([]);
  const [isLoading,   setIsLoading]   = useState(true);
  const [showModal,   setShowModal]   = useState(false);
  const [isSaving,    setIsSaving]    = useState(false);
  const [deletingId,  setDeletingId]  = useState<string | null>(null);

  // Formulaire modal
  const [selectedTemplate, setSelectedTemplate] = useState<BonusTemplate | null>(null);
  const [customAmount,      setCustomAmount]      = useState('');
  const [isRecurring,       setIsRecurring]       = useState(true);
  const [targetMonth,       setTargetMonth]       = useState(now.getMonth() + 1);
  const [targetYear,        setTargetYear]        = useState(now.getFullYear());

  // 🆕 Saisie quantités FREE
  const [qtyMonth,      setQtyMonth]      = useState(now.getMonth() + 1);
  const [qtyYear,       setQtyYear]       = useState(now.getFullYear());
  const [qtyValues,     setQtyValues]     = useState<Record<string, string>>({});
  const [qtyNotes,      setQtyNotes]      = useState<Record<string, string>>({});
  const [savingQty,     setSavingQty]     = useState<Record<string, boolean>>({});
  const [savedQty,      setSavedQty]      = useState<Record<string, boolean>>({});
  const [monthlyQtys,   setMonthlyQtys]   = useState<MonthlyQty[]>([]);

  // 🆕 Ancienneté — override personnel (prioritaire sur la config entreprise générale)
  // mode: INHERIT = pas d'override (hérite de l'entreprise) | CUSTOM = formule perso | EXCLUDED = pas de prime auto
  type SeniorityMode = 'INHERIT' | 'CUSTOM' | 'EXCLUDED';
  const [seniorityOvMode,     setSeniorityOvMode]     = useState<SeniorityMode>('INHERIT');
  const [seniorityStartYear,  setSeniorityStartYear]  = useState<number | ''>(2);
  const [seniorityStartRate,  setSeniorityStartRate]  = useState<number | ''>(2);
  const [seniorityRatePerYr,  setSeniorityRatePerYr]  = useState<number | ''>(1);
  const [seniorityCapPercent, setSeniorityCapPercent] = useState<number | ''>('');
  const [savingSeniority,     setSavingSeniority]     = useState(false);
  const [senioritySaved,      setSenioritySaved]      = useState(false);

  // ── Chargement ───────────────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      try {
        const [emp, bonusData, tmpls] = await Promise.all([
          api.get<any>(`/employees/${params.id}`),
          api.get<any>(`/employee-bonuses?employeeId=${params.id}`),
          api.get<any>('/bonus-templates'),
        ]);
        setEmployee(emp);
        // 🆕 Pré-remplit le formulaire d'override ancienneté depuis l'employé
        const ov = emp?.seniorityLinearOverride;
        if (ov && typeof ov === 'object') {
          setSeniorityOvMode(ov.enabled === false ? 'EXCLUDED' : 'CUSTOM');
          setSeniorityStartYear(ov.startYear   ?? 2);
          setSeniorityStartRate(ov.startRate   ?? 2);
          setSeniorityRatePerYr(ov.ratePerYear ?? 1);
          setSeniorityCapPercent(ov.capPercent ?? '');
        }
        const all: Bonus[] = Array.isArray(bonusData) ? bonusData : bonusData?.data || [];
        setBonuses(all);
        const tmplList: BonusTemplate[] = Array.isArray(tmpls) ? tmpls : tmpls?.data || [];
        setTemplates(tmplList.filter(t => t.isActive !== false));
      } catch (e) { console.error(e); } finally { setIsLoading(false); }
    };
    load();
  }, [params.id]);

  // 🆕 Charger les quantités mensuelles existantes pour les primes FREE
  const loadMonthlyQtys = useCallback(async () => {
    const freeBonuses = bonuses.filter(b => b.quantityMode === 'FREE');
    if (freeBonuses.length === 0) return;
    try {
      const res = await api.get<any>(
        `/employee-bonuses/quantities/pending?employeeId=${params.id}&month=${qtyMonth}&year=${qtyYear}`
      );
      const filled: MonthlyQty[] = res?.filled || [];
      const pending: MonthlyQty[] = res?.pending || [];
      setMonthlyQtys([...filled, ...pending]);

      // Pré-remplir les champs avec les valeurs existantes
      const newQtyValues: Record<string, string> = {};
      const newQtyNotes:  Record<string, string> = {};
      for (const q of filled) {
        newQtyValues[q.employeeBonusId] = String(q.quantity);
        newQtyNotes[q.employeeBonusId]  = q.note || '';
      }
      for (const q of pending) {
        if (!newQtyValues[q.employeeBonusId]) {
          newQtyValues[q.employeeBonusId] = String(q.quantity || 0);
        }
      }
      setQtyValues(newQtyValues);
    } catch { /* non bloquant */ }
  }, [bonuses, params.id, qtyMonth, qtyYear]);

  useEffect(() => { loadMonthlyQtys(); }, [loadMonthlyQtys]);

  // 🆕 Sauvegarder une quantité FREE
  const saveQuantity = async (bonusId: string) => {
    const qty = parseFloat(qtyValues[bonusId] || '0');
    if (isNaN(qty) || qty < 0) return;
    setSavingQty(p => ({ ...p, [bonusId]: true }));
    try {
      await api.post(`/employee-bonuses/${bonusId}/quantities`, {
        month:    qtyMonth,
        year:     qtyYear,
        quantity: qty,
        note:     qtyNotes[bonusId] || undefined,
      });
      setSavedQty(p => ({ ...p, [bonusId]: true }));
      setTimeout(() => setSavedQty(p => ({ ...p, [bonusId]: false })), 2000);
      await loadMonthlyQtys();
    } catch (e: any) {
      alert.error('Erreur', e?.message || 'Impossible de sauvegarder la quantité.');
    } finally {
      setSavingQty(p => ({ ...p, [bonusId]: false }));
    }
  };

  // ── Ancienneté — override personnel ─────────────────────────────────────
  const saveSeniorityOverride = async () => {
    setSavingSeniority(true);
    try {
      const payload =
        seniorityOvMode === 'INHERIT'
          ? null // pas d'override → hérite de la config entreprise générale
          : {
              enabled:     seniorityOvMode === 'CUSTOM',
              startYear:   Number(seniorityStartYear)  || 2,
              startRate:   Number(seniorityStartRate)  || 0,
              ratePerYear: Number(seniorityRatePerYr)  || 0,
              capPercent:  seniorityCapPercent === '' ? null : Number(seniorityCapPercent),
            };
      await api.patch(`/employees/${params.id}`, { seniorityLinearOverride: payload });
      setEmployee((p: any) => p ? { ...p, seniorityLinearOverride: payload } : p);
      setSenioritySaved(true);
      alert.success('Enregistré', "Configuration d'ancienneté mise à jour.");
      setTimeout(() => setSenioritySaved(false), 3000);
    } catch (e: any) {
      alert.error('Erreur', e?.message || 'Impossible de sauvegarder la configuration.');
    } finally {
      setSavingSeniority(false);
    }
  };

  // ── Modal ─────────────────────────────────────────────────────────────────
  const openModal = () => {
    setSelectedTemplate(null);
    setCustomAmount('');
    setIsRecurring(true);
    setTargetMonth(now.getMonth() + 1);
    setTargetYear(now.getFullYear());
    setShowModal(true);
  };

  const handleTemplateChange = (tmplId: string) => {
    const tmpl = templates.find(t => t.id === tmplId) || null;
    setSelectedTemplate(tmpl);
    if (tmpl) {
      setIsRecurring(tmpl.isRecurring);
      setCustomAmount(tmpl.defaultAmount != null && !tmpl.unitAmount ? String(tmpl.defaultAmount) : '');
    }
  };

  const handleAdd = async () => {
    if (!selectedTemplate) { alert.error('Prime requise', 'Choisissez une prime.'); return; }

    const hasQuantityMode = !!selectedTemplate.quantityMode;
    const needsAmount = !hasQuantityMode && selectedTemplate.defaultAmount == null && selectedTemplate.defaultPercentage == null;
    if (needsAmount && !customAmount) { alert.error('Montant requis', 'Cette prime nécessite un montant.'); return; }

    setIsSaving(true);
    try {
      const payload: any = {
        employeeId:      params.id,
        bonusType:       selectedTemplate.name,
        bonusTemplateId: selectedTemplate.id,
        isRecurring,
        isTaxable:       selectedTemplate.isTaxable,
        isCnss:          selectedTemplate.isCnss,
        fiscalType:      selectedTemplate.fiscalType,
        description:     selectedTemplate.description || null,
        quantityMode:    selectedTemplate.quantityMode || null,
        unitAmount:      selectedTemplate.unitAmount   || null,
        defaultQuantity: selectedTemplate.defaultQuantity || null,
        isProratized:    selectedTemplate.isProratized || false,
      };
      if (!isRecurring) { payload.targetMonth = targetMonth; payload.targetYear = targetYear; }
      if (!hasQuantityMode) {
        if (customAmount) payload.amount = parseFloat(customAmount);
        else if (selectedTemplate.defaultAmount != null) payload.amount = selectedTemplate.defaultAmount;
        else if (selectedTemplate.defaultPercentage != null) {
          payload.percentage      = selectedTemplate.defaultPercentage;
          payload.baseCalculation = selectedTemplate.baseCalculation;
        }
      }
      const created = await api.post<Bonus>('/employee-bonuses', payload);
      setBonuses(prev => [created as Bonus, ...prev]);
      alert.success('Prime attribuée', `"${selectedTemplate.name}" ajoutée avec succès.`);
      setShowModal(false);
    } catch (e: any) {
      alert.error('Erreur', e?.message || "Impossible d'ajouter la prime.");
    } finally { setIsSaving(false); }
  };

  const handleDelete = async (id: string, name: string) => {
    setDeletingId(id);
    try {
      await api.delete(`/employee-bonuses/${id}`);
      setBonuses(prev => prev.filter(b => b.id !== id));
      alert.success('Supprimée', `"${name}" retirée.`);
    } catch (e: any) {
      alert.error('Erreur', e?.message || 'Impossible de supprimer.');
    } finally { setDeletingId(null); }
  };

  // ── Calculs ───────────────────────────────────────────────────────────────
  const manualBonuses = bonuses.filter(b => b.source === 'MANUAL');
  const autoBonuses   = bonuses.filter(b => b.source === 'AUTOMATIC');
  const freeBonuses   = manualBonuses.filter(b => b.quantityMode === 'FREE');

  // Groupes fiscaux
  const groupNonTaxable   = manualBonuses.filter(b => (b.fiscalType ?? (!b.isTaxable ? 'NON_TAXABLE' : 'OTHER')) === 'NON_TAXABLE');
  const groupTaxableNoCnss = manualBonuses.filter(b => (b.fiscalType ?? (b.isTaxable && !b.isCnss ? 'TAXABLE_NO_CNSS' : 'OTHER')) === 'TAXABLE_NO_CNSS');
  const groupTaxableCnss  = manualBonuses.filter(b => (b.fiscalType ?? (b.isTaxable && b.isCnss ? 'TAXABLE_CNSS' : 'OTHER')) === 'TAXABLE_CNSS');

  const getMonthLabel = (m?: number) => MONTHS.find(x => x.value === m)?.label || '';

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="animate-spin text-cyan-500" size={40} />
    </div>
  );

  // ── Rendu ─────────────────────────────────────────────────────────────────
  const BonusCard = ({ bonus }: { bonus: Bonus }) => (
    <motion.div key={bonus.id}
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -20 }}
      className="glass-panel rounded-xl p-4 flex items-center gap-4">
      <div className="w-10 h-10 bg-cyan-100 dark:bg-cyan-900/30 rounded-xl flex items-center justify-center shrink-0">
        <Gift size={18} className="text-cyan-500" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <p className="font-bold text-slate-900 dark:text-white text-sm">{bonus.bonusType}</p>
          <FiscalBadge b={bonus} />
          <QuantityBadge mode={bonus.quantityMode} />
          {bonus.isProratized && (
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-700">Prorata</span>
          )}
          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${
            bonus.isRecurring
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800'
              : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800'
          }`}>
            {bonus.isRecurring ? 'Récurrente' : `Ponctuelle · ${getMonthLabel(bonus.targetMonth)} ${bonus.targetYear ?? ''}`}
          </span>
        </div>
        {bonus.description && <p className="text-xs text-slate-400">{bonus.description}</p>}
      </div>
      <BonusAmount bonus={bonus} />
      <button onClick={() => handleDelete(bonus.id, bonus.bonusType)} disabled={deletingId === bonus.id}
        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all ml-1">
        {deletingId === bonus.id ? <Loader2 className="animate-spin" size={16} /> : <Trash2 size={16} />}
      </button>
    </motion.div>
  );

  const SectionHeader = ({ icon: Icon, label, count, color }: { icon: any; label: string; count: number; color: string }) => (
    <div className="flex items-center gap-3 mb-3">
      <div className={`w-7 h-7 ${color} rounded-lg flex items-center justify-center`}>
        <Icon size={14} className="text-white" />
      </div>
      <h3 className="text-sm font-bold text-slate-900 dark:text-white">{label}</h3>
      <span className="text-xs text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full font-bold">{count}</span>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto pb-20 space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <button onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-cyan-500 transition-colors">
          <ArrowLeft size={16} /> Retour au profil
        </button>
        <button onClick={openModal}
          className="px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-sky-500 hover:from-cyan-600 hover:to-sky-600 text-white font-bold rounded-xl shadow-lg shadow-cyan-500/20 flex items-center gap-2 transition-all">
          <Plus size={18} /> Attribuer une prime
        </button>
      </div>

      {/* Titre */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
          <Gift size={28} className="text-cyan-500" />
          Primes de {employee?.firstName} {employee?.lastName}
        </h1>
      </div>

      {/* Carte employé */}
      {employee && (
        <div className="glass-panel rounded-2xl p-5 flex items-center gap-4 border border-cyan-200 dark:border-cyan-800 bg-cyan-50/30 dark:bg-cyan-900/10">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-cyan-400 to-sky-500 flex items-center justify-center text-white font-bold text-lg shadow-lg shrink-0">
            {employee.firstName[0]}{employee.lastName[0]}
          </div>
          <div className="flex-1">
            <p className="font-bold text-slate-900 dark:text-white text-lg">{employee.firstName} {employee.lastName}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-0.5">
              <Building2 size={12} />
              {employee.department?.name || employee.departmentName || '—'}
              {employee.position && <><span className="opacity-40">•</span>{employee.position}</>}
            </p>
          </div>
          <CheckCircle2 size={22} className="text-cyan-500 shrink-0" />
        </div>
      )}

      {/* 🆕 Ancienneté — override personnel (prioritaire sur la config entreprise) */}
      {employee && (
        <section className="glass-panel rounded-2xl p-6 border border-violet-200 dark:border-violet-800 bg-violet-50/30 dark:bg-violet-900/10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 bg-violet-500 rounded-lg flex items-center justify-center">
              <TrendingUp size={16} className="text-white" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">Prime d'ancienneté — configuration</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Calculée et affichée automatiquement sur le bulletin. Par défaut, suit la config générale de l'entreprise.</p>
            </div>
          </div>

          {/* Sélecteur de mode */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            {([
              { key: 'INHERIT',  label: 'Config. entreprise', desc: 'Par défaut' },
              { key: 'CUSTOM',   label: 'Personnalisée',      desc: 'Formule propre à cet employé' },
              { key: 'EXCLUDED', label: 'Exclu(e)',           desc: 'Pas de prime auto' },
            ] as const).map(opt => (
              <button key={opt.key} onClick={() => setSeniorityOvMode(opt.key)}
                className={`text-left p-3 rounded-xl border-2 transition-all ${
                  seniorityOvMode === opt.key
                    ? 'border-violet-500 bg-violet-100 dark:bg-violet-900/30'
                    : 'border-slate-200 dark:border-slate-700 hover:border-violet-300'
                }`}>
                <p className="text-xs font-bold text-slate-900 dark:text-white">{opt.label}</p>
                <p className="text-[10px] text-slate-400">{opt.desc}</p>
              </button>
            ))}
          </div>

          {seniorityOvMode === 'INHERIT' && (
            <p className="text-xs text-slate-400 italic">
              Cet employé suit la formule d'ancienneté générale configurée dans les Paramètres entreprise.
            </p>
          )}

          {seniorityOvMode === 'EXCLUDED' && (
            <p className="text-xs text-amber-600 dark:text-amber-400 italic">
              Cet employé ne recevra <strong>aucune</strong> prime d'ancienneté automatique, même si l'entreprise en a une configurée.
            </p>
          )}

          {seniorityOvMode === 'CUSTOM' && (
            <>
              <div className="grid grid-cols-4 gap-2 mb-3">
                <div>
                  <p className="text-[10px] text-gray-400 mb-1">Dès l'année</p>
                  <input type="number" min={0} value={seniorityStartYear}
                    onChange={e => setSeniorityStartYear(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-2 py-2 bg-gray-50 dark:bg-gray-900/50 border border-violet-200 dark:border-violet-800 rounded-xl text-xs font-mono text-right focus:outline-none focus:ring-2 focus:ring-violet-400/30 text-gray-800 dark:text-gray-200" />
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 mb-1">Taux de départ %</p>
                  <input type="number" step="0.1" value={seniorityStartRate}
                    onChange={e => setSeniorityStartRate(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-2 py-2 bg-gray-50 dark:bg-gray-900/50 border border-violet-200 dark:border-violet-800 rounded-xl text-xs font-mono text-right focus:outline-none focus:ring-2 focus:ring-violet-400/30 text-gray-800 dark:text-gray-200" />
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 mb-1">+ % / an suppl.</p>
                  <input type="number" step="0.1" value={seniorityRatePerYr}
                    onChange={e => setSeniorityRatePerYr(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-2 py-2 bg-gray-50 dark:bg-gray-900/50 border border-violet-200 dark:border-violet-800 rounded-xl text-xs font-mono text-right focus:outline-none focus:ring-2 focus:ring-violet-400/30 text-gray-800 dark:text-gray-200" />
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 mb-1">Plafond % (optionnel)</p>
                  <input type="number" step="0.1" value={seniorityCapPercent} placeholder="aucun"
                    onChange={e => setSeniorityCapPercent(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-2 py-2 bg-gray-50 dark:bg-gray-900/50 border border-violet-200 dark:border-violet-800 rounded-xl text-xs font-mono text-right focus:outline-none focus:ring-2 focus:ring-violet-400/30 text-gray-800 dark:text-gray-200" />
                </div>
              </div>

              {employee.hireDate && (() => {
                const hire = new Date(employee.hireDate);
                const today = new Date();
                let years = today.getFullYear() - hire.getFullYear();
                const m = today.getMonth() - hire.getMonth();
                if (m < 0 || (m === 0 && today.getDate() < hire.getDate())) years--;
                const sy = Number(seniorityStartYear) || 0;
                const sr = Number(seniorityStartRate) || 0;
                const ry = Number(seniorityRatePerYr) || 0;
                const cap = seniorityCapPercent === '' ? null : Number(seniorityCapPercent);
                let rate = years >= sy ? sr + (years - sy) * ry : 0;
                if (cap != null) rate = Math.min(rate, cap);
                rate = Math.round(rate * 100) / 100;
                const amount = Math.round((rate / 100) * Number(employee.baseSalary ?? 0));
                return (
                  <p className="text-[11px] text-violet-600 dark:text-violet-300 bg-violet-100/50 dark:bg-violet-900/20 rounded-lg px-3 py-2">
                    Aperçu aujourd'hui : <strong>{years} ans</strong> d'ancienneté → taux <strong>{rate}%</strong> →
                    {' '}<strong>{amount.toLocaleString('fr-FR')} FCFA/mois</strong>
                  </p>
                );
              })()}
            </>
          )}

          <button onClick={saveSeniorityOverride} disabled={savingSeniority}
            className="mt-4 w-full py-2 bg-violet-500 hover:bg-violet-600 text-white text-xs font-bold rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
            {savingSeniority ? <><Loader2 size={12} className="animate-spin"/>Sauvegarde…</> :
             senioritySaved  ? <><CheckCircle2 size={12}/>Sauvegardé ✓</> :
                               'Enregistrer'}
          </button>
        </section>
      )}

      {/* Stats rapides */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total primes', val: manualBonuses.length, icon: Gift, color: 'text-cyan-500', bg: 'bg-cyan-100 dark:bg-cyan-900/30' },
          { label: 'Automatiques', val: autoBonuses.length, icon: Zap, color: 'text-purple-500', bg: 'bg-purple-100 dark:bg-purple-900/30' },
          { label: 'À saisir/mois', val: freeBonuses.length, icon: Hash, color: 'text-amber-500', bg: 'bg-amber-100 dark:bg-amber-900/30' },
        ].map(s => (
          <div key={s.label} className="glass-panel rounded-2xl p-5 flex items-center gap-4">
            <div className={`w-12 h-12 ${s.bg} rounded-xl flex items-center justify-center`}>
              <s.icon size={22} className={s.color} />
            </div>
            <div>
              <p className="text-xs text-slate-400 uppercase font-bold">{s.label}</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{s.val}</p>
            </div>
          </div>
        ))}
      </div>

      {/* 🆕 Section saisie quantités FREE */}
      {freeBonuses.length > 0 && (
        <section className="glass-panel rounded-2xl p-6 border border-amber-200 dark:border-amber-800 bg-amber-50/30 dark:bg-amber-900/10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center">
                <Hash size={16} className="text-white" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">Quantités à saisir</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">Primes à quantité variable — saisir avant de générer le bulletin</p>
              </div>
            </div>
            {/* Sélecteur mois/année */}
            <div className="flex items-center gap-2">
              <select value={qtyMonth} onChange={e => setQtyMonth(Number(e.target.value))}
                className="text-xs p-1.5 bg-white dark:bg-gray-800 border border-amber-200 dark:border-amber-700 rounded-lg outline-none text-slate-900 dark:text-white font-medium">
                {MONTHS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
              <select value={qtyYear} onChange={e => setQtyYear(Number(e.target.value))}
                className="text-xs p-1.5 bg-white dark:bg-gray-800 border border-amber-200 dark:border-amber-700 rounded-lg outline-none text-slate-900 dark:text-white font-medium">
                {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          </div>

          <div className="space-y-3">
            {freeBonuses.map(bonus => {
              const currentQty = monthlyQtys.find(q => q.employeeBonusId === bonus.id);
              const qtyVal = qtyValues[bonus.id] ?? String(bonus.defaultQuantity ?? 0);
              const computed = Math.round(Number(bonus.unitAmount ?? 0) * parseFloat(qtyVal || '0'));
              const isSaving_ = savingQty[bonus.id];
              const isSaved_  = savedQty[bonus.id];

              return (
                <div key={bonus.id} className="bg-white dark:bg-gray-900 rounded-xl p-4 border border-amber-100 dark:border-amber-900">
                  <div className="flex items-center gap-3 mb-3">
                    <div>
                      <p className="font-bold text-sm text-slate-900 dark:text-white">{bonus.bonusType}</p>
                      <p className="text-xs text-slate-400">{Number(bonus.unitAmount ?? 0).toLocaleString('fr-FR')} FCFA × quantité</p>
                    </div>
                    {currentQty && (
                      <span className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-700">
                        ✓ Saisi : ×{currentQty.quantity}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 flex-1">
                      <input type="number" min="0" step="1"
                        value={qtyVal}
                        onChange={e => setQtyValues(p => ({ ...p, [bonus.id]: e.target.value }))}
                        placeholder="0"
                        className="w-24 p-2 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-700 rounded-lg outline-none font-bold font-mono text-lg text-center text-slate-900 dark:text-white" />
                      <span className="text-slate-400 text-sm">×</span>
                      <span className="font-mono text-sm text-slate-600 dark:text-slate-300">
                        {Number(bonus.unitAmount ?? 0).toLocaleString('fr-FR')} FCFA
                      </span>
                      <span className="text-slate-400">=</span>
                      <span className="font-bold font-mono text-cyan-600 dark:text-cyan-400">
                        {computed.toLocaleString('fr-FR')} FCFA
                      </span>
                    </div>
                    <input type="text"
                      value={qtyNotes[bonus.id] ?? ''}
                      onChange={e => setQtyNotes(p => ({ ...p, [bonus.id]: e.target.value }))}
                      placeholder="Note (optionnel)"
                      className="flex-1 p-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg outline-none text-xs text-slate-600 dark:text-slate-400" />
                    <button onClick={() => saveQuantity(bonus.id)} disabled={isSaving_}
                      className={`px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2 transition-all ${
                        isSaved_
                          ? 'bg-emerald-500 text-white'
                          : 'bg-amber-500 hover:bg-amber-600 text-white'
                      }`}>
                      {isSaving_ ? <Loader2 className="animate-spin" size={14} /> :
                       isSaved_  ? <><Check size={14} /> Sauvé</> :
                       <><Save size={14} /> Sauver</>}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <p className="text-xs text-amber-600 dark:text-amber-400 mt-3 flex items-center gap-1">
            <AlertCircle size={11} />
            Ces quantités seront utilisées lors de la génération du bulletin. Modifiables même après génération (avant validation).
          </p>
        </section>
      )}

      {/* Primes groupées par catégorie fiscale */}
      {manualBonuses.length === 0 ? (
        <div className="glass-panel rounded-2xl p-10 text-center">
          <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <Gift size={28} className="text-slate-400" />
          </div>
          <p className="text-slate-500 dark:text-slate-400 font-medium mb-2">Aucune prime attribuée</p>
          <button onClick={openModal}
            className="px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-sky-500 text-white font-bold rounded-xl text-sm flex items-center gap-2 mx-auto mt-4">
            <Plus size={16} /> Attribuer une prime
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Indemnités nettes */}
          {groupNonTaxable.length > 0 && (
            <section>
              <SectionHeader icon={DollarSign} label="Indemnités — Net direct" count={groupNonTaxable.length} color="bg-amber-500" />
              <div className="space-y-2">
                <AnimatePresence>{groupNonTaxable.map(b => <BonusCard key={b.id} bonus={b} />)}</AnimatePresence>
              </div>
            </section>
          )}

          {/* Primes imposables ITS uniquement */}
          {groupTaxableNoCnss.length > 0 && (
            <section>
              <SectionHeader icon={TrendingUp} label="Primes imposables — ITS seul" count={groupTaxableNoCnss.length} color="bg-blue-500" />
              <div className="space-y-2">
                <AnimatePresence>{groupTaxableNoCnss.map(b => <BonusCard key={b.id} bonus={b} />)}</AnimatePresence>
              </div>
            </section>
          )}

          {/* Primes imposables ITS + CNSS */}
          {groupTaxableCnss.length > 0 && (
            <section>
              <SectionHeader icon={Hand} label="Primes imposables — ITS + CNSS" count={groupTaxableCnss.length} color="bg-violet-500" />
              <div className="space-y-2">
                <AnimatePresence>{groupTaxableCnss.map(b => <BonusCard key={b.id} bonus={b} />)}</AnimatePresence>
              </div>
            </section>
          )}

          {/* Lien catalogue */}
          <button onClick={() => router.push(bp(`/parametres/primes?back=${encodeURIComponent(backUrl)}`))}
            className="w-full flex items-center justify-between p-4 rounded-xl border border-dashed border-cyan-300 dark:border-cyan-700 bg-cyan-50/50 dark:bg-cyan-900/10 hover:bg-cyan-50 dark:hover:bg-cyan-900/20 transition-all group">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-cyan-100 dark:bg-cyan-900/30 rounded-xl flex items-center justify-center">
                <Settings2 size={16} className="text-cyan-500" />
              </div>
              <div className="text-left">
                <p className="text-sm font-bold text-cyan-700 dark:text-cyan-300">Gérer le catalogue</p>
                <p className="text-xs text-cyan-500 dark:text-cyan-400">Ajouter, modifier ou supprimer des types de primes</p>
              </div>
            </div>
            <ChevronRight size={16} className="text-cyan-400 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      )}

      {/* Primes automatiques */}
      {autoBonuses.length > 0 && (
        <section>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
              <Zap size={16} className="text-purple-500" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Primes automatiques</h2>
            <span className="text-xs text-purple-600 bg-purple-50 dark:bg-purple-900/20 dark:text-purple-400 px-2 py-0.5 rounded-full font-bold border border-purple-200 dark:border-purple-800">
              Convention Collective
            </span>
          </div>
          <div className="space-y-2">
            {autoBonuses.map(bonus => (
              <div key={bonus.id} className="glass-panel rounded-xl p-4 flex items-center gap-4 border-l-4 border-l-purple-500">
                <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center shrink-0">
                  <Zap size={18} className="text-purple-500" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-bold text-sm text-slate-900 dark:text-white">{bonus.bonusType}</p>
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 border border-purple-200 dark:border-purple-800 flex items-center gap-1">
                      <Zap size={9} /> Auto
                    </span>
                    <FiscalBadge b={bonus} />
                  </div>
                  {bonus.description && <p className="text-xs text-slate-400 mt-0.5">{bonus.description}</p>}
                </div>
                <BonusAmount bonus={bonus} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ═══ MODAL ══════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {showModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xl p-4"
            onClick={() => setShowModal(false)}>
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              onClick={e => e.stopPropagation()}
              className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-white/10 rounded-3xl p-8 max-w-md w-full shadow-2xl relative overflow-y-auto max-h-[90vh]">

              <button onClick={() => setShowModal(false)} className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
                <X size={20} />
              </button>

              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-cyan-100 dark:bg-cyan-900/30 text-cyan-500 rounded-full flex items-center justify-center">
                  <Gift size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">Attribuer une prime</h2>
                  <p className="text-xs text-slate-400 mt-0.5">{employee?.firstName} {employee?.lastName}</p>
                </div>
              </div>

              <div className="space-y-5">
                {/* Catalogue */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Choisir dans le catalogue</label>
                  {templates.length === 0 ? (
                    <div className="p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-xl text-center">
                      <p className="text-sm text-amber-700 dark:text-amber-300 font-medium mb-2">Catalogue vide</p>
                      <button onClick={() => { setShowModal(false); router.push(bp(`/parametres/primes?back=${encodeURIComponent(backUrl)}`)); }}
                        className="text-xs font-bold text-amber-700 dark:text-amber-300 underline">
                        Aller au catalogue →
                      </button>
                    </div>
                  ) : (
                    <select value={selectedTemplate?.id || ''} onChange={e => handleTemplateChange(e.target.value)}
                      className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none text-slate-900 dark:text-white font-medium">
                      <option value="">— Sélectionner une prime —</option>
                      {templates.map(t => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                          {t.unitAmount ? ` — ${Number(t.unitAmount).toLocaleString('fr-FR')} FCFA/unité` : ''}
                          {t.defaultAmount ? ` — ${Number(t.defaultAmount).toLocaleString('fr-FR')} FCFA` : ''}
                          {t.defaultPercentage ? ` — ${t.defaultPercentage}%` : ''}
                        </option>
                      ))}
                    </select>
                  )}

                  {/* Aperçu template sélectionné */}
                  {selectedTemplate && (
                    <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <FiscalBadge b={{ ...selectedTemplate, source: 'MANUAL', isRecurring: selectedTemplate.isRecurring, bonusType: selectedTemplate.name }} />
                        <QuantityBadge mode={selectedTemplate.quantityMode} />
                        {selectedTemplate.isProratized && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-700">Prorata</span>
                        )}
                      </div>
                      {selectedTemplate.description && (
                        <p className="text-xs text-gray-400">{selectedTemplate.description}</p>
                      )}
                      {selectedTemplate.quantityMode === 'FREE' && (
                        <p className="text-xs text-amber-600 dark:text-amber-400 mt-1 flex items-center gap-1">
                          <AlertCircle size={11} /> La quantité sera saisie depuis la section "Quantités à saisir"
                        </p>
                      )}
                      {selectedTemplate.quantityMode && selectedTemplate.quantityMode !== 'FREE' && (
                        <p className="text-xs text-cyan-600 dark:text-cyan-400 mt-1 flex items-center gap-1">
                          <Zap size={11} /> Calcul automatique depuis le pointage
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Montant custom si nécessaire */}
                {selectedTemplate && !selectedTemplate.quantityMode && selectedTemplate.defaultAmount == null && selectedTemplate.defaultPercentage == null && (
                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Montant (FCFA)</label>
                    <input type="number" min="0" value={customAmount} onChange={e => setCustomAmount(e.target.value)}
                      placeholder="Ex: 25 000"
                      className="w-full p-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none font-bold font-mono text-xl text-slate-900 dark:text-white" />
                  </div>
                )}

                {/* Ajustement optionnel si montant par défaut */}
                {selectedTemplate && !selectedTemplate.quantityMode && selectedTemplate.defaultAmount != null && (
                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                      Ajuster le montant <span className="text-xs font-normal text-gray-400">(optionnel — défaut: {Number(selectedTemplate.defaultAmount).toLocaleString('fr-FR')} F)</span>
                    </label>
                    <input type="number" min="0" value={customAmount} onChange={e => setCustomAmount(e.target.value)}
                      placeholder={String(selectedTemplate.defaultAmount)}
                      className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none font-bold font-mono text-lg text-slate-900 dark:text-white" />
                  </div>
                )}

                {/* Fréquence */}
                {selectedTemplate && (
                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Fréquence</label>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { val: true,  label: 'Récurrente', sub: 'Chaque mois', color: 'emerald' },
                        { val: false, label: 'Ponctuelle',  sub: '1 mois cible', color: 'amber' },
                      ].map(btn => (
                        <button key={String(btn.val)} type="button" onClick={() => setIsRecurring(btn.val)}
                          className={`p-3 rounded-xl border-2 text-left transition-all ${
                            isRecurring === btn.val
                              ? btn.color === 'emerald'
                                ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300'
                                : 'border-amber-500 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300'
                              : 'border-slate-200 dark:border-slate-700 text-slate-500'
                          }`}>
                          <div className="font-bold text-sm">{btn.label}</div>
                          <div className="text-xs opacity-75 mt-0.5">{btn.sub}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Mois cible */}
                <AnimatePresence>
                  {selectedTemplate && !isRecurring && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }} style={{ overflow: 'hidden' }}>
                      <label className="block text-sm font-bold text-amber-700 dark:text-amber-300 mb-2 flex items-center gap-1">
                        <Calendar size={14} /> Mois cible
                      </label>
                      <div className="grid grid-cols-2 gap-3 p-3 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-xl">
                        <select value={targetMonth} onChange={e => setTargetMonth(Number(e.target.value))}
                          className="w-full p-2.5 bg-white dark:bg-gray-800 border border-amber-200 dark:border-amber-700 rounded-lg outline-none text-slate-900 dark:text-white font-medium text-sm">
                          {MONTHS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                        </select>
                        <select value={targetYear} onChange={e => setTargetYear(Number(e.target.value))}
                          className="w-full p-2.5 bg-white dark:bg-gray-800 border border-amber-200 dark:border-amber-700 rounded-lg outline-none text-slate-900 dark:text-white font-medium text-sm">
                          {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                  <button onClick={() => setShowModal(false)}
                    className="flex-1 py-4 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-bold rounded-xl hover:bg-gray-200 transition-all">
                    Annuler
                  </button>
                  <button onClick={handleAdd} disabled={isSaving || !selectedTemplate}
                    className="flex-1 py-4 bg-gradient-to-r from-cyan-500 to-sky-500 hover:from-cyan-600 hover:to-sky-600 text-white font-bold rounded-xl shadow-lg transition-all flex justify-center items-center gap-2 disabled:opacity-50">
                    {isSaving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                    Attribuer
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}