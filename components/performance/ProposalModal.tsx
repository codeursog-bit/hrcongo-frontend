'use client';

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
  'w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/40 focus:border-purple-400';

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
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm sm:p-4" onClick={onClose}>
      <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }} onClick={e => e.stopPropagation()}
        className="bg-white dark:bg-gray-800 rounded-t-3xl sm:rounded-3xl w-full sm:max-w-lg shadow-2xl border border-gray-100 dark:border-gray-700 max-h-[94vh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-700">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Proposer un avancement</h2>
          <button onClick={onClose} aria-label="Fermer" className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"><X size={18} /></button>
        </div>

        <div className="p-5 space-y-4 overflow-y-auto">
          <p className="text-xs text-gray-500 flex items-start gap-2 bg-gray-50 dark:bg-gray-900/40 rounded-xl p-3">
            <Lock size={14} className="shrink-0 mt-0.5" /> Cette proposition est confidentielle : seule la RH la voit. L'employé ne sera informé qu'en cas de validation.
          </p>

          {!employeeId && (
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Employé</label>
              <select className={`${inputCls} mt-1`} value={empId} onChange={e => setEmpId(e.target.value)}>
                <option value="">Choisir…</option>
                {employees.map(e => <option key={e.id} value={e.id}>{e.firstName} {e.lastName}{e.position ? ` — ${e.position}` : ''}</option>)}
              </select>
            </div>
          )}
          {employeeId && emp && <p className="text-sm font-bold text-gray-900 dark:text-white">{emp.firstName} {emp.lastName} <span className="font-normal text-gray-400">· {emp.position}</span></p>}

          <div className="grid grid-cols-1 gap-2">
            {(Object.keys(PROPOSAL_TYPE_LABEL) as Proposal['type'][]).map(k => (
              <button key={k} type="button" onClick={() => setType(k)}
                className={`py-3 px-3 rounded-xl text-sm font-bold border text-left transition-colors ${type === k ? 'bg-purple-600 text-white border-purple-600' : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600'}`}>
                {PROPOSAL_TYPE_LABEL[k]}
              </button>
            ))}
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Poste ou échelon visé</label>
            <input className={`${inputCls} mt-1`} value={target} onChange={e => setTarget(e.target.value)} placeholder={placeholder} />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Pourquoi ? <span className="text-xs font-normal text-gray-400">(faits, résultats, compétences)</span></label>
            <textarea rows={4} className={`${inputCls} mt-1`} value={justification} onChange={e => setJustification(e.target.value)}
              placeholder="Appuyez-vous sur des éléments concrets : objectifs atteints, évaluations, compétences acquises…" />
          </div>

          {reviews.length > 0 && (
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Évaluation à l'appui (facultatif)</label>
              <select className={`${inputCls} mt-1`} value={reviewId} onChange={e => setReviewId(e.target.value)}>
                <option value="">Aucune</option>
                {reviews.map(r => <option key={r.id} value={r.id}>{r.period}{r.scoreLabel ? ` — ${r.scoreLabel}` : ''}</option>)}
              </select>
            </div>
          )}

          {error && <p className="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 rounded-xl p-3 break-words">{error}</p>}
        </div>

        <div className="p-5 border-t border-gray-100 dark:border-gray-700 flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-gray-200 dark:border-gray-600 font-bold text-gray-600 dark:text-gray-300">Annuler</button>
          <button onClick={submit} disabled={busy || !empId || !target.trim() || justification.trim().length < 10}
            className="flex-1 py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold shadow-lg shadow-purple-500/20 disabled:opacity-60 flex items-center justify-center gap-2">
            {busy && <Loader2 size={16} className="animate-spin" />} Envoyer à la RH
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}