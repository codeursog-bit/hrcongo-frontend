'use client';
import { AttendanceModuleFrame as ModulePageFrame } from '@/components/attendance/AttendanceModuleFrame';
import { ModulePageSkeleton } from '@/components/requests/ModulePageFrame';

// 📁 app/(dashboard)/presences/permissions/historique/page.tsx
// ✅ Historique des permissions — tous les tickets avec circuit de traitement.

import React, { useEffect, useState } from 'react';
import PresenceModuleSwitcher from '@/components/PresenceModuleSwitcher';
import PermissionsSubNav from '@/components/PermissionsSubNav';
import RequestHistoryView from '@/components/request-history/RequestHistoryView';

export default function PermissionsHistoryPage() {
  const [userRole, setUserRole] = useState('');
  useEffect(() => {
    try { const s = localStorage.getItem('user'); if (s) setUserRole(JSON.parse(s).role || ''); } catch {}
  }, []);
  return (
    <ModulePageFrame kind="list"><div className="max-w-[1500px] mx-auto pb-24 space-y-5">
      <PresenceModuleSwitcher />
      <PermissionsSubNav userRole={userRole} />
      <RequestHistoryView kind="permission" />
    </div></ModulePageFrame>
  );
}
