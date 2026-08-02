'use client';

// ============================================================================
// 📁 app/(dashboard)/conges/analyse/page.tsx
// ✅ "Analyse des congés" — même moteur que le suivi des absences, mais
//    restreint aux congés (module Leave uniquement — pas de permissions ni
//    d'absences injustifiées). scope="leave".
// ============================================================================

import React, { useEffect, useState } from 'react';
import { authService } from '@/lib/services/authService';
import CongeSubNav from '@/components/CongeSubNav';
import AbsenceAnalyticsBoard from '@/components/absence-analytics/AbsenceAnalyticsBoard';

export default function AnalyseCongesPage() {
  const [userRole, setUserRole] = useState('');

  useEffect(() => {
    const user = authService.getCurrentUser();
    if (user?.role) setUserRole(user.role);
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
      <div className="mb-1">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Analyse des congés</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Calendrier, tableau de bord et tendances pluriannuelles — congés payés, maladie, maternité/paternité, sans solde et anticipés
        </p>
      </div>

      <CongeSubNav userRole={userRole} />

      <AbsenceAnalyticsBoard scope="leave" />
    </div>
  );
}
