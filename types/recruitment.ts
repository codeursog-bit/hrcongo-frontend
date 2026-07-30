// types/recruitment.ts

export enum CreationMode {
  MANUAL = 'MANUAL',
  AI_ASSISTED = 'AI_ASSISTED'
}

export enum EducationLevel {
  BAC = 'Bac',
  BAC_PLUS_2 = 'Bac+2',
  BAC_PLUS_3 = 'Bac+3 (Licence)',
  BAC_PLUS_5 = 'Bac+5 (Master)',
  DOCTORAT = 'Doctorat'
}

export interface QuizQuestion {
  id: string;
  text: string;
  options: string[];
  correctAnswer: number;
  points: number;
}

export interface JobOfferForm {
  title: string;
  description: string;
  requirements: string;
  departmentId: string;
  location: string;
  contractType: string;
  
  mode: CreationMode;
  requiredSkills: string[];
  minExperience: number;
  educationLevel: EducationLevel;
  salaryMin?: string;
  salaryMax?: string;
  testDurationMinutes: number;
  quiz: QuizQuestion[];
}

export interface Department {
  id: string;
  name: string;
}

export interface TestQuestion {
  id: string;
  text: string;
  options: string[];
}

export interface TestState {
  currentQuestionIndex: number;
  answers: Record<string, string>;
  timeRemaining: number;
  tabSwitchCount: number;
  isStarted: boolean;
  isCompleted: boolean;
}

export interface CandidateWithAI {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  resumeUrl: string;
  coverLetter: string;
  status: string;
  createdAt: string;
  
  jobOffer: {
    title: string;
    location: string;
    type: string;
    department: { name: string };
    processingMode: 'MANUAL' | 'AI_ASSISTED';
  };
  
  cvScore?: number;
  testScore?: number;
  totalScore?: number;
  aiSuggestion?: 'RETENU' | 'MOYENNE' | 'SECONDE_CHANCE' | 'REFUS';
  aiReasoning?: string;
  cvAnalysis?: {
    strengths: string[];
    weaknesses: string[];
  };
  tabSwitchCount?: number;
  suspiciousActivity?: boolean;
}

export interface AIStats {
  totalCandidates: number;
  retenuCount: number;
  moyenneCount: number;
  secondeChanceCount: number;
  refusCount: number;
  averageScore: number;
  overrideRate: number;
}

export interface CandidateResult {
  id: string;
  name: string;
  jobTitle: string;
  aiSuggestion: string;
  hrDecision: string;
  totalScore: number;
  appliedAt: string;
}