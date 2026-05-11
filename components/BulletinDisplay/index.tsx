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
// Props :
//   payroll      — données payroll telles que retournées par l'API
//   previewMode  — true = taille réduite pour preview (pas impression)
// ============================================================================

import React from 'react';
import BulletinRenderer from '@/components/BulletinRenderer';
import CanvasRenderer   from '@/components/CanvasRenderer';
import { useBulletinConfig } from '@/hooks/useBulletinConfig';
import type { BulletinPayroll } from '@/types/bulletin-template';

interface Props {
  payroll:      BulletinPayroll;
  previewMode?: boolean;
}

export default function BulletinDisplay({ payroll, previewMode = false }: Props) {
  const { config, isLoading } = useBulletinConfig();

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

  return (
    <BulletinRenderer
      payroll={payroll}
      template={config.templateConfig}
      previewMode={previewMode}
    />
  );
}
