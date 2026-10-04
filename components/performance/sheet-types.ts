// ============================================================================
// 📄 components/performance/sheet-types.ts
// Types + helpers partagés par les pages performance (fiche, cycles, mon espace)
// ============================================================================

export type ReviewStatus = 'DRAFT' | 'SUBMITTED' | 'ACKNOWLEDGED';

export interface SheetGoal {
  id: string;
  title: string;
  kpi?: string | null;
  support?: string | null;
  weight: number | null;
  score?: number | null;
  managerComment?: string | null;
  progress?: number;
  status?: string;
  endDate?: string;
  validatedAt?: string | null;
}

export interface SheetCriterion {
  id: string;
  label: string;
  description?: string;
  weight: number;
  score?: number;
  comment?: string;
}

export interface SelfAssessment {
  goals: Array<{ goalId: string; score?: number; comment?: string }>;
  criteria: Array<{ id: string; score?: number; comment?: string }>;
  comment?: string;
}

export interface Sheet {
  review: {
    id: string;
    period: string;
    reviewType?: string;
    status: ReviewStatus;
    date: string;
    employee: {
      id: string; firstName: string; lastName: string;
      position?: string; photoUrl?: string | null; department?: string | null;
    };
    reviewer?: { id: string; firstName: string; lastName: string };
    cycle: {
      id: string; name: string; status: 'OPEN' | 'CLOSED';
      objectivesWeight: number; selfAssessmentEnabled: boolean;
    } | null;
    objectivesScore: number | null;
    competenciesScore: number | null;
    overallScore: number | null;
    verdict: string | null;
    strengths: string | null;
    improvements: string | null;
    feedback: string | null;
    employeeComment: string | null;
    employeeCommentAt: string | null;
    selfSubmittedAt: string | null;
    submittedAt: string | null;
    acknowledgedAt: string | null;
  };
  goals: SheetGoal[];
  criteria: SheetCriterion[];
  nextGoals: SheetGoal[];
  selfAssessment: SelfAssessment | null;
  scoreLevels: Record<string, string>;
  permissions: {
    isSelf: boolean;
    canEdit: boolean;
    canSubmit: boolean;
    canSelfAssess: boolean;
    canAcknowledge: boolean;
  };
}

export const STATUS_LABEL: Record<ReviewStatus, { label: string; cls: string }> = {
  DRAFT:        { label: 'Brouillon',    cls: 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-300' },
  SUBMITTED:    { label: 'Soumise',      cls: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400' },
  ACKNOWLEDGED: { label: 'Réceptionnée', cls: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' },
};

export const fmtDate = (d?: string | null) =>
  d ? new Date(d).toLocaleDateString('fr-FR') : '—';

export const sumWeights = (items: Array<{ weight?: number | null }>) =>
  Math.round(items.reduce((s, i) => s + Number(i.weight ?? 0), 0) * 100) / 100;

export const scoreTone = (s: number) => {
  if (s >= 4) return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
  if (s >= 3) return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
  if (s >= 2) return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
  return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
};

export function getStoredUser(): { role?: string; id?: string } | null {
  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export const HR_ROLES = ['ADMIN', 'SUPER_ADMIN', 'HR_MANAGER', 'CABINET_ADMIN', 'CABINET_GESTIONNAIRE'];
export const MANAGE_ROLES = [...HR_ROLES, 'MANAGER'];