'use client';

import dynamic from 'next/dynamic';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { SettingsFrame } from '@/components/settings/SettingsFrame';
import { DocumentReader } from '@/components/ui/DocumentReader';
import { loadDocumentRights, type DocumentRights } from '@/lib/document-engine/document-rights';
import { api } from '@/services/api';
import {
  administrativeExample, administrativeNames, administrativePresets, administrativeTypes, administrativeOtherDesigns,
  historicAdministrativePreset, makeAdministrativeDesign, type AdministrativeType,
} from '@/lib/document-engine/administrative';
import { loadAdministrativeLayout, resetAdministrativeLayout, saveAdministrativeLayout, type SavedAdministrativeLayout } from '@/lib/document-engine/administrative-api';
import type { DocLayout } from '@/types/document-layout';
import { isDocumentLayoutActive } from '@/lib/document-template';
import styles from '../gallery.module.css';

const DocumentRenderer = dynamic(() => import('@/components/DocumentRenderer'), { ssr: false });
const HistoricRequestPreview = dynamic(() => import('@/components/documents/HistoricRequestPreview'), { ssr: false });
type Company = { id: string; documentTemplate: string };
type Choice = { id: string; name: string };

function Preview({ type, layout }: { type: AdministrativeType; layout: DocLayout }) {
  const historic = layout.useOriginal && historicAdministrativePreset(layout.basePreset);
  return historic ? <HistoricRequestPreview type={type} template={historic.template} />
    : <DocumentRenderer docType={type} layout={layout} data={administrativeExample(type)} />;
}

