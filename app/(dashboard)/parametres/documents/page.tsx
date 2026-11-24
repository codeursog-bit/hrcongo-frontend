'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { api } from '@/services/api';
import { SettingsFrame } from '@/components/settings/SettingsFrame';
import type { DocumentTemplate } from '@/lib/document-template';
import { payslipExample } from '@/lib/document-engine/example';
import { loadPayslipLayout, resetPayslipLayout, savePayslipLayout, type SavedDocumentLayout } from '@/lib/document-engine/layout-api';
import { createPayslipLayout, payslipPresets, type PayslipPreset } from '@/lib/document-engine/registry';

const DocumentRenderer = dynamic(() => import('@/components/DocumentRenderer'), { ssr: false });
const defaultPreset: PayslipPreset = 'A_BLEU';
type Company = { id: string; documentTemplate: DocumentTemplate };
const companyModels: Record<DocumentTemplate, string> = {
  DEFAULT: 'Modèle actuel (ancien)', MODERN: 'Modèle actuel (ancien)',
  ORCA: 'Modèle Orca', STANDARD: 'Modèle Standard', CUSTOM: 'Mes modèles',
};

export default function DocumentsSettingsPage() {
  const [company, setCompany] = useState<Company>();
  const [saved, setSaved] = useState<SavedDocumentLayout | null>(null);
  const [selected, setSelected] = useState<PayslipPreset>(defaultPreset);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const lastSave = useRef(-Infinity);
  const presetLayout = useMemo(() => createPayslipLayout(selected), [selected]);
  const preview = saved?.basePreset === selected ? saved.config : presetLayout;

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const current = await api.get<Company>('/companies/mine');
        const layout = await loadPayslipLayout(current.id);
        if (!active) return;
        setSaved(layout);
        const preset = payslipPresets.find(({ id }) => id === layout?.basePreset);
        setSelected(preset?.id ?? defaultPreset);
        setCompany(current);
      } catch {
        if (active) setError('Impossible de charger les modèles de votre entreprise.');
      }
    })();
    return () => { active = false; };
  }, [attempt]);

  async function update(reset = false) {
    if (!company || busy) return;
    if (reset && !window.confirm('Supprimer le modèle enregistré et rétablir le design Bleu par défaut ?')) return;
    if (!reset && performance.now() - lastSave.current < 1000) return;
    if (!reset) lastSave.current = performance.now();
    setBusy(true);
    setError('');
    setNotice('');
    try {
      if (reset) {
        await resetPayslipLayout();
        setSaved(null);
        setSelected(defaultPreset);
        setNotice(company.documentTemplate === 'CUSTOM' ? 'Le design Bleu est de nouveau utilisé.' : 'La copie enregistrée a été supprimée.');
      } else {
        const name = saved?.basePreset === selected ? saved.name : payslipPresets.find(({ id }) => id === selected)!.name;
        const layout = await savePayslipLayout(name, preview);
        setSaved(layout);
        setCompany({ ...company, documentTemplate: 'CUSTOM' });
        setNotice(`Le design ${name} est actif pour les bulletins de votre entreprise.`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Impossible de mettre à jour le modèle.');
    } finally {
      setBusy(false);
    }
  }

  return <SettingsFrame kind="detail">
    <section className="mx-auto max-w-5xl space-y-5 px-4 py-6">
      <Link href="/parametres" className="text-sm underline">Retour aux paramètres</Link>
      <h1 className="text-xl font-semibold">Documents</h1>
      <h2 className="text-base font-semibold">Bulletin de paie</h2>
      {company && <p className="text-sm text-[var(--text-muted)]">
        Modèle actif · {companyModels[company.documentTemplate]}
        {company.documentTemplate === 'CUSTOM' && ` · ${saved?.name ?? 'Bleu'}`}
      </p>}
      {error && <p role="alert" className="text-sm text-[var(--danger-text)]">{error}</p>}
      {notice && <p role="status" className="text-sm">{notice}</p>}
      {!company && (error
        ? <button type="button" className="underline" onClick={() => { setError(''); setAttempt(attempt + 1); }}>Réessayer</button>
        : <p role="status">Chargement des modèles…</p>)}
      <fieldset className="grid grid-cols-2 gap-3 sm:grid-cols-4" disabled={busy || !company}>
        <legend className="sr-only">Design du bulletin</legend>
        {payslipPresets.map(({ id, name }) => {
          const { main, headFill } = createPayslipLayout(id).tokens.colors;
          return <label key={id} className={`flex cursor-pointer items-center gap-2 rounded-lg border p-3 text-sm ${selected === id
            ? 'border-[var(--brand)] bg-[var(--brand-soft)]' : 'border-[var(--border)] bg-[var(--surface)]'}`}>
            <input type="radio" name="payslip-design" value={id} checked={selected === id} onChange={() => setSelected(id)} />
            <span aria-hidden="true" className="h-5 w-5 shrink-0 rounded-sm border" style={{ background: headFill, borderColor: main }} />
            {name}
          </label>;
        })}
      </fieldset>
      <div className="flex flex-wrap gap-3">
        {company && <Link href={`/documents/editeur/PAYSLIP?preset=${selected}`} className="rounded-md border border-[var(--border)] px-4 py-2 text-sm">
          Personnaliser le bulletin
        </Link>}
        <button type="button" disabled={busy || !company} onClick={() => void update()}
          className="rounded-md bg-[var(--brand)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
          Utiliser ce design
        </button>
        {saved && <button type="button" disabled={busy} onClick={() => void update(true)}
          className="rounded-md border border-[var(--border)] px-4 py-2 text-sm disabled:opacity-50">
          Réinitialiser le modèle
        </button>}
      </div>
      <section aria-label="Aperçu avec des données d’exemple" className="overflow-hidden border border-[var(--border)]">
        <DocumentRenderer docType="PAYSLIP" layout={preview} data={payslipExample} />
      </section>
    </section>
  </SettingsFrame>;
}
