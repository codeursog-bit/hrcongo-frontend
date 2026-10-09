'use client';

// ============================================================================
// 📁 components/chat/ChatPage.tsx — page Messagerie
// ----------------------------------------------------------------------------
// • Liste des discussions + bouton « Nouveau message » (liste des contacts
//   autorisés par le serveur : nom + type d'accès) + barre de recherche.
// • Envoi optimiste : le message apparaît instantanément (c'est LUI qui donne
//   l'impression de temps réel côté expéditeur), puis il est confirmé.
// • Réception : le ChatProvider signale du nouveau → on ne charge que le delta
//   (seq > dernier message connu) de la conversation ouverte.
// • Aucun HTML injecté : les messages sont rendus comme du texte (React échappe).
// ============================================================================

import React, {
  useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState,
} from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowDown, ArrowLeft, Loader2, MessageCircle, PenSquare, RotateCcw, Search, SendHorizontal, X,
} from 'lucide-react';
import {
  ChatContact, ChatConversation, ChatMessage, ChatRole, MAX_MESSAGE_LENGTH, chatApi,
} from '@/services/chat-api';
import { useChat } from './ChatProvider';

// ─── Présentation ────────────────────────────────────────────────────────────
const ROLE_META: Record<ChatRole, { label: string; section: string; cls: string }> = {
  ADMIN:      { label: 'Admin',      section: 'Administration',       cls: 'text-violet-600 bg-violet-100 dark:text-violet-300 dark:bg-violet-900/30' },
  HR_MANAGER: { label: 'Manager RH', section: 'Ressources humaines',  cls: 'text-amber-600 bg-amber-100 dark:text-amber-300 dark:bg-amber-900/30' },
  MANAGER:    { label: 'Manager',    section: 'Managers',             cls: 'text-emerald-600 bg-emerald-100 dark:text-emerald-300 dark:bg-emerald-900/30' },
  EMPLOYEE:   { label: 'Employé',    section: 'Employés',             cls: 'text-slate-600 bg-slate-100 dark:text-slate-300 dark:bg-slate-700/40' },
};
const SECTION_ORDER: ChatRole[] = ['ADMIN', 'HR_MANAGER', 'MANAGER', 'EMPLOYEE'];

const initials = (name: string) =>
  name.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase() ?? '').join('') || '?';

const AVATAR_COLORS = ['#10B981', '#0EA5E9', '#8B5CF6', '#F59E0B', '#EF4444', '#14B8A6', '#6366F1'];
const colorFor = (id: string) => {
  let sum = 0;
  for (let i = 0; i < id.length; i++) sum += id.charCodeAt(i);
  return AVATAR_COLORS[sum % AVATAR_COLORS.length];
};

/**
 * Miniature Cloudinary à la volée (visage recadré, WebP/AVIF auto, qualité auto) :
 * ~3 Ko au lieu de la photo d'origine. Toute autre URL est utilisée telle quelle.
 */
function avatarSrc(url: string, px: number): string {
  const m = url.match(/^(https:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\/)(v\d+\/.+)$/);
  if (!m) return url;
  const size = px * 2; // écrans haute densité
  return `${m[1]}c_fill,g_face,w_${size},h_${size},f_auto,q_auto/${m[2]}`;
}

const timeOf = (iso: string) => new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
const dayKey = (iso: string) => new Date(iso).toDateString();
function dayLabel(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  const yest = new Date(); yest.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return "Aujourd'hui";
  if (d.toDateString() === yest.toDateString()) return 'Hier';
  return d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
}
function shortWhen(iso: string | null) {
  if (!iso) return '';
  const d = new Date(iso);
  const today = new Date();
  if (d.toDateString() === today.toDateString()) return timeOf(iso);
  const yest = new Date(); yest.setDate(today.getDate() - 1);
  if (d.toDateString() === yest.toDateString()) return 'Hier';
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
}

const uuid = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
      });

/** confirmés triés par seq, puis messages en cours d'envoi dans leur ordre d'arrivée */
function normalize(list: ChatMessage[]): ChatMessage[] {
  const seen = new Set<string>();
  const uniq = list.filter((m) => (seen.has(m.id) ? false : (seen.add(m.id), true)));
  const confirmed = uniq.filter((m) => !m.status).sort((a, b) => a.seq - b.seq);
  const pending = uniq.filter((m) => !!m.status);
  return [...confirmed, ...pending];
}

function Avatar({ id, name, photoUrl, size = 40 }: { id: string; name: string; photoUrl?: string | null; size?: number }) {
  const [failed, setFailed] = useState(false);
  const showPhoto = !!photoUrl && !failed;
  return (
    <div
      className="shrink-0 rounded-full flex items-center justify-center font-bold text-white select-none overflow-hidden"
      style={{ width: size, height: size, background: colorFor(id), fontSize: size * 0.36 }}
      aria-hidden
    >
      {showPhoto ? (
        <img
          src={avatarSrc(photoUrl!, size)}
          alt=""
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover"
          onError={() => setFailed(true)} // lien cassé → initiales, jamais d'image cassée
        />
      ) : (
        initials(name)
      )}
    </div>
  );
}

function RoleBadge({ role }: { role: ChatRole }) {
  const m = ROLE_META[role];
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold ${m.cls}`}>{m.label}</span>;
}

// ─── Page ────────────────────────────────────────────────────────────────────
export default function ChatPage() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const { lastChange, setFocus, pokeActivity } = useChat();

  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [mode, setMode] = useState<'chats' | 'contacts'>('chats');
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [contacts, setContacts] = useState<ChatContact[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(false);

  const [activeId, setActiveId] = useState<string | null>(params.get('c'));
  const [activeOther, setActiveOther] = useState<ChatContact | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [loadingThread, setLoadingThread] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [draft, setDraft] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [unseen, setUnseen] = useState(false);

  const activeIdRef = useRef<string | null>(activeId);
  const conversationsRef = useRef<ChatConversation[]>([]);
  conversationsRef.current = conversations;
  const lastSeqRef = useRef(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const stickRef = useRef(true);
  const anchorRef = useRef<number | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const other: ChatContact | null =
    activeOther && conversations.every((c) => c.id !== activeId)
      ? activeOther
      : conversations.find((c) => c.id === activeId)?.other ?? activeOther;

  // ── Cadence du poll selon ce que l'utilisateur regarde ─────────────────────
  useEffect(() => {
    setFocus(activeId ? 'conversation' : 'list');
  }, [activeId, setFocus]);
  useEffect(() => () => setFocus('off'), [setFocus]);

  // ── Liste des discussions ──────────────────────────────────────────────────
  const loadConversations = useCallback(async () => {
    try {
      setConversations(await chatApi.conversations());
    } catch {
      /* silencieux : le prochain changement réessaiera */
    } finally {
      setLoadingList(false);
    }
  }, []);
  useEffect(() => { void loadConversations(); }, [loadConversations]);

  // ── Recherche (anti-rebond) ────────────────────────────────────────────────
  useEffect(() => {
    const t = setTimeout(() => setDebounced(search.trim()), 250);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    if (mode !== 'contacts') return;
    let cancelled = false;
    setLoadingContacts(true);
    chatApi
      .contacts(debounced || undefined)
      .then((r) => { if (!cancelled) setContacts(r); })
      .catch(() => { if (!cancelled) setContacts([]); })
      .finally(() => { if (!cancelled) setLoadingContacts(false); });
    return () => { cancelled = true; };
  }, [mode, debounced]);

  // ── Ouverture d'une conversation ───────────────────────────────────────────
  const markReadLocal = useCallback((id: string) => {
    setConversations((prev) => prev.map((c) => (c.id === id && c.unreadCount ? { ...c, unreadCount: 0 } : c)));
  }, []);

  useEffect(() => {
    activeIdRef.current = activeId;
    setMessages([]);
    setHasMore(false);
    setUnseen(false);
    if (activeId) setError(null); // à la fermeture (ex. 404) on garde le message affiché
    lastSeqRef.current = 0;
    stickRef.current = true;
    if (!activeId) return;

    let cancelled = false;
    setLoadingThread(true);
    chatApi
      .messages(activeId, { limit: 30 })
      .then((res) => {
        if (cancelled) return;
        setMessages(normalize(res.messages));
        setHasMore(res.hasMore);
        lastSeqRef.current = res.messages.reduce((m, x) => Math.max(m, x.seq), 0);
        void chatApi.markRead(activeId).then(() => markReadLocal(activeId)).catch(() => {});
      })
      .catch((e: any) => {
        if (cancelled) return;
        if (e?.status === 404) {
          setActiveId(null);
          router.replace(pathname, { scroll: false });
          setError('Cette conversation est introuvable.');
        } else setError('Impossible de charger les messages.');
      })
      .finally(() => { if (!cancelled) setLoadingThread(false); });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId]);

  // ── Réception : delta uniquement ───────────────────────────────────────────
  const fetchDelta = useCallback(async (id: string) => {
    try {
      const res = await chatApi.messages(id, { after: lastSeqRef.current, limit: 100 });
      if (activeIdRef.current !== id || !res.messages.length) return;
      lastSeqRef.current = res.messages.reduce((m, x) => Math.max(m, x.seq), lastSeqRef.current);
      setMessages((prev) => normalize([...prev, ...res.messages]));
      if (res.messages.some((m) => !m.mine)) {
        if (!stickRef.current) setUnseen(true);
        void chatApi.markRead(id).then(() => markReadLocal(id)).catch(() => {});
      }
    } catch { /* prochain signal */ }
  }, [markReadLocal]);

  useEffect(() => {
    if (lastChange.tick === 0) return;
    void loadConversations();
    const id = activeIdRef.current;
    if (id && lastChange.conversationIds.includes(id)) void fetchDelta(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastChange.tick]);

  // ── Défilement ─────────────────────────────────────────────────────────────
  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    if (anchorRef.current !== null) {
      el.scrollTop = el.scrollHeight - anchorRef.current; // garde la position après "messages précédents"
      anchorRef.current = null;
    } else if (stickRef.current) {
      el.scrollTop = el.scrollHeight;
    }
  }, [messages]);

  const onScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    stickRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
    if (stickRef.current && unseen) setUnseen(false);
  };

  const scrollToBottom = () => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
    stickRef.current = true;
    setUnseen(false);
  };

  const loadOlder = async () => {
    if (!activeId || loadingOlder) return;
    const first = messages.find((m) => !m.status);
    if (!first) return;
    setLoadingOlder(true);
    try {
      const res = await chatApi.messages(activeId, { before: first.seq, limit: 30 });
      anchorRef.current = scrollRef.current?.scrollHeight ?? 0;
      setMessages((prev) => normalize([...res.messages, ...prev]));
      setHasMore(res.hasMore);
    } catch {
      setError('Impossible de charger les messages précédents.');
    } finally {
      setLoadingOlder(false);
    }
  };

  // ── Navigation ─────────────────────────────────────────────────────────────
  const openConversation = (id: string) => {
    setActiveId(id);
    router.replace(`${pathname}?c=${id}`, { scroll: false });
  };
  const closeConversation = () => {
    setActiveId(null);
    setActiveOther(null);
    router.replace(pathname, { scroll: false });
  };

  const startWith = async (c: ChatContact) => {
    try {
      const r = await chatApi.open(c.id);
      setActiveOther(r.other);
      setMode('chats');
      setSearch('');
      openConversation(r.id);
    } catch (e: any) {
      setError(e?.message || "Impossible d'ouvrir la conversation.");
    }
  };

  // ── Envoi optimiste ────────────────────────────────────────────────────────
  const deliver = useCallback(async (conversationId: string, body: string, clientId: string) => {
    try {
      const known = conversationsRef.current.some((c) => c.id === conversationId);
      const real = await chatApi.send(conversationId, body, clientId);
      lastSeqRef.current = Math.max(lastSeqRef.current, real.seq);
      if (activeIdRef.current === conversationId) {
        setMessages((prev) => normalize([...prev.filter((m) => m.clientId !== clientId), real]));
      }
      const now = real.createdAt;
      setConversations((prev) => {
        const cur = prev.find((c) => c.id === conversationId);
        const updated: ChatConversation | null = cur
          ? { ...cur, lastMessageAt: now, lastPreview: body.replace(/\s+/g, ' ').slice(0, 80), lastFromMe: true, unreadCount: 0 }
          : null;
        return updated ? [updated, ...prev.filter((c) => c.id !== conversationId)] : prev;
      });
      if (!known) void loadConversations(); // 1re fois seulement : la conversation apparaît dans la liste
    } catch (e: any) {
      if (activeIdRef.current === conversationId) {
        setMessages((prev) => prev.map((m) => (m.clientId === clientId ? { ...m, status: 'failed' } : m)));
      }
      setError(e?.status === 403 ? "Vous ne pouvez plus écrire à cette personne." : e?.message || "Échec de l'envoi.");
    }
  }, [loadConversations]);

  const send = () => {
    const body = draft.trim();
    if (!body || !activeId) return;
    const clientId = uuid();
    const optimistic: ChatMessage = {
      id: `tmp-${clientId}`, seq: Number.MAX_SAFE_INTEGER, mine: true, body,
      createdAt: new Date().toISOString(), status: 'sending', clientId,
    };
    stickRef.current = true;
    setError(null);
    setMessages((prev) => normalize([...prev, optimistic]));
    setDraft('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
    pokeActivity();
    void deliver(activeId, body, clientId);
  };

  const retry = (m: ChatMessage) => {
    if (!activeId || !m.clientId) return;
    setError(null);
    setMessages((prev) => prev.map((x) => (x.clientId === m.clientId ? { ...x, status: 'sending' } : x)));
    void deliver(activeId, m.body, m.clientId);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      send();
    }
  };
  const onDraftChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setDraft(e.target.value);
    const el = e.target;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 140)}px`;
  };

  // ── Dérivés d'affichage ────────────────────────────────────────────────────
  const filteredConversations = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q ? conversations.filter((c) => c.other.name.toLowerCase().includes(q)) : conversations;
  }, [conversations, search]);

  const groupedContacts = useMemo(
    () =>
      SECTION_ORDER.map((role) => ({ role, items: contacts.filter((c) => c.role === role) })).filter((g) => g.items.length),
    [contacts],
  );

  // ─── Rendu ─────────────────────────────────────────────────────────────────
  return (
    <div
      className="flex h-[calc(100dvh-8.5rem)] min-h-[460px] rounded-2xl overflow-hidden"
      style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
    >
      {/* ───────────── Panneau gauche ───────────── */}
      <aside
        className={`${activeId ? 'hidden md:flex' : 'flex'} w-full md:w-[340px] md:shrink-0 flex-col`}
        style={{ borderRight: '1px solid var(--border)' }}
      >
        <div className="p-4 pb-3 flex items-center justify-between gap-2">
          <h1 className="text-lg font-black" style={{ color: 'var(--text)' }}>
            {mode === 'contacts' ? 'Nouveau message' : 'Messages'}
          </h1>
          {mode === 'chats' ? (
            <button
              onClick={() => { setMode('contacts'); setSearch(''); }}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold text-white bg-emerald-500 hover:bg-emerald-600 transition-colors"
            >
              <PenSquare size={14} /> Nouveau
            </button>
          ) : (
            <button
              onClick={() => { setMode('chats'); setSearch(''); }}
              className="p-2 rounded-lg transition-colors hover:bg-black/5 dark:hover:bg-white/5"
              style={{ color: 'var(--text-muted)' }}
              aria-label="Retour aux discussions"
            >
              <X size={18} />
            </button>
          )}
        </div>

        <div className="px-4 pb-3">
          <div
            className="flex items-center gap-2 px-3 py-2.5 rounded-xl"
            style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}
          >
            <Search size={16} style={{ color: 'var(--text-muted)' }} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={mode === 'contacts' ? 'Rechercher une personne…' : 'Rechercher une discussion…'}
              maxLength={60}
              className="flex-1 bg-transparent outline-none text-sm min-w-0"
              style={{ color: 'var(--text)' }}
            />
            {search && (
              <button onClick={() => setSearch('')} aria-label="Effacer" style={{ color: 'var(--text-muted)' }}>
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar px-2 pb-2">
          {mode === 'chats' ? (
            loadingList ? (
              <ListSkeleton />
            ) : filteredConversations.length === 0 ? (
              <EmptyList
                title={search ? 'Aucune discussion trouvée' : 'Aucune discussion pour le moment'}
                hint={search ? 'Essayez un autre nom.' : 'Cliquez sur « Nouveau » pour écrire à quelqu’un.'}
              />
            ) : (
              filteredConversations.map((c) => (
                <button
                  key={c.id}
                  onClick={() => openConversation(c.id)}
                  className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-colors hover:bg-black/5 dark:hover:bg-white/5"
                  style={c.id === activeId ? { background: 'var(--brand-soft)' } : undefined}
                >
                  <Avatar id={c.other.id} name={c.other.name} photoUrl={c.other.photoUrl} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className={`text-sm truncate ${c.unreadCount ? 'font-black' : 'font-semibold'}`} style={{ color: 'var(--text)' }}>
                        {c.other.name}
                      </span>
                      <span className="text-[11px] shrink-0" style={{ color: c.unreadCount ? '#10B981' : 'var(--text-muted)' }}>
                        {shortWhen(c.lastMessageAt)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2 mt-0.5">
                      <span className={`text-xs truncate ${c.unreadCount ? 'font-semibold' : ''}`} style={{ color: c.unreadCount ? 'var(--text)' : 'var(--text-muted)' }}>
                        {c.lastFromMe ? 'Vous : ' : ''}{c.lastPreview}
                      </span>
                      {c.unreadCount > 0 && (
                        <span className="shrink-0 min-w-[20px] h-5 px-1.5 rounded-full bg-emerald-500 text-white text-[11px] font-bold flex items-center justify-center">
                          {c.unreadCount > 99 ? '99+' : c.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              ))
            )
          ) : loadingContacts && contacts.length === 0 ? (
            <ListSkeleton />
          ) : groupedContacts.length === 0 ? (
            <EmptyList
              title={debounced ? 'Aucune personne trouvée' : 'Personne à qui écrire'}
              hint={debounced ? 'Vérifiez l’orthographe du nom.' : 'Aucun contact n’est disponible pour votre profil.'}
            />
          ) : (
            groupedContacts.map((g) => (
              <div key={g.role} className="mb-2">
                <div className="px-3 pt-3 pb-1.5 text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
                  {ROLE_META[g.role].section}
                </div>
                {g.items.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => void startWith(c)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors hover:bg-black/5 dark:hover:bg-white/5"
                  >
                    <Avatar id={c.id} name={c.name} photoUrl={c.photoUrl} size={38} />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold truncate" style={{ color: 'var(--text)' }}>{c.name}</div>
                      <div className="flex items-center gap-2 mt-0.5 min-w-0">
                        <RoleBadge role={c.role} />
                        {c.department && (
                          <span className="text-[11px] truncate" style={{ color: 'var(--text-muted)' }}>{c.department}</span>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            ))
          )}
        </div>
      </aside>

      {/* ───────────── Fil de discussion ───────────── */}
      <section className={`${activeId ? 'flex' : 'hidden md:flex'} flex-1 min-w-0 flex-col`}>
        {!activeId || !other ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 gap-3">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: 'var(--brand-soft)' }}>
              <MessageCircle size={30} className="text-emerald-500" />
            </div>
            <h2 className="text-base font-bold" style={{ color: 'var(--text)' }}>Vos messages</h2>
            <p className="text-sm max-w-xs" style={{ color: 'var(--text-muted)' }}>
              Sélectionnez une discussion ou démarrez-en une nouvelle. Vos échanges sont privés : seuls vous et votre interlocuteur les voient.
            </p>
            {error && <p className="text-xs text-red-500">{error}</p>}
          </div>
        ) : (
          <>
            <header className="flex items-center gap-3 px-4 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
              <button
                onClick={closeConversation}
                className="md:hidden p-2 -ml-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5"
                style={{ color: 'var(--text)' }}
                aria-label="Retour"
              >
                <ArrowLeft size={20} />
              </button>
              <Avatar id={other.id} name={other.name} photoUrl={other.photoUrl} size={40} />
              <div className="min-w-0">
                <div className="text-sm font-bold truncate" style={{ color: 'var(--text)' }}>{other.name}</div>
                <div className="flex items-center gap-2 mt-0.5 min-w-0">
                  <RoleBadge role={other.role} />
                  {other.department && <span className="text-[11px] truncate" style={{ color: 'var(--text-muted)' }}>{other.department}</span>}
                </div>
              </div>
            </header>

            <div className="relative flex-1 min-h-0">
              <div ref={scrollRef} onScroll={onScroll} className="absolute inset-0 overflow-y-auto custom-scrollbar px-4 py-4">
                {loadingThread && messages.length === 0 ? (
                  <div className="h-full flex items-center justify-center">
                    <Loader2 className="animate-spin text-emerald-500" />
                  </div>
                ) : (
                  <>
                    {hasMore && (
                      <div className="flex justify-center mb-3">
                        <button
                          onClick={() => void loadOlder()}
                          disabled={loadingOlder}
                          className="text-xs font-semibold px-3 py-1.5 rounded-full transition-colors hover:bg-black/5 dark:hover:bg-white/5"
                          style={{ color: 'var(--text-muted)', border: '1px solid var(--border)' }}
                        >
                          {loadingOlder ? 'Chargement…' : 'Messages précédents'}
                        </button>
                      </div>
                    )}
                    {messages.length === 0 && !loadingThread && (
                      <p className="text-center text-sm mt-10" style={{ color: 'var(--text-muted)' }}>
                        Écrivez votre premier message à {other.name.split(' ')[0]}.
                      </p>
                    )}
                    {messages.map((m, i) => {
                      const prev = messages[i - 1];
                      const newDay = !prev || dayKey(prev.createdAt) !== dayKey(m.createdAt);
                      const grouped = prev && !newDay && prev.mine === m.mine;
                      const nextMsg = messages[i + 1];
                      const lastOfSeries = !nextMsg || nextMsg.mine !== m.mine || dayKey(nextMsg.createdAt) !== dayKey(m.createdAt);
                      return (
                        <React.Fragment key={m.id}>
                          {newDay && (
                            <div className="flex justify-center my-3">
                              <span className="text-[11px] font-semibold px-3 py-1 rounded-full capitalize" style={{ background: 'var(--surface-2)', color: 'var(--text-muted)' }}>
                                {dayLabel(m.createdAt)}
                              </span>
                            </div>
                          )}
                          <div className={`flex ${m.mine ? 'justify-end' : 'justify-start items-end gap-2'} ${grouped ? 'mt-0.5' : 'mt-2.5'}`}>
                            {!m.mine && (
                              lastOfSeries
                                ? <Avatar id={other.id} name={other.name} photoUrl={other.photoUrl} size={28} />
                                : <div className="w-7 shrink-0" />
                            )}
                            <div
                              className={`max-w-[82%] sm:max-w-[70%] px-3.5 py-2 text-sm rounded-2xl ${m.mine ? 'rounded-br-md text-white' : 'rounded-bl-md'} ${m.status === 'sending' ? 'opacity-70' : ''}`}
                              style={m.mine ? { background: m.status === 'failed' ? '#EF4444' : '#10B981' } : { background: 'var(--surface-2)', color: 'var(--text)' }}
                            >
                              <div className="whitespace-pre-wrap break-words">{m.body}</div>
                              <div className={`flex items-center justify-end gap-2 mt-1 text-[10px] ${m.mine ? 'text-white/80' : ''}`} style={m.mine ? undefined : { color: 'var(--text-muted)' }}>
                                {m.status === 'failed' ? (
                                  <button onClick={() => retry(m)} className="inline-flex items-center gap-1 font-bold underline">
                                    <RotateCcw size={10} /> Échec — réessayer
                                  </button>
                                ) : m.status === 'sending' ? (
                                  <span>Envoi…</span>
                                ) : (
                                  <span>{timeOf(m.createdAt)}</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </React.Fragment>
                      );
                    })}
                  </>
                )}
              </div>

              {unseen && (
                <button
                  onClick={scrollToBottom}
                  className="absolute bottom-3 left-1/2 -translate-x-1/2 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-bold text-white bg-emerald-500 shadow-lg"
                >
                  <ArrowDown size={14} /> Nouveau message
                </button>
              )}
            </div>

            {error && (
              <div className="mx-4 mb-2 px-3 py-2 rounded-lg text-xs font-medium text-red-600 bg-red-50 dark:bg-red-500/10 dark:text-red-300 flex items-center justify-between gap-2">
                <span>{error}</span>
                <button onClick={() => setError(null)} aria-label="Fermer"><X size={14} /></button>
              </div>
            )}

            <footer className="p-3" style={{ borderTop: '1px solid var(--border)' }}>
              <div className="flex items-end gap-2">
                <textarea
                  ref={textareaRef}
                  value={draft}
                  onChange={onDraftChange}
                  onKeyDown={onKeyDown}
                  rows={1}
                  maxLength={MAX_MESSAGE_LENGTH}
                  placeholder="Écrire un message…"
                  className="flex-1 resize-none rounded-xl px-3.5 py-2.5 text-sm outline-none max-h-[140px]"
                  style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text)' }}
                />
                <button
                  onClick={send}
                  disabled={!draft.trim()}
                  className="shrink-0 w-11 h-11 rounded-xl flex items-center justify-center text-white bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 disabled:hover:bg-emerald-500 transition-colors"
                  aria-label="Envoyer"
                >
                  <SendHorizontal size={18} />
                </button>
              </div>
              {draft.length > MAX_MESSAGE_LENGTH - 200 && (
                <p className="text-[10px] text-right mt-1" style={{ color: 'var(--text-muted)' }}>
                  {draft.length}/{MAX_MESSAGE_LENGTH}
                </p>
              )}
            </footer>
          </>
        )}
      </section>
    </div>
  );
}

// ─── Petits composants ───────────────────────────────────────────────────────
function ListSkeleton() {
  return (
    <div className="space-y-1 px-1 pt-1">
      {[0, 1, 2, 3, 4].map((i) => (
        <div key={i} className="flex items-center gap-3 px-3 py-3 animate-pulse">
          <div className="w-10 h-10 rounded-full" style={{ background: 'var(--border)' }} />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-1/2 rounded" style={{ background: 'var(--border)' }} />
            <div className="h-3 w-3/4 rounded" style={{ background: 'var(--border)' }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyList({ title, hint }: { title: string; hint: string }) {
  return (
    <div className="text-center px-6 py-12">
      <p className="text-sm font-bold" style={{ color: 'var(--text)' }}>{title}</p>
      <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{hint}</p>
    </div>
  );
}