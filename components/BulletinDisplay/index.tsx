'use client';

// ============================================================================
// components/BulletinDisplay/index.tsx
//
// Composant universel d'affichage du bulletin.
// Détecte automatiquement le mode (template ou canvas) et utilise
// le bon renderer. Utilisé dans :
//   • app/(dashboard)/paie/[id]/page.tsx
//   • app/(dashboard)/ma-paie/page.tsx  (modal)
//   • app/(dashboard)/cabinet/.../bulletins/page.tsx
//   • app/pme/[companyId]/bulletins/page.tsx
//
// ✅ MODIF (sept. 2026) : si l'employé a un contractType PRESTATAIRE /
// CONSULTANT / INTERIM / STAGE (cf. lib/facture-contract-types.ts), on
// route automatiquement vers FactureDisplay (facture) au lieu d'un bulletin
// de paie classique — décision prise en amont, pas de bouton/toggle par
// utilisateur RH à chaque consultation.
//
// Props :
//   payroll      — données payroll telles que retournées par l'API (la fusion
//                  « salaire proratisé » éventuelle est faite ici, à l'affichage)
//   previewMode  — true = taille réduite pour preview (pas impression)
// ============================================================================

import React from 'react';
import dynamic from 'next/dynamic';
import BulletinRenderer from '@/components/BulletinRenderer';
import BulletinRendererClarifie from '@/components/BulletinRendererClarifie';
import BulletinRendererClassique from '@/components/BulletinRendererClassique';
import BulletinRendererInf from '@/components/BulletinRendererInf';
import CanvasRenderer   from '@/components/CanvasRenderer';
import FactureDisplay   from '@/components/FactureDisplay';
import { useBulletinConfig } from '@/hooks/useBulletinConfig';
import { isFactureContract } from '@/lib/facture-contract-types';
import { presentSalaryProrata } from '@/lib/bulletin-salary-prorata';
import { authService } from '@/lib/services/authService';
import type { BulletinPayroll } from '@/types/bulletin-template';
import type { DocLayout } from '@/types/document-layout';

const EnginePayslip = dynamic(() => import('@/components/DocumentRenderer/EnginePayslip'), { ssr: false });
const CompanyEnginePayslip = dynamic(() => import('@/components/DocumentRenderer/CompanyEnginePayslip'), { ssr: false });

interface Props {
  payroll:      BulletinPayroll;
  previewMode?: boolean;
  documentLayout?: DocLayout;
  resolveCompanyLayout?: boolean;
}

export default function BulletinDisplay({ payroll: rawPayroll, previewMode = false, documentLayout, resolveCompanyLayout = true }: Props) {
  const { config, isLoading } = useBulletinConfig();

  // ✅ Option entreprise « salaire de base proratisé » : fusion SAL_BASE +
  // ABS_DEDUCT À L'AFFICHAGE uniquement (rien n'est modifié en base). Appliquée
  // ici, une seule fois, donc valable pour tous les gabarits, le mode canvas,
  // l'impression par lot et « Ma paie ». Sans effet si l'option est désactivée.
  const payroll = React.useMemo(() => presentSalaryProrata(rawPayroll), [rawPayroll]);

  // ── Routage facture — avant tout le reste, indépendant du mode
  //    template/canvas puisque ça concerne le TYPE de document, pas son style.
  if (isFactureContract(payroll.employee?.contractType)) {
    return <FactureDisplay payroll={payroll} previewMode={previewMode} />;
  }

  function fallback() {
    const engineLayout = documentLayout ?? (config.mode === 'engine' ? config.documentLayout : undefined);
    if (engineLayout?.docType === 'PAYSLIP') {
      return <EnginePayslip layout={engineLayout} payroll={payroll} />;
    }

    if (isLoading) {
      return (
        <div style={{ display:'flex', alignItems:'center', justifyContent:'center', padding:'40px', background:'#fff' }}>
          <div style={{ width:28, height:28, borderRadius:'50%', border:'3px solid #e2e8f0', borderTopColor:'#0EA5E9', animation:'spin .8s linear infinite' }} />
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
      );
    }

    if (config.mode === 'canvas') {
      return (
        <CanvasRenderer
          layout={config.canvasLayout}
          payroll={payroll}
          previewMode={previewMode}
        />
      );
    }

    // Default/Clarifié/Classique sont 3 GABARITS différents (mise en page
    // distincte, pas juste une palette de couleurs) — ce switch route vers le
    // bon renderer selon le modèle choisi en paramètres.
    const templateId = config.templateConfig?.templateId;
    if (templateId === 'clarifie') {
      return (
        <BulletinRendererClarifie
          payroll={payroll}
          template={config.templateConfig}
          previewMode={previewMode}
        />
      );
    }
    if (templateId === 'classique') {
      return (
        <BulletinRendererClassique
          payroll={payroll}
          template={config.templateConfig}
          previewMode={previewMode}
        />
      );
    }
    if (templateId === 'inf') {
      return (
        <BulletinRendererInf
          payroll={payroll}
          template={config.templateConfig}
          previewMode={previewMode}
        />
      );
    }

    return (
      <BulletinRenderer
        payroll={payroll}
        template={config.templateConfig}
        previewMode={previewMode}
      />
    );
  }

  const companyId = payroll.company?.id ?? payroll.companyId;
  if (!documentLayout && resolveCompanyLayout && companyId && companyId === authService.getCurrentUser()?.companyId) {
    return <CompanyEnginePayslip key={companyId} companyId={companyId} payroll={payroll} fallback={fallback()} />;
  }
  return fallback();
}
