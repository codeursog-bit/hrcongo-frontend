"use client";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  Check,
  Headphones,
  MessageSquare,
  Plus,
  Send,
} from "lucide-react";
import {
  supportApi,
  type GuestAccess,
  type SupportAgent,
  type SupportMessage,
  type SupportStatus,
  type SupportTicket,
} from "@/lib/support/api";
import { DEMO_MODE } from "@/lib/demo/config";
import { authService } from "@/lib/services/authService";
import "./support.css";
export const SUPPORT_STATUS: Record<SupportStatus, string> = {
  OPEN: "À traiter",
  IN_PROGRESS: "En cours",
  RESOLVED: "Résolue",
};
const date = (v: string) =>
  new Date(v).toLocaleString("fr-FR", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
export default function SupportInbox({
  staff = false,
  guest,
}: {
  staff?: boolean;
  guest?: GuestAccess;
}) {
  const [tickets, setTickets] = useState<SupportTicket[]>([]),
    [total, setTotal] = useState(0),
    [offset, setOffset] = useState(0),
    [status, setStatus] = useState(""),
    [activeId, setActiveId] = useState<string | null>(guest?.id || null),
    [ticket, setTicket] = useState<SupportTicket | null>(null),
    [messages, setMessages] = useState<SupportMessage[]>([]),
    [agents, setAgents] = useState<SupportAgent[]>([]),
    [draft, setDraft] = useState(""),
    [subject, setSubject] = useState(""),
    [category, setCategory] = useState(""),
    [internal, setInternal] = useState(false),
    [creating, setCreating] = useState(false),
    [loading, setLoading] = useState(true),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [hasOlder, setHasOlder] = useState(false),
    [pendingContacts, setPendingContacts] = useState(0),
    [blocked, setBlocked] = useState(false);
  const alive = useRef(true),
    listRequest = useRef(0),
    epoch = useRef(0),
    sending = useRef(false),
    retry = useRef<{ key: string; id: string } | null>(null),
    seq = useRef(0),
    tail = useRef<HTMLDivElement>(null);
  const isDemo = DEMO_MODE && !staff && !guest;
  function blockSession(
    message = "La session ou vos droits ont changé. Rechargez la page pour continuer.",
  ) {
    epoch.current++;
    listRequest.current++;
    setBlocked(true);
    setTickets([]);
    setMessages([]);
    setTicket(null);
    setDraft("");
    setSubject("");
    setAgents([]);
    setError(message);
  }
  useEffect(() => {
    if (guest || isDemo) return;
    const identity = () => {
      const u = authService.getCurrentUser();
      return `${u?.id || ""}:${u?.role || ""}`;
    };
    const initial = identity();
    const check = () => {
      if (identity() !== initial) blockSession();
    };
    window.addEventListener("storage", check);
    window.addEventListener("focus", check);
    return () => {
      window.removeEventListener("storage", check);
      window.removeEventListener("focus", check);
    };
  }, [guest, isDemo]);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
      epoch.current++;
    };
  }, []);
  const loadList = useCallback(async () => {
    if (guest || isDemo) return;
    const request = ++listRequest.current;
    const data = await supportApi.list(staff, offset, status);
    if (alive.current && request === listRequest.current) {
      setTickets(data.tickets);
      setTotal(data.total);
      setPendingContacts(data.pendingContacts || 0);
    }
  }, [staff, offset, status, guest, isDemo]);
  useEffect(() => {
    if (staff)
      supportApi
        .agents()
        .then((a) => {
          if (alive.current) setAgents(a);
        })
        .catch(() => {});
  }, [staff]);
  useEffect(() => {
    if (blocked) {
      setLoading(false);
      return;
    }
    let stopped = false,
      timer: ReturnType<typeof setTimeout>;
    let delay = activeId ? 5000 : 12000;
    let inFlight = false;
    const current = ++epoch.current;
    seq.current = 0;
    setMessages([]);
    setTicket(null);
    setLoading(true);
    setError("");
    setNotice("");
    async function poll() {
      if (inFlight) return;
      if (stopped || isDemo || blocked) {
        setLoading(false);
        return;
      }
      if (document.hidden) {
        timer = setTimeout(poll, delay);
        return;
      }
      inFlight = true;
      try {
        if (activeId && !creating) {
          const data = await supportApi.messages(
            activeId,
            staff,
            seq.current ? { after: seq.current } : {},
            guest,
          );
          if (stopped || current !== epoch.current) return;
          setTicket(data.ticket);
          setMessages((old) =>
            [
              ...old,
              ...data.messages.filter((m) => !old.some((o) => o.id === m.id)),
            ].sort((a, b) => a.seq - b.seq),
          );
          if (!seq.current) setHasOlder(data.hasMore);
          if (data.messages.length)
            seq.current = Math.max(seq.current, data.messages.at(-1)!.seq);
        }
        await loadList();
        delay = activeId ? 5000 : 12000;
        if (!stopped && current === epoch.current) setError("");
      } catch (e) {
        if (
          !stopped &&
          current === epoch.current &&
          [401, 403, 404].includes((e as { status?: number })?.status || 0)
        ) {
          blockSession(e instanceof Error ? e.message : undefined);
          return;
        }
        if (!stopped && current === epoch.current)
          setError(
            e instanceof Error ? e.message : "Connexion au support impossible.",
          );
        delay = Math.min(delay * 2, 60000);
      } finally {
        inFlight = false;
        if (!stopped && current === epoch.current) {
          setLoading(false);
          timer = setTimeout(poll, delay);
        }
      }
    }
    void poll();
    const wake = () => {
      if (document.hidden || stopped) return;
      clearTimeout(timer);
      timer = setTimeout(poll, 0);
    };
    document.addEventListener("visibilitychange", wake);
    return () => {
      stopped = true;
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", wake);
    };
  }, [activeId, staff, creating, guest, isDemo, blocked, loadList]);
  useEffect(() => {
    tail.current?.scrollIntoView({ block: "nearest", behavior: "auto" });
  }, [messages.at(-1)?.id]);
  function select(id: string) {
    if (sending.current) return;
    setActiveId(id);
    setCreating(false);
    setDraft("");
    setInternal(false);
    retry.current = null;
  }
  async function send(e: React.FormEvent) {
    e.preventDefault();
    const body = draft.trim();
    if (
      !body ||
      sending.current ||
      isDemo ||
      blocked ||
      (!activeId && !creating) ||
      (creating && (!category || subject.trim().length < 3))
    )
      return;
    const current = epoch.current;
    const key = [activeId, subject, category, internal, body].join("|");
    if (retry.current?.key !== key)
      retry.current = { key, id: crypto.randomUUID() };
    sending.current = true;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      if (creating) {
        const result = await supportApi.create({
          subject: subject.trim(),
          category,
          body,
          clientId: retry.current.id,
        });
        if (!alive.current || epoch.current !== current) return;
        setActiveId(result.id);
        setCreating(false);
        setSubject("");
      } else if (activeId) {
        const message = await supportApi.send(
          activeId,
          { body, clientId: retry.current.id, internal: staff && internal },
          staff,
          guest,
        );
        if (!alive.current || epoch.current !== current) return;
        setMessages((old) =>
          old.some((m) => m.id === message.id) ? old : [...old, message],
        );
        if (message.notificationSent === false)
          setNotice(
            "Réponse enregistrée. La notification par e-mail n’a pas pu être envoyée.",
          );
      }
      if (alive.current && epoch.current === current) {
        setDraft("");
        retry.current = null;
        void loadList().catch(() => {});
      }
    } catch (e) {
      if (alive.current && epoch.current === current)
        setError(
          e instanceof Error
            ? e.message
            : "Le message n’a pas été envoyé. Vous pouvez réessayer.",
        );
    } finally {
      sending.current = false;
      if (alive.current) setBusy(false);
    }
  }
  async function update(data: {
    status?: SupportStatus;
    priority?: string;
    assigneeId?: string | null;
  }) {
    if (!activeId || sending.current) return;
    sending.current = true;
    setBusy(true);
    const current = epoch.current;
    try {
      await supportApi.update(activeId, data);
      if (alive.current && current === epoch.current) {
        setTicket((t) => (t ? { ...t, ...data } : t));
        await loadList();
      }
    } catch (e) {
      if (alive.current && current === epoch.current)
        setError(e instanceof Error ? e.message : "Modification impossible.");
    } finally {
      sending.current = false;
      if (alive.current) setBusy(false);
    }
  }
  async function older() {
    if (!activeId || !messages.length || busy) return;
    setBusy(true);
    const current = epoch.current;
    try {
      const data = await supportApi.messages(
        activeId,
        staff,
        { before: messages[0].seq },
        guest,
      );
      if (alive.current && current === epoch.current) {
        setMessages((old) => [
          ...data.messages.filter((m) => !old.some((o) => o.id === m.id)),
          ...old,
        ]);
        setHasOlder(data.hasMore);
      }
    } catch {
      if (alive.current) setError("Messages précédents indisponibles.");
    } finally {
      if (alive.current) setBusy(false);
    }
  }
  async function renewGuestLink() {
    if (
      !activeId ||
      sending.current ||
      !window.confirm(
        "Envoyer un nouveau lien privé au visiteur ? Son ancien lien ne fonctionnera plus.",
      )
    )
      return;
    const current = epoch.current;
    sending.current = true;
    setBusy(true);
    try {
      const result = await supportApi.resendGuestLink(activeId);
      if (alive.current && current === epoch.current)
        setNotice(
          result.sent
            ? "Un nouveau lien privé a été envoyé au visiteur."
            : "L’envoi par e-mail a échoué. Le nouveau lien n’a pas été remis au visiteur ; vous pouvez réessayer.",
        );
    } catch (e) {
      if (alive.current && current === epoch.current)
        setError(e instanceof Error ? e.message : "Envoi impossible.");
    } finally {
      sending.current = false;
      if (alive.current) setBusy(false);
    }
  }
  return (
    <div
      className={`support-workspace ${activeId || creating ? "has-thread" : ""} ${guest ? "is-guest" : ""}`}
    >
      {!guest && (
        <aside className="support-inbox">
          <header>
            <div>
              <span className="support-eyebrow">
                {staff ? "Relation clients" : "Parlons ensemble"}
              </span>
              <h2>{staff ? "Boîte de réception" : "Support Konza"}</h2>
            </div>
            {!staff && (
              <button
                type="button"
                className="support-icon"
                title="Nouvelle demande"
                aria-label="Nouvelle demande"
                disabled={busy || isDemo || blocked}
                onClick={() => {
                  setCreating(true);
                  setActiveId(null);
                  setDraft("");
                  setSubject("");
                  setCategory("");
                  retry.current = null;
                }}
              >
                <Plus size={20} />
              </button>
            )}
          </header>
          <p className="support-muted">
            {staff
              ? "Messages de l’application et de Contact."
              : "Une question, un incident ou une réclamation ? Notre équipe vous répond ici."}
          </p>
          {staff && (
            <label className="support-field">
              Afficher
              <select
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value);
                  setOffset(0);
                }}
              >
                {[
                  ["", "Toutes les demandes"],
                  ...Object.entries(SUPPORT_STATUS),
                ].map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </select>
            </label>
          )}
          {staff && pendingContacts > 0 && (
            <p className="support-info">
              {pendingContacts} anciens messages Contact sont encore en cours
              d’import. Ils apparaîtront aux prochaines actualisations.
            </p>
          )}
          {isDemo ? (
            <p className="support-info">
              L’envoi au support est disponible avec une session réelle. Aucun
              message de démonstration n’est envoyé à notre équipe.
            </p>
          ) : (
            <>
              <div
                className="support-ticket-list"
                aria-label="Conversations support"
              >
                {tickets.map((t) => (
                  <button
                    type="button"
                    disabled={busy}
                    key={t.id}
                    className={`support-ticket ${activeId === t.id ? "is-active" : ""}`}
                    onClick={() => select(t.id)}
                  >
                    <div>
                      <strong>{t.subject}</strong>
                      {t.unread && (
                        <span
                          className="support-unread"
                          aria-label="Nouveau message"
                        />
                      )}
                    </div>
                    <span>
                      {staff ? t.requesterName : SUPPORT_STATUS[t.status]}
                    </span>
                    <p>{t.lastPreview || "Conversation"}</p>
                    <small>
                      {date(t.updatedAt)} ·{" "}
                      {staff
                        ? `${SUPPORT_STATUS[t.status]} · ${t.category === "SUGGESTION" ? "Suggestion de fonctionnalité" : t.category === "FEEDBACK" ? "Retour d’expérience" : t.category === "INCIDENT" ? "Incident" : t.category === "COMPLAINT" ? "Réclamation" : "Question"}`
                        : t.category === "COMPLAINT"
                          ? "Réclamation"
                          : t.category === "SUGGESTION"
                            ? "Suggestion de fonctionnalité"
                            : t.category === "FEEDBACK"
                              ? "Retour d’expérience"
                              : t.category === "INCIDENT"
                                ? "Incident"
                                : "Question"}
                    </small>
                  </button>
                ))}
                {!loading && !tickets.length && (
                  <p className="support-muted">
                    Aucune conversation pour le moment.
                  </p>
                )}
              </div>
              <footer className="support-pagination">
                <button
                  type="button"
                  disabled={!offset || busy}
                  onClick={() => setOffset((n) => Math.max(0, n - 20))}
                >
                  Précédent
                </button>
                <span>
                  {total ? offset + 1 : 0}–{Math.min(offset + 20, total)} /{" "}
                  {total}
                </span>
                <button
                  type="button"
                  disabled={offset + 20 >= total || busy}
                  onClick={() => setOffset((n) => n + 20)}
                >
                  Suivant
                </button>
              </footer>
            </>
          )}
        </aside>
      )}
      <section className="support-conversation">
        <header className="support-thread-header">
          <div>
            {!guest && (activeId || creating) && (
              <button
                className="support-back support-icon"
                type="button"
                disabled={busy}
                onClick={() => {
                  setActiveId(null);
                  setCreating(false);
                }}
                aria-label="Retour aux conversations"
              >
                <ArrowLeft size={20} />
              </button>
            )}
            <Headphones size={23} strokeWidth={1.5} />
            <div>
              <h2>
                {creating
                  ? "Nouvelle demande"
                  : ticket?.subject || "Support Konza"}
              </h2>
              <p>
                {staff && ticket
                  ? `${ticket.requesterName} · ${ticket.requesterEmail}`
                  : "Une conversation avec notre équipe, distincte de l’assistant."}
              </p>
              {ticket && (
                <small>
                  Motif :{" "}
                  {ticket.category === "SUGGESTION"
                    ? "Suggestion de fonctionnalité"
                    : ticket.category === "FEEDBACK"
                      ? "Retour d’expérience"
                      : ticket.category === "INCIDENT"
                        ? "Incident"
                        : ticket.category === "COMPLAINT"
                          ? "Réclamation"
                          : "Question"}
                </small>
              )}
            </div>
          </div>
          {ticket && (
            <span className="support-status">
              <Check size={14} />
              {SUPPORT_STATUS[ticket.status]}
            </span>
          )}
        </header>
        {staff && ticket && (
          <div className="support-management">
            {ticket.source === "CONTACT" && (
              <button
                type="button"
                className="support-secondary"
                disabled={busy}
                onClick={() => void renewGuestLink()}
              >
                Renvoyer le lien privé
              </button>
            )}
            <label>
              Traitement
              <select
                disabled={busy}
                value={ticket.status}
                onChange={(e) =>
                  void update({ status: e.target.value as SupportStatus })
                }
              >
                {Object.entries(SUPPORT_STATUS).map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Priorité
              <select
                disabled={busy}
                value={ticket.priority}
                onChange={(e) => void update({ priority: e.target.value })}
              >
                <option value="NORMAL">Normale</option>
                <option value="HIGH">Haute</option>
              </select>
            </label>
            <label>
              Attribuer à
              <select
                disabled={busy}
                value={ticket.assigneeId || ""}
                onChange={(e) =>
                  void update({ assigneeId: e.target.value || null })
                }
              >
                <option value="">Non attribuée</option>
                {agents
                  .filter((a) => a.isActive)
                  .map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.firstName} {a.lastName}
                    </option>
                  ))}
              </select>
            </label>
            <small>
              {ticket.source === "CONTACT"
                ? "Contact public — identité déclarée par le visiteur"
                : "Compte connecté"}
              {ticket.companyLabel ? " · " + ticket.companyLabel : ""}
            </small>
          </div>
        )}
        {error && (
          <p className="support-error" role="alert">
            {error}
          </p>
        )}
        {notice && (
          <p className="support-info" role="status">
            {notice}
          </p>
        )}
        {creating ? (
          <form className="support-new" onSubmit={send}>
            <div className="support-welcome">
              <MessageSquare size={34} strokeWidth={1.5} />
              <h3>Comment pouvons-nous vous aider ?</h3>
              <p>
                Expliquez-nous ce qui se passe. Vos échanges restent dans cette
                conversation.
              </p>
            </div>
            <label className="support-field">
              Sujet
              <input
                required
                minLength={3}
                maxLength={150}
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Ex. Je ne parviens pas à ouvrir un document"
              />
            </label>
            <label className="support-field">
              Type de demande
              <select
                required
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="" disabled>
                  Choisir le motif de votre message
                </option>
                <option value="QUESTION">Une question</option>
                <option value="INCIDENT">Un incident</option>
                <option value="COMPLAINT">Une réclamation</option>
                <option value="SUGGESTION">Suggérer une fonctionnalité</option>
                <option value="FEEDBACK">
                  Partager une difficulté ou un retour
                </option>
              </select>
            </label>
            <label className="support-field">
              Votre message
              <textarea
                required
                rows={5}
                maxLength={4000}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Décrivez votre besoin, sans mot de passe ni coordonnées bancaires."
              />
            </label>
            <button
              className="support-primary"
              disabled={
                busy || !category || !draft.trim() || subject.trim().length < 3
              }
            >
              {busy ? "Envoi…" : "Envoyer au support"}
              <Send size={17} />
            </button>
          </form>
        ) : activeId ? (
          <>
            <div
              className="support-transcript"
              role="log"
              aria-live="polite"
              aria-label="Messages du support"
            >
              {loading && !messages.length && (
                <p role="status">Chargement de la conversation…</p>
              )}
              {hasOlder && (
                <button
                  className="support-secondary"
                  type="button"
                  disabled={busy}
                  onClick={() => void older()}
                >
                  Messages précédents
                </button>
              )}
              {messages
                .filter((m) => staff || !m.internal)
                .map((m) => (
                  <article
                    key={m.id}
                    className={`support-message ${m.side === (staff ? "STAFF" : "CUSTOMER") ? "is-mine" : ""} ${m.internal ? "is-note" : ""}`}
                  >
                    <header>
                      <strong>
                        {m.internal
                          ? "Note interne"
                          : m.side === "STAFF"
                            ? "Support Konza"
                            : staff
                              ? ticket?.requesterName || "Visiteur"
                              : "Vous"}
                      </strong>
                      <time dateTime={m.createdAt}>{date(m.createdAt)}</time>
                    </header>
                    <p>{m.body}</p>
                    {m.internal && (
                      <small>Visible uniquement par l’équipe support.</small>
                    )}
                  </article>
                ))}
              <div ref={tail} />
            </div>
            <form className="support-composer" onSubmit={send}>
              {staff && (
                <label className="support-note-toggle">
                  <input
                    type="checkbox"
                    checked={internal}
                    onChange={(e) => setInternal(e.target.checked)}
                    disabled={busy}
                  />{" "}
                  Note interne — invisible pour le client
                </label>
              )}
              <label className="support-sr" htmlFor="support-message-input">
                Votre message
              </label>
              <textarea
                id="support-message-input"
                onKeyDown={(e) => {
                  if (
                    e.key === "Enter" &&
                    !e.shiftKey &&
                    !e.nativeEvent.isComposing
                  ) {
                    e.preventDefault();
                    void send(e);
                  }
                }}
                rows={2}
                maxLength={4000}
                disabled={busy || loading || blocked}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder={
                  internal
                    ? "Écrire une note pour les agents…"
                    : "Écrivez votre message…"
                }
              />
              <div>
                <small>
                  {draft.length} / 4 000 · Ne partagez pas de mot de passe.
                </small>
                <button
                  className="support-primary"
                  disabled={busy || loading || blocked || !draft.trim()}
                >
                  {busy ? "Envoi…" : internal ? "Ajouter la note" : "Envoyer"}
                  <Send size={16} />
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="support-welcome">
            <Headphones size={40} strokeWidth={1.5} />
            <h3>
              {staff
                ? "Chaque échange compte."
                : "Nous sommes là pour vous aider."}
            </h3>
            <p>
              {staff
                ? "Ouvrez une demande pour lire les échanges, répondre et organiser son traitement."
                : "Retrouvez vos échanges à gauche ou démarrez une conversation avec notre équipe."}
            </p>
            {!staff && (
              <button
                className="support-primary"
                disabled={isDemo || blocked}
                onClick={() => {
                  setCreating(true);
                  setSubject("");
                  setDraft("");
                }}
              >
                Écrire au support
                <Plus size={17} />
              </button>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
