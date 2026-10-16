'use client';

// ============================================================================
// 📁 app/(dashboard)/portefeuille/effectifs/page.tsx
// Tableau de bord effectifs du portefeuille — modèle POWERMAN.
// Toutes les entreprises ou une seule ; période mois / plage / année ;
// téléchargement Excel depuis ce même écran.
// ============================================================================

import React from 'react';
import { WorkforceDashboard } from '@/components/workforce/WorkforceDashboard';

export default function PortfolioWorkforcePage() {
  return (
    <div className="space-y-6 min-h-screen pb-20">
      <div>
        <h1 className="text-3xl font-bold tracking-tight" style={{ color: 'var(--text)' }}>Tableau de bord effectifs</h1>
        <p className="mt-1" style={{ color: 'var(--text-muted)' }}>
          Effectifs, répartitions et indicateurs sociaux de votre portefeuille — exportables en Excel (modèle POWERMAN).
        </p>
      </div>
      <WorkforceDashboard model="POWERMAN" scope="PORTFOLIO" title="Gestion des effectifs" />
    </div>
  );
}