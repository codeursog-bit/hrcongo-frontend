'use client';

// ============================================================================
// 📄 app/(dashboard)/performance/carriere/page.tsx
// Carrière : propositions d'avancement + accès au parcours de chaque employé.
//  • Manager : propose pour les employés de son département, voit ses propositions
//  • RH      : voit toutes les propositions, valide ou refuse (décision humaine)
// ============================================================================

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Plus, Loader2, X, AlertTriangle, ChevronRight, Search, TrendingUp, Users,
  Check, Ban, Info, CheckCircle2,
} from 'lucide-react';
import { api } from '@/services/api';
import PerformanceNav from '@/components/performance/PerformanceNav';
import { useBasePath } from '@/hooks/useBasePath';
import { HR_ROLES, getStoredUser, fmtDate } from '@/components/performance/sheet-types';
import { ProposalModal } from '@/components/performance/ProposalModal';
import { PROPOSAL_STATUS, PROPOSAL_TYPE_LABEL, Proposal, PromotionStatus } from '@/components/performance/career-types';
import { TeamOverview } from '@/components/performance/competency-types';

type Tab = 'proposals' | 'team';

const inputCls =
  'w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/40 focus:border-purple-400';
const cardCls = 'bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm';

// ─── Décision (RH) ───────────────────────────────────────────────────────────
function DecisionModal({ proposal, onClose, onDone }: { proposal: Proposal; onClose: () => void; onDone: (msg: string) => void }) {
  const [decision, setDecision] = useState<'APPROVED' | 'REJECTED'>('APPROVED');
  const [comment, setComment] = useState('');
  const [effective, setEffective] = useState(new Date().toISOString().slice(0, 10));
  const [apply, setApply] = useState(true);
  const [notifyEmployee, setNotifyEmployee] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setBusy(true); setError(null);
    try {
      const r = await api.patch<{ applied: boolean; positionChangedSince?: boolean }>(`/performance/career/proposals/${proposal.id}/decision`, {
        decision, comment: comment || undefined, effectiveDate: effective, applyToEmployee: apply, notifyEmployee,
      });
      let msg = decision === 'REJECTED' ? 'Proposition refusée.' : 'Proposition validée et ajoutée au parcours de l\'employé.';
      if (decision === 'APPROVED' && r?.applied) msg += ' Le poste de la fiche employé a été mis à jour.';
      if (r?.positionChangedSince) msg += " Le poste de l'employé avait changé depuis la proposition : sa fiche n'a pas été modifiée.";
      if (decision === 'APPROVED' && proposal.type === 'ECHELON_MERIT')
        msg += " L'échelon n'est pas modifié automatiquement : mettez-le à jour dans la fiche employé.";
      onDone(msg); onClose();
    } catch (e: any) { setError(e?.message || 'Décision impossible'); }
    finally { setBusy(false); }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm sm:p-4" onClick={onClose}>
      <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }} onClick={e => e.stopPropagation()}
        className="bg-white dark:bg-gray-800 rounded-t-3xl sm:rounded-3xl w-full sm:max-w-lg shadow-2xl border border-gray-100 dark:border-gray-700 max-h-[94vh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-700">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Décision</h2>
          <button onClick={onClose} aria-label="Fermer" className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"><X size={18} /></button>
        </div>
        <div className="p-5 space-y-4 overflow-y-auto">
          <div className="rounded-xl bg-gray-50 dark:bg-gray-900/40 p-4 text-sm space-y-1.5">
            <p className="font-bold text-gray-900 dark:text-white">{proposal.employee.firstName} {proposal.employee.lastName}</p>
            <p className="text-gray-600 dark:text-gray-300">{PROPOSAL_TYPE_LABEL[proposal.type]} : {proposal.currentValue ? `${proposal.currentValue} → ` : ''}<b>{proposal.targetValue}</b></p>
            <p className="text-gray-500 dark:text-gray-400 break-words">« {proposal.justification} »</p>
            {proposal.review && <p className="text-xs text-gray-400">Évaluation à l'appui : {proposal.review.period}{proposal.review.verdict ? ` — ${proposal.review.verdict}` : ''}</p>}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={() => setDecision('APPROVED')}
              className={`py-3 rounded-xl text-sm font-bold border flex items-center justify-center gap-2 ${decision === 'APPROVED' ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600'}`}>
              <Check size={16} /> Valider
            </button>
            <button type="button" onClick={() => setDecision('REJECTED')}
              className={`py-3 rounded-xl text-sm font-bold border flex items-center justify-center gap-2 ${decision === 'REJECTED' ? 'bg-red-500 text-white border-red-500' : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600'}`}>
              <Ban size={16} /> Refuser
            </button>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Commentaire {decision === 'REJECTED' ? '(transmis au responsable)' : '(facultatif)'}</label>
            <textarea rows={3} className={`${inputCls} mt-1`} value={comment} onChange={e => setComment(e.target.value)} />
          </div>

          {decision === 'APPROVED' && (
            <>
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Date d'effet</label>
                <input type="date" className={`${inputCls} mt-1`} value={effective} onChange={e => setEffective(e.target.value)} />
              </div>
              {proposal.type === 'POSITION_CHANGE' && (
                <label className="flex items-start gap-3 p-3 rounded-xl border border-gray-200 dark:border-gray-600 cursor-pointer">
                  <input type="checkbox" className="w-5 h-5 accent-purple-600 mt-0.5" checked={apply} onChange={e => setApply(e.target.checked)} />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Mettre à jour le poste dans la fiche employé<span className="block text-xs text-gray-400">Le poste devient « {proposal.targetValue} ». Le salaire n'est pas modifié.</span></span>
                </label>
              )}
              {proposal.type === 'ECHELON_MERIT' && (
                <p className="text-xs text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/20 rounded-xl p-3 flex gap-2"><Info size={14} className="shrink-0 mt-0.5" /> L'échelon et le salaire ne sont pas modifiés automatiquement. Après validation, mettez-les à jour dans la fiche employé.</p>
              )}
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" className="w-5 h-5 accent-purple-600" checked={notifyEmployee} onChange={e => setNotifyEmployee(e.target.checked)} />
                <span className="text-sm text-gray-700 dark:text-gray-300">Informer l'employé</span>
              </label>
            </>
          )}
          {error && <p className="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 rounded-xl p-3 break-words">{error}</p>}
        </div>
        <div className="p-5 border-t border-gray-100 dark:border-gray-700 flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-gray-200 dark:border-gray-600 font-bold text-gray-600 dark:text-gray-300">Annuler</button>
          <button onClick={submit} disabled={busy}
            className={`flex-1 py-3 rounded-xl text-white font-bold shadow-lg disabled:opacity-60 flex items-center justify-center gap-2 ${decision === 'APPROVED' ? 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20' : 'bg-red-500 hover:bg-red-600 shadow-red-500/20'}`}>
            {busy && <Loader2 size={16} className="animate-spin" />} Confirmer
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────
export default function CareerHubPage() {
  const { bp } = useBasePath();
  const [isHR, setIsHR] = useState(false);
  const [tab, setTab] = useState<Tab>('proposals');
  const [filter, setFilter] = useState<'PENDING' | 'ALL'>('PENDING');
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [team, setTeam] = useState<TeamOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [creating, setCreating] = useState(false);
  const [deciding, setDeciding] = useState<Proposal | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [p, t] = await Promise.all([
        api.get<Proposal[]>('/performance/career/proposals'),
        api.get<TeamOverview>('/performance/competencies/team'),
      ]);
      setProposals(p); setTeam(t); setError(null);
    } catch (e: any) { setError(e?.message || 'Chargement impossible'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    const u = getStoredUser();
    setIsHR(!!u?.role && HR_ROLES.includes(u.role));
    load();
  }, [load]);

  const cancel = async (p: Proposal) => {
    if (!confirm('Annuler cette proposition ?')) return;
    try { await api.patch(`/performance/career/proposals/${p.id}/cancel`, {}); load(); }
    catch (e: any) { alert(e?.message || 'Annulation impossible'); }
  };

  const pendingCount = proposals.filter(p => p.status === 'PENDING').length;
  const shown = proposals.filter(p => filter === 'ALL' || p.status === 'PENDING');
  const q = search.toLowerCase();
  const people = (team?.employees ?? []).filter(e => !q || `${e.firstName} ${e.lastName} ${e.position}`.toLowerCase().includes(q));

  return (
    <div className="max-w-[1200px] mx-auto pb-20 space-y-6 sm:space-y-8">
      <PerformanceNav />
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link href={bp('/performance')} className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-purple-600 mb-2"><ArrowLeft size={14} /> Performance</Link>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white tracking-tight">Carrière</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm sm:text-base">Propositions d'avancement et parcours de chaque employé</p>
        </div>
        <button onClick={() => setCreating(true)}
          className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold shadow-lg shadow-purple-500/20 flex items-center justify-center gap-2">
          <Plus size={20} /> Proposer un avancement
        </button>
      </div>

      {error && <div className="rounded-xl bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 text-sm p-4 flex items-center gap-2"><AlertTriangle size={16} /> {error}</div>}
      {notice && (
        <div className="rounded-xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 text-sm p-4 flex items-start justify-between gap-2">
          <span className="flex items-start gap-2"><CheckCircle2 size={16} className="mt-0.5 shrink-0" /> {notice}</span>
          <button onClick={() => setNotice(null)} aria-label="Fermer"><X size={14} /></button>
        </div>
      )}

      <div className="flex gap-2 overflow-x-auto">
        {([['proposals', 'Propositions', <TrendingUp key="i" size={16} />], ['team', isHR ? 'Employés' : 'Mon équipe', <Users key="u" size={16} />]] as const).map(([k, label, icon]) => (
          <button key={k} onClick={() => setTab(k as Tab)}
            className={`whitespace-nowrap px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-colors ${tab === k ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-100 dark:border-gray-700'}`}>
            {icon} {label}{k === 'proposals' && pendingCount > 0 && <span className="ml-1 px-1.5 py-0.5 rounded-full bg-amber-400 text-white text-[11px]">{pendingCount}</span>}
          </button>
        ))}
      </div>

      {loading && !team ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-purple-600" size={28} /></div>
      ) : tab === 'proposals' ? (
        <div className="space-y-4">
          <div className="flex gap-2">
            {([['PENDING', 'En attente'], ['ALL', 'Toutes']] as const).map(([k, label]) => (
              <button key={k} onClick={() => setFilter(k)}
                className={`px-3.5 py-2 rounded-lg text-sm font-bold ${filter === k ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'}`}>{label}</button>
            ))}
          </div>
          {shown.length === 0 ? (
            <div className={`${cardCls} p-10 text-center`}>
              <TrendingUp className="mx-auto text-gray-300 mb-3" size={36} />
              <p className="font-bold text-gray-900 dark:text-white">{filter === 'PENDING' ? 'Aucune proposition en attente' : 'Aucune proposition'}</p>
              {!isHR && <p className="text-sm text-gray-500 mt-1">Vous voyez uniquement les propositions que vous avez faites.</p>}
            </div>
          ) : (
            <div className="grid gap-3">
              {shown.map(p => {
                const st = PROPOSAL_STATUS[p.status as PromotionStatus];
                return (
                  <motion.div key={p.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className={`${cardCls} p-4 sm:p-5 space-y-3`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <Link href={bp(`/performance/carriere/employe/${p.employee.id}`)} className="font-bold text-gray-900 dark:text-white hover:text-purple-600 break-words">
                          {p.employee.firstName} {p.employee.lastName}
                        </Link>
                        <p className="text-xs text-gray-400">{[p.employee.position, p.employee.department?.name].filter(Boolean).join(' · ')}</p>
                      </div>
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-bold shrink-0 ${st.cls}`}>{st.label}</span>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      {PROPOSAL_TYPE_LABEL[p.type]} : {p.currentValue ? <span className="text-gray-400">{p.currentValue} → </span> : null}<b className="text-purple-700 dark:text-purple-300">{p.targetValue}</b>
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 break-words">« {p.justification} »</p>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-400">
                      <span>Proposée le {fmtDate(p.createdAt)}{p.proposedByName ? ` par ${p.proposedByName}` : ''}</span>
                      {p.review && <span>Évaluation : {p.review.period}{p.review.verdict ? ` (${p.review.verdict})` : ''}</span>}
                      {p.decidedAt && <span>Décision le {fmtDate(p.decidedAt)}{p.decidedByName ? ` par ${p.decidedByName}` : ''}</span>}
                    </div>
                    {p.decisionComment && <p className="text-xs text-gray-500 bg-gray-50 dark:bg-gray-900/40 rounded-lg p-2.5 break-words"><b>Commentaire :</b> {p.decisionComment}</p>}
                    {(p.canDecide || p.canCancel) && (
                      <div className="flex flex-wrap gap-2 pt-1">
                        {p.canDecide && <button onClick={() => setDeciding(p)} className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-sm font-bold">Décider</button>}
                        {p.canCancel && <button onClick={() => cancel(p)} className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 text-sm font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">Annuler la proposition</button>}
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="relative max-w-sm">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input className={`${inputCls} pl-9`} placeholder="Rechercher un employé…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          {people.length === 0 ? (
            <div className={`${cardCls} p-10 text-center text-sm text-gray-500`}>Aucun employé dans votre périmètre.</div>
          ) : (
            <div className="grid gap-3">
              {people.map(e => (
                <Link key={e.id} href={bp(`/performance/carriere/employe/${e.id}`)} className={`${cardCls} p-4 flex items-center gap-3 sm:gap-4 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors`}>
                  <div className="w-11 h-11 rounded-full bg-gradient-to-br from-purple-400 to-purple-700 flex items-center justify-center font-bold text-white text-sm shrink-0">
                    {e.photoUrl ? <img referrerPolicy="no-referrer" src={e.photoUrl} alt="" className="w-full h-full rounded-full object-cover" /> : `${e.firstName[0] ?? ''}${e.lastName[0] ?? ''}`.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-900 dark:text-white truncate">{e.firstName} {e.lastName}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{[e.position, e.department?.name].filter(Boolean).join(' · ')}</p>
                  </div>
                  <ChevronRight size={18} className="text-gray-400 shrink-0" />
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      <AnimatePresence>
        {creating && <ProposalModal employees={team?.employees ?? []} onClose={() => setCreating(false)} onDone={() => { setNotice('Proposition envoyée à la RH.'); load(); }} />}
        {deciding && <DecisionModal proposal={deciding} onClose={() => setDeciding(null)} onDone={m => { setNotice(m); load(); }} />}
      </AnimatePresence>
    </div>
  );
}