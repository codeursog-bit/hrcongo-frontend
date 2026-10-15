'use client';

// components/portfolio/usePortfolioAlerts.ts
// Compteurs d'alerte de la sidebar du portefeuille :
//   • requests : demandes en attente, toutes entreprises (congés + absences + prêts/avances)
//   • avis     : avis à donner, toutes entreprises (boîte /approvals/inbox/all),
//                uniquement si l'utilisateur est titulaire d'une fonction d'avis
// (les messages non lus viennent de useChatUnread, côté sidebar)
//
// Même cadence que la sidebar principale : au chargement, à chaque navigation
// (anti-spam 15 s), toutes les 60 s, au retour sur l'onglet, et tout de suite
// quand une demande/un avis vient d'être traité. Échec silencieux → pas d'alerte.

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { api } from '@/services/api';
import { REQUESTS_CHANGED_EVENT } from './requests';

const readCount = (res: any): number => {
  if (typeof res === 'number') return res;
  if (Array.isArray(res)) return res.length;
  if (Array.isArray(res?.items)) return res.items.length;
  const n = res?.total ?? res?.count ?? res?.pending ?? res?.pendingCount ?? 0;
  return Number.isFinite(Number(n)) ? Number(n) : 0;
};

export function usePortfolioAlerts() {
  const pathname = usePathname();
  const [requests, setRequests] = useState(0);
  const [avis, setAvis] = useState(0);
  const lastRefreshRef = useRef(0);
  // Titulaire d'une fonction d'avis ? (même règle que components/layout/Sidebar.tsx)
  // Sans fonction, on ne sonde pas la boîte d'avis : pas d'appel inutile ni de bruit console.
  const hasApprovalFunctionRef = useRef(false);
  const meRequestedRef = useRef(false);
  const refreshRef = useRef<(force?: boolean | Event) => void>(() => {});

  useEffect(() => {
    let cancelled = false;

    const refresh = (force?: boolean | Event) => {
      if (force !== true) {
        if (typeof document !== 'undefined' && document.hidden) return;
        const now = Date.now();
        if (now - lastRefreshRef.current < 15000) return;
      }
      lastRefreshRef.current = Date.now();

      api.get<any>('/portfolio/stats')
        .then((s) => {
          if (cancelled) return;
          const p = s?.pendingRequests ?? {};
          setRequests((p.leaves || 0) + (p.absences || 0) + (p.loans || 0));
        })
        .catch(() => {});

      if (hasApprovalFunctionRef.current) {
        api.get<any>('/approvals/inbox/all')
          .then((res) => { if (!cancelled) setAvis(readCount(res)); })
          .catch(() => {});
      } else if (!cancelled) {
        setAvis(0);
      }
    };
    refreshRef.current = refresh;

    // Une seule fois : l'utilisateur a-t-il une fonction d'avis (sa propre entreprise ou une autre) ?
    if (!meRequestedRef.current) {
      meRequestedRef.current = true;
      api.get<{ functions?: unknown[]; externalCompanies?: unknown[] }>('/approvals/me')
        .then((me) => {
          hasApprovalFunctionRef.current = (me?.functions?.length ?? 0) > 0 || (me?.externalCompanies?.length ?? 0) > 0;
          if (hasApprovalFunctionRef.current) refreshRef.current(true);
        })
        .catch(() => {});
    }

    const onChanged = () => refresh(true);
    const onFocus = () => refresh();

    refresh();
    const timer = setInterval(() => refresh(), 60000);
    window.addEventListener('focus', onFocus);
    window.addEventListener(REQUESTS_CHANGED_EVENT, onChanged);
    window.addEventListener('konza:avis-changed', onChanged);
    return () => {
      cancelled = true;
      clearInterval(timer);
      window.removeEventListener('focus', onFocus);
      window.removeEventListener(REQUESTS_CHANGED_EVENT, onChanged);
      window.removeEventListener('konza:avis-changed', onChanged);
    };
  }, [pathname]);

  return { requests, avis };
}