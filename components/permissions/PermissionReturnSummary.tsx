'use client';

// ============================================================================
// 📁 components/permissions/PermissionReturnSummary.tsx
// ✅ Bloc d'état du retour — identique côté employé et côté administration :
//    « Sorti de 07:00 à 10:00 », en attente de validation, validé par…, heures ajustées.
// ============================================================================

import React from 'react';
import { Clock, ShieldCheck, Hourglass, PencilLine } from 'lucide-react';
import {
  PermissionTicketLike, effectiveDeparture, returnState, fmtTime, fmtDateTime, fmtDuration, personName,
} from '@/lib/permission-return';

export default function PermissionReturnSummary({ ticket, audience }: { ticket: PermissionTicketLike; audience: 'employee' | 'admin' }) {
  if (ticket.status !== 'APPROVED') return null;
  const state = returnState(ticket);
  const dep = effectiveDeparture(ticket);

  if (state === 'CONFIRMED') {
    return (
      <div className="rounded-xl border border-emerald-100 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-900/20 p-3.5 space-y-1.5">
        <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300 text-sm font-bold">
          <ShieldCheck size={16} />
          Sorti de {fmtTime(dep)} à {fmtTime(ticket.actualReturnTime)}
          <span className="font-medium opacity-70">· {fmtDuration(dep, ticket.actualReturnTime)}</span>
        </div>
        <p className="text-[11px] text-emerald-700/80 dark:text-emerald-300/80">
          Retour validé{ticket.returnConfirmedAt ? ` le ${fmtDateTime(ticket.returnConfirmedAt)}` : ''}
          {ticket.returnConfirmedByUser ? ` par ${personName(ticket.returnConfirmedByUser)}` : ''}
        </p>
        {ticket.timesAdjusted && (
          <p className="text-[11px] flex items-center gap-1 text-violet-600 dark:text-violet-300"><PencilLine size={11} /> Heures ajustées par l’administration (voir l’historique)</p>
        )}
      </div>
    );
  }

  if (state === 'PENDING_VALIDATION') {
    return (
      <div className="rounded-xl border border-amber-100 dark:border-amber-900 bg-amber-50 dark:bg-amber-900/20 p-3.5">
        <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300 text-sm font-bold">
          <Hourglass size={16} />
          {audience === 'employee'
            ? `Retour déclaré à ${fmtTime(ticket.returnDeclaredAt)} — en attente de validation`
            : `Retour déclaré à ${fmtTime(ticket.returnDeclaredAt)} — à valider`}
        </div>
        <p className="text-[11px] text-amber-700/80 dark:text-amber-300/80 mt-1">
          {audience === 'employee'
            ? 'Votre retour sera enregistré dès qu’un administrateur ou le RH l’aura confirmé.'
            : `Sortie ${fmtTime(dep)} · retour prévu ${fmtTime(ticket.expectedReturnTime)}`}
        </p>
      </div>
    );
  }

  // NOT_RETURNED
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-3.5 flex items-center gap-2 text-sm text-[var(--text-muted)]">
      <Clock size={15} /> Pas encore de retour enregistré · sortie {fmtTime(dep)}, retour prévu {fmtTime(ticket.expectedReturnTime)}
    </div>
  );
}
