import { api } from "@/services/api";
import { consumeAssistantStream } from "@/lib/assistant/stream";
import type {
  AssistantAdapter,
  AssistantCapabilities,
  AssistantConversation,
  AssistantSummary,
  HelpArticle,
} from "@/types/contracts/assistant";
const base = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
export const assistantApi: AssistantAdapter = {
  employees: (q) => api.get("/assistant/employees?q=" + encodeURIComponent(q)),
  trackGuide: async (guideId, state, sessionId) => {
    await api.post("/assistant/guide-events", { guideId, state, sessionId });
  },
  trackUpgrade: async () => {
    await api.post("/assistant/upgrade-click", {});
  },
  companyPreference: (analysisEnabled) =>
    api.patch<AssistantCapabilities>("/assistant/preferences", {
      analysisEnabled,
    }),
  capabilities: () => api.get<AssistantCapabilities>("/assistant/capabilities"),
  help: () => api.get<HelpArticle[]>("/assistant/help"),
  suggestions: () => api.get<string[]>("/assistant/suggestions"),
  list: () => api.get<AssistantSummary[]>("/assistant/conversations"),
  get: (id) =>
    api.get<AssistantConversation>(
      `/assistant/conversations/${encodeURIComponent(id)}`,
    ),
  remove: async (id) => {
    await api.delete(`/assistant/conversations/${encodeURIComponent(id)}`);
  },
  feedback: async (messageId, rating) => {
    await api.post("/assistant/feedback", { messageId, rating });
  },
  chat: async (input, onEvent, signal) => {
    const config: RequestInit = {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        Accept: "text/event-stream",
      },
      body: JSON.stringify(input),
      signal,
    };
    let response = await fetch(base + "/assistant/chat", config);
    if (response.status === 401) {
      const refresh = await fetch(base + "/auth/refresh", {
        method: "POST",
        credentials: "include",
        signal,
      });
      if (refresh.ok) response = await fetch(base + "/assistant/chat", config);
    }
    if (!response.ok) {
      const data = await response
        .json()
        .catch(() => ({ message: "Chat temporairement indisponible." }));
      throw new Error(
        Array.isArray(data.message)
          ? data.message.join(" ")
          : data.message || "Chat indisponible.",
      );
    }
    if (!response.body) throw new Error("Réponse indisponible.");
    await consumeAssistantStream(response.body, onEvent, signal);
  },
};
