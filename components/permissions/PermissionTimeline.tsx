'use client';

// ============================================================================
// 📁 components/permissions/PermissionTimeline.tsx
// ✅ Historique (timeline) d'UN ticket de permission : création, autorisation,
//    déclaration de retour, validation, corrections d'heures — qui, quand, pourquoi.
//    Visible par l'employé concerné et par l'administration.
// ============================================================================

import React, { useEffect, useState } from 'react';
import {
  Ticket, CheckCircle2, XCircle, Ban, LogOut, ShieldCheck, ShieldX, PencilLine, Loader2,
} from 'lucide-react';
import { api } from '@/services/api';
import { EVENT_LABEL, ROLE_LABEL, fmtDateTimeFull, fmtTime, personName } from '@/lib/permission-return';

const EVENT_STYLE: Record<string, { icon: any; cls: string }> = {
  CREATED:          { icon: Ticket,       cls: 'bg-[var(--surface-2)] text-[var(--text-muted)]' },
  APPROVED:         { icon: CheckCircle2, cls: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-300' },
  REJECTED:         { icon: XCircle,      cls: 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-300' },
  CANCELLED:        { icon: Ban,          cls: 'bg-[var(--surface-2)] text-[var(--text-muted)]' },
  RETURN_DECLARED:  { icon: LogOut,       cls: 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-300' },
  RETURN_CONFIRMED: { icon: ShieldCheck,  cls: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-300' },
  RETURN_REJECTED:  { icon: ShieldX,      cls: 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-300' },
  TIMES_EDITED:     { icon: PencilLine,   cls: 'bg-violet-50 text-violet-600 dark:bg-violet-900/20 dark:text-violet-300' },
};

interface TicketEvent {
  id: string;
  type: string;
  note?: string | null;
  data?: any;
  createdAt: string;
  actorRole?: string | null;
  actor?: { firstName?: string; lastName?: string; email?: string } | null;
}

function Detail({ e }: { e: TicketEvent }) {
  const d = e.data || {};
  if (e.type === 'RETURN_DECLARED' && d.declaredAt) {
    return <p className="text-xs text-[var(--text-muted)]">Heure notée : <b className="text-[var(--text)]">{fmtTime(d.declaredAt)}</b></p>;
  }
  if (e.type === 'RETURN_CONFIRMED' && d.returnTime) {
    return (
      <p className="text-xs text-[var(--text-muted)]">
        Sorti de <b className="text-[var(--text)]">{fmtTime(d.departureTime)}</b> à <b className="text-[var(--text)]">{fmtTime(d.returnTime)}</b>
        {d.declaredAt && d.adjusted ? <> · déclaré à {fmtTime(d.declaredAt)}</> : null}
        {d.direct ? ' · enregistré directement' : ''}
      </p>
    );
  }
  if (e.type === 'TIMES_EDITED' && d.before && d.after) {
    return (
      <div className="text-xs text-[var(--text-muted)] space-y-0.5">
        {d.before.departure !== d.after.departure && (
          <p>Sortie : <span className="line-through">{fmtTime(d.before.departure)}</span> → <b className="text-[var(--text)]">{fmtTime(d.after.departure)}</b></p>
        )}
        {d.before.return !== d.after.return && (
          <p>Retour : <span className="line-through">{d.before.return ? fmtTime(d.before.return) : '—'}</span> → <b className="text-[var(--text)]">{fmtTime(d.after.return)}</b></p>
        )}
      </div>
    );
  }
  return null;
}

export default function PermissionTimeline({ ticketId, refreshKey }: { ticketId: string; refreshKey?: string }) {
  const [events, setEvents] = useState<TicketEvent[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let alive = true;
    setEvents(null);
    setError(false);
    api.get(`/permission-tickets/${ticketId}/events`)
      .then((r: any) => { if (alive) setEvents(r || []); })
      .catch(() => { if (alive) setError(true); });
    return () => { alive = false; };
  }, [ticketId, refreshKey]);

  return (
    <div>
      <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-3">Historique du ticket</p>
      {events === null && !error && (
        <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]"><Loader2 size={14} className="animate-spin" /> Chargement…</div>
      )}
      {error && <p className="text-xs text-[var(--text-muted)]">Historique indisponible pour le moment.</p>}
      {events && events.length === 0 && <p className="text-xs text-[var(--text-muted)]">Aucun événement enregistré.</p>}
      {events && events.length > 0 && (
        <ol className="relative border-l border-[var(--border)] ml-3 space-y-4">
          {events.map(e => {
            const st = EVENT_STYLE[e.type] ?? EVENT_STYLE.CREATED;
            const Icon = st.icon;
            const actor = e.actor ? personName(e.actor) : 'Système';
            return (
              <li key={e.id} className="ml-6">
                <span className={`absolute -left-3.5 flex items-center justify-center w-7 h-7 rounded-full ring-4 ring-[var(--surface)] ${st.cls}`}>
                  <Icon size={14} />
                </span>
                <p className="text-sm font-semibold text-[var(--text)] leading-tight">{EVENT_LABEL[e.type] ?? e.type}</p>
                <p className="text-[11px] text-[var(--text-muted)] mb-1">
                  {fmtDateTimeFull(e.createdAt)} · {actor}{e.actorRole ? ` (${ROLE_LABEL[e.actorRole] ?? e.actorRole})` : ''}
                </p>
                <Detail e={e} />
                {e.note && <p className="text-xs text-[var(--text)] bg-[var(--surface-2)] rounded-lg px-2.5 py-1.5 mt-1">« {e.note} »</p>}
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
