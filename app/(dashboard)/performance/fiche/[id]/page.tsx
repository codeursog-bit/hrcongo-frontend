'use client';

// ============================================================================
// 📄 app/(dashboard)/performance/fiche/[id]/page.tsx
// Fiche d'évaluation — pensée pour qu'on comprenne quoi faire sans formation :
//   • un bandeau en langage simple dit à chaque instant l'étape en cours
//   • pour le responsable : une liste « Avant de soumettre » indique exactement ce
//     qu'il reste à corriger (avec un bouton pour y aller) ; « Soumettre » reste
//     grisé tant que tout n'est pas bon
//   • l'employé ne note JAMAIS : il lit son évaluation une fois transmise, peut
//     répondre, puis confirme en avoir pris connaissance
// Sauvegarde automatique (rien n'est perdu si on quitte la page).
// ============================================================================

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Loader2, Check, Send, Plus, Trash2, Printer, Target, MessageSquare,
  CheckCircle2, AlertTriangle, ThumbsUp, Cloud, CloudOff, Circle, Info,
} from 'lucide-react';
import { api } from '@/services/api';
import { useBasePath } from '@/hooks/useBasePath';
import PerformanceNav from '@/components/performance/PerformanceNav';
import { ScorePicker } from '@/components/performance/ScorePicker';
import {
  Sheet, SheetGoal, SheetCriterion, STATUS_LABEL, fmtDate, sumWeights, weightsMessage,
} from '@/components/performance/sheet-types';

type Tab = 'objectifs' | 'criteres' | 'suivants' | 'synthese';
type SaveState = 'idle' | 'saving' | 'saved' | 'error';

const inputCls =
  'w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/40 focus:border-purple-400 disabled:opacity-70';
const cardCls =
  'bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-4 sm:p-5';

const ok100 = (t: number) => Math.abs(t - 100) < 0.011;

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

