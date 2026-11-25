'use client';

import dynamic from 'next/dynamic';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { api } from '@/services/api';
import { SettingsFrame } from '@/components/settings/SettingsFrame';
import { DocumentReader } from '@/components/ui/DocumentReader';
import { isDocumentLayoutActive, type DocumentTemplate } from '@/lib/document-template';
import { loadDocumentRights, type DocumentRights } from '@/lib/document-engine/document-rights';
import { payslipExample } from '@/lib/document-engine/example';
import { bulletinGalleryExample } from '@/lib/document-engine/gallery-example';
import { loadPayslipLayout, resetPayslipLayout, savePayslipLayout, type SavedDocumentLayout } from '@/lib/document-engine/layout-api';
import { historicDesign, historicDesigns, makePayslipDesign, payslipDesigns, referenceDesigns } from '@/lib/document-engine/payslip-gallery';
import type { DocLayout } from '@/types/document-layout';
import styles from './gallery.module.css';

const DocumentRenderer = dynamic(() => import('@/components/DocumentRenderer'), { ssr: false });
const HistoricPayslip = dynamic(() => import('@/components/DocumentRenderer/HistoricPayslip'), { ssr: false });
const defaultPreset = 'A_BLEU';
const readyDesigns = new Map<string, DocLayout>(payslipDesigns.map(({ id }) => [id, makePayslipDesign(id, true)]));
type Company = { id: string; documentTemplate: DocumentTemplate; salaryProrataDisplay?: boolean };
const companyModels: Record<DocumentTemplate, string> = {
  DEFAULT: 'Modèle actuel (ancien)', MODERN: 'Modèle actuel (ancien)',
  ORCA: 'Modèle Orca', STANDARD: 'Modèle Standard', CUSTOM: 'Mes modèles',
};

function Preview({ layout }: { layout: DocLayout }) {
  const original = layout.useOriginal && historicDesign(layout.basePreset);
  return original ? <HistoricPayslip source={original.source} payroll={bulletinGalleryExample} />
    : <DocumentRenderer docType="PAYSLIP" layout={layout} data={payslipExample} />;
}

export default function DocumentsSettingsPage() {
  const [company, setCompany] = useState<Company>();
  const [saved, setSaved] = useState<SavedDocumentLayout | null>(null);
  const [selected, setSelected] = useState<string>();
  const [rights, setRights] = useState<DocumentRights>();
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const dialog = useRef<HTMLDialogElement>(null);
  const [viewing, setViewing] = useState(false);
  const chosen = payslipDesigns.find(design => design.id === selected);
  const selection = chosen ?? (selected === 'BLANK' && saved ? { id: 'BLANK', name: saved.name } : undefined);
  const active = isDocumentLayoutActive(saved?.config, company?.documentTemplate) ? saved : null;
  const activePreset = active?.basePreset ?? (company?.documentTemplate === 'CUSTOM' ? defaultPreset : undefined);
  const activeName = active?.name ?? (company && (company.documentTemplate === 'CUSTOM' ? 'Bleu' : companyModels[company.documentTemplate]));

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const current = await api.get<Company>('/companies/mine');
        const [layout, access] = await Promise.all([loadPayslipLayout(current.id), loadDocumentRights().catch(() => undefined)]);
        if (!active) return;
        setSaved(layout);
        if (isDocumentLayoutActive(layout?.config, current.documentTemplate) || current.documentTemplate === 'CUSTOM') {
          setSelected(layout?.basePreset ?? defaultPreset);
        }
        setRights(access);
        setCompany(current);
      } catch {
        if (active) setError('Impossible de charger les modèles de votre entreprise.');
      }
    })();
    return () => { active = false; };
  }, [attempt]);

  useEffect(() => {
    if (viewing && dialog.current && !dialog.current.open) dialog.current.showModal();
  }, [viewing]);

  function layoutFor(id: string) {
    return saved?.basePreset === id ? saved.config : readyDesigns.get(id) ?? makePayslipDesign(id);
  }

  async function update(reset = false) {
    if (!company || busy || (!reset && (!selection || !rights?.canCustomizeDocuments))) return;
    if (reset && !window.confirm('Rétablir le modèle d’origine du bulletin ?')) return;
    setBusy(true); setError(''); setNotice('');
    try {
      if (reset) {
        await resetPayslipLayout();
        setSaved(null); setSelected(defaultPreset);
        setNotice('Le modèle enregistré a été réinitialisé.');
      } else if (selection) {
        const name = saved?.basePreset === selection.id ? saved.name : selection.name;
        const layout = await savePayslipLayout(name, layoutFor(selection.id));
        setSaved(layout);
        setNotice(`« ${name} » est actif pour vos bulletins.`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Impossible de mettre à jour le modèle.');
    } finally { setBusy(false); }
  }

  async function updateProrata(enabled: boolean) {
    if (!company) return;
    setBusy(true); setError(''); setNotice('');
    try {
      await api.patch('/companies', { salaryProrataDisplay: enabled });
      setCompany({ ...company, salaryProrataDisplay: enabled });
      setNotice('Présentation du salaire de base enregistrée.');
    } catch { setError('Impossible de modifier la présentation du salaire de base.'); }
    finally { setBusy(false); }
  }

  function openPreview(id: string) {
    setSelected(id);
    setViewing(true);
  }

  function renderCard({ id, name }: { id: string; name: string }) {
    return <button type="button" key={id} className={styles.card} aria-label={`Voir le modèle ${name}`}
      data-selected={selected === id} onClick={() => openPreview(id)}>
      <Image src={`/images/payslip-templates/${id}.webp`} alt="" width={104} height={147}
        className={styles.thumbnail} unoptimized />
      <span className={styles.cardName}>{name}</span>
      {activePreset === id && <span className={styles.active}>Actif</span>}
    </button>;
  }

  const canApply = rights?.canCustomizeDocuments && (selection?.id !== 'BLANK' || rights.canBuildDocumentsFromScratch);
  return <SettingsFrame kind="detail">
    <section className={styles.gallery}>
      <nav aria-label="Catégories de documents" className={styles.tabs}>
        <span aria-current="page">Bulletins</span>
        <Link href="/parametres/documents/administratifs">Demandes RH</Link>
        <Link href="/parametres/documents/factures">Factures prestataires</Link>
      </nav>
      <header>
        <h1>Modèles de bulletin de paie</h1>
        {activeName && <p className={styles.muted}>Modèle actif · {activeName}</p>}
      </header>
      {error && <p role="alert" className="text-sm text-[var(--danger-text)]">{error}</p>}
      {notice && <p role="status" className="text-sm">{notice}</p>}
      {!company && (error
        ? <button type="button" className="underline" onClick={() => { setError(''); setAttempt(attempt + 1); }}>Réessayer</button>
        : <p role="status">Chargement du modèle actif…</p>)}
      <section aria-labelledby="reference-designs">
        <h2 id="reference-designs">Modèles de référence</h2>
        <div className={styles.cards}>{referenceDesigns.map(renderCard)}</div>
      </section>
      <section aria-labelledby="historic-designs">
        <h2 id="historic-designs">Gabarits historiques</h2>
        <div className={styles.cards}>{historicDesigns.map(renderCard)}</div>
      </section>
      {(rights?.canBuildDocumentsFromScratch || saved?.basePreset === 'BLANK') && <section className={styles.actions}>
        {saved?.basePreset === 'BLANK' && <button type="button" className={styles.secondary} onClick={() => openPreview('BLANK')}>{saved.name}</button>}
        {rights?.canBuildDocumentsFromScratch && <Link href="/documents/editeur/PAYSLIP?start=blank" className={styles.secondary}>Partir d’une page blanche</Link>}
      </section>}
      {company && <details className={styles.settings}>
        <summary>Réglages du bulletin</summary>
        <label><input type="checkbox" checked={!!company.salaryProrataDisplay} disabled={busy}
          onChange={event => void updateProrata(event.target.checked)} /> Afficher le salaire de base après déduction des absences</label>
        {saved && <button type="button" disabled={busy} className={styles.secondary} onClick={() => void update(true)}>Réinitialiser le modèle</button>}
      </details>}
      <dialog ref={dialog} onClose={() => setViewing(false)} className={styles.modal} aria-labelledby="model-preview-title">
        {viewing && selection && <>
          <header className={styles.modalHeader}><h2 id="model-preview-title">{selection.name}</h2>
            <button type="button" onClick={() => dialog.current?.close()} className={styles.secondary}>Fermer</button>
          </header>
          <div className={styles.actions}>
            <button type="button" disabled={busy || !canApply} className={styles.primary} onClick={() => void update()}>Utiliser ce modèle</button>
            {rights?.canCustomizeDocuments && <Link href={`/documents/editeur/PAYSLIP?preset=${selection.id}`} className={styles.secondary}>Personnaliser</Link>}
          </div>
          {!rights?.canCustomizeDocuments && <p className={styles.muted}>Personnalisation disponible dès le plan Pro.</p>}
          {notice && <p role="status" className="text-sm">{notice}</p>}
          {error && <p role="alert" className="text-sm">{error}</p>}
          <DocumentReader title="Aperçu du modèle" subtitle="Données d’exemple" fitPage>
            <Preview layout={layoutFor(selection.id)} />
          </DocumentReader>
        </>}
      </dialog>
    </section>
  </SettingsFrame>;
}
