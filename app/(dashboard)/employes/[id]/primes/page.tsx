'use client';
import { ModulePageFrame, ModulePageSkeleton } from '@/components/requests/ModulePageFrame';
import { Button } from '@/components/design-system/primitives';
import '@/components/employees/employees.css';
import '@/components/employees/employee-finishing.css';
import { EmployeeOnboardingStart as EmployeePageStart } from '@/components/employees/create/EmployeeJourney';
import { FancySelect } from '@/components/ui/FancySelect';
import { ProfileAvatar } from '@/components/ui/ProfileAvatar';


/**
 * 📁 app/(dashboard)/employes/[id]/primes/page.tsx
 * ✅ Affiche les 3 catégories fiscales (NON_TAXABLE / TAXABLE_NO_CNSS / TAXABLE_CNSS)
 * ✅ Badge quantityMode (FREE uniquement)
 * ✅ Section "Quantités à saisir" pour les primes FREE avant bulletin
 * ✅ Saisie quantité mensuelle inline
 */

import { Modal } from '@/components/design-system/feedback';
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
import { KonzaLoader } from '@/components/ui/KonzaLoader';

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
    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-[var(--surface-2)] text-[var(--text-secondary)] border border-[var(--border)]">
      Indemnité
    </span>
  );
  if (ft === 'TAXABLE_NO_CNSS') return (
    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-[var(--surface-2)]  text-[var(--text-secondary)]  border border-[var(--border)] ">
      ITS seul.
    </span>
  );
  return (
    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-[var(--surface-2)]  text-[var(--text-secondary)]  border border-[var(--border)] ">
      ITS + CNSS
    </span>
  );
};

const QuantityBadge = ({ mode }: { mode?: string | null }) => {
  if (mode !== 'FREE') return null;
  return (
    <span className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full border bg-[var(--surface-2)] text-[var(--text-secondary)] border-[var(--border)]   ">
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
          <span className="text-xs text-[var(--text-secondary)] ml-0.5">FCFA/unité</span>
        </p>
        {bonus.defaultQuantity != null && (
          <p className="text-[10px] text-[var(--text-secondary)]">défaut: ×{bonus.defaultQuantity}</p>
        )}
      </div>
    );
  }
  if (bonus.amount != null) return (
    <p className="font-bold text-lg text-[var(--text)] font-mono">
      +{Number(bonus.amount).toLocaleString()} <span className="text-xs text-[var(--text-secondary)]">FCFA</span>
    </p>
  );
  if (bonus.percentage != null) return (
    <p className="font-bold text-lg text-[var(--text-secondary)] ">
      +{bonus.percentage}% <span className="text-xs text-[var(--text-secondary)]">
        {bonus.baseCalculation === 'GROSS_SALARY' ? 'du brut' : 'du base'}
      </span>
    </p>
  );
  return <p className="text-xs text-[var(--text-secondary)] italic">Montant libre</p>;
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

  const [uiLoadError, setUiLoadError] = useState('');
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
      } catch (e) { console.error(e); setUiLoadError(e instanceof Error ? e.message : 'Impossible de charger les primes de cet employé.'); } finally { setIsLoading(false); }
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
    <ModulePageSkeleton label="Chargement des employés" />
  );

  // ── Rendu ─────────────────────────────────────────────────────────────────
  const BonusCard = ({ bonus }: { bonus: Bonus }) => (
    <motion.div key={bonus.id}
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -20 }}
      className="employee-bonus-row">
      <div className="shrink-0 flex items-center justify-center">
        <Gift size={16} className="text-[var(--text-secondary)]" strokeWidth={1.5} aria-hidden="true" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <p className="font-bold text-[var(--text)] text-sm">{bonus.bonusType}</p>
          <FiscalBadge b={bonus} />
          <QuantityBadge mode={bonus.quantityMode} />
          {bonus.isProratized && (
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-[var(--surface-2)]  text-[var(--text-secondary)]  border border-[var(--border)] ">Prorata</span>
          )}
          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${
            bonus.frequency === 'MONTHLY'
              ? 'bg-[var(--surface-2)] text-[var(--text-secondary)] border-[var(--border)]   '
              : bonus.frequency === 'ANNUAL'
                ? 'bg-[var(--surface-2)] text-[var(--text-secondary)] border-[var(--border)]   '
                : 'bg-[var(--surface-2)] text-[var(--text-secondary)] border-[var(--border)]   '
          }`}>
            {bonus.frequency === 'MONTHLY'
              ? 'Mensuelle'
              : bonus.frequency === 'ANNUAL'
                ? `Annuelle · ${getMonthLabel(bonus.targetMonth)}`
                : `Ponctuelle · ${getMonthLabel(bonus.targetMonth)} ${bonus.targetYear ?? ''}`}
          </span>
        </div>
        {bonus.description && <p className="text-xs text-[var(--text-secondary)]">{bonus.description}</p>}
      </div>
      <BonusAmount bonus={bonus} />
      <Button variant="ghost" aria-label={`Retirer la prime ${bonus.bonusType}`} onClick={() => handleDelete(bonus.id, bonus.bonusType)} disabled={deletingId === bonus.id}
        className="p-2 text-[var(--text-secondary)] hover:text-[var(--danger-text)] hover:bg-[var(--employee-danger-soft)]  rounded-lg transition-all ml-1">
        {deletingId === bonus.id ? <Loader2 className="animate-spin" size={16} /> : <Trash2 size={16} />}
      </Button>
    </motion.div>
  );

  const SectionHeader = ({ icon: Icon, label, count, color }: { icon: any; label: string; count: number; color: string }) => (
    <div className="flex items-center gap-3 mb-3">
      <div className="shrink-0 flex items-center justify-center">
        <Icon size={16} className="text-[var(--text-secondary)]" strokeWidth={1.5} aria-hidden="true" />
      </div>
      <h3 className="text-sm font-bold text-[var(--text)]">{label}</h3>
      <span className="text-xs text-[var(--text-secondary)] bg-[var(--surface-2)] px-2 py-0.5 rounded-full font-bold">{count}</span>
    </div>
  );

  return (
    <ModulePageFrame kind="detail" error={uiLoadError}><div className="employee-module-page employee-bonus-page"><EmployeePageStart/><div className="employee-bonus-shell">

      <header className="employee-editor-heading"><div><Button variant="ghost" onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-secondary)] transition-colors">
          <ArrowLeft size={16} /> Retour au profil
        </Button><h1>Primes et indemnités</h1><p>Attribuez les primes, renseignez les quantités et vérifiez la rémunération.</p></div><Button variant="primary" onClick={openModal}
          className="px-5 py-2.5 bg-[var(--action)] hover:bg-[var(--action)] text-[var(--on-brand)] font-bold rounded-xl shadow-lg  flex items-center gap-2 transition-all">
          <Plus size={18} /> Attribuer une prime
        </Button></header>
      {employee && <div className="employee-bonus-person"><ProfileAvatar name={`${employee.firstName || ''} ${employee.lastName || ''}`} src={employee.photoUrl}/><div><strong>{employee.firstName} {employee.lastName}</strong><span>{employee.position || '—'} · {employee.department?.name || employee.departmentName || '—'}</span></div></div>}
      {/* Stats rapides */}
      <div className="employee-bonus-stats">
        {[
          { label: 'Primes attribuées', val: manualBonuses.length, icon: Gift, color: 'text-[var(--text-secondary)]', bg: 'bg-[var(--surface-2)] ' },
          { label: 'Automatiques', val: autoBonuses.length, icon: Zap, color: 'text-[var(--text-secondary)]', bg: 'bg-[var(--surface-2)] ' },
          { label: 'À quantité variable', val: freeBonuses.length, icon: Hash, color: 'text-[var(--text-secondary)]', bg: 'bg-[var(--surface-2)] ' },
        ].map(s => (
          <div key={s.label} className="employee-bonus-surface rounded-2xl p-5 flex items-center gap-4">
            <div className="shrink-0 flex items-center justify-center">
              <s.icon size={20} className={s.color} strokeWidth={1.5} aria-hidden="true" />
            </div>
            <div>
              <p className="text-xs text-[var(--text-secondary)] uppercase font-bold">{s.label}</p>
              <p className="text-2xl font-bold text-[var(--text)]">{s.val}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Primes groupées par catégorie fiscale */}
      {manualBonuses.length === 0 ? (
        <div className="employee-bonus-surface employee-bonus-empty rounded-2xl p-10 text-center">
          <div className="shrink-0 flex items-center justify-center">
            <Gift size={20} className="text-[var(--text-secondary)]" strokeWidth={1.5} aria-hidden="true" />
          </div>
          <p className="text-[var(--text-secondary)] font-medium mb-2">Aucune prime attribuée</p>
          <p className="text-sm text-[var(--text-secondary)]">Choisissez une prime du catalogue. Elle apparaîtra ici avec sa fréquence et sa nature fiscale.</p>
          <Button variant="secondary" onClick={openModal}
            className="px-5 py-2.5 bg-[var(--action)] hover:bg-[var(--action)] text-[var(--on-brand)] font-bold rounded-xl text-sm flex items-center gap-2 mx-auto mt-4 transition-colors">
            <Plus size={16} /> Attribuer une prime
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Indemnités nettes */}
          {groupNonTaxable.length > 0 && (
            <section>
              <SectionHeader icon={DollarSign} label="Indemnités — Net direct" count={groupNonTaxable.length} color="bg-[var(--action)]" />
              <div className="space-y-2">
                <AnimatePresence>{groupNonTaxable.map(b => <BonusCard key={b.id} bonus={b} />)}</AnimatePresence>
              </div>
            </section>
          )}

          {/* Primes imposables ITS uniquement */}
          {groupTaxableNoCnss.length > 0 && (
            <section>
              <SectionHeader icon={TrendingUp} label="Primes imposables — ITS seul" count={groupTaxableNoCnss.length} color="bg-[var(--action)]" />
              <div className="space-y-2">
                <AnimatePresence>{groupTaxableNoCnss.map(b => <BonusCard key={b.id} bonus={b} />)}</AnimatePresence>
              </div>
            </section>
          )}

          {/* Primes imposables ITS + CNSS */}
          {groupTaxableCnss.length > 0 && (
            <section>
              <SectionHeader icon={Hand} label="Primes imposables — ITS + CNSS" count={groupTaxableCnss.length} color="bg-[var(--action)]" />
              <div className="space-y-2">
                <AnimatePresence>{groupTaxableCnss.map(b => <BonusCard key={b.id} bonus={b} />)}</AnimatePresence>
              </div>
            </section>
          )}

          {/* Lien catalogue */}
          <Button variant="ghost" onClick={() => router.push(bp(`/parametres/primes?back=${encodeURIComponent(backUrl)}`))}
            className="w-full flex items-center justify-between p-4 rounded-xl border border-dashed border-[var(--border)]  bg-[var(--surface-2)]  hover:bg-[var(--surface-2)]  transition-all group">
            <div className="flex items-center gap-3">
              <div className="shrink-0 flex items-center justify-center">
                <Settings2 size={16} className="text-[var(--text-secondary)]" strokeWidth={1.5} aria-hidden="true" />
              </div>
              <div className="text-left">
                <p className="text-sm font-bold text-[var(--text-secondary)] ">Gérer le catalogue</p>
                <p className="text-xs text-[var(--text-secondary)] ">Ajouter, modifier ou supprimer des types de primes</p>
              </div>
            </div>
            <ChevronRight size={16} className="text-[var(--text-secondary)] group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>
      )}

      {/* 🆕 Section saisie quantités FREE */}
      {freeBonuses.length > 0 && (
        <section className="employee-bonus-quantities">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="shrink-0 flex items-center justify-center">
                <Hash size={16} className="text-[var(--text-secondary)]" strokeWidth={1.5} aria-hidden="true" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-[var(--text)]">Quantités à saisir</h2>
                <p className="text-xs text-[var(--text-secondary)]">Primes à quantité variable — saisir avant de générer le bulletin</p>
              </div>
            </div>
            {/* Sélecteur mois/année */}
            <div className="flex items-center gap-2">
              <FancySelect label="Mois des quantités" value={String(qtyMonth)} onChange={value => setQtyMonth(Number(value))} options={MONTHS.map(m=>({value:String(m.value),label:m.label}))} />
              <FancySelect label="Année" value={String(qtyYear)} onChange={value => setQtyYear(Number(value))} options={YEARS.map(y=>({value:String(y),label:String(y)}))} />
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
                <div key={bonus.id} className="bg-[var(--surface)] rounded-xl p-4 border border-[var(--border)] ">
                  <div className="flex items-center gap-3 mb-3">
                    <div>
                      <p className="font-bold text-sm text-[var(--text)]">{bonus.bonusType}</p>
                      <p className="text-xs text-[var(--text-secondary)]">{Number(bonus.unitAmount ?? 0).toLocaleString('fr-FR')} FCFA × quantité</p>
                    </div>
                    {currentQty && (
                      <span className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full bg-[var(--surface-2)]  text-[var(--text-secondary)]  border border-[var(--border)] ">
                        <CheckCircle2 size={16} strokeWidth={1.5} aria-hidden="true" className="inline align-text-bottom mr-1" /> Saisi : ×{currentQty.quantity}
                      </span>
                    )}
                  </div>
                  <div className="employee-quantity-fields">
                    <div className="employee-quantity-computation">
                      <input type="number" min="0" step="1"
                        value={qtyVal} aria-label={`Quantité pour ${bonus.bonusType}`}
                        onChange={e => setQtyValues(p => ({ ...p, [bonus.id]: e.target.value }))}
                        placeholder="0"
                        className="w-24 p-2 bg-[var(--surface-2)]  border border-[var(--border)]  rounded-lg outline-none font-bold font-mono text-lg text-center text-[var(--text)]" />
                      <span className="text-[var(--text-secondary)] text-sm">×</span>
                      <span className="font-mono text-sm text-[var(--text-secondary)]">
                        {Number(bonus.unitAmount ?? 0).toLocaleString('fr-FR')} FCFA
                      </span>
                      <span className="text-[var(--text-secondary)]">=</span>
                      <span className="font-bold font-mono text-[var(--text-secondary)] ">
                        {computed.toLocaleString('fr-FR')} FCFA
                      </span>
                    </div>
                    <input type="text"
                      aria-label={`Note pour ${bonus.bonusType}`} value={qtyNotes[bonus.id] ?? ''}
                      onChange={e => setQtyNotes(p => ({ ...p, [bonus.id]: e.target.value }))}
                      placeholder="Note (optionnel)"
                      className="flex-1 p-2 bg-[var(--surface-2)] border border-[var(--border)] rounded-lg outline-none text-xs text-[var(--text-secondary)]" />
                    <Button variant="ghost" onClick={() => saveQuantity(bonus.id)} disabled={isSaving_}
                      className={`px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2 transition-all ${
                        isSaved_
                          ? 'bg-[var(--action)] text-[var(--on-brand)]'
                          : 'bg-[var(--action)] hover:bg-[var(--action)] text-[var(--on-brand)]'
                      }`}>
                      {isSaving_ ? <Loader2 className="animate-spin" size={14} /> :
                       isSaved_  ? <><Check size={14} /> Sauvé</> :
                       <><Save size={14} /> Sauver</>}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>

          <p className="text-xs text-[var(--text-secondary)]  mt-3 flex items-center gap-1">
            <AlertCircle size={11} />
            Ces quantités seront utilisées lors de la génération du bulletin. Modifiables même après génération (avant validation).
          </p>
        </section>
      )}

      {/* Primes automatiques */}
      {autoBonuses.length > 0 && (
        <section>
          <div className="flex items-center gap-3 mb-4">
            <div className="shrink-0 flex items-center justify-center">
              <Zap size={16} className="text-[var(--text-secondary)]" strokeWidth={1.5} aria-hidden="true" />
            </div>
            <h2 className="text-lg font-bold text-[var(--text)]">Primes automatiques</h2>
            <span className="text-xs text-[var(--text-secondary)] bg-[var(--surface-2)]   px-2 py-0.5 rounded-full font-bold border border-[var(--border)] ">
              Convention Collective
            </span>
          </div>
          <div className="space-y-2">
            {autoBonuses.map(bonus => (
              <div key={bonus.id} className="employee-bonus-row employee-bonus-automatic">
                <div className="shrink-0 flex items-center justify-center">
                  <Zap size={16} className="text-[var(--text-secondary)]" strokeWidth={1.5} aria-hidden="true" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-bold text-sm text-[var(--text)]">{bonus.bonusType}</p>
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-[var(--surface-2)] text-[var(--text-secondary)]   border border-[var(--border)]  flex items-center gap-1">
                      <Zap size={9} /> Auto
                    </span>
                    <FiscalBadge b={bonus} />
                  </div>
                  {bonus.description && <p className="text-xs text-[var(--text-secondary)] mt-0.5">{bonus.description}</p>}
                </div>
                <BonusAmount bonus={bonus} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 🆕 Récap salaire — brut/net estimé avec les primes actuelles */}
      {employee && (
        <section className="employee-bonus-estimate"><h2>Rémunération estimée</h2><SalaryRecap employeeId={params.id as string} employee={employee} bonuses={bonuses} /></section>
      )}

      {/* 🆕 Ancienneté — override personnel (prioritaire sur la config entreprise) */}
      {employee && (
        <section className="employee-bonus-seniority">
          <div className="flex items-center gap-3 mb-4">
            <div className="shrink-0 flex items-center justify-center">
              <TrendingUp size={16} className="text-[var(--text-secondary)]" strokeWidth={1.5} aria-hidden="true" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[var(--text)]">Prime d'ancienneté — configuration</h2>
              <p className="text-xs text-[var(--text-secondary)]">Calculée et affichée automatiquement sur le bulletin. Par défaut, suit la config générale de l'entreprise.</p>
            </div>
          </div>

          {/* Sélecteur de mode */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            {([
              { key: 'INHERIT',  label: 'Config. entreprise', desc: 'Par défaut' },
              { key: 'CUSTOM',   label: 'Personnalisée',      desc: 'Formule propre à cet employé' },
              { key: 'EXCLUDED', label: 'Exclu(e)',           desc: 'Pas de prime auto' },
            ] as const).map(opt => (
              <Button variant="ghost" key={opt.key} aria-pressed={seniorityOvMode === opt.key} onClick={() => setSeniorityOvMode(opt.key)}
                className={`text-left p-3 rounded-xl border-2 transition-all ${
                  seniorityOvMode === opt.key
                    ? 'border-[var(--border)] bg-[var(--surface-2)] '
                    : 'border-[var(--border)] hover:border-[var(--border)]'
                }`}>
                <p className="text-xs font-bold text-[var(--text)]">{opt.label}</p>
                <p className="text-[10px] text-[var(--text-secondary)]">{opt.desc}</p>
              </Button>
            ))}
          </div>

          {seniorityOvMode === 'INHERIT' && (
            <p className="text-xs text-[var(--text-secondary)] italic">
              Cet employé suit la formule d'ancienneté générale configurée dans les Paramètres entreprise.
            </p>
          )}

          {seniorityOvMode === 'EXCLUDED' && (
            <p className="text-xs text-[var(--text-secondary)]  italic">
              Cet employé ne recevra <strong>aucune</strong> prime d'ancienneté automatique, même si l'entreprise en a une configurée.
            </p>
          )}

          {seniorityOvMode === 'CUSTOM' && (
            <>
              <div className="grid grid-cols-4 gap-2 mb-3">
                <div>
                  <p className="text-[10px] text-[var(--text-secondary)] mb-1">Dès l'année</p>
                  <input type="number" min={0} value={seniorityStartYear}
                    onChange={e => setSeniorityStartYear(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-2 py-2 bg-[var(--surface-2)] border border-[var(--border)]  rounded-xl text-xs font-mono text-right focus:outline-none focus:ring-2 focus:ring-[var(--focus)] text-[var(--text)]" />
                </div>
                <div>
                  <p className="text-[10px] text-[var(--text-secondary)] mb-1">Taux de départ %</p>
                  <input type="number" step="0.1" value={seniorityStartRate}
                    onChange={e => setSeniorityStartRate(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-2 py-2 bg-[var(--surface-2)] border border-[var(--border)]  rounded-xl text-xs font-mono text-right focus:outline-none focus:ring-2 focus:ring-[var(--focus)] text-[var(--text)]" />
                </div>
                <div>
                  <p className="text-[10px] text-[var(--text-secondary)] mb-1">+ % / an suppl.</p>
                  <input type="number" step="0.1" value={seniorityRatePerYr}
                    onChange={e => setSeniorityRatePerYr(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-2 py-2 bg-[var(--surface-2)] border border-[var(--border)]  rounded-xl text-xs font-mono text-right focus:outline-none focus:ring-2 focus:ring-[var(--focus)] text-[var(--text)]" />
                </div>
                <div>
                  <p className="text-[10px] text-[var(--text-secondary)] mb-1">Plafond % (optionnel)</p>
                  <input type="number" step="0.1" value={seniorityCapPercent} placeholder="aucun"
                    onChange={e => setSeniorityCapPercent(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-2 py-2 bg-[var(--surface-2)] border border-[var(--border)]  rounded-xl text-xs font-mono text-right focus:outline-none focus:ring-2 focus:ring-[var(--focus)] text-[var(--text)]" />
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
                  <p className="text-[11px] text-[var(--text-secondary)]  bg-[var(--surface-2)]  rounded-lg px-3 py-2">
                    Aperçu aujourd'hui : <strong>{years} ans</strong> d'ancienneté → taux <strong>{rate}%</strong> →
                    {' '}<strong>{amount.toLocaleString('fr-FR')} FCFA/mois</strong>
                  </p>
                );
              })()}
            </>
          )}

          <Button variant="ghost" onClick={saveSeniorityOverride} disabled={savingSeniority}
            className="mt-4 w-full py-2 bg-[var(--action)] hover:bg-[var(--action)] text-[var(--on-brand)] text-xs font-bold rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
            {savingSeniority ? <><Loader2 size={12} className="animate-spin"/>Sauvegarde…</> :
             senioritySaved  ? <><CheckCircle2 size={16} strokeWidth={1.5} aria-hidden="true"/>Sauvegardé</> :
                               'Enregistrer'}
          </Button>
        </section>
      )}

      {/* ═══ MODAL ══════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {showModal && (
          <Modal open title="Attribuer une prime" onClose={() => setShowModal(false)}><div className="employee-bonus-form"><div className="employee-bonus-fields">
                {/* Catalogue */}
                <div>
                  {templates.length === 0 ? (
                    <div className="p-4 bg-[var(--surface-2)]  border border-[var(--border)]  rounded-xl text-center">
                      <p className="text-sm text-[var(--text-secondary)]  font-medium mb-2">Catalogue vide</p>
                      <Button variant="ghost" onClick={() => { setShowModal(false); router.push(bp(`/parametres/primes?back=${encodeURIComponent(backUrl)}`)); }}
                        className="text-xs font-bold text-[var(--text-secondary)]  underline">
                        Aller au catalogue →
                      </Button>
                    </div>
                  ) : (
                    <FancySelect label="Prime du catalogue" value={String(selectedTemplate?.id || '')} onChange={value => handleTemplateChange(value)} options={[{value:'',label:'Sélectionner une prime'},...templates.map(t=>({value:t.id,label:`${t.name}${t.unitAmount ? ` — ${Number(t.unitAmount).toLocaleString('fr-FR')} FCFA/unité` : ''}${t.defaultAmount ? ` — ${Number(t.defaultAmount).toLocaleString('fr-FR')} FCFA` : ''}${t.defaultPercentage ? ` — ${t.defaultPercentage}%` : ''}`}))]} />
                  )}

                  {/* Aperçu template sélectionné */}
                  {selectedTemplate && (
                    <div className="mt-2 p-3 bg-[var(--surface-2)]/50 rounded-xl border border-[var(--border)]">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <FiscalBadge b={{ ...selectedTemplate, source: 'MANUAL', isRecurring: selectedTemplate.isRecurring, bonusType: selectedTemplate.name }} />
                        <QuantityBadge mode={selectedTemplate.quantityMode} />
                        {selectedTemplate.isProratized && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-[var(--surface-2)]  text-[var(--text-secondary)]  border border-[var(--border)] ">Prorata</span>
                        )}
                      </div>
                      {selectedTemplate.description && (
                        <p className="text-xs text-[var(--text-secondary)]">{selectedTemplate.description}</p>
                      )}
                      {selectedTemplate.quantityMode === 'FREE' && (
                        <p className="text-xs text-[var(--text-secondary)]  mt-1 flex items-center gap-1">
                          <AlertCircle size={11} /> La quantité sera saisie depuis la section "Quantités à saisir"
                        </p>
                      )}
                      {selectedTemplate.quantityMode && selectedTemplate.quantityMode !== 'FREE' && (
                        <p className="text-xs text-[var(--text-secondary)]  mt-1 flex items-center gap-1">
                          <Zap size={11} /> Calcul automatique depuis le pointage
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Montant custom si nécessaire */}
                {selectedTemplate && !selectedTemplate.quantityMode && selectedTemplate.defaultAmount == null && selectedTemplate.defaultPercentage == null && (
                  <div>
                    <label className="block text-sm font-bold text-[var(--text-secondary)] mb-2">Montant (FCFA)</label>
                    <input type="number" min="0" value={customAmount} onChange={e => setCustomAmount(e.target.value)}
                      placeholder="Ex: 25 000"
                      className="w-full p-4 bg-[var(--surface-2)] border border-[var(--border)] rounded-xl outline-none font-bold font-mono text-xl text-[var(--text)]" />
                  </div>
                )}

                {/* Ajustement optionnel si montant par défaut */}
                {selectedTemplate && !selectedTemplate.quantityMode && selectedTemplate.defaultAmount != null && (
                  <div>
                    <label className="block text-sm font-bold text-[var(--text-secondary)] mb-2">
                      Ajuster le montant <span className="text-xs font-normal text-[var(--text-secondary)]">(optionnel — défaut: {Number(selectedTemplate.defaultAmount).toLocaleString('fr-FR')} F)</span>
                    </label>
                    <input type="number" min="0" value={customAmount} onChange={e => setCustomAmount(e.target.value)}
                      placeholder={String(selectedTemplate.defaultAmount)}
                      className="w-full p-3 bg-[var(--surface-2)] border border-[var(--border)] rounded-xl outline-none font-bold font-mono text-lg text-[var(--text)]" />
                  </div>
                )}

                {/* Fréquence */}
                {selectedTemplate && (
                  <div>
                    <label className="block text-sm font-bold text-[var(--text-secondary)] mb-2">Fréquence</label>
                    <div className="grid grid-cols-3 gap-3">
                      {([
                        { val: 'MONTHLY',  label: 'Mensuelle',  sub: 'Chaque mois', color: 'emerald' },
                        { val: 'ANNUAL',   label: 'Annuelle',   sub: '1×/an, se répète seule', color: 'cyan' },
                        { val: 'ONE_TIME', label: 'Mois choisis', sub: 'Cette année seulement', color: 'amber' },
                      ] as const).map(btn => (
                        <Button variant="ghost" key={btn.val} type="button" aria-pressed={frequencyChoice === btn.val} onClick={() => setFrequencyChoice(btn.val)}
                          className={`p-3 rounded-xl border-2 text-left transition-all ${
                            frequencyChoice === btn.val
                              ? btn.color === 'emerald'
                                ? 'border-[var(--border)] bg-[var(--surface-2)]  text-[var(--text-secondary)] '
                                : btn.color === 'cyan'
                                  ? 'border-[var(--border)] bg-[var(--surface-2)]  text-[var(--text-secondary)] '
                                  : 'border-[var(--border)] bg-[var(--surface-2)]  text-[var(--text-secondary)] '
                              : 'border-[var(--border)] text-[var(--text-secondary)]'
                          }`}>
                          <div className="font-bold text-sm">{btn.label}</div>
                          <div className="text-xs opacity-75 mt-0.5">{btn.sub}</div>
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Mois cible unique (ANNUAL — ex: 13e mois versé chaque décembre) */}
                <AnimatePresence>
                  {selectedTemplate && frequencyChoice === 'ANNUAL' && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }} style={{ overflow: 'hidden' }}>
                      <label className="block text-sm font-bold text-[var(--text-secondary)]  mb-2 flex items-center gap-1">
                        <Calendar size={14} /> Mois de versement chaque année
                      </label>
                      <div className="p-3 bg-[var(--surface-2)]  border border-[var(--border)]  rounded-xl">
                        <FancySelect label="Mois de versement" value={String(targetMonths[0] ?? now.getMonth() + 1)} onChange={value => setTargetMonths([Number(value)])} options={MONTHS.map(m=>({value:String(m.value),label:m.label}))} />
                        <p className="text-xs text-[var(--text-secondary)]  mt-2">
                          Se déclenchera automatiquement chaque année en {getMonthLabel(targetMonths[0] ?? now.getMonth() + 1)} — pas besoin de la recréer l'an prochain.
                        </p>
                      </div>

                      {/* Aperçu chiffré 13e mois — si % + prorata activé */}
                      {selectedTemplate.defaultPercentage != null && employee?.baseSalary != null && (
                        <div className="mt-3 p-3 bg-[var(--surface-2)] border border-[var(--border)] rounded-xl">
                          <p className="text-xs font-bold text-[var(--text-secondary)] mb-1">Aperçu</p>
                          <p className="text-xs text-[var(--text-secondary)]">
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
                      <label className="block text-sm font-bold text-[var(--text-secondary)]  mb-2 flex items-center gap-1">
                        <Calendar size={14} /> Mois cibles
                        <span className="font-normal text-[var(--text-secondary)] text-xs ml-1">
                          (ex: hsup forfaitaire versée seulement en janvier et mars)
                        </span>
                      </label>
                      <div className="p-3 bg-[var(--surface-2)]  border border-[var(--border)]  rounded-xl space-y-3">
                        <FancySelect label="Année de versement" value={String(targetYear)} onChange={value => setTargetYear(Number(value))} options={YEARS.map(y=>({value:String(y),label:String(y)}))} />
                        <div className="grid grid-cols-3 gap-2">
                          {MONTHS.map(m => {
                            const selected = targetMonths.includes(m.value);
                            return (
                              <Button variant="ghost" key={m.value} type="button" aria-pressed={targetMonths.includes(m.value)} onClick={() => toggleTargetMonth(m.value)}
                                className={`p-2 rounded-lg border text-xs font-bold transition-all ${
                                  selected
                                    ? 'border-[var(--border)] bg-[var(--action)] text-[var(--on-brand)]'
                                    : 'border-[var(--border)]  bg-[var(--surface)] text-[var(--text-secondary)]'
                                }`}>
                                {m.label}
                              </Button>
                            );
                          })}
                        </div>
                        {targetMonths.length === 0 && (
                          <p className="text-xs text-[var(--danger-text)] flex items-center gap-1">
                            <AlertCircle size={11} /> Choisissez au moins un mois
                          </p>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

</div><aside className="employee-bonus-preview"><h3>Aperçu de la rémunération</h3>{!selectedTemplate && <p>Choisissez une prime pour voir l’estimation du brut et du net avec cette attribution.</p>}
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
                      fiscalType: selectedTemplate.fiscalType,
                    }}
                  />
                )}


</aside>
                {/* Actions */}
                <div className="employee-bonus-actions">
                  <Button variant="ghost" onClick={() => setShowModal(false)}
                    className="flex-1 py-4 bg-[var(--surface-2)] text-[var(--text-secondary)] font-bold rounded-xl hover:bg-[var(--border)] transition-colors">
                    Annuler
                  </Button>
                  <Button variant="primary" onClick={handleAdd} disabled={isSaving || !selectedTemplate}
                    className="flex-1 py-4 bg-[var(--action)] hover:bg-[var(--action)] text-[var(--on-brand)] font-bold rounded-xl shadow-lg transition-all flex justify-center items-center gap-2 disabled:opacity-50">
                    {isSaving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                    Attribuer
                  </Button>
                </div>
              </div>
            </Modal>
        )}
      </AnimatePresence>
    </div></div></ModulePageFrame>
  );
}
