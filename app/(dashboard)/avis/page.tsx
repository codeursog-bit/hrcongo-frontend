'use client';

// ============================================================================
// 📁 app/(dashboard)/avis/page.tsx — LOT B
// « Avis à donner » : la logique vit dans components/approvals/AvisInbox.tsx
// (partagée avec /portefeuille/avis).
// ============================================================================

import AvisInbox from '@/components/approvals/AvisInbox';

export default function AvisPage() {
  return <AvisInbox />;
}