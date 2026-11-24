'use client';

// ============================================================================
// components/BulletinBatchPrintHidden.tsx
//
// ✅ Impression groupée de bulletins — page /paie.
//    Rendu hors-écran (jamais visible pour l'utilisateur) de N bulletins,
//    chacun via BulletinDisplay — EXACTEMENT le même composant que
//    l'impression à l'unité (paie/[id]) — donc garantie que le bulletin
//    imprimé en masse est identique à celui imprimé un par un (même
//    gabarit choisi en paramètres, mêmes calculs, même logo). Pas de
//    génération séparée côté backend.
//
// Une fois les N payrolls chargés et le DOM rendu, appelle onReady() —
// l'appelant (page paie) lance alors printBulletinBatch() dessus.
// ============================================================================

import React, { useEffect, useRef, useState } from 'react';
import { api } from '@/services/api';
import BulletinDisplay from '@/components/BulletinDisplay';
import type { BulletinPayroll } from '@/types/bulletin-template';

interface Props {
  payrollIds: string[];
  onReady: () => void;
  onError: (message: string) => void;
}

export default function BulletinBatchPrintHidden({ payrollIds, onReady, onError }: Props) {
  const [payrolls, setPayrolls] = useState<BulletinPayroll[] | null>(null);
  const firedRef = useRef(false);

  useEffect(() => {
    firedRef.current = false;
    setPayrolls(null);
    let cancelled = false;

    (async () => {
      try {
        // ✅ Même endpoint que la page de détail (GET /payrolls/:id), un
        // appel par bulletin sélectionné.
        // 🛡️ Au plus 6 appels en vol à la fois. Avant : Promise.all lançait
        // tous les appels d'un coup en comptant sur le navigateur pour les
        // mettre en file — faux en HTTP/2 (tout part en parallèle). Pour 500
        // bulletins, c'étaient 500 requêtes simultanées sur le serveur.
        const results: BulletinPayroll[] = new Array(payrollIds.length);
        let cursor = 0;
        const worker = async () => {
          while (cursor < payrollIds.length && !cancelled) {
            const i = cursor++;
            results[i] = await api.get<BulletinPayroll>(`/payrolls/${payrollIds[i]}`);
          }
        };
        await Promise.all(
          Array.from({ length: Math.min(6, Math.max(payrollIds.length, 1)) }, worker),
        );
        if (!cancelled) setPayrolls(results);
      } catch (e: any) {
        if (!cancelled) onError(e?.message || 'Impossible de charger les bulletins sélectionnés.');
      }
    })();

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [payrollIds.join(',')]);

  // ── Une fois les N bulletins chargés ET montés dans le DOM, laisser le
  // temps aux logos (Cloudinary, cross-origin) de charger avant d'imprimer —
  // même délai de sécurité que downloadBulletinPDF.
  useEffect(() => {
    if (!payrolls || firedRef.current) return;
    firedRef.current = true;
    const t = setTimeout(() => onReady(), 700);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [payrolls]);

  if (!payrolls) return null;

  return (
    <div
      id="bul-batch-root"
      style={{ position: 'fixed', top: 0, left: '-99999px', width: '210mm', background: '#fff', zIndex: -1 }}
    >
      {payrolls.map((p, i) => (
        <div key={(p as any).id ?? i} style={{ pageBreakAfter: i < payrolls.length - 1 ? 'always' : 'auto' }}>
          <BulletinDisplay payroll={p} previewMode={false} />
        </div>
      ))}
    </div>
  );
}