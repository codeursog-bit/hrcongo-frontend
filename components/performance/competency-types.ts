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
  TECHNICAL: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
  BEHAVIORAL: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300',
  MANAGERIAL: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300',
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