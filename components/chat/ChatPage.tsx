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
  ArrowDown, ArrowLeft, Check, CheckCheck, Loader2, MessageCircle, PenSquare, RotateCcw, Search, SendHorizontal, X,
} from 'lucide-react';
import { Badge, Button as DesignButton, EmptyState } from '@/components/design-system/primitives';
import {
  ChatContact, ChatConversation, ChatMessage, ChatPeer, ChatRole, MAX_MESSAGE_LENGTH, chatApi,
} from '@/services/chat-api';
import { useChat } from './ChatProvider';

// ─── Présentation ────────────────────────────────────────────────────────────
const ROLE_META: Record<ChatRole, { label: string; section: string }> = {
  ADMIN:      { label: 'Admin',      section: 'Administration' },
  HR_MANAGER: { label: 'Manager RH', section: 'Ressources humaines' },
  MANAGER:    { label: 'Manager',    section: 'Managers' },
  EMPLOYEE:   { label: 'Employé',   section: 'Employés' },
};
const SECTION_ORDER: ChatRole[] = ['ADMIN', 'HR_MANAGER', 'MANAGER', 'EMPLOYEE'];

const initials = (name: string) =>
  name.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase() ?? '').join('') || '?';

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
// ─── Accusés façon WhatsApp : ✓ envoyé · ✓✓ reçu · ✓✓ lu ─────────────────────
type Receipt = 'sent' | 'delivered' | 'read';
const NO_PEER: ChatPeer = { deliveredAt: null, readAt: null };

/** Fusionne deux états d'accusés : on ne recule jamais (un message lu ne redevient pas « reçu »). */
function mergePeer(a: ChatPeer, b: ChatPeer): ChatPeer {
  const max = (x: string | null, y: string | null) => (x && y ? (Date.parse(x) >= Date.parse(y) ? x : y) : x ?? y);
  const next = { deliveredAt: max(a.deliveredAt, b.deliveredAt), readAt: max(a.readAt, b.readAt) };
  return next.deliveredAt === a.deliveredAt && next.readAt === a.readAt ? a : next; // même objet = pas de re-rendu
}

function receiptOf(createdAt: string, peer: ChatPeer): Receipt {
  const t = Date.parse(createdAt);
  if (peer.readAt && Date.parse(peer.readAt) >= t) return 'read';
  if (peer.deliveredAt && Date.parse(peer.deliveredAt) >= t) return 'delivered';
  return 'sent';
}

function Ticks({ status, onBubble = false }: { status: Receipt; onBubble?: boolean }) {
  const label = status === 'read' ? 'Lu' : status === 'delivered' ? 'Reçu' : 'Envoyé';
  // Sur la bulle verte : blanc translucide (envoyé / reçu) → blanc plein + gras (lu).
  // Dans la liste (fond clair/sombre) : gris (envoyé / reçu) → vert (lu).
  const color = onBubble
    ? status === 'read' ? '#FFFFFF' : 'rgba(255,255,255,0.6)'
    : status === 'read' ? 'var(--success-text)' : 'var(--text-muted)';
  const Icon = status === 'sent' ? Check : CheckCheck;
  return (
    <span title={label} aria-label={label} className="inline-flex shrink-0">
      <Icon size={onBubble ? 14 : 13} strokeWidth={status === 'read' ? 3 : 2.25} style={{ color }} />
    </span>
  );
}

function normalize(list: ChatMessage[]): ChatMessage[] {
  const seen = new Set<string>();
  const uniq = list.filter((m) => (seen.has(m.id) ? false : (seen.add(m.id), true)));
  const confirmed = uniq.filter((m) => !m.status).sort((a, b) => a.seq - b.seq);
  const pending = uniq.filter((m) => !!m.status);
  return [...confirmed, ...pending];
}

function Avatar({ name, photoUrl, size = 40 }: { name: string; photoUrl?: string | null; size?: number }) {
  const [failed, setFailed] = useState(false);
  const showPhoto = !!photoUrl && !failed;
  return (
    <div
      className="flex shrink-0 select-none items-center justify-center overflow-hidden rounded-full font-semibold text-[var(--brand-strong)]"
      style={{ width: size, height: size, background: 'var(--brand-soft)', fontSize: size * 0.36 }}
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
  return <Badge tone="neutral">{ROLE_META[role].label}</Badge>;
}

// ─── Hauteur : la messagerie remplit EXACTEMENT l'espace visible ─────────────
// Avant : calc(100dvh - 8.5rem) en dur → trop court sur mobile (grand vide sous
// la zone de saisie) et faux dès que la barre du navigateur / le clavier bouge.
// Ici on mesure : haut du bloc (dans la zone scrollable du dashboard) → bas de
// l'écran visible (visualViewport = tient compte du clavier). Sur mobile le bloc
// est plein écran (sans marge basse) ; dès `sm` on garde la carte arrondie.
function useFillHeight(ref: React.RefObject<HTMLElement | null>) {
  const [height, setHeight] = useState<number | null>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const scroller = (el.closest('main') as HTMLElement | null) ?? null;

    const measure = () => {
      const vv = window.visualViewport;
      const viewportH = vv?.height ?? window.innerHeight;
      const viewportTop = vv?.offsetTop ?? 0;
      // position du bloc dans la page, indépendante du scroll courant de <main>
      const top = el.getBoundingClientRect().top + (scroller?.scrollTop ?? 0);
      const isPhone = window.matchMedia('(max-width: 639px)').matches;
      const bottomGap = isPhone
        ? 0
        : scroller
          ? parseFloat(getComputedStyle(scroller).paddingBottom) || 0
          : 0;
      const next = Math.floor(viewportH + viewportTop - top - bottomGap);
      setHeight(Math.max(320, next));
    };

    measure();
    const vv = window.visualViewport;
    window.addEventListener('resize', measure);
    window.addEventListener('orientationchange', measure);
    vv?.addEventListener('resize', measure);
    return () => {
      window.removeEventListener('resize', measure);
      window.removeEventListener('orientationchange', measure);
      vv?.removeEventListener('resize', measure);
    };
  }, [ref]);

  return height;
}

// ─── Page ────────────────────────────────────────────────────────────────────
export default function ChatPage() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const { lastChange, setFocus, pokeActivity } = useChat();
  const rootRef = useRef<HTMLDivElement>(null);
  const fillHeight = useFillHeight(rootRef);

  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [listError, setListError] = useState(false);
  // 🆕 ?new=1 (lien « Contacter l'administration ») : on arrive directement sur la liste des contacts
  const [mode, setMode] = useState<'chats' | 'contacts'>(params.get('new') === '1' ? 'contacts' : 'chats');
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [contacts, setContacts] = useState<ChatContact[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [contactsError, setContactsError] = useState(false);
  const [contactsAttempt, setContactsAttempt] = useState(0);

  const [activeId, setActiveId] = useState<string | null>(params.get('c'));
  const [activeOther, setActiveOther] = useState<ChatContact | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [loadingThread, setLoadingThread] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  // 🆕 ?draft=… (lien « Contacter l'administration ») : message pré-rempli, jamais envoyé automatiquement
  const [draft, setDraft] = useState(() => (params.get('draft') ?? '').slice(0, MAX_MESSAGE_LENGTH));
  const [error, setError] = useState<string | null>(null);
  const [unseen, setUnseen] = useState(false);
  const [peer, setPeer] = useState<ChatPeer>(NO_PEER); // accusés de l'autre personne (conversation ouverte)

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
      setListError(false);
    } catch {
      setListError(true);
    } finally {
      setLoadingList(false);
    }
  }, []);
  useEffect(() => { void loadConversations(); }, [loadConversations]);

  // ── Lien « Contacter l'administration » (ContactAdminButton) ───────────────
  // ?draft=… / ?new=1 sont lus à l'ouverture (états initiaux ci-dessus) puis retirés
  // de l'URL pour ne pas se rejouer au rafraîchissement ; ?c=… est conservé.
  const draftFromLinkRef = useRef(!!params.get('draft'));
  useEffect(() => {
    if (!params.get('draft') && !params.get('new')) return;
    const c = params.get('c');
    router.replace(c ? `${pathname}?c=${c}` : pathname, { scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  // Message pré-rempli : une seule fois, dès que la zone de saisie est affichée
  // (conversation ouverte) → hauteur du champ ajustée, curseur placé en fin de texte.
  useLayoutEffect(() => {
    const el = textareaRef.current;
    if (!el || !draftFromLinkRef.current || !draft) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 140)}px`;
    el.focus();
    el.setSelectionRange(el.value.length, el.value.length);
    draftFromLinkRef.current = false;
  }, [activeId, loadingThread, draft]);

  // ── Recherche (anti-rebond) ────────────────────────────────────────────────
  useEffect(() => {
    const t = setTimeout(() => setDebounced(search.trim()), 250);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    if (mode !== 'contacts') return;
    let cancelled = false;
    setLoadingContacts(true);
    setContactsError(false);
    chatApi
      .contacts(debounced || undefined)
      .then((r) => { if (!cancelled) { setContacts(r); setContactsError(false); } })
      .catch(() => { if (!cancelled) { setContacts([]); setContactsError(true); } })
      .finally(() => { if (!cancelled) setLoadingContacts(false); });
    return () => { cancelled = true; };
  }, [mode, debounced, contactsAttempt]);

  // ── Ouverture d'une conversation ───────────────────────────────────────────
  const markReadLocal = useCallback((id: string) => {
    setConversations((prev) => prev.map((c) => (c.id === id && c.unreadCount ? { ...c, unreadCount: 0 } : c)));
  }, []);

  useEffect(() => {
    activeIdRef.current = activeId;
    setMessages([]);
    setPeer(NO_PEER);
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
        if (res.peer) setPeer((p) => mergePeer(p, res.peer!));
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
      if (activeIdRef.current !== id) return;
      if (res.peer) setPeer((p) => mergePeer(p, res.peer!));
      if (!res.messages.length) return;
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
    // Accusés (reçu / lu) envoyés par le poll : on les applique à la conversation ouverte, sans requête en plus
    const rc = id ? lastChange.receipts.find((r) => r.conversationId === id) : undefined;
    if (rc) setPeer((p) => mergePeer(p, rc));
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
          ? { ...cur, lastMessageAt: now, lastPreview: body.replace(/\s+/g, ' ').slice(0, 80), lastFromMe: true, lastStatus: 'sent', unreadCount: 0 }
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
      ref={rootRef}
      className="flex -mx-4 -mt-4 -mb-4 h-[calc(100dvh-5rem)] overflow-hidden rounded-none sm:mx-0 sm:my-0 sm:h-[calc(100dvh-8.5rem)] sm:rounded-[var(--radius-card)] sm:shadow-[var(--shadow-card)]"
      style={{
        background: 'var(--surface)',
        ...(fillHeight ? { height: fillHeight } : {}),
      }}
    >
      {/* ───────────── Panneau gauche ───────────── */}
      <aside
        className={`${activeId ? 'hidden md:flex' : 'flex'} w-full md:w-[340px] md:shrink-0 flex-col`}
        style={{ borderRight: '1px solid var(--border)' }}
      >
        <div className="p-4 pb-3 flex items-center justify-between gap-2">
          <h1 className="text-lg font-semibold" style={{ color: 'var(--text)' }}>
            {mode === 'contacts' ? 'Nouveau message' : 'Messages'}
          </h1>
          {mode === 'chats' ? (
            <DesignButton
              onClick={() => { setMode('contacts'); setSearch(''); }}
              className="!min-h-0 !px-3 !py-2 !text-xs"
            >
              <PenSquare size={14} strokeWidth={1.5} /> Nouveau
            </DesignButton>
          ) : (
            <DesignButton
              variant="ghost"
              onClick={() => { setMode('chats'); setSearch(''); }}
              className="!min-h-0 !p-2"
              style={{ color: 'var(--text-muted)' }}
              aria-label="Retour aux discussions"
            >
              <X size={18} strokeWidth={1.5} />
            </DesignButton>
          )}
        </div>

        <div className="px-4 pb-3">
          <div
            className="flex items-center gap-2 rounded-xl bg-[var(--surface-2)] px-3 py-2.5 focus-within:ring-2 focus-within:ring-[var(--brand-soft)]"
          >
            <Search size={16} strokeWidth={1.5} style={{ color: 'var(--text-muted)' }} aria-hidden="true" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={mode === 'contacts' ? 'Rechercher une personne…' : 'Rechercher une discussion…'}
              aria-label={mode === 'contacts' ? 'Rechercher une personne' : 'Rechercher une discussion'}
              maxLength={60}
              className="flex-1 bg-transparent outline-none text-base sm:text-sm min-w-0"
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
            ) : listError && conversations.length === 0 ? (
              <EmptyList
                title="Impossible de charger les discussions"
                hint="Vérifiez votre connexion, puis réessayez."
                action={<DesignButton variant="secondary" onClick={() => void loadConversations()}>Réessayer</DesignButton>}
              />
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
                  className="w-full flex items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors hover:bg-[var(--surface-2)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--focus)]"
                  style={c.id === activeId ? { background: 'var(--brand-soft)' } : undefined}
                >
                  <Avatar name={c.other.name} photoUrl={c.other.photoUrl} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className={`truncate text-sm ${c.unreadCount ? 'font-semibold' : 'font-medium'}`} style={{ color: 'var(--text)' }}>
                        {c.other.name}
                      </span>
                      <span className="shrink-0 text-[11px]" style={{ color: c.unreadCount ? 'var(--success-text)' : 'var(--text-muted)' }}>
                        {shortWhen(c.lastMessageAt)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2 mt-0.5">
                      <span className={`text-xs truncate ${c.unreadCount ? 'font-semibold' : ''}`} style={{ color: c.unreadCount ? 'var(--text)' : 'var(--text-muted)' }}>
                        {c.lastFromMe && <span className="inline-flex align-middle mr-1"><Ticks status={c.lastStatus ?? 'sent'} /></span>}{c.lastFromMe ? 'Vous : ' : ''}{c.lastPreview}
                      </span>
                      {c.unreadCount > 0 && (
                        <span className="flex h-5 min-w-[20px] shrink-0 items-center justify-center rounded-full bg-[var(--brand-strong)] px-1.5 text-[11px] font-semibold text-[var(--on-brand)]">
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
          ) : contactsError ? (
            <EmptyList
              title="Impossible de charger les contacts"
              hint="Vérifiez votre connexion, puis réessayez."
              action={<DesignButton variant="secondary" onClick={() => setContactsAttempt((attempt) => attempt + 1)}>Réessayer</DesignButton>}
            />
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
                    className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-[var(--surface-2)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--focus)]"
                  >
                    <Avatar name={c.name} photoUrl={c.photoUrl} size={38} />
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
            <EmptyState icon={MessageCircle} title="Vos messages">
              Sélectionnez une discussion ou démarrez-en une nouvelle. Vos échanges sont privés : seuls vous et votre interlocuteur les voient.
            </EmptyState>
            {error && <p className="text-xs text-red-500">{error}</p>}
          </div>
        ) : (
          <>
            <header className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 sm:py-3 shrink-0" style={{ borderBottom: '1px solid var(--border)' }}>
              <button
                onClick={closeConversation}
                className="md:hidden -ml-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg hover:bg-[var(--surface-2)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--focus)]"
                style={{ color: 'var(--text)' }}
                aria-label="Retour"
              >
                <ArrowLeft size={20} strokeWidth={1.5} />
              </button>
              <Avatar name={other.name} photoUrl={other.photoUrl} size={40} />
              <div className="min-w-0 flex-1">
                <div className="text-sm font-bold truncate" style={{ color: 'var(--text)' }}>{other.name}</div>
                <div className="flex items-center gap-2 mt-0.5 min-w-0">
                  <RoleBadge role={other.role} />
                  {other.department && <span className="text-[11px] truncate" style={{ color: 'var(--text-muted)' }}>{other.department}</span>}
                </div>
              </div>
            </header>

            <div className="relative flex-1 min-h-0">
              <div ref={scrollRef} onScroll={onScroll} className="absolute inset-0 overflow-y-auto overscroll-contain custom-scrollbar px-3 sm:px-4 py-3 sm:py-4">
                {loadingThread && messages.length === 0 ? (
                  <div className="h-full flex items-center justify-center">
                    <Loader2 className="animate-spin text-[var(--brand-strong)]" aria-label="Chargement des messages" />
                  </div>
                ) : (
                  <>
                    {hasMore && (
                      <div className="flex justify-center mb-3">
                        <button
                          onClick={() => void loadOlder()}
                          disabled={loadingOlder}
                          className="rounded-full bg-[var(--surface-2)] px-3 py-1.5 text-xs font-semibold text-[var(--text)] transition-colors hover:bg-[var(--brand-soft)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--focus)]"
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
                                ? <Avatar name={other.name} photoUrl={other.photoUrl} size={28} />
                                : <div className="w-7 shrink-0" />
                            )}
                            <div
                              className={`max-w-[80%] sm:max-w-[70%] px-3.5 py-2 text-sm rounded-2xl ${m.mine ? 'rounded-br-md text-white' : 'rounded-bl-md'} ${m.status === 'sending' ? 'opacity-70' : ''}`}
                              style={m.mine
                                ? { background: m.status === 'failed' ? 'var(--danger-text)' : 'var(--success-text)' }
                                : { background: 'var(--surface-2)', color: 'var(--text)' }}
                            >
                              <div className="whitespace-pre-wrap break-words">{m.body}</div>
                              <div className={`flex items-center justify-end gap-1.5 mt-1 text-[10px] ${m.mine ? 'text-white/80' : ''}`} style={m.mine ? undefined : { color: 'var(--text-muted)' }}>
                                {m.status === 'failed' ? (
                                  <button onClick={() => retry(m)} className="inline-flex items-center gap-1 font-bold underline">
                                    <RotateCcw size={10} /> Échec — réessayer
                                  </button>
                                ) : m.status === 'sending' ? (
                                  <span>Envoi…</span>
                                ) : (
                                  <>
                                    <span>{timeOf(m.createdAt)}</span>
                                    {m.mine && <Ticks status={receiptOf(m.createdAt, peer)} onBubble />}
                                  </>
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
                  className="absolute bottom-3 left-1/2 inline-flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-[var(--action)] px-3.5 py-2 text-xs font-semibold text-[var(--on-brand)] shadow-[var(--shadow-pop)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--focus)]"
                >
                  <ArrowDown size={14} strokeWidth={1.5} /> Nouveau message
                </button>
              )}
            </div>

            {error && (
              <div className="mx-4 mb-2 flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-xs font-medium"
                style={{ color: 'var(--danger-text)', background: 'color-mix(in srgb, var(--danger) 12%, transparent)' }}>
                <span>{error}</span>
                <button onClick={() => setError(null)} aria-label="Fermer" className="focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--focus)]"><X size={14} strokeWidth={1.5} /></button>
              </div>
            )}

            <footer
              className="shrink-0 px-3 pt-2.5 sm:p-3"
              style={{ borderTop: '1px solid var(--border)', paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
            >
              <div className="flex items-end gap-2">
                <textarea
                  ref={textareaRef}
                  value={draft}
                  onChange={onDraftChange}
                  onKeyDown={onKeyDown}
                  rows={1}
                  maxLength={MAX_MESSAGE_LENGTH}
                  placeholder="Écrire un message…"
                  className="k-input !min-h-0 max-h-[120px] min-w-0 flex-1 resize-none !px-3.5 !py-2.5 text-base outline-none sm:max-h-[140px] sm:text-sm"
                />
                <DesignButton
                  variant="primary"
                  onClick={send}
                  disabled={!draft.trim()}
                  className="!h-11 !w-11 !min-h-0 !shrink-0 !rounded-xl !p-0"
                  aria-label="Envoyer"
                >
                  <SendHorizontal size={18} strokeWidth={1.5} />
                </DesignButton>
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
        <div key={i} className="motion-safe:animate-pulse flex items-center gap-3 px-3 py-3">
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

function EmptyList({ title, hint, action }: { title: string; hint: string; action?: React.ReactNode }) {
  return (
    <EmptyState title={title} icon={MessageCircle} action={action}>
      {hint}
    </EmptyState>
  );
}