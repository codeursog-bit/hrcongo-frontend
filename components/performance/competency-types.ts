// ============================================================================
// 📄 components/performance/competency-types.ts — types partagés (phase 2)
// ============================================================================

export type CompetencyCategory = 'TECHNICAL' | 'BEHAVIORAL' | 'MANAGERIAL';

export const CATEGORY_LABEL: Record<CompetencyCategory, string> = {
  TECHNICAL: 'Technique',
  BEHAVIORAL: 'Comportementale',
  MANAGERIAL: 'Managériale',
};

export const CATEGORY_CLS: Record<CompetencyCategory, string> = {
  TECHNICAL: 'bg-[var(--brand-soft)] text-[var(--action)]',
  BEHAVIORAL: 'bg-[var(--brand-soft)] text-[var(--action)]',
  MANAGERIAL: 'bg-[color-mix(in_srgb,var(--mustard)_14%,var(--surface))] text-[var(--warning-text)]',
};

export interface CompetencyItem {
  id: string;
  name: string;
  category: CompetencyCategory;
  description?: string | null;
  levels?: Record<string, string> | null;
  isActive: boolean;
  courses: Array<{ id: string; title: string }>;
  _count?: { jobRequirements: number };
}

export interface JobProfileItem {
  id: string;
  title: string;
  description?: string | null;
  employeeCount: number;
  requirements: Array<{
    id: string;
    competencyId: string;
    requiredLevel: number;
    competency: { id: string; name: string; category: CompetencyCategory };
  }>;
}

export interface GapRowData {
  competency: {
    id: string; name: string; category: CompetencyCategory;
    description: string | null; levels: Record<string, string> | null;
  };
  required: number;
  current: number | null;
  gap: number;
  assessedAt: string | null;
  source: 'REVIEW' | 'MANUAL' | null;
  courses: Array<{ id: string; title: string; durationHours: number | null }>;
}

export interface EmployeeCompetencies {
  employee: { id: string; firstName: string; lastName: string; position: string } | null;
  canAssess?: boolean;
  profile: { id: string; title: string; description?: string | null } | null;
  rows: GapRowData[];
  summary: {
    total: number; assessed: number; met: number; gaps: number; notAssessed: number; coverage: number;
  } | null;
}

export interface TeamOverview {
  employees: Array<{
    id: string; firstName: string; lastName: string; position: string; photoUrl?: string | null;
    department?: { name: string } | null; hasProfile: boolean;
    summary: EmployeeCompetencies['summary'];
  }>;
  topNeeds: Array<{ competencyId: string; name: string; employees: number; totalGap: number }>;
  withoutProfile: number;
}