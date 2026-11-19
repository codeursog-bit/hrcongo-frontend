'use client';
import { PerformanceOverlay } from '@/components/performance/PerformanceOverlay';
import { ModuleSelect } from '@/components/ui/ModuleSelect';


// ============================================================================
// 📄 components/performance/ProposalModal.tsx
// Proposition d'avancement (supérieur → RH). Confidentielle : l'employé ne la voit pas.
// ============================================================================

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Loader2, Lock } from 'lucide-react';
import { api } from '@/services/api';
import { PROPOSAL_TYPE_LABEL, Proposal } from './career-types';

const inputCls =
  'w-full px-3 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--focus)] focus:border-[var(--border)]';

interface Props {
  employees: Array<{ id: string; firstName: string; lastName: string; position?: string }>;
  employeeId?: string;
  onClose: () => void;
  onDone: () => void;
}

export function ProposalModal({ employees, employeeId, onClose, onDone }: Props) {
  const [empId, setEmpId] = useState(employeeId ?? '');
  const [type, setType] = useState<Proposal['type']>('POSITION_CHANGE');
  const [target, setTarget] = useState('');
  const [justification, setJustification] = useState('');
  const [reviewId, setReviewId] = useState('');
  const [reviews, setReviews] = useState<Array<{ id: string; period: string; scoreLabel?: string | null; status: string }>>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setReviewId('');
    if (!empId) { setReviews([]); return; }
    api.get<any[]>(`/performance/reviews/employee/${empId}`)
      .then(r => setReviews((Array.isArray(r) ? r : []).filter(x => x.status !== 'DRAFT')))
      .catch(() => setReviews([]));
  }, [empId]);

  const emp = employees.find(e => e.id === empId);
  const placeholder = type === 'POSITION_CHANGE' ? 'Nouveau poste (ex : Chef de quai)'
    : type === 'ECHELON_MERIT' ? 'Échelon visé (ex : Échelon 4)' : "Évolution proposée";

  const submit = async () => {
    setBusy(true); setError(null);
    try {
      await api.post('/performance/career/proposals', {
        employeeId: empId, type, targetValue: target, justification, reviewId: reviewId || null,
      });
      onDone(); onClose();
    } catch (e: any) { setError(e?.message || 'Envoi impossible'); }
    finally { setBusy(false); }
  };

  return (
    <PerformanceOverlay initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-[rgb(0_0_0_/.45)] sm:p-4" onClose={onClose}>
      <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }} onClick={e => e.stopPropagation()}
        className="bg-[var(--surface)] rounded-t-3xl sm:rounded-3xl w-full sm:max-w-lg shadow-2xl border border-[var(--border)] max-h-[94vh] flex flex-col performance-card">
        <div className="flex items-center justify-between p-5 border-b border-[var(--border)]">
          <h2 className="text-lg font-semibold text-[var(--text)]">Proposer un avancement</h2>
          <button onClick={onClose} aria-label="Fermer" className="p-2 rounded-lg text-[var(--text-secondary)] hover:bg-[var(--surface-2)]"><X strokeWidth={1.5} size={18} /></button>
        </div>

        <div className="p-5 space-y-4 overflow-y-auto">
          <p className="text-xs text-[var(--text-secondary)] flex items-start gap-2 bg-[var(--surface-2)] rounded-xl p-3">
            <Lock strokeWidth={1.5} size={14} className="shrink-0 mt-0.5" /> Cette proposition est confidentielle : seule la RH la voit. L'employé ne sera informé qu'en cas de validation.
          </p>

          {!employeeId && (
            <div>
              <label className="text-sm font-medium text-[var(--text)]">Employé</label>
              <ModuleSelect className={`${inputCls} mt-1`} value={empId} onChange={e => setEmpId(e.target.value)}>
                <option value="">Choisir…</option>
                {employees.map(e => <option key={e.id} value={e.id}>{e.firstName} {e.lastName}{e.position ? ` — ${e.position}` : ''}</option>)}
              </ModuleSelect>
            </div>
          )}
          {employeeId && emp && <p className="text-sm font-semibold text-[var(--text)]">{emp.firstName} {emp.lastName} <span className="font-normal text-[var(--text-secondary)]">· {emp.position}</span></p>}

          <div className="grid grid-cols-1 gap-2">
            {(Object.keys(PROPOSAL_TYPE_LABEL) as Proposal['type'][]).map(k => (
              <button key={k} type="button" onClick={() => setType(k)}
                className={`py-3 px-3 rounded-xl text-sm font-semibold border text-left transition-colors ${type === k ? 'bg-[var(--brand)] text-[var(--on-brand)] border-[var(--border)]' : 'bg-[var(--surface)] text-[var(--text-secondary)] border-[var(--border)]'}`}>
                {PROPOSAL_TYPE_LABEL[k]}
              </button>
            ))}
          </div>

          <div>
            <label className="text-sm font-medium text-[var(--text)]">Poste ou échelon visé</label>
            <input className={`${inputCls} mt-1`} value={target} onChange={e => setTarget(e.target.value)} placeholder={placeholder} />
          </div>

          <div>
            <label className="text-sm font-medium text-[var(--text)]">Pourquoi ? <span className="text-xs font-normal text-[var(--text-secondary)]">(faits, résultats, compétences)</span></label>
            <textarea rows={4} className={`${inputCls} mt-1`} value={justification} onChange={e => setJustification(e.target.value)}
              placeholder="Appuyez-vous sur des éléments concrets : objectifs atteints, évaluations, compétences acquises…" />
          </div>

          {reviews.length > 0 && (
            <div>
              <label className="text-sm font-medium text-[var(--text)]">Évaluation à l'appui (facultatif)</label>
              <ModuleSelect className={`${inputCls} mt-1`} value={reviewId} onChange={e => setReviewId(e.target.value)}>
                <option value="">Aucune</option>
                {reviews.map(r => <option key={r.id} value={r.id}>{r.period}{r.scoreLabel ? ` — ${r.scoreLabel}` : ''}</option>)}
              </ModuleSelect>
            </div>
          )}

          {error && <p className="text-sm text-[var(--danger-text)] bg-[color-mix(in_srgb,var(--danger)_10%,var(--surface))] rounded-xl p-3 break-words">{error}</p>}
        </div>

        <div className="p-5 border-t border-[var(--border)] flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-[var(--border)] font-semibold text-[var(--text-secondary)]">Annuler</button>
          <button onClick={submit} disabled={busy || !empId || !target.trim() || justification.trim().length < 10}
            className="flex-1 py-3 rounded-xl bg-[var(--brand)] hover:bg-[var(--brand)] text-[var(--on-brand)] font-semibold shadow-lg disabled:opacity-60 flex items-center justify-center gap-2">
            {busy && <Loader2 strokeWidth={1.5} size={16} className="animate-spin" />} Envoyer à la RH
          </button>
        </div>
      </motion.div>
    </PerformanceOverlay>
  );
}