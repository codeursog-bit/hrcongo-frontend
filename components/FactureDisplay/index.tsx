'use client';

// ============================================================================
// components/FactureDisplay/index.tsx
//
// Équivalent de BulletinDisplay, mais pour les contrats PRESTATAIRE /
// CONSULTANT / INTERIM / STAGE (cf. lib/facture-contract-types.ts).
//
// Choix du modèle (Forfait simple vs Détaillée numérotée) : lu dans le MÊME
// objet BulletinTemplate.config que les bulletins (Json libre, companyId
// unique) — on stocke juste une clé de plus (config.factureTemplateId) au
// lieu d'ajouter une colonne/table. Si absente → 'forfait' par défaut.
// ============================================================================

import React from 'react';
import FactureRendererForfait from '@/components/FactureRendererForfait';
import FactureRendererDetaillee from '@/components/FactureRendererDetaillee';
import { useBulletinConfig } from '@/hooks/useBulletinConfig';
import type { BulletinPayroll } from '@/types/bulletin-template';

interface Props {
  payroll:      BulletinPayroll;
  previewMode?: boolean;
}

export default function FactureDisplay({ payroll, previewMode = false }: Props) {
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