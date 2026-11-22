import { api } from "@/services/api";
export const ASSISTANT_PLANS = [
  "TRIAL",
  "FREE",
  "BASIC",
  "PRO",
  "ENTERPRISE",
] as const;
export interface AssistantSettings {
  mode: "OFF" | "INTEGRE" | "IA_AVANCEE";
  provider?: string;
  model?: string;
  licenseConfirmed?: boolean;
  licenseProvider?: string;
  licenseReference?: string;
  licenseDate?: string;
  analysisEnabled: boolean;
  killSwitch: boolean;
  guideEnabled: boolean;
  disabledGuides: string[];
  retentionDays: number;
  trialCredits?: number;
  creditsPerAnalysis?: number;
  creditsPerMessage?: number;
  planLimits: Record<
    (typeof ASSISTANT_PLANS)[number],
    { maxMode: "OFF" | "INTEGRE" | "IA_AVANCEE"; monthlyAnalyses: number }
  >;
}
export interface AssistantCompany {
  id: string;
  legalName: string;
  assistantOverride: {
    allowed: boolean;
    forceMode: "OFF" | "INTEGRE" | null;
  } | null;
  assistantWallet?: { balance: number; trialGrantedAt: string | null } | null;
}
export interface CreditPack {
  id: string;
  name: string;
  credits: number;
  price: number;
  currency: string;
  active: boolean;
  sortOrder: number;
}
export interface CompanyCredits {
  balance: number;
  trialGrantedAt: string | null;
  ledger: {
    id: string;
    delta: number;
    balanceAfter: number;
    reason: string;
    note: string | null;
    createdAt: string;
  }[];
}
export interface AssistantUsage {
  from: string;
  questions: number;
  conversations: number;
  guideEvents: { action: string; _count: number }[];
  upgradeClicks: number;
  refusals: number;
  tools: { tool: string; charged: boolean; _count: number }[];
  changes: {
    id: string;
    userId: string;
    entity: string;
    description: string;
    createdAt: string;
  }[];
}
export const assistantAdmin = {
  testModel: () =>
    api.post<{ ok: boolean; message: string }>(
      "/admin/assistant/model-test",
      {},
    ),
  settings: () => api.get<AssistantSettings>("/admin/assistant/settings"),
  save: ({
    mode,
    analysisEnabled,
    killSwitch,
    guideEnabled,
    disabledGuides,
    retentionDays,
    trialCredits,
    creditsPerAnalysis,
    creditsPerMessage,
    planLimits,
    provider,
    model,
    licenseConfirmed,
    licenseProvider,
    licenseDate,
    licenseReference,
  }: AssistantSettings) =>
    api.put<AssistantSettings>("/admin/assistant/settings", {
      mode,
      analysisEnabled,
      killSwitch,
      guideEnabled,
      disabledGuides,
      retentionDays,
      trialCredits,
      creditsPerAnalysis,
      creditsPerMessage,
      planLimits,
      provider,
      model,
      licenseConfirmed,
      licenseProvider,
      licenseDate,
      licenseReference,
    }),
  packs: () => api.get<CreditPack[]>("/admin/assistant/packs"),
  savePack: (pack: Partial<CreditPack> & { name: string; credits: number; price: number }) =>
    api.put<CreditPack>("/admin/assistant/packs", pack),
  removePack: (id: string) =>
    api.delete("/admin/assistant/packs/" + encodeURIComponent(id)),
  credits: (id: string) =>
    api.get<CompanyCredits>(
      "/admin/assistant/companies/" + encodeURIComponent(id) + "/credits",
    ),
  adjustCredits: (
    id: string,
    body: {
      credits: number;
      reason: "GRANT" | "PURCHASE" | "ADJUST";
      note?: string;
      reference?: string;
    },
  ) =>
    api.post<CompanyCredits>(
      "/admin/assistant/companies/" + encodeURIComponent(id) + "/credits",
      body,
    ),
  usage: () => api.get<AssistantUsage>("/admin/assistant/usage"),
  companies: (search = "") =>
    api.get<AssistantCompany[]>(
      "/admin/assistant/companies?search=" + encodeURIComponent(search),
    ),
  override: (
    id: string,
    value: { allowed: boolean; forceMode: "OFF" | "INTEGRE" | null },
  ) =>
    api.put("/admin/assistant/companies/" + encodeURIComponent(id), {
      allowed: value.allowed,
      forceMode: value.forceMode,
    }),
};