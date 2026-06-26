'use client';

// ============================================================================
// 📄 components/performance/CreateReviewModal.tsx
// Style purple cohérent avec la page existante
// ============================================================================

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Star, User, Calendar, MessageSquare,
  ChevronDown, Check, Loader2, Sparkles, ChevronRight,
} from 'lucide-react';
import { api } from '@/services/api';
import { FancySelect } from '@/components/ui/FancySelect';

const REVIEW_TYPES = [
  { id: 'ANNUAL',      label: 'Annuelle',           desc: 'Bilan de fin d\'année',       emoji: '📅' },
  { id: 'QUARTERLY',   label: 'Trimestrielle',      desc: 'Bilan du trimestre',          emoji: '📊' },
  { id: 'PROBATION',   label: "Fin de période d'essai", desc: 'Confirmation ou non',     emoji: '🔍' },
  { id: 'EXCEPTIONAL', label: 'Exceptionnelle',     desc: 'Évaluation ponctuelle',       emoji: '⭐' },
];

const CRITERIA_TEMPLATES = [
  { key: 'general',    label: 'Grille générale',         emoji: '📋' },
  { key: 'industrial', label: 'Industrielle / Pétrolière', emoji: '⚙️' },
  { key: 'commercial', label: 'Commerciale',              emoji: '💼' },
  { key: 'probation',  label: "Fin de période d'essai",  emoji: '🔍' },
];

const QUICK_SCORES = [1, 2, 3, 4, 5];

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  preselectedEmployeeId?: string;
}

