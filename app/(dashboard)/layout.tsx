// 'use client';

// import React from 'react';
// import { DashboardShell } from '@/components/layout/DashboardShell';
// import { PWAProvider } from '@/contexts/PWAContext';
// import { OfflineBanner } from '@/components/pwa/OfflineBanner';
// import { attendanceApi } from '@/services/attendance-api';
// import { InstallPrompt } from '@/components/pwa/InstallPrompt';
// import { PendingActions } from '@/components/pwa/PendingActions';
// import { ContractExpiryToast } from '@/components/contracts/ContractExpiryToast'; // 🆕
// import { useAuth } from '@/hooks/useAuth'; // 🆕 adapte le chemin si différent

// export default function DashboardLayout({ children }: { children: React.ReactNode }) {
//   const { userRole } = useAuth(); // 🆕

//   return (
//     <PWAProvider apiClient={attendanceApi}>
//       <OfflineBanner />
//       <InstallPrompt />
//       <PendingActions />

//       {/* 🆕 Alertes contrats expirants — bas droite, Admin/HR uniquement */}
//       <ContractExpiryToast userRole={userRole ?? ''} />

//       <DashboardShell>
//         {children}
//       </DashboardShell>
//     </PWAProvider>
//   );
// }


// =============================================================================
// FICHIER : app/(dashboard)/layout.tsx
// ACTION  : REMPLACER le fichier existant app/(dashboard)/layout.tsx
// CHANGES : Ajout d'un guard qui redirige les rôles cabinet vers leur espace
//           (ils ne doivent pas accéder au dashboard entreprise)
// =============================================================================

'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { PWAProvider } from '@/contexts/PWAContext';
import { OfflineBanner } from '@/components/pwa/OfflineBanner';
import { attendanceApi } from '@/services/attendance-api';
import { InstallPrompt } from '@/components/pwa/InstallPrompt';
import { PendingActions } from '@/components/pwa/PendingActions';
import { ContractExpiryToast } from '@/components/contracts/ContractExpiryToast';
import { useAuth } from '@/hooks/useAuth';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { userRole } = useAuth();
  const router = useRouter();

  // ── AJOUT : Guard cabinet ─────────────────────────────────────────────────
  // Si un CABINET_ADMIN ou CABINET_GESTIONNAIRE atterrit sur le dashboard
  // entreprise par erreur, on le redirige vers son espace cabinet.
  useEffect(() => {
    if (userRole === 'CABINET_ADMIN' || userRole === 'CABINET_GESTIONNAIRE') {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      if (user.cabinetId) {
        router.replace(`/cabinet/${user.cabinetId}/dashboard`);
      } else {
        router.replace('/auth/login');
      }
    }
  }, [userRole, router]);

  // Pendant la redirection, ne rien afficher
  if (userRole === 'CABINET_ADMIN' || userRole === 'CABINET_GESTIONNAIRE') {
    return null;
  }
  // ── FIN AJOUT ─────────────────────────────────────────────────────────────

  return (
    <PWAProvider apiClient={attendanceApi}>
      <OfflineBanner />
      <InstallPrompt />
      <PendingActions />

      {/* Alertes contrats expirants — bas droite, Admin/HR uniquement */}
      <ContractExpiryToast userRole={userRole ?? ''} />

      <DashboardShell>
        {children}
      </DashboardShell>
    </PWAProvider>
  );
}