'use client';
import { PerformanceOverlay } from '@/components/performance/PerformanceOverlay';


// ============================================================================
// 📄 components/performance/CreateReviewModal.tsx
// Style purple cohérent avec la page existante
// ============================================================================

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Star, User, Calendar, MessageSquare,
  ChevronDown, Check, Sparkles, ChevronRight,
} from 'lucide-react';
import { KonzaLoader } from '@/components/ui/KonzaLoader';
import { api } from '@/services/api';
import { FancySelect } from '@/components/ui/FancySelect';

const REVIEW_TYPES = [
  { id: 'ANNUAL',      label: 'Annuelle',           desc: 'Bilan de fin d\'année',        },
  { id: 'QUARTERLY',   label: 'Trimestrielle',      desc: 'Bilan du trimestre',           },
  { id: 'PROBATION',   label: "Fin de période d'essai", desc: 'Confirmation ou non',      },
  { id: 'EXCEPTIONAL', label: 'Exceptionnelle',     desc: 'Évaluation ponctuelle',        },
];

const CRITERIA_TEMPLATES = [
  { key: 'general',    label: 'Grille générale',          },
  { key: 'industrial', label: 'Industrielle / Pétrolière',  },
  { key: 'commercial', label: 'Commerciale',               },
  { key: 'probation',  label: "Fin de période d'essai",   },
];

const QUICK_SCORES = [1, 2, 3, 4, 5];

// Grilles renvoyées par l'API : intégrées (incl. « Facteurs de succès ») + modèles de l'entreprise
interface GridTpl { id: string; name: string; jobTitle?: string | null; criteria: any[] }
interface Grids { builtin: GridTpl[]; custom: GridTpl[] }

