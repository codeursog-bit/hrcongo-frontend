'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowLeft, Plus, Trash2, Loader2, Gift, Save, X,
  AlertCircle, Check, Pencil, Info,
  TrendingUp, Award, Shield, Clock, DollarSign, Calendar
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '@/services/api';
import { useAlert } from '@/components/providers/AlertProvider';

// ─── TYPES ────────────────────────────────────────────────────────────────────

export interface BonusTemplate {
  id: string;
  name: string;            // libellé libre : "Prime qualité", "Logement", etc.
  defaultAmount: number | null;
  defaultPercentage: number | null;
  baseCalculation: 'BASE_SALARY' | 'GROSS_SALARY' | null;
  isRecurring: boolean;    // fréquence par défaut
  isTaxable: boolean;      // soumise ITS par défaut
  isCnss: boolean;         // soumise CNSS par défaut
  description: string | null;
  isActive: boolean;
  createdAt?: string;
}

// ─── CONSTANTES ───────────────────────────────────────────────────────────────

// Primes conventionnelles pré-définies — le RH peut toutes les modifier/supprimer
const CONVENTIONAL_PRESETS: Omit<BonusTemplate, 'id' | 'createdAt' | 'isActive'>[] = [
  { name: 'Prime de transport',     defaultAmount: 15000, defaultPercentage: null, baseCalculation: null, isRecurring: true,  isTaxable: false, isCnss: false, description: 'Remboursement frais de transport — exonérée ITS et CNSS' },
  { name: 'Prime de panier',        defaultAmount: 5000,  defaultPercentage: null, baseCalculation: null, isRecurring: true,  isTaxable: false, isCnss: false, description: 'Indemnité repas journalière — exonérée ITS et CNSS' },
  { name: 'Prime de logement',      defaultAmount: null,  defaultPercentage: 10,   baseCalculation: 'BASE_SALARY', isRecurring: true,  isTaxable: true,  isCnss: false, description: '% du salaire de base — imposable ITS, exonérée CNSS' },
  { name: 'Prime de rendement',     defaultAmount: null,  defaultPercentage: null, baseCalculation: null, isRecurring: true,  isTaxable: true,  isCnss: true,  description: 'Liée à la performance — imposable ITS + CNSS' },
  { name: "Prime de fin d'année",   defaultAmount: null,  defaultPercentage: null, baseCalculation: null, isRecurring: false, isTaxable: true,  isCnss: true,  description: '13ème mois — imposable ITS + CNSS' },
  { name: 'Prime de sujétion',      defaultAmount: null,  defaultPercentage: null, baseCalculation: null, isRecurring: true,  isTaxable: true,  isCnss: false, description: 'Conditions difficiles — imposable ITS, exonérée CNSS' },
  { name: 'Prime de responsabilité',defaultAmount: null,  defaultPercentage: null, baseCalculation: null, isRecurring: true,  isTaxable: true,  isCnss: true,  description: 'Lié au poste — imposable ITS + CNSS' },
  { name: 'Indemnité de garde',     defaultAmount: null,  defaultPercentage: null, baseCalculation: null, isRecurring: false, isTaxable: false, isCnss: false, description: 'Remboursement frais de garde — exonérée' },
];

const FREQ_LABEL: Record<string, string> = { true: 'Récurrente', false: 'Ponctuelle' };
const CALC_LABEL: Record<string, string> = { BASE_SALARY: 'du base', GROSS_SALARY: 'du brut' };

