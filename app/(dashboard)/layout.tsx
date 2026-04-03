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


'use client';

import React, { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
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
  const router   = useRouter();
  const pathname = usePathname();

  // Les routes /cabinet/... ont leur propre layout — ne pas les intercepter
  const isCabinetRoute = pathname?.startsWith('/cabinet/') ?? false;

  useEffect(() => {
    if (isCabinetRoute) return; // ← ne jamais rediriger si déjà sur /cabinet/
    if (userRole === 'CABINET_ADMIN' || userRole === 'CABINET_GESTIONNAIRE') {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      if (user.cabinetId) {
        router.replace(`/cabinet/${user.cabinetId}/dashboard`);
      } else {
        router.replace('/auth/login');
      }
    }
  }, [userRole, router, isCabinetRoute]);

  // Écran blanc pendant redirection (uniquement hors routes cabinet)
  if (!isCabinetRoute &&
      (userRole === 'CABINET_ADMIN' || userRole === 'CABINET_GESTIONNAIRE')) {
    return null;
  }

  // Routes cabinet : pas de DashboardShell, juste les children
  if (isCabinetRoute) {
    return <>{children}</>;
  }

  // Routes dashboard normales
  return (
    <PWAProvider apiClient={attendanceApi}>
      <OfflineBanner />
      <InstallPrompt />
      <PendingActions />
      <ContractExpiryToast userRole={userRole ?? ''} />
      <DashboardShell>
        {children}
      </DashboardShell>
    </PWAProvider>
  );
}
                                                         
          