export function CreateReviewModal({ isOpen, onClose, onSuccess, preselectedEmployeeId }: Props) {
  const [step, setStep]       = useState<'type' | 'criteria' | 'comments' | 'submitting' | 'success'>('type');
  const [employees, setEmp]   = useState<any[]>([]);
  const [loadingEmp, setLE]   = useState(false);
  const [loadingTpl, setLT]   = useState(false);
  const [error, setError]     = useState<string | null>(null);

  // Formulaire
  const [employeeId,   setEmployeeId]   = useState(preselectedEmployeeId ?? '');
  const [reviewType,   setReviewType]   = useState('ANNUAL');
  const [date,         setDate]         = useState(new Date().toISOString().split('T')[0]);
  const [criteria,     setCriteria]     = useState<any[]>([]);
  const [useCriteria,  setUseCriteria]  = useState(true);
  const [feedback,     setFeedback]     = useState('');
  const [strengths,    setStrengths]    = useState('');
  const [improvements, setImprovements] = useState('');
  const [nextGoals,    setNextGoals]    = useState('');
  const [quickScore,   setQuickScore]   = useState(0); // si pas de grille

  useEffect(() => {
    if (isOpen) { loadEmployees(); }
    else { reset(); }
  }, [isOpen]);

  const reset = () => {
    setStep('type'); setEmployeeId(preselectedEmployeeId ?? '');
    setReviewType('ANNUAL'); setDate(new Date().toISOString().split('T')[0]);
    setCriteria([]); setUseCriteria(true); setFeedback('');
    setStrengths(''); setImprovements(''); setNextGoals('');
    setQuickScore(0); setError(null);
  };

  const loadEmployees = async () => {
    setLE(true);
    try { setEmp(Array.isArray(await api.get<any[]>('/employees')) ? await api.get<any[]>('/employees') : []); }
    catch { setEmp([]); }
    finally { setLE(false); }
  };

  const loadTemplate = async (key: string) => {
    setLT(true);
    try {
      const tpl = await api.get<any>(`/performance/criteria/templates/${key}`);
      setCriteria(tpl.criteria.map((c: any) => ({ ...c, score: 0, comment: '' })));
    } catch { setError('Erreur chargement de la grille'); }
    finally { setLT(false); }
  };

  const updateCriterionScore = (id: string, score: number) => {
    setCriteria(c => c.map(x => x.id === id ? { ...x, score } : x));
  };

  const updateCriterionComment = (id: string, comment: string) => {
    setCriteria(c => c.map(x => x.id === id ? { ...x, comment } : x));
  };

  const calcOverall = () => {
    if (!criteria.length) return quickScore;
    const tw = criteria.reduce((s, c) => s + c.weight, 0);
    if (!tw) return 0;
    return Math.round(criteria.reduce((s, c) => s + c.score * c.weight, 0) / tw * 100) / 100;
  };

  const canGoNext = () => {
    if (step === 'type')     return !!employeeId;
    if (step === 'criteria') return useCriteria ? criteria.every(c => c.score > 0) : quickScore > 0;
    return true;
  };

  const handleSubmit = async () => {
    if (!employeeId) return;
    setStep('submitting');
    setError(null);
    try {
      await api.post('/performance/reviews', {
        employeeId,
        reviewType,
        date,
        criteria:    useCriteria && criteria.length ? criteria : undefined,
        rating:      !useCriteria ? quickScore : undefined,
        feedback:    feedback || undefined,
        strengths:   strengths || undefined,
        improvements: improvements || undefined,
        nextGoals:   nextGoals || undefined,
      });
      setStep('success');
      setTimeout(() => { onSuccess(); }, 1800);
    } catch (e: any) {
      setError(e?.message ?? 'Erreur lors de la création');
      setStep('comments');
    }
  };

  const overall = calcOverall();
  const scoreLbl = overall >= 4.5 ? 'Exceptionnel' : overall >= 3.5 ? 'Très bien' : overall >= 2.5 ? 'Bien' : overall >= 1.5 ? 'À améliorer' : overall > 0 ? 'Insuffisant' : '';
  const scoreColor = overall >= 4 ? 'text-emerald-600' : overall >= 3 ? 'text-blue-600' : overall >= 2 ? 'text-amber-600' : 'text-red-600';

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, y: 16 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 16 }}
          onClick={e => e.stopPropagation()}
          className="bg-white dark:bg-gray-800 rounded-3xl w-full max-w-2xl shadow-2xl border border-gray-100 dark:border-gray-700 overflow-hidden max-h-[92vh] flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-7 py-5 border-b border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-xl">
                <Star size={20} className="text-purple-600 fill-purple-600/30" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Nouvelle évaluation</h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  {step === 'type'     && 'Étape 1 — Sélection et type'}
                  {step === 'criteria' && 'Étape 2 — Notation'}
                  {step === 'comments' && 'Étape 3 — Commentaires'}
                  {step === 'submitting' && 'Enregistrement...'}
                  {step === 'success'  && 'Évaluation créée !'}
                </p>
              </div>
            </div>
            {step !== 'submitting' && step !== 'success' && (
              <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full text-gray-400 transition-colors">
                <X size={18} />
              </button>
            )}
          </div>

          {/* Corps */}
          <div className="flex-1 overflow-y-auto">

            {/* ── Étape 1 : type + employé ──────────────────────────────── */}
            {step === 'type' && (
              <div className="p-7 space-y-6">
                <div>
                  <FancySelect
                    label="Employé évalué *"
                    value={employeeId}
                    onChange={setEmployeeId}
                    icon={User}
                    options={(Array.isArray(employees) ? employees : []).filter((e: any) => preselectedEmployeeId ? e.id === preselectedEmployeeId : true).map((e: any) => ({
                      value: e.id,
                      label: `${e.firstName} ${e.lastName}${e.position ? ` — ${e.position}` : ''}`,
                    }))}
                    placeholder={preselectedEmployeeId ? undefined : "Qui évaluez-vous ?"}
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">
                    Type d'évaluation *
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {REVIEW_TYPES.map(t => (
                      <button
                        key={t.id}
                        onClick={() => setReviewType(t.id)}
                        className={`p-4 rounded-xl border-2 text-left transition-all hover:scale-[1.01]
                          ${reviewType === t.id
                            ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                            : 'border-gray-100 dark:border-gray-700 hover:border-gray-200'}`}
                      >
                        <span className="text-2xl mb-2 block">{t.emoji}</span>
                        <p className="font-bold text-sm text-gray-900 dark:text-white">{t.label}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{t.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                    <Calendar size={13} className="inline mr-1.5" />Date de l'entretien
                  </label>
                  <input
                    type="date"
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    className="w-full p-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700/50 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/30"
                  />
                </div>
              </div>
            )}

            {/* ── Étape 2 : notation ─────────────────────────────────────── */}
            {step === 'criteria' && (
              <div className="p-7 space-y-6">

                {/* Toggle grille vs score rapide */}
                <div className="flex items-center gap-3 p-1 bg-gray-100 dark:bg-gray-700 rounded-xl w-fit">
                  <button
                    onClick={() => setUseCriteria(true)}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all
                      ${useCriteria ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500'}`}
                  >
                    Grille de critères
                  </button>
                  <button
                    onClick={() => setUseCriteria(false)}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all
                      ${!useCriteria ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500'}`}
                  >
                    Note globale
                  </button>
                </div>

                {/* Grille de critères */}
                {useCriteria && (
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                        Choisir une grille prédéfinie
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        {CRITERIA_TEMPLATES.map(t => (
                          <button
                            key={t.key}
                            onClick={() => loadTemplate(t.key)}
                            disabled={loadingTpl}
                            className="flex items-center gap-2 p-3 border border-gray-200 dark:border-gray-600 rounded-xl text-left hover:border-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all text-sm font-medium text-gray-700 dark:text-gray-300 disabled:opacity-50"
                          >
                            <span className="text-lg">{t.emoji}</span>
                            {t.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {criteria.length > 0 && (
                      <div className="space-y-3">
                        {criteria.map(c => (
                          <div key={c.id} className="bg-gray-50 dark:bg-gray-700/30 rounded-xl p-4">
                            <div className="flex items-center justify-between mb-2">
                              <div>
                                <p className="font-semibold text-sm text-gray-900 dark:text-white">{c.label}</p>
                                <p className="text-xs text-gray-400">Pondération : {c.weight}%</p>
                              </div>
                              {c.score > 0 && (
                                <span className={`text-lg font-bold ${c.score >= 4 ? 'text-emerald-600' : c.score >= 3 ? 'text-blue-600' : c.score >= 2 ? 'text-amber-600' : 'text-red-600'}`}>
                                  {c.score}/5
                                </span>
                              )}
                            </div>
                            {/* Score buttons */}
                            <div className="flex gap-1.5 mb-2">
                              {[1, 2, 3, 4, 5].map(s => (
                                <button
                                  key={s}
                                  onClick={() => updateCriterionScore(c.id, s)}
                                  className={`flex-1 py-2 rounded-lg font-bold text-sm border-2 transition-all
                                    ${c.score === s
                                      ? 'bg-purple-600 text-white border-purple-600 scale-105 shadow-md'
                                      : 'bg-white dark:bg-gray-700 text-gray-400 border-gray-200 dark:border-gray-600 hover:border-purple-300'}`}
                                >
                                  {s}
                                </button>
                              ))}
                            </div>
                            <input
                              type="text"
                              value={c.comment}
                              onChange={e => updateCriterionComment(c.id, e.target.value)}
                              placeholder="Commentaire optionnel..."
                              className="w-full px-3 py-1.5 text-xs border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700/50 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-purple-500/30 placeholder-gray-300"
                            />
                          </div>
                        ))}

                        {/* Score pondéré calculé */}
                        {overall > 0 && (
                          <div className="flex items-center justify-between p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl border border-purple-200 dark:border-purple-800">
                            <span className="font-semibold text-purple-700 dark:text-purple-300 text-sm">Score pondéré</span>
                            <div className="flex items-center gap-2">
                              <Star size={16} className="text-purple-600 fill-purple-300" />
                              <span className={`text-xl font-bold ${scoreColor}`}>{overall.toFixed(2)}/5</span>
                              <span className="text-xs text-purple-600 dark:text-purple-400">{scoreLbl}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {criteria.length === 0 && (
                      <div className="text-center py-8 text-gray-400">
                        <Sparkles size={32} className="mx-auto mb-2 opacity-30" />
                        <p className="text-sm">Sélectionnez une grille ci-dessus</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Note globale simple */}
                {!useCriteria && (
                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-4">
                      Note globale *
                    </label>
                    <div className="flex justify-between gap-3">
                      {QUICK_SCORES.map(s => (
                        <button
                          key={s}
                          onClick={() => setQuickScore(s)}
                          className={`flex-1 py-4 rounded-xl font-bold text-lg border-2 transition-all
                            ${quickScore === s
                              ? 'bg-purple-600 text-white border-purple-600 shadow-lg shadow-purple-500/30 scale-105'
                              : 'bg-white dark:bg-gray-700 text-gray-400 border-gray-200 dark:border-gray-600 hover:border-purple-300'}`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                    <div className="flex justify-between mt-2 px-1">
                      <span className="text-xs text-gray-400">Insuffisant</span>
                      <span className="text-xs text-gray-400">Exceptionnel</span>
                    </div>
                    {quickScore > 0 && (
                      <p className={`text-center mt-3 font-bold ${scoreColor}`}>{scoreLbl}</p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ── Étape 3 : commentaires ─────────────────────────────────── */}
            {step === 'comments' && (
              <div className="p-7 space-y-5">
                {[
                  { key: 'feedback',     label: 'Commentaire général',    value: feedback,     set: setFeedback,     placeholder: 'Bilan global de l\'évaluation...' },
                  { key: 'strengths',    label: '💪 Points forts',        value: strengths,    set: setStrengths,    placeholder: 'Ce que l\'employé fait très bien...' },
                  { key: 'improvements', label: '📈 Axes d\'amélioration', value: improvements, set: setImprovements, placeholder: 'Ce sur quoi l\'employé doit progresser...' },
                  { key: 'nextGoals',    label: '🎯 Objectifs suivants',   value: nextGoals,    set: setNextGoals,    placeholder: 'Objectifs pour la prochaine période...' },
                ].map(f => (
                  <div key={f.key}>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">{f.label}</label>
                    <textarea
                      value={f.value}
                      onChange={e => f.set(e.target.value)}
                      placeholder={f.placeholder}
                      rows={3}
                      className="w-full p-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700/50 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 resize-none text-sm placeholder-gray-300"
                    />
                  </div>
                ))}

                {error && (
                  <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-600 text-sm">
                    {error}
                  </div>
                )}
              </div>
            )}

            {/* ── Submitting ─────────────────────────────────────────────── */}
            {step === 'submitting' && (
              <div className="py-16 text-center">
                <Loader2 size={36} className="animate-spin text-purple-600 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">Enregistrement en cours...</p>
              </div>
            )}

            {/* ── Succès ─────────────────────────────────────────────────── */}
            {step === 'success' && (
              <div className="py-16 text-center">
                <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 rounded-2xl flex items-center justify-center mx-auto mb-5">
                  <Check size={40} className="text-emerald-600" strokeWidth={2.5} />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Évaluation créée !</h3>
                <p className="text-gray-400 text-sm">Vous pouvez la soumettre à l'employé quand vous êtes prêt.</p>
              </div>
            )}
          </div>

          {/* Footer navigation */}
          {(step === 'type' || step === 'criteria' || step === 'comments') && (
            <div className="px-7 py-5 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 flex gap-3">
              <button
                onClick={step === 'type' ? onClose : () => setStep(step === 'comments' ? 'criteria' : 'type')}
                className="flex-1 py-3 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-bold rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-sm"
              >
                {step === 'type' ? 'Annuler' : '← Retour'}
              </button>

              {step !== 'comments' && (
                <button
                  onClick={() => setStep(step === 'type' ? 'criteria' : 'comments')}
                  disabled={!canGoNext()}
                  className="flex-1 py-3 bg-purple-600 hover:bg-purple-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-colors text-sm flex items-center justify-center gap-2"
                >
                  Suivant <ChevronRight size={16} />
                </button>
              )}

              {step === 'comments' && (
                <button
                  onClick={handleSubmit}
                  className="flex-1 py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl transition-colors text-sm flex items-center justify-center gap-2"
                >
                  <Check size={16} /> Enregistrer
                </button>
              )}
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}