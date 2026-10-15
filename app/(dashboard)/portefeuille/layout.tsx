'use client';

// app/(dashboard)/portefeuille/layout.tsx
// Layout dédié à l'espace "Mon portefeuille" (admin multi-entreprises).
// Rend sa propre sidebar + top bar au lieu du DashboardShell global — même
// principe que /cabinet/[cabinetId] et /pme/[companyId], qui sont exclus du
// DashboardShell dans app/(dashboard)/layout.tsx (voir isSpecialRoute).
// ✅ Même structure que components/layout/DashboardShell.tsx : écran plein
// (h-screen), sidebar flottante, et le contenu défile dans son propre conteneur.
// Responsive : sidebar en tiroir sur mobile/tablette, ouverte via le bouton menu.

import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import PortfolioSidebar from '@/components/portfolio/PortfolioSidebar';
import PortfolioTopNav from '@/components/portfolio/PortfolioTopNav';
import { api } from '@/services/api';
import PushNotificationBanner from '@/components/PushNotificationBanner';
import { ChatProvider } from '@/components/chat/ChatProvider';

interface StoredUser {
  firstName?: string;
  lastName?: string;
  email?: string;
  role?: string;
}

// Mêmes libellés que la sidebar du dashboard
const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: 'Super Admin',
  ADMIN: 'Admin',
  HR_MANAGER: 'RH',
  MANAGER: 'Manager',
  EMPLOYEE: 'Employé',
};

export default function PortfolioLayout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<StoredUser | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  // 🆕 Photo de la fiche employé (si l'admin multi-comptes est aussi
  // employé quelque part) — reste undefined sinon, et la sidebar/le header
  // retombent alors sur l'avatar généré à partir du nom (comme le dashboard).
  const [userPhotoUrl, setUserPhotoUrl] = useState<string | undefined>(undefined);
  const pathname = usePathname();

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) {
      try { setUser(JSON.parse(stored)); } catch {}
    }
    // GET /employees/me est ouvert à tous les rôles et renvoie proprement un
    // 404 quand la personne n'a pas de fiche employé (cas normal pour un
    // admin qui n'est pas aussi employé) — on l'ignore silencieusement.
    api.get<{ photoUrl?: string }>('/employees/me')
      .then((employee) => setUserPhotoUrl(employee?.photoUrl || undefined))
      .catch(() => {});
  }, []);

  // Referme la sidebar mobile à chaque changement de page
  useEffect(() => { setSidebarOpen(false); }, [pathname]);

  // 🐛 FIX : le user stocké a firstName/lastName, jamais "name" —
  // userName était toujours undefined avant ce correctif.
  const userName = [user?.firstName, user?.lastName].filter(Boolean).join(' ') || undefined;
  const userRoleLabel = user?.role ? (ROLE_LABELS[user.role] ?? user.role) : undefined;

  return (
    // ChatProvider : compteur de messages non lus (sidebar) + page /portefeuille/messages.
    // Il se désactive tout seul si le rôle n'a pas accès au chat.
    <ChatProvider>
    <div className="flex h-screen font-sans overflow-hidden relative" style={{ background: 'var(--bg)', color: 'var(--text)' }}>
      <PortfolioSidebar
        userName={userName}
        userEmail={user?.email}
        userRoleLabel={userRoleLabel}
        userPhotoUrl={userPhotoUrl}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0 h-full relative z-10 transition-all duration-300">
        <PortfolioTopNav
          userName={userName}
          userEmail={user?.email}
          userPhotoUrl={userPhotoUrl}
          onMenuClick={() => setSidebarOpen(true)}
        />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 scroll-smooth custom-scrollbar">
          <PushNotificationBanner />
          {children}
        </main>
      </div>
    </div>
    </ChatProvider>
  );
}