// ============================================================================
// 📁 services/approvals.ts — LOT A + B + C + D + E
// ============================================================================

import { api } from '@/services/api';

export interface ApprovalFunctionDef {
  code: string;
  label: string;
  description: string;
}

export interface UserFunctionItem {
  code: string;
  canSign: boolean;
}

export interface CompanyFunctionsResponse {
  catalog: ApprovalFunctionDef[];
  // userId → fonctions attribuées
  assignments: Record<string, UserFunctionItem[]>;
}

export interface MyApprovalContext {
  functions: { code: string; label: string; canSign: boolean }[];
  canSign: boolean;
  signatureUrl: string | null;
}

// ── LOT B ────────────────────────────────────────────────────────────────────
export type ApprovalKind = 'loan' | 'advance' | 'absence' | 'leave';

export interface CircuitsConfig {
  circuits: Record<'LOAN' | 'ADVANCE' | 'ABSENCE' | 'LEAVE', { isActive: boolean; steps: string[] }>;
  catalog: ApprovalFunctionDef[];
  holdersByCode: Record<string, string[]>;
  canEdit: boolean;
}

export interface OpinionView {
  functionCode: string;
  label: string;
  opinion: 'FAVORABLE' | 'UNFAVORABLE';
  comment: string | null;
  authorName: string;
  signatureUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ApprovalStateView {
  requestType: 'LOAN' | 'ADVANCE' | 'ABSENCE' | 'LEAVE';
  requestId: string;
  requestStatus: string;
  circuitActive: boolean;
  steps: {
    position: number;
    code: string;
    label: string;
    holders: string[];
    hasHolder: boolean;
    opinion: OpinionView | null;
  }[];
  opinions: OpinionView[];
  missing: { code: string; label: string }[];
  pending: {
    state: string; // WAITING_OPINIONS | NEEDS_CONFIRMATION | FINALIZING | FINALIZED | CANCELLED | SUPERSEDED
    decidedByName: string;
    decidedAt: string;
    forced: boolean;
    forcedMissing: { code: string; label: string }[];
    missing: { code: string; label: string }[];
    finalizedAt: string | null;
  } | null;
  me: {
    canDecide: boolean;
    canGiveOpinionAs: { code: string; label: string }[];
  };
}

export interface InboxItem {
  requestType: 'LOAN' | 'ADVANCE' | 'ABSENCE' | 'LEAVE';
  requestId: string;
  employeeName: string;
  amount: number | null;
  // Résumé lisible : « 120 000 FCFA » ou « 3 jour(s) du … au … »
  detail: string;
  reason: string | null;
  createdAt: string;
  myMissing: { code: string; label: string }[];
  awaitingDecisionBy: string | null;
}

export type DecisionResult =
  | { status: 'FINALIZED'; request: any; forced?: boolean }
  | { status: 'WAITING_OPINIONS'; pending: any }
  | { status: 'NEEDS_CHOICE'; missing: { code: string; label: string; holders: string[] }[] };

export interface DecisionBody {
  decision: 'APPROVE' | 'REJECT';
  rejectionReason?: string;
  recoverViaPayroll?: boolean;
  // Absences : la RH peut trancher « payée / non payée » à la décision
  isPaid?: boolean;
  // Congés : jours d'ancienneté déjà reportés + motif de report (lettre de départ)
  extraDaysGranted?: number;
  resumptionNote?: string;
  mode?: 'ASK' | 'WAIT' | 'NOW';
}

// ── LOT D — signatures pour les documents imprimables ───────────────────────
export interface DocumentSignature {
  functionCode: string;
  label: string;
  opinion: 'FAVORABLE' | 'UNFAVORABLE';
  authorName: string;
  signatureUrl: string | null;
  date: string;
}

const base = (kind: ApprovalKind, id: string) => `/approvals/requests/${kind}/${id}`;

export const approvalsApi = {
  // LOT A
  listCompanyFunctions: () => api.get<CompanyFunctionsResponse>('/approvals/functions'),

  setUserFunctions: (userId: string, functions: UserFunctionItem[]) =>
    api.put<{ userId: string; functions: UserFunctionItem[] }>(
      `/approvals/functions/users/${userId}`,
      { functions },
    ),

  getMe: () => api.get<MyApprovalContext>('/approvals/me'),

  uploadMySignature: (file: File) => {
    const fd = new FormData();
    fd.append('signature', file);
    return api.postFormData<{ signatureUrl: string }>('/approvals/me/signature', fd);
  },

  deleteMySignature: () => api.delete<{ signatureUrl: null }>('/approvals/me/signature'),

  // LOT B — circuits
  getCircuits: () => api.get<CircuitsConfig>('/approvals/circuits'),

  saveCircuit: (kind: ApprovalKind, body: { isActive: boolean; steps: string[] }) =>
    api.put<any>(`/approvals/circuits/${kind}`, body),

  // LOT B — avis & décisions
  getInbox: () => api.get<{ items: InboxItem[] }>('/approvals/inbox'),

  getState: (kind: ApprovalKind, id: string) =>
    api.get<ApprovalStateView>(`${base(kind, id)}/state`),

  giveOpinion: (
    kind: ApprovalKind,
    id: string,
    body: { functionCode: string; opinion: 'FAVORABLE' | 'UNFAVORABLE'; comment?: string },
  ) => api.post<OpinionView>(`${base(kind, id)}/opinions`, body),

  getSignatures: (kind: ApprovalKind, id: string) =>
    api.get<{ signatures: DocumentSignature[] }>(`${base(kind, id)}/signatures`),

  decide: (kind: ApprovalKind, id: string, body: DecisionBody) =>
    api.post<DecisionResult>(`${base(kind, id)}/decision`, body),

  finalize: (kind: ApprovalKind, id: string) =>
    api.post<DecisionResult>(`${base(kind, id)}/finalize`, {}),

  cancelPending: (kind: ApprovalKind, id: string) =>
    api.post<{ status: 'CANCELLED' }>(`${base(kind, id)}/cancel-pending`, {}),
};
