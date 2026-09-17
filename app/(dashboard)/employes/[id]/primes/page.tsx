'use client';

/**
 * 📁 app/(dashboard)/employes/[id]/primes/page.tsx
 * ✅ Affiche les 3 catégories fiscales (NON_TAXABLE / TAXABLE_NO_CNSS / TAXABLE_CNSS)
 * ✅ Badge quantityMode (FREE uniquement)
 * ✅ Section "Quantités à saisir" pour les primes FREE avant bulletin
 * ✅ Saisie quantité mensuelle inline
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, Plus, Trash2, Loader2, Gift, Zap, Hand,
  DollarSign, Calendar, Save, AlertCircle, Settings2,
  ChevronRight, CheckCircle2, Building2, X,
  Hash, TrendingUp, Edit3, Check,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '@/services/api';
import { useAlert } from '@/components/providers/AlertProvider';
import type { BonusTemplate } from '@/app/(dashboard)/parametres/primes/page';
import { useBasePath } from '@/hooks/useBasePath';
import { SalaryRecap } from '@/components/employees/SalaryRecap';

// ── TYPES ─────────────────────────────────────────────────────────────────────

interface Bonus {
  id:              string;
  bonusType:       string;
  amount?:         number | null;
  percentage?:     number | null;
  baseCalculation?: string | null;
  isRecurring:     boolean;
  frequency?:      'MONTHLY' | 'ANNUAL' | 'ONE_TIME';
  description?:    string | null;
  source:          'MANUAL' | 'AUTOMATIC';
  targetMonth?:    number;
  targetYear?:     number;
  isTaxable:       boolean;
  isCnss:          boolean;
  fiscalType?:     'TAXABLE_CNSS' | 'TAXABLE_NO_CNSS' | 'NON_TAXABLE' | null;
  // 🆕 Quantité
  unitAmount?:     number | null;
  quantityMode?:   'FREE' | null;
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
    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-[var(--surface-2)] text-[var(--text-muted)] border border-[var(--border)]">
      Indemnité
    </span>
  );
  if (ft === 'TAXABLE_NO_CNSS') return (
    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-700">
      ITS seul.
    </span>
  );
  return (
    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-700">
      ITS + CNSS
    </span>
  );
};

const QuantityBadge = ({ mode }: { mode?: string | null }) => {
  if (mode !== 'FREE') return null;
  return (
    <span className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full border bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-700">
      <Hash size={9} /> À saisir
    </span>
  );
};

// ── COMPOSANT MONTANT ────────────────────────────────────────────────────────

const BonusAmount = ({ bonus }: { bonus: Bonus }) => {
  if (bonus.quantityMode === 'FREE' && bonus.unitAmount) {
    return (
      <div className="text-right">
        <p className="font-bold text-sm text-[var(--text)] font-mono">
          {Number(bonus.unitAmount).toLocaleString('fr-FR')}
          <span className="text-xs text-[var(--text-muted)] ml-0.5">FCFA/unité</span>
        </p>
        {bonus.defaultQuantity != null && (
          <p className="text-[10px] text-[var(--text-muted)]">défaut: ×{bonus.defaultQuantity}</p>
        )}
      </div>
    );
  }
  if (bonus.amount != null) return (
    <p className="font-bold text-lg text-[var(--text)] font-mono">
      +{Number(bonus.amount).toLocaleString()} <span className="text-xs text-[var(--text-muted)]">FCFA</span>
    </p>
  );
  if (bonus.percentage != null) return (
    <p className="font-bold text-lg text-amber-600 dark:text-amber-400">
      +{bonus.percentage}% <span className="text-xs text-[var(--text-muted)]">
        {bonus.baseCalculation === 'GROSS_SALARY' ? 'du brut' : 'du base'}
      </span>
    </p>
  );
  return <p className="text-xs text-[var(--text-muted)] italic">Montant libre</p>;
};

// ── RÉCAP / SIMULATION SALAIRE ───────────────────────────────────────────────
// Extrait en composant partagé (@/components/employees/SalaryRecap) pour être
// réutilisé aussi sur la fiche employé principale (salaire contractuel).

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
  // 🆕 3 fréquences possibles :
  //  - MONTHLY  : chaque mois (transport, panier fixe...)
  //  - ANNUAL   : une fois par an, le même mois chaque année (13e mois) —
  //               se déclenche seul, pas besoin de le recréer l'an prochain
  //  - ONE_TIME : sur un ou plusieurs mois choisis cette année-ci uniquement
  //               (hsup forfaitaire versée seulement en janvier et mars)
  type FrequencyChoice = 'MONTHLY' | 'ANNUAL' | 'ONE_TIME';
  const [frequencyChoice,   setFrequencyChoice]   = useState<FrequencyChoice>('MONTHLY');
  // Mois cible(s) : un seul pour ANNUAL (mois de versement chaque année),
  // plusieurs possibles pour ONE_TIME
  const [targetMonths,      setTargetMonths]      = useState<number[]>([now.getMonth() + 1]);
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
    setFrequencyChoice('MONTHLY');
    setTargetMonths([now.getMonth() + 1]);
    setTargetYear(now.getFullYear());
    setShowModal(true);
  };

  const handleTemplateChange = (tmplId: string) => {
    const tmpl = templates.find(t => t.id === tmplId) || null;
    setSelectedTemplate(tmpl);
    if (tmpl) {
      // 🆕 Défaut intelligent : les primes EXCEPTIONNELLE calculées par
      // formule (13e mois mois complet/demi-mois) sont annuelles par nature
      // — elles se déclenchent seules chaque année sans ressaisie.
      const isYearlyFormula = tmpl.bonusCategory === 'EXCEPTIONNELLE' && tmpl.isRecurring;
      setFrequencyChoice(isYearlyFormula ? 'ANNUAL' : tmpl.isRecurring ? 'MONTHLY' : 'ONE_TIME');
      setTargetMonths([now.getMonth() + 1]);
      setCustomAmount(tmpl.defaultAmount != null && !tmpl.unitAmount ? String(tmpl.defaultAmount) : '');
    }
  };

  const toggleTargetMonth = (m: number) => {
    setTargetMonths(prev =>
      prev.includes(m) ? prev.filter(x => x !== m) : [...prev, m].sort((a, b) => a - b)
    );
  };

  const handleAdd = async () => {
    if (!selectedTemplate) { alert.error('Prime requise', 'Choisissez une prime.'); return; }

    const hasQuantityMode = !!selectedTemplate.quantityMode;
    const needsAmount = !hasQuantityMode && selectedTemplate.defaultAmount == null && selectedTemplate.defaultPercentage == null;
    if (needsAmount && !customAmount) { alert.error('Montant requis', 'Cette prime nécessite un montant.'); return; }
    if (frequencyChoice !== 'MONTHLY' && targetMonths.length === 0) {
      alert.error('Mois requis', 'Choisissez au moins un mois cible.'); return;
    }

    setIsSaving(true);
    try {
      const basePayload: any = {
        employeeId:      params.id,
        bonusType:       selectedTemplate.name,
        bonusTemplateId: selectedTemplate.id,
        // ✅ On envoie la fréquence explicitement (le backend accepte
        // dto.frequency directement) plutôt que le seul booléen isRecurring,
        // pour pouvoir distinguer ANNUAL de MONTHLY.
        frequency:       frequencyChoice,
        isRecurring:     frequencyChoice === 'MONTHLY',
        isTaxable:       selectedTemplate.isTaxable,
        isCnss:          selectedTemplate.isCnss,
        fiscalType:      selectedTemplate.fiscalType,
        description:     selectedTemplate.description || null,
        quantityMode:    selectedTemplate.quantityMode || null,
        unitAmount:      selectedTemplate.unitAmount   || null,
        defaultQuantity: selectedTemplate.defaultQuantity || null,
        isProratized:    selectedTemplate.isProratized || false,
      };
      if (!hasQuantityMode) {
        if (customAmount) basePayload.amount = parseFloat(customAmount);
        else if (selectedTemplate.defaultAmount != null) basePayload.amount = selectedTemplate.defaultAmount;
        else if (selectedTemplate.defaultPercentage != null) {
          basePayload.percentage      = selectedTemplate.defaultPercentage;
          basePayload.baseCalculation = selectedTemplate.baseCalculation;
        }
      }

      // 🆕 MONTHLY = 1 seule création, pas de mois cible.
      // ANNUAL = 1 seule création, avec le mois de versement choisi (se
      // redéclenche seule chaque année sur ce mois, cf. moteur de paie).
      // ONE_TIME = 1 création par mois choisi cette année (hsup en jan+mars
      // par ex.).
      const monthsToCreate =
        frequencyChoice === 'MONTHLY' ? [null] :
        frequencyChoice === 'ANNUAL'  ? [targetMonths[0]] :
        targetMonths;
      const createdBonuses: Bonus[] = [];
      for (const m of monthsToCreate) {
        const payload = { ...basePayload };
        if (m != null) { payload.targetMonth = m; payload.targetYear = targetYear; }
        const created = await api.post<Bonus>('/employee-bonuses', payload);
        createdBonuses.push(created as Bonus);
      }

      setBonuses(prev => [...createdBonuses, ...prev]);
      const monthsLabel =
        frequencyChoice === 'ANNUAL'
          ? ` (chaque année en ${getMonthLabel(targetMonths[0])})`
          : frequencyChoice === 'ONE_TIME'
            ? ` (${targetMonths.map(m => getMonthLabel(m)).join(', ')} ${targetYear})`
            : '';
      alert.success('Prime attribuée', `"${selectedTemplate.name}" ajoutée avec succès${monthsLabel}.`);
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
      <Loader2 className="animate-spin text-amber-500" size={40} />
    </div>
  );

  // ── Rendu ─────────────────────────────────────────────────────────────────
  const BonusCard = ({ bonus }: { bonus: Bonus }) => (
    <motion.div key={bonus.id}
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -20 }}
      className="glass-panel rounded-xl p-4 flex items-center gap-4">
      <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/30 rounded-xl flex items-center justify-center shrink-0">
        <Gift size={18} className="text-amber-500" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <p className="font-bold text-[var(--text)] text-sm">{bonus.bonusType}</p>
          <FiscalBadge b={bonus} />
          <QuantityBadge mode={bonus.quantityMode} />
          {bonus.isProratized && (
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-700">Prorata</span>
          )}
          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${
            bonus.frequency === 'MONTHLY'
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800'
              : bonus.frequency === 'ANNUAL'
                ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800'
                : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800'
          }`}>
            {bonus.frequency === 'MONTHLY'
              ? 'Mensuelle'
              : bonus.frequency === 'ANNUAL'
                ? `Annuelle · ${getMonthLabel(bonus.targetMonth)}`
                : `Ponctuelle · ${getMonthLabel(bonus.targetMonth)} ${bonus.targetYear ?? ''}`}
          </span>
        </div>
        {bonus.description && <p className="text-xs text-[var(--text-muted)]">{bonus.description}</p>}
      </div>
      <BonusAmount bonus={bonus} />
      <button onClick={() => handleDelete(bonus.id, bonus.bonusType)} disabled={deletingId === bonus.id}
        className="p-2 text-[var(--text-muted)] hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all ml-1">
        {deletingId === bonus.id ? <Loader2 className="animate-spin" size={16} /> : <Trash2 size={16} />}
      </button>
    </motion.div>
  );

  const SectionHeader = ({ icon: Icon, label, count, color }: { icon: any; label: string; count: number; color: string }) => (
    <div className="flex items-center gap-3 mb-3">
      <div className={`w-7 h-7 ${color} rounded-lg flex items-center justify-center`}>
        <Icon size={14} className="text-white" />
      </div>
      <h3 className="text-sm font-bold text-[var(--text)]">{label}</h3>
      <span className="text-xs text-[var(--text-muted)] bg-[var(--surface-2)] px-2 py-0.5 rounded-full font-bold">{count}</span>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto pb-20 space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <button onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-sm text-[var(--text-muted)] hover:text-amber-500 transition-colors">
          <ArrowLeft size={16} /> Retour au profil
        </button>
        <button onClick={openModal}
          className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl shadow-lg shadow-amber-500/20 flex items-center gap-2 transition-all">
          <Plus size={18} /> Attribuer une prime
        </button>
      </div>

      {/* Titre */}
      <div>
        <h1 className="text-3xl font-bold text-[var(--text)] flex items-center gap-3">
          <Gift size={28} className="text-amber-500" />
          Primes de {employee?.firstName} {employee?.lastName}
        </h1>
      </div>

      {/* Carte employé */}
      {employee && (
        <div className="glass-panel rounded-2xl p-5 flex items-center gap-4 border border-amber-200 dark:border-amber-800 bg-amber-50/30 dark:bg-amber-900/10">
          <div className="w-14 h-14 rounded-full bg-emerald-500 flex items-center justify-center text-white font-bold text-lg shrink-0">
            {employee.firstName[0]}{employee.lastName[0]}
          </div>
          <div className="flex-1">
            <p className="font-bold text-[var(--text)] text-lg">{employee.firstName} {employee.lastName}</p>
            <p className="text-xs text-[var(--text-muted)] flex items-center gap-2 mt-0.5">
              <Building2 size={12} />
              {employee.department?.name || employee.departmentName || '—'}
              {employee.position && <><span className="opacity-40">•</span>{employee.position}</>}
            </p>
          </div>
          <CheckCircle2 size={22} className="text-amber-500 shrink-0" />
        </div>
      )}

      {/* 🆕 Récap salaire — brut/net estimé avec les primes actuelles */}
      {employee && (
        <SalaryRecap employeeId={params.id as string} employee={employee} bonuses={bonuses} />
      )}

      {/* 🆕 Ancienneté — override personnel (prioritaire sur la config entreprise) */}
      {employee && (
        <section className="glass-panel rounded-2xl p-6 border border-amber-200 dark:border-amber-800 bg-amber-50/40 dark:bg-amber-900/10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center">
              <TrendingUp size={16} className="text-white" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[var(--text)]">Prime d'ancienneté — configuration</h2>
              <p className="text-xs text-[var(--text-muted)]">Calculée et affichée automatiquement sur le bulletin. Par défaut, suit la config générale de l'entreprise.</p>
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
                    ? 'border-amber-500 bg-amber-100 dark:bg-amber-900/30'
                    : 'border-[var(--border)] hover:border-amber-300'
                }`}>
                <p className="text-xs font-bold text-[var(--text)]">{opt.label}</p>
                <p className="text-[10px] text-[var(--text-muted)]">{opt.desc}</p>
              </button>
            ))}
          </div>

          {seniorityOvMode === 'INHERIT' && (
            <p className="text-xs text-[var(--text-muted)] italic">
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
                  <p className="text-[10px] text-[var(--text-muted)] mb-1">Dès l'année</p>
                  <input type="number" min={0} value={seniorityStartYear}
                    onChange={e => setSeniorityStartYear(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-2 py-2 bg-[var(--surface-2)] border border-amber-200 dark:border-amber-800 rounded-xl text-xs font-mono text-right focus:outline-none focus:ring-2 focus:ring-amber-400/30 text-[var(--text)]" />
                </div>
                <div>
                  <p className="text-[10px] text-[var(--text-muted)] mb-1">Taux de départ %</p>
                  <input type="number" step="0.1" value={seniorityStartRate}
                    onChange={e => setSeniorityStartRate(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-2 py-2 bg-[var(--surface-2)] border border-amber-200 dark:border-amber-800 rounded-xl text-xs font-mono text-right focus:outline-none focus:ring-2 focus:ring-amber-400/30 text-[var(--text)]" />
                </div>
                <div>
                  <p className="text-[10px] text-[var(--text-muted)] mb-1">+ % / an suppl.</p>
                  <input type="number" step="0.1" value={seniorityRatePerYr}
                    onChange={e => setSeniorityRatePerYr(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-2 py-2 bg-[var(--surface-2)] border border-amber-200 dark:border-amber-800 rounded-xl text-xs font-mono text-right focus:outline-none focus:ring-2 focus:ring-amber-400/30 text-[var(--text)]" />
                </div>
                <div>
                  <p className="text-[10px] text-[var(--text-muted)] mb-1">Plafond % (optionnel)</p>
                  <input type="number" step="0.1" value={seniorityCapPercent} placeholder="aucun"
                    onChange={e => setSeniorityCapPercent(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-2 py-2 bg-[var(--surface-2)] border border-amber-200 dark:border-amber-800 rounded-xl text-xs font-mono text-right focus:outline-none focus:ring-2 focus:ring-amber-400/30 text-[var(--text)]" />
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
                  <p className="text-[11px] text-amber-600 dark:text-amber-300 bg-amber-100/50 dark:bg-amber-900/20 rounded-lg px-3 py-2">
                    Aperçu aujourd'hui : <strong>{years} ans</strong> d'ancienneté → taux <strong>{rate}%</strong> →
                    {' '}<strong>{amount.toLocaleString('fr-FR')} FCFA/mois</strong>
                  </p>
                );
              })()}
            </>
          )}

          <button onClick={saveSeniorityOverride} disabled={savingSeniority}
            className="mt-4 w-full py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
            {savingSeniority ? <><Loader2 size={12} className="animate-spin"/>Sauvegarde…</> :
             senioritySaved  ? <><CheckCircle2 size={12}/>Sauvegardé ✓</> :
                               'Enregistrer'}
          </button>
        </section>
      )}

      {/* Stats rapides */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total primes', val: manualBonuses.length, icon: Gift, color: 'text-amber-500', bg: 'bg-amber-100 dark:bg-amber-900/30' },
          { label: 'Automatiques', val: autoBonuses.length, icon: Zap, color: 'text-amber-500', bg: 'bg-amber-100 dark:bg-amber-900/30' },
          { label: 'À saisir/mois', val: freeBonuses.length, icon: Hash, color: 'text-amber-500', bg: 'bg-amber-100 dark:bg-amber-900/30' },
        ].map(s => (
          <div key={s.label} className="glass-panel rounded-2xl p-5 flex items-center gap-4">
            <div className={`w-12 h-12 ${s.bg} rounded-xl flex items-center justify-center`}>
              <s.icon size={22} className={s.color} />
            </div>
            <div>
              <p className="text-xs text-[var(--text-muted)] uppercase font-bold">{s.label}</p>
              <p className="text-2xl font-bold text-[var(--text)]">{s.val}</p>
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
                <h2 className="text-sm font-bold text-[var(--text)]">Quantités à saisir</h2>
                <p className="text-xs text-[var(--text-muted)]">Primes à quantité variable — saisir avant de générer le bulletin</p>
              </div>
            </div>
            {/* Sélecteur mois/année */}
            <div className="flex items-center gap-2">
              <select value={qtyMonth} onChange={e => setQtyMonth(Number(e.target.value))}
                className="text-xs p-1.5 bg-[var(--surface)] border border-amber-200 dark:border-amber-700 rounded-lg outline-none text-[var(--text)] font-medium">
                {MONTHS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
              <select value={qtyYear} onChange={e => setQtyYear(Number(e.target.value))}
                className="text-xs p-1.5 bg-[var(--surface)] border border-amber-200 dark:border-amber-700 rounded-lg outline-none text-[var(--text)] font-medium">
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
                <div key={bonus.id} className="bg-[var(--surface)] rounded-xl p-4 border border-amber-100 dark:border-amber-900">
                  <div className="flex items-center gap-3 mb-3">
                    <div>
                      <p className="font-bold text-sm text-[var(--text)]">{bonus.bonusType}</p>
                      <p className="text-xs text-[var(--text-muted)]">{Number(bonus.unitAmount ?? 0).toLocaleString('fr-FR')} FCFA × quantité</p>
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
                        className="w-24 p-2 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-700 rounded-lg outline-none font-bold font-mono text-lg text-center text-[var(--text)]" />
                      <span className="text-[var(--text-muted)] text-sm">×</span>
                      <span className="font-mono text-sm text-[var(--text-muted)]">
                        {Number(bonus.unitAmount ?? 0).toLocaleString('fr-FR')} FCFA
                      </span>
                      <span className="text-[var(--text-muted)]">=</span>
                      <span className="font-bold font-mono text-amber-600 dark:text-amber-400">
                        {computed.toLocaleString('fr-FR')} FCFA
                      </span>
                    </div>
                    <input type="text"
                      value={qtyNotes[bonus.id] ?? ''}
                      onChange={e => setQtyNotes(p => ({ ...p, [bonus.id]: e.target.value }))}
                      placeholder="Note (optionnel)"
                      className="flex-1 p-2 bg-[var(--surface-2)] border border-[var(--border)] rounded-lg outline-none text-xs text-[var(--text-muted)]" />
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
          <div className="w-16 h-16 bg-[var(--surface-2)] rounded-full flex items-center justify-center mx-auto mb-4">
            <Gift size={28} className="text-[var(--text-muted)]" />
          </div>
          <p className="text-[var(--text-muted)] font-medium mb-2">Aucune prime attribuée</p>
          <button onClick={openModal}
            className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl text-sm flex items-center gap-2 mx-auto mt-4 transition-colors">
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
              <SectionHeader icon={TrendingUp} label="Primes imposables — ITS seul" count={groupTaxableNoCnss.length} color="bg-amber-500" />
              <div className="space-y-2">
                <AnimatePresence>{groupTaxableNoCnss.map(b => <BonusCard key={b.id} bonus={b} />)}</AnimatePresence>
              </div>
            </section>
          )}

          {/* Primes imposables ITS + CNSS */}
          {groupTaxableCnss.length > 0 && (
            <section>
              <SectionHeader icon={Hand} label="Primes imposables — ITS + CNSS" count={groupTaxableCnss.length} color="bg-amber-500" />
              <div className="space-y-2">
                <AnimatePresence>{groupTaxableCnss.map(b => <BonusCard key={b.id} bonus={b} />)}</AnimatePresence>
              </div>
            </section>
          )}

          {/* Lien catalogue */}
          <button onClick={() => router.push(bp(`/parametres/primes?back=${encodeURIComponent(backUrl)}`))}
            className="w-full flex items-center justify-between p-4 rounded-xl border border-dashed border-amber-300 dark:border-amber-700 bg-amber-50/50 dark:bg-amber-900/10 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-all group">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-amber-100 dark:bg-amber-900/30 rounded-xl flex items-center justify-center">
                <Settings2 size={16} className="text-amber-500" />
              </div>
              <div className="text-left">
                <p className="text-sm font-bold text-amber-700 dark:text-amber-300">Gérer le catalogue</p>
                <p className="text-xs text-amber-500 dark:text-amber-400">Ajouter, modifier ou supprimer des types de primes</p>
              </div>
            </div>
            <ChevronRight size={16} className="text-amber-400 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      )}

      {/* Primes automatiques */}
      {autoBonuses.length > 0 && (
        <section>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 bg-amber-100 dark:bg-amber-900/30 rounded-lg flex items-center justify-center">
              <Zap size={16} className="text-amber-500" />
            </div>
            <h2 className="text-lg font-bold text-[var(--text)]">Primes automatiques</h2>
            <span className="text-xs text-amber-600 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-400 px-2 py-0.5 rounded-full font-bold border border-amber-200 dark:border-amber-800">
              Convention Collective
            </span>
          </div>
          <div className="space-y-2">
            {autoBonuses.map(bonus => (
              <div key={bonus.id} className="glass-panel rounded-xl p-4 flex items-center gap-4 border-l-4 border-l-amber-500">
                <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/30 rounded-xl flex items-center justify-center shrink-0">
                  <Zap size={18} className="text-amber-500" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-bold text-sm text-[var(--text)]">{bonus.bonusType}</p>
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border border-amber-200 dark:border-amber-800 flex items-center gap-1">
                      <Zap size={9} /> Auto
                    </span>
                    <FiscalBadge b={bonus} />
                  </div>
                  {bonus.description && <p className="text-xs text-[var(--text-muted)] mt-0.5">{bonus.description}</p>}
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
              className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-8 max-w-md w-full shadow-xl relative overflow-y-auto max-h-[90vh]">

              <button onClick={() => setShowModal(false)} className="absolute top-4 right-4 p-2 text-[var(--text-muted)] hover:text-[var(--text)] transition-colors">
                <X size={20} />
              </button>

              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 text-amber-500 rounded-full flex items-center justify-center">
                  <Gift size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-[var(--text)]">Attribuer une prime</h2>
                  <p className="text-xs text-[var(--text-muted)] mt-0.5">{employee?.firstName} {employee?.lastName}</p>
                </div>
              </div>

              <div className="space-y-5">
                {/* Catalogue */}
                <div>
                  <label className="block text-sm font-bold text-[var(--text-muted)] mb-2">Choisir dans le catalogue</label>
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
                      className="w-full p-3 bg-[var(--surface-2)] border border-[var(--border)] rounded-xl outline-none text-[var(--text)] font-medium">
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
                    <div className="mt-2 p-3 bg-[var(--surface-2)]/50 rounded-xl border border-[var(--border)]">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <FiscalBadge b={{ ...selectedTemplate, source: 'MANUAL', isRecurring: selectedTemplate.isRecurring, bonusType: selectedTemplate.name }} />
                        <QuantityBadge mode={selectedTemplate.quantityMode} />
                        {selectedTemplate.isProratized && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-700">Prorata</span>
                        )}
                      </div>
                      {selectedTemplate.description && (
                        <p className="text-xs text-[var(--text-muted)]">{selectedTemplate.description}</p>
                      )}
                      {selectedTemplate.quantityMode === 'FREE' && (
                        <p className="text-xs text-amber-600 dark:text-amber-400 mt-1 flex items-center gap-1">
                          <AlertCircle size={11} /> La quantité sera saisie depuis la section "Quantités à saisir"
                        </p>
                      )}
                      {selectedTemplate.quantityMode && selectedTemplate.quantityMode !== 'FREE' && (
                        <p className="text-xs text-amber-600 dark:text-amber-400 mt-1 flex items-center gap-1">
                          <Zap size={11} /> Calcul automatique depuis le pointage
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Montant custom si nécessaire */}
                {selectedTemplate && !selectedTemplate.quantityMode && selectedTemplate.defaultAmount == null && selectedTemplate.defaultPercentage == null && (
                  <div>
                    <label className="block text-sm font-bold text-[var(--text-muted)] mb-2">Montant (FCFA)</label>
                    <input type="number" min="0" value={customAmount} onChange={e => setCustomAmount(e.target.value)}
                      placeholder="Ex: 25 000"
                      className="w-full p-4 bg-[var(--surface-2)] border border-[var(--border)] rounded-xl outline-none font-bold font-mono text-xl text-[var(--text)]" />
                  </div>
                )}

                {/* Ajustement optionnel si montant par défaut */}
                {selectedTemplate && !selectedTemplate.quantityMode && selectedTemplate.defaultAmount != null && (
                  <div>
                    <label className="block text-sm font-bold text-[var(--text-muted)] mb-2">
                      Ajuster le montant <span className="text-xs font-normal text-[var(--text-muted)]">(optionnel — défaut: {Number(selectedTemplate.defaultAmount).toLocaleString('fr-FR')} F)</span>
                    </label>
                    <input type="number" min="0" value={customAmount} onChange={e => setCustomAmount(e.target.value)}
                      placeholder={String(selectedTemplate.defaultAmount)}
                      className="w-full p-3 bg-[var(--surface-2)] border border-[var(--border)] rounded-xl outline-none font-bold font-mono text-lg text-[var(--text)]" />
                  </div>
                )}

                {/* Fréquence */}
                {selectedTemplate && (
                  <div>
                    <label className="block text-sm font-bold text-[var(--text-muted)] mb-2">Fréquence</label>
                    <div className="grid grid-cols-3 gap-3">
                      {([
                        { val: 'MONTHLY',  label: 'Mensuelle',  sub: 'Chaque mois', color: 'emerald' },
                        { val: 'ANNUAL',   label: 'Annuelle',   sub: '1×/an, se répète seule', color: 'cyan' },
                        { val: 'ONE_TIME', label: 'Mois choisis', sub: 'Cette année seulement', color: 'amber' },
                      ] as const).map(btn => (
                        <button key={btn.val} type="button" onClick={() => setFrequencyChoice(btn.val)}
                          className={`p-3 rounded-xl border-2 text-left transition-all ${
                            frequencyChoice === btn.val
                              ? btn.color === 'emerald'
                                ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300'
                                : btn.color === 'cyan'
                                  ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300'
                                  : 'border-amber-500 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300'
                              : 'border-[var(--border)] text-[var(--text-muted)]'
                          }`}>
                          <div className="font-bold text-sm">{btn.label}</div>
                          <div className="text-xs opacity-75 mt-0.5">{btn.sub}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Mois cible unique (ANNUAL — ex: 13e mois versé chaque décembre) */}
                <AnimatePresence>
                  {selectedTemplate && frequencyChoice === 'ANNUAL' && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }} style={{ overflow: 'hidden' }}>
                      <label className="block text-sm font-bold text-amber-700 dark:text-amber-300 mb-2 flex items-center gap-1">
                        <Calendar size={14} /> Mois de versement chaque année
                      </label>
                      <div className="p-3 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-xl">
                        <select value={targetMonths[0] ?? now.getMonth() + 1}
                          onChange={e => setTargetMonths([Number(e.target.value)])}
                          className="w-full p-2.5 bg-[var(--surface)] border border-amber-200 dark:border-amber-700 rounded-lg outline-none text-[var(--text)] font-medium text-sm">
                          {MONTHS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                        </select>
                        <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">
                          Se déclenchera automatiquement chaque année en {getMonthLabel(targetMonths[0] ?? now.getMonth() + 1)} — pas besoin de la recréer l'an prochain.
                        </p>
                      </div>

                      {/* Aperçu chiffré 13e mois — si % + prorata activé */}
                      {selectedTemplate.defaultPercentage != null && employee?.baseSalary != null && (
                        <div className="mt-3 p-3 bg-[var(--surface-2)] border border-[var(--border)] rounded-xl">
                          <p className="text-xs font-bold text-[var(--text-muted)] mb-1">Aperçu</p>
                          <p className="text-xs text-[var(--text-muted)]">
                            Sur un salaire de base de {Number(employee.baseSalary).toLocaleString('fr-FR')} FCFA :
                            {' '}année complète → <strong>{Math.round((selectedTemplate.defaultPercentage / 100) * Number(employee.baseSalary)).toLocaleString('fr-FR')} FCFA</strong>.
                            {selectedTemplate.isProratized && (
                              <> Embauché en cours d'année → réduit au prorata des mois travaillés (mois entamé = mois plein).</>
                            )}
                          </p>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Mois cibles (multi-sélection — ONE_TIME) */}
                <AnimatePresence>
                  {selectedTemplate && frequencyChoice === 'ONE_TIME' && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }} style={{ overflow: 'hidden' }}>
                      <label className="block text-sm font-bold text-amber-700 dark:text-amber-300 mb-2 flex items-center gap-1">
                        <Calendar size={14} /> Mois cibles
                        <span className="font-normal text-amber-500 text-xs ml-1">
                          (ex: hsup forfaitaire versée seulement en janvier et mars)
                        </span>
                      </label>
                      <div className="p-3 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-xl space-y-3">
                        <select value={targetYear} onChange={e => setTargetYear(Number(e.target.value))}
                          className="w-full p-2.5 bg-[var(--surface)] border border-amber-200 dark:border-amber-700 rounded-lg outline-none text-[var(--text)] font-medium text-sm">
                          {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                        <div className="grid grid-cols-3 gap-2">
                          {MONTHS.map(m => {
                            const selected = targetMonths.includes(m.value);
                            return (
                              <button key={m.value} type="button" onClick={() => toggleTargetMonth(m.value)}
                                className={`p-2 rounded-lg border text-xs font-bold transition-all ${
                                  selected
                                    ? 'border-amber-500 bg-amber-500 text-white'
                                    : 'border-amber-200 dark:border-amber-700 bg-[var(--surface)] text-[var(--text-muted)]'
                                }`}>
                                {m.label}
                              </button>
                            );
                          })}
                        </div>
                        {targetMonths.length === 0 && (
                          <p className="text-xs text-red-500 flex items-center gap-1">
                            <AlertCircle size={11} /> Choisissez au moins un mois
                          </p>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Récap salaire estimé */}
                {selectedTemplate && (
                  <SalaryRecap
                    employeeId={params.id as string}
                    employee={employee}
                    bonuses={bonuses}
                    previewBonus={{
                      bonusType: selectedTemplate.name,
                      amount: customAmount
                        ? parseFloat(customAmount)
                        : selectedTemplate.defaultAmount ?? undefined,
                      percentage: selectedTemplate.defaultPercentage ?? undefined,
                      isTaxable: selectedTemplate.isTaxable,
                      isCnss: selectedTemplate.isCnss,
                    }}
                  />
                )}


                {/* Actions */}
                <div className="flex gap-3 pt-2">
                  <button onClick={() => setShowModal(false)}
                    className="flex-1 py-4 bg-[var(--surface-2)] text-[var(--text-muted)] font-bold rounded-xl hover:bg-[var(--border)] transition-colors">
                    Annuler
                  </button>
                  <button onClick={handleAdd} disabled={isSaving || !selectedTemplate}
                    className="flex-1 py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl shadow-lg transition-all flex justify-center items-center gap-2 disabled:opacity-50">
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