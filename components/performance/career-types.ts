// ============================================================================
// 📄 components/performance/career-types.ts — types partagés (phase 3)
// ============================================================================

export type TimelineKind = 'HIRE' | 'CAREER' | 'ECHELON' | 'TRAINING' | 'REVIEW';

export interface TimelineItem {
  id: string;
  kind: TimelineKind;
  type?: string;
  date: string;
  title: string;
  fromValue?: string | null;
  toValue?: string | null;
  detail?: string | null;
  notes?: string | null;
  deletable?: boolean;
  reviewId?: string;
}

export interface CareerData {
  employee: {
    id: string; firstName: string; lastName: string; position: string;
    department?: string | null; echelon?: string | null;
  } | null;
  items: TimelineItem[];
  canEdit?: boolean;
  canPropose?: boolean;
}

export const EVENT_TYPES: Array<{ value: string; label: string }> = [
  { value: 'POSITION_CHANGE', label: 'Changement de poste' },
  { value: 'PROMOTION', label: 'Promotion' },
  { value: 'DEPARTMENT_CHANGE', label: 'Changement de service' },
  { value: 'ECHELON_CHANGE', label: "Changement d'échelon" },
  { value: 'CONTRACT_CHANGE', label: 'Changement de contrat' },
  { value: 'CONFIRMATION', label: 'Confirmation (fin de période d\'essai)' },
  { value: 'OTHER', label: 'Autre' },
];

export type PromotionStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';

export interface Proposal {
  id: string;
  employeeId: string;
  type: 'POSITION_CHANGE' | 'ECHELON_MERIT' | 'OTHER';
  currentValue?: string | null;
  targetValue: string;
  justification: string;
  status: PromotionStatus;
  createdAt: string;
  decidedAt?: string | null;
  decisionComment?: string | null;
  appliedToEmployee: boolean;
  proposedByName?: string | null;
  decidedByName?: string | null;
  review?: { id: string; period: string; overallScore: number | string | null; verdict: string | null } | null;
  canDecide: boolean;
  canCancel: boolean;
  employee: {
    id: string; firstName: string; lastName: string; position: string; photoUrl?: string | null;
    department?: { name: string } | null;
  };
}

export const PROPOSAL_TYPE_LABEL: Record<Proposal['type'], string> = {
  POSITION_CHANGE: 'Promotion de poste',
  ECHELON_MERIT: 'Avancement au mérite (échelon)',
  OTHER: 'Autre évolution',
};

export const PROPOSAL_STATUS: Record<PromotionStatus, { label: string; cls: string }> = {
  PENDING:   { label: 'En attente', cls: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300' },
  APPROVED:  { label: 'Validée',    cls: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300' },
  REJECTED:  { label: 'Refusée',    cls: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300' },
  CANCELLED: { label: 'Annulée',    cls: 'bg-gray-100 dark:bg-gray-700 text-gray-500' },
};

export type ActionStatus = 'TODO' | 'IN_PROGRESS' | 'DONE';
export type ActionType = 'TRAINING' | 'MENTORING' | 'PROJECT' | 'SELF_STUDY' | 'OTHER';

export interface DevAction {
  id: string;
  type: ActionType;
  title: string;
  description?: string | null;
  status: ActionStatus;
  dueDate?: string | null;
  completedAt?: string | null;
  employeeNote?: string | null;
  course?: { id: string; title: string } | null;
  competency?: { id: string; name: string } | null;
}

export interface DevPlan {
  id: string;
  title: string;
  status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  dueDate?: string | null;
  actions: DevAction[];
  progress: { total: number; done: number; pct: number };
}

export interface PlansData { employeeId: string | null; canEdit?: boolean; plans: DevPlan[] }

export const ACTION_TYPE_LABEL: Record<ActionType, string> = {
  TRAINING: 'Formation', MENTORING: 'Mentorat / tutorat', PROJECT: 'Projet / mission',
  SELF_STUDY: 'Auto-formation', OTHER: 'Autre',
};

export const ACTION_STATUS_LABEL: Record<ActionStatus, string> = {
  TODO: 'À faire', IN_PROGRESS: 'En cours', DONE: 'Fait',
};