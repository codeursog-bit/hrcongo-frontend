"use client";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import { authService } from "@/lib/services/authService";
import { useSubscription } from "@/hooks/useSubscription";
import {
  guideAllowed,
  guideById,
  guideEntry,
  guidePath,
  nextGuideStep,
  type GuideStep,
} from "@/lib/guides/catalog";
import { GuideOverlay } from "./GuideOverlay";
import "./guides.css";
interface Run {
  sessionId: string;
  guideId: string;
  history: string[];
  index: number;
  identity: string;
}
interface GuideContextValue {
  enabled: boolean;
  disabledGuides: string[];
  start: (id: string) => void;
  active: boolean;
  role: string;
  hasFeature: ReturnType<typeof useSubscription>["hasFeature"];
  loading: boolean;
  error: boolean;
}
const Context = createContext<GuideContextValue | null>(null);
const DEFAULT_POLICY = { enabled: true, disabledGuides: [] as string[] };
type GuideTelemetry = (
  id: string,
  state: "STARTED" | "COMPLETED",
  sessionId: string,
) => void;
export function GuideProvider({
  children,
  policy = DEFAULT_POLICY,
  onEvent,
}: {
  children: React.ReactNode;
  policy?: { enabled: boolean; disabledGuides: string[] };
  onEvent?: GuideTelemetry;
}) {
  const path = usePathname() || "";
  // Phase A covers the enterprise routes. PME uses different payroll/import routes.
  if (/^\/(admin|cabinet|portefeuille|pme)(\/|$)/.test(path))
    return <>{children}</>;
  return (
    <GuideRuntime policy={policy} onEvent={onEvent}>
      {children}
    </GuideRuntime>
  );
}
function GuideRuntime({
  children,
  policy = DEFAULT_POLICY,
  onEvent,
}: {
  children: React.ReactNode;
  policy?: { enabled: boolean; disabledGuides: string[] };
  onEvent?: GuideTelemetry;
}) {
  const path = usePathname() || "",
    router = useRouter();
  const { hasFeature, isLoading, error } = useSubscription();
  const [run, setRun] = useState<Run | null>(null),
    [notice, setNotice] = useState("");
  const returnFocus = useRef<HTMLElement | null>(null);
  const [user, setUser] =
    useState<ReturnType<typeof authService.getCurrentUser>>(null);
  const role = user?.role || "";
  useEffect(() => {
    const sync = () => {
      try {
        setUser(authService.getCurrentUser());
      } catch {
        setUser(null);
      }
    };
    sync();
    window.addEventListener("storage", sync);
    window.addEventListener("focus", sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("focus", sync);
    };
  }, [path]);
  const identity = [
    user?.id,
    user?.companyId,
    path.match(/^\/pme\/([^/]+)/)?.[1] || "",
  ].join(":");
  const guide = run ? guideById(run.guideId) : undefined,
    step = guide?.steps.find((s) => s.id === run?.history[run.index]);
  const close = useCallback(() => {
    setRun(null);
    setNotice("");
    requestAnimationFrame(() => {
      if (returnFocus.current?.isConnected) returnFocus.current.focus();
    });
  }, []);
  useEffect(() => {
    if (
      run &&
      (!policy.enabled ||
        policy.disabledGuides.includes(run.guideId) ||
        run.identity !== identity ||
        !guide ||
        !guideAllowed(guide, role) ||
        /^\/(admin|cabinet|portefeuille)(\/|$)/.test(path))
    )
      close();
  }, [
    run,
    identity,
    guide,
    role,
    path,
    close,
    policy.enabled,
    policy.disabledGuides.join("|"),
  ]);
  const start = (id: string) => {
    const selected = guideById(id);
    if (
      !policy.enabled ||
      policy.disabledGuides.includes(id) ||
      !selected ||
      !guideAllowed(selected, role) ||
      isLoading ||
      error
    )
      return;
    if (selected.features && !selected.features.some((f) => hasFeature(f)))
      return;
    returnFocus.current =
      Array.from(
        document.querySelectorAll<HTMLElement>('[data-guide="guide-launcher"]'),
      ).find(
        (el) => el.offsetParent !== null && !el.closest('[role="menu"]'),
      ) ||
      document.querySelector<HTMLElement>('[data-guide="profile-trigger"]') ||
      (document.activeElement as HTMLElement);
    setNotice("");
    const sessionId = crypto.randomUUID();
    onEvent?.(id, "STARTED", sessionId);
    setRun({
      sessionId,
      guideId: id,
      history: [guideEntry(selected, path)],
      index: 0,
      identity,
    });
  };
  const advance = useCallback(
    (anchor?: string) => {
      if (!step || !run) return;
      const next = nextGuideStep(step, anchor);
      if (!next) {
        if (step.choices) return;
        onEvent?.(run.guideId, "COMPLETED", run.sessionId);
        setRun(null);
        setNotice(
          "Vous avez les repères pour poursuivre. Aucune donnée n’a été enregistrée par le guide.",
        );
        return;
      }
      setRun((current) =>
        current && current.history[current.index] === step.id
          ? {
              ...current,
              history: [...current.history.slice(0, current.index + 1), next],
              index: current.index + 1,
            }
          : current,
      );
    },
    [step, run, onEvent],
  );
  const navigate = (s: GuideStep) => {
    if (s.route === "*") return;
    const base = path.match(/^\/pme\/[^/]+/)?.[0] || "";
    router.push(base + s.route);
  };
  const previous = () => {
    if (!run || !guide || !run.index) return;
    const previous = guide.steps.find(
      (s) => s.id === run.history[run.index - 1],
    );
    setRun({ ...run, index: run.index - 1 });
    if (
      previous &&
      previous.route !== "*" &&
      guidePath(path) !== previous.route
    )
      navigate(previous);
  };
  return (
    <Context.Provider
      value={{
        enabled: policy.enabled,
        disabledGuides: policy.disabledGuides,
        start,
        active: !!run,
        role,
        hasFeature,
        loading: isLoading,
        error: !!error,
      }}
    >
      {children}
      {policy.enabled &&
        guide &&
        step &&
        run &&
        run.identity === identity &&
        guideAllowed(guide, role) && (
          <GuideOverlay
            key={guide.id + step.id}
            guide={guide}
            step={step}
            path={path}
            index={run.index}
            advance={advance}
            previous={run.index ? previous : undefined}
            close={close}
            navigate={() => navigate(step)}
            onContinue={() => {
              const next = guide.steps.find((s) => s.id === step.next);
              advance();
              if (next) navigate(next);
            }}
            allowed={!step.feature || hasFeature(step.feature)}
          />
        )}
      {notice && (
        <div className="guide-finished" role="status">
          <p>{notice}</p>
          <button className="k-button k-button-secondary" onClick={close}>
            Fermer
          </button>
        </div>
      )}
    </Context.Provider>
  );
}
export const useGuide = () => useContext(Context);