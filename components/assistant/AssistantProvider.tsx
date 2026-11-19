"use client";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { usePathname } from "next/navigation";
import { featureActor } from "@/lib/data/context";
import { assistantAvailable, getAssistant } from "@/lib/data/assistant";
import { GuideProvider } from "@/components/guides/GuideProvider";
import type { FeatureActor } from "@/types/contracts/tasks";
import type {
  AssistantAdapter,
  AssistantCapabilities,
} from "@/types/contracts/assistant";
import { AssistantPanel } from "./AssistantPanel";
import { AssistantFloatingLauncher } from "./AssistantFloatingLauncher";
import "./assistant.css";
interface ContextValue {
  open: boolean;
  helpOpen: boolean;
  show: () => void;
  showHelp: () => void;
  close: () => void;
  caps: AssistantCapabilities | null;
  error: string;
  refresh: () => Promise<void>;
  adapter: AssistantAdapter;
  actor: FeatureActor;
  identity: string;
}
const Context = createContext<ContextValue | null>(null);
export const useAssistant = () => useContext(Context);
export function AssistantProvider({ children }: { children: React.ReactNode }) {
  const path = usePathname() || "";
  if (
    /^\/(admin|cabinet|portefeuille|pme)(\/|$)/.test(path) ||
    !assistantAvailable
  )
    return <>{children}</>;
  return <Runtime>{children}</Runtime>;
}
function Runtime({ children }: { children: React.ReactNode }) {
  const path = usePathname() || "",
    [actor, setActor] = useState<FeatureActor | null>(null),
    [panelIdentity, setPanelIdentity] = useState(""),
    [surface, setSurface] = useState<"help" | "assistant">("assistant"),
    [state, setState] = useState<{
      identity: string;
      caps: AssistantCapabilities | null;
      error: string;
    }>({ identity: "", caps: null, error: "" });
  useEffect(() => {
    const sync = () => {
      try {
        const current = featureActor();
        setActor((previous) =>
          JSON.stringify(previous) === JSON.stringify(current)
            ? previous
            : current,
        );
      } catch {
        setActor(null);
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
  const identity = actor
    ? [actor.id, actor.companyId, actor.role].join(":")
    : "";
  const currentIdentity = useRef(identity);
  currentIdentity.current = identity;
  const adapter = useMemo(
    () => (actor ? getAssistant(actor) : null),
    [identity],
  );
  const generation = useRef(0);
  const guideWrites = useRef<Promise<void>>(Promise.resolve());
  const trackGuide = useCallback(
    (id: string, state: "STARTED" | "COMPLETED", sessionId: string) => {
      if (!adapter?.trackGuide) return;
      guideWrites.current = guideWrites.current
        .then(() => adapter.trackGuide!(id, state, sessionId))
        .catch(() => {});
    },
    [adapter],
  );
  const refresh = useCallback(async () => {
    const seq = ++generation.current;
    if (!adapter || !actor?.id || !actor.companyId) return;
    try {
      const caps = await adapter.capabilities();
      if (seq === generation.current && identity === currentIdentity.current)
        setState({ identity, caps, error: "" });
    } catch {
      if (seq === generation.current && identity === currentIdentity.current)
        setState({
          identity,
          caps: null,
          error: "Impossible de joindre l’aide connectée. Réessayez.",
        });
    }
  }, [adapter, identity, actor?.id, actor?.companyId]);
  useEffect(() => {
    void refresh();
    const focus = () => void refresh();
    const timer = setInterval(() => {
      if (!document.hidden) void refresh();
    }, 60000);
    window.addEventListener("focus", focus);
    return () => {
      generation.current++;
      clearInterval(timer);
      window.removeEventListener("focus", focus);
    };
  }, [refresh]);
  const caps = state.identity === identity ? state.caps : null,
    error = state.identity === identity ? state.error : "";
  return (
    <Context.Provider
      value={
        adapter && actor?.id && actor.companyId
          ? {
              open: panelIdentity === identity && surface === "assistant",
              helpOpen: panelIdentity === identity && surface === "help",
              show: () => {
                setPanelIdentity(identity);
                setSurface("assistant");
                void refresh();
              },
              showHelp: () => {
                setPanelIdentity(identity);
                setSurface("help");
                void refresh();
              },
              close: () => setPanelIdentity(""),
              caps,
              error,
              refresh,
              adapter,
              actor,
              identity,
            }
          : null
      }
    >
      <GuideProvider
        onEvent={trackGuide}
        policy={{
          enabled: !!caps?.guideEnabled,
          disabledGuides: caps?.disabledGuides || [],
        }}
      >
        {children}
        {adapter && actor?.id && actor.companyId && (
          <>
            <AssistantPanel key={identity + ":help"} kind="help" />
            <AssistantPanel key={identity + ":assistant"} kind="assistant" />
            <AssistantFloatingLauncher />
          </>
        )}
      </GuideProvider>
    </Context.Provider>
  );
}
