import type { AssistantEvent } from "@/types/contracts/assistant";
/** SSE framing independent of network chunk boundaries, including split UTF-8 characters. */
export async function consumeAssistantStream(
  body: ReadableStream<Uint8Array>,
  onEvent: (event: AssistantEvent) => void,
  signal: AbortSignal,
) {
  const reader = body.getReader(),
    decoder = new TextDecoder();
  let buffer = "",
    doneSeen = false;
  const frame = (raw: string) => {
    let event = "";
    const data: string[] = [];
    for (const line of raw.split("\n")) {
      if (line.startsWith("event:")) event = line.slice(6).trim();
      if (line.startsWith("data:")) data.push(line.slice(5).trimStart());
    }
    if (!["meta", "text", "refusal", "guide", "done", "card"].includes(event))
      return;
    const value = JSON.parse(data.join("\n"));
    if (event === "done") doneSeen = true;
    onEvent({ type: event as AssistantEvent["type"], data: value });
  };
  const abort = () => {
    void reader.cancel();
  };
  signal.addEventListener("abort", abort, { once: true });
  try {
    if (signal.aborted) throw new DOMException("Annulé", "AbortError");
    while (true) {
      const result = await reader.read();
      if (signal.aborted) throw new DOMException("Annulé", "AbortError");
      buffer = (
        buffer +
        (result.done
          ? decoder.decode()
          : decoder.decode(result.value, { stream: true }))
      ).replace(/\r\n/g, "\n");
      if (buffer.length > 100000) throw new Error("Réponse trop longue.");
      let index;
      while ((index = buffer.indexOf("\n\n")) >= 0) {
        frame(buffer.slice(0, index));
        buffer = buffer.slice(index + 2);
      }
      if (result.done) break;
    }
    if (buffer.trim()) frame(buffer);
    if (!doneSeen)
      throw new Error(
        "La réponse a été interrompue. Retrouvez-la dans l’historique avant de réessayer.",
      );
  } finally {
    signal.removeEventListener("abort", abort);
    reader.releaseLock();
  }
}
