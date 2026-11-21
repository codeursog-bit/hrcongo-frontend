'use client';

// app/(dashboard)/portefeuille/messages/page.tsx
// Messagerie interne dans l'espace portefeuille (le ChatProvider est monté par
// portefeuille/layout.tsx). Deux vues :
//  • « Entreprise active » : le chat habituel (inchangé) ;
//  • « Toutes mes entreprises » : boîte commune à tout le portefeuille.
// Suspense obligatoire : ChatPage lit useSearchParams().

import { Suspense, useState } from 'react';
import MessagesWorkspace from '@/components/support/MessagesWorkspace';
import PortfolioInbox from '@/components/chat/PortfolioInbox';

export default function PortfolioMessagesPage() {
  const [tab, setTab] = useState<'active' | 'all'>('active');
  const [unreadAll, setUnreadAll] = useState(0);

  const tabCls = (on: boolean) =>
    `rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${on ? 'bg-[var(--brand-strong)] text-white' : 'bg-[var(--surface-2)] hover:opacity-80'}`;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <button type="button" className={tabCls(tab === 'active')} style={tab === 'active' ? undefined : { color: 'var(--text)' }} onClick={() => setTab('active')}>
          Entreprise active
        </button>
        <button type="button" className={tabCls(tab === 'all')} style={tab === 'all' ? undefined : { color: 'var(--text)' }} onClick={() => setTab('all')}>
          Toutes mes entreprises
          {unreadAll > 0 && (
            <span className="ml-2 rounded-full bg-[var(--brand-strong)] px-1.5 text-[11px] font-semibold text-white" style={tab === 'all' ? { background: 'rgba(255,255,255,.25)' } : undefined}>
              {unreadAll}
            </span>
          )}
        </button>
      </div>
      {/* Les deux vues restent montées : la boîte portefeuille continue de compter les non-lus (badge de l'onglet). */}
      <div className={tab === 'active' ? '' : 'hidden'}>
        <Suspense fallback={null}>
          <MessagesWorkspace />
        </Suspense>
      </div>
      <div className={tab === 'all' ? '' : 'hidden'}>
        <PortfolioInbox onUnread={setUnreadAll} />
      </div>
    </div>
  );
}