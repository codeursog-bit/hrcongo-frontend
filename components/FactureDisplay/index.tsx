'use client';

// ============================================================================
// components/FactureDisplay/index.tsx
//
// Équivalent de BulletinDisplay, mais pour les contrats PRESTATAIRE /
// CONSULTANT / INTERIM / STAGE (cf. lib/facture-contract-types.ts).
//
// Choix du modèle (Forfait simple, Détaillée numérotée ou Professionnelle bleu/rouge A4) : lu dans le MÊME
// objet BulletinTemplate.config que les bulletins (Json libre, companyId
// unique) — on stocke juste une clé de plus (config.factureTemplateId) au
// lieu d'ajouter une colonne/table. Si absente → 'forfait' par défaut.
// ============================================================================

import React, { useEffect, useState } from 'react';
import { authService } from '@/lib/services/authService';
import { loadAdministrativeLayout } from '@/lib/document-engine/administrative-api';
import { invoiceContext } from '@/lib/document-engine/invoices';
import type { DocLayout } from '@/types/document-layout';
import DocumentRenderer from '@/components/DocumentRenderer';
import HistoricInvoice from '@/components/DocumentRenderer/HistoricInvoice';
import FactureRendererForfait from '@/components/DocumentRenderer/InvoiceForfait';
import FactureRendererDetaillee from '@/components/DocumentRenderer/InvoiceDetailed';
import FactureRendererPro from '@/components/FactureRendererPro';
import { useBulletinConfig } from '@/hooks/useBulletinConfig';
import type { BulletinPayroll } from '@/types/bulletin-template';

interface Props {
  payroll:      BulletinPayroll;
  previewMode?: boolean;
}

function LegacyFactureDisplay({ payroll, previewMode = false }: Props) {
  const { config, isLoading } = useBulletinConfig();

  if (isLoading) {
    return (
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', padding:'40px', background:'#fff' }}>
        <div style={{ width:28, height:28, borderRadius:'50%', border:'3px solid #e2e8f0', borderTopColor:'#b91c1c', animation:'spin .8s linear infinite' }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  // Clé additionnelle, tolérée par le Json existant — pas de migration.
  const factureTemplateId = (config as any).templateConfig?.factureTemplateId
    ?? (config as any).factureTemplateId
    ?? 'forfait';

  if (factureTemplateId === 'professionnelle') {
    return (
      <FactureRendererPro
        payroll={payroll}
        template={config.templateConfig}
        previewMode={previewMode}
      />
    );
  }

  if (factureTemplateId === 'detaillee') {
    return (
      <FactureRendererDetaillee
        payroll={payroll}
        template={config.templateConfig}
        previewMode={previewMode}
      />
    );
  }

  return (
    <FactureRendererForfait
      payroll={payroll}
      template={config.templateConfig}
      previewMode={previewMode}
    />
  );
}

function CompanyInvoice({ companyId, payroll, previewMode }: Props & { companyId: string }) {
  const [layout, setLayout] = useState<DocLayout | null>();
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const { config, isLoading } = useBulletinConfig();
  useEffect(() => {
    let live = true;
    loadAdministrativeLayout(companyId, 'CONTRACTOR_INVOICE').then(result => {
      if (live) setLayout(result?.config?.independent ? result.config : null);
    }).catch(() => { if (live) setFailed(true); });
    return () => { live = false; };
  }, [companyId, attempt]);
  if (failed) return <p role="alert">Modèle de facture indisponible. <button type="button" onClick={() => { setFailed(false); setAttempt(value => value + 1); }}>Réessayer</button></p>;
  if (layout === undefined || isLoading) return <p role="status">Chargement du modèle de facture…</p>;
  if (layout?.useOriginal) return <HistoricInvoice preset={layout.basePreset ?? undefined} payroll={payroll} template={config.templateConfig} previewMode={previewMode} />;
  if (layout) return <DocumentRenderer docType="CONTRACTOR_INVOICE" layout={layout} data={invoiceContext(payroll)} />;
  return <LegacyFactureDisplay payroll={payroll} previewMode={previewMode} />;
}
export default function FactureDisplay(props: Props) {
  const sessionCompany = authService.getCurrentUser()?.companyId;
  const companyId = props.payroll.company?.id ?? props.payroll.companyId;
  return companyId && sessionCompany === companyId
    ? <CompanyInvoice key={companyId} companyId={companyId} {...props} /> : <LegacyFactureDisplay {...props} />;
}
