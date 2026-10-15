'use client';

// ============================================================================
// 📁 components/permissions/ReturnValidationPanel.tsx
// ✅ Admin / RH : valider (ou refuser) le retour déclaré par un employé.
//    Les heures sont pré-remplies avec la déclaration et ajustables ; si elles
//    changent, un motif est exigé (traçabilité).
// ============================================================================

import React, { useMemo, useState } from 'react';
import { Check, X, Loader2 } from 'lucide-react';
import { api } from '@/services/api';
import {
  PermissionTicketLike, effectiveDeparture, toLocalInput, fromLocalInput, sameMinute, fmtTime,
} from '@/lib/permission-return';

export default function ReturnValidationPanel({
  ticket, onUpdated,
}: { ticket: PermissionTicketLike; onUpdated: (updated: any) => void }) {
  const initialDeparture = toLocalInput(effectiveDeparture(ticket));
  const initialReturn = toLocalInput(ticket.returnDeclaredAt);
  const [departure, setDeparture] = useState(initialDeparture);
  const [ret, setRet] = useState(initialReturn);
  const [note, setNote] = useState('');
  const [rejectMode, setRejectMode] = useState(false);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const adjusted = useMemo(
    () => departure !== initialDeparture || ret !== initialReturn,
    [departure, ret, initialDeparture, initialReturn],
  );
  const invalidOrder = !!departure && !!ret && new Date(ret) <= new Date(departure);

  const confirm = async () => {
    setError('');
    if (!ret) { setError('Renseignez l’heure de retour.'); return; }
    if (invalidOrder) { setError('Le retour doit être après la sortie.'); return; }
    if (adjusted && !note.trim()) { setError('Un motif est requis quand vous modifiez les heures.'); return; }
    setBusy(true);
    try {
      const body: any = {};
      if (ret !== initialReturn) body.actualReturnTime = fromLocalInput(ret);
      if (departure !== initialDeparture) body.actualDepartureTime = fromLocalInput(departure);
      if (note.trim()) body.note = note.trim();
      const updated = await api.patch(`/permission-tickets/${ticket.id}/return/confirm`, body);
      onUpdated(updated);
    } catch (e: any) { setError(e?.message || 'Erreur lors de la validation'); }
    finally { setBusy(false); }
  };

  const reject = async () => {
    setError('');
    if (!reason.trim()) { setError('Indiquez le motif.'); return; }
    setBusy(true);
    try {
      const updated = await api.patch(`/permission-tickets/${ticket.id}/return/reject`, { reason: reason.trim() });
      onUpdated(updated);
    } catch (e: any) { setError(e?.message || 'Erreur'); }
    finally { setBusy(false); }
  };

  return (
    <div className="rounded-xl border border-amber-200 dark:border-amber-800 p-4 space-y-3">
      <p className="text-sm font-bold text-[var(--text)]">Valider le retour</p>
      <p className="text-xs text-[var(--text-muted)]">
        L’employé a déclaré son retour à <b className="text-[var(--text)]">{fmtTime(ticket.returnDeclaredAt)}</b>. Vérifiez les heures avant de confirmer.
      </p>

      {!rejectMode ? (
        <>
          <div className="grid grid-cols-2 gap-2">
            <label className="text-[11px] font-semibold text-[var(--text-muted)]">Sortie effective
              <input type="datetime-local" value={departure} onChange={e => setDeparture(e.target.value)} className="mt-1 w-full px-2.5 py-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-xs" />
            </label>
            <label className="text-[11px] font-semibold text-[var(--text-muted)]">Retour
              <input type="datetime-local" value={ret} onChange={e => setRet(e.target.value)} className="mt-1 w-full px-2.5 py-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-xs" />
            </label>
          </div>
          {adjusted && (
            <textarea value={note} onChange={e => setNote(e.target.value)} rows={2} placeholder="Motif de l’ajustement (obligatoire)" className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-xs resize-none" />
          )}
          {error && <p className="text-xs text-red-600">{error}</p>}
          <div className="flex gap-2">
            <button onClick={confirm} disabled={busy} className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white text-sm font-bold rounded-xl flex items-center justify-center gap-2">
              {busy ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />} Confirmer le retour
            </button>
            <button onClick={() => { setRejectMode(true); setError(''); }} disabled={busy} className="px-4 py-2.5 border border-[var(--border)] hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 text-[var(--text-muted)] text-sm font-semibold rounded-xl flex items-center gap-1.5">
              <X size={15} /> Non validé
            </button>
          </div>
        </>
      ) : (
        <div className="space-y-2">
          <textarea value={reason} onChange={e => setReason(e.target.value)} rows={2} autoFocus placeholder="Motif (ex. déclaré par erreur, pas encore revenu…)" className="w-full px-3 py-2 rounded-lg border border-red-200 dark:border-red-800 bg-[var(--surface)] text-xs resize-none" />
          {error && <p className="text-xs text-red-600">{error}</p>}
          <div className="flex gap-2">
            <button onClick={reject} disabled={busy || !reason.trim()} className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 disabled:opacity-40 text-white text-sm font-bold rounded-xl flex items-center justify-center gap-2">
              {busy ? <Loader2 size={15} className="animate-spin" /> : <X size={15} />} Confirmer le refus
            </button>
            <button onClick={() => { setRejectMode(false); setReason(''); setError(''); }} className="px-4 py-2.5 border border-[var(--border)] text-sm font-semibold rounded-xl text-[var(--text-muted)]">Annuler</button>
          </div>
        </div>
      )}
    </div>
  );
}
