'use client';
import InvoiceForfait from './InvoiceForfait';
import InvoiceDetailed from './InvoiceDetailed';
import FactureRendererPro from '@/components/FactureRendererPro';
import type { BulletinPayroll, BulletinTemplateConfig } from '@/types/bulletin-template';
export default function HistoricInvoice({ preset, payroll, template, previewMode }: {
  preset?: string; payroll: BulletinPayroll; template?: BulletinTemplateConfig; previewMode?: boolean;
}) {
  if (preset === 'INVOICE_PRO') return <FactureRendererPro payroll={payroll} template={template} previewMode={previewMode} />;
  if (preset === 'INVOICE_DETAILED') return <InvoiceDetailed payroll={payroll} template={template} previewMode={previewMode} />;
  return <InvoiceForfait payroll={payroll} template={template} previewMode={previewMode} />;
}