export default function AdministrativeDocumentsSettings() {
  const [company, setCompany] = useState<Company>();
  const [rights, setRights] = useState<DocumentRights>();
  const [type, setType] = useState<AdministrativeType>('LEAVE');
  const [ready, setReady] = useState<AdministrativeType>();
  const [saved, setSaved] = useState<SavedAdministrativeLayout | null>(null);
  const [selected, setSelected] = useState<Choice>();
  const [busy, setBusy] = useState(false);
  const [retry, setRetry] = useState(0);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const dialog = useRef<HTMLDialogElement>(null);
  const otherDesigns = administrativeOtherDesigns(type, company?.documentTemplate);
  const activeLayout = isDocumentLayoutActive(saved?.config, company?.documentTemplate) ? saved : null;

  useEffect(() => {
    const requested = new URLSearchParams(window.location.search).get('type');
    const match = administrativeTypes.find(entry => entry === requested);
    if (match) setType(match);
  }, []);

  useEffect(() => {
    let active = true;
    Promise.all([api.get<Company>('/companies/mine'), loadDocumentRights().catch(() => undefined)])
      .then(([result, access]) => { if (active) { setCompany(result); setRights(access); } })
      .catch(() => { if (active) setError('Impossible de charger les réglages de l’entreprise.'); });
    return () => { active = false; };
  }, [retry]);

  useEffect(() => {
    if (!company) return;
    let active = true;
    loadAdministrativeLayout(company.id, type).then(result => {
      if (!active) return;
      setSaved(result); setReady(type);
    }).catch(() => { if (active) setError('Impossible de charger le modèle actif.'); });
    return () => { active = false; };
  }, [company, type, retry]);

  useEffect(() => {
    if (selected && dialog.current && !dialog.current.open) dialog.current.showModal();
  }, [selected]);

  function layoutFor(id: string) {
    return ready === type && saved?.basePreset === id && saved.config?.docType === type
      ? saved.config : makeAdministrativeDesign(type, id, true);
  }

  async function update(reset = false) {
    if (busy || ready !== type || (!reset && (!selected || !rights?.canCustomizeDocuments))) return;
    if (reset && !window.confirm('Rétablir le modèle d’origine de ce type de demande ?')) return;
    setBusy(true); setError(''); setNotice('');
    try {
      if (reset) {
        await resetAdministrativeLayout(type);
        setSaved(null);
        setNotice('Le modèle d’origine est rétabli pour ce type de demande.');
      } else if (selected) {
        const name = saved?.basePreset === selected.id ? saved.name ?? selected.name : selected.name;
        setSaved(await saveAdministrativeLayout(type, layoutFor(selected.id), name));
        setNotice(`« ${name} » est actif pour ce type de demande.`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Impossible de modifier le modèle.');
    } finally { setBusy(false); }
  }

  function renderCard(choice: Choice) {
    return <button key={choice.id} type="button" data-model-id={choice.id} aria-label={`Voir le modèle ${choice.name}`} className={styles.card}
      onClick={() => { setNotice(''); setSelected(choice); }}>
      <Image src={`/images/request-templates/${type}-${choice.id}.webp`} alt="" width={104} height={147}
        className={styles.thumbnail} unoptimized />
      <span className={styles.cardName}>{choice.name}</span>
      {ready === type && activeLayout?.basePreset === choice.id && <span className={styles.active}>Actif</span>}
    </button>;
  }
  const savedName = saved?.name ?? [...administrativePresets, ...otherDesigns].find(choice => choice.id === saved?.basePreset)?.name;
  const outsideGallery = saved && ![...administrativePresets, ...otherDesigns].some(choice => choice.id === saved.basePreset);
  const current = company?.documentTemplate === 'CUSTOM' ? 'Classique'
    : type === 'EXIT_PERMISSION' ? 'Ticket historique'
      : company?.documentTemplate === 'ORCA' ? 'Modèle 1 · Orca'
        : company?.documentTemplate === 'STANDARD' ? 'Modèle 2 · Standard'
          : company?.documentTemplate === 'MODERN' ? 'Modèle 3 · Moderne' : 'Modèle d’origine';
  const editorUrl = `/documents/editeur/${type}`;
  return <SettingsFrame kind="detail">
    <section className={styles.gallery}>
      <nav aria-label="Catégories de documents" className={styles.tabs}>
        <Link href="/parametres/documents">Bulletins</Link>
        <span aria-current="page">Demandes RH</span>
        <Link href="/parametres/documents/factures">Factures prestataires</Link>
      </nav>
      <header>
        <h1>Modèles de demandes RH</h1>
        <label className={styles.requestType}>Type de document
          <select aria-label="Type de document" value={type} disabled={busy} onChange={event => {
            setType(event.target.value as AdministrativeType); setReady(undefined); setSaved(null); setError(''); setNotice('');
          }}>
            {administrativeTypes.map(id => <option key={id} value={id}>{administrativeNames[id]}</option>)}
          </select>
        </label>
        {ready === type && <p className={styles.muted}>Modèle actif · {activeLayout ? savedName ?? current : current}</p>}
      </header>
      {error && <p role="alert">{error} {ready !== type && <button className={styles.secondary} type="button"
        onClick={() => { setError(''); setRetry(value => value + 1); }}>Réessayer</button>}</p>}
      {notice && !selected && <p role="status">{notice}</p>}
      <section aria-labelledby="admin-reference-designs">
        <h2 id="admin-reference-designs">Modèles de référence</h2>
        <div className={styles.cards}>{administrativePresets.map(renderCard)}</div>
      </section>
      <section aria-labelledby="admin-other-designs">
        <h2 id="admin-other-designs">{type === 'EXIT_PERMISSION' ? 'Autres gabarits' : 'Gabarits historiques'}</h2>
        <div className={styles.cards}>{otherDesigns.map(renderCard)}</div>
      </section>
      <div className={styles.actions}>
        {ready === type && outsideGallery && <button type="button" className={styles.secondary}
          onClick={() => setSelected({ id: saved.basePreset, name: savedName ?? 'Mon modèle' })}>{savedName ?? 'Mon modèle'}</button>}
        {rights?.canBuildDocumentsFromScratch && <Link href={`${editorUrl}?start=blank`} className={styles.secondary}>Partir d’une page blanche</Link>}
        {saved && ready === type && <button type="button" disabled={busy} className={styles.secondary}
          onClick={() => void update(true)}>Réinitialiser le modèle</button>}
      </div>
      <dialog ref={dialog} onClose={() => setSelected(undefined)} className={styles.modal} aria-labelledby="admin-preview-title">
        {selected && <>
          <header className={styles.modalHeader}><h2 id="admin-preview-title">{selected.name}</h2>
            <button type="button" className={styles.secondary} onClick={() => dialog.current?.close()}>Fermer</button></header>
          <div className={styles.actions}>
            <button type="button" disabled={busy || ready !== type || !rights?.canCustomizeDocuments || selected.id === 'BLANK' && !rights.canBuildDocumentsFromScratch}
              className={styles.primary} onClick={() => void update()}>Utiliser ce modèle</button>
            {rights?.canCustomizeDocuments && <Link href={`${editorUrl}?preset=${selected.id}`} className={styles.secondary}>Personnaliser</Link>}
          </div>
          {notice && <p role="status">{notice}</p>}
          {error && <p role="alert">{error}</p>}
          <DocumentReader title="Aperçu du modèle" subtitle="Données d’exemple" fitPage>
            <Preview type={type} layout={layoutFor(selected.id)} />
          </DocumentReader>
        </>}
      </dialog>
    </section>
  </SettingsFrame>;
}
