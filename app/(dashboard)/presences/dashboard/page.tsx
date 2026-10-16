'use client';

// ============================================================================
// 📁 app/(dashboard)/presences/dashboard/page.tsx
// Tableau de bord présences · absences · permissions de l'entreprise.
// Réservé ADMIN / SUPER_ADMIN / HR_MANAGER (le back refuse aussi les autres rôles).
// Même page en contexte PME : app/pme/[companyId]/presences/dashboard (ré-export).
// ============================================================================

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { AttendanceDashboard } from '@/components/attendance/AttendanceDashboard';
import PresenceSubNav from '@/components/PresenceSubNav';

const ALLOWED = ['ADMIN', 'SUPER_ADMIN', 'HR_MANAGER'];

export default function AttendanceDashboardPage() {
  const params = useParams();
  const pmeCompanyId = (params?.companyId as string) || '';

  const [userRole, setUserRole] = useState('');
  const [ready, setReady] = useState(false);
  useEffect(() => {
    try {
      const stored = localStorage.getItem('user');
      if (stored) setUserRole(JSON.parse(stored).role || '');
    } catch {}
    setReady(true);
  }, []);

  return (
    <div className="space-y-6 min-h-screen pb-20">
      <PresenceSubNav userRole={userRole} />
      <div>
        <h1 className="text-3xl font-bold tracking-tight" style={{ color: 'var(--text)' }}>Tableau de bord présences & absences</h1>
        <p className="mt-1" style={{ color: 'var(--text-muted)' }}>
          Taux de présence et d’absentéisme, retards, absences et permissions — exportables en Excel.
        </p>
      </div>
      {ready && !ALLOWED.includes(userRole) ? (
        <p className="text-sm text-[var(--text-muted)]">Cette page est réservée aux administrateurs et aux RH.</p>
      ) : (
        ready && <AttendanceDashboard scope="COMPANY" companyId={pmeCompanyId || undefined} />
      )}
    </div>
  );
}
