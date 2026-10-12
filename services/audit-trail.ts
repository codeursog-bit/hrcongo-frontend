// ============================================================================
// 📁 services/audit-trail.ts
// Types = EXACTEMENT la vue renvoyée par audit-trail.query.service (back).
// ============================================================================
import { api } from '@/services/api';

export type AuditSeverity = 'INFO' | 'WARN' | 'CRITICAL';

export interface AuditChanges {
  values: Record<string, { from: unknown; to: unknown }>;
  maskedFields: string[]; // champs modifiés dont la valeur n'est volontairement pas conservée
}

export interface AuditEvent {
  id: string;
  seq: string; // numéro d'ordre dans l'entreprise (BigInt → texte)
  occurredAt: string;
  actor: {
    type: 'USER' | 'SYSTEM';
    id: string | null;
    role: string | null;
    label: string | null;
  };
  action: string;
  entity: string;
  entityId: string | null;
  severity: AuditSeverity;
  summary: string;
  changes: AuditChanges | null;
  ip: string | null;
}

export interface AuditListResponse {
  data: AuditEvent[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

export interface AuditQuery {
  companyId?: string; // contexte cabinet / PME (vérifié côté serveur)
  entity?: string;
  entityId?: string;
  action?: string;
  actorId?: string;
  severity?: AuditSeverity;
  from?: string; // ISO 8601
  to?: string;
  page?: number;
  limit?: number;
}

export interface ChainVerification {
  ok: boolean;
  checked: number;
  truncated?: boolean;
  headHash?: string | null;
  brokenAtSeq?: string;
  reason?: 'SEQ_GAP' | 'PREV_HASH_MISMATCH' | 'HASH_MISMATCH';
}

export interface AuditDayPoint {
  date: string; // YYYY-MM-DD (heure de Brazzaville)
  info: number;
  warn: number;
  critical: number;
}

export interface AuditStats {
  windowDays: number;
  totals: { events: number; info: number; warn: number; critical: number };
  days: AuditDayPoint[];
  topActions: Array<{ action: string; count: number }>;
  topEntities: Array<{ entity: string; count: number }>;
}

const qs = (o: Record<string, string | number | undefined>) => {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(o)) if (v !== undefined && v !== '') p.set(k, String(v));
  const s = p.toString();
  return s ? `?${s}` : '';
};

export const auditTrailService = {
  events: (q: AuditQuery) =>
    api.get<AuditListResponse>(`/audit-trail/events${qs({ ...q })}`),
  history: (entity: string, entityId: string, companyId?: string) =>
    api.get<AuditEvent[]>(`/audit-trail/history/${entity}/${entityId}${qs({ companyId })}`),
  stats: (q: { companyId?: string; days?: number }) => api.get<AuditStats>(`/audit-trail/stats${qs({ ...q })}`),
  verify: (companyId?: string) =>
    api.get<ChainVerification>(`/audit-trail/verify${qs({ companyId })}`),
};