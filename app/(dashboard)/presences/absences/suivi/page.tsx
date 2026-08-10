'use client';

// ============================================================================
// 📁 app/(dashboard)/presences/absences/suivi/page.tsx
// ✅ "Suivi des absences" — utilise le moteur partagé AbsenceAnalyticsBoard,
//    scope="absence_request" (demandes d'absence : maladie, conventionnelle,
//    exceptionnelle, non justifiée — distinct des congés statutaires qui
//    ont leur propre page /conges/analyse avec scope="leave").
// ============================================================================

import React, { useEffect, useState } from 'react';
import PresenceModuleSwitcher from '@/components/PresenceModuleSwitcher';
import AbsenceSubNav from '@/components/AbsenceSubNav';
import AbsenceAnalyticsBoard from '@/components/absence-analytics/AbsenceAnalyticsBoard';

export default function AbsencesSuiviPage() {
  const [userRole, setUserRole] = useState('');

  useEffect(() => {
    try {
      const stored = localStorage.getItem('user');
      if (stored) setUserRole(JSON.parse(stored).role || '');
    } catch {}
  }, []);

  return (
    <div className="max-w-[1500px] mx-auto pb-24 space-y-6">
      <PresenceModuleSwitcher />
      <AbsenceSubNav userRole={userRole} />

      <div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Suivi des absences</h1>
        <p className="text-sm text-gray-500">Qui s&apos;absente, pour quel motif, sur quelle période, payé ou non.</p>
      </div>

      <AbsenceAnalyticsBoard scope="absence_request" />
    </div>
  );
}