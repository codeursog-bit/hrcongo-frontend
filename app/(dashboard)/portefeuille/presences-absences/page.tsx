'use client';

// ============================================================================
// 📁 app/(dashboard)/portefeuille/presences-absences/page.tsx
// Tableau de bord présences · absences · permissions du portefeuille.
// Toutes les entreprises ou une seule ; période mois / plage / année ;
// téléchargement Excel depuis ce même écran.
// ============================================================================

import React from 'react';
import { AttendanceDashboard } from '@/components/attendance/AttendanceDashboard';

export default function PortfolioAttendanceDashboardPage() {
  return (
    <div className="space-y-6 min-h-screen pb-20">
      <div>
        <h1 className="text-3xl font-bold tracking-tight" style={{ color: 'var(--text)' }}>Présences & absences</h1>
        <p className="mt-1" style={{ color: 'var(--text-muted)' }}>
          Taux de présence et d’absentéisme, retards, absences et permissions de votre portefeuille — exportables en Excel.
        </p>
      </div>
      <AttendanceDashboard scope="PORTFOLIO" title="Présences, absences et permissions" />
    </div>
  );
}
