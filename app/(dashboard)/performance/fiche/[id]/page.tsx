'use client';

// ============================================================================
// 📄 app/(dashboard)/performance/fiche/[id]/page.tsx
// Fiche d'évaluation (équivalent de la fiche Excel), mobile-first :
//   • Manager  : note objectifs + facteurs, fixe les objectifs suivants, soumet
//   • Employé  : auto-évaluation (si activée), puis lecture + accusé de réception
//     avec droit de réponse
// Sauvegarde automatique (debounce) — rien n'est perdu si on quitte l'onglet.
// ============================================================================

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Loader2, Check, Send, Plus, Trash2, Printer, Target,
  MessageSquare, CheckCircle2, AlertTriangle, ThumbsUp, Cloud, CloudOff, UserCheck,
} from 'lucide-react';
import { api } from '@/services/api';
import PerformanceNav from '@/components/performance/PerformanceNav';
import { useBasePath } from '@/hooks/useBasePath';
import { ScorePicker } from '@/components/performance/ScorePicker';
import {
  Sheet, SheetGoal, SheetCriterion, STATUS_LABEL, fmtDate, sumWeights,
} from '@/components/performance/sheet-types';

type Tab = 'objectifs' | 'facteurs' | 'suivants' | 'synthese';
type SaveState = 'idle' | 'saving' | 'saved' | 'error';

const inputCls =
  'w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/40 focus:border-purple-400 disabled:opacity-70 disabled:bg-gray-50 dark:disabled:bg-gray-800';
const cardCls =
  'bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-4 sm:p-5';

// ─── Petits composants ───────────────────────────────────────────────────────

