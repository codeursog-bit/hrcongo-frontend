import type { AssistantEvent } from "@/types/contracts/assistant";

/** Presentation queue: preserve every character and the order of SSE events. */
export function createTypingQueue(
  emit: (event: AssistantEvent) => void,
  signal: AbortSignal,
  reducedMotion = false,
) {
  let pending = Promise.resolve();
  let stopped = false;
  let failure: unknown;
  return {
    push(event: AssistantEvent) {
      pending = pending
        .then(async () => {
          if (stopped || signal.aborted) return;
          if (reducedMotion || event.type !== "text" || !event.data.text) {
            emit(event);
            return;
          }
          const letters = Array.from(event.data.text);
          for (let i = 0; i < letters.length; i += 8) {
            if (stopped || signal.aborted) return;
            emit({
              ...event,
              data: { ...event.data, text: letters.slice(i, i + 8).join("") },
            });
            if (i + 8 < letters.length)
              await new Promise<void>((resolve) => setTimeout(resolve, 24));
          }
        })
        .catch((error) => {
          failure = error;
          stopped = true;
        });
    },
    async drain() {
      await pending;
      if (failure) throw failure;
      if (signal.aborted)
        throw new DOMException("Réponse interrompue", "AbortError");
    },
    cancel() {
      stopped = true;
    },
  };
}
