"use client";
import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Compass,
  History,
  Plus,
  Search,
  Send,
  Square,
  ThumbsDown,
  ThumbsUp,
  Trash2,
} from "lucide-react";
import { createTypingQueue } from "@/lib/assistant/typing";
import { AssistantWindow } from "./AssistantWindow";
import { AnalysisComposer } from "./AnalysisComposer";
import { useAssistant } from "./AssistantProvider";
import { useGuide } from "@/components/guides/GuideProvider";
import { searchGuides } from "@/lib/guides/catalog";
import { normalizeHelp } from "@/lib/assistant/help";
import { DEMO_MODE } from "@/lib/demo/config";
import type {
  AssistantMessage,
  AssistantSummary,
  HelpArticle,
  ChatInput,
} from "@/types/contracts/assistant";
const analysisSources: Record<string, string> = {
  "reports.getWorkforceMovement": "Rapport des effectifs",
  "payroll.aggregate": "Bulletins de paie",
  "payroll.validated": "Bulletins de paie validés",
  "permissionTicket.approved": "Permissions approuvées",
  "leave.approved+workingDays.nextWorkingDay":
    "Congés et calendrier de travail",
  "leavesBalance.getTotalLeaveBalanceSummary": "Dossier de congé",
  "leavesIndemnity.calculateLeaveIndemnity": "Moteur d’allocation de congé",
};
export function AssistantPanel({
  kind = "help",
}: { kind?: "help" | "assistant" } = {}) {
  const ctx = useAssistant(),
    guide = useGuide();
  const [tab, setTab] = useState<"help" | "chat" | "history">(
      kind === "help" ? "help" : "chat",
    ),
    [articles, setArticles] = useState<HelpArticle[]>([]),
    [suggestions, setSuggestions] = useState<string[]>([]),
    [history, setHistory] = useState<AssistantSummary[]>([]),
    [messages, setMessages] = useState<AssistantMessage[]>([]),
    [conversationId, setConversationId] = useState<string | undefined>(),
    [query, setQuery] = useState(""),
    [draft, setDraft] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [loading, setLoading] = useState(false),
    [deleteId, setDeleteId] = useState<string | null>(null);
  const controller = useRef<AbortController | null>(null),
    generation = useRef(0),
    end = useRef<HTMLDivElement>(null),
    reading = useRef({
      count: 0,
      conversationId: undefined as string | undefined,
    }),
    sending = useRef(false),
    active = useRef(true);
  useEffect(() => {
    active.current = true;
    return () => {
      active.current = false;
      generation.current++;
      controller.current?.abort();
    };
  }, []);
  const adapter = ctx?.adapter;
  const panelOpen = kind === "help" ? ctx?.helpOpen : ctx?.open;
  useEffect(() => {
    if (!panelOpen || !adapter) return;
    const seq = ++generation.current;
    setLoading(true);
    setError("");
    Promise.all([
      kind === "help" ? adapter.help() : Promise.resolve([]),
      kind === "assistant" ? adapter.suggestions() : Promise.resolve([]),
      kind === "assistant" ? adapter.list() : Promise.resolve([]),
    ])
      .then(([help, suggest, list]) => {
        if (seq === generation.current) {
          setArticles(help);
          setSuggestions(suggest);
          setHistory(list);
        }
      })
      .catch(() => {
        if (seq === generation.current)
          setError(
            "Le contenu n’a pas pu être chargé. Réouvrez le panneau pour réessayer.",
          );
      })
      .finally(() => {
        if (seq === generation.current) setLoading(false);
      });
    return () => {
      generation.current++;
    };
  }, [panelOpen, adapter, kind]);
  useEffect(() => {
    if (!panelOpen) controller.current?.abort();
  }, [panelOpen]);
  useEffect(() => {
    const viewport = end.current?.parentElement;
    if (!panelOpen || !viewport) return;
    if (!messages.length) viewport.scrollTop = 0;
    else if (
      reading.current.count !== messages.length ||
      reading.current.conversationId !== conversationId
    ) {
      const reply = viewport.querySelector<HTMLElement>(
        ":scope > article:last-of-type",
      );
      if (reply)
        viewport.scrollTop +=
          reply.getBoundingClientRect().top -
          viewport.getBoundingClientRect().top -
          12;
    }
    reading.current = { count: messages.length, conversationId };
    // Reveal the start of a new response; streaming must not pull the reader down.
  }, [messages, panelOpen, conversationId]);
  if (!ctx) return null;
  const close = () => {
    controller.current?.abort();
    ctx.close();
  };
  const refreshHistory = async () => {
    const list = await ctx.adapter.list();
    if (active.current) setHistory(list);
  };
  const send = async (
    question = draft,
    analysis?: ChatInput["analysis"],
    choice?: ChatInput["choice"],
  ) => {
    const text = question.trim();
    if (
      !text ||
      loading ||
      sending.current ||
      !ctx.caps ||
      ctx.caps.assistantMode === "OFF"
    )
      return;
    sending.current = true;
    setBusy(true);
    setError("");
    setDraft("");
    setTab("chat");
    const requestId = crypto.randomUUID(),
      pending = "pending:" + requestId;
    const now = new Date().toISOString();
    setMessages((previous) => [
      ...previous,
      { id: "question:" + requestId, role: "USER", text, createdAt: now },
      { id: pending, role: "ASSISTANT", text: "", createdAt: now },
    ]);
    const abort = new AbortController();
    controller.current = abort;
    let typing: ReturnType<typeof createTypingQueue> | undefined;
    try {
      let finalId = pending;
      typing = createTypingQueue(
        (event) => {
          if (abort.signal.aborted || !active.current) return;
          if (event.data.conversationId)
            setConversationId(event.data.conversationId);
          if (event.type === "meta" && event.data.messageId)
            finalId = event.data.messageId;
          if (event.type === "text" || event.type === "refusal")
            setMessages((previous) =>
              previous.map((m) =>
                m.id === pending
                  ? { ...m, text: m.text + (event.data.text || "") }
                  : m,
              ),
            );
          if (event.type === "done")
            setMessages((previous) =>
              previous.map((m) =>
                m.id === pending
                  ? {
                      ...m,
                      id: event.data.messageId || finalId,
                      payload: event.data.payload,
                    }
                  : m,
              ),
            );
        },
        abort.signal,
        typeof window !== "undefined" &&
          !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches,
      );
      await ctx.adapter.chat(
        {
          conversationId,
          requestId,
          message: text,
          ...(analysis ? { analysis } : {}),
          ...(choice ? { choice } : {}),
        },
        typing.push,
        abort.signal,
      );
      await typing.drain();
      await refreshHistory();
    } catch (e) {
      if (active.current) {
        setError(
          e instanceof Error && e.name === "AbortError"
            ? "Réponse interrompue. Consultez l’historique : elle peut avoir été enregistrée."
            : e instanceof Error
              ? e.message
              : "Chat indisponible.",
        );
        void ctx.refresh();
      }
    } finally {
      typing?.cancel();
      sending.current = false;
      if (active.current) setBusy(false);
    }
  };
  const loadConversation = async (id: string) => {
    if (busy || loading) return;
    const seq = ++generation.current;
    setLoading(true);
    setError("");
    try {
      const c = await ctx.adapter.get(id);
      if (seq === generation.current) {
        setConversationId(c.id);
        setMessages(c.messages);
        setTab("chat");
      }
    } catch (e) {
      if (seq === generation.current)
        setError(e instanceof Error ? e.message : "Conversation indisponible.");
    } finally {
      if (seq === generation.current) setLoading(false);
    }
  };
  const remove = async (id: string) => {
    setLoading(true);
    try {
      await ctx.adapter.remove(id);
      if (!active.current) return;
      if (conversationId === id) {
        setConversationId(undefined);
        setMessages([]);
      }
      setDeleteId(null);
      await refreshHistory();
    } catch {
      setError("La conversation n’a pas pu être supprimée.");
    } finally {
      if (active.current) setLoading(false);
    }
  };
  const rate = async (id: string, rating: 1 | -1) => {
    try {
      await ctx.adapter.feedback(id, rating);
      if (active.current)
        setMessages((previous) =>
          previous.map((m) => (m.id === id ? { ...m, rating } : m)),
        );
    } catch {
      setError("Votre avis n’a pas pu être enregistré.");
    }
  };
  const startGuide = (id: string) => {
    if (!guide?.enabled || guide.loading || guide.error || guide.active) {
      setError(
        "Le guide attend que les informations de votre compte soient prêtes.",
      );
      return;
    }
    close();
    guide.start(id);
  };
  const help = articles.filter((a) =>
    normalizeHelp(a.title + " " + a.question + " " + a.text).includes(
      normalizeHelp(query),
    ),
  );
  return (
    <AssistantWindow
      open={!!panelOpen}
      onClose={close}
      title={kind === "help" ? "Besoin d’aide ?" : "Agent Konza"}
      subtitle={
        DEMO_MODE
          ? "Démonstration · aide à l’application"
          : ctx.caps?.assistantMode === "IA_AVANCEE"
            ? "Conversation · IA avancée"
            : "Conversation · mode intégré"
      }
    >
      <div className={`assistant-workspace assistant-workspace-${kind}`}>
        <div
          className={
            kind === "assistant"
              ? "assistant-conversations"
              : "assistant-help-layout"
          }
        >
          {kind === "assistant" && (
            <aside
              className="assistant-history"
              aria-label="Historique des conversations"
            >
              <h3>Conversations</h3>
              <button
                className="k-button k-button-secondary assistant-new-conversation"
                type="button"
                aria-label="Nouvelle conversation"
                disabled={busy || loading}
                onClick={() => {
                  setConversationId(undefined);
                  setMessages([]);
                  setError("");
                }}
              >
                <Plus size={18} strokeWidth={1.5} />
                Nouvelle conversation
              </button>
              <p>
                Conservation maximale : {ctx.caps?.retentionDays ?? "—"} jours.
                Les textes libres sont remplacés par des formulations d’aide.
              </p>
              {!loading && !history.length && (
                <p>Vos conversations apparaîtront ici.</p>
              )}
              {history.map((item) => (
                <article key={item.id}>
                  <button
                    type="button"
                    aria-current={
                      conversationId === item.id ? "true" : undefined
                    }
                    disabled={busy || loading}
                    onClick={() => void loadConversation(item.id)}
                  >
                    <History size={16} strokeWidth={1.5} />
                    <span>
                      {item.title}
                      <small>
                        {new Date(item.updatedAt).toLocaleDateString("fr-FR")}
                      </small>
                    </span>
                  </button>
                  <button
                    className="k-button k-button-ghost"
                    aria-label={`Supprimer ${item.title}`}
                    disabled={busy || loading}
                    onClick={() => setDeleteId(item.id)}
                  >
                    <Trash2 size={16} strokeWidth={1.5} />
                  </button>
                  {deleteId === item.id && (
                    <div className="assistant-delete">
                      <p>Supprimer définitivement cette conversation ?</p>
                      <button
                        className="k-button k-button-secondary"
                        onClick={() => setDeleteId(null)}
                      >
                        Annuler
                      </button>
                      <button
                        className="k-button k-tone-danger"
                        disabled={loading || busy}
                        onClick={() => void remove(item.id)}
                      >
                        Supprimer
                      </button>
                    </div>
                  )}
                </article>
              ))}
              {kind === "assistant" && (
                <details className="assistant-privacy-note">
                  <summary>Confidentialité des échanges</summary>
                  <p className="assistant-privacy">
                    {ctx.caps?.assistantMode === "IA_AVANCEE"
                      ? "Le connecteur externe ne reçoit que des identifiants de phrases vérifiées, sans votre question ni vos données RH. "
                      : "Aucun appel à un fournisseur IA externe dans ce mode. "}
                    L’historique garde des questions normalisées, pas votre
                    texte libre. Les résultats chiffrés sont protégés côté
                    serveur.
                  </p>
                </details>
              )}
              {kind === "assistant" &&
                ctx.actor.role === "ADMIN" &&
                ctx.adapter.companyPreference && (
                  <details className="assistant-company-settings">
                    <summary>Préférence de mon entreprise</summary>
                    <label>
                      <input
                        type="checkbox"
                        checked={ctx.caps?.companyAnalysesEnabled !== false}
                        disabled={!ctx.caps || busy}
                        onChange={async (e) => {
                          const enabled = e.target.checked;
                          try {
                            await ctx.adapter.companyPreference!(enabled);
                            await ctx.refresh();
                          } catch {
                            setError(
                              "La préférence n’a pas pu être enregistrée.",
                            );
                          }
                        }}
                      />
                      Autoriser les analyses pour les administrateurs et RH
                    </label>
                    <p>
                      Cette autorisation reste limitée par le mode de la
                      plateforme et le forfait.
                    </p>
                  </details>
                )}
              {ctx.caps?.analysesEnabled &&
                ["ADMIN", "HR_MANAGER"].includes(ctx.actor.role) && (
                  <AnalysisComposer
                    adapter={ctx.adapter}
                    disabled={busy || loading}
                    onRun={(message, analysis) => void send(message, analysis)}
                  />
                )}
              {ctx.caps?.analysesEnabled &&
                typeof ctx.caps.remainingAnalyses === "number" && (
                  <div className="assistant-quota">
                    <span>
                      {ctx.caps.remainingAnalyses} analyses restantes sur{" "}
                      {ctx.caps.monthlyAnalyses}
                    </span>
                    <progress
                      max={100}
                      value={ctx.caps.usagePercent || 0}
                      aria-label="Quota d’analyses consommé"
                    />
                    {ctx.caps.quotaPeriodEnd && (
                      <small>
                        Renouvellement :{" "}
                        {new Date(ctx.caps.quotaPeriodEnd).toLocaleDateString(
                          "fr-FR",
                        )}
                      </small>
                    )}
                    {(ctx.caps.usagePercent || 0) >= 80 && (
                      <p>
                        {ctx.caps.remainingAnalyses === 0
                          ? "Quota atteint. L’aide et les guides restent gratuits."
                          : "Vous approchez du quota de votre forfait."}{" "}
                        <Link
                          href="/pricing"
                          onClick={() => {
                            void ctx.adapter.trackUpgrade?.().catch(() => {});
                            close();
                          }}
                        >
                          Voir les forfaits
                        </Link>
                      </p>
                    )}
                  </div>
                )}
            </aside>
          )}
          <div className="assistant-thread">
            {(error || ctx.error) && (
              <div className="assistant-error" role="alert">
                {error || ctx.error}
              </div>
            )}
            {!ctx.caps && !ctx.error && (
              <p role="status">Connexion à l’aide…</p>
            )}
            {ctx.error && (
              <button
                className="k-button k-button-secondary"
                onClick={() => void ctx.refresh()}
              >
                Réessayer la connexion
              </button>
            )}
            {loading && <p role="status">Chargement…</p>}
            {kind === "help" && (
              <section className="assistant-help">
                <h3>Vous ne savez pas où aller ?</h3>
                <p className="assistant-privacy">
                  Retrouvez une page, une réponse ou un parcours guidé.
                </p>
                <label className="assistant-search">
                  <Search size={17} strokeWidth={1.5} />
                  <input
                    aria-label="Rechercher dans l’aide"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Une page, une action…"
                  />
                </label>
                {guide?.enabled &&
                  searchGuides("", ctx.actor.role).filter(
                    (g) => !ctx.caps?.disabledGuides.includes(g.id),
                  ).length > 0 && (
                    <section className="assistant-guides">
                      <h4>Être guidé sur mon écran</h4>
                      {searchGuides("", ctx.actor.role)
                        .filter((g) => !ctx.caps?.disabledGuides.includes(g.id))
                        .map((g) => {
                          const enabled =
                            !g.features ||
                            g.features.some((f) => guide.hasFeature(f));
                          return (
                            <button
                              type="button"
                              key={g.id}
                              disabled={!enabled || guide.active}
                              onClick={() => startGuide(g.id)}
                            >
                              <Compass size={17} strokeWidth={1.5} />
                              <span>
                                {g.title}
                                <small>
                                  {enabled
                                    ? "Pas à pas, vous gardez la main"
                                    : "Fonctionnalité non incluse dans votre abonnement"}
                                </small>
                              </span>
                              <ArrowRight size={16} strokeWidth={1.5} />
                            </button>
                          );
                        })}
                    </section>
                  )}
                <h4>Les réponses utiles</h4>
                {help.map((article) => (
                  <details key={article.id}>
                    <summary>{article.title}</summary>
                    <p>{article.text}</p>
                    <div className="assistant-message-actions">
                      <Link href={article.path} onClick={close}>
                        Ouvrir la page
                        <ArrowRight size={14} strokeWidth={1.5} />
                      </Link>
                      {article.guideId &&
                        guide?.enabled &&
                        ctx.caps?.guideEnabled &&
                        !ctx.caps.disabledGuides.includes(article.guideId) && (
                          <button onClick={() => startGuide(article.guideId!)}>
                            Me guider
                          </button>
                        )}
                    </div>
                  </details>
                ))}
                {!loading && !help.length && (
                  <p>
                    Aucun sujet ne correspond. Essayez un autre mot ou contactez
                    le support.
                  </p>
                )}
              </section>
            )}
            {kind === "assistant" && (
              <section className="assistant-chat">
                {ctx.caps?.assistantMode === "OFF" ? (
                  <p>
                    Le chat est désactivé. L’aide et les guides autorisés
                    restent disponibles.
                  </p>
                ) : (
                  <>
                    <div
                      className={`assistant-transcript${!messages.length ? " is-empty" : ""}`}
                      aria-label="Messages de la conversation"
                    >
                      {!messages.length && (
                        <article className="assistant-message assistant-welcome">
                          <strong>Agent Konza</strong>
                          <p>
                            Bonjour ! Que souhaitez-vous faire aujourd’hui ? Je
                            peux vous orienter dans l’application et expliquer
                            les analyses disponibles pour votre compte.
                          </p>
                        </article>
                      )}
                      {messages.map((message, index) => (
                        <article
                          key={message.id}
                          className={`assistant-message ${message.role === "USER" ? "is-user" : ""}`}
                        >
                          <strong>
                            {message.role === "USER" ? "Vous" : "Agent Konza"}
                          </strong>
                          <p>
                            {message.text || "…"}
                            {busy &&
                              message.id.startsWith("pending:") &&
                              message.text && (
                                <span
                                  className="assistant-writing-caret"
                                  aria-hidden="true"
                                >
                                  ▍
                                </span>
                              )}
                          </p>
                          {message.payload?.card &&
                            ["ADMIN", "HR_MANAGER"].includes(ctx.actor.role) &&
                            Array.isArray(message.payload.card.metrics) && (
                              <section className="assistant-analysis-card">
                                <h4>{message.payload.card.title}</h4>
                                <p>Basé sur {message.payload.card.period}</p>
                                <dl>
                                  {message.payload.card.metrics.map(
                                    (metric) => (
                                      <div key={metric.label}>
                                        <dt>{metric.label}</dt>
                                        <dd>
                                          {Number.isFinite(metric.value)
                                            ? metric.value.toLocaleString(
                                                "fr-FR",
                                              )
                                            : "—"}
                                          {metric.unit ? " " + metric.unit : ""}
                                        </dd>
                                      </div>
                                    ),
                                  )}
                                </dl>
                                {message.payload.card.rows && (
                                  <div className="assistant-analysis-rows">
                                    {message.payload.card.rows.map(
                                      (row, index) => (
                                        <article
                                          key={row.employeeId + String(index)}
                                        >
                                          <div>
                                            {row.path ? (
                                              <Link
                                                href={row.path}
                                                onClick={close}
                                              >
                                                {row.label}
                                              </Link>
                                            ) : (
                                              <strong>{row.label}</strong>
                                            )}
                                            {row.detail && <p>{row.detail}</p>}
                                          </div>
                                          {typeof row.value === "number" &&
                                            Number.isFinite(row.value) && (
                                              <span>
                                                {row.value.toLocaleString(
                                                  "fr-FR",
                                                )}{" "}
                                                {row.unit}
                                              </span>
                                            )}
                                        </article>
                                      ),
                                    )}
                                    {!message.payload.card.rows.length && (
                                      <p>Aucun résultat pour cette période.</p>
                                    )}
                                  </div>
                                )}
                                {message.payload.card.departments && (
                                  <div className="assistant-departments">
                                    <table>
                                      <caption>
                                        Mouvements par département
                                      </caption>
                                      <thead>
                                        <tr>
                                          <th>Département</th>
                                          <th>Début</th>
                                          <th>Entrées</th>
                                          <th>Sorties</th>
                                          <th>Fin</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {message.payload.card.departments.map(
                                          (d) => (
                                            <tr key={d.name}>
                                              <th>{d.name}</th>
                                              <td>{d.initial}</td>
                                              <td>{d.hires}</td>
                                              <td>{d.departures}</td>
                                              <td>{d.final}</td>
                                            </tr>
                                          ),
                                        )}
                                      </tbody>
                                    </table>
                                  </div>
                                )}
                                {message.payload.card.notes?.map((note) => (
                                  <p key={note}>{note}</p>
                                ))}
                                <small>
                                  Source :{" "}
                                  {analysisSources[
                                    message.payload.card.source
                                  ] || "Données vérifiées de l’application"}
                                </small>
                              </section>
                            )}
                          {message.payload?.clarification?.options?.length ? (
                            <div
                              className="assistant-clarify"
                              role="group"
                              aria-label="Choisissez l’employé concerné"
                            >
                              {message.payload.clarification.options.map(
                                (option) => (
                                  <button
                                    key={option.id}
                                    type="button"
                                    disabled={
                                      busy || index !== messages.length - 1
                                    }
                                    onClick={() =>
                                      void send(
                                        option.employeeNumber
                                          ? `${option.label} (${option.employeeNumber})`
                                          : option.label,
                                        undefined,
                                        { employeeId: option.id },
                                      )
                                    }
                                  >
                                    <strong>{option.label}</strong>
                                    {option.employeeNumber && (
                                      <span>N° {option.employeeNumber}</span>
                                    )}
                                  </button>
                                ),
                              )}
                            </div>
                          ) : null}
                          {message.payload && (
                            <>
                              <small>
                                {message.payload.refusal
                                  ? "Hors du périmètre disponible"
                                  : message.payload.clarification
                                    ? "Précision nécessaire"
                                    : message.payload.analysis
                                    ? "Source : outil de lecture vérifié"
                                    : "Source : aide de l’application"}
                              </small>
                              <div className="assistant-message-actions">
                                {message.payload.path && (
                                  <Link
                                    href={message.payload.path}
                                    onClick={close}
                                  >
                                    Ouvrir la page
                                  </Link>
                                )}
                                {message.payload.guideId &&
                                  guide?.enabled &&
                                  !ctx.caps?.disabledGuides.includes(
                                    message.payload.guideId,
                                  ) && (
                                    <button
                                      onClick={() =>
                                        startGuide(message.payload!.guideId!)
                                      }
                                    >
                                      Me guider
                                    </button>
                                  )}
                                <button
                                  aria-label="Réponse utile"
                                  aria-pressed={message.rating === 1}
                                  onClick={() => void rate(message.id, 1)}
                                >
                                  <ThumbsUp size={15} strokeWidth={1.5} />
                                </button>
                                <button
                                  aria-label="Réponse peu utile"
                                  aria-pressed={message.rating === -1}
                                  onClick={() => void rate(message.id, -1)}
                                >
                                  <ThumbsDown size={15} strokeWidth={1.5} />
                                </button>
                              </div>
                            </>
                          )}
                        </article>
                      ))}
                      {!messages.length && suggestions.length > 0 && (
                        <div
                          className="assistant-quick-questions"
                          aria-label="Questions suggérées"
                        >
                          {suggestions.slice(0, 3).map((q) => (
                            <button
                              type="button"
                              key={q}
                              disabled={busy || loading || !ctx.caps}
                              onClick={() => void send(q)}
                            >
                              {q}
                              <ArrowRight size={14} strokeWidth={1.5} />
                            </button>
                          ))}
                        </div>
                      )}
                      <div ref={end} className="assistant-scroll-anchor" />
                    </div>
                    <div role="status" className="assistant-status">
                      {busy ? "Agent Konza écrit…" : ""}
                    </div>
                    <form
                      className="assistant-composer"
                      onSubmit={(e) => {
                        e.preventDefault();
                        void send();
                      }}
                    >
                      <textarea
                        rows={2}
                        aria-label="Votre question à Agent Konza"
                        maxLength={800}
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                        onKeyDown={(e) => {
                          if (
                            e.key === "Enter" &&
                            !e.shiftKey &&
                            !e.nativeEvent.isComposing
                          ) {
                            e.preventDefault();
                            void send();
                          }
                        }}
                        placeholder="Comment utiliser l’application ?"
                        disabled={busy || loading || !ctx.caps}
                      />
                      {busy ? (
                        <button
                          type="button"
                          className="k-button k-button-secondary"
                          aria-label="Interrompre la réponse"
                          onClick={() => controller.current?.abort()}
                        >
                          <Square size={16} strokeWidth={1.5} />
                        </button>
                      ) : (
                        <button
                          type="submit"
                          className="k-button k-button-primary"
                          aria-label="Envoyer la question"
                          disabled={!draft.trim() || loading || !ctx.caps}
                        >
                          <Send size={17} strokeWidth={1.5} />
                        </button>
                      )}
                    </form>
                  </>
                )}
              </section>
            )}
            <footer className="assistant-support">
              <Link href="/messages?support=1" onClick={close}>
                Discuter avec Support Konza
                <ArrowRight size={14} strokeWidth={1.5} />
              </Link>
              {kind === "assistant" && (
                <span>
                  {ctx.caps?.assistantMode === "IA_AVANCEE"
                    ? "IA avancée"
                    : "Mode intégré"}{" "}
                  · lecture seule
                </span>
              )}
            </footer>
          </div>
        </div>
      </div>
    </AssistantWindow>
  );
}