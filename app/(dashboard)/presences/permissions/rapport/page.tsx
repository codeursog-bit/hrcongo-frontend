'use client';

// ============================================================================
// 📁 app/(dashboard)/presences/permissions/rapport/page.tsx
// ✅ Rapport des permissions — dashboard interactif (KPI + évolution, graphiques
//    cliquables, carte de chaleur, circuit, ponctualité des retours, classement).
// ============================================================================

import React, { useEffect, useState } from 'react';
import PresenceModuleSwitcher from '@/components/PresenceModuleSwitcher';
import PermissionsSubNav from '@/components/PermissionsSubNav';
import RequestReportDashboard from '@/components/request-reports/RequestReportDashboard';

export default function PermissionsReportPage() {
  const [userRole, setUserRole] = useState('');
  useEffect(() => {
    try { const s = localStorage.getItem('user'); if (s) setUserRole(JSON.parse(s).role || ''); } catch {}
  }, []);
  return (
    <div className="max-w-[1500px] mx-auto pb-24 space-y-5">
      <PresenceModuleSwitcher />
      <PermissionsSubNav userRole={userRole} />
      <RequestReportDashboard kind="permission" />
    </div>
  );
}
