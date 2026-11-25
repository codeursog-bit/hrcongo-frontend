type Breadcrumb = {
  type: "NAV" | "API";
  path: string;
  method?: string;
  status?: number;
};
type Code =
  "JS_ERROR" | "REJECTION" | "REACT_ERROR" | "API_ERROR" | "CHUNK_LOAD";
const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
const queue: Record<string, unknown>[] = [],
  seen = new Map<string, number>(),
  breadcrumbs: Breadcrumb[] = [];
let sending = false,
  timer: ReturnType<typeof setTimeout> | undefined;
const enabled = () =>
  typeof window !== "undefined" &&
  process.env.NEXT_PUBLIC_INCIDENTS_ENABLED === "true" &&
  process.env.NEXT_PUBLIC_DEMO_MODE !== "true";
export function incidentPath(value: string) {
  try {
    return new URL(value, location.origin).pathname
      .split("/")
      .map((segment,index,segments) =>
        /token|reset|verify|tracking|suivi|invitation/i.test(segments[index-1]??'') ||
        /^[a-zA-Z0-9_-]{24,}$/.test(segment) ||
        /^(?:[0-9a-f-]{32,}|\d+|demo-.+)$/.test(segment) ||
        segment.includes("@") ||
        segment.length > 60
          ? ":id"
          : segment,
      )
      .join("/")
      .slice(0, 300);
  } catch {
    return "/";
  }
}
function clean(value: string, max: number) {
  return value
    .slice(0, 16000)
    .replace(/(["']?(?:password|token|secret|authorization|cookie|api[_-]?key|salary|salaire|iban|cnss|nationalid)["']?\s*[:=]\s*)(?:"[^"\n]*"|'[^'\n]*'|[^\s,;}]+)/gi, '[masqué]')
    .replace(/Bearer\s+[\w.-]+|\beyJ[\w.-]+/gi, "[jeton]")
    .replace(
      /(?:password|token|secret|authorization|cookie|salary|salaire|iban|cnss)\s*[:=]\s*[^\s,;}]+/gi,
      "[masqué]",
    )
    .replace(/https?:\/\/[^\s)]+/gi, (url) => {
      try {
        return new URL(url).origin + incidentPath(url);
      } catch {
        return "[url]";
      }
    })
    .replace(/[\w.+-]+@[\w.-]+\.[a-z]{2,}/gi, "[courriel]")
    .replace(/(["'`])[^"'`\n]{0,2000}\1/g, "[valeur]")
    .replace(/\d[\d\s.,+-]*/g, "#")
    .slice(0, max);
}
function cleanStack(stack: string) {
  return stack
    .slice(0, 10000)
    .split("\n")
    .slice(0, 20)
    .map((line) => {
      const match = line.match(
        /^\s*at\s+(?:([\w.$ <>]+)\s+\()?([^()\s]+):(\d+):(\d+)\)?$/,
      );
      if (!match) return clean(line, 150);
      const file = match[2]
        .split("?")[0]
        .replace(/([A-Z]:[\\/]Users[\\/])[^\\/]+/gi, "$1[utilisateur]");
      if(/https?:\/\/[^/]*@/i.test(file)) return '    at [adresse masquée]';
      return /\.(?:[cm]?js|jsx|tsx?)$/.test(file)
        ? `    at ${match[1] ? clean(match[1], 100) + " " : ""}(${file.slice(0, 300)}:${match[3]}:${match[4]})`
        : clean(line, 150);
    })
    .join("\n")
    .slice(0, 4500);
}
export function incidentBreadcrumb(crumb: Breadcrumb) {
  if (!enabled()) return;
  breadcrumbs.push({ ...crumb, path: incidentPath(crumb.path) });
  if (breadcrumbs.length > 10) breadcrumbs.shift();
}
export function reportClientIncident(
  error: unknown,
  code: Code = "JS_ERROR",
  path?: string,
) {
  if (!enabled()) return;
  const source =
    error instanceof Error
      ? error
      : new Error(typeof error === "string" ? error : "Erreur non gérée");
  if (
    /AbortError|ResizeObserver loop|chrome-extension:|moz-extension:|request (?:was )?cancel/i.test(
      `${source.name} ${source.message} ${source.stack}`,
    )
  )
    return;
  if (
    /chunkloaderror|loading chunk|dynamically imported module/i.test(
      source.message,
    )
  ) {
    code = "CHUNK_LOAD";
    try {
      if (sessionStorage.getItem("konza-incident-chunk")) return;
      sessionStorage.setItem("konza-incident-chunk", "1");
    } catch {}
  }
  const message = clean(source.message, 1500),
    route = incidentPath(path || location.pathname),
    key = `${code}|${message}|${route}`,
    now = Date.now();
  if (now - (seen.get(key) ?? 0) < 60000) return;
  seen.set(key, now);
  if (seen.size > 500)
    for (const [id, time] of seen) if (now - time >= 60000) seen.delete(id);
  if (seen.size > 500) seen.delete(seen.keys().next().value!);
  if (queue.length >= 20) queue.shift();
  queue.push({
    code,
    message,
    stack: cleanStack(source.stack || ""),
    path: route,
    version: (
      process.env.NEXT_PUBLIC_APP_VERSION ||
      (window as any).__NEXT_DATA__?.buildId ||
      "unknown"
    ).slice(0, 100),
    browser: clean(navigator.userAgent, 250),
    screen: `${innerWidth}x${innerHeight}`,
    online: navigator.onLine,
    breadcrumbs: [...breadcrumbs],
  });
  if (!timer)
    timer = setTimeout(() => {
      timer = undefined;
      void flushClientIncidents();
    }, 250);
}
export async function flushClientIncidents(beacon = false) {
  if (!enabled() || sending || !navigator.onLine) return;
  sending = true;
  try {
    while (queue.length) {
      const payload = JSON.stringify(queue.shift());
      if (new TextEncoder().encode(payload).length > 16000) continue;
      if (
        beacon &&
        navigator.sendBeacon?.(
          `${apiUrl}/client-errors`,
          new Blob([payload], { type: "application/json" }),
        )
      )
        continue;
      try {
        await fetch(`${apiUrl}/client-errors`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: payload,
          credentials: "include",
          keepalive: true,
        });
      } catch {
        /* No retry loop or telemetry about telemetry. */
      }
    }
  } finally {
    sending = false;
  }
}
