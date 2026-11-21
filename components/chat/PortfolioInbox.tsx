'use client';

// components/chat/PortfolioInbox.tsx
// Boîte de réception commune du portefeuille : conversations de TOUTES les entreprises de l'admin,
// quelle que soit son entreprise active. Un employé de l'entreprise B peut ainsi lui écrire sans
// qu'elle ait basculé sur B ; ces messages restent séparés du chat de l'entreprise active.

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, Building2, Send } from 'lucide-react';
import { chatApi, MAX_MESSAGE_LENGTH, type ChatConversation, type ChatMessage } from '@/services/chat-api';

const LIST_REFRESH_MS = 15000;
const THREAD_REFRESH_MS = 6000;

const hhmm = (iso: string | null) =>
  iso ? new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '';
const dayLabel = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }) : '';
const newClientId = () => `pf-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

export default function PortfolioInbox({ onUnread }: { onUnread?: (n: number) => void }) {
  const [convs, setConvs] = useState<ChatConversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [blocked, setBlocked] = useState<Record<string, boolean>>({});
  const scrollRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<string | null>(null);
  activeRef.current = activeId;

  const refreshList = useCallback(async () => {
    try {
      const list = await chatApi.portfolio.conversations();
      setConvs(list);
      onUnread?.(list.reduce((n, c) => n + (c.unreadCount || 0), 0));
    } catch {
      /* silencieux : on réessaie au prochain tick */
    } finally {
      setLoading(false);
    }
  }, [onUnread]);

  useEffect(() => {
    refreshList();
    const t = setInterval(() => {
      if (!document.hidden) refreshList();
    }, LIST_REFRESH_MS);
    return () => clearInterval(t);
  }, [refreshList]);

  const scrollDown = () =>
    requestAnimationFrame(() => {
      const el = scrollRef.current;
      if (el) el.scrollTop = el.scrollHeight;
    });

  const open = useCallback(
    async (id: string) => {
      setActiveId(id);
      setMessages([]);
      setError(null);
      try {
        const r = await chatApi.portfolio.messages(id, { limit: 50 });
        if (activeRef.current !== id) return;
        setMessages(r.messages);
        scrollDown();
        await chatApi.portfolio.markRead(id);
        refreshList();
      } catch (e: any) {
        setError(e?.message || 'Impossible de charger la conversation.');
      }
    },
    [refreshList],
  );

  // Nouveaux messages de la conversation ouverte (delta depuis le dernier seq connu)
  useEffect(() => {
    if (!activeId) return;
    const id = activeId;
    const t = setInterval(async () => {
      if (document.hidden || activeRef.current !== id) return;
      try {
        const last = [...messages].reverse().find((m) => !m.status)?.seq ?? 0;
        const r = await chatApi.portfolio.messages(id, { after: last, limit: 50 });
        if (activeRef.current !== id || !r.messages.length) return;
        setMessages((prev) => {
          const known = new Set(prev.map((m) => m.id));
          const add = r.messages.filter((m) => !known.has(m.id));
          // retire les bulles optimistes dont le vrai message vient d'arriver
          const mineNew = add.filter((m) => m.mine).length;
          const base = mineNew ? prev.filter((m) => m.status !== 'sending') : prev;
          return add.length ? [...base, ...add] : prev;
        });
        scrollDown();
        chatApi.portfolio.markRead(id).then(refreshList).catch(() => {});
      } catch {
        /* on réessaie */
      }
    }, THREAD_REFRESH_MS);
    return () => clearInterval(t);
  }, [activeId, messages, refreshList]);

  const send = async () => {
    const id = activeId;
    const body = draft.trim();
    if (!id || !body || blocked[id]) return;
    const clientId = newClientId();
    setDraft('');
    setError(null);
    setMessages((prev) => [
      ...prev,
      { id: clientId, seq: Number.MAX_SAFE_INTEGER, mine: true, body, createdAt: new Date().toISOString(), status: 'sending', clientId },
    ]);
    scrollDown();
    try {
      const saved = await chatApi.portfolio.send(id, body, clientId);
      if (activeRef.current === id) {
        setMessages((prev) => prev.map((m) => (m.clientId === clientId ? { ...saved, mine: true } : m)));
      }
      refreshList();
    } catch (e: any) {
      if (e?.status === 403) {
        setBlocked((p) => ({ ...p, [id]: true }));
        setMessages((prev) => prev.filter((m) => m.clientId !== clientId));
        setDraft((d) => d || body);
        setError("Cette personne n'est plus joignable depuis son entreprise. Contactez les RH si c'est une erreur.");
      } else {
        setMessages((prev) => prev.map((m) => (m.clientId === clientId ? { ...m, status: 'failed' } : m)));
        setError(e?.message || "Échec de l'envoi.");
      }
    }
  };

  const grouped = useMemo(() => {
    const map = new Map<string, { name: string; items: ChatConversation[]; unread: number }>();
    for (const c of convs) {
      const key = c.companyId || 'x';
      const g = map.get(key) ?? { name: c.companyName || 'Entreprise', items: [], unread: 0 };
      g.items.push(c);
      g.unread += c.unreadCount || 0;
      map.set(key, g);
    }
    return [...map.entries()].sort((a, b) => b[1].unread - a[1].unread || a[1].name.localeCompare(b[1].name));
  }, [convs]);

  const active = convs.find((c) => c.id === activeId) || null;

  return (
    <div
      className="flex h-[calc(100dvh-11rem)] overflow-hidden rounded-[var(--radius-card)]"
      style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
    >
      {/* Liste */}
      <aside className={`${activeId ? 'hidden md:flex' : 'flex'} w-full md:w-[340px] md:shrink-0 flex-col`} style={{ borderRight: '1px solid var(--border)' }}>
        <div className="p-4 pb-2">
          <h2 className="text-base font-semibold" style={{ color: 'var(--text)' }}>Toutes mes entreprises</h2>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
            Messages reçus de toutes vos entreprises, sans changer d&apos;entreprise active.
          </p>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar px-2 pb-2">
          {loading && <p className="p-4 text-sm" style={{ color: 'var(--text-muted)' }}>Chargement…</p>}
          {!loading && grouped.length === 0 && (
            <p className="p-4 text-sm" style={{ color: 'var(--text-muted)' }}>Aucune conversation pour le moment.</p>
          )}
          {grouped.map(([key, g]) => (
            <div key={key} className="mb-2">
              <div className="flex items-center gap-1.5 px-3 pt-3 pb-1.5 text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
                <Building2 size={12} />
                <span className="truncate">{g.name}</span>
                {g.unread > 0 && (
                  <span className="ml-auto rounded-full bg-[var(--brand-strong)] px-1.5 text-[10px] font-semibold text-white">{g.unread}</span>
                )}
              </div>
              {g.items.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => open(c.id)}
                  className={`w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-[var(--surface-2)] ${activeId === c.id ? 'bg-[var(--surface-2)]' : ''}`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className={`truncate text-sm ${c.unreadCount ? 'font-semibold' : 'font-medium'}`} style={{ color: 'var(--text)' }}>
                        {c.other.name}
                      </span>
                      <span className="shrink-0 text-[11px]" style={{ color: 'var(--text-muted)' }}>{dayLabel(c.lastMessageAt)}</span>
                    </div>
                    <div className="flex items-center justify-between gap-2 mt-0.5">
                      <span className={`text-xs truncate ${c.unreadCount ? 'font-semibold' : ''}`} style={{ color: c.unreadCount ? 'var(--text)' : 'var(--text-muted)' }}>
                        {c.lastFromMe ? 'Vous : ' : ''}{c.lastPreview ?? ''}
                      </span>
                      {c.unreadCount > 0 && (
                        <span className="flex h-5 min-w-[20px] shrink-0 items-center justify-center rounded-full bg-[var(--brand-strong)] px-1.5 text-[11px] font-semibold text-white">
                          {c.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ))}
        </div>
      </aside>

      {/* Conversation */}
      <section className={`${activeId ? 'flex' : 'hidden md:flex'} flex-1 min-w-0 flex-col`}>
        {!active ? (
          <div className="flex-1 flex items-center justify-center text-center p-8 text-sm" style={{ color: 'var(--text-muted)' }}>
            Sélectionnez une conversation.
          </div>
        ) : (
          <>
            <header className="flex items-center gap-3 px-4 py-3 shrink-0" style={{ borderBottom: '1px solid var(--border)' }}>
              <button type="button" onClick={() => setActiveId(null)} aria-label="Retour" className="md:hidden -ml-1 flex h-10 w-10 items-center justify-center rounded-lg hover:bg-[var(--surface-2)]">
                <ArrowLeft size={18} />
              </button>
              <div className="min-w-0">
                <div className="text-sm font-bold truncate" style={{ color: 'var(--text)' }}>{active.other.name}</div>
                <div className="text-[11px] truncate" style={{ color: 'var(--text-muted)' }}>{active.companyName}</div>
              </div>
            </header>
            <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto custom-scrollbar px-4 py-4 space-y-2">
              {messages.map((m) => (
                <div key={m.id} className={`flex ${m.mine ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap break-words ${m.mine ? 'bg-[var(--brand-strong)] text-white' : 'bg-[var(--surface-2)]'}`}
                    style={m.mine ? undefined : { color: 'var(--text)' }}
                  >
                    {m.body}
                    <div className="mt-0.5 text-[10px] opacity-70 text-right">
                      {m.status === 'sending' ? 'Envoi…' : m.status === 'failed' ? 'Échec' : hhmm(m.createdAt)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {error && <p className="px-4 pb-1 text-xs text-red-500">{error}</p>}
            <div className="flex items-end gap-2 p-3 shrink-0" style={{ borderTop: '1px solid var(--border)' }}>
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    send();
                  }
                }}
                rows={1}
                maxLength={MAX_MESSAGE_LENGTH}
                disabled={!!(activeId && blocked[activeId])}
                placeholder={activeId && blocked[activeId] ? 'Vous ne pouvez plus écrire à cette personne' : 'Écrire un message…'}
                className="flex-1 resize-none rounded-xl bg-[var(--surface-2)] px-3 py-2.5 text-base sm:text-sm outline-none focus:ring-2 focus:ring-[var(--brand-soft)]"
                style={{ color: 'var(--text)' }}
              />
              <button
                type="button"
                onClick={send}
                disabled={!draft.trim() || !!(activeId && blocked[activeId])}
                aria-label="Envoyer"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--brand-strong)] text-white disabled:opacity-40"
              >
                <Send size={18} />
              </button>
            </div>
          </>
        )}
      </section>
    </div>
  );
}