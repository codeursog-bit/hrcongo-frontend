import type {
  AssistantAdapter,
  AssistantConversation,
  AssistantPayload,
} from "@/types/contracts/assistant";
import { answerHelp, helpFor } from "@/lib/assistant/help";
import type { FeatureActor } from "@/types/contracts/tasks";
export function assistantDemo(actor: FeatureActor): AssistantAdapter {
  const key = `konza:assistant:demo:${actor.id}:${actor.companyId}`;
  const read = (): AssistantConversation[] => {
    try {
      return JSON.parse(localStorage.getItem(key) || "[]");
    } catch {
      return [];
    }
  };
  const save = (value: AssistantConversation[]) =>
    localStorage.setItem(key, JSON.stringify(value));
  return {
    capabilities: async () => ({
      assistantMode: "INTEGRE",
      helpOnly: true,
      analysisAvailable: false,
      remainingAnalyses: null,
      monthlyAnalyses: null,
      guideEnabled: true,
      disabledGuides: [],
      retentionDays: 90,
    }),
    help: async () => helpFor(actor.role),
    suggestions: async () =>
      helpFor(actor.role)
        .slice(0, 6)
        .map((a) => a.question),
    list: async () =>
      read().map(({ messages, ...summary }) => ({
        ...summary,
        updatedAt: summary.updatedAt || summary.createdAt,
      })),
    get: async (id) => {
      const c = read().find((c) => c.id === id);
      if (!c) throw new Error("Conversation indisponible.");
      return c;
    },
    remove: async (id) => save(read().filter((c) => c.id !== id)),
    feedback: async (id, rating) => {
      const conversations = read();
      const message = conversations
        .flatMap((c) => c.messages)
        .find((m) => m.id === id && m.role === "ASSISTANT");
      if (!message) throw new Error("Réponse indisponible.");
      message.rating = rating;
      save(conversations);
    },
    chat: async (input, onEvent, signal) => {
      if (signal.aborted) throw new DOMException("Annulé", "AbortError");
      const answer = answerHelp(input.message, actor.role),
        all = read();
      let c = all.find((c) => c.id === input.conversationId);
      if (input.conversationId && !c)
        throw new Error("Conversation indisponible.");
      const now = new Date().toISOString();
      if (!c) {
        c = {
          id: crypto.randomUUID(),
          title: answer.article?.title || "Aide à l’application",
          createdAt: now,
          updatedAt: now,
          messages: [],
        };
        all.unshift(c);
      }
      const id = crypto.randomUUID();
      const payload: AssistantPayload = {
        refusal: answer.refusal,
        source: answer.article ? "help:" + answer.article.id : "help:scope",
        articleId: answer.article?.id,
        path: answer.article?.path,
        guideId: answer.article?.guideId,
        suggestions: helpFor(actor.role)
          .slice(0, 6)
          .map((a) => a.question),
      };
      c.messages.push(
        {
          id: crypto.randomUUID(),
          role: "USER",
          text: answer.canonical,
          createdAt: now,
        },
        { id, role: "ASSISTANT", text: answer.text, payload, createdAt: now },
      );
      c.updatedAt = now;
      save(all.slice(0, 30));
      onEvent({ type: "meta", data: { conversationId: c.id, messageId: id } });
      onEvent({
        type: answer.refusal ? "refusal" : "text",
        data: { text: answer.text },
      });
      onEvent({
        type: "done",
        data: { conversationId: c.id, messageId: id, payload },
      });
    },
  };
}
