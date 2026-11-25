'use client';

import { useEffect, useState, type ReactNode } from 'react';
import type { DocLayout } from '@/types/document-layout';
import { createPayslipLayout } from '@/lib/document-engine/registry';
import { loadPayslipLayout } from '@/lib/document-engine/layout-api';
import type { PayslipData } from '@/lib/document-engine/payslip';
import EnginePayslip from './EnginePayslip';
import { isDocumentLayoutActive } from '@/lib/document-template';

const defaultLayout = createPayslipLayout();

export default function CompanyEnginePayslip({ companyId, payroll, fallback }: {
  companyId: string; payroll: PayslipData; fallback: ReactNode;
}) {
  const [layout, setLayout] = useState<DocLayout | null>();
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    loadPayslipLayout(companyId).then(saved => {
      if (active) setLayout(saved?.config ?? null);
    }).catch(() => {
      if (active) setFailed(true);
    });
    return () => { active = false; };
  }, [companyId, attempt]);

  const defaultTemplate = payroll.company?.documentTemplate;
  if (failed && defaultTemplate !== 'CUSTOM') return fallback;
  if (failed) return <div role="alert">
    Modèle de bulletin indisponible. <button type="button" className="underline" onClick={() => {
      setFailed(false);
      setAttempt(value => value + 1);
    }}>Réessayer</button>
  </div>;
  if (layout === undefined) return <p role="status">Chargement du modèle de bulletin…</p>;
  if (layout && isDocumentLayoutActive(layout, defaultTemplate)) return <EnginePayslip layout={layout} payroll={payroll} />;
  return defaultTemplate === 'CUSTOM' ? <EnginePayslip layout={defaultLayout} payroll={payroll} /> : fallback;
}
