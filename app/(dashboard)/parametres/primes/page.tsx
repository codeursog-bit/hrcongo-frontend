'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowLeft, Plus, Trash2, Loader2, Gift, Save, X,
  AlertCircle, Check, Pencil, Info,
  TrendingUp, Award, Shield, Clock, DollarSign, Calendar,
  Zap, Timer, Hash, ToggleLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '@/services/api';
import { useAlert } from '@/components/providers/AlertProvider';

// ─── TYPES ────────────────────────────────────────────────────────────────────

export interface BonusTemplate {
  id:                 string;
  name:               string;
  defaultAmount:      number | null;
  defaultPercentage:  number | null;
  baseCalculation:    'BASE_SALARY' | 'GROSS_SALARY' | null;
  isRecurring:        boolean;
  isTaxable:          boolean;
  isCnss:             boolean;
  fiscalType?:        'TAXABLE_CNSS' | 'TAXABLE_NO_CNSS' | 'NON_TAXABLE' | null;
  // 🆕 Système quantité
  unitAmount?:        number | null;
  quantityMode?:      'AUTO_DAYS' | 'AUTO_WEEKS' | 'AUTO_HOURS' | 'FREE' | null;
  defaultQuantity?:   number | null;
  isProratized?:      boolean;
  description:        string | null;
  isActive:           boolean;
  createdAt?:         string;
}

// ─── CONSTANTES ───────────────────────────────────────────────────────────────

// 🆕 Primes conventionnelles enrichies avec quantityMode + fiscalType
const CONVENTIONAL_PRESETS: Omit<BonusTemplate, 'id' | 'createdAt' | 'isActive'>[] = [
  {
    name: 'Indemnité de transport',
    defaultAmount: null, defaultPercentage: null, baseCalculation: null,
    isRecurring: true, isTaxable: false, isCnss: false,
    fiscalType: 'NON_TAXABLE',
    unitAmount: 1200, quantityMode: 'AUTO_DAYS', defaultQuantity: null, isProratized: true,
    description: 'Remboursement frais de transport — 1 200 FCFA × jours travaillés (automatique)',
  },
  {
    name: 'Indemnité de panier',
    defaultAmount: null, defaultPercentage: null, baseCalculation: null,
    isRecurring: true, isTaxable: false, isCnss: false,
    fiscalType: 'NON_TAXABLE',
    unitAmount: 2000, quantityMode: 'FREE', defaultQuantity: 0, isProratized: false,
    description: 'Indemnité repas — 2 000 FCFA × nombre de repas pris (saisi au bulletin)',
  },
  {
    name: 'Prime d\'assiduité semaine',
    defaultAmount: null, defaultPercentage: null, baseCalculation: null,
    isRecurring: true, isTaxable: true, isCnss: false,
    fiscalType: 'TAXABLE_NO_CNSS',
    unitAmount: 2000, quantityMode: 'AUTO_WEEKS', defaultQuantity: null, isProratized: false,
    description: 'Prime d\'assiduité — 2 000 FCFA × semaines du mois (automatique)',
  },
  {
    name: 'Indemnité de logement',
    defaultAmount: null, defaultPercentage: null, baseCalculation: null,
    isRecurring: true, isTaxable: false, isCnss: false,
    fiscalType: 'NON_TAXABLE',
    unitAmount: null, quantityMode: null, defaultQuantity: null, isProratized: false,
    description: 'Participation employeur au logement — montant fixe par catégorie',
  },
  {
    name: 'Prime de responsabilité',
    defaultAmount: null, defaultPercentage: null, baseCalculation: null,
    isRecurring: true, isTaxable: true, isCnss: true,
    fiscalType: 'TAXABLE_CNSS',
    unitAmount: null, quantityMode: null, defaultQuantity: null, isProratized: false,
    description: 'Prime liée à une responsabilité particulière — montant fixe mensuel',
  },
  {
    name: 'Prime de diplôme',
    defaultAmount: null, defaultPercentage: null, baseCalculation: null,
    isRecurring: true, isTaxable: true, isCnss: true,
    fiscalType: 'TAXABLE_CNSS',
    unitAmount: null, quantityMode: null, defaultQuantity: null, isProratized: false,
    description: 'Majoration mensuelle liée au diplôme — montant fixe par niveau',
  },
  {
    name: 'Prime de rendement',
    defaultAmount: null, defaultPercentage: null, baseCalculation: null,
    isRecurring: true, isTaxable: true, isCnss: false,
    fiscalType: 'TAXABLE_NO_CNSS',
    unitAmount: null, quantityMode: null, defaultQuantity: null, isProratized: true,
    description: 'Prime liée à la performance — imposable ITS, exonérée CNSS',
  },
];

// 🆕 Labels et configs des modes de quantité
const QUANTITY_MODES = [
  {
    value: null,
    label: 'Montant fixe / %',
    icon: DollarSign,
    desc: 'Montant constant chaque mois (ou % du salaire)',
    color: 'slate',
  },
  {
    value: 'AUTO_DAYS',
    label: 'Par jour travaillé',
    icon: Timer,
    desc: 'Montant unitaire × jours travaillés (automatique depuis pointage)',
    color: 'cyan',
  },
  {
    value: 'AUTO_WEEKS',
    label: 'Par semaine du mois',
    icon: Calendar,
    desc: 'Montant unitaire × semaines du mois (4 ou 5, automatique)',
    color: 'emerald',
  },
  {
    value: 'AUTO_HOURS',
    label: 'Par heure travaillée',
    icon: Clock,
    desc: 'Montant unitaire × heures travaillées (automatique depuis pointage)',
    color: 'sky',
  },
  {
    value: 'FREE',
    label: 'Quantité libre',
    icon: Hash,
    desc: 'Admin saisit la quantité au moment du bulletin (repas, opérations...)',
    color: 'amber',
  },
] as const;

// 🆕 Types fiscaux simplifiés
const FISCAL_TYPES = [
  {
    value: 'TAXABLE_CNSS',
    label: 'Imposable + CNSS',
    desc: 'Entre dans la base ITS et CNSS (ancienneté, diplôme, responsabilité)',
    color: 'violet',
    isTaxable: true, isCnss: true,
  },
  {
    value: 'TAXABLE_NO_CNSS',
    label: 'Imposable uniquement',
    desc: 'Entre dans la base ITS mais exonérée CNSS (13e mois, rendement)',
    color: 'blue',
    isTaxable: true, isCnss: false,
  },
  {
    value: 'NON_TAXABLE',
    label: 'Indemnité nette',
    desc: 'Exonérée ITS et CNSS — remboursement de frais réels (transport, panier)',
    color: 'amber',
    isTaxable: false, isCnss: false,
  },
] as const;

const CALC_LABEL: Record<string, string> = { BASE_SALARY: 'du base', GROSS_SALARY: 'du brut' };

// ─── HELPERS VISUELS ─────────────────────────────────────────────────────────

const FiscalBadge = ({ fiscalType, isTaxable, isCnss }: {
  fiscalType?: string | null; isTaxable: boolean; isCnss: boolean;
}) => {
  const ft = fiscalType ?? (
    !isTaxable && !isCnss ? 'NON_TAXABLE' :
    isTaxable && !isCnss  ? 'TAXABLE_NO_CNSS' : 'TAXABLE_CNSS'
  );
  if (ft === 'NON_TAXABLE') return (
    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-700">
      Net direct
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
  const cfg = QUANTITY_MODES.find(m => m.value === mode);
  if (!cfg) return null;
  const colors: Record<string, string> = {
    cyan:    'bg-cyan-100 text-cyan-700 border-cyan-200 dark:bg-cyan-900/30 dark:text-cyan-300 dark:border-cyan-700',
    emerald: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-700',
    sky:     'bg-sky-100 text-sky-700 border-sky-200 dark:bg-sky-900/30 dark:text-sky-300 dark:border-sky-700',
    amber:   'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-700',
    slate:   'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
  };
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${colors[cfg.color]}`}>
      <Icon size={9} /> {cfg.label}
    </span>
  );
};

// ─── FORM STATE ──────────────────────────────────────────────────────────────

const emptyForm = () => ({
  name:              '',
  fiscalType:        'TAXABLE_CNSS' as 'TAXABLE_CNSS' | 'TAXABLE_NO_CNSS' | 'NON_TAXABLE',
  defaultAmount:     '' as string | number,
  defaultPercentage: '' as string | number,
  baseCalculation:   'BASE_SALARY' as 'BASE_SALARY' | 'GROSS_SALARY',
  isRecurring:       true,
  isTaxable:         true,
  isCnss:            true,
  description:       '',
  // Montant
  usePercentage:     false,
  useFixedAmount:    false,
  // 🆕 Quantité
  quantityMode:      null as 'AUTO_DAYS' | 'AUTO_WEEKS' | 'AUTO_HOURS' | 'FREE' | null,
  unitAmount:        '' as string | number,
  defaultQuantity:   '' as string | number,
  isProratized:      false,
});

// ─── COMPOSANT PRINCIPAL ─────────────────────────────────────────────────────

export default function CataloguePrimesPage() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const alert        = useAlert();

  const backUrl = searchParams.get('back') || '/parametres';

  const [templates,   setTemplates]   = useState<BonusTemplate[]>([]);
  const [isLoading,   setIsLoading]   = useState(true);
  const [showModal,   setShowModal]   = useState(false);
  const [isSaving,    setIsSaving]    = useState(false);
  const [deletingId,  setDeletingId]  = useState<string | null>(null);
  const [editTarget,  setEditTarget]  = useState<BonusTemplate | null>(null);
  const [form,        setForm]        = useState(emptyForm());
  const [showPresets, setShowPresets] = useState(false);

  // 🆕 Prime d'ancienneté — config générale entreprise (formule linéaire)
  const [seniorityEnabled,    setSeniorityEnabled]    = useState(false);
  const [seniorityStartYear,  setSeniorityStartYear]  = useState<number | ''>(2);
  const [seniorityStartRate,  setSeniorityStartRate]  = useState<number | ''>(2);
  const [seniorityRatePerYr,  setSeniorityRatePerYr]  = useState<number | ''>(1);
  const [seniorityCapPercent, setSeniorityCapPercent] = useState<number | ''>('');
  const [savingSeniority,     setSavingSeniority]     = useState(false);
  const [senioritySaved,      setSenioritySaved]      = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await api.get<any>('/bonus-templates');
      const list: BonusTemplate[] = Array.isArray(res) ? res : res?.data || [];
      setTemplates(list);
    } catch { /* non bloquant */ }
    try {
      // 🆕 Config générale ancienneté — stockée sur Company
      const ci = await api.get<any>('/companies/mine');
      const cfg = ci?.seniorityLinearConfig;
      if (cfg && typeof cfg === 'object') {
        setSeniorityEnabled(!!cfg.enabled);
        setSeniorityStartYear(cfg.startYear   ?? 2);
        setSeniorityStartRate(cfg.startRate   ?? 2);
        setSeniorityRatePerYr(cfg.ratePerYear ?? 1);
        setSeniorityCapPercent(cfg.capPercent ?? '');
      }
    } catch { /* non bloquant */ }
    finally { setIsLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  // ── Sync fiscalType → isTaxable/isCnss ───────────────────────────────────
  const setFiscalType = (ft: 'TAXABLE_CNSS' | 'TAXABLE_NO_CNSS' | 'NON_TAXABLE') => {
    const cfg = FISCAL_TYPES.find(f => f.value === ft)!;
    setForm(p => ({ ...p, fiscalType: ft, isTaxable: cfg.isTaxable, isCnss: cfg.isCnss }));
  };

  // 🆕 Ancienneté — sauvegarde config générale entreprise
  const saveSeniorityConfig = async () => {
    setSavingSeniority(true);
    try {
      const payload = {
        enabled:     seniorityEnabled,
        startYear:   Number(seniorityStartYear) || 2,
        startRate:   Number(seniorityStartRate) || 0,
        ratePerYear: Number(seniorityRatePerYr) || 0,
        capPercent:  seniorityCapPercent === '' ? null : Number(seniorityCapPercent),
      };
      await api.patch('/companies', { seniorityLinearConfig: payload });
      setSenioritySaved(true);
      alert.success('Enregistré', "Configuration générale de la prime d'ancienneté mise à jour.");
      setTimeout(() => setSenioritySaved(false), 3000);
    } catch (e: any) {
      alert.error('Erreur', e?.message || 'Impossible de sauvegarder la configuration.');
    } finally {
      setSavingSeniority(false);
    }
  };

  // ── Modaux ───────────────────────────────────────────────────────────────
  const openCreate = () => { setEditTarget(null); setForm(emptyForm()); setShowModal(true); };

  const openEdit = (t: BonusTemplate) => {
    setEditTarget(t);
    const ft = t.fiscalType ?? (!t.isTaxable && !t.isCnss ? 'NON_TAXABLE' :
      t.isTaxable && !t.isCnss ? 'TAXABLE_NO_CNSS' : 'TAXABLE_CNSS');
    setForm({
      name:              t.name,
      fiscalType:        ft as any,
      defaultAmount:     t.defaultAmount ?? '',
      defaultPercentage: t.defaultPercentage ?? '',
      baseCalculation:   t.baseCalculation ?? 'BASE_SALARY',
      isRecurring:       t.isRecurring,
      isTaxable:         t.isTaxable,
      isCnss:            t.isCnss,
      description:       t.description ?? '',
      usePercentage:     t.defaultPercentage != null,
      useFixedAmount:    t.defaultAmount != null && !t.unitAmount,
      quantityMode:      t.quantityMode ?? null,
      unitAmount:        t.unitAmount ?? '',
      defaultQuantity:   t.defaultQuantity ?? '',
      isProratized:      t.isProratized ?? false,
    });
    setShowModal(true);
  };

  const applyPreset = (p: Omit<BonusTemplate, 'id' | 'createdAt' | 'isActive'>) => {
    const ft = p.fiscalType ?? (!p.isTaxable && !p.isCnss ? 'NON_TAXABLE' :
      p.isTaxable && !p.isCnss ? 'TAXABLE_NO_CNSS' : 'TAXABLE_CNSS');
    setForm({
      name:              p.name,
      fiscalType:        ft as any,
      defaultAmount:     p.defaultAmount ?? '',
      defaultPercentage: p.defaultPercentage ?? '',
      baseCalculation:   p.baseCalculation ?? 'BASE_SALARY',
      isRecurring:       p.isRecurring,
      isTaxable:         p.isTaxable,
      isCnss:            p.isCnss,
      description:       p.description ?? '',
      usePercentage:     p.defaultPercentage != null,
      useFixedAmount:    p.defaultAmount != null && !p.unitAmount,
      quantityMode:      p.quantityMode ?? null,
      unitAmount:        p.unitAmount ?? '',
      defaultQuantity:   p.defaultQuantity ?? '',
      isProratized:      p.isProratized ?? false,
    });
    setShowPresets(false);
    setEditTarget(null);
  };

  // ── Sauvegarder ──────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!form.name.trim()) { alert.error('Nom requis', 'Donnez un nom à cette prime.'); return; }

    const hasQuantityMode = !!form.quantityMode;
    const needsUnitAmount = hasQuantityMode && !form.unitAmount;
    if (needsUnitAmount) {
      alert.error('Montant unitaire requis', 'Indiquez le montant par unité (ex: 1 200 FCFA par jour).');
      return;
    }

    const payload: any = {
      name:            form.name.trim(),
      isRecurring:     form.isRecurring,
      isTaxable:       form.isTaxable,
      isCnss:          form.isCnss,
      fiscalType:      form.fiscalType,
      isProratized:    form.isProratized,
      description:     form.description || null,
      // Quantité
      quantityMode:    form.quantityMode || null,
      unitAmount:      form.unitAmount ? parseFloat(String(form.unitAmount)) : null,
      defaultQuantity: form.defaultQuantity ? parseFloat(String(form.defaultQuantity)) : null,
    };

    // Montant fixe/% seulement si pas en mode quantité
    if (!hasQuantityMode) {
      if (form.useFixedAmount && form.defaultAmount) {
        payload.defaultAmount = parseFloat(String(form.defaultAmount));
        payload.calculationType = 'FIXED_AMOUNT';
      } else if (form.usePercentage && form.defaultPercentage) {
        payload.defaultPercentage = parseFloat(String(form.defaultPercentage));
        payload.baseCalculation   = form.baseCalculation;
        payload.calculationType   = 'PERCENTAGE';
      }
    }

    setIsSaving(true);
    try {
      if (editTarget) {
        const updated = await api.patch<BonusTemplate>(`/bonus-templates/${editTarget.id}`, payload);
        setTemplates(prev => prev.map(t => t.id === editTarget.id ? (updated as BonusTemplate) : t));
        alert.success('Mise à jour', `"${form.name}" a été modifiée.`);
      } else {
        const created = await api.post<BonusTemplate>('/bonus-templates', payload);
        setTemplates(prev => [created as BonusTemplate, ...prev]);
        alert.success('Prime créée', `"${form.name}" ajoutée au catalogue.`);
      }
      setShowModal(false);
      setForm(emptyForm());
    } catch (e: any) {
      alert.error('Erreur', e?.message || 'Impossible de sauvegarder.');
    } finally { setIsSaving(false); }
  };

  const handleDelete = async (id: string, name: string) => {
    setDeletingId(id);
    try {
      await api.delete(`/bonus-templates/${id}`);
      setTemplates(prev => prev.filter(t => t.id !== id));
      alert.success('Supprimé', `"${name}" retiré du catalogue.`);
    } catch (e: any) {
      alert.error('Erreur', e?.message || 'Impossible de supprimer.');
    } finally { setDeletingId(null); }
  };

  // ── Affichage du montant ─────────────────────────────────────────────────
  const amountSummary = (t: BonusTemplate) => {
    if (t.quantityMode && t.unitAmount) {
      const modeCfg = QUANTITY_MODES.find(m => m.value === t.quantityMode);
      return `${Number(t.unitAmount).toLocaleString('fr-FR')} FCFA × ${modeCfg?.label ?? t.quantityMode}`;
    }
    if (t.defaultAmount != null) return `${Number(t.defaultAmount).toLocaleString('fr-FR')} FCFA / mois`;
    if (t.defaultPercentage != null) return `${t.defaultPercentage}% ${CALC_LABEL[t.baseCalculation!] ?? ''}`;
    return <span className="italic text-gray-400">Montant libre</span>;
  };

  const hasQuantityMode = !!form.quantityMode;
  const selectedFiscal  = FISCAL_TYPES.find(f => f.value === form.fiscalType);

  return (
    <div className="max-w-4xl mx-auto pb-20 space-y-6 px-4">

      {/* Header */}
      <div className="flex items-center justify-between pt-4">
        <button onClick={() => router.push(backUrl)}
          className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-cyan-500 transition-colors">
          <ArrowLeft size={16} /> {backUrl === '/parametres' ? 'Paramètres' : 'Retour'}
        </button>
        <button onClick={openCreate}
          className="px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-sky-500 hover:from-cyan-600 hover:to-sky-600 text-white font-bold rounded-xl shadow-lg shadow-cyan-500/20 flex items-center gap-2 transition-all">
          <Plus size={18} /> Nouvelle prime
        </button>
      </div>

      {/* Titre */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
          <Gift size={28} className="text-cyan-500" /> Catalogue des primes
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          Définissez les types de primes — libellé, mode de calcul, nature fiscale.
        </p>
      </div>

      {/* Notice */}
      <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl">
        <Info size={16} className="text-blue-500 mt-0.5 shrink-0" />
        <p className="text-sm text-blue-700 dark:text-blue-300 leading-relaxed">
          Configurez ici <strong>une fois pour toutes</strong> le mode de calcul de chaque prime.
          Les primes <strong>AUTO</strong> (jours, semaines) se calculent automatiquement depuis le pointage.
          Les primes <strong>Quantité libre</strong> demandent une saisie rapide au moment du bulletin.
        </p>
      </div>

      {/* 🆕 Prime d'ancienneté — config générale entreprise */}
      <section className="glass-panel rounded-2xl p-6 border border-violet-200 dark:border-violet-800 bg-violet-50/30 dark:bg-violet-900/10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-violet-500 rounded-lg flex items-center justify-center">
              <TrendingUp size={16} className="text-white" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">Prime d'ancienneté — formule générale</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">S'applique à tous les employés, sauf override personnel sur leur fiche.</p>
            </div>
          </div>
          <button onClick={() => setSeniorityEnabled(v => !v)}
            className={`relative w-11 h-6 rounded-full transition-colors ${seniorityEnabled ? 'bg-violet-500' : 'bg-slate-300 dark:bg-slate-700'}`}>
            <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${seniorityEnabled ? 'translate-x-5' : ''}`} />
          </button>
        </div>

        {!seniorityEnabled && (
          <p className="text-xs text-slate-400 italic">
            Désactivée — l'ancienneté utilise les paliers de la convention collective (si configurés), sinon aucune prime auto.
          </p>
        )}

        {seniorityEnabled && (
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
            <p className="text-[11px] text-violet-600 dark:text-violet-300 bg-violet-100/50 dark:bg-violet-900/20 rounded-lg px-3 py-2 mb-3">
              Exemple : {seniorityStartYear || 2} ans = {seniorityStartRate || 0}%, puis +{seniorityRatePerYr || 0}%/an
              {' '}→ 29 ans = {(() => {
                const sy = Number(seniorityStartYear) || 0, sr = Number(seniorityStartRate) || 0, ry = Number(seniorityRatePerYr) || 0;
                const cap = seniorityCapPercent === '' ? null : Number(seniorityCapPercent);
                let r = 29 >= sy ? sr + (29 - sy) * ry : 0;
                if (cap != null) r = Math.min(r, cap);
                return Math.round(r * 100) / 100;
              })()}%
            </p>
          </>
        )}

        <button onClick={saveSeniorityConfig} disabled={savingSeniority}
          className="w-full py-2 bg-violet-500 hover:bg-violet-600 text-white text-xs font-bold rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
          {savingSeniority ? <><Loader2 size={12} className="animate-spin"/>Sauvegarde…</> :
           senioritySaved  ? <><Check size={12}/>Sauvegardé ✓</> :
                             'Enregistrer'}
        </button>
      </section>

      {/* 🆕 Légende fiscale */}
      <div className="grid grid-cols-3 gap-3">
        {FISCAL_TYPES.map(ft => (
          <div key={ft.value} className={`p-3 rounded-xl border text-center ${
            ft.value === 'NON_TAXABLE'    ? 'bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800' :
            ft.value === 'TAXABLE_NO_CNSS' ? 'bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800' :
            'bg-violet-50 dark:bg-violet-900/10 border-violet-200 dark:border-violet-800'
          }`}>
            <p className={`text-xs font-bold mb-0.5 ${
              ft.value === 'NON_TAXABLE'    ? 'text-amber-700 dark:text-amber-300' :
              ft.value === 'TAXABLE_NO_CNSS' ? 'text-blue-700 dark:text-blue-300' :
              'text-violet-700 dark:text-violet-300'
            }`}>{ft.label}</p>
            <p className="text-[10px] text-slate-500 dark:text-slate-400">{ft.desc.split(' — ')[0]}</p>
          </div>
        ))}
      </div>

      {/* Bouton presets */}
      <div className="relative">
        <button onClick={() => setShowPresets(v => !v)}
          className="flex items-center gap-2 px-4 py-2.5 bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-700 rounded-xl text-sm font-bold text-violet-700 dark:text-violet-300 hover:bg-violet-100 transition-all">
          <Award size={16} /> Importer des primes conventionnelles
          <span className="ml-1 text-xs bg-violet-200 dark:bg-violet-800 px-1.5 py-0.5 rounded-full">
            {CONVENTIONAL_PRESETS.length}
          </span>
        </button>

        <AnimatePresence>
          {showPresets && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.15 }}
              className="absolute z-30 mt-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-2xl overflow-hidden w-full max-w-lg">
              <div className="p-3 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Cliquez pour pré-remplir le formulaire
                </p>
                <button onClick={() => setShowPresets(false)} className="text-gray-400 hover:text-gray-600">
                  <X size={14} />
                </button>
              </div>
              <div className="max-h-72 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-800">
                {CONVENTIONAL_PRESETS.map((p, i) => (
                  <button key={i} onClick={() => { applyPreset(p); setShowModal(true); }}
                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-cyan-50 dark:hover:bg-cyan-900/20 transition-colors text-left">
                    <div>
                      <p className="font-semibold text-sm text-gray-900 dark:text-white">{p.name}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{p.description}</p>
                    </div>
                    <div className="flex flex-col gap-1 items-end shrink-0 ml-3">
                      <FiscalBadge fiscalType={p.fiscalType} isTaxable={p.isTaxable} isCnss={p.isCnss} />
                      <QuantityBadge mode={p.quantityMode} />
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Liste */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20 gap-3">
          <Loader2 className="animate-spin text-cyan-500" size={28} />
          <span className="text-slate-500">Chargement...</span>
        </div>
      ) : templates.length === 0 ? (
        <div className="glass-panel rounded-2xl p-16 text-center border border-dashed border-gray-200 dark:border-gray-700">
          <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-5">
            <Gift size={36} className="text-slate-300 dark:text-slate-600" />
          </div>
          <p className="text-slate-500 dark:text-slate-400 font-medium text-lg mb-2">Catalogue vide</p>
          <p className="text-slate-400 text-sm mb-5">Créez vos premiers types de primes.</p>
          <button onClick={openCreate}
            className="px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-sky-500 text-white font-bold rounded-xl text-sm flex items-center gap-2 mx-auto">
            <Plus size={16} /> Créer ma première prime
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold uppercase tracking-wider">
            {templates.length} prime{templates.length > 1 ? 's' : ''} dans le catalogue
          </p>
          <AnimatePresence>
            {templates.map(t => (
              <motion.div key={t.id}
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -20 }}
                className="glass-panel rounded-xl p-5 flex items-start gap-5">
                <div className="w-12 h-12 bg-cyan-100 dark:bg-cyan-900/30 rounded-xl flex items-center justify-center shrink-0">
                  <Gift size={22} className="text-cyan-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1.5">
                    <p className="font-bold text-slate-900 dark:text-white">{t.name}</p>
                    <FiscalBadge fiscalType={t.fiscalType} isTaxable={t.isTaxable} isCnss={t.isCnss} />
                    <QuantityBadge mode={t.quantityMode} />
                    {t.isProratized && (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-700">
                        Prorata
                      </span>
                    )}
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${
                      t.isRecurring
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800'
                        : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800'
                    }`}>
                      {t.isRecurring ? 'Récurrente' : 'Ponctuelle'}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-slate-600 dark:text-slate-300 font-mono">
                    {amountSummary(t)}
                  </p>
                  {t.description && (
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{t.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={() => openEdit(t)}
                    className="p-2 text-slate-400 hover:text-cyan-500 hover:bg-cyan-50 dark:hover:bg-cyan-900/20 rounded-lg transition-all">
                    <Pencil size={16} />
                  </button>
                  <button onClick={() => handleDelete(t.id, t.name)} disabled={deletingId === t.id}
                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all">
                    {deletingId === t.id ? <Loader2 className="animate-spin" size={16} /> : <Trash2 size={16} />}
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* ═══ MODAL ═══════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {showModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xl p-4"
            onClick={() => setShowModal(false)}>
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              onClick={e => e.stopPropagation()}
              className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-white/10 rounded-3xl p-8 max-w-lg w-full shadow-2xl relative overflow-y-auto max-h-[92vh]">

              <button onClick={() => setShowModal(false)}
                className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
                <X size={20} />
              </button>

              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-cyan-100 dark:bg-cyan-900/30 text-cyan-500 rounded-full flex items-center justify-center">
                  <Gift size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    {editTarget ? 'Modifier la prime' : 'Nouvelle prime'}
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">Configuration une fois, utilisée partout</p>
                </div>
              </div>

              <div className="space-y-5">

                {/* Nom */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                    Nom de la prime *
                  </label>
                  <input type="text" value={form.name}
                    onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                    placeholder="Ex: Indemnité de transport, Prime de garde..."
                    className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none text-slate-900 dark:text-white font-medium focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 transition-all" />
                </div>

                {/* 🆕 Nature fiscale — 3 choix clairs */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                    Nature fiscale *
                  </label>
                  <div className="space-y-2">
                    {FISCAL_TYPES.map(ft => (
                      <button key={ft.value} type="button" onClick={() => setFiscalType(ft.value)}
                        className={`w-full flex items-start gap-3 p-3 rounded-xl border-2 text-left transition-all ${
                          form.fiscalType === ft.value
                            ? ft.value === 'NON_TAXABLE'
                              ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/20'
                              : ft.value === 'TAXABLE_NO_CNSS'
                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                : 'border-violet-500 bg-violet-50 dark:bg-violet-900/20'
                            : 'border-slate-200 dark:border-slate-700 opacity-60'
                        }`}>
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 shrink-0 ${
                          form.fiscalType === ft.value
                            ? ft.value === 'NON_TAXABLE' ? 'border-amber-500 bg-amber-500'
                              : ft.value === 'TAXABLE_NO_CNSS' ? 'border-blue-500 bg-blue-500'
                              : 'border-violet-500 bg-violet-500'
                            : 'border-gray-300 dark:border-gray-600'
                        }`}>
                          {form.fiscalType === ft.value && <div className="w-2 h-2 rounded-full bg-white" />}
                        </div>
                        <div>
                          <p className={`font-bold text-sm ${
                            form.fiscalType === ft.value
                              ? ft.value === 'NON_TAXABLE' ? 'text-amber-700 dark:text-amber-300'
                                : ft.value === 'TAXABLE_NO_CNSS' ? 'text-blue-700 dark:text-blue-300'
                                : 'text-violet-700 dark:text-violet-300'
                              : 'text-gray-500'
                          }`}>{ft.label}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{ft.desc}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 🆕 Mode de calcul */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                    Mode de calcul
                  </label>
                  <div className="space-y-2">
                    {QUANTITY_MODES.map(m => {
                      const Icon = m.icon;
                      const isSelected = form.quantityMode === m.value;
                      return (
                        <button key={String(m.value)} type="button"
                          onClick={() => setForm(p => ({
                            ...p, quantityMode: m.value as any,
                            useFixedAmount: m.value !== null ? false : p.useFixedAmount,
                            usePercentage:  m.value !== null ? false : p.usePercentage,
                          }))}
                          className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all ${
                            isSelected
                              ? 'border-cyan-500 bg-cyan-50 dark:bg-cyan-900/20'
                              : 'border-slate-200 dark:border-slate-700 opacity-60'
                          }`}>
                          <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                            isSelected ? 'bg-cyan-500' : 'bg-slate-100 dark:bg-slate-800'
                          }`}>
                            <Icon size={16} className={isSelected ? 'text-white' : 'text-slate-400'} />
                          </div>
                          <div className="flex-1">
                            <p className={`font-bold text-sm ${isSelected ? 'text-cyan-700 dark:text-cyan-300' : 'text-gray-600 dark:text-gray-400'}`}>
                              {m.label}
                            </p>
                            <p className="text-xs text-gray-400">{m.desc}</p>
                          </div>
                          {isSelected && <Check size={16} className="text-cyan-500 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Montant selon mode */}
                {hasQuantityMode ? (
                  // Mode quantité → montant unitaire
                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                      Montant unitaire (FCFA) *
                      <span className="font-normal text-gray-400 ml-2 text-xs">
                        Ex: 1 200 pour "1 200 FCFA par jour"
                      </span>
                    </label>
                    <input type="number" min="0" value={form.unitAmount}
                      onChange={e => setForm(p => ({ ...p, unitAmount: e.target.value }))}
                      placeholder="Ex: 1200"
                      className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none font-bold font-mono text-lg text-slate-900 dark:text-white" />

                    {/* Quantité par défaut pour FREE */}
                    {form.quantityMode === 'FREE' && (
                      <div className="mt-3">
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                          Quantité par défaut (optionnel)
                          <span className="font-normal text-gray-400 ml-2 text-xs">Ex: 7 repas</span>
                        </label>
                        <input type="number" min="0" value={form.defaultQuantity}
                          onChange={e => setForm(p => ({ ...p, defaultQuantity: e.target.value }))}
                          placeholder="0"
                          className="w-full p-3 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-700 rounded-xl outline-none font-bold font-mono text-lg text-slate-900 dark:text-white" />
                        <p className="text-xs text-amber-600 dark:text-amber-400 mt-1 flex items-center gap-1">
                          <AlertCircle size={11} />
                          Valeur pré-remplie au bulletin — modifiable à chaque mois
                        </p>
                      </div>
                    )}

                    {/* Aperçu calcul */}
                    {form.unitAmount && (
                      <div className="mt-3 p-3 bg-cyan-50 dark:bg-cyan-900/10 border border-cyan-200 dark:border-cyan-800 rounded-xl">
                        <p className="text-xs font-bold text-cyan-700 dark:text-cyan-300 mb-1">Aperçu calcul</p>
                        {form.quantityMode === 'AUTO_DAYS' && (
                          <p className="text-xs text-cyan-600 dark:text-cyan-400 font-mono">
                            {Number(form.unitAmount).toLocaleString('fr-FR')} × 26j = {(Number(form.unitAmount) * 26).toLocaleString('fr-FR')} FCFA (mois complet)
                          </p>
                        )}
                        {form.quantityMode === 'AUTO_WEEKS' && (
                          <p className="text-xs text-cyan-600 dark:text-cyan-400 font-mono">
                            {Number(form.unitAmount).toLocaleString('fr-FR')} × 4 sem = {(Number(form.unitAmount) * 4).toLocaleString('fr-FR')} FCFA / mois
                          </p>
                        )}
                        {form.quantityMode === 'FREE' && form.defaultQuantity && (
                          <p className="text-xs text-cyan-600 dark:text-cyan-400 font-mono">
                            {Number(form.unitAmount).toLocaleString('fr-FR')} × {form.defaultQuantity} = {(Number(form.unitAmount) * Number(form.defaultQuantity)).toLocaleString('fr-FR')} FCFA (défaut)
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  // Mode classique → fixe ou %
                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                      Montant par défaut
                    </label>
                    <div className="grid grid-cols-3 gap-2 mb-3">
                      {[
                        { key: 'libre', label: 'Libre', active: !form.useFixedAmount && !form.usePercentage },
                        { key: 'fixe',  label: 'Fixe (FCFA)', active: form.useFixedAmount && !form.usePercentage },
                        { key: 'pct',   label: '% du salaire', active: form.usePercentage },
                      ].map(btn => (
                        <button key={btn.key} type="button"
                          onClick={() => setForm(p => ({
                            ...p,
                            useFixedAmount: btn.key === 'fixe',
                            usePercentage:  btn.key === 'pct',
                          }))}
                          className={`p-2.5 rounded-xl border-2 text-xs font-bold text-center transition-all ${
                            btn.active
                              ? btn.key === 'pct'
                                ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300'
                                : btn.key === 'fixe'
                                  ? 'border-cyan-500 bg-cyan-50 dark:bg-cyan-900/20 text-cyan-700 dark:text-cyan-300'
                                  : 'border-slate-700 dark:border-white bg-slate-900 dark:bg-white text-white dark:text-gray-900'
                              : 'border-slate-200 dark:border-slate-700 text-slate-500'
                          }`}>
                          {btn.label}
                        </button>
                      ))}
                    </div>

                    {!form.useFixedAmount && !form.usePercentage && (
                      <p className="text-xs text-slate-400 italic">Montant saisi lors de l'attribution à chaque employé.</p>
                    )}
                    {form.useFixedAmount && !form.usePercentage && (
                      <input type="number" min="0" value={form.defaultAmount}
                        onChange={e => setForm(p => ({ ...p, defaultAmount: e.target.value }))}
                        placeholder="Ex: 25 000"
                        className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none font-bold font-mono text-lg text-slate-900 dark:text-white" />
                    )}
                    {form.usePercentage && (
                      <div className="grid grid-cols-2 gap-3">
                        <input type="number" min="0" max="100" step="0.5" value={form.defaultPercentage}
                          onChange={e => setForm(p => ({ ...p, defaultPercentage: e.target.value }))}
                          placeholder="Ex: 10"
                          className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none font-bold font-mono text-lg text-slate-900 dark:text-white" />
                        <select value={form.baseCalculation}
                          onChange={e => setForm(p => ({ ...p, baseCalculation: e.target.value as any }))}
                          className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none text-slate-900 dark:text-white font-medium">
                          <option value="BASE_SALARY">du salaire de base</option>
                          <option value="GROSS_SALARY">du salaire brut</option>
                        </select>
                      </div>
                    )}
                  </div>
                )}

                {/* Fréquence */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Fréquence par défaut</label>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { val: true,  label: 'Récurrente', sub: 'Chaque mois', color: 'emerald' },
                      { val: false, label: 'Ponctuelle',  sub: '1 mois cible', color: 'amber' },
                    ].map(btn => (
                      <button key={String(btn.val)} type="button" onClick={() => setForm(p => ({ ...p, isRecurring: btn.val }))}
                        className={`p-3 rounded-xl border-2 text-left transition-all ${
                          form.isRecurring === btn.val
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

                {/* Description */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Description (optionnel)</label>
                  <input type="text" value={form.description}
                    onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                    placeholder="Ex: Versée aux agents de terrain uniquement"
                    className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none text-slate-900 dark:text-white" />
                </div>

                {/* Récap fiscal */}
                {selectedFiscal && (
                  <div className={`p-3 rounded-xl border text-xs font-medium ${
                    form.fiscalType === 'NON_TAXABLE'
                      ? 'bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300'
                      : form.fiscalType === 'TAXABLE_NO_CNSS'
                        ? 'bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300'
                        : 'bg-violet-50 dark:bg-violet-900/10 border-violet-200 dark:border-violet-800 text-violet-700 dark:text-violet-300'
                  }`}>
                    {form.fiscalType === 'NON_TAXABLE'    && '💛 Versée au net — aucune retenue ITS ni CNSS'}
                    {form.fiscalType === 'TAXABLE_NO_CNSS' && '🔵 ITS calculé dessus — exonérée CNSS'}
                    {form.fiscalType === 'TAXABLE_CNSS'   && '🟣 ITS + CNSS calculés dessus'}
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                  <button onClick={() => setShowModal(false)}
                    className="flex-1 py-4 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-bold rounded-xl hover:bg-gray-200 transition-all">
                    Annuler
                  </button>
                  <button onClick={handleSave} disabled={isSaving}
                    className="flex-1 py-4 bg-gradient-to-r from-cyan-500 to-sky-500 hover:from-cyan-600 hover:to-sky-600 text-white font-bold rounded-xl shadow-lg transition-all flex justify-center items-center gap-2 disabled:opacity-50">
                    {isSaving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                    {editTarget ? 'Mettre à jour' : 'Ajouter au catalogue'}
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