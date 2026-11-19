'use client';

// ============================================================================
// 📁 app/(dashboard)/avis/page.tsx — LOT B
// « Avis à donner » : la logique vit dans components/approvals/AvisInbox.tsx
// (partagée avec /portefeuille/avis).
// ============================================================================

import AvisInbox from '@/components/approvals/AvisInbox';
import { ModulePageFrame } from '@/components/requests/ModulePageFrame';

function AvisPage() {
  return <AvisInbox />;
}


export default function AvisPageWithFrame() {
  return (
    <ModulePageFrame kind="list">
      <AvisPage />
    </ModulePageFrame>
  );
}
