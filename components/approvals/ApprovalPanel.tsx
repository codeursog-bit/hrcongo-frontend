'use client';

// ============================================================================
// 📁 components/approvals/ApprovalPanel.tsx — LOT B
// Panneau « Avis » d'une demande (prêt / avance) :
//   - étapes du circuit + avis donnés (commentaire, auteur, signature)
//   - décision « validée, en attente d'avis » avec Finaliser / Annuler
//   - bouton « Donner mon avis » pour les titulaires de fonctions
//   - historique de la validation « sans attendre » (traçabilité)
// Ne s'affiche PAS si aucun circuit n'est actif et qu'il n'y a ni avis ni
// historique : le comportement d'avant reste visuellement identique.
// ============================================================================

import React, { useCallback, useEffect, useState } from 'react';
import {
  CheckCircle2, XCircle, Clock, Loader2, MessageSquare, ThumbsUp, ThumbsDown,
  Zap, Ban, UserX, X, AlertTriangle, BadgeCheck,
} from 'lucide-react';
import { approvalsApi, ApprovalKind, ApprovalStateView } from '@/services/approvals';

interface Props {
  kind: ApprovalKind;
  requestId: string;
  // Incrémenter pour recharger depuis l'extérieur
  refreshKey?: number;
  // Remonte l'état au parent (ex. pour masquer « Valider » pendant l'attente)
  onState?: (state: ApprovalStateView | null) => void;
  // Appelé après une action qui change la demande (finaliser, annuler, avis)
  onChanged?: () => void;
}

const ACTIVE_PENDING = ['WAITING_OPINIONS', 'NEEDS_CONFIRMATION'];

const fmtDate = (d?: string | null) =>
  d ? new Date(d).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '';

export default function ApprovalPanel({ kind, requestId, refreshKey = 0, onState, onChanged }: Props) {
  const [state, setState] = useState<ApprovalStateView | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<'finalize' | 'cancel' | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Modal « Donner mon avis »
  const [opinionFor, setOpinionFor] = useState<{ code: string; label: string } | null>(null);
  const [opinion, setOpinion] = useState<'FAVORABLE' | 'UNFAVORABLE'>('FAVORABLE');
  const [comment, setComment] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const s = await approvalsApi.getState(kind, requestId);
      setState(s);
      onState?.(s);
    } catch {
      // 403 (pas d'accès aux avis) / 404 / backend ancien → on n'affiche rien.
      setState(null);
      onState?.(null);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kind, requestId]);

  useEffect(() => {
    setLoading(true);
    load();
  }, [load, refreshKey]);

  if (loading) {
    return (
      <div className="flex justify-center py-3">
        <Loader2 size={16} className="animate-spin text-[var(--text-muted)]" />
      </div>
    );
  }
  if (!state) return null;

  const pendingActive = !!state.pending && ACTIVE_PENDING.includes(state.pending.state);
  const hasHistory = !!state.pending && state.pending.state === 'FINALIZED' && state.pending.forced;
  if (!state.circuitActive && state.opinions.length === 0 && !pendingActive && !hasHistory) return null;

  const run = async (which: 'finalize' | 'cancel') => {
    if (which === 'finalize' && !window.confirm('Finaliser maintenant sans attendre les avis restants ?')) return;
    if (which === 'cancel' && !window.confirm('Annuler cette validation ? La demande restera en attente.')) return;
    setBusy(which);
    setError(null);
    try {
      if (which === 'finalize') await approvalsApi.finalize(kind, requestId);
      else await approvalsApi.cancelPending(kind, requestId);
      await load();
      onChanged?.();
    } catch (e: any) {
      setError(e?.message || 'Action impossible');
    } finally {
      setBusy(null);
    }
  };

  const submitOpinion = async () => {
    if (!opinionFor) return;
    setSaving(true);
    setError(null);
    try {
      await approvalsApi.giveOpinion(kind, requestId, {
        functionCode: opinionFor.code,
        opinion,
        comment: comment.trim() || undefined,
      });
      setOpinionFor(null);
      setComment('');
      setOpinion('FAVORABLE');
      await load();
      onChanged?.();
    } catch (e: any) {
      setError(e?.message || "Impossible d'enregistrer l'avis");
    } finally {
      setSaving(false);
    }
  };

  const openOpinion = (code: string, label: string) => {
    const existing = state.steps.find((s) => s.code === code)?.opinion;
    setOpinion(existing?.opinion ?? 'FAVORABLE');
    setComment(existing?.comment ?? '');
    setOpinionFor({ code, label });
  };

  const given = state.steps.filter((s) => s.opinion).length;
  const expected = state.steps.filter((s) => s.hasHolder).length;

  return (
    <div className="mb-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 bg-[var(--surface-2)] border-b border-[var(--border)]">
        <p className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1.5">
          <MessageSquare size={13} /> Avis
        </p>
        {state.circuitActive && (
          <span className="text-xs font-bold text-[var(--text-muted)]">{given}/{expected}</span>
        )}
      </div>

      {/* Étapes + avis */}
      <ul className="divide-y divide-[var(--border)]">
        {state.steps.map((s) => (
          <li key={s.code} className="px-3 py-2.5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-bold text-[var(--text)]">{s.label}</p>
                <p className="text-xs text-[var(--text-muted)] truncate">
                  {s.hasHolder ? s.holders.join(', ') : 'Aucun titulaire — étape ignorée'}
                </p>
              </div>
              {s.opinion ? (
                s.opinion.opinion === 'FAVORABLE' ? (
                  <span className="shrink-0 inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/30">
                    <ThumbsUp size={12} /> Favorable
                  </span>
                ) : (
                  <span className="shrink-0 inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold text-red-700 dark:text-red-400 bg-red-100 dark:bg-red-900/30">
                    <ThumbsDown size={12} /> Défavorable
                  </span>
                )
              ) : s.hasHolder ? (
                <span className="shrink-0 inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold text-[var(--text-muted)] bg-[var(--surface-2)] border border-[var(--border)]">
                  <Clock size={12} /> En attente
                </span>
              ) : (
                <span className="shrink-0 inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold text-[var(--text-muted)] bg-[var(--surface-2)] border border-[var(--border)]">
                  <UserX size={12} /> Ignorée
                </span>
              )}
            </div>

            {s.opinion && (
              <div className="mt-2 pl-3 border-l-2 border-[var(--border)]">
                {s.opinion.comment && (
                  <p className="text-sm text-[var(--text)] whitespace-pre-wrap">{s.opinion.comment}</p>
                )}
                <div className="flex items-center justify-between gap-3 mt-1">
                  <p className="text-xs text-[var(--text-muted)]">
                    {s.opinion.authorName} · {fmtDate(s.opinion.updatedAt)}
                  </p>
                  {s.opinion.signatureUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={s.opinion.signatureUrl} alt={`Signature ${s.opinion.authorName}`} className="h-8 max-w-[96px] object-contain" />
                  )}
                </div>
              </div>
            )}
          </li>
        ))}

        {/* Avis donnés par une fonction retirée du circuit depuis (historique conservé) */}
        {state.opinions
          .filter((o) => !state.steps.some((s) => s.code === o.functionCode))
          .map((o) => (
            <li key={o.functionCode} className="px-3 py-2.5">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-bold text-[var(--text)]">{o.label}</p>
                <span className="text-xs font-bold text-[var(--text-muted)]">
                  {o.opinion === 'FAVORABLE' ? 'Favorable' : 'Défavorable'}
                </span>
              </div>
              {o.comment && <p className="text-sm text-[var(--text)] mt-1 whitespace-pre-wrap">{o.comment}</p>}
              <p className="text-xs text-[var(--text-muted)] mt-1">{o.authorName} · {fmtDate(o.updatedAt)}</p>
            </li>
          ))}
      </ul>

      {/* Décision en attente d'avis */}
      {pendingActive && state.pending && (
        <div className="px-3 py-3 border-t border-[var(--border)] bg-emerald-50/60 dark:bg-emerald-900/10">
          {state.pending.state === 'WAITING_OPINIONS' ? (
            <p className="text-sm text-[var(--text)] flex items-start gap-2">
              <Clock size={15} className="mt-0.5 shrink-0 text-emerald-600" />
              <span>
                <strong>Validée par {state.pending.decidedByName}</strong> — en attente de l&apos;avis de{' '}
                {state.pending.missing.map((m) => m.label).join(', ') || '…'}. Elle sera comptabilisée dès
                que les avis seront donnés.
              </span>
            </p>
          ) : (
            <p className="text-sm text-[var(--text)] flex items-start gap-2">
              <AlertTriangle size={15} className="mt-0.5 shrink-0 text-red-500" />
              <span>
                <strong>À confirmer</strong> — tous les avis sont reçus, mais au moins un est défavorable (ou
                la validation n&apos;a pas pu s&apos;appliquer automatiquement). Confirmez ou annulez la validation de{' '}
                {state.pending.decidedByName}.
              </span>
            </p>
          )}

          {state.me.canDecide && (
            <div className="flex gap-2 mt-3">
              <button
                onClick={() => run('finalize')}
                disabled={busy !== null}
                className="flex-1 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-60 text-white text-sm font-bold rounded-xl flex items-center justify-center gap-2"
              >
                {busy === 'finalize' ? <Loader2 size={14} className="animate-spin" /> : state.pending.state === 'WAITING_OPINIONS' ? <Zap size={14} /> : <BadgeCheck size={14} />}
                {state.pending.state === 'WAITING_OPINIONS' ? 'Finaliser maintenant' : 'Confirmer la validation'}
              </button>
              <button
                onClick={() => run('cancel')}
                disabled={busy !== null}
                className="flex-1 py-2 border border-[var(--border)] hover:bg-[var(--surface-2)] disabled:opacity-60 text-[var(--text)] text-sm font-bold rounded-xl flex items-center justify-center gap-2"
              >
                {busy === 'cancel' ? <Loader2 size={14} className="animate-spin" /> : <Ban size={14} />}
                Annuler la validation
              </button>
            </div>
          )}
        </div>
      )}

      {/* Traçabilité : validée sans attendre */}
      {hasHistory && state.pending && (
        <div className="px-3 py-2.5 border-t border-[var(--border)] bg-[var(--surface-2)]">
          <p className="text-xs text-[var(--text-muted)] flex items-start gap-2">
            <Zap size={13} className="mt-0.5 shrink-0" />
            <span>
              Validée par {state.pending.decidedByName} sans attendre l&apos;avis de{' '}
              {state.pending.forcedMissing.map((m) => m.label).join(', ')}.
            </span>
          </p>
        </div>
      )}

      {/* Donner mon avis */}
      {state.me.canGiveOpinionAs.length > 0 && (
        <div className="px-3 py-3 border-t border-[var(--border)] flex flex-wrap gap-2">
          {state.me.canGiveOpinionAs.map((f) => {
            const existing = state.steps.find((s) => s.code === f.code)?.opinion;
            return (
              <button
                key={f.code}
                onClick={() => openOpinion(f.code, f.label)}
                className="px-3 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-bold rounded-xl flex items-center gap-2"
              >
                <MessageSquare size={14} />
                {existing ? `Modifier mon avis (${f.label})` : `Donner mon avis (${f.label})`}
              </button>
            );
          })}
        </div>
      )}

      {error && (
        <p className="px-3 pb-3 text-xs font-semibold text-red-600">{error}</p>
      )}

      {/* Modal avis */}
      {opinionFor && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-start justify-between gap-3 mb-4">
              <div>
                <h3 className="text-lg font-bold text-[var(--text)]">Mon avis</h3>
                <p className="text-sm text-[var(--text-muted)]">En tant que {opinionFor.label}</p>
              </div>
              <button onClick={() => setOpinionFor(null)} className="p-1.5 rounded-lg hover:bg-[var(--surface-2)] text-[var(--text-muted)]" aria-label="Fermer">
                <X size={18} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 mb-4">
              <button
                type="button"
                onClick={() => setOpinion('FAVORABLE')}
                className={`py-3 rounded-xl border-2 text-sm font-bold flex items-center justify-center gap-2 transition-all ${opinion === 'FAVORABLE' ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300' : 'border-[var(--border)] text-[var(--text-muted)]'}`}
              >
                <CheckCircle2 size={16} /> Favorable
              </button>
              <button
                type="button"
                onClick={() => setOpinion('UNFAVORABLE')}
                className={`py-3 rounded-xl border-2 text-sm font-bold flex items-center justify-center gap-2 transition-all ${opinion === 'UNFAVORABLE' ? 'border-red-500 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300' : 'border-[var(--border)] text-[var(--text-muted)]'}`}
              >
                <XCircle size={16} /> Défavorable
              </button>
            </div>

            <label className="block text-sm font-bold text-[var(--text)] mb-1.5">
              Commentaire <span className="font-normal text-[var(--text-muted)]">(recommandé, facultatif)</span>
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              maxLength={1000}
              placeholder="Ex. : trésorerie suffisante ce mois-ci"
              className="w-full text-sm p-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] mb-4"
            />

            <p className="text-xs text-[var(--text-muted)] mb-4">
              Votre avis est consultatif : la décision finale revient à l&apos;administrateur ou au manager RH.
            </p>

            <div className="flex gap-2">
              <button onClick={() => setOpinionFor(null)} disabled={saving} className="flex-1 py-2.5 border border-[var(--border)] rounded-xl text-sm font-bold text-[var(--text-muted)] hover:bg-[var(--surface-2)]">
                Annuler
              </button>
              <button onClick={submitOpinion} disabled={saving} className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-60 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2">
                {saving && <Loader2 size={14} className="animate-spin" />}
                Envoyer mon avis
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
