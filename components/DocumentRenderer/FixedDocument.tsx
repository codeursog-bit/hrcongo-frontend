import { Fragment, type CSSProperties, type ReactNode } from 'react';
import layouts from '@/lib/document-engine/fixed-documents.json';

type LayoutId = keyof typeof layouts;

export function FixedSections({ layout, sections }: {
  layout: LayoutId;
  sections: Record<string, ReactNode>;
}) {
  return layouts[layout].sections.map(key => <Fragment key={key}>{sections[key]}</Fragment>);
}

export function FixedInvoiceSheet({ layout, id, style, sections }: {
  layout: 'invoiceForfait' | 'invoiceDetailed';
  id: 'fac-forfait' | 'fac-detaillee';
  style: CSSProperties;
  sections: Record<string, ReactNode>;
}) {
  const wrapper = `${id}-wrap`;
  return <>
    <style>{`
        @media print {
          @page { size: ${layouts[layout].size} portrait; margin: 0; }
          body { visibility: hidden !important; background: #fff !important; margin: 0 !important; padding: 0 !important; }
          #${wrapper}, #${wrapper} * { visibility: visible !important; }
          #${wrapper} { position: absolute !important; top: 0 !important; left: 0 !important; width: 100% !important; }
          #${id} { box-shadow: none !important; border: none !important; }
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        }
      `}</style>
    <div id={wrapper} data-bulletin-root="true" style={{ background: '#fff' }}>
      <div id={id} style={style}><FixedSections layout={layout} sections={sections} /></div>
    </div>
  </>;
}
