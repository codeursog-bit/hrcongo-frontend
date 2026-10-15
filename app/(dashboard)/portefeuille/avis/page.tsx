'use client';

// app/(dashboard)/portefeuille/avis/page.tsx
// « Avis à donner » de l'espace portefeuille : boîte multi-entreprises
// (/approvals/inbox/all). Chaque ligne indique l'entreprise concernée et l'avis
// se donne directement dessus (ApprovalPanel reçoit le companyId).

import AvisInbox from '@/components/approvals/AvisInbox';

export default function PortfolioAvisPage() {
  return <AvisInbox />;
}