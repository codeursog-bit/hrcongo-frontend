// ============================================================================
// 📁 lib/permission-return.ts
// ✅ Helpers partagés du circuit « retour de permission » :
//    l'employé DÉCLARE son retour, l'admin / RH le VALIDE.
//    - actualReturnTime       = retour VALIDÉ (jamais une simple déclaration)
//    - returnDeclaredAt       = heure du clic « Je suis de retour »
//    - actualDepartureTime    = sortie effective, seulement si corrigée
// ============================================================================

export type ReturnState = 'NOT_RETURNED' | 'PENDING_VALIDATION' | 'CONFIRMED';

export interface PermissionTicketLike {
  id: string;
  status: string;
  departureTime: string;
  expectedReturnTime: string;
  actualDepartureTime?: string | null;
  actualReturnTime?: string | null;
  returnStatus?: ReturnState | null;
  returnDeclaredAt?: string | null;
  returnConfirmedAt?: string | null;
  returnConfirmedByUser?: { firstName?: string | null; lastName?: string | null; email?: string | null } | null;
  timesAdjusted?: boolean;
}

/** Sortie réellement retenue : la sortie corrigée si elle existe, sinon la sortie autorisée */
export const effectiveDeparture = (t: PermissionTicketLike): string =>
  t.actualDepartureTime || t.departureTime;

/** Rétro-compatible : un ancien ticket avec actualReturnTime et sans returnStatus = confirmé */
export const returnState = (t: PermissionTicketLike): ReturnState =>
  t.returnStatus ?? (t.actualReturnTime ? 'CONFIRMED' : 'NOT_RETURNED');

export const isReturnPending = (t: PermissionTicketLike) => returnState(t) === 'PENDING_VALIDATION';

/** Ticket qui attend une action de l'administration (autorisation OU validation de retour) */
export const needsAdminAction = (t: PermissionTicketLike) =>
  t.status === 'PENDING' || (t.status === 'APPROVED' && isReturnPending(t));

export const fmtTime = (d?: string | Date | null) =>
  d ? new Date(d).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '—';

export const fmtDateTime = (d?: string | Date | null) =>
  d ? new Date(d).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—';

export const fmtDateTimeFull = (d?: string | Date | null) =>
  d ? new Date(d).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

export const fmtDuration = (from?: string | null, to?: string | null): string => {
  if (!from || !to) return '—';
  const min = Math.max(0, Math.round((new Date(to).getTime() - new Date(from).getTime()) / 60000));
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h > 0 ? `${h} h ${String(m).padStart(2, '0')}` : `${m} min`;
};

export const personName = (u?: { firstName?: string | null; lastName?: string | null; email?: string | null } | null) => {
  if (!u) return '—';
  const n = `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim();
  return n || u.email || '—';
};

// ── <input type="datetime-local"> ⇄ ISO ────────────────────────────────────
export const toLocalInput = (iso?: string | null): string => {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
};
export const fromLocalInput = (v: string): string => new Date(v).toISOString();

/** Deux dates ISO représentent-elles la même minute ? */
export const sameMinute = (a?: string | null, b?: string | null) =>
  !!a && !!b && Math.floor(new Date(a).getTime() / 60000) === Math.floor(new Date(b).getTime() / 60000);

export const ROLE_LABEL: Record<string, string> = {
  ADMIN: 'Admin',
  SUPER_ADMIN: 'Admin',
  HR_MANAGER: 'RH manager',
  MANAGER: 'Manager',
  EMPLOYEE: 'Employé',
};

export const EVENT_LABEL: Record<string, string> = {
  CREATED: 'Ticket créé',
  APPROVED: 'Sortie autorisée',
  REJECTED: 'Sortie refusée',
  CANCELLED: 'Ticket annulé',
  RETURN_DECLARED: 'Retour déclaré par l’employé',
  RETURN_CONFIRMED: 'Retour validé',
  RETURN_REJECTED: 'Retour non validé',
  TIMES_EDITED: 'Heures corrigées',
};
