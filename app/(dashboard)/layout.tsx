'use client';

import React from 'react';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { PWAProvider } from '@/contexts/PWAContext';
import { OfflineBanner } from '@/components/pwa/OfflineBanner';
import { attendanceApi } from '@/services/attendance-api';
import { InstallPrompt } from '@/components/pwa/InstallPrompt';
import { PendingActions } from '@/components/pwa/PendingActions';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <PWAProvider apiClient={attendanceApi}>
      <OfflineBanner />
      {/* Popup d'installation (apparaît après 10s) */}
      <InstallPrompt />

      {/* Badge actions en attente (bas droite) */}
      <PendingActions />
      <DashboardShell>
        {children}
      </DashboardShell>
    </PWAProvider>
  );
}


// 'use client';

// import React from 'react';
// import { DashboardShell } from '@/components/layout/DashboardShell';

// export default function DashboardLayout({
//   children,
// }: {
//   children: React.ReactNode;
// }) {
//   return (
//     <DashboardShell>
//       {children}
//     </DashboardShell>
//   );
// }


