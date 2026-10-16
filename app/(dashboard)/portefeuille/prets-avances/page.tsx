'use client';

// ============================================================================
// 📁 app/(dashboard)/portefeuille/prets-avances/page.tsx
// Tableau de bord prêts · avances du portefeuille.
// Toutes les entreprises ou une seule ; période mois / plage / année ;
// téléchargement Excel depuis ce même écran.
// ============================================================================

import React from 'react';
import { LoansDashboard } from '@/components/loans/LoansDashboard';

export default function PortfolioLoansDashboardPage() {
  return (
    <div className="space-y-6 min-h-screen pb-20">
      <div>
        <h1 className="text-3xl font-bold tracking-tight" style={{ color: 'var(--text)' }}>Prêts & avances — tableau de bord</h1>
        <p className="mt-1" style={{ color: 'var(--text-muted)' }}>
          Montants accordés, remboursements, taux de remboursement et dettes en cours de votre portefeuille — exportables en Excel.
        </p>
      </div>
      <LoansDashboard scope="PORTFOLIO" title="Prêts et avances" />
    </div>
  );
}