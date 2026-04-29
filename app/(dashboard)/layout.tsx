'use client';

// app/(dashboard)/layout.tsx
// Attend que useAuth ait fini de vérifier le cookie avant de rediriger

import React, { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { PWAProvider } from '@/contexts/PWAContext';
import { OfflineBanner } from '@/components/pwa/OfflineBanner';
import { attendanceApi } from '@/services/attendance-api';
import { InstallPrompt } from '@/components/pwa/InstallPrompt';
import { PendingActions } from '@/components/pwa/PendingActions';
import { ContractExpiryToast } from '@/components/contracts/ContractExpiryToast';
import OnboardingChecklist from '@/components/onboarding/OnboardingChecklist';
import { useAuth } from '@/hooks/useAuth';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  // ✅ FIX CRITIQUE : récupérer "loading" depuis useAuth
  // Sans ça, on lit le user AVANT que /auth/verify ait répondu → redirect sauvage
  const { userRole, user, loading } = useAuth();
  const router   = useRouter();
  const pathname = usePathname();

  // Ces routes ont leur propre layout — ne JAMAIS intercepter
  const isCabinetRoute = pathname?.startsWith('/cabinet/') ?? false;
  const isPmeRoute     = pathname?.startsWith('/pme/')     ?? false;
  const isSpecialRoute = isCabinetRoute || isPmeRoute;

  useEffect(() => {
    // ✅ Attendre que useAuth ait fini (verify + éventuel refresh)
    if (loading)          return;
    if (isSpecialRoute)   return;
    if (!user)            return; // pas encore de user → pas de redirect ici

    // ── Cabinet → /cabinet/[id]/dashboard ──────────────────────────────────
    if (userRole === 'CABINET_ADMIN' || userRole === 'CABINET_GESTIONNAIRE') {
      if (user.cabinetId) {
        router.replace(`/cabinet/${user.cabinetId}/dashboard`);
      } else {
        router.replace('/auth/login');
      }
      return;
    }

    // ── Admin PME géré par cabinet → /pme/[companyId]/dashboard ────────────
    if (user.managedByCabinet && user.companyId) {
      const dest = userRole === 'EMPLOYEE'
        ? `/pme/${user.companyId}/conges/mon-espace`
        : `/pme/${user.companyId}/dashboard`;
      router.replace(dest);
      return;
    }
  }, [userRole, user, loading, router, isSpecialRoute]);

  // ✅ Blanc pendant le chargement initial (évite un flash de redirect)
  if (loading) return null;

  // Blanc pendant redirect cabinet/pme
  if (!isSpecialRoute) {
    if (
      userRole === 'CABINET_ADMIN' ||
      userRole === 'CABINET_GESTIONNAIRE' ||
      user?.managedByCabinet
    ) {
      return null;
    }
  }

  // Routes /cabinet/ et /pme/ → pas de DashboardShell (layout propre)
  if (isSpecialRoute) return <>{children}</>;

  // Routes dashboard Konza normales
  return (
    <PWAProvider apiClient={attendanceApi}>
      <OfflineBanner />
      <InstallPrompt />
      <PendingActions />
      <ContractExpiryToast userRole={userRole ?? ''} />
     <DashboardShell>
     <OnboardingChecklist />
      {children}
     </DashboardShell>
    </PWAProvider>
  );
}