'use client';

// ============================================================================
// 📁 app/(dashboard)/presences/absences/suivi/page.tsx
// ✅ "Suivi des absences" — vue complète (congés + permissions + absences
//    injustifiées), dans le module Présences. Le contenu vient du composant
//    partagé AbsenceAnalyticsBoard (scope="all").
// ============================================================================

import React, { useEffect, useState } from 'react';
import { authService } from '@/lib/services/authService';
import PresenceModuleSwitcher from '@/components/PresenceModuleSwitcher';
import AbsenceSubNav from '@/components/AbsenceSubNav';
import AbsenceAnalyticsBoard from '@/components/absence-analytics/AbsenceAnalyticsBoard';

export default function SuiviAbsencesPage() {
  const [userRole, setUserRole] = useState('');

  useEffect(() => {
    const user = authService.getCurrentUser();
    if (user?.role) setUserRole(user.role);
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
      <div className="mb-1">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Suivi des absences</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Vue d&apos;ensemble des congés, permissions et absences — calendrier, tableau de bord et tendances pluriannuelles
        </p>
      </div>

      <PresenceModuleSwitcher />
      <AbsenceSubNav userRole={userRole} />

      <AbsenceAnalyticsBoard scope="all" />
    </div>
  );
}
