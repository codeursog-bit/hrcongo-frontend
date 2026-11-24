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
import type { DocLayout } from '@/types/document-layout';
import { isFactureContract } from '@/lib/facture-contract-types';
import { authService } from '@/lib/services/authService';

interface Props {
  payrollIds: string[];
  onReady: () => void;
  onError: (message: string) => void;
}

export default function BulletinBatchPrintHidden({ payrollIds, onReady, onError }: Props) {
  const [entries, setEntries] = useState<{ payroll: BulletinPayroll; layout?: DocLayout }[] | null>(null);
  const root = useRef<HTMLDivElement>(null);
  const firedRef = useRef(false);

  useEffect(() => {
    firedRef.current = false;
    setEntries(null);
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
        if (cancelled) return;
        const sessionCompanyId = authService.getCurrentUser()?.companyId;
        const companies = new Set(results.flatMap(payroll => {
          if (payroll.company?.documentTemplate !== 'CUSTOM' || isFactureContract(payroll.employee?.contractType)) return [];
          const id = payroll.company.id ?? payroll.companyId;
          return id && id === sessionCompanyId ? [id] : [];
        }));
        const layouts = new Map<string, DocLayout>();
        if (companies.size) {
          const [{ loadPayslipLayout }, { createPayslipLayout }] = await Promise.all([
            import('@/lib/document-engine/layout-api'), import('@/lib/document-engine/registry'),
          ]);
          await Promise.all([...companies].map(async id => {
            const saved = await loadPayslipLayout(id);
            layouts.set(id, saved?.config ?? createPayslipLayout());
          }));
        }
        if (!cancelled) setEntries(results.map(payroll => ({
          payroll,
          layout: payroll.company?.documentTemplate === 'CUSTOM' && !isFactureContract(payroll.employee?.contractType)
            ? layouts.get(payroll.company.id ?? payroll.companyId ?? '') : undefined,
        })));
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
    if (!entries || firedRef.current || !root.current) return;
    const element = root.current;
    const expected = entries.filter(entry => entry.layout).length;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const observer = new MutationObserver(ready);
    const deadline = setTimeout(() => {
      observer.disconnect();
      onError('Le rendu des bulletins n’a pas pu être chargé.');
    }, 15_000);
    function ready() {
      if (element.querySelectorAll('[data-document-engine]').length < expected || firedRef.current) return;
      firedRef.current = true;
      clearTimeout(deadline);
      observer.disconnect();
      timer = setTimeout(() => onReady(), 700);
    }
    observer.observe(element, { childList: true, subtree: true });
    ready();
    return () => { clearTimeout(deadline); clearTimeout(timer); observer.disconnect(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entries]);

  if (!entries) return null;

  return (
    <div
      id="bul-batch-root"
      ref={root}
      style={{ position: 'fixed', top: 0, left: '-99999px', width: '210mm', background: '#fff', zIndex: -1 }}
    >
      {entries.map(({ payroll, layout }, i) => (
        <div key={payroll.id ?? i} style={{ pageBreakAfter: i < entries.length - 1 ? 'always' : 'auto' }}>
          <BulletinDisplay payroll={payroll} previewMode={false} documentLayout={layout} />
        </div>
      ))}
    </div>
  );
}
