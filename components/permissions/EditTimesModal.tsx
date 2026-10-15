'use client';

// ============================================================================
// 📁 components/permissions/EditTimesModal.tsx
// ✅ Admin / RH : corriger les heures de sortie et/ou de retour (imprévus).
//    Le motif est obligatoire ; l'ancienne valeur reste dans l'historique du ticket.
// ============================================================================

import React, { useEffect, useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { api } from '@/services/api';
import {
  PermissionTicketLike, effectiveDeparture, toLocalInput, fromLocalInput, fmtTime,
} from '@/lib/permission-return';

export default function EditTimesModal({
  open, onClose, ticket, onUpdated,
}: { open: boolean; onClose: () => void; ticket: PermissionTicketLike | null; onUpdated: (updated: any) => void }) {
  const [departure, setDeparture] = useState('');
  const [ret, setRet] = useState('');
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  // Pré-remplissage à chaque ouverture : retour validé, sinon retour déclaré par l'employé
  useEffect(() => {
    if (!open || !ticket) return;
    setDeparture(toLocalInput(effectiveDeparture(ticket)));
    setRet(toLocalInput(ticket.actualReturnTime || ticket.returnDeclaredAt));
    setReason('');
    setError('');
  }, [open, ticket?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!open || !ticket) return null;

  const origDeparture = toLocalInput(effectiveDeparture(ticket));
  const origReturn = toLocalInput(ticket.actualReturnTime);
  const departureChanged = departure !== origDeparture;
  const returnChanged = !!ret && ret !== origReturn;

  const submit = async () => {
    setError('');
    if (!departureChanged && !returnChanged) { setError('Aucune heure n’a été modifiée.'); return; }
    if (departure && ret && new Date(ret) <= new Date(departure)) { setError('Le retour doit être après la sortie.'); return; }
    if (!reason.trim()) { setError('Le motif de la correction est obligatoire.'); return; }
    setBusy(true);
    try {
      const body: any = { reason: reason.trim() };
      if (departureChanged) body.actualDepartureTime = fromLocalInput(departure);
      if (returnChanged) body.actualReturnTime = fromLocalInput(ret);
      const updated = await api.patch(`/permission-tickets/${ticket.id}/times`, body);
      onUpdated(updated);
      onClose();
    } catch (e: any) { setError(e?.message || 'Erreur lors de la correction'); }
    finally { setBusy(false); }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div onClick={e => e.stopPropagation()} className="bg-[var(--surface)] rounded-2xl shadow-2xl max-w-md w-full p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-bold text-[var(--text)]">Modifier les heures</p>
            <p className="text-xs text-[var(--text-muted)]">Autorisé : {fmtTime(ticket.departureTime)} → {fmtTime(ticket.expectedReturnTime)}</p>
          </div>
          <button onClick={onClose} className="text-[var(--text-muted)] hover:text-[var(--text)]"><X size={20} /></button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <label className="text-[11px] font-semibold text-[var(--text-muted)]">Heure de sortie
            <input type="datetime-local" value={departure} onChange={e => setDeparture(e.target.value)} className="mt-1 w-full px-2.5 py-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-xs" />
          </label>
          <label className="text-[11px] font-semibold text-[var(--text-muted)]">Heure de retour
            <input type="datetime-local" value={ret} onChange={e => setRet(e.target.value)} className="mt-1 w-full px-2.5 py-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-xs" />
          </label>
        </div>

        <label className="block text-[11px] font-semibold text-[var(--text-muted)]">Motif de la correction (obligatoire)
          <textarea value={reason} onChange={e => setReason(e.target.value)} rows={2} placeholder="Ex. imprévu en cours de mission, retard de transport…" className="mt-1 w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-xs resize-none" />
        </label>

        <p className="text-[11px] text-[var(--text-muted)]">L’employé sera prévenu et l’ancienne valeur restera visible dans l’historique du ticket.</p>
        {error && <p className="text-xs text-red-600">{error}</p>}

        <div className="flex gap-2">
          <button onClick={submit} disabled={busy} className="flex-1 py-2.5 bg-[var(--text)] text-[var(--bg)] text-sm font-bold rounded-xl flex items-center justify-center gap-2 disabled:opacity-50">
            {busy && <Loader2 size={15} className="animate-spin" />} Enregistrer
          </button>
          <button onClick={onClose} className="px-4 py-2.5 border border-[var(--border)] text-sm font-semibold rounded-xl text-[var(--text-muted)]">Annuler</button>
        </div>
      </div>
    </div>
  );
}
