'use client';

// ============================================================================
// 📁 app/(dashboard)/conges/mon-espace/page.tsx
// ✅ Espace employé — mon solde de congé + mes demandes + mon reliquat de
//    retour anticipé (jours non pris à rattraper, non payés).
// ✅ CORRECTIF : cette page contenait par erreur le code de la page absences
//    (presences/absences/mon-espace) — reconstruite ici pour ce qu'elle doit
//    réellement être : l'espace congé de l'employé connecté.
// ============================================================================

import React, { useEffect, useState } from 'react';
import {
  Loader2, Clock, CheckCircle2, XCircle, Ban, Calendar, ArrowRight,
  Wallet, Info, Umbrella, Zap, X, Check, AlertTriangle, History,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '@/services/api';
import CongeSubNav from '@/components/CongeSubNav';

type Status = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';

const STATUS_CONFIG: Record<Status, { label: string; badge: string; icon: any }> = {
  PENDING:   { label: 'En attente', badge: 'bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800', icon: Clock },
  APPROVED:  { label: 'Approuvé',   badge: 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-800', icon: CheckCircle2 },
  REJECTED:  { label: 'Refusé',     badge: 'bg-red-50 text-red-700 border-red-100 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800', icon: XCircle },
  CANCELLED: { label: 'Annulé',     badge: 'bg-[var(--surface-2)] text-[var(--text-muted)] border-[var(--border)]', icon: Ban },
};

const TYPE_LABELS: Record<string, string> = { ANNUAL: 'Congé annuel', ANNUAL_ANTICIPATED: 'Congé annuel anticipé' };
const TYPE_ICONS: Record<string, any> = { ANNUAL: Umbrella, ANNUAL_ANTICIPATED: Zap };

const fmtDate = (d: string) => new Date(d).toLocaleDateString('fr-FR');

export default function MonEspaceCongesPage() {
  const [userRole, setUserRole] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [balance, setBalance] = useState<any>(null);
  const [myLeaves, setMyLeaves] = useState<any[]>([]);
  const [carryover, setCarryover] = useState<any[]>([]);

  // ✅ Demande de rattrapage (bouton "Demander mes jours restants")
  const [requesting, setRequesting] = useState<any>(null); // le reliquat source choisi
  const [requestForm, setRequestForm] = useState({ startDate: '', endDate: '' });
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);
  const [requestError, setRequestError] = useState('');

  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const load = async () => {
    try {
      const bal: any = await api.get<any>('/leaves/me/balance').catch(() => null);
      const leaves: any[] = await api.get<any[]>('/leaves/me').catch(() => []);
      setBalance(bal);
      setMyLeaves(leaves || []);
      if (bal?.employeeId) {
        const co = await api.get<any[]>(`/leaves/carryover/${bal.employeeId}`).catch(() => []);
        setCarryover(co || []);
      }
    } catch (e) {
      console.error('Erreur chargement de mon espace congés', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
    try {
      const stored = localStorage.getItem('user');
      if (stored) setUserRole(JSON.parse(stored).role || '');
    } catch {}
  }, []);

  const openRequestModal = (source: any) => {
    setRequestError('');
    setRequesting(source);
    setRequestForm({ startDate: '', endDate: '' });
  };

  const submitCarryoverRequest = async () => {
    if (!requesting || !balance?.employeeId) return;
    if (!requestForm.startDate || !requestForm.endDate) {
      setRequestError('Renseigne une date de départ et une date de retour');
      return;
    }
    setIsSubmittingRequest(true);
    setRequestError('');
    try {
      await api.post('/leaves', {
        employeeId: balance.employeeId,
        type: 'ANNUAL',
        startDate: requestForm.startDate,
        endDate: requestForm.endDate,
        reason: 'Demande de rattrapage — reliquat de retour anticipé (repos non payé)',
        carriedFromLeaveId: requesting.sourceLeaveId,
      });
      setRequesting(null);
      await load();
    } catch (e: any) {
      setRequestError(e?.message || 'Erreur lors de la demande de rattrapage');
    } finally {
      setIsSubmittingRequest(false);
    }
  };

  const handleCancel = async (leaveId: string) => {
    if (!confirm('Annuler cette demande de congé ?')) return;
    setCancellingId(leaveId);
    try {
      await api.patch(`/leaves/${leaveId}/cancel`, {});
      await load();
    } catch (e: any) {
      alert(e?.message || "Erreur lors de l'annulation");
    } finally {
      setCancellingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 max-w-5xl mx-auto">
        <CongeSubNav userRole={userRole} />
        <div className="flex items-center justify-center py-24">
          <Loader2 size={28} className="animate-spin text-emerald-500" />
        </div>
      </div>
    );
  }

  const baseAccrued = balance ? Number(balance.annualEntitled) - Number(balance.seniorityDays || 0) : 0;
  const gapToFullBase = Math.max(0, 26 - baseAccrued);
  const pctUsed = balance && Number(balance.annualEntitled) > 0
    ? Math.min(100, Math.round((Number(balance.annualTaken) / Number(balance.annualEntitled)) * 100))
    : 0;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <CongeSubNav userRole={userRole} />

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[var(--text)]">Mon espace congés</h1>
        <p className="text-sm text-[var(--text-muted)]">Mon solde, mes demandes et mes jours à rattraper</p>
      </div>

      {/* ── Solde ── */}
      {balance && (
        <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] p-5 mb-4">
          <div className="flex items-center gap-2 text-sm font-bold text-[var(--text-muted)] mb-3">
            <Wallet size={16} className="text-emerald-500" /> Mon solde de congé
          </div>
          <div className="grid grid-cols-3 gap-4 text-center mb-3">
            <div>
              <p className="text-2xl font-bold text-[var(--text)]">{Math.round(Number(balance.annualEntitled))}j</p>
              <p className="text-xs text-[var(--text-muted)]">Acquis</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-[var(--text)]">{Math.round(Number(balance.annualTaken))}j</p>
              <p className="text-xs text-[var(--text-muted)]">Pris</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{Math.round(Number(balance.annualRemaining))}j</p>
              <p className="text-xs text-[var(--text-muted)]">Restant</p>
            </div>
          </div>
          <div className="h-2 rounded-full bg-[var(--surface-2)] overflow-hidden mb-2">
            <div className="h-full bg-emerald-500" style={{ width: `${pctUsed}%` }} />
          </div>
          {gapToFullBase > 0 && (
            <p className="text-xs text-emerald-500 dark:text-emerald-400">
              Encore {Math.round(gapToFullBase * 10) / 10}j avant d'atteindre les 26j légaux de mon cycle en cours
            </p>
          )}
          {!balance.canTakeAnnualLeave && (
            <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1 mt-1">
              <Info size={12} /> Encore {balance.monthsUntilEligible} mois avant les 12 mois d'ancienneté requis pour un congé annuel normal
            </p>
          )}
        </div>
      )}

      {/* ── Reliquat de retour anticipé — jours non pris à rattraper ── */}
      {carryover.length > 0 && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-5 mb-4">
          <div className="flex items-center gap-2 text-sm font-bold text-amber-700 dark:text-amber-300 mb-3">
            <History size={16} /> Jours restants à prendre (cycle précédent)
          </div>
          <div className="space-y-3">
            {carryover.map(co => (
              <div key={co.sourceLeaveId} className="bg-[var(--surface)] rounded-xl p-3 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm text-[var(--text-muted)]">
                    Congé {co.cycleLabel ? `du cycle ${co.cycleLabel}` : ''} — {fmtDate(co.originalStartDate)} au {fmtDate(co.originalEndDate)}
                  </p>
                  <p className="text-xs text-[var(--text-muted)]">Retour anticipé le {fmtDate(co.actualReturnDate)}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-lg font-bold text-amber-600 dark:text-amber-400">{Math.round(co.remainingDays * 10) / 10}j</span>
                  <button
                    onClick={() => openRequestModal(co)}
                    className="text-xs font-bold px-3 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-white"
                  >
                    Demander mes jours restants
                  </button>
                </div>
              </div>
            ))}
          </div>
          <p className="text-[11px] text-amber-600/70 dark:text-amber-400/70 mt-3">
            Ce reliquat ne fait jamais partie de mon cycle en cours et n'est jamais payé une seconde fois — c'est un repos physique, à faire valider par le RH comme une demande normale.
          </p>
        </div>
      )}

      {/* ── Historique de mes demandes ── */}
      <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] overflow-hidden">
        <div className="px-5 py-3 border-b border-[var(--border)] text-sm font-bold text-[var(--text-muted)]">
          Mes demandes
        </div>
        {myLeaves.length === 0 ? (
          <div className="text-center py-16">
            <Calendar size={28} className="text-[var(--text-muted)] mx-auto mb-2" />
            <p className="text-sm text-[var(--text-muted)]">Aucune demande de congé pour le moment.</p>
          </div>
        ) : (
          <div className="divide-y divide-[var(--border)]">
            {myLeaves.map(leave => {
              const st = STATUS_CONFIG[leave.status as Status] || STATUS_CONFIG.PENDING;
              const StIcon = st.icon;
              const Icon = TYPE_ICONS[leave.type] || Umbrella;
              return (
                <div key={leave.id} className="px-5 py-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <Icon size={16} className="text-[var(--text-muted)] shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[var(--text-muted)] flex items-center gap-1.5 flex-wrap">
                        {leave.carriedFromLeaveId ? 'Rattrapage — reliquat non payé' : (TYPE_LABELS[leave.type] || leave.type)}
                        {leave.carriedFromLeaveId && (
                          <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-1.5 py-0.5 rounded">
                            Non payé
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-[var(--text-muted)] flex items-center gap-1">
                        {fmtDate(leave.startDate)} <ArrowRight size={10} /> {fmtDate(leave.endDate)} · {Math.round(Number(leave.daysCount))}j
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-[11px] font-semibold px-2 py-1 rounded-lg border flex items-center gap-1 ${st.badge}`}>
                      <StIcon size={11} /> {st.label}
                    </span>
                    {['PENDING', 'APPROVED'].includes(leave.status) && (
                      <button
                        onClick={() => handleCancel(leave.id)}
                        disabled={cancellingId === leave.id}
                        className="text-xs font-semibold text-[var(--text-muted)] hover:text-red-500 disabled:opacity-40"
                      >
                        {cancellingId === leave.id ? <Loader2 size={12} className="animate-spin" /> : 'Annuler'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Modale : demander mes jours restants ── */}
      <AnimatePresence>
        {requesting && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.96, opacity: 0 }}
              className="bg-[var(--surface)] rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-[var(--text)]">Demander mes jours restants</h2>
                <button onClick={() => setRequesting(null)} className="text-[var(--text-muted)] hover:text-[var(--text)]">
                  <X size={20} />
                </button>
              </div>
              <p className="text-xs text-[var(--text-muted)]">
                Il te reste <strong>{Math.round(requesting.remainingDays * 10) / 10}j</strong> à rattraper sur ton congé du {fmtDate(requesting.originalStartDate)} au {fmtDate(requesting.originalEndDate)}. Ce repos n'est pas payé une seconde fois et n'affecte pas ton solde en cours — le RH validera comme une demande normale.
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-[var(--text-muted)]">Date de départ</label>
                  <input
                    type="date"
                    value={requestForm.startDate}
                    onChange={e => setRequestForm(f => ({ ...f, startDate: e.target.value }))}
                    className="mt-1 w-full text-sm border border-[var(--border)] bg-[var(--surface-2)] rounded-lg px-3 py-2"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[var(--text-muted)]">Date de retour</label>
                  <input
                    type="date"
                    value={requestForm.endDate}
                    onChange={e => setRequestForm(f => ({ ...f, endDate: e.target.value }))}
                    className="mt-1 w-full text-sm border border-[var(--border)] bg-[var(--surface-2)] rounded-lg px-3 py-2"
                  />
                </div>
              </div>
              {requestError && (
                <div className="flex items-start gap-2 text-xs text-red-500">
                  <AlertTriangle size={14} className="mt-0.5 shrink-0" /> {requestError}
                </div>
              )}
              <div className="flex justify-end gap-2 pt-2">
                <button onClick={() => setRequesting(null)} className="px-4 py-2 text-sm font-semibold rounded-lg text-[var(--text-muted)] hover:bg-[var(--surface-2)]">
                  Annuler
                </button>
                <button
                  onClick={submitCarryoverRequest}
                  disabled={isSubmittingRequest}
                  className="px-4 py-2 text-sm font-bold rounded-lg bg-amber-500 hover:bg-amber-600 text-white flex items-center gap-2 disabled:opacity-40"
                >
                  {isSubmittingRequest ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} Envoyer la demande
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}