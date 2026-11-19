'use client';
import { AttendanceModuleFrame as ModulePageFrame } from '@/components/attendance/AttendanceModuleFrame';
import { ModulePageSkeleton } from '@/components/requests/ModulePageFrame';

// ============================================================================
// 📁 app/(dashboard)/presences/absences/rapport/page.tsx
// ✅ Rapport des demandes d'absence — dashboard interactif.
// ============================================================================

import React, { useEffect, useState } from 'react';
import PresenceModuleSwitcher from '@/components/PresenceModuleSwitcher';
import AbsenceSubNav from '@/components/AbsenceSubNav';
import RequestReportDashboard from '@/components/request-reports/RequestReportDashboard';

export default function AbsencesReportPage() {
  const [userRole, setUserRole] = useState('');
  useEffect(() => {
    try { const s = localStorage.getItem('user'); if (s) setUserRole(JSON.parse(s).role || ''); } catch {}
  }, []);
  return (
    <ModulePageFrame kind="dashboard"><div className="max-w-[1500px] mx-auto pb-24 space-y-5">
      <PresenceModuleSwitcher />
      <AbsenceSubNav userRole={userRole} />
      <RequestReportDashboard kind="absence" />
    </div></ModulePageFrame>
  );
}