export default function EvaluationSheetPage() {
  const params = useParams();
  const id = params?.id as string;
  const { bp } = useBasePath();
  const router = useRouter();

  const [sheet, setSheet] = useState<Sheet | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>('objectifs');
  const [save, setSave] = useState<SaveState>('idle');
  const [actionError, setActionError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [ackComment, setAckComment] = useState('');

  // Modifications en attente d'envoi (sauvegarde automatique)
  const emptyPending = () => ({
    goals: {} as Record<string, any>, criteria: {} as Record<string, any>,
    nextGoals: {} as Record<string, any>, text: {} as Record<string, any>,
  });
  const pending = useRef(emptyPending());
  const timer = useRef<any>(null);

  const endpoint = `/performance/reviews/${id}`;

  const load = useCallback(async () => {
    try {
      setSheet(await api.get<Sheet>(`${endpoint}/sheet`));
      setLoadError(null);
    } catch (e: any) {
      setLoadError(e?.message || 'Impossible de charger cette évaluation');
    } finally { setLoading(false); }
  }, [endpoint]);

  useEffect(() => { load(); }, [load]);

  const hasPending = () => {
    const p = pending.current;
    return Object.keys(p.goals).length > 0 || Object.keys(p.criteria).length > 0 ||
      Object.keys(p.nextGoals).length > 0 || Object.keys(p.text).length > 0;
  };

  /** Envoie ce qui est en attente. Renvoie true si tout est sauvegardé. */
  const flush = useCallback(async (): Promise<boolean> => {
    clearTimeout(timer.current);
    if (!hasPending()) return true;
    const p = pending.current;
    pending.current = emptyPending();
    setSave('saving');
    try {
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
      setSave('saved'); setActionError(null);
      return true;
    } catch (e: any) {
      setSave('error'); setActionError(e?.message || 'Sauvegarde impossible');
      return false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endpoint]);

  const schedule = () => {
    setSave('saving');
    clearTimeout(timer.current);
    timer.current = setTimeout(() => { flush(); }, 900);
  };

  // Sauvegarde si on quitte l'onglet ou la page
  useEffect(() => {
    const onHide = () => { if (hasPending()) flush(); };
    document.addEventListener('visibilitychange', onHide);
    return () => { document.removeEventListener('visibilitychange', onHide); onHide(); clearTimeout(timer.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flush]);

  // ── Modifications du responsable ──────────────────────────────────────────
  const editGoal = (gid: string, patch: Partial<SheetGoal> & { comment?: string }, list: 'goals' | 'nextGoals') => {
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

  /** Ajout / suppression : envoi immédiat puis rechargement */
  const structural = async (body: any) => {
    if (!(await flush())) return;
    setBusy(true);
    try { setSheet(await api.patch<Sheet>(`${endpoint}/sheet`, body)); setSave('saved'); }
    catch (e: any) { setActionError(e?.message || 'Action impossible'); }
    finally { setBusy(false); }
  };

  const submit = async () => {
    if (!sheet) return;
    if (!confirm(`Soumettre l'évaluation de ${sheet.review.employee.firstName} ${sheet.review.employee.lastName} ?\nElle sera envoyée à l'employé et vous ne pourrez plus la modifier.`)) return;
    if (!(await flush())) return;
    setBusy(true); setActionError(null);
    try { await api.patch(`${endpoint}/submit`, {}); await load(); }
    catch (e: any) { setActionError(e?.message || 'Soumission impossible'); }
    finally { setBusy(false); }
  };

  const acknowledge = async () => {
    setBusy(true); setActionError(null);
    try { await api.patch(`${endpoint}/acknowledge`, { comment: ackComment.trim() || undefined }); await load(); }
    catch (e: any) { setActionError(e?.message || "Impossible d'enregistrer"); }
    finally { setBusy(false); }
  };

  const deleteSheet = async () => {
    if (!sheet) return;
    const r = sheet.review;
    const who = `${r.employee.firstName} ${r.employee.lastName}`;
    const warn = r.status === 'DRAFT'
      ? `Supprimer le brouillon d'évaluation de ${who} (${r.period}) ?\nLes objectifs rattachés sont conservés.`
      : `⚠ Cette évaluation a déjà été transmise à ${who}.\nLa supprimer efface définitivement l'évaluation, son commentaire et les niveaux de compétence qu'elle a enregistrés.\n\nConfirmer la suppression ?`;
    if (!confirm(warn)) return;
    setBusy(true); setActionError(null);
    try {
      await api.delete(`/performance/reviews/${id}`);
      router.push(bp(r.cycle ? `/performance/cycles/${r.cycle.id}` : '/performance'));
    } catch (e: any) { setActionError(e?.message || 'Suppression impossible'); setBusy(false); }
  };

  // ─── États de chargement ─────────────────────────────────────────────────
  if (loading) return <div className="flex items-center justify-center py-32"><Loader2 className="animate-spin text-purple-600" size={32} /></div>;
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
  const editing = permissions.canEdit;
  const st = STATUS_LABEL[review.status];
  const initials = `${review.employee.firstName[0] ?? ''}${review.employee.lastName[0] ?? ''}`.toUpperCase();
  const objW = review.cycle?.objectivesWeight ?? 80;

  // ── « Avant de soumettre » : exactement ce que le serveur exigera ─────────
  const goalsScored = goals.filter(g => Number(g.score) >= 1).length;
  const critScored = criteria.filter(c => Number(c.score) >= 1).length;
  const checks: Array<{ key: string; ok: boolean; label: string; tab: Tab }> = [];
  if (editing) {
    checks.push({ key: 'g0', ok: goals.length > 0, label: goals.length > 0 ? 'Objectifs à évaluer ajoutés' : 'Ajoutez au moins un objectif à évaluer', tab: 'objectifs' });
    if (goals.length > 0) {
      checks.push({ key: 'g1', ok: goalsScored === goals.length, label: `Objectifs notés : ${goalsScored} sur ${goals.length}`, tab: 'objectifs' });
      checks.push({ key: 'g2', ok: ok100(sumWeights(goals)), label: weightsMessage('Importance des objectifs', sumWeights(goals)), tab: 'objectifs' });
    }
    if (criteria.length > 0) {
      checks.push({ key: 'c1', ok: critScored === criteria.length, label: `Critères notés : ${critScored} sur ${criteria.length}`, tab: 'criteres' });
      checks.push({ key: 'c2', ok: ok100(sumWeights(criteria)), label: weightsMessage('Importance des critères', sumWeights(criteria)), tab: 'criteres' });
    }
    if (nextGoals.length > 0)
      checks.push({ key: 'n1', ok: ok100(sumWeights(nextGoals)), label: weightsMessage('Importance des objectifs de la prochaine période', sumWeights(nextGoals)), tab: 'suivants' });
  }
  const failing = (t: Tab) => checks.filter(c => !c.ok && c.tab === t).length;
  const allOk = checks.length > 0 && checks.every(c => c.ok);

  const tabs: Array<{ key: Tab; label: string; show: boolean }> = [
    { key: 'objectifs', label: 'Objectifs', show: true },
    { key: 'criteres', label: 'Critères', show: criteria.length > 0 },
    { key: 'suivants', label: 'Prochaine période', show: editing || nextGoals.length > 0 },
    { key: 'synthese', label: 'Synthèse', show: true },
  ];
  const visibleTabs = tabs.filter(t => t.show);
  const activeTab = visibleTabs.some(t => t.key === tab) ? tab : visibleTabs[0].key;

  // ── Bandeau d'aide : l'étape en cours, en une phrase ──────────────────────
  let guide: { tone: 'info' | 'ok'; title: string; text: string } | null = null;
  if (editing) guide = { tone: 'info', title: 'À vous de noter', text: "Notez chaque objectif et chaque critère de 1 (insuffisant) à 5 (exceptionnel). Fixez ensuite les objectifs de la prochaine période, puis cliquez sur « Soumettre ». Tout est enregistré automatiquement." };
  else if (permissions.isSelf && review.status === 'SUBMITTED') guide = { tone: 'info', title: 'Votre évaluation est prête', text: "Lisez-la, puis cliquez sur « J'ai pris connaissance ». Vous pouvez ajouter un commentaire si vous n'êtes pas d'accord ou si vous voulez préciser quelque chose." };
  else if (permissions.isSelf && review.status === 'ACKNOWLEDGED') guide = { tone: 'ok', title: 'Évaluation terminée', text: `Vous en avez pris connaissance le ${fmtDate(review.acknowledgedAt)}.` };
  else if (!permissions.isSelf && review.status === 'SUBMITTED') guide = { tone: 'info', title: "Transmise à l'employé", text: "L'employé doit maintenant la lire et confirmer en avoir pris connaissance." };
  else if (!permissions.isSelf && review.status === 'ACKNOWLEDGED') guide = { tone: 'ok', title: 'Évaluation terminée', text: "L'employé en a pris connaissance." };

  // ─── Rendu d'un objectif ─────────────────────────────────────────────────
  const renderGoal = (g: SheetGoal, list: 'goals' | 'nextGoals') => {
    const isEval = list === 'goals';
    return (
      <div key={g.id} className={cardCls}>
        <div className="flex items-start gap-3">
          <div className="flex-1 min-w-0 space-y-2">
            {editing ? (
              <input className={`${inputCls} font-semibold`} value={g.title} onChange={e => editGoal(g.id, { title: e.target.value }, list)} placeholder="Intitulé de l'objectif" />
            ) : <h3 className="font-bold text-gray-900 dark:text-white break-words">{g.title}</h3>}
            {editing ? (
              <input className={inputCls} value={g.kpi ?? ''} placeholder="Comment saura-t-on qu'il est atteint ? (facultatif)" onChange={e => editGoal(g.id, { kpi: e.target.value }, list)} />
            ) : g.kpi ? <p className="text-sm text-gray-500 dark:text-gray-400 break-words">{g.kpi}</p> : null}
          </div>
          <div className="flex flex-col items-end gap-2 shrink-0">
            {editing ? (
              <label className="flex items-center gap-1 text-sm text-gray-500" title="Importance de cet objectif dans la note, en %">
                <input type="number" min={0} max={100} inputMode="decimal" aria-label="Importance en pourcentage"
                  className={`${inputCls} w-20 text-center`} value={g.weight ?? 0} onChange={e => editGoal(g.id, { weight: Number(e.target.value) }, list)} />%
              </label>
            ) : <span className="px-2.5 py-1 rounded-lg bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs font-bold">{g.weight ?? 0} %</span>}
            {editing && (
              <button type="button" aria-label="Supprimer cet objectif"
                onClick={() => { if (confirm('Retirer cet objectif de la fiche ?')) structural(isEval ? { removeGoalIds: [g.id] } : { nextGoals: [{ id: g.id, remove: true }] }); }}
                className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"><Trash2 size={16} /></button>
            )}
          </div>
        </div>

        {!isEval && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
            <div>
              <p className="text-xs font-medium text-gray-500 mb-1">À atteindre avant le</p>
              {editing ? <input type="date" className={inputCls} value={g.endDate ? g.endDate.slice(0, 10) : ''} onChange={e => editGoal(g.id, { endDate: e.target.value }, list)} />
                : <p className="text-sm text-gray-700 dark:text-gray-300">{fmtDate(g.endDate)}</p>}
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 mb-1">Aide ou moyens prévus (facultatif)</p>
              {editing ? <input className={inputCls} value={g.support ?? ''} onChange={e => editGoal(g.id, { support: e.target.value }, list)} />
                : <p className="text-sm text-gray-700 dark:text-gray-300">{g.support || '—'}</p>}
            </div>
          </div>
        )}

        {isEval && (
          <div className="mt-4 space-y-3">
            <ScorePicker levels={sheet.scoreLevels} value={g.score} disabled={!editing} onChange={n => editGoal(g.id, { score: n }, list)} />
            {editing ? (
              <textarea rows={2} className={inputCls} placeholder="Un mot d'explication sur cette note (facultatif)" value={g.managerComment ?? ''} onChange={e => editGoal(g.id, { comment: e.target.value }, list)} />
            ) : g.managerComment ? <p className="text-sm text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-900/40 rounded-xl p-3 break-words">{g.managerComment}</p> : null}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto pb-40 space-y-5 sm:space-y-6">
      <PerformanceNav />

      <div className="flex items-center justify-between print:hidden">
        <Link href={bp(permissions.isSelf ? '/performance/mon-espace' : review.cycle ? `/performance/cycles/${review.cycle.id}` : '/performance')}
          className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-purple-600 transition-colors"><ArrowLeft size={16} /> Retour</Link>
        <button onClick={() => window.print()} className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800">
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
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white truncate">{review.employee.firstName} {review.employee.lastName}</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{[review.employee.position, review.employee.department].filter(Boolean).join(' · ')}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="px-3 py-1 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 font-medium">{review.period}</span>
          <span className={`px-3 py-1 rounded-lg font-bold ${st.cls}`}>{st.label}</span>
          {review.reviewer && <span className="text-xs text-gray-400">Évaluateur : {review.reviewer.firstName} {review.reviewer.lastName}</span>}
        </div>
      </div>

      {/* Ce qu'il faut faire maintenant */}
      {guide && (
        <div className={`rounded-2xl border p-4 flex gap-3 text-sm ${guide.tone === 'ok'
          ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
          : 'bg-purple-50 dark:bg-purple-900/20 border-purple-100 dark:border-purple-800 text-purple-800 dark:text-purple-200'}`}>
          {guide.tone === 'ok' ? <CheckCircle2 size={20} className="shrink-0 mt-0.5" /> : <Info size={20} className="shrink-0 mt-0.5" />}
          <div><p className="font-bold">{guide.title}</p><p className="mt-0.5">{guide.text}</p></div>
        </div>
      )}

      {/* Notes calculées */}
      {(review.overallScore ?? 0) > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <ScoreTile label="Objectifs" value={review.objectivesScore} sub={`${objW} % de la note finale`} />
          <ScoreTile label="Critères" value={review.competenciesScore} sub={`${100 - objW} % de la note finale`} />
          <div className="col-span-2 sm:col-span-1"><ScoreTile big label="Note finale" value={review.overallScore} sub={review.verdict ?? undefined} /></div>
        </div>
      )}

      {/* Onglets */}
      <div className="sticky top-0 z-10 -mx-4 px-4 sm:mx-0 sm:px-0 py-2 bg-gray-50/90 dark:bg-gray-900/90 backdrop-blur print:hidden">
        <div className="flex gap-2 overflow-x-auto">
          {visibleTabs.map(t => {
            const bad = failing(t.key);
            return (
              <button key={t.key} onClick={() => setTab(t.key)}
                className={`relative whitespace-nowrap px-4 py-2.5 rounded-xl text-sm font-bold transition-colors min-h-[44px] ${activeTab === t.key ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-100 dark:border-gray-700'}`}>
                {t.label}
                {editing && bad > 0 && <span className="ml-2 inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1 rounded-full bg-amber-400 text-white text-[11px]">{bad}</span>}
                {editing && checks.length > 0 && bad === 0 && t.key !== 'synthese' && <Check size={14} className="inline ml-2 -mt-0.5" />}
              </button>
            );
          })}
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={activeTab} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">

          {activeTab === 'objectifs' && (
            <>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {editing ? "Pour chaque objectif : touchez une note de 1 à 5. « Importance » = la place de cet objectif dans la note (le total doit faire 100 %)." : "Les objectifs fixés pour cette période et la note obtenue."}
              </p>
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
                  className="w-full py-3 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-600 text-gray-500 hover:border-purple-400 hover:text-purple-600 font-bold flex items-center justify-center gap-2 transition-colors min-h-[48px]">
                  <Plus size={18} /> Ajouter un objectif
                </button>
              )}
            </>
          )}

          {activeTab === 'criteres' && (
            <>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {editing ? "Notez la manière de travailler sur chaque critère, de 1 à 5. L'importance de chaque critère vient de la grille choisie." : 'Les critères de la grille de notation et la note obtenue.'}
              </p>
              {criteria.map(c => (
                <div key={c.id} className={cardCls}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="font-bold text-gray-900 dark:text-white">{c.label}</h3>
                      {c.description && <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{c.description}</p>}
                    </div>
                    {editing ? (
                      <label className="flex items-center gap-1 text-sm text-gray-500 shrink-0" title="Importance de ce critère dans la note, en %">
                        <input type="number" min={0} max={100} inputMode="decimal" aria-label="Importance en pourcentage" className={`${inputCls} w-20 text-center`}
                          value={c.weight} onChange={e => editCriterion(c.id, { weight: Number(e.target.value) })} />%
                      </label>
                    ) : <span className="px-2.5 py-1 rounded-lg bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs font-bold shrink-0">{c.weight} %</span>}
                  </div>
                  <div className="mt-4 space-y-3">
                    <ScorePicker levels={sheet.scoreLevels} value={c.score} disabled={!editing} onChange={n => editCriterion(c.id, { score: n })} />
                    {editing ? (
                      <textarea rows={2} className={inputCls} placeholder="Un mot d'explication sur cette note (facultatif)" value={c.comment ?? ''} onChange={e => editCriterion(c.id, { comment: e.target.value })} />
                    ) : c.comment ? <p className="text-sm text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-900/40 rounded-xl p-3 break-words">{c.comment}</p> : null}
                  </div>
                </div>
              ))}
            </>
          )}

          {activeTab === 'suivants' && (
            <>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Ce que l'employé devra atteindre à la prochaine période. Ces objectifs seront repris automatiquement dans sa prochaine évaluation. (Facultatif)
              </p>
              {nextGoals.map(g => renderGoal(g, 'nextGoals'))}
              {editing && (
                <button disabled={busy} onClick={() => structural({ nextGoals: [{ title: 'Nouvel objectif', weight: 0 }] })}
                  className="w-full py-3 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-600 text-gray-500 hover:border-purple-400 hover:text-purple-600 font-bold flex items-center justify-center gap-2 transition-colors min-h-[48px]">
                  <Plus size={18} /> Ajouter un objectif pour la prochaine période
                </button>
              )}
            </>
          )}

          {activeTab === 'synthese' && (
            <div className="space-y-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">{editing ? 'Quelques mots pour conclure (facultatif).' : "Le commentaire de l'évaluateur."}</p>
              {([['strengths', 'Points forts', review.strengths], ['improvements', 'À améliorer', review.improvements], ['feedback', 'Commentaire général', review.feedback]] as const).map(([field, label, value]) => (
                <div key={field} className={cardCls}>
                  <p className="font-bold text-gray-900 dark:text-white mb-2">{label}</p>
                  {editing ? <textarea rows={3} className={inputCls} value={value ?? ''} onChange={e => editText(field, e.target.value)} />
                    : <p className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-wrap break-words">{value || '—'}</p>}
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Réponse de l'employé */}
      {review.employeeComment && (
        <div className={`${cardCls} border-l-4 !border-l-purple-500`}>
          <p className="font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-1"><MessageSquare size={16} /> Commentaire de l'employé</p>
          <p className="text-xs text-gray-400 mb-2">{fmtDate(review.employeeCommentAt)}</p>
          <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap break-words">{review.employeeComment}</p>
        </div>
      )}

      {/* Prise de connaissance */}
      {permissions.canAcknowledge && (
        <div className={`${cardCls} space-y-3 print:hidden`}>
          <p className="font-bold text-gray-900 dark:text-white flex items-center gap-2"><ThumbsUp size={16} /> {permissions.isSelf ? "J'ai lu mon évaluation" : 'Marquer comme reçue'}</p>
          {permissions.isSelf ? (
            <>
              <p className="text-sm text-gray-500 dark:text-gray-400">Cliquer ci-dessous veut dire que vous l'avez lue, pas que vous êtes forcément d'accord. Vous pouvez écrire votre point de vue.</p>
              <textarea rows={3} className={inputCls} placeholder="Votre commentaire (facultatif)" value={ackComment} onChange={e => setAckComment(e.target.value)} maxLength={5000} />
            </>
          ) : <p className="text-sm text-gray-500 dark:text-gray-400">À utiliser si l'employé a signé une version papier. L'action est enregistrée à votre nom.</p>}
          <button onClick={acknowledge} disabled={busy}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 disabled:opacity-60 min-h-[48px]">
            {busy ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
            {permissions.isSelf ? "J'ai pris connaissance" : 'Marquer comme reçue'}
          </button>
        </div>
      )}

      {permissions.canDelete && (
        <div className="print:hidden flex justify-center">
          <button type="button" onClick={deleteSheet} disabled={busy}
            className="px-4 py-2.5 rounded-xl text-sm font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2 min-h-[44px] disabled:opacity-60">
            <Trash2 size={16} /> Supprimer cette évaluation
          </button>
        </div>
      )}

      {/* Barre du bas : avant de soumettre */}
      {editing && (
        <div className="fixed bottom-3 left-3 right-3 sm:left-auto sm:right-6 sm:w-[28rem] z-20 print:hidden">
          <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur rounded-2xl border border-gray-100 dark:border-gray-700 shadow-xl p-3 sm:p-4 space-y-3">
            {actionError && (
              <div className="rounded-xl bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 text-sm p-3 flex gap-2"><AlertTriangle size={16} className="shrink-0 mt-0.5" /> <p className="break-words">{actionError}</p></div>
            )}
            <div>
              <p className="text-sm font-bold text-gray-900 dark:text-white mb-1.5">{allOk ? 'Tout est prêt ✔' : 'Avant de soumettre'}</p>
              {!allOk && (
                <ul className="space-y-1.5 max-h-40 overflow-y-auto">
                  {checks.filter(c => !c.ok).map(c => (
                    <li key={c.key} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                      <Circle size={14} className="text-amber-500 mt-1 shrink-0" />
                      <span className="flex-1 min-w-0">{c.label}</span>
                      <button onClick={() => setTab(c.tab)} className="text-purple-600 font-bold text-xs shrink-0 px-2 py-1 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900/20">Corriger</button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className={`text-xs flex items-center gap-1.5 ${save === 'error' ? 'text-red-500' : 'text-gray-400'}`}>
                {save === 'saving' && <><Loader2 size={13} className="animate-spin" /> Enregistrement…</>}
                {save === 'saved' && <><Cloud size={13} /> Enregistré</>}
                {save === 'error' && <><CloudOff size={13} /> Non enregistré</>}
                {save === 'idle' && <><Cloud size={13} /> Enregistré automatiquement</>}
              </span>
              <button onClick={submit} disabled={busy || !allOk}
                className="px-5 py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold shadow-lg shadow-purple-500/20 flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed text-sm min-h-[48px]">
                {busy ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />} Soumettre à l'employé
              </button>
            </div>
          </div>
        </div>
      )}
      {!editing && actionError && <div className="rounded-xl bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 text-sm p-3">{actionError}</div>}
    </div>
  );
}