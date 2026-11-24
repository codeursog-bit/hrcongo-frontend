"use client";
import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowLeft, ArrowRight, MousePointer2, X } from "lucide-react";
import {
  onGuideDetour,
  remainingGuideSteps,
  routeMatches,
  type Guide,
  type GuideStep,
} from "@/lib/guides/catalog";
import {
  clipGuideRect,
  guideBubblePosition,
  type GuideRect,
} from "@/lib/guides/position";

function usable(element: HTMLElement) {
  const rect = element.getBoundingClientRect(),
    style = getComputedStyle(element);
  return (
    rect.width > 0 &&
    rect.height > 0 &&
    style.display !== "none" &&
    style.visibility !== "hidden" &&
    !element.closest("[hidden],[inert]")
  );
}
export function findGuideTarget(
  selector: string,
  root: ParentNode = document,
): HTMLElement | null {
  return (
    Array.from(root.querySelectorAll<HTMLElement>(selector)).find(usable) ||
    null
  );
}
interface Props {
  guide: Guide;
  step: GuideStep;
  path: string;
  index: number;
  allowed: boolean;
  advance: (anchor?: string) => void;
  previous?: () => void;
  close: () => void;
  navigate: () => void;
  onContinue?: () => void;
}
export function GuideOverlay({
  guide,
  step,
  path,
  index,
  allowed,
  advance,
  previous,
  close,
  navigate,
  onContinue,
}: Props) {
  const [rect, setRect] = useState<GuideRect | null>(null),
    [host, setHost] = useState<HTMLElement | null>(null),
    [fallback, setFallback] = useState(false),
    [waiting, setWaiting] = useState(false),
    [size, setSize] = useState({ width: 0, height: 0 }),
    [bubbleHeight, setBubbleHeight] = useState(280);
  const target = useRef<HTMLElement | null>(null),
    bubble = useRef<HTMLElement | null>(null);
  const onRoute = routeMatches(step, path);
  const detour = allowed && !onRoute && onGuideDetour(step, path);
  const continueRef = useRef(onContinue);
  continueRef.current = onContinue;
  useEffect(() => {
    if (!detour) return;
    const saved = () => continueRef.current?.();
    window.addEventListener("konza:guide:saved", saved);
    return () => window.removeEventListener("konza:guide:saved", saved);
  }, [detour]);
  useLayoutEffect(() => {
    let frame = 0,
      previousTarget: HTMLElement | null = null;
    const dialogs = () =>
      Array.from(document.querySelectorAll<HTMLDialogElement>("dialog[open]"));
    const measure = () => {
      const topDialog = dialogs().at(-1) || null;
      setHost(topDialog || document.body);
      setSize((current) => {
        const next = { width: window.innerWidth, height: window.innerHeight };
        return current.width === next.width && current.height === next.height
          ? current
          : next;
      });
      let element = onRoute && allowed ? findGuideTarget(step.target) : null,
        isFallback = false;
      if (!element && onRoute && allowed && step.prerequisite) {
        element = findGuideTarget(step.prerequisite);
        isFallback = !!element;
      }
      if (step.route === "*" && element) {
        const r = element.getBoundingClientRect();
        if (r.right <= 0 || r.left >= window.innerWidth) {
          element = null;
        }
      }
      if (!element && step.route === "*" && allowed) {
        element = findGuideTarget('[data-guide="navigation-open"]');
        isFallback = !!element;
      }
      target.current = element;
      setFallback(isFallback);
      if (element && previousTarget !== element) {
        element.scrollIntoView({
          block:
            element.getBoundingClientRect().height > window.innerHeight * 0.65
              ? "start"
              : "center",
          inline: "nearest",
          behavior: "auto",
        });
        resize?.observe(element);
        previousTarget = element;
      }
      const r = element?.getBoundingClientRect();
      const next = r
        ? clipGuideRect(r, window.innerWidth, window.innerHeight)
        : null;
      setRect((current) =>
        JSON.stringify(current) === JSON.stringify(next) ? current : next,
      );
    };
    const schedule = () => {
      if (!frame)
        frame = requestAnimationFrame(() => {
          frame = 0;
          measure();
        });
    };
    const observer = new MutationObserver(schedule);
    observer.observe(document.body, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: [
        "class",
        "style",
        "open",
        "hidden",
        "aria-expanded",
        "data-guide",
      ],
    });
    window.addEventListener("resize", schedule);
    window.addEventListener("scroll", schedule, true);
    document.addEventListener("animationend", schedule, true);
    document.addEventListener("transitionend", schedule, true);
    window.visualViewport?.addEventListener("resize", schedule);
    window.visualViewport?.addEventListener("scroll", schedule);
    const resize =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(schedule)
        : null;
    resize?.observe(document.body);
    measure();
    const timeout = setTimeout(() => setWaiting(true), 8000);
    return () => {
      clearTimeout(timeout);
      if (frame) cancelAnimationFrame(frame);
      observer.disconnect();
      resize?.disconnect();
      window.removeEventListener("resize", schedule);
      window.removeEventListener("scroll", schedule, true);
      document.removeEventListener("animationend", schedule, true);
      document.removeEventListener("transitionend", schedule, true);
      window.visualViewport?.removeEventListener("resize", schedule);
      window.visualViewport?.removeEventListener("scroll", schedule);
    };
  }, [step, onRoute, allowed]);
  useLayoutEffect(() => {
    if (!bubble.current) return;
    const node = bubble.current;
    const update = () => setBubbleHeight(node.getBoundingClientRect().height);
    update();
    const observer =
      typeof ResizeObserver !== "undefined" ? new ResizeObserver(update) : null;
    observer?.observe(node);
    return () => observer?.disconnect();
  }, [host, rect, fallback, waiting]);
  useEffect(() => {
    if (host) bubble.current?.focus({ preventScroll: true });
  }, [host]);
  useEffect(() => {
    const click = (event: MouseEvent) => {
      const el = event.target instanceof Element ? event.target : null;
      if (
        !el ||
        !target.current ||
        fallback ||
        !onRoute ||
        !allowed ||
        step.waitFor !== "click" ||
        !target.current.contains(el)
      )
        return;
      if (el.closest('[disabled],[aria-disabled="true"]')) return;
      const anchor = el.closest<HTMLElement>("[data-guide]")?.dataset.guide;
      if (step.choices && !step.choices[anchor || ""]) return;
      queueMicrotask(() => advance(anchor));
    };
    const key = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        close();
      }
    };
    document.addEventListener("click", click, true);
    document.addEventListener("keydown", key, true);
    return () => {
      document.removeEventListener("click", click, true);
      document.removeEventListener("keydown", key, true);
    };
  }, [step, fallback, onRoute, allowed, advance, close]);
  if (!host || !size.width) return null;
  const position = guideBubblePosition(
    rect,
    size.width,
    size.height,
    bubbleHeight,
  );
  const info = !allowed
    ? "Ce parcours n’est pas inclus dans les fonctionnalités disponibles de votre abonnement. Le guide ne contourne pas les droits de l’application."
    : detour
      ? step.detourText || step.text
      : !onRoute
      ? "Vous avez changé de page. Reprenez ce parcours à l’endroit indiqué, ou quittez le guide."
      : fallback
        ? step.route === "*"
          ? "Ouvrez le menu pour retrouver le module."
          : "Ouvrez Nouvelle offre pour retrouver les choix de mode."
        : !rect
          ? waiting
            ? "Cet élément est indisponible. Il peut dépendre de vos droits, de l’abonnement ou d’un chargement interrompu. Vous pouvez réessayer ou consulter l’aide."
            : "Nous attendons que l’interface soit prête…"
          : step.text;
  return createPortal(
    <div className="guide-layer" data-guide-ui="overlay">
      {rect && (
        <>
          <div className="guide-spotlight" style={rect} aria-hidden="true" />
          <MousePointer2
            className="guide-cursor"
            size={28}
            strokeWidth={1.5}
            aria-hidden="true"
            style={{
              left: Math.min(size.width - 36, rect.left + rect.width * 0.7),
              top: Math.min(
                size.height - 36,
                rect.top + Math.min(rect.height * 0.5, 32),
              ),
            }}
          />
        </>
      )}
      <section
        ref={bubble}
        role="dialog"
        aria-modal="false"
        aria-labelledby="guide-title"
        aria-describedby="guide-instruction"
        tabIndex={-1}
        className="guide-bubble"
        style={position}
        onKeyDown={(e) => {
          if (e.key === "Escape") e.stopPropagation();
        }}
      >
        <header>
          <span>
            Étape {index + 1} sur {index + remainingGuideSteps(guide, step.id)}
          </span>
          <button type="button" onClick={close} aria-label="Quitter le guide">
            <X size={18} strokeWidth={1.5} />
          </button>
        </header>
        <h2 id="guide-title">{guide.title}</h2>
        <p id="guide-instruction" aria-live="polite" aria-atomic="true">
          {info}
        </p>
        {rect && !fallback && onRoute && allowed && step.info && (
          <dl>
            {step.info.map((item) => (
              <div key={item.label}>
                <dt>{item.label}</dt>
                <dd>{item.text}</dd>
              </div>
            ))}
          </dl>
        )}
        <footer>
          {previous && (
            <button
              type="button"
              className="k-button k-button-ghost"
              onClick={previous}
            >
              <ArrowLeft size={15} strokeWidth={1.5} />
              Précédent
            </button>
          )}
          {!allowed ? (
            <button
              type="button"
              className="k-button k-button-secondary"
              onClick={close}
            >
              Fermer
            </button>
          ) : detour ? (
            <button
              type="button"
              className="k-button k-button-primary"
              onClick={() => onContinue?.()}
            >
              Continuer
              <ArrowRight size={15} strokeWidth={1.5} />
            </button>
          ) : !onRoute ? (
            <button
              type="button"
              className="k-button k-button-primary"
              onClick={navigate}
            >
              Reprendre ici
              <ArrowRight size={15} strokeWidth={1.5} />
            </button>
          ) : rect && !fallback && step.waitFor === "continue" ? (
            <button
              type="button"
              className="k-button k-button-primary"
              onClick={() => advance()}
            >
              Continuer seul
              <ArrowRight size={15} strokeWidth={1.5} />
            </button>
          ) : rect ? (
            <button
              type="button"
              className="k-button k-button-secondary"
              onClick={() => {
                const element = target.current;
                if (!element) return;
                element.scrollIntoView({ block: "center", behavior: "smooth" });
                const focusable = element.matches(
                  "a,button,input,select,textarea,[tabindex]",
                )
                  ? element
                  : findGuideTarget(
                      "a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]",
                      element,
                    );
                focusable?.focus({ preventScroll: true });
                // Étape « cliquer » à cible unique : on exécute l'action à la place
                // de la personne (navigation, ouverture du menu…). Le clic remonte
                // jusqu'à l'écouteur du guide, qui passe alors à l'étape suivante.
                // Champs de saisie et choix multiples : on se contente du focus.
                const actionable = focusable ?? element;
                if (
                  step.waitFor === "click" &&
                  !step.choices &&
                  !actionable.matches("input,select,textarea") &&
                  !actionable.closest('[disabled],[aria-disabled="true"]')
                )
                  actionable.click();
              }}
            >
              Aller à l’élément
            </button>
          ) : (
            <a
              className="k-button k-button-secondary"
              href="/docs"
              target="_blank"
              rel="noopener noreferrer"
            >
              Consulter l’aide
            </a>
          )}
          <button
            type="button"
            className="k-button k-button-ghost"
            onClick={close}
          >
            Quitter
          </button>
        </footer>
        {step.next && onRoute && allowed && (
          <button
            type="button"
            className="guide-skip"
            onClick={() => advance()}
          >
            Passer cette étape
          </button>
        )}
        <small>Vous cliquez, le guide vous accompagne.</small>
      </section>
    </div>,
    host,
  );
}