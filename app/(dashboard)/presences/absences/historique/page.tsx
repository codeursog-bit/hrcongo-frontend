'use client';
import { AttendanceModuleFrame as ModulePageFrame } from '@/components/attendance/AttendanceModuleFrame';
import { ModulePageSkeleton } from '@/components/requests/ModulePageFrame';

// 📁 app/(dashboard)/presences/absences/historique/page.tsx
// ✅ Historique des demandes d'absence — circuit de traitement, filtres, export.

import React, { useEffect, useState } from 'react';
import PresenceModuleSwitcher from '@/components/PresenceModuleSwitcher';
import AbsenceSubNav from '@/components/AbsenceSubNav';
import RequestHistoryView from '@/components/request-history/RequestHistoryView';

export default function AbsencesHistoryPage() {
  const [userRole, setUserRole] = useState('');
  useEffect(() => {
    try { const s = localStorage.getItem('user'); if (s) setUserRole(JSON.parse(s).role || ''); } catch {}
  }, []);
  return (
    <ModulePageFrame kind="list"><div className="max-w-[1500px] mx-auto pb-24 space-y-5">
      <PresenceModuleSwitcher />
      <AbsenceSubNav userRole={userRole} />
      <RequestHistoryView kind="absence" />
    </div></ModulePageFrame>
  );
}