function WeightBadge({ items, label }: { items: Array<{ weight?: number | null }>; label: string }) {
  const total = sumWeights(items);
  const ok = Math.abs(total - 100) < 0.011;
  return (
    <div className={`flex items-center gap-2 text-sm font-medium rounded-xl px-3 py-2 ${ok
      ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400'
      : 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400'}`}>
      {ok ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
      <span>{label} : {total} % {ok ? '' : '(doit faire 100 %)'}</span>
    </div>
  );
}

function ScoreTile({ label, value, sub, big }: { label: string; value: number | null; sub?: string; big?: boolean }) {
  return (
    <div className={`rounded-2xl p-4 ${big ? 'bg-gradient-to-br from-purple-600 to-purple-800 text-white' : 'bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700'}`}>
      <p className={`text-xs font-medium ${big ? 'text-purple-200' : 'text-gray-500 dark:text-gray-400'}`}>{label}</p>
      <p className={`font-bold mt-1 ${big ? 'text-3xl' : 'text-2xl text-gray-900 dark:text-white'}`}>
        {value !== null && value > 0 ? value.toFixed(2) : '—'}
        <span className={`text-sm font-medium ml-1 ${big ? 'text-purple-200' : 'text-gray-400'}`}>/5</span>
      </p>
      {sub && <p className={`text-xs mt-1 ${big ? 'text-purple-100' : 'text-gray-400'}`}>{sub}</p>}
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function EvaluationSheetPage() {
  const params = useParams();
  const id = params?.id as string;
  const { bp } = useBasePath();

  const [sheet, setSheet] = useState<Sheet | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>('objectifs');
  const [save, setSave] = useState<SaveState>('idle');
  const [actionError, setActionError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [ackComment, setAckComment] = useState('');

  // Modifications en attente d'envoi (autosave)
  const emptyPending = () => ({
    goals: {} as Record<string, any>, criteria: {} as Record<string, any>,
    nextGoals: {} as Record<string, any>, text: {} as Record<string, any>,
    selfGoals: {} as Record<string, any>, selfCriteria: {} as Record<string, any>,
    selfComment: undefined as string | undefined,
  });
  const pending = useRef(emptyPending());
  const timer = useRef<any>(null);
  const modeRef = useRef<'edit' | 'self' | 'read'>('read');

  const endpoint = `/performance/reviews/${id}`;

  const load = useCallback(async () => {
    try {
      const data = await api.get<Sheet>(`${endpoint}/sheet`);
      setSheet(data);
      setLoadError(null);
    } catch (e: any) {
      setLoadError(e?.message || 'Impossible de charger cette évaluation');
    } finally {
      setLoading(false);
    }
  }, [endpoint]);

  useEffect(() => { load(); }, [load]);

  const mode: 'edit' | 'self' | 'read' = sheet?.permissions.canEdit
    ? 'edit' : sheet?.permissions.canSelfAssess ? 'self' : 'read';
  modeRef.current = mode;

  const hasPending = () => {
    const p = pending.current;
    return Object.keys(p.goals).length > 0 || Object.keys(p.criteria).length > 0 ||
      Object.keys(p.nextGoals).length > 0 || Object.keys(p.text).length > 0 ||
      Object.keys(p.selfGoals).length > 0 || Object.keys(p.selfCriteria).length > 0 ||
      p.selfComment !== undefined;
  };

  /** Envoie ce qui est en attente. Renvoie true si tout est sauvegardé. */
  const flush = useCallback(async (): Promise<boolean> => {
    clearTimeout(timer.current);
    if (!hasPending()) return true;
    const p = pending.current;
    pending.current = emptyPending();
    setSave('saving');
    try {
      if (modeRef.current === 'self') {
        const res = await api.patch<Sheet>(`${endpoint}/self-assessment`, {
          goals: Object.entries(p.selfGoals).map(([goalId, v]) => ({ goalId, ...v })),
          criteria: Object.entries(p.selfCriteria).map(([cid, v]) => ({ id: cid, ...v })),
          ...(p.selfComment !== undefined && { comment: p.selfComment }),
        });
        setSheet(prev => (prev ? { ...prev, selfAssessment: res.selfAssessment } : prev));
      } else {
        const res = await api.patch<Sheet>(`${endpoint}/sheet`, {
          goals: Object.entries(p.goals).map(([gid, v]) => ({ id: gid, ...v })),
          criteria: Object.entries(p.criteria).map(([cid, v]) => ({ id: cid, ...v })),
          nextGoals: Object.entries(p.nextGoals).map(([gid, v]) => ({ id: gid, ...v })),
          ...p.text,
        });
        // On ne remplace que les notes calculées : le reste est déjà à l'écran
        setSheet(prev => (prev ? {
          ...prev,
          review: {
            ...prev.review,
            objectivesScore: res.review.objectivesScore,
            competenciesScore: res.review.competenciesScore,
            overallScore: res.review.overallScore,
            verdict: res.review.verdict,
          },
        } : prev));
      }
      setSave('saved');
      setActionError(null);
      return true;
    } catch (e: any) {
      setSave('error');
      setActionError(e?.message || 'Sauvegarde impossible');
      return false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endpoint]);

  const schedule = () => {
    setSave('saving');
    clearTimeout(timer.current);
    timer.current = setTimeout(() => { flush(); }, 900);
  };

  // Sauvegarde à la fermeture de l'onglet / changement de page
  useEffect(() => {
    const onHide = () => { if (hasPending()) flush(); };
    document.addEventListener('visibilitychange', onHide);
    return () => {
      document.removeEventListener('visibilitychange', onHide);
      onHide();
      clearTimeout(timer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flush]);

  // ── Éditions manager ──────────────────────────────────────────────────────
  const editGoal = (
    gid: string,
    patch: Partial<SheetGoal> & { comment?: string },
    list: 'goals' | 'nextGoals',
  ) => {
    setSheet(prev => {
      if (!prev) return prev;
      const { comment, ...rest } = patch;
      const mapped: any = { ...rest, ...(comment !== undefined && { managerComment: comment }) };
      return { ...prev, [list]: prev[list].map(g => (g.id === gid ? { ...g, ...mapped } : g)) } as Sheet;
    });
    pending.current[list][gid] = { ...pending.current[list][gid], ...patch };
    schedule();
  };

  const editCriterion = (cid: string, patch: Partial<SheetCriterion>) => {
    setSheet(prev => prev && ({ ...prev, criteria: prev.criteria.map(c => (c.id === cid ? { ...c, ...patch } : c)) }));
    pending.current.criteria[cid] = { ...pending.current.criteria[cid], ...patch };
    schedule();
  };

  const editText = (field: 'strengths' | 'improvements' | 'feedback', value: string) => {
    setSheet(prev => prev && ({ ...prev, review: { ...prev.review, [field]: value } }));
    pending.current.text[field] = value;
    schedule();
  };

  /** Changements de structure (ajout / suppression) : envoi immédiat puis rechargement de la fiche */
  const structural = async (body: any) => {
    if (!(await flush())) return;
    setBusy(true);
    try {
      const res = await api.patch<Sheet>(`${endpoint}/sheet`, body);
      setSheet(res);
      setSave('saved');
    } catch (e: any) {
      setActionError(e?.message || 'Action impossible');
    } finally { setBusy(false); }
  };

  // ── Auto-évaluation ───────────────────────────────────────────────────────
  const selfGoal = (gid: string) => sheet?.selfAssessment?.goals?.find(g => g.goalId === gid);
  const selfCrit = (cid: string) => sheet?.selfAssessment?.criteria?.find(c => c.id === cid);

  const editSelf = (kind: 'goal' | 'crit', key: string, patch: { score?: number; comment?: string }) => {
    setSheet(prev => {
      if (!prev) return prev;
      const sa = prev.selfAssessment ?? { goals: [], criteria: [], comment: '' };
      const field = kind === 'goal' ? 'goals' : 'criteria';
      const idKey = kind === 'goal' ? 'goalId' : 'id';
      const list: any[] = [...(sa as any)[field]];
      const i = list.findIndex(x => x[idKey] === key);
      if (i >= 0) list[i] = { ...list[i], ...patch }; else list.push({ [idKey]: key, ...patch });
      return { ...prev, selfAssessment: { ...sa, [field]: list } as any };
    });
    const bucket = kind === 'goal' ? pending.current.selfGoals : pending.current.selfCriteria;
    bucket[key] = { ...bucket[key], ...patch };
    schedule();
  };

  const submitSelf = async () => {
    if (!(await flush())) return;
    setBusy(true); setActionError(null);
    try {
      const res = await api.patch<Sheet>(`${endpoint}/self-assessment`, { submit: true });
      setSheet(res);
    } catch (e: any) { setActionError(e?.message || 'Envoi impossible'); }
    finally { setBusy(false); }
  };

  // ── Soumission / accusé ───────────────────────────────────────────────────
  const submit = async () => {
    if (!sheet) return;
    if (!confirm(`Soumettre l'évaluation de ${sheet.review.employee.firstName} ${sheet.review.employee.lastName} ?\nL'employé sera notifié et vous ne pourrez plus la modifier.`)) return;
    if (!(await flush())) return;
    setBusy(true); setActionError(null);
    try {
      await api.patch(`${endpoint}/submit`, {});
      await load();
    } catch (e: any) { setActionError(e?.message || 'Soumission impossible'); }
    finally { setBusy(false); }
  };

  const acknowledge = async () => {
    setBusy(true); setActionError(null);
    try {
      await api.patch(`${endpoint}/acknowledge`, { comment: ackComment.trim() || undefined });
      await load();
    } catch (e: any) { setActionError(e?.message || "Impossible d'enregistrer"); }
    finally { setBusy(false); }
  };

  // ─── États de chargement ─────────────────────────────────────────────────
  if (loading) {
    return <div className="flex items-center justify-center py-32"><Loader2 className="animate-spin text-purple-600" size={32} /></div>;
  }
  if (loadError || !sheet) {
    return (
      <div className="max-w-xl mx-auto py-20 text-center space-y-4">
        <AlertTriangle className="mx-auto text-amber-500" size={36} />
        <p className="text-gray-700 dark:text-gray-300">{loadError ?? 'Évaluation introuvable'}</p>
        <Link href={bp('/performance')} className="inline-flex items-center gap-2 text-purple-600 font-bold"><ArrowLeft size={16} /> Retour aux évaluations</Link>
      </div>
    );
  }

  const { review, goals, criteria, nextGoals, permissions } = sheet;
  const editing = mode === 'edit';
  const selfMode = mode === 'self';
  const st = STATUS_LABEL[review.status];
  const initials = `${review.employee.firstName[0] ?? ''}${review.employee.lastName[0] ?? ''}`.toUpperCase();
  const showScores = !selfMode;
  const off100 = (items: Array<{ weight?: number | null }>) => Math.abs(sumWeights(items) - 100) > 0.011;
  const tabs: Array<{ key: Tab; label: string; show: boolean; warn?: boolean }> = [
    { key: 'objectifs', label: 'Objectifs', show: true, warn: editing && goals.length > 0 && off100(goals) },
    { key: 'facteurs', label: 'Facteurs de succès', show: criteria.length > 0, warn: editing && off100(criteria) },
    { key: 'suivants', label: 'Objectifs suivants', show: !selfMode && (editing || nextGoals.length > 0), warn: editing && nextGoals.length > 0 && off100(nextGoals) },
    { key: 'synthese', label: 'Synthèse', show: !selfMode },
  ];
  const visibleTabs = tabs.filter(t => t.show);
  const activeTab = visibleTabs.some(t => t.key === tab) ? tab : visibleTabs[0].key;

  // ─── Rendu d'un objectif ─────────────────────────────────────────────────
  const renderGoal = (g: SheetGoal, list: 'goals' | 'nextGoals') => {
    const isEval = list === 'goals';
    const sa = isEval ? selfGoal(g.id) : undefined;
    return (
      <div key={g.id} className={cardCls}>
        <div className="flex items-start gap-3">
          <div className="flex-1 min-w-0 space-y-2">
            {editing ? (
              <input className={`${inputCls} font-semibold`} value={g.title}
                onChange={e => editGoal(g.id, { title: e.target.value }, list)} placeholder="Intitulé de l'objectif" />
            ) : (
              <h3 className="font-bold text-gray-900 dark:text-white break-words">{g.title}</h3>
            )}
            {editing ? (
              <input className={inputCls} value={g.kpi ?? ''} placeholder="Livrables / KPI / preuves attendues"
                onChange={e => editGoal(g.id, { kpi: e.target.value }, list)} />
            ) : g.kpi ? (
              <p className="text-sm text-gray-500 dark:text-gray-400 break-words">{g.kpi}</p>
            ) : null}
          </div>
          <div className="flex flex-col items-end gap-2 shrink-0">
            {editing ? (
              <label className="flex items-center gap-1 text-sm text-gray-500">
                <input type="number" min={0} max={100} inputMode="decimal"
                  className={`${inputCls} w-20 text-center`} value={g.weight ?? 0}
                  onChange={e => editGoal(g.id, { weight: Number(e.target.value) }, list)} />%
              </label>
            ) : (
              <span className="px-2.5 py-1 rounded-lg bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs font-bold">{g.weight ?? 0} %</span>
            )}
            {editing && (
              <button type="button" aria-label="Supprimer"
                onClick={() => {
                  if (confirm('Supprimer cet objectif ?')) {
                    structural(isEval ? { removeGoalIds: [g.id] } : { nextGoals: [{ id: g.id, remove: true }] });
                  }
                }}
                className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                <Trash2 size={16} />
              </button>
            )}
          </div>
        </div>

        {!isEval && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
            <div>
              <p className="text-xs font-medium text-gray-500 mb-1">Échéance</p>
              {editing ? (
                <input type="date" className={inputCls} value={g.endDate ? g.endDate.slice(0, 10) : ''}
                  onChange={e => editGoal(g.id, { endDate: e.target.value }, list)} />
              ) : <p className="text-sm text-gray-700 dark:text-gray-300">{fmtDate(g.endDate)}</p>}
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 mb-1">Support / dépendances</p>
              {editing ? (
                <input className={inputCls} value={g.support ?? ''} onChange={e => editGoal(g.id, { support: e.target.value }, list)} />
              ) : <p className="text-sm text-gray-700 dark:text-gray-300">{g.support || '—'}</p>}
            </div>
          </div>
        )}

        {isEval && (
          <div className="mt-4 space-y-3">
            {selfMode ? (
              <>
                <ScorePicker levels={sheet.scoreLevels} value={sa?.score}
                  onChange={n => editSelf('goal', g.id, { score: n })} />
                <textarea rows={2} className={inputCls} placeholder="Votre commentaire (facultatif)" value={sa?.comment ?? ''}
                  onChange={e => editSelf('goal', g.id, { comment: e.target.value })} />
              </>
            ) : (
              <>
                <ScorePicker levels={sheet.scoreLevels} value={g.score} disabled={!editing}
                  hint={editing ? sa?.score : undefined} hintLabel="Auto-évaluation"
                  onChange={n => editGoal(g.id, { score: n }, list)} />
                {editing ? (
                  <textarea rows={2} className={inputCls} placeholder="Commentaire du responsable" value={g.managerComment ?? ''}
                    onChange={e => editGoal(g.id, { comment: e.target.value }, list)} />
                ) : g.managerComment ? (
                  <p className="text-sm text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-900/40 rounded-xl p-3 break-words">{g.managerComment}</p>
                ) : null}
                {editing && sa?.comment && (
                  <p className="text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 rounded-lg p-2.5 break-words">
                    <span className="font-bold">Employé :</span> {sa.comment}
                  </p>
                )}
              </>
            )}
          </div>
        )}
      </div>
    );
  };

  // ─── Rendu ───────────────────────────────────────────────────────────────
  return (
    <div className="max-w-4xl mx-auto pb-32 space-y-5 sm:space-y-6">
      <PerformanceNav />

      {/* Retour */}
      <div className="flex items-center justify-between print:hidden">
        <Link href={bp(permissions.isSelf ? '/performance/mon-espace' : '/performance')}
          className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-purple-600 transition-colors">
          <ArrowLeft size={16} /> Retour
        </Link>
        <button onClick={() => window.print()}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800">
          <Printer size={15} /> <span className="hidden sm:inline">Imprimer / PDF</span>
        </button>
      </div>

      {/* En-tête */}
      <div className={`${cardCls} flex flex-col sm:flex-row sm:items-center gap-4`}>
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-400 to-purple-700 flex items-center justify-center font-bold text-white shrink-0 shadow-sm">
            {review.employee.photoUrl ? <img referrerPolicy="no-referrer" src={review.employee.photoUrl} alt="" className="w-full h-full rounded-full object-cover" /> : initials}
          </div>
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white truncate">
              {review.employee.firstName} {review.employee.lastName}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
              {[review.employee.position, review.employee.department].filter(Boolean).join(' · ')}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="px-3 py-1 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 font-medium">{review.period}</span>
          <span className={`px-3 py-1 rounded-lg font-bold ${st.cls}`}>{st.label}</span>
          {review.reviewer && (
            <span className="text-xs text-gray-400">Évaluateur : {review.reviewer.firstName} {review.reviewer.lastName}</span>
          )}
        </div>
      </div>

      {/* Bandeaux d'état */}
      {selfMode && (
        <div className="rounded-2xl bg-purple-50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-800 p-4 text-sm text-purple-800 dark:text-purple-200 flex gap-3">
          <UserCheck size={20} className="shrink-0 mt-0.5" />
          <p>Auto-évaluation : notez-vous honnêtement sur chaque objectif et critère, de 1 à 5. Votre responsable la verra avant votre entretien. Vos réponses sont sauvegardées automatiquement.</p>
        </div>
      )}
      {mode === 'read' && review.status === 'DRAFT' && review.selfSubmittedAt && permissions.isSelf && (
        <div className="rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800 p-4 text-sm text-emerald-800 dark:text-emerald-200 flex gap-3">
          <CheckCircle2 size={20} className="shrink-0" /> <p>Votre auto-évaluation a été envoyée le {fmtDate(review.selfSubmittedAt)}. Votre responsable finalise maintenant l'évaluation.</p>
        </div>
      )}
      {editing && review.selfSubmittedAt && (
        <div className="rounded-2xl bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800 p-4 text-sm text-amber-800 dark:text-amber-200 flex gap-3">
          <UserCheck size={20} className="shrink-0" /> <p>L'employé a envoyé son auto-évaluation : elle apparaît en repère jaune sous chaque note.</p>
        </div>
      )}

      {/* Scores */}
      {showScores && (review.overallScore ?? 0) > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <ScoreTile label="Objectifs" value={review.objectivesScore} sub={`${review.cycle?.objectivesWeight ?? 80} % de la note`} />
          <ScoreTile label="Facteurs de succès" value={review.competenciesScore} sub={`${100 - (review.cycle?.objectivesWeight ?? 80)} % de la note`} />
          <div className="col-span-2 sm:col-span-1">
            <ScoreTile big label="Note finale" value={review.overallScore} sub={review.verdict ?? undefined} />
          </div>
        </div>
      )}

      {/* Onglets (défilent horizontalement sur mobile) */}
      <div className="sticky top-0 z-10 -mx-4 px-4 sm:mx-0 sm:px-0 py-2 bg-gray-50/90 dark:bg-gray-900/90 backdrop-blur print:hidden">
        <div className="flex gap-2 overflow-x-auto">
          {visibleTabs.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`relative whitespace-nowrap px-4 py-2.5 rounded-xl text-sm font-bold transition-colors
                ${activeTab === t.key ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-100 dark:border-gray-700'}`}>
              {t.label}
              {t.warn && <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-amber-400 border-2 border-white dark:border-gray-900" />}
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={activeTab} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">

          {/* A. OBJECTIFS */}
          {activeTab === 'objectifs' && (
            <>
              {editing && goals.length > 0 && <WeightBadge items={goals} label="Total des poids" />}
              {goals.length === 0 && (
                <div className={`${cardCls} text-center py-10 text-gray-500`}>
                  <Target className="mx-auto mb-3 text-gray-300" size={32} />
                  <p className="font-medium">Aucun objectif à évaluer</p>
                  {editing && <p className="text-sm mt-1">Ajoutez les objectifs fixés pour cette période.</p>}
                </div>
              )}
              {goals.map(g => renderGoal(g, 'goals'))}
              {editing && (
                <button disabled={busy} onClick={() => structural({ addGoals: [{ title: 'Nouvel objectif', weight: 0 }] })}
                  className="w-full py-3 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-600 text-gray-500 hover:border-purple-400 hover:text-purple-600 font-bold flex items-center justify-center gap-2 transition-colors">
                  <Plus size={18} /> Ajouter un objectif
                </button>
              )}
            </>
          )}

          {/* B. FACTEURS DE SUCCÈS */}
          {activeTab === 'facteurs' && (
            <>
              {editing && <WeightBadge items={criteria} label="Total des poids" />}
              {criteria.map(c => {
                const sa = selfCrit(c.id);
                return (
                  <div key={c.id} className={cardCls}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="font-bold text-gray-900 dark:text-white">{c.label}</h3>
                        {c.description && <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{c.description}</p>}
                      </div>
                      {editing ? (
                        <label className="flex items-center gap-1 text-sm text-gray-500 shrink-0">
                          <input type="number" min={0} max={100} inputMode="decimal" className={`${inputCls} w-20 text-center`}
                            value={c.weight} onChange={e => editCriterion(c.id, { weight: Number(e.target.value) })} />%
                        </label>
                      ) : (
                        <span className="px-2.5 py-1 rounded-lg bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs font-bold shrink-0">{c.weight} %</span>
                      )}
                    </div>
                    <div className="mt-4 space-y-3">
                      {selfMode ? (
                        <>
                          <ScorePicker levels={sheet.scoreLevels} value={sa?.score} onChange={n => editSelf('crit', c.id, { score: n })} />
                          <textarea rows={2} className={inputCls} placeholder="Votre commentaire (facultatif)" value={sa?.comment ?? ''}
                            onChange={e => editSelf('crit', c.id, { comment: e.target.value })} />
                        </>
                      ) : (
                        <>
                          <ScorePicker levels={sheet.scoreLevels} value={c.score} disabled={!editing}
                            hint={editing ? sa?.score : undefined} hintLabel="Auto-évaluation"
                            onChange={n => editCriterion(c.id, { score: n })} />
                          {editing ? (
                            <textarea rows={2} className={inputCls} placeholder="Commentaire du responsable" value={c.comment ?? ''}
                              onChange={e => editCriterion(c.id, { comment: e.target.value })} />
                          ) : c.comment ? (
                            <p className="text-sm text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-900/40 rounded-xl p-3 break-words">{c.comment}</p>
                          ) : null}
                          {editing && sa?.comment && (
                            <p className="text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 rounded-lg p-2.5 break-words">
                              <span className="font-bold">Employé :</span> {sa.comment}
                            </p>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
              {selfMode && (
                <div className={cardCls}>
                  <p className="font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2"><MessageSquare size={16} /> Message pour votre responsable</p>
                  <textarea rows={3} className={inputCls} placeholder="Ce que vous souhaitez ajouter (facultatif)"
                    value={sheet.selfAssessment?.comment ?? ''}
                    onChange={e => {
                      const v = e.target.value;
                      setSheet(prev => prev && ({
                        ...prev,
                        selfAssessment: { goals: [], criteria: [], ...(prev.selfAssessment ?? {}), comment: v },
                      }));
                      pending.current.selfComment = v;
                      schedule();
                    }} />
                </div>
              )}
            </>
          )}

          {/* C. OBJECTIFS SUIVANTS */}
          {activeTab === 'suivants' && (
            <>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Ces objectifs seront repris automatiquement comme objectifs à évaluer lors de la prochaine évaluation.
              </p>
              {editing && nextGoals.length > 0 && <WeightBadge items={nextGoals} label="Total des poids" />}
              {nextGoals.map(g => renderGoal(g, 'nextGoals'))}
              {editing && (
                <button disabled={busy} onClick={() => structural({ nextGoals: [{ title: 'Nouvel objectif', weight: 0 }] })}
                  className="w-full py-3 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-600 text-gray-500 hover:border-purple-400 hover:text-purple-600 font-bold flex items-center justify-center gap-2 transition-colors">
                  <Plus size={18} /> Ajouter un objectif pour la période suivante
                </button>
              )}
            </>
          )}

          {/* D. SYNTHÈSE */}
          {activeTab === 'synthese' && (
            <div className="space-y-4">
              {([
                ['strengths', 'Points forts', review.strengths],
                ['improvements', "Axes d'amélioration", review.improvements],
                ['feedback', 'Commentaire général', review.feedback],
              ] as const).map(([field, label, value]) => (
                <div key={field} className={cardCls}>
                  <p className="font-bold text-gray-900 dark:text-white mb-2">{label}</p>
                  {editing ? (
                    <textarea rows={3} className={inputCls} value={value ?? ''} onChange={e => editText(field, e.target.value)} />
                  ) : (
                    <p className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-wrap break-words">{value || '—'}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Réponse de l'employé (visible par tous quand elle existe) */}
      {review.employeeComment && (
        <div className={`${cardCls} border-l-4 !border-l-purple-500`}>
          <p className="font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-1"><MessageSquare size={16} /> Commentaire de l'employé</p>
          <p className="text-xs text-gray-400 mb-2">{fmtDate(review.employeeCommentAt)}</p>
          <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap break-words">{review.employeeComment}</p>
        </div>
      )}

      {/* Accusé de réception */}
      {permissions.canAcknowledge && (
        <div className={`${cardCls} space-y-3 print:hidden`}>
          <p className="font-bold text-gray-900 dark:text-white flex items-center gap-2"><ThumbsUp size={16} /> Accusé de réception</p>
          {permissions.isSelf ? (
            <>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Accuser réception signifie que vous avez pris connaissance de cette évaluation, pas que vous êtes forcément d'accord. Vous pouvez ajouter votre point de vue ci-dessous.
              </p>
              <textarea rows={3} className={inputCls} placeholder="Votre commentaire ou désaccord (facultatif)" value={ackComment}
                onChange={e => setAckComment(e.target.value)} maxLength={5000} />
            </>
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Marquer cette évaluation comme reçue (par exemple après signature papier). L'action est enregistrée à votre nom.
            </p>
          )}
          <button onClick={acknowledge} disabled={busy}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 disabled:opacity-60">
            {busy ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
            {permissions.isSelf ? "J'ai pris connaissance" : 'Marquer comme reçue'}
          </button>
        </div>
      )}
      {review.status === 'ACKNOWLEDGED' && (
        <p className="text-center text-sm text-emerald-600 dark:text-emerald-400 flex items-center justify-center gap-2">
          <CheckCircle2 size={16} /> Réceptionnée le {fmtDate(review.acknowledgedAt)}
        </p>
      )}

      {/* Barre d'actions collante */}
      {(editing || selfMode) && (
        <div className="sticky bottom-3 z-20 print:hidden">
          <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur rounded-2xl border border-gray-100 dark:border-gray-700 shadow-xl p-3 sm:p-4 space-y-2">
            {actionError && (
              <div className="rounded-xl bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 text-sm p-3 flex gap-2">
                <AlertTriangle size={16} className="shrink-0 mt-0.5" /> <p className="break-words">{actionError}</p>
              </div>
            )}
            <div className="flex items-center justify-between gap-3">
              <span className={`text-xs sm:text-sm flex items-center gap-1.5 ${save === 'error' ? 'text-red-500' : 'text-gray-400'}`}>
                {save === 'saving' && <><Loader2 size={14} className="animate-spin" /> Sauvegarde…</>}
                {save === 'saved' && <><Cloud size={14} /> Sauvegardé</>}
                {save === 'error' && <><CloudOff size={14} /> Non sauvegardé</>}
                {save === 'idle' && <><Cloud size={14} /> Sauvegarde automatique</>}
              </span>
              <button onClick={editing ? submit : submitSelf} disabled={busy}
                className="px-4 sm:px-6 py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold shadow-lg shadow-purple-500/20 flex items-center gap-2 disabled:opacity-60 text-sm sm:text-base">
                {busy ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                {editing ? "Soumettre à l'employé" : 'Envoyer mon auto-évaluation'}
              </button>
            </div>
          </div>
        </div>
      )}
      {!editing && !selfMode && actionError && (
        <div className="rounded-xl bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 text-sm p-3">{actionError}</div>
      )}
    </div>
  );
}