// ─── Composant badge fiscal ────────────────────────────────────────────────
const FiscalSummary = ({ t }: { t: BonusTemplate }) => {
  if (!t.isTaxable && !t.isCnss) return (
    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-700">Net direct</span>
  );
  return (
    <span className="inline-flex gap-1">
      {t.isTaxable && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-700">ITS</span>}
      {t.isCnss   && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-700">CNSS</span>}
      {t.isTaxable && !t.isCnss && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700">ITS seul.</span>}
    </span>
  );
};

// ─── Composant toggle fiscal ──────────────────────────────────────────────
const FiscalToggle = ({ label, desc, active, onChange }: {
  label: string; desc: string; active: boolean; onChange: () => void;
}) => (
  <button type="button" onClick={onChange}
    className={`flex items-start gap-3 p-3 rounded-xl border-2 text-left transition-all w-full cursor-pointer ${
      active
        ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/20'
        : 'border-gray-200 dark:border-gray-700 opacity-50'
    }`}>
    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 shrink-0 ${
      active ? 'border-violet-500 bg-violet-500' : 'border-gray-300 dark:border-gray-600'
    }`}>
      {active && <div className="w-2 h-2 rounded-full bg-white" />}
    </div>
    <div>
      <p className={`font-bold text-sm ${active ? 'text-violet-700 dark:text-violet-300' : 'text-gray-500'}`}>{label}</p>
      <p className="text-xs text-gray-400 mt-0.5">{desc}</p>
    </div>
  </button>
);

// ─── FORM STATE ─────────────────────────────────────────────────────────────
const emptyForm = () => ({
  name:               '',
  defaultAmount:      '' as string | number,
  defaultPercentage:  '' as string | number,
  baseCalculation:    'BASE_SALARY' as 'BASE_SALARY' | 'GROSS_SALARY',
  isRecurring:        true,
  isTaxable:          true,
  isCnss:             true,
  description:        '',
  usePercentage:      false,
  useFixedAmount:     false,  // false = montant libre à définir par employé
});

// ─── COMPOSANT PRINCIPAL ──────────────────────────────────────────────────────

export default function CataloguePrimesPage() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const alert        = useAlert();

  // back param → redirect après sauvegarde depuis AssignPrimePage ou EmployeePrimesPage
  const backUrl = searchParams.get('back') || '/parametres';

  const [templates,    setTemplates]    = useState<BonusTemplate[]>([]);
  const [isLoading,    setIsLoading]    = useState(true);
  const [showModal,    setShowModal]    = useState(false);
  const [isSaving,     setIsSaving]     = useState(false);
  const [deletingId,   setDeletingId]   = useState<string | null>(null);
  const [editTarget,   setEditTarget]   = useState<BonusTemplate | null>(null);
  const [form,         setForm]         = useState(emptyForm());
  const [showPresets,  setShowPresets]  = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await api.get<any>('/bonus-templates');
      const list: BonusTemplate[] = Array.isArray(res) ? res : res?.data || [];
      setTemplates(list);
    } catch {
      // non bloquant
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // ── Ouvrir modal création ─────────────────────────────────────────────
  const openCreate = () => {
    setEditTarget(null);
    setForm(emptyForm());
    setShowModal(true);
  };

  // ── Ouvrir modal édition ──────────────────────────────────────────────
  const openEdit = (t: BonusTemplate) => {
    setEditTarget(t);
    setForm({
      name:              t.name,
      defaultAmount:     t.defaultAmount ?? '',
      defaultPercentage: t.defaultPercentage ?? '',
      baseCalculation:   t.baseCalculation ?? 'BASE_SALARY',
      isRecurring:       t.isRecurring,
      isTaxable:         t.isTaxable,
      isCnss:            t.isCnss,
      description:       t.description ?? '',
      usePercentage:     t.defaultPercentage != null,
      useFixedAmount:    t.defaultAmount != null,
    });
    setShowModal(true);
  };

  // ── Appliquer un preset ───────────────────────────────────────────────
  const applyPreset = (p: typeof CONVENTIONAL_PRESETS[0]) => {
    setForm({
      name:              p.name,
      defaultAmount:     p.defaultAmount ?? '',
      defaultPercentage: p.defaultPercentage ?? '',
      baseCalculation:   p.baseCalculation ?? 'BASE_SALARY',
      isRecurring:       p.isRecurring,
      isTaxable:         p.isTaxable,
      isCnss:            p.isCnss,
      description:       p.description ?? '',
      usePercentage:     p.defaultPercentage != null,
      useFixedAmount:    p.defaultAmount != null,
    });
    setShowPresets(false);
  };

  // ── Sauvegarder (création ou mise à jour) ─────────────────────────────
  const handleSave = async () => {
    if (!form.name.trim()) {
      alert.error('Nom requis', 'Donnez un nom à cette prime.');
      return;
    }

    setIsSaving(true);
    try {
      const payload: any = {
        name:        form.name.trim(),
        isRecurring: form.isRecurring,
        isTaxable:   form.isTaxable,
        isCnss:      form.isCnss,
        description: form.description || null,
        // Montant / % — null si "à définir par employé"
        defaultAmount:     form.useFixedAmount && !form.usePercentage && form.defaultAmount !== ''
          ? Number(form.defaultAmount) : null,
        defaultPercentage: form.usePercentage && form.defaultPercentage !== ''
          ? Number(form.defaultPercentage) : null,
        baseCalculation:   form.usePercentage ? form.baseCalculation : null,
      };

      if (editTarget) {
        const updated = await api.patch<BonusTemplate>(`/bonus-templates/${editTarget.id}`, payload);
        setTemplates(prev => prev.map(t => t.id === editTarget.id ? { ...t, ...updated } : t));
        alert.success('Prime modifiée', 'Les modifications ont été enregistrées.');
      } else {
        const created = await api.post<BonusTemplate>('/bonus-templates', payload);
        setTemplates(prev => [created as BonusTemplate, ...prev]);
        alert.success('Prime créée', `"${form.name}" a été ajoutée au catalogue.`);
      }

      setShowModal(false);
      setForm(emptyForm());
    } catch (e: any) {
      alert.error('Erreur', e?.message || 'Impossible de sauvegarder.');
    } finally {
      setIsSaving(false);
    }
  };

  // ── Supprimer ──────────────────────────────────────────────────────────
  const handleDelete = async (id: string, name: string) => {
    setDeletingId(id);
    try {
      await api.delete(`/bonus-templates/${id}`);
      setTemplates(prev => prev.filter(t => t.id !== id));
      alert.success('Supprimé', `"${name}" a été retiré du catalogue.`);
    } catch (e: any) {
      alert.error('Erreur', e?.message || 'Impossible de supprimer.');
    } finally {
      setDeletingId(null);
    }
  };

  // ── Résumé montant ────────────────────────────────────────────────────
  const amountSummary = (t: BonusTemplate) => {
    if (t.defaultAmount != null) return `${t.defaultAmount.toLocaleString('fr-FR')} FCFA`;
    if (t.defaultPercentage != null) return `${t.defaultPercentage}% ${CALC_LABEL[t.baseCalculation!] ?? ''}`;
    return <span className="italic text-gray-400">Montant libre</span>;
  };

  // ── Résumé fiscal ──────────────────────────────────────────────────────
  const fiscalSummaryText = () => {
    if (!form.isTaxable && !form.isCnss) return '💛 Versée au net — aucune retenue';
    if (form.isTaxable && form.isCnss)   return '🟣 ITS + CNSS calculés dessus';
    if (form.isTaxable && !form.isCnss)  return '🔵 ITS seulement — exonérée CNSS';
    return '⚠️ Configuration inhabituelle';
  };

  // ─── Render ───────────────────────────────────────────────────────────────
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
          <Gift size={28} className="text-cyan-500" />
          Catalogue des primes
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          Définissez ici les types de primes de votre entreprise — libellé, nature fiscale et montant par défaut.
        </p>
      </div>

      {/* Notice info */}
      <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl">
        <Info size={16} className="text-blue-500 mt-0.5 shrink-0" />
        <p className="text-sm text-blue-700 dark:text-blue-300 leading-relaxed">
          Ce catalogue définit les <strong>types de primes disponibles</strong> dans votre entreprise.
          Lors de l'attribution à un employé, le RH choisit une prime depuis ce catalogue
          et peut ajuster le montant individuellement.
          Le statut fiscal (<strong>ITS</strong>, <strong>CNSS</strong>) est géré ici une fois pour toutes.
        </p>
      </div>

      {/* ── Bouton primes conventionnelles ── */}
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
            <motion.div
              initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.15 }}
              className="absolute z-30 mt-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-2xl overflow-hidden w-full max-w-lg">
              <div className="p-3 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Primes conventionnelles — cliquez pour pré-remplir le formulaire
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
                    <FiscalSummary t={{ ...p, id: '', isActive: true } as BonusTemplate} />
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Liste des primes du catalogue ── */}
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
          <p className="text-slate-400 text-sm mb-5">
            Créez vos premiers types de primes ou importez les primes conventionnelles.
          </p>
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
                className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-5 flex items-center gap-5">

                {/* Icône */}
                <div className="w-12 h-12 bg-cyan-100 dark:bg-cyan-900/30 rounded-xl flex items-center justify-center shrink-0">
                  <Gift size={22} className="text-cyan-500" />
                </div>

                {/* Infos */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-bold text-slate-900 dark:text-white">{t.name}</p>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      t.isRecurring
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800'
                        : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800'
                    }`}>
                      {t.isRecurring ? 'Récurrente' : 'Ponctuelle'}
                    </span>
                    <FiscalSummary t={t} />
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-sm font-mono font-semibold text-gray-700 dark:text-gray-300">
                      {amountSummary(t)}
                    </span>
                    {t.description && (
                      <span className="text-xs text-gray-400 truncate max-w-xs">{t.description}</span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={() => openEdit(t)}
                    className="w-9 h-9 flex items-center justify-center rounded-xl border border-gray-200 dark:border-gray-600 hover:border-cyan-400 hover:bg-cyan-50 dark:hover:bg-cyan-900/20 transition-all text-gray-400 hover:text-cyan-600">
                    <Pencil size={15} />
                  </button>
                  <button onClick={() => handleDelete(t.id, t.name)} disabled={deletingId === t.id}
                    className="w-9 h-9 flex items-center justify-center rounded-xl border border-gray-200 dark:border-gray-600 hover:border-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all text-gray-400 hover:text-red-500">
                    {deletingId === t.id ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* ================================================================
          MODAL CRÉATION / ÉDITION
      ================================================================ */}
      <AnimatePresence>
        {showModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xl p-4"
            onClick={() => setShowModal(false)}>
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              onClick={e => e.stopPropagation()}
              className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-white/10 rounded-3xl p-8 max-w-md w-full shadow-2xl relative overflow-y-auto max-h-[92vh]">

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
                  <p className="text-xs text-slate-400 mt-0.5">
                    {editTarget ? editTarget.name : 'Ajouter au catalogue entreprise'}
                  </p>
                </div>
              </div>

              <div className="space-y-5">

                {/* Nom */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                    Nom de la prime *
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                    placeholder="Ex: Prime qualité, Indemnité terrain..."
                    className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none text-slate-900 dark:text-white font-medium focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 transition-all"
                  />
                </div>

                {/* Montant par défaut */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                    Montant par défaut
                  </label>
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    <button type="button"
                      onClick={() => setForm(p => ({ ...p, useFixedAmount: false, usePercentage: false }))}
                      className={`p-2.5 rounded-xl border-2 text-xs font-bold text-center transition-all ${
                        !form.useFixedAmount && !form.usePercentage
                          ? 'border-slate-700 dark:border-white bg-slate-900 dark:bg-white text-white dark:text-gray-900'
                          : 'border-slate-200 dark:border-slate-700 text-slate-500'
                      }`}>
                      Libre
                    </button>
                    <button type="button"
                      onClick={() => setForm(p => ({ ...p, useFixedAmount: true, usePercentage: false }))}
                      className={`p-2.5 rounded-xl border-2 text-xs font-bold text-center transition-all ${
                        form.useFixedAmount && !form.usePercentage
                          ? 'border-cyan-500 bg-cyan-50 dark:bg-cyan-900/20 text-cyan-700 dark:text-cyan-300'
                          : 'border-slate-200 dark:border-slate-700 text-slate-500'
                      }`}>
                      Fixe (FCFA)
                    </button>
                    <button type="button"
                      onClick={() => setForm(p => ({ ...p, useFixedAmount: false, usePercentage: true }))}
                      className={`p-2.5 rounded-xl border-2 text-xs font-bold text-center transition-all ${
                        form.usePercentage
                          ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300'
                          : 'border-slate-200 dark:border-slate-700 text-slate-500'
                      }`}>
                      % du salaire
                    </button>
                  </div>

                  {!form.useFixedAmount && !form.usePercentage && (
                    <p className="text-xs text-slate-400 italic">
                      Le montant sera saisi lors de l'attribution à chaque employé.
                    </p>
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

                {/* Fréquence */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Fréquence par défaut</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button type="button" onClick={() => setForm(p => ({ ...p, isRecurring: true }))}
                      className={`p-3 rounded-xl border-2 text-left transition-all ${
                        form.isRecurring
                          ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300'
                          : 'border-slate-200 dark:border-slate-700 text-slate-500'
                      }`}>
                      <div className="font-bold text-sm">Récurrente</div>
                      <div className="text-xs opacity-75 mt-0.5">Chaque mois</div>
                    </button>
                    <button type="button" onClick={() => setForm(p => ({ ...p, isRecurring: false }))}
                      className={`p-3 rounded-xl border-2 text-left transition-all ${
                        !form.isRecurring
                          ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300'
                          : 'border-slate-200 dark:border-slate-700 text-slate-500'
                      }`}>
                      <div className="font-bold text-sm">Ponctuelle</div>
                      <div className="text-xs opacity-75 mt-0.5">1 mois cible</div>
                    </button>
                  </div>
                </div>

                {/* Nature fiscale */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Configuration fiscale</label>
                  <p className="text-xs text-slate-400 mb-3">Fixée une fois pour ce type de prime — appliquée à tous les employés.</p>
                  <div className="space-y-2">
                    <FiscalToggle
                      label="Soumise à l'ITS"
                      desc="Entre dans le revenu imposable"
                      active={form.isTaxable}
                      onChange={() => setForm(p => ({ ...p, isTaxable: !p.isTaxable }))}
                    />
                    <FiscalToggle
                      label="Soumise à la CNSS (4%)"
                      desc="Entre dans la base CNSS salariale"
                      active={form.isCnss}
                      onChange={() => setForm(p => ({ ...p, isCnss: !p.isCnss }))}
                    />
                  </div>
                  <div className={`mt-3 p-3 rounded-xl border text-xs font-medium ${
                    !form.isTaxable && !form.isCnss
                      ? 'bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300'
                      : form.isTaxable && form.isCnss
                        ? 'bg-violet-50 dark:bg-violet-900/10 border-violet-200 dark:border-violet-800 text-violet-700 dark:text-violet-300'
                        : 'bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300'
                  }`}>
                    {fiscalSummaryText()}
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