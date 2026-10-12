// ============================================================================
// 📁 services/audit-engine.ts
// Types = EXACTEMENT ce que renvoie le back (src/audit-engine). Chaque champ
// déclaré ici est affiché quelque part dans les écrans de contrôle de paie.
// ============================================================================
import { api } from '@/services/api';
import type { AuditSeverity } from '@/services/audit-trail';

export type FindingStatus = 'OPEN' | 'JUSTIFIED' | 'WAIVED' | 'RESOLVED';
export type RunTrigger = 'MANUAL' | 'GATE' | 'CRON';
export type RuleCategory = 'CONTRATS' | 'PAIE' | 'CNSS' | 'FISCAL' | 'DOSSIER' | 'DECLARATIONS';
export type GateMode = 'enforce' | 'observe';

export interface RuleDef {
  code: string;
  label: string;
  description: string;
  category: RuleCategory;
  severity: AuditSeverity;
  blocking: boolean;
  automation: 'AUTO' | 'SEMI';
  legalRef?: string;
  checklistRef?: string;
}

export interface CheckpointDef {
  code: string;
  label: string;
  evidenceHint: string;
  legalRef: string;
}

export interface RulesCatalog {
  rules: RuleDef[];
  checkpoints: CheckpointDef[];
  gateMode: GateMode;
}

export interface Finding {
  id: string;
  runId: string | null;
  ruleCode: string;
  severity: AuditSeverity;
  blocking: boolean;
  status: FindingStatus;
  entity: string; // PAYROLL | EMPLOYEE | CONTRACT_CHAIN | COMPANY
  entityId: string | null;
  employeeId: string | null;
  employeeName: string | null;
  periodMonth: number | null;
  periodYear: number | null;
  message: string;
  expected: string | null;
  actual: string | null;
  resolutionNote: string | null;
  resolvedAt: string | null;
  resolvedByName: string | null;
  autoResolved: boolean;
  firstDetectedAt: string;
  lastDetectedAt: string;
}

export interface FindingsResponse {
  data: Finding[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

export interface RunView {
  id: string;
  month: number;
  year: number;
  trigger: RunTrigger;
  startedByName: string | null;
  startedAt: string;
  finishedAt: string;
  payrollsChecked: number;
  payrollsWithFindings: number;
  rulesRun: number;
  findingsNew: number;
  findingsResolved: number;
  findingsOpen: number;
  openCritical: number;
  openBlocking: number;
}

export interface RunSummary {
  runId: string;
  month: number;
  year: number;
  trigger: RunTrigger;
  startedAt: string;
  finishedAt: string;
  payrollsChecked: number;
  payrollsWithFindings: number;
  rulesRun: number;
  findingsNew: number;
  findingsResolved: number;
  findingsOpen: number;
  openCritical: number;
  openBlocking: number;
}

export type CheckpointStatus = 'DONE' | 'NOT_APPLICABLE' | 'PENDING' | 'NOT_DUE';

export interface CheckpointView {
  code: string;
  label: string;
  evidenceHint: string;
  legalRef: string;
  dueDate: string | null;
  status: CheckpointStatus;
  overdue: boolean;
  evidenceRef: string | null;
  note: string | null;
  attestedByName: string | null;
  attestedAt: string | null;
}

export interface AuditSummary {
  period: { month: number; year: number } | null;
  lastRun: RunView | null;
  payrollsChecked: number;
  payrollsWithOpenFindings: number;
  conformityRate: number | null;
  open: { total: number; critical: number; warn: number; info: number; blocking: number };
  byStatus: Record<FindingStatus, number>;
  byCategory: Array<{ category: string; open: number }>;
  checkpoints: CheckpointView[];
  /** false pour le support plateforme : compteurs seulement. */
  detailVisible: boolean;
}

/** Un mois de la courbe de tendance. `hasRun=false` : aucun contrôle ce mois-là (les valeurs sont null, pas 0). */
export interface TrendPoint {
  year: number;
  month: number;
  hasRun: boolean;
  runs: number;
  lastRunAt: string | null;
  payrollsChecked: number | null;
  payrollsWithFindings: number | null;
  conformityRate: number | null;
  findingsOpen: number | null;
  openCritical: number | null;
  openBlocking: number | null;
  findingsNew: number | null;
  findingsResolved: number | null;
}

export interface TopRule {
  ruleCode: string;
  count: number; // écarts détectés dans la fenêtre
  open: number; // encore ouverts
}

export interface TrendResponse {
  windowMonths: number;
  months: TrendPoint[];
  topRules: TopRule[];
}

export interface FindingsQuery {
  companyId?: string;
  month?: number;
  year?: number;
  status?: FindingStatus;
  severity?: AuditSeverity;
  blocking?: boolean;
  ruleCode?: string;
  employeeId?: string;
  page?: number;
  limit?: number;
}

/** Écart tel que renvoyé dans le refus 422 AUDIT_BLOCKED (sous-ensemble). */
export interface BlockedFinding {
  id: string;
  ruleCode: string;
  severity: AuditSeverity;
  message: string;
  expected: string | null;
  actual: string | null;
  entity: string;
  entityId: string | null;
  employeeId: string | null;
}

export interface AuditBlocked {
  total: number;
  message: string;
  findings: BlockedFinding[];
}

/** Retourne le détail d'un refus de validation (422 AUDIT_BLOCKED), sinon null. */
export function auditBlockedOf(err: any): AuditBlocked | null {
  if (err?.code !== 'AUDIT_BLOCKED' || !Array.isArray(err?.data?.findings)) return null;
  return { total: Number(err.data.total) || err.data.findings.length, message: err.message, findings: err.data.findings };
}

export interface AttestPayload {
  companyId?: string;
  code: string;
  month: number;
  year: number;
  status: 'DONE' | 'NOT_APPLICABLE';
  evidenceRef?: string;
  note?: string;
}

const qs = (o: Record<string, string | number | boolean | undefined>) => {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(o)) if (v !== undefined && v !== '') p.set(k, String(v));
  const s = p.toString();
  return s ? `?${s}` : '';
};

export const auditEngineService = {
  rules: () => api.get<RulesCatalog>('/audit-engine/rules'),
  summary: (q: { companyId?: string; month?: number; year?: number }) =>
    api.get<AuditSummary>(`/audit-engine/summary${qs({ ...q })}`),
  trend: (q: { companyId?: string; months?: number }) => api.get<TrendResponse>(`/audit-engine/trend${qs({ ...q })}`),
  findings: (q: FindingsQuery) => api.get<FindingsResponse>(`/audit-engine/findings${qs({ ...q })}`),
  run: (p: { companyId?: string; month: number; year: number }) => api.post<RunSummary>('/audit-engine/run', p),
  justify: (id: string, note: string) => api.post<Finding>(`/audit-engine/findings/${id}/justify`, { note }),
  waive: (id: string, note: string) => api.post<Finding>(`/audit-engine/findings/${id}/waive`, { note }),
  reopen: (id: string) => api.post<Finding>(`/audit-engine/findings/${id}/reopen`, {}),
  checkpoints: (q: { companyId?: string; month: number; year: number }) =>
    api.get<CheckpointView[]>(`/audit-engine/checkpoints${qs({ ...q })}`),
  attest: (p: AttestPayload) => api.post<CheckpointView[]>('/audit-engine/checkpoints', p),
};