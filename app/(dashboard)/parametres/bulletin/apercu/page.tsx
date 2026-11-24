'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import DocumentRenderer from '@/components/DocumentRenderer';
import { payslipExample } from '@/lib/document-engine/example';
import { createPayslipLayout, payslipPresets, type PayslipPreset } from '@/lib/document-engine/registry';
import { printBulletin } from '@/lib/bulletin-print';

export default function PayslipPreviewPage() {
  const [preset, setPreset] = useState<PayslipPreset>('A_BLEU');
  const [fillPage, setFillPage] = useState(true);
  const layout = useMemo(() => createPayslipLayout(preset, fillPage ? 'page' : 'content'), [preset, fillPage]);
  return (
    <section className="mx-auto max-w-5xl px-4 py-6">
      <Link className="text-sm underline" href="/parametres/bulletin">Retour au bulletin de paie</Link>
      <h1 className="my-4 text-xl font-semibold">Aperçu des bulletins de paie</h1>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <select aria-label="Design du bulletin" value={preset}
          className="rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm"
          onChange={event => setPreset(event.target.value as PayslipPreset)}>
          {payslipPresets.map(({ id, name }) => <option key={id} value={id}>{name}</option>)}
        </select>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={fillPage} onChange={event => setFillPage(event.target.checked)} />
          Remplir la page
        </label>
        <button type="button" className="rounded-md border border-[var(--border)] px-3 py-2 text-sm"
          onClick={() => printBulletin('payslip-engine-preview')}>
          Imprimer ou enregistrer en PDF
        </button>
      </div>
      <div id="payslip-engine-preview">
        <DocumentRenderer docType="PAYSLIP" layout={layout} data={payslipExample} />
      </div>
    </section>
  );
}