const normTitle = (s?: string | null) => (s ?? '').trim().toLowerCase();

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
  const [grids,        setGrids]        = useState<Grids | null>(null);
  const [gridId,       setGridId]       = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) { loadEmployees(); loadGrids(); }
    else { reset(); }
  }, [isOpen]);

  const reset = () => {
    setStep('type'); setEmployeeId(preselectedEmployeeId ?? '');
    setReviewType('ANNUAL'); setDate(new Date().toISOString().split('T')[0]);
    setCriteria([]); setUseCriteria(true); setFeedback('');
    setStrengths(''); setImprovements(''); setNextGoals('');
    setQuickScore(0); setError(null); setGridId(null);
  };

  const loadGrids = async () => {
    try { setGrids(await api.get<Grids>('/performance/templates')); }
    catch { setGrids(null); } // repli : les 4 grilles historiques ci-dessous
  };

  const applyGrid = (g: GridTpl) => {
    setGridId(g.id);
    setCriteria(g.criteria.map((c: any) => ({
      id: c.id, label: c.label, description: c.description,
      weight: Number(c.weight), score: 0, comment: '',
    })));
  };

  const loadEmployees = async () => {
    setLE(true);
    try { const res = await api.get<any[]>('/employees/simple'); setEmp(Array.isArray(res) ? res : []); }
    catch { setEmp([]); }
    finally { setLE(false); }
  };

  const loadTemplate = async (key: string) => {
    setLT(true);
    try {
      setGridId(`builtin:${key}`);
      const tpl = await api.get<any>(`/performance/criteria/templates/${key}`);
      setCriteria(tpl.criteria.map((c: any) => ({ ...c, score: 0, comment: '' })));
    } catch { setError('Erreur chargement de la grille'); }
    finally { setLT(false); }
  };

  const selectedEmp = employees.find((e: any) => e.id === employeeId);
  const isRecommended = (g: GridTpl) =>
    !!g.jobTitle && !!selectedEmp?.position && normTitle(g.jobTitle) === normTitle(selectedEmp.position);

  // Arrivé à l'étape de notation sans grille choisie : si un modèle de l'entreprise correspond
  // au poste de l'employé, on le charge directement (modifiable en un clic).
  useEffect(() => {
    if (step !== 'criteria' || !useCriteria || criteria.length > 0 || !grids) return;
    const match = grids.custom.find(isRecommended);
    if (match) applyGrid(match);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, grids, employeeId]);

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
  const scoreColor = overall >= 4 ? 'text-[var(--success-text)]' : overall >= 3 ? 'text-[var(--action)]' : overall >= 2 ? 'text-[var(--warning-text)]' : 'text-[var(--danger-text)]';

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <PerformanceOverlay
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-[rgb(0_0_0_/.45)] p-4"
        onClose={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, y: 16 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 16 }}
          onClick={e => e.stopPropagation()}
          className="bg-[var(--surface)] rounded-3xl w-full max-w-2xl shadow-2xl border border-[var(--border)] overflow-hidden max-h-[92vh] flex flex-col performance-card"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-7 py-5 border-b border-[var(--border)]">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[var(--brand-soft)] rounded-xl">
                <Star strokeWidth={1.5} size={20} className="text-[var(--action)] fill-[var(--action)]" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-[var(--text)]">Nouvelle évaluation</h2>
                <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                  {step === 'type'     && 'Étape 1 — Sélection et type'}
                  {step === 'criteria' && 'Étape 2 — Notation'}
                  {step === 'comments' && 'Étape 3 — Commentaires'}
                  {step === 'submitting' && 'Enregistrement...'}
                  {step === 'success'  && 'Évaluation créée !'}
                </p>
              </div>
            </div>
            {step !== 'submitting' && step !== 'success' && (
              <button onClick={onClose} className="p-2 hover:bg-[var(--surface-2)] rounded-full text-[var(--text-secondary)] transition-colors">
                <X strokeWidth={1.5} size={18} />
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
                  <label className="block text-sm font-semibold text-[var(--text)] mb-3">
                    Type d'évaluation *
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {REVIEW_TYPES.map(t => (
                      <button
                        key={t.id}
                        onClick={() => setReviewType(t.id)}
                        className={`p-4 rounded-xl border-2 text-left transition-colors ${reviewType === t.id
                            ? 'border-[var(--border)] bg-[var(--brand-soft)]'
                            : 'border-[var(--border)] hover:border-[var(--border)]'}`}
                      >
                        <span className="text-2xl mb-2 block"><Star size={18} strokeWidth={1.5} aria-hidden="true" /></span>
                        <p className="font-semibold text-sm text-[var(--text)]">{t.label}</p>
                        <p className="text-xs text-[var(--text-secondary)] mt-0.5">{t.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[var(--text)] mb-2">
                    <Calendar strokeWidth={1.5} size={13} className="inline mr-1.5" />Date de l'entretien
                  </label>
                  <input
                    type="date"
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    className="w-full p-3 border border-[var(--border)] rounded-xl bg-[var(--surface)] text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--focus)]"
                  />
                </div>
              </div>
            )}

            {/* ── Étape 2 : notation ─────────────────────────────────────── */}
            {step === 'criteria' && (
              <div className="p-7 space-y-6">

                {/* Toggle grille vs score rapide */}
                <div className="flex items-center gap-3 p-1 bg-[var(--surface-2)] rounded-xl w-fit">
                  <button
                    onClick={() => setUseCriteria(true)}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${useCriteria ? 'bg-[var(--surface)] text-[var(--text)] shadow-sm' : 'text-[var(--text-secondary)]'}`}
                  >
                    Grille de critères
                  </button>
                  <button
                    onClick={() => setUseCriteria(false)}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${!useCriteria ? 'bg-[var(--surface)] text-[var(--text)] shadow-sm' : 'text-[var(--text-secondary)]'}`}
                  >
                    Note globale
                  </button>
                </div>

                {/* Grille de critères */}
                {useCriteria && (
                  <div className="space-y-4">
                    <div className="space-y-4">
                      {grids && grids.custom.length > 0 && (
                        <div>
                          <p className="text-sm font-semibold text-[var(--text)] mb-2">Vos modèles</p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {grids.custom.map(g => (
                              <button
                                key={g.id}
                                onClick={() => applyGrid(g)}
                                className={`flex items-center gap-2 p-3 border rounded-xl text-left transition-colors text-sm font-medium text-[var(--text)] ${gridId === g.id ? 'border-[var(--border)] bg-[var(--brand-soft)]' : 'border-[var(--border)] hover:border-[var(--border)] hover:bg-[var(--brand-soft)]'}`}
                              >
                                <span className="text-lg"></span>
                                <span className="min-w-0">
                                  <span className="block truncate">{g.name}</span>
                                  {g.jobTitle && <span className="block text-xs text-[var(--text-secondary)] truncate">Poste : {g.jobTitle}</span>}
                                </span>
                                {isRecommended(g) && (
                                  <span className="ml-auto shrink-0 px-2 py-0.5 rounded-md bg-[color-mix(in_srgb,var(--green)_12%,var(--surface))] text-[var(--success-text)] text-[11px] font-semibold">Recommandé</span>
                                )}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      <div>
                        <p className="text-sm font-semibold text-[var(--text)] mb-2">
                          {grids && grids.custom.length > 0 ? 'Grilles intégrées' : 'Choisir une grille prédéfinie'}
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {grids
                            ? grids.builtin.map(g => (
                                <button
                                  key={g.id}
                                  onClick={() => applyGrid(g)}
                                  className={`flex items-center gap-2 p-3 border rounded-xl text-left transition-colors text-sm font-medium text-[var(--text)] ${gridId === g.id ? 'border-[var(--border)] bg-[var(--brand-soft)]' : 'border-[var(--border)] hover:border-[var(--border)] hover:bg-[var(--brand-soft)]'}`}
                                >
                                  <span className="text-lg"><Star size={18} strokeWidth={1.5} aria-hidden="true" /></span>
                                  {g.name}
                                </button>
                              ))
                            : CRITERIA_TEMPLATES.map(t => (
                                <button
                                  key={t.key}
                                  onClick={() => loadTemplate(t.key)}
                                  disabled={loadingTpl}
                                  className="flex items-center gap-2 p-3 border border-[var(--border)] rounded-xl text-left hover:border-[var(--border)] hover:bg-[var(--brand-soft)] transition-colors text-sm font-medium text-[var(--text)] disabled:opacity-50"
                                >
                                  <span className="text-lg"><Star size={18} strokeWidth={1.5} aria-hidden="true" /></span>
                                  {t.label}
                                </button>
                              ))}
                        </div>
                      </div>
                    </div>

                    {criteria.length > 0 && (
                      <div className="space-y-3">
                        {criteria.map(c => (
                          <div key={c.id} className="bg-[var(--surface-2)] rounded-xl p-4">
                            <div className="flex items-center justify-between mb-2">
                              <div>
                                <p className="font-semibold text-sm text-[var(--text)]">{c.label}</p>
                                <p className="text-xs text-[var(--text-secondary)]">Pondération : {c.weight}%</p>
                              </div>
                              {c.score > 0 && (
                                <span className={`text-lg font-semibold ${c.score >= 4 ? 'text-[var(--success-text)]' : c.score >= 3 ? 'text-[var(--action)]' : c.score >= 2 ? 'text-[var(--warning-text)]' : 'text-[var(--danger-text)]'}`}>
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
                                  className={`flex-1 py-2 rounded-lg font-semibold text-sm border-2 transition-colors ${c.score === s
                                      ? 'bg-[var(--brand)] text-[var(--on-brand)] border-[var(--border)] shadow-md'
                                      : 'bg-[var(--surface)] text-[var(--text-secondary)] border-[var(--border)] hover:border-[var(--border)]'}`}
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
                              className="w-full px-3 py-1.5 text-xs border border-[var(--border)] rounded-lg bg-[var(--surface)] text-[var(--text)] focus:outline-none focus:ring-1 focus:ring-[var(--focus)] placeholder-gray-300"
                            />
                          </div>
                        ))}

                        {/* Score pondéré calculé */}
                        {overall > 0 && (
                          <div className="flex items-center justify-between p-4 bg-[var(--brand-soft)] rounded-xl border border-[var(--border)]">
                            <span className="font-semibold text-[var(--action)] text-sm">Score pondéré</span>
                            <div className="flex items-center gap-2">
                              <Star strokeWidth={1.5} size={16} className="text-[var(--action)] fill-[var(--action)]" />
                              <span className={`text-xl font-semibold ${scoreColor}`}>{overall.toFixed(2)}/5</span>
                              <span className="text-xs text-[var(--action)]">{scoreLbl}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {criteria.length === 0 && (
                      <div className="text-center py-8 text-[var(--text-secondary)]">
                        <Sparkles strokeWidth={1.5} size={32} className="mx-auto mb-2 opacity-30" />
                        <p className="text-sm">Sélectionnez une grille ci-dessus</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Note globale simple */}
                {!useCriteria && (
                  <div>
                    <label className="block text-sm font-semibold text-[var(--text)] mb-4">
                      Note globale *
                    </label>
                    <div className="flex justify-between gap-3">
                      {QUICK_SCORES.map(s => (
                        <button
                          key={s}
                          onClick={() => setQuickScore(s)}
                          className={`flex-1 py-4 rounded-xl font-semibold text-lg border-2 transition-colors ${quickScore === s
                              ? 'bg-[var(--brand)] text-[var(--on-brand)] border-[var(--border)] shadow-lg'
                              : 'bg-[var(--surface)] text-[var(--text-secondary)] border-[var(--border)] hover:border-[var(--border)]'}`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                    <div className="flex justify-between mt-2 px-1">
                      <span className="text-xs text-[var(--text-secondary)]">Insuffisant</span>
                      <span className="text-xs text-[var(--text-secondary)]">Exceptionnel</span>
                    </div>
                    {quickScore > 0 && (
                      <p className={`text-center mt-3 font-semibold ${scoreColor}`}>{scoreLbl}</p>
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
                    <label className="block text-sm font-semibold text-[var(--text)] mb-2">{f.label}</label>
                    <textarea
                      value={f.value}
                      onChange={e => f.set(e.target.value)}
                      placeholder={f.placeholder}
                      rows={3}
                      className="w-full p-3 border border-[var(--border)] rounded-xl bg-[var(--surface)] text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--focus)] resize-none text-sm placeholder-gray-300"
                    />
                  </div>
                ))}

                {error && (
                  <div className="p-3 bg-[color-mix(in_srgb,var(--danger)_10%,var(--surface))] border border-[var(--border)] rounded-xl text-[var(--danger-text)] text-sm">
                    {error}
                  </div>
                )}
              </div>
            )}

            {/* ── Submitting ─────────────────────────────────────────────── */}
            {step === 'submitting' && (
              <KonzaLoader variant="section" label="Enregistrement en cours…" />
            )}

            {/* ── Succès ─────────────────────────────────────────────────── */}
            {step === 'success' && (
              <div className="py-16 text-center">
                <div className="w-20 h-20 bg-[color-mix(in_srgb,var(--green)_12%,var(--surface))] rounded-2xl flex items-center justify-center mx-auto mb-5">
                  <Check size={40} className="text-[var(--success-text)]" strokeWidth={2.5} />
                </div>
                <h3 className="text-xl font-semibold text-[var(--text)] mb-2">Évaluation créée !</h3>
                <p className="text-[var(--text-secondary)] text-sm">Vous pouvez la soumettre à l'employé quand vous êtes prêt.</p>
              </div>
            )}
          </div>

          {/* Footer navigation */}
          {(step === 'type' || step === 'criteria' || step === 'comments') && (
            <div className="px-7 py-5 border-t border-[var(--border)] bg-[var(--surface-2)] flex gap-3">
              <button
                onClick={step === 'type' ? onClose : () => setStep(step === 'comments' ? 'criteria' : 'type')}
                className="flex-1 py-3 border border-[var(--border)] text-[var(--text)] font-semibold rounded-xl hover:bg-[var(--surface-2)] transition-colors text-sm"
              >
                {step === 'type' ? 'Annuler' : '← Retour'}
              </button>

              {step !== 'comments' && (
                <button
                  onClick={() => setStep(step === 'type' ? 'criteria' : 'comments')}
                  disabled={!canGoNext()}
                  className="flex-1 py-3 bg-[var(--brand)] hover:bg-[var(--brand)] disabled:opacity-40 disabled:cursor-not-allowed text-[var(--on-brand)] font-semibold rounded-xl transition-colors text-sm flex items-center justify-center gap-2"
                >
                  Suivant <ChevronRight strokeWidth={1.5} size={16} />
                </button>
              )}

              {step === 'comments' && (
                <button
                  onClick={handleSubmit}
                  className="flex-1 py-3 bg-[var(--brand)] hover:bg-[var(--brand)] text-[var(--on-brand)] font-semibold rounded-xl transition-colors text-sm flex items-center justify-center gap-2"
                >
                  <Check strokeWidth={1.5} size={16} /> Enregistrer
                </button>
              )}
            </div>
          )}
        </motion.div>
      </PerformanceOverlay>
    </AnimatePresence>
  );
}