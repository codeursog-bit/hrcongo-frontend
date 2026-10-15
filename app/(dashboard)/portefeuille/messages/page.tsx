'use client';

// app/(dashboard)/portefeuille/messages/page.tsx
// Messagerie interne dans l'espace portefeuille (le ChatProvider est monté par
// portefeuille/layout.tsx). Suspense obligatoire : ChatPage lit useSearchParams().

import { Suspense } from 'react';
import ChatPage from '@/components/chat/ChatPage';

export default function PortfolioMessagesPage() {
  return (
    <Suspense fallback={null}>
      <ChatPage />
    </Suspense>
  );
}