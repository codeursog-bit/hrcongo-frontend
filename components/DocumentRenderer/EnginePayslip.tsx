'use client';

import { useMemo } from 'react';
import type { DocLayout } from '@/types/document-layout';
import type { PayslipData } from '@/lib/document-engine/payslip';
import { buildContext } from '@/lib/document-engine/registry';
import DocumentRenderer from './index';
import dynamic from 'next/dynamic';
import { historicDesign } from '@/lib/document-engine/payslip-gallery';

const HistoricPayslip = dynamic(() => import('./HistoricPayslip'), { ssr: false });

export default function EnginePayslip({ layout, payroll }: { layout: DocLayout; payroll: PayslipData }) {
  const context = useMemo(() => buildContext('PAYSLIP', payroll), [payroll]);
  const original = layout.useOriginal && historicDesign(layout.basePreset);
  if (original) return <HistoricPayslip source={original.source} payroll={payroll} />;
  return <DocumentRenderer docType="PAYSLIP" layout={layout} data={context} />;
}
