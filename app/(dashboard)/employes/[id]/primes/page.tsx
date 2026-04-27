'use client';

/**
 * 📁 app/(dashboard)/employes/[id]/primes/page.tsx
 * 
 * Page primes d'un employé spécifique.
 * Même logique qu'assign-primes MAIS :
 *   - L'employé est fixé par params.id (pas de sélecteur)
 *   - On charge son profil + ses primes au montage
 *   - Le catalogue vient de /bonus-templates (paramètres/primes)
 *   - Lien vers le catalogue avec ?back= pour revenir ici
 */

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, Plus, Trash2, Loader2, Gift, Zap, Hand,
  DollarSign, Calendar, Save, AlertCircle, Settings2,
  ChevronRight, CheckCircle2, Building2, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '@/services/api';
import { useAlert } from '@/components/providers/AlertProvider';
import type { BonusTemplate } from '@/app/(dashboard)/parametres/primes/page';
import { useBasePath } from '@/hooks/useBasePath';

// ── TYPES ────────────────────────────────────────────────────────────────────

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
}

const MONTHS = [
  { value: 1,  label: 'Janvier' },  { value: 2,  label: 'Février' },
  { value: 3,  label: 'Mars' },     { value: 4,  label: 'Avril' },
  { value: 5,  label: 'Mai' },      { value: 6,  label: 'Juin' },
  { value: 7,  label: 'Juillet' },  { value: 8,  label: 'Août' },
  { value: 9,  label: 'Septembre' },{ value: 10, label: 'Octobre' },
  { value: 11, label: 'Novembre' }, { value: 12, label: 'Décembre' },
];

const now   = new Date();
const YEARS = [now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1];

// ── Badges fiscaux (identique assign-primes) ─────────────────────────────────
const FiscalBadges = ({ isTaxable, isCnss }: { isTaxable: boolean; isCnss: boolean }) => (
  <span className="inline-flex gap-1">
    {isTaxable  && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-700">ITS</span>}
    {isCnss     && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-700">CNSS</span>}
    {!isTaxable && !isCnss && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-700">Net direct</span>}
    {isTaxable  && !isCnss && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700">ITS seul.</span>}
  </span>
);

// ── COMPOSANT PRINCIPAL ───────────────────────────────────────────────────────

export default function EmployeePrimesPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const alert  = useAlert();
  const { bp } = useBasePath();

  const backUrl = `/employes/${params.id}/primes`;

  // ── État ────────────────────────────────────────────────────────────────────
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

  // ── Chargement initial ──────────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      try {
        const [emp, bonusData, tmpls] = await Promise.all([
          api.get<any>(`/employees/${params.id}`),
          api.get<any>(`/employee-bonuses?employeeId=${params.id}`),
          api.get<any>('/bonus-templates'),
        ]);
        setEmployee(emp);
        // Le service retourne déjà les champs mappés (isRecurring, amount, source, description...)
        const all: Bonus[] = Array.isArray(bonusData) ? bonusData : bonusData?.data || [];
        setBonuses(all);
        const tmplList: BonusTemplate[] = Array.isArray(tmpls) ? tmpls : tmpls?.data || [];
        setTemplates(tmplList.filter(t => t.isActive !== false));
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [params.id]);

  // ── Ouvrir modal ────────────────────────────────────────────────────────────
  const openModal = () => {
    setSelectedTemplate(null);
    setCustomAmount('');
    setIsRecurring(true);
    setTargetMonth(now.getMonth() + 1);
    setTargetYear(now.getFullYear());
    setShowModal(true);
  };

  // ── Choisir un template → pré-remplir ──────────────────────────────────────
  const handleTemplateChange = (tmplId: string) => {
    const tmpl = templates.find(t => t.id === tmplId) || null;
    setSelectedTemplate(tmpl);
    if (tmpl) {
      setIsRecurring(tmpl.isRecurring);
      setCustomAmount(tmpl.defaultAmount != null ? String(tmpl.defaultAmount) : '');
    }
  };

  // ── Ajouter la prime ────────────────────────────────────────────────────────
  const handleAdd = async () => {
    if (!selectedTemplate) {
      alert.error('Prime requise', 'Choisissez une prime dans le catalogue.');
      return;
    }
    const needsAmount = selectedTemplate.defaultAmount == null && selectedTemplate.defaultPercentage == null;
    if (needsAmount && !customAmount) {
      alert.error('Montant requis', 'Cette prime nécessite un montant.');
      return;
    }

    setIsSaving(true);
    try {
      const payload: any = {
        employeeId:      params.id,
        bonusType:       selectedTemplate.name,
        bonusTemplateId: selectedTemplate.id,
        isRecurring,
        isTaxable:       selectedTemplate.isTaxable,
        isCnss:          selectedTemplate.isCnss,
        description:     selectedTemplate.description || null,
      };

      if (!isRecurring) {
        payload.targetMonth = targetMonth;
        payload.targetYear  = targetYear;
      }

      if (customAmount) {
        payload.amount = parseFloat(customAmount);
      } else if (selectedTemplate.defaultAmount != null) {
        payload.amount = selectedTemplate.defaultAmount;
      } else if (selectedTemplate.defaultPercentage != null) {
        payload.percentage      = selectedTemplate.defaultPercentage;
        payload.baseCalculation = selectedTemplate.baseCalculation;
      }

      // Le service retourne l'objet mappé directement
      const created = await api.post<Bonus>('/employee-bonuses', payload);
      setBonuses(prev => [created as Bonus, ...prev]);
      alert.success('Prime attribuée', `"${selectedTemplate.name}" ajoutée avec succès.`);
      setShowModal(false);
    } catch (e: any) {
      alert.error('Erreur', e?.message || "Impossible d'ajouter la prime.");
    } finally {
      setIsSaving(false);
    }
  };

  // ── Supprimer ────────────────────────────────────────────────────────────────
  const handleDelete = async (id: string, name: string) => {
    setDeletingId(id);
    try {
      await api.delete(`/employee-bonuses/${id}`);
      setBonuses(prev => prev.filter(b => b.id !== id));
      alert.success('Supprimée', `"${name}" a été retirée.`);
    } catch (e: any) {
      alert.error('Erreur', e?.message || 'Impossible de supprimer.');
    } finally {
      setDeletingId(null);
    }
  };

  // ── Calculs ──────────────────────────────────────────────────────────────────
  const manualBonuses = bonuses.filter(b => b.source === 'MANUAL');
  const autoBonuses   = bonuses.filter(b => b.source === 'AUTOMATIC');
  const totalMensuel  = manualBonuses
    .filter(b => b.isRecurring && b.amount)
    .reduce((s, b) => s + (b.amount || 0), 0);
  const getMonthLabel = (m?: number) => MONTHS.find(x => x.value === m)?.label || '';

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="animate-spin text-cyan-500" size={40} />
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

      {/* Titre + profil employé */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
          <Gift size={28} className="text-cyan-500" />
          Primes de {employee?.firstName} {employee?.lastName}
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          Choisissez depuis le catalogue entreprise · Montants ajustables par employé.
        </p>
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

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-panel rounded-2xl p-5 flex items-center gap-4">
          <div className="w-12 h-12 bg-cyan-100 dark:bg-cyan-900/30 rounded-xl flex items-center justify-center">
            <Hand size={22} className="text-cyan-500" />
          </div>
          <div>
            <p className="text-xs text-slate-400 uppercase font-bold">Primes manuelles</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{manualBonuses.length}</p>
          </div>
        </div>
        <div className="glass-panel rounded-2xl p-5 flex items-center gap-4">
          <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center">
            <Zap size={22} className="text-purple-500" />
          </div>
          <div>
            <p className="text-xs text-slate-400 uppercase font-bold">Automatiques</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{autoBonuses.length}</p>
          </div>
        </div>
        <div className="glass-panel rounded-2xl p-5 flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center">
            <DollarSign size={22} className="text-emerald-500" />
          </div>
          <div>
            <p className="text-xs text-slate-400 uppercase font-bold">Total mensuel fixe</p>
            <p className="text-xl font-bold text-slate-900 dark:text-white font-mono">
              {totalMensuel.toLocaleString()}
              <span className="text-xs font-normal text-slate-400 ml-1">FCFA</span>
            </p>
          </div>
        </div>
      </div>

      {/* ── PRIMES MANUELLES ── */}
      <section>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 bg-cyan-100 dark:bg-cyan-900/30 rounded-lg flex items-center justify-center">
            <Hand size={16} className="text-cyan-500" />
          </div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Primes attribuées</h2>
          <span className="text-xs text-cyan-600 bg-cyan-50 dark:bg-cyan-900/20 dark:text-cyan-400 px-2 py-0.5 rounded-full font-bold border border-cyan-200 dark:border-cyan-800">
            {manualBonuses.length} prime{manualBonuses.length !== 1 ? 's' : ''}
          </span>
        </div>

        {manualBonuses.length === 0 ? (
          <div className="glass-panel rounded-2xl p-10 text-center">
            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <Gift size={28} className="text-slate-400" />
            </div>
            <p className="text-slate-500 dark:text-slate-400 font-medium mb-2">Aucune prime attribuée</p>
            <p className="text-xs text-slate-400 mb-5">Attribuez des primes depuis le catalogue entreprise.</p>
            <button onClick={openModal}
              className="px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-sky-500 text-white font-bold rounded-xl text-sm flex items-center gap-2 mx-auto">
              <Plus size={16} /> Attribuer une prime
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {manualBonuses.map(bonus => (
                <motion.div key={bonus.id}
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -20 }}
                  className="glass-panel rounded-xl p-5 flex items-center gap-5">
                  <div className="w-12 h-12 bg-cyan-100 dark:bg-cyan-900/30 rounded-xl flex items-center justify-center shrink-0">
                    <Gift size={22} className="text-cyan-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <p className="font-bold text-slate-900 dark:text-white">{bonus.bonusType}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                        bonus.isRecurring
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                          : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border border-amber-200 dark:border-amber-800'
                      }`}>
                        {bonus.isRecurring ? 'Récurrente' : 'Ponctuelle'}
                      </span>
                      {!bonus.isRecurring && bonus.targetMonth && bonus.targetYear && (
                        <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400 border border-sky-200 dark:border-sky-800 flex items-center gap-1">
                          <Calendar size={10} />
                          {getMonthLabel(bonus.targetMonth)} {bonus.targetYear}
                        </span>
                      )}
                      <FiscalBadges isTaxable={bonus.isTaxable} isCnss={bonus.isCnss} />
                    </div>
                    {bonus.description && (
                      <p className="text-xs text-slate-500 dark:text-slate-400">{bonus.description}</p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    {bonus.amount != null && (
                      <p className="font-bold text-lg text-slate-900 dark:text-white font-mono">
                        +{bonus.amount.toLocaleString()} <span className="text-xs text-slate-400">FCFA</span>
                      </p>
                    )}
                    {bonus.percentage != null && (
                      <p className="font-bold text-lg text-purple-600 dark:text-purple-400">
                        +{bonus.percentage}%{' '}
                        <span className="text-xs text-slate-400">
                          {bonus.baseCalculation === 'GROSS_SALARY' ? 'du brut' : 'du base'}
                        </span>
                      </p>
                    )}
                  </div>
                  <button onClick={() => handleDelete(bonus.id, bonus.bonusType)}
                    disabled={deletingId === bonus.id}
                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all">
                    {deletingId === bonus.id
                      ? <Loader2 className="animate-spin" size={18} />
                      : <Trash2 size={18} />}
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Lien catalogue */}
            <button onClick={() => router.push(bp(`/parametres/primes?back=${encodeURIComponent(backUrl)}`))}
              className="w-full flex items-center justify-between p-4 mt-2 rounded-xl border border-dashed border-cyan-300 dark:border-cyan-700 bg-cyan-50/50 dark:bg-cyan-900/10 hover:bg-cyan-50 dark:hover:bg-cyan-900/20 transition-all group">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-cyan-100 dark:bg-cyan-900/30 rounded-xl flex items-center justify-center">
                  <Settings2 size={16} className="text-cyan-500" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-bold text-cyan-700 dark:text-cyan-300">Personnaliser le catalogue</p>
                  <p className="text-xs text-cyan-500 dark:text-cyan-400">Ajouter, modifier ou supprimer des types de primes</p>
                </div>
              </div>
              <ChevronRight size={16} className="text-cyan-400 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        )}
      </section>

      {/* ── PRIMES AUTOMATIQUES ── */}
      {autoBonuses.length > 0 && (
        <section>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
              <Zap size={16} className="text-purple-500" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Primes Automatiques</h2>
            <span className="text-xs text-purple-600 bg-purple-50 dark:bg-purple-900/20 dark:text-purple-400 px-2 py-0.5 rounded-full font-bold border border-purple-200 dark:border-purple-800">
              Convention Collective
            </span>
          </div>
          <div className="space-y-3">
            {autoBonuses.map(bonus => (
              <div key={bonus.id}
                className="glass-panel rounded-xl p-5 flex items-center gap-5 border-l-4 border-l-purple-500">
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center shrink-0">
                  <Zap size={22} className="text-purple-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-bold text-slate-900 dark:text-white">{bonus.bonusType}</p>
                    <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 border border-purple-200 dark:border-purple-800 flex items-center gap-1">
                      <Zap size={10} /> Auto
                    </span>
                    <FiscalBadges isTaxable={bonus.isTaxable} isCnss={bonus.isCnss} />
                  </div>
                  {bonus.description && <p className="text-xs text-slate-500 mt-0.5">{bonus.description}</p>}
                </div>
                <div className="text-right shrink-0">
                  {bonus.amount != null && (
                    <p className="font-bold text-lg text-slate-900 dark:text-white font-mono">
                      +{bonus.amount.toLocaleString()} <span className="text-xs text-slate-400">FCFA</span>
                    </p>
                  )}
                  {bonus.percentage != null && (
                    <p className="font-bold text-lg text-purple-600 dark:text-purple-400">
                      +{bonus.percentage}% <span className="text-xs text-slate-400">du base</span>
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Info */}
      <div className="glass-panel rounded-2xl p-5 border border-cyan-200 dark:border-cyan-800 bg-cyan-50/50 dark:bg-cyan-900/10">
        <p className="text-sm text-cyan-800 dark:text-cyan-200 flex items-start gap-2">
          <AlertCircle size={16} className="shrink-0 mt-0.5" />
          <span>
            <strong>Rappel :</strong> Les primes récurrentes sont incluses dans chaque bulletin mensuel.
            Les primes ponctuelles s'appliquent uniquement sur le bulletin du mois cible.
            Les flags ITS et CNSS sont hérités du catalogue.
          </span>
        </p>
      </div>

      {/* ══════════════════════════════════════════════════════
          MODAL — Attribuer depuis le catalogue
      ══════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {showModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xl p-4"
            onClick={() => setShowModal(false)}>
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              onClick={e => e.stopPropagation()}
              className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-white/10 rounded-3xl p-8 max-w-md w-full shadow-2xl relative overflow-y-auto max-h-[90vh]">

              <button onClick={() => setShowModal(false)}
                className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
                <X size={20} />
              </button>

              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-cyan-100 dark:bg-cyan-900/30 text-cyan-500 rounded-full flex items-center justify-center">
                  <Gift size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">Attribuer une prime</h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {employee?.firstName} {employee?.lastName}
                  </p>
                </div>
              </div>

              <div className="space-y-5">

                {/* Catalogue */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                    Choisir dans le catalogue
                  </label>

                  {templates.length === 0 ? (
                    <div className="p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-xl text-center">
                      <p className="text-sm text-amber-700 dark:text-amber-300 font-medium mb-2">Catalogue vide</p>
                      <p className="text-xs text-amber-600 dark:text-amber-400 mb-3">
                        Créez d'abord des types de primes dans les paramètres.
                      </p>
                      <button onClick={() => { setShowModal(false); router.push(bp(`/parametres/primes?back=${encodeURIComponent(backUrl)}`)); }}
                        className="text-xs font-bold text-amber-700 dark:text-amber-300 underline">
                        Aller au catalogue →
                      </button>
                    </div>
                  ) : (
                    <select
                      value={selectedTemplate?.id || ''}
                      onChange={e => handleTemplateChange(e.target.value)}
                      className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none text-slate-900 dark:text-white font-medium">
                      <option value="">— Sélectionner une prime —</option>
                      {templates.map(t => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                          {t.defaultAmount != null ? ` — ${Number(t.defaultAmount).toLocaleString('fr-FR')} FCFA` : ''}
                          {t.defaultPercentage != null ? ` — ${t.defaultPercentage}%` : ''}
                        </option>
                      ))}
                    </select>
                  )}

                  {/* Aperçu du template sélectionné */}
                  {selectedTemplate && (
                    <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 flex items-center justify-between">
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{selectedTemplate.description || 'Aucune description'}</p>
                        <div className="mt-1 flex items-center gap-2">
                          <FiscalBadges isTaxable={selectedTemplate.isTaxable} isCnss={selectedTemplate.isCnss} />
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${
                            selectedTemplate.isRecurring
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}>
                            {selectedTemplate.isRecurring ? 'Récurrente' : 'Ponctuelle'}
                          </span>
                        </div>
                      </div>
                      {selectedTemplate.defaultAmount != null && (
                        <span className="text-sm font-black font-mono text-gray-700 dark:text-gray-200 ml-2">
                          {Number(selectedTemplate.defaultAmount).toLocaleString('fr-FR')} F
                        </span>
                      )}
                      {selectedTemplate.defaultPercentage != null && (
                        <span className="text-sm font-black font-mono text-purple-600 dark:text-purple-400 ml-2">
                          {selectedTemplate.defaultPercentage}%
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Montant personnalisé si aucun montant par défaut */}
                {selectedTemplate && selectedTemplate.defaultAmount == null && selectedTemplate.defaultPercentage == null && (
                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                      Montant pour cet employé (FCFA)
                    </label>
                    <input type="number" min="0" value={customAmount}
                      onChange={e => setCustomAmount(e.target.value)}
                      placeholder="Ex: 25 000"
                      className="w-full p-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none font-bold font-mono text-xl text-slate-900 dark:text-white" />
                  </div>
                )}

                {/* Ajustement optionnel si montant par défaut existe */}
                {selectedTemplate && selectedTemplate.defaultAmount != null && (
                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                      Ajuster le montant{' '}
                      <span className="text-xs font-normal text-gray-400">
                        (optionnel — défaut : {Number(selectedTemplate.defaultAmount).toLocaleString('fr-FR')} F)
                      </span>
                    </label>
                    <input type="number" min="0" value={customAmount}
                      onChange={e => setCustomAmount(e.target.value)}
                      placeholder={String(selectedTemplate.defaultAmount)}
                      className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none font-bold font-mono text-lg text-slate-900 dark:text-white" />
                  </div>
                )}

                {/* Fréquence */}
                {selectedTemplate && (
                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Fréquence</label>
                    <div className="grid grid-cols-2 gap-3">
                      <button type="button" onClick={() => setIsRecurring(true)}
                        className={`p-3 rounded-xl border-2 text-left transition-all ${
                          isRecurring
                            ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300'
                            : 'border-slate-200 dark:border-slate-700 text-slate-500'
                        }`}>
                        <div className="font-bold text-sm">Récurrente</div>
                        <div className="text-xs opacity-75 mt-0.5">Chaque mois</div>
                      </button>
                      <button type="button" onClick={() => setIsRecurring(false)}
                        className={`p-3 rounded-xl border-2 text-left transition-all ${
                          !isRecurring
                            ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300'
                            : 'border-slate-200 dark:border-slate-700 text-slate-500'
                        }`}>
                        <div className="font-bold text-sm">Ponctuelle</div>
                        <div className="text-xs opacity-75 mt-0.5">1 mois cible</div>
                      </button>
                    </div>
                  </div>
                )}

                {/* Mois cible si ponctuelle */}
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
                      <p className="text-xs text-amber-600 dark:text-amber-400 mt-1.5 flex items-center gap-1">
                        <AlertCircle size={11} />
                        Incluse uniquement dans le bulletin de {getMonthLabel(targetMonth)} {targetYear}.
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Lien catalogue */}
                <button onClick={() => { setShowModal(false); router.push(bp(`/parametres/primes?back=${encodeURIComponent(backUrl)}`)); }}
                  className="flex items-center gap-2 text-xs text-slate-400 hover:text-cyan-500 transition-colors">
                  <Settings2 size={12} />
                  Vous ne trouvez pas la prime souhaitée ? Gérer le catalogue →
                </button>

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