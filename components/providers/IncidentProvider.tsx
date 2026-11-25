"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import {
  flushClientIncidents,
  incidentBreadcrumb,
  reportClientIncident,
} from "@/lib/client-incidents";

export function IncidentProvider() {
  const pathname = usePathname();
  useEffect(() => {
    if (pathname) incidentBreadcrumb({ type: "NAV", path: pathname });
  }, [pathname]);
  useEffect(() => {
    if (
      process.env.NEXT_PUBLIC_INCIDENTS_ENABLED !== "true" ||
      process.env.NEXT_PUBLIC_DEMO_MODE === "true"
    )
      return;
    const error = (event: ErrorEvent) =>
      reportClientIncident(event.error || event.message, "JS_ERROR");
    const rejection = (event: PromiseRejectionEvent) =>
      reportClientIncident(event.reason, "REJECTION");
    const unload = () => void flushClientIncidents(true),
      online = () => void flushClientIncidents();
    window.addEventListener("error", error);
    window.addEventListener("unhandledrejection", rejection);
    window.addEventListener("pagehide", unload);
    window.addEventListener("online", online);
    const original = window.fetch;
    const wrapped: typeof fetch = async (input, init) => {
      const url =
        typeof input === "string"
          ? input
          : input instanceof URL
            ? input.toString()
            : input.url;
      let isApi = false;
      try {
        const base = new URL(
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001",
        );
        const parsed = new URL(url, location.origin);
        isApi =
          parsed.origin === base.origin &&
          parsed.pathname.startsWith(
            base.pathname === "/" ? "/" : base.pathname + "/",
          );
      } catch {}
      if (!isApi || url.includes("/client-errors"))
        return original.call(window, input, init);
      const method = (
        init?.method || (input instanceof Request ? input.method : "GET")
      ).toUpperCase();
      try {
        const response = await original.call(window, input, init);
        incidentBreadcrumb({
          type: "API",
          path: url,
          method,
          status: response.status,
        });
        if (response.status >= 500)
          reportClientIncident(
            new Error(`Appel API échoué (${response.status})`),
            "API_ERROR",
            url,
          );
        return response;
      } catch (e) {
        incidentBreadcrumb({ type: "API", path: url, method, status: 0 });
        if ((e as Error)?.name !== "AbortError")
          reportClientIncident(
            new Error(
              (e as Error)?.name === "TimeoutError"
                ? "Délai API dépassé"
                : "Connexion API impossible",
            ),
            "API_ERROR",
            url,
          );
        throw e;
      }
    };
    window.fetch = wrapped;
    return () => {
      window.removeEventListener("error", error);
      window.removeEventListener("unhandledrejection", rejection);
      window.removeEventListener("pagehide", unload);
      window.removeEventListener("online", online);
      if (window.fetch === wrapped) window.fetch = original;
    };
  }, []);
  return null;
}
