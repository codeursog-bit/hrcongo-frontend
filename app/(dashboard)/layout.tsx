'use client';

import React from 'react';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { PWAProvider } from '@/contexts/PWAContext';
import { OfflineBanner } from '@/components/pwa/OfflineBanner';
import { attendanceApi } from '@/services/attendance-api';
import { InstallPrompt } from '@/components/pwa/InstallPrompt';
import { PendingActions } from '@/components/pwa/PendingActions';
import { ContractExpiryToast } from '@/components/contracts/ContractExpiryToast'; // 🆕
import { useAuth } from '@/hooks/useAuth'; // 🆕 adapte le chemin si différent

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { userRole } = useAuth(); // 🆕

  return (
    <PWAProvider apiClient={attendanceApi}>
      <OfflineBanner />
      <InstallPrompt />
      <PendingActions />

      {/* 🆕 Alertes contrats expirants — bas droite, Admin/HR uniquement */}
      <ContractExpiryToast userRole={userRole ?? ''} />

      <DashboardShell>
        {children}
      </DashboardShell>
    </PWAProvider>
  );
}