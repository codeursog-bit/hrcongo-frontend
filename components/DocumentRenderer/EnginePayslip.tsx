'use client';

import { useMemo } from 'react';
import type { DocLayout } from '@/types/document-layout';
import type { PayslipData } from '@/lib/document-engine/payslip';
import { buildContext } from '@/lib/document-engine/registry';
import DocumentRenderer from './index';

export default function EnginePayslip({ layout, payroll }: { layout: DocLayout; payroll: PayslipData }) {
  const context = useMemo(() => buildContext('PAYSLIP', payroll), [payroll]);
  return <DocumentRenderer docType="PAYSLIP" layout={layout} data={context} />;
}
