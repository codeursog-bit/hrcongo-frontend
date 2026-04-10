
// 'use client';

// import React, { useEffect } from 'react';
// import { useRouter, usePathname } from 'next/navigation';
// import { DashboardShell } from '@/components/layout/DashboardShell';
// import { PWAProvider } from '@/contexts/PWAContext';
// import { OfflineBanner } from '@/components/pwa/OfflineBanner';
// import { attendanceApi } from '@/services/attendance-api';
// import { InstallPrompt } from '@/components/pwa/InstallPrompt';
// import { PendingActions } from '@/components/pwa/PendingActions';
// import { ContractExpiryToast } from '@/components/contracts/ContractExpiryToast';
// import PushNotificationBanner from '@/components/PushNotificationBanner';
// import { useAuth } from '@/hooks/useAuth';

// export default function DashboardLayout({ children }: { children: React.ReactNode }) {
//   const { userRole } = useAuth();
//   const router   = useRouter();
//   const pathname = usePathname();

//   // Les routes /cabinet/... ont leur propre layout — ne pas les intercepter
//   const isCabinetRoute = pathname?.startsWith('/cabinet/') ?? false;

//   useEffect(() => {
//     if (isCabinetRoute) return; // ← ne jamais rediriger si déjà sur /cabinet/
//     if (userRole === 'CABINET_ADMIN' || userRole === 'CABINET_GESTIONNAIRE') {
//       const user = JSON.parse(localStorage.getItem('user') || '{}');
//       if (user.cabinetId) {
//         router.replace(`/cabinet/${user.cabinetId}/dashboard`);
//       } else {
//         router.replace('/auth/login');
//       }
//     }
//   }, [userRole, router, isCabinetRoute]);

//   // Écran blanc pendant redirection (uniquement hors routes cabinet)
//   if (!isCabinetRoute &&
//       (userRole === 'CABINET_ADMIN' || userRole === 'CABINET_GESTIONNAIRE')) {
//     return null;
//   }

//   // Routes cabinet : pas de DashboardShell, juste les children
//   if (isCabinetRoute) {
//     return <>{children}</>;
//   }
  
//   // Récupérer le prénom de l'utilisateur connecté pour personnaliser le message
//   let userName: string | undefined;
//   if (typeof window !== 'undefined') {
//     try {
//       const stored = localStorage.getItem('user');
//       if (stored) {
//         const user = JSON.parse(stored);
//         userName = user.firstName;
//       }
//     } catch { /* silencieux */ }
//   }

//   // Routes dashboard normales
//   return (
//     <PWAProvider apiClient={attendanceApi}>
//       <OfflineBanner />
//       <InstallPrompt />
//       <PendingActions />
//       <ContractExpiryToast userRole={userRole ?? ''} />
//       <PushNotificationBanner userName={userName} />
//       <DashboardShell>
//         {children}
//       </DashboardShell>
//     </PWAProvider>
//   );
// }
                                                         
          
'use client';

// app/(dashboard)/layout.tsx — VERSION MISE À JOUR
// Ajoute redirect PME (/pme/) en plus du redirect cabinet déjà existant

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
  const router       = useRouter();
  const pathname     = usePathname();

  // Ces routes ont leur propre layout — ne JAMAIS intercepter
  const isCabinetRoute = pathname?.startsWith('/cabinet/') ?? false;
  const isPmeRoute     = pathname?.startsWith('/pme/')     ?? false;
  const isSpecialRoute = isCabinetRoute || isPmeRoute;

  useEffect(() => {
    if (isSpecialRoute) return;

    const user = (() => {
      try { return JSON.parse(localStorage.getItem('user') || '{}'); }
      catch { return {}; }
    })();

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
  }, [userRole, router, isSpecialRoute]);

  // Blanc pendant redirect
  if (!isSpecialRoute) {
    const user = (() => {
      try { return JSON.parse(localStorage.getItem('user') || '{}'); } catch { return {}; }
    })();
    if (
      userRole === 'CABINET_ADMIN' ||
      userRole === 'CABINET_GESTIONNAIRE' ||
      user.managedByCabinet
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
      <DashboardShell>{children}</DashboardShell>
    </PWAProvider>
  );
}