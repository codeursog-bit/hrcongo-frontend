'use client';

// ============================================================================
// 📁 components/chat/ChatProvider.tsx — le moteur du "faux temps réel"
// ----------------------------------------------------------------------------
// UNE SEULE boucle de poll pour toute l'application (badge de la sidebar +
// page de chat). Elle est conçue pour coûter presque rien :
//
//  • Le serveur répond { changed:false } SANS requête SQL tant qu'il n'y a rien
//    de nouveau (voir ChatSignalService côté backend).
//  • Onglet masqué → AUCUN poll (visibilitychange). Retour → poll immédiat.
//  • Cadence adaptative selon ce que fait la personne :
//        conversation ouverte ........ 3 s
//        liste des discussions ....... 6 s
//        ailleurs dans l'app ......... 30 s (juste le badge)
//    …et elle RALENTIT toute seule quand il ne se passe rien (×2 après 1 min,
//    ×4 après 5 min). Un message reçu / envoyé la remet immédiatement au max.
//  • Jitter ±10 % (évite que 200 onglets tapent le serveur à la même seconde),
//    backoff exponentiel en cas d'erreur, arrêt net sur 401/403.
//  • Rien n'est monté si le rôle n'a pas accès au chat.
// ============================================================================

import React, {
  createContext, useCallback, useContext, useEffect, useMemo, useRef, useState,
} from 'react';
import { authService } from '@/lib/services/authService';
import { CHAT_ROLES, chatApi } from '@/services/chat-api';

export type ChatFocus = 'off' | 'list' | 'conversation';

export interface ChatChange {
  tick: number;
  conversationIds: string[];
}

interface ChatContextValue {
  enabled: boolean;
  unreadTotal: number;
  /** change à chaque fois que le serveur signale du nouveau */
  lastChange: ChatChange;
  /** la page de chat déclare ce que l'utilisateur regarde → règle la cadence */
  setFocus: (f: ChatFocus) => void;
  /** à appeler après un envoi : repasse la cadence au maximum un moment */
  pokeActivity: () => void;
  /** déclenche un poll tout de suite (ex. après une action) */
  pollNow: () => void;
}

const BASE_DELAY: Record<ChatFocus, number> = { conversation: 3_000, list: 6_000, off: 30_000 };
const MAX_DELAY = 45_000;
const MAX_ERROR_DELAY = 60_000;

const noop = () => {};
const DEFAULT: ChatContextValue = {
  enabled: false,
  unreadTotal: 0,
  lastChange: { tick: 0, conversationIds: [] },
  setFocus: noop,
  pokeActivity: noop,
  pollNow: noop,
};

const ChatContext = createContext<ChatContextValue>(DEFAULT);

/** Hook sûr : renvoie des valeurs neutres si aucun Provider n'est monté. */
export const useChat = () => useContext(ChatContext);
export const useChatUnread = () => useContext(ChatContext).unreadTotal;

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [enabled, setEnabled] = useState(false);
  const [unreadTotal, setUnreadTotal] = useState(0);
  const [lastChange, setLastChange] = useState<ChatChange>(DEFAULT.lastChange);

  const focusRef = useRef<ChatFocus>('off');
  const lastActivityRef = useRef(Date.now());
  const versionRef = useRef<string | undefined>(undefined);
  const sinceRef = useRef<string | undefined>(undefined);
  const tickRef = useRef(0);
  const runRef = useRef<() => void>(noop);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Accès au chat ? (lu une fois, depuis la session déjà en localStorage)
  useEffect(() => {
    const u = authService.getCurrentUser();
    setEnabled(!!u && CHAT_ROLES.includes(u.role));
  }, []);

  useEffect(() => {
    if (!enabled) return;

    let stopped = false;
    let errors = 0;
    let inFlight = false;

    const clear = () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = null;
    };

    const nextDelay = () => {
      const idle = Date.now() - lastActivityRef.current;
      const mult = idle < 60_000 ? 1 : idle < 300_000 ? 2 : 4;
      let d = Math.min(BASE_DELAY[focusRef.current] * mult, MAX_DELAY);
      if (errors > 0) d = Math.min(d * 2 ** errors, MAX_ERROR_DELAY);
      return d * (0.9 + Math.random() * 0.2); // jitter ±10 %
    };

    const schedule = (delay: number) => {
      clear();
      if (stopped || document.hidden) return; // onglet masqué : on ne planifie rien
      timerRef.current = setTimeout(run, delay);
    };

    async function run() {
      if (stopped || inFlight || document.hidden || !navigator.onLine) return;
      inFlight = true;
      try {
        const res = await chatApi.poll(versionRef.current, sinceRef.current);
        errors = 0;
        versionRef.current = res.v;
        if (res.changed) {
          sinceRef.current = res.serverTime;
          lastActivityRef.current = Date.now(); // du nouveau → cadence rapide
          setUnreadTotal(res.unreadTotal ?? 0);
          tickRef.current += 1;
          setLastChange({
            tick: tickRef.current,
            conversationIds: (res.conversations ?? []).map((c) => c.id),
          });
        }
      } catch (e: any) {
        if (e?.status === 401 || e?.status === 403 || e?.status === 404) {
          stopped = true; // pas d'accès (ou session expirée) : on arrête, pas de boucle d'erreurs
          return;
        }
        errors = Math.min(errors + 1, 5);
      } finally {
        inFlight = false;
      }
      schedule(nextDelay());
    }
    runRef.current = () => { clear(); void run(); };

    const onVisibility = () => {
      if (document.hidden) {
        clear();
        void chatApi.away(); // le serveur peut de nouveau envoyer des push hors-app
      } else {
        void run(); // retour sur l'onglet : on se met à jour tout de suite
      }
    };
    const onOnline = () => void run();

    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('online', onOnline);
    void run(); // premier poll immédiat

    return () => {
      stopped = true;
      clear();
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('online', onOnline);
    };
  }, [enabled]);

  const setFocus = useCallback((f: ChatFocus) => {
    if (focusRef.current === f) return;
    focusRef.current = f;
    lastActivityRef.current = Date.now();
    if (f !== 'off') runRef.current(); // on arrive sur le chat → rafraîchit tout de suite
  }, []);

  const pokeActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
    // l'autre personne répond souvent dans les secondes qui suivent : poll rapproché
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => runRef.current(), 1_500);
    }
  }, []);

  const pollNow = useCallback(() => runRef.current(), []);

  const value = useMemo<ChatContextValue>(
    () => ({ enabled, unreadTotal, lastChange, setFocus, pokeActivity, pollNow }),
    [enabled, unreadTotal, lastChange, setFocus, pokeActivity, pollNow],
  );

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}