'use client';

// app/(dashboard)/messages/page.tsx
// Suspense obligatoire : ChatPage lit useSearchParams() (lien profond ?c=<id> des notifications push).

import { Suspense } from 'react';
import ChatPage from '@/components/chat/ChatPage';

export default function MessagesPage() {
  return (
    <Suspense fallback={null}>
      <ChatPage />
    </Suspense>
  );
}