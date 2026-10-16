'use client';

// ============================================================================
// 📁 app/(dashboard)/loans/dashboard/page.tsx
// Tableau de bord prêts · avances de l'entreprise.
// Réservé ADMIN / SUPER_ADMIN / HR_MANAGER (même règle que le module Prêts & avances ;
// le back refuse aussi les autres rôles).
// Même page en contexte PME : app/pme/[companyId]/loans/dashboard (ré-export).
// ============================================================================

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { LoansDashboard } from '@/components/loans/LoansDashboard';
import FinanceSubNav from '@/components/FinanceSubNav';

const ALLOWED = ['ADMIN', 'SUPER_ADMIN', 'HR_MANAGER'];

export default function LoansDashboardPage() {
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
      <FinanceSubNav userRole={userRole} />
      <div>
        <h1 className="text-3xl font-bold tracking-tight" style={{ color: 'var(--text)' }}>Tableau de bord prêts & avances</h1>
        <p className="mt-1" style={{ color: 'var(--text-muted)' }}>
          Montants accordés, remboursements, taux de remboursement et dettes en cours — exportables en Excel.
        </p>
      </div>
      {ready && !ALLOWED.includes(userRole) ? (
        <p className="text-sm text-[var(--text-muted)]">Cette page est réservée aux administrateurs et aux RH.</p>
      ) : (
        ready && <LoansDashboard scope="COMPANY" companyId={pmeCompanyId || undefined} />
      )}
    </div>
  );
}