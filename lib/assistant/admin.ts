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
      planLimits,
      provider,
      model,
      licenseConfirmed,
      licenseProvider,
      licenseDate,
      licenseReference,
    }),
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
