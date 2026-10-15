// components/portfolio/requests.ts
// Demandes (congés, absences, prêts, avances) de TOUTES les entreprises du
// portefeuille, normalisées dans un seul format + règle des 24 h.
//
// Règle d'affichage :
//   • demande EN ATTENTE  → reste affichée tant qu'elle n'est pas traitée
//   • demande TRAITÉE     → reste visible 24 h après la décision, puis disparaît
//
// L'heure de décision vient du backend si elle est fournie (decidedAt,
// approvedAt, rejectedAt, reviewedAt, cancelledAt, ou updatedAt pour les statuts
// APPROVED / REJECTED / CANCELLED). À défaut, on utilise l'heure locale où la
// décision a été prise depuis cette page (localStorage).

import { api } from '@/services/api';

export type RequestKind = 'leave' | 'absence' | 'loan' | 'advance';

export const DAY_MS = 24 * 60 * 60 * 1000;
/** Évènement window : une demande vient d'être traitée → compteurs à rafraîchir */
export const REQUESTS_CHANGED_EVENT = 'konza:portfolio-requests-changed';

export interface PortfolioRequest {
  key: string;            // `${kind}:${id}`
  kind: RequestKind;
  id: string;
  status: string;
  employeeName: string;
  companyId: string;
  companyName: string;
  title: string;          // ex. "Congé annuel", "Absence · Maladie", "Prêt"
  detail: string;         // période ou montant
  reason?: string;
  isPaid?: boolean;
  createdAt?: string;
  updatedAt?: string;
  decidedAt?: string;
}

export type HandledRequest = PortfolioRequest & { handledAt: number };

type Raw = Record<string, any>;

// ─── Helpers d'affichage ─────────────────────────────────────────────────────

const fmtDate = (d?: string) => (d ? new Date(d).toLocaleDateString('fr-FR') : '');
const fmtFCFA = (n: number) => new Intl.NumberFormat('fr-FR').format(Math.round(n || 0)) + ' FCFA';
const coName = (c?: { legalName?: string; tradeName?: string | null }) => c?.tradeName || c?.legalName || 'Entreprise';
const fullName = (e?: { firstName?: string; lastName?: string }) => [e?.firstName, e?.lastName].filter(Boolean).join(' ') || 'Employé';

const LEAVE_LABELS: Record<string, string> = {
  ANNUAL: 'Congé annuel',
  ANNUAL_ANTICIPATED: 'Congé annuel anticipé',
};
const SUBTYPE_LABELS: Record<string, string> = {
  MALADIE: 'Maladie', MATERNITE: 'Maternité', PATERNITE: 'Paternité',
  MARIAGE: 'Mariage', DECES: 'Décès', NAISSANCE: 'Naissance', AUTRE: 'Autre',
};

const pickDecided = (r: Raw): string | undefined =>
  r.decidedAt || r.approvedAt || r.rejectedAt || r.reviewedAt || r.cancelledAt || undefined;

/** "il y a 5 min", "il y a 3 h", "il y a 2 j" */
export function timeAgo(input: string | number | Date): string {
  const t = input instanceof Date ? input.getTime() : typeof input === 'number' ? input : Date.parse(input);
  if (Number.isNaN(t)) return '';
  const diff = Math.max(0, Date.now() - t);
  const min = Math.floor(diff / 60000);
  if (min < 1) return "à l'instant";
  if (min < 60) return `il y a ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `il y a ${h} h`;
  const d = Math.floor(h / 24);
  return `il y a ${d} j`;
}

/** "dans 21 h" avant disparition d'une demande traitée */
export function disappearsIn(handledAt: number): string {
  const left = Math.max(0, DAY_MS - (Date.now() - handledAt));
  const h = Math.floor(left / 3600000);
  if (h >= 1) return `disparaît dans ${h} h`;
  const m = Math.max(1, Math.ceil(left / 60000));
  return `disparaît dans ${m} min`;
}

// ─── Statuts ─────────────────────────────────────────────────────────────────

export const isPendingStatus = (status: string) => status === 'PENDING' || status === 'PENDING_DG';
const HANDLED_STATUSES = ['APPROVED', 'REJECTED', 'CANCELLED', 'ACTIVE'];

// ─── Mémoire locale des décisions (secours si le backend ne renvoie pas l'heure) ─

const LS_KEY = 'konza:portfolio:handled';

function readHandled(): Record<string, number> {
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(LS_KEY) : null;
    return raw ? (JSON.parse(raw) as Record<string, number>) : {};
  } catch {
    return {};
  }
}

export function markHandled(key: string) {
  try {
    const now = Date.now();
    const map = readHandled();
    for (const k of Object.keys(map)) if (now - map[k] > 2 * DAY_MS) delete map[k];
    map[key] = now;
    localStorage.setItem(LS_KEY, JSON.stringify(map));
  } catch { /* stockage indisponible : on se contente de l'heure du backend */ }
}

function handledAt(r: PortfolioRequest, local: Record<string, number>): number | undefined {
  if (r.decidedAt) {
    const t = Date.parse(r.decidedAt);
    if (!Number.isNaN(t)) return t;
  }
  if (local[r.key]) return local[r.key];
  if (['APPROVED', 'REJECTED', 'CANCELLED'].includes(r.status) && r.updatedAt) {
    const t = Date.parse(r.updatedAt);
    if (!Number.isNaN(t)) return t;
  }
  return undefined;
}

/** En attente (toujours) + traitées depuis moins de 24 h. Le reste disparaît. */
export function splitByLifecycle(items: PortfolioRequest[]): { pending: PortfolioRequest[]; recent: HandledRequest[] } {
  const local = readHandled();
  const now = Date.now();
  const pending: PortfolioRequest[] = [];
  const recent: HandledRequest[] = [];
  for (const r of items) {
    if (isPendingStatus(r.status)) { pending.push(r); continue; }
    if (!HANDLED_STATUSES.includes(r.status)) continue;
    const t = handledAt(r, local);
    if (t !== undefined && now - t < DAY_MS) recent.push({ ...r, handledAt: t });
  }
  const byCreatedDesc = (a: PortfolioRequest, b: PortfolioRequest) =>
    (Date.parse(b.createdAt || '') || 0) - (Date.parse(a.createdAt || '') || 0);
  pending.sort(byCreatedDesc);
  recent.sort((a, b) => b.handledAt - a.handledAt);
  return { pending, recent };
}

// ─── Normalisation des 3 sources ─────────────────────────────────────────────

const fromLeave = (r: Raw): PortfolioRequest => ({
  key: `leave:${r.id}`, kind: 'leave', id: r.id, status: r.status,
  employeeName: fullName(r.employee),
  companyId: r.company?.id ?? r.companyId ?? '',
  companyName: coName(r.company),
  title: LEAVE_LABELS[r.type] ?? 'Congé',
  detail: `${fmtDate(r.startDate)} → ${fmtDate(r.endDate)}`,
  reason: r.reason || undefined,
  createdAt: r.createdAt, updatedAt: r.updatedAt, decidedAt: pickDecided(r),
});

const fromAbsence = (r: Raw): PortfolioRequest => ({
  key: `absence:${r.id}`, kind: 'absence', id: r.id, status: r.status,
  employeeName: fullName(r.employee),
  companyId: r.company?.id ?? r.companyId ?? '',
  companyName: coName(r.company),
  title: SUBTYPE_LABELS[r.subType] ? `Absence · ${SUBTYPE_LABELS[r.subType]}` : 'Absence',
  detail: `${fmtDate(r.startDate)} → ${fmtDate(r.endDate)}`,
  reason: r.reason || undefined,
  isPaid: r.isPaid,
  createdAt: r.createdAt, updatedAt: r.updatedAt, decidedAt: pickDecided(r),
});

const fromLoan = (r: Raw, kind: 'loan' | 'advance'): PortfolioRequest => ({
  key: `${kind}:${r.id}`, kind, id: r.id, status: r.status,
  employeeName: fullName(r.employee),
  companyId: r.employee?.companyId ?? r.employee?.company?.id ?? '',
  companyName: coName(r.employee?.company),
  title: kind === 'loan' ? 'Prêt' : 'Avance',
  detail: fmtFCFA(r.amount),
  reason: r.reason || undefined,
  createdAt: r.createdAt, updatedAt: r.updatedAt, decidedAt: pickDecided(r),
});

/**
 * Charge congés + absences + prêts/avances de toutes les entreprises (ou d'une
 * seule). Un échec sur une source n'empêche pas les autres : `failed` dit
 * combien de listes n'ont pas pu être chargées.
 */
export async function fetchPortfolioRequests(companyId?: string): Promise<{ items: PortfolioRequest[]; failed: number }> {
  const q = companyId ? `?companyId=${encodeURIComponent(companyId)}` : '';
  let failed = 0;
  const safe = async <T>(p: Promise<T>, fallback: T): Promise<T> => {
    try { return await p; } catch { failed += 1; return fallback; }
  };

  const [leaves, absences, loansRes] = await Promise.all([
    safe(api.get<Raw[]>(`/portfolio/leaves${q}`), [] as Raw[]),
    safe(api.get<Raw[]>(`/portfolio/absences/requests${q}`), [] as Raw[]),
    safe(api.get<{ loans?: Raw[]; advances?: Raw[] }>(`/portfolio/loans${q}`), {} as { loans?: Raw[]; advances?: Raw[] }),
  ]);

  const items: PortfolioRequest[] = [
    ...(leaves ?? []).map(fromLeave),
    ...(absences ?? []).map(fromAbsence),
    ...(loansRes?.loans ?? []).map(l => fromLoan(l, 'loan')),
    ...(loansRes?.advances ?? []).map(a => fromLoan(a, 'advance')),
  ];
  return { items, failed };
}

// ─── Décision (approuver / refuser) ──────────────────────────────────────────
// Mêmes routes et mêmes payloads que les pages /portefeuille/conges, /absences, /prets.

export async function decideRequest(
  req: PortfolioRequest,
  approve: boolean,
  opts: { reason?: string; isPaid?: boolean } = {},
): Promise<void> {
  const rejectionReason = approve ? undefined : opts.reason;
  switch (req.kind) {
    case 'leave':
      await api.patch(`/portfolio/leaves/${req.id}/status`, { status: approve ? 'APPROVED' : 'REJECTED', rejectionReason });
      break;
    case 'absence':
      await api.patch(`/portfolio/absences/requests/${req.id}/status`, {
        status: approve ? 'APPROVED' : 'REJECTED', rejectionReason, isPaid: approve ? opts.isPaid : undefined,
      });
      break;
    case 'loan':
      await api.patch(`/portfolio/loans/${req.id}/decision`, { decision: approve ? 'OUI' : 'NON', rejectionReason });
      break;
    case 'advance':
      await api.patch(`/portfolio/loans/advances/${req.id}/decision`, { decision: approve ? 'APPROVED' : 'REJECTED', rejectionReason });
      break;
  }
}