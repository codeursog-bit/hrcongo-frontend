'use client';

import { useEffect, useState } from 'react';
import type { DocLayout } from '@/types/document-layout';
import { createPayslipLayout } from '@/lib/document-engine/registry';
import { loadPayslipLayout } from '@/lib/document-engine/layout-api';
import type { PayslipData } from '@/lib/document-engine/payslip';
import EnginePayslip from './EnginePayslip';

const defaultLayout = createPayslipLayout();

export default function CompanyEnginePayslip({ companyId, payroll }: { companyId: string; payroll: PayslipData }) {
  const [layout, setLayout] = useState<DocLayout>();
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    loadPayslipLayout(companyId).then(saved => {
      if (active) setLayout(saved?.config ?? defaultLayout);
    }).catch(() => {
      if (active) setFailed(true);
    });
    return () => { active = false; };
  }, [companyId, attempt]);

  if (failed) return <div role="alert">
    Modèle de bulletin indisponible. <button type="button" className="underline" onClick={() => {
      setFailed(false);
      setAttempt(value => value + 1);
    }}>Réessayer</button>
  </div>;
  if (!layout) return <p role="status">Chargement du modèle de bulletin…</p>;
  return <EnginePayslip layout={layout} payroll={payroll} />;
}
