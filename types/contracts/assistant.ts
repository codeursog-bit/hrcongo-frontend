export interface AssistantCapabilities {
  assistantMode: "OFF" | "INTEGRE" | "IA_AVANCEE";
  helpOnly: boolean;
  analysisAvailable: boolean;
  remainingAnalyses: number | null;
  monthlyAnalyses: number | null;
  analysesEnabled?: boolean;
  companyAnalysesEnabled?: boolean;
  usedAnalyses?: number | null;
  usagePercent?: number;
  quotaPeriodStart?: string;
  quotaPeriodEnd?: string;
  plan?: string;
  guideEnabled: boolean;
  disabledGuides: string[];
  retentionDays: number;
  /** Accueil de première arrivée : décidé par le serveur (créateur d'un compte neuf, guide jamais démarré ni masqué). */
  welcome?: { eligible: boolean };
  /** Crédits de l'entreprise (réservé aux administrateurs et RH). */
  credits?: {
    balance: number;
    costPerAnalysis: number;
    costPerMessage: number;
    trialGranted: boolean;
  } | null;
  creditCost?: number;
  messageCost?: number;
}
export interface HelpArticle {
  id: string;
  title: string;
  question: string;
  text: string;
  path: string;
  guideId?: string;
  roles: string[];
}
export interface AssistantPayload {
  analysis?: boolean;
  card?: {
    title: string;
    period: string;
    source: string;
    metrics: { label: string; value: number; unit?: string }[];
    notes?: string[];
    departments?: {
      name: string;
      initial: number;
      hires: number;
      departures: number;
      final: number;
    }[];
    rows?: {
      employeeId: string;
      label: string;
      detail?: string;
      value?: number;
      unit?: string;
      path?: string;
    }[];
  };
  /** Précision demandée par Sofia (période, employé, jours ou homonymes à départager). */
  clarification?: {
    kind: string;
    options?: { id: string; label: string; employeeNumber?: string | null }[];
  };
  source: string;
  refusal: boolean;
  articleId?: string;
  path?: string;
  guideId?: string;
  suggestions: string[];
}
export interface AssistantMessage {
  id: string;
  role: "USER" | "ASSISTANT";
  text: string;
  payload?: AssistantPayload | null;
  rating?: number | null;
  createdAt: string;
}
export interface AssistantConversation {
  id: string;
  title: string;
  createdAt: string;
  updatedAt?: string;
  messages: AssistantMessage[];
}
export interface AssistantSummary {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}
export interface AssistantEvent {
  type: "meta" | "text" | "refusal" | "guide" | "done" | "card";
  data: {
    text?: string;
    guideId?: string;
    conversationId?: string;
    messageId?: string;
    payload?: AssistantPayload;
  };
}
export interface ChatInput {
  analysis?: {
    tool: string;
    month: number;
    year: number;
    employeeId?: string;
    days?: number;
  };
  /** Choix d'un employé parmi les homonymes proposés (le serveur ne l'accepte que parmi les candidats). */
  choice?: { employeeId: string };
  conversationId?: string;
  requestId: string;
  message: string;
}
export interface AssistantAdapter {
  employees?: (
    query: string,
  ) => Promise<
    {
      id: string;
      firstName: string;
      lastName: string;
      employeeNumber: string;
    }[]
  >;
  trackGuide?: (
    guideId: string,
    state: "STARTED" | "COMPLETED" | "DISMISSED" | "POSTPONED",
    sessionId: string,
  ) => Promise<void>;
  trackUpgrade?: () => Promise<void>;
  companyPreference?: (
    analysisEnabled: boolean,
  ) => Promise<AssistantCapabilities>;
  capabilities: () => Promise<AssistantCapabilities>;
  help: () => Promise<HelpArticle[]>;
  suggestions: () => Promise<string[]>;
  list: () => Promise<AssistantSummary[]>;
  get: (id: string) => Promise<AssistantConversation>;
  remove: (id: string) => Promise<void>;
  feedback: (messageId: string, rating: 1 | -1) => Promise<void>;
  chat: (
    input: ChatInput,
    onEvent: (event: AssistantEvent) => void,
    signal: AbortSignal,
  ) => Promise<void>;
}