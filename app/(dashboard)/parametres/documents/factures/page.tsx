'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { SettingsFrame } from '@/components/settings/SettingsFrame';
import { DocumentReader } from '@/components/ui/DocumentReader';
import DocumentRenderer from '@/components/DocumentRenderer';
import HistoricInvoice from '@/components/DocumentRenderer/HistoricInvoice';
import { api } from '@/services/api';
import { loadDocumentRights, type DocumentRights } from '@/lib/document-engine/document-rights';
import { invoiceGalleryExample } from '@/lib/document-engine/gallery-example';
import { invoiceDesigns, invoiceExample, makeInvoiceDesign } from '@/lib/document-engine/invoices';
import { loadAdministrativeLayout, saveAdministrativeLayout, resetAdministrativeLayout, type SavedAdministrativeLayout } from '@/lib/document-engine/administrative-api';
import { getBaseTemplate } from '@/lib/bulletin-templates';
import type { BulletinTemplateConfig } from '@/types/bulletin-template';
import styles from '../gallery.module.css';
const type = 'CONTRACTOR_INVOICE';
type Config = Partial<BulletinTemplateConfig> & { factureTemplateId?: string };
export default function InvoiceSettingsPage() {
  const [config, setConfig] = useState<Config>();
  const [saved, setSaved] = useState<SavedAdministrativeLayout | null>(null);
  const [selected, setSelected] = useState<string>();
  const [rights, setRights] = useState<DocumentRights>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [viewing, setViewing] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const base = getBaseTemplate(config?.templateId ?? 'default');
  const template = { ...base, ...config, style: { ...base.style, ...config?.style } };
  const active = saved?.config?.independent ? saved : null;
  const legacy = invoiceDesigns.find(item => item.historic === config?.factureTemplateId) ?? invoiceDesigns[0];
  const selection = invoiceDesigns.find(item => item.id === selected) ?? (selected === 'BLANK' && saved ? { id: 'BLANK', name: saved.name ?? 'Mon modèle' } : undefined);
  const layout = selection ? saved?.basePreset === selection.id && saved.config ? saved.config : makeInvoiceDesign(selection.id, true) : undefined;
  useEffect(() => {
    let live = true;
    (async () => {
      const company = await api.get<{ id: string }>('/companies/mine');
      const [settings, access, current] = await Promise.all([api.get<{ config: Config }>('/companies/bulletin-template'), loadDocumentRights(), loadAdministrativeLayout(company.id, type)]);
      if (live) { setConfig(settings.config ?? {}); setRights(access); setSaved(current); }
    })().catch(() => { if (live) setError('Impossible de charger les modèles de facture. Rechargez la page pour réessayer.'); });
    return () => { live = false; };
  }, []);
  useEffect(() => { if (viewing && !dialog.current?.open) dialog.current?.showModal(); }, [viewing]);
  async function save(reset = false) {
    if (busy || !rights?.canCustomizeDocuments || !reset && (!selection || !layout)) return;
    if (reset && !window.confirm('Rétablir le modèle de facture d’origine ?')) return;
    setBusy(true); setError(''); setNotice('');
    try {
      if (reset) { await resetAdministrativeLayout(type); setSaved(null); }
      else setSaved(await saveAdministrativeLayout(type, layout!, selection!.name));
      setNotice(reset ? 'Modèle d’origine rétabli.' : 'Modèle de facture enregistré et actif.');
    } catch { setError('Impossible d’enregistrer le modèle.'); }
    finally { setBusy(false); }
  }
  const open = (id: string) => { setSelected(id); setViewing(true); };
  return <SettingsFrame kind="detail"><section className={styles.gallery}>
    <nav aria-label="Catégories de documents" className={styles.tabs}><Link href="/parametres/documents">Bulletins</Link><Link href="/parametres/documents/administratifs">Demandes RH</Link><span aria-current="page">Factures prestataires</span></nav>
    <header><h1>Modèles de factures prestataires</h1><p className={styles.muted}>Modèle actif · {config ? active?.name ?? legacy.name : 'Chargement…'}</p></header>
    {error && <p role="alert">{error}</p>}{notice && <p role="status">{notice}</p>}
    <div className={styles.cards}>{invoiceDesigns.map(model => <button type="button" className={styles.card} key={model.id} aria-label={`Voir le modèle ${model.name}`} onClick={() => open(model.id)}>
      <img src={`/images/invoice-templates/${model.id}.svg`} alt="" width={104} height={147} className={styles.thumbnail} />
      <span className={styles.cardName}>{model.name}</span>{(active?.basePreset ?? legacy.id) === model.id && <span className={styles.active}>Actif</span>}
    </button>)}</div>
    <div className={styles.actions}>
      {saved?.basePreset === 'BLANK' && <button type="button" className={styles.secondary} onClick={() => open('BLANK')}>{saved.name ?? 'Mon modèle'}</button>}
      {rights?.canBuildDocumentsFromScratch && <Link className={styles.secondary} href="/documents/editeur/CONTRACTOR_INVOICE?start=blank">Partir d’une page blanche</Link>}
      {active && rights?.canCustomizeDocuments && <button className={styles.secondary} disabled={busy} onClick={() => void save(true)}>Réinitialiser le modèle</button>}
    </div>
    <dialog className={styles.modal} ref={dialog} onClose={() => setViewing(false)} aria-labelledby="invoice-preview-title">{viewing && selection && layout && <>
      <header className={styles.modalHeader}><h2 id="invoice-preview-title">{selection.name}</h2><button type="button" className={styles.secondary} onClick={() => dialog.current?.close()}>Fermer</button></header>
      <div className={styles.actions}><button className={styles.primary} type="button" disabled={busy || !rights?.canCustomizeDocuments || selection.id === 'BLANK' && !rights.canBuildDocumentsFromScratch} onClick={() => void save()}>Utiliser ce modèle</button>
        {rights?.canCustomizeDocuments && <Link className={styles.secondary} href={`/documents/editeur/CONTRACTOR_INVOICE?preset=${selection.id}`}>Personnaliser</Link>}</div>
      {notice && <p role="status">{notice}</p>}{error && <p role="alert">{error}</p>}
      <DocumentReader title="Aperçu de la facture" subtitle="Données d’exemple" fitPage>
        {layout.useOriginal ? <HistoricInvoice preset={layout.basePreset ?? undefined} payroll={invoiceGalleryExample} template={template} previewMode /> : <DocumentRenderer docType={type} layout={layout} data={invoiceExample()} />}
      </DocumentReader>
    </>}</dialog>
  </section></SettingsFrame>;
}
