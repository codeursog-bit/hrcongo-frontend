'use client';

// ============================================================================
// 📁 hooks/useDocSignatures.ts — LOT D
// Charge les avis/signatures d'une demande (prêt, avance, absence) pour remplir
// les cases de signature des documents imprimables.
// Échec silencieux (backend ancien, pas d'accès, pas d'avis…) → liste vide →
// le document s'imprime EXACTEMENT comme avant (cachet entreprise).
// ============================================================================

import { useEffect, useState } from 'react';
import { approvalsApi, ApprovalKind, DocumentSignature } from '@/services/approvals';

export function useDocSignatures(
  kind: ApprovalKind | null | undefined,
  id: string | null | undefined,
): DocumentSignature[] {
  const [signatures, setSignatures] = useState<DocumentSignature[]>([]);

  useEffect(() => {
    let cancelled = false;
    setSignatures([]);
    if (!kind || !id) return;
    approvalsApi
      .getSignatures(kind, id)
      .then((r) => { if (!cancelled) setSignatures(r?.signatures ?? []); })
      .catch(() => { /* silencieux */ });
    return () => { cancelled = true; };
  }, [kind, id]);

  return signatures;
}
