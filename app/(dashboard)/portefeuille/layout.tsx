'use client';

// app/(dashboard)/portefeuille/layout.tsx
// Layout dédié à l'espace "Mon portefeuille" (admin multi-entreprises).
// Rend sa propre sidebar + top bar au lieu du DashboardShell global — même
// principe que /cabinet/[cabinetId] et /pme/[companyId], qui sont exclus du
// DashboardShell dans app/(dashboard)/layout.tsx (voir isSpecialRoute).
// 🆕 Responsive : sidebar hors-écran sur mobile/tablette, ouverte via le
// bouton menu de la top bar ; marge gauche uniquement à partir de md:.

import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import PortfolioSidebar from '@/components/portfolio/PortfolioSidebar';
import PortfolioTopNav from '@/components/portfolio/PortfolioTopNav';
import { api } from '@/services/api';

interface StoredUser {
  firstName?: string;
  lastName?: string;
  email?: string;
}

export default function PortfolioLayout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<StoredUser | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  // 🆕 Photo de la fiche employé (si l'admin multi-comptes est aussi
  // employé quelque part) — reste undefined sinon, et la sidebar/le header
  // retombent alors sur l'avatar avec initiales (comportement inchangé).
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

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      <PortfolioSidebar
        userName={userName}
        userEmail={user?.email}
        userPhotoUrl={userPhotoUrl}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <div className="md:ml-[240px]">
        <PortfolioTopNav
          userName={userName}
          userEmail={user?.email}
          userPhotoUrl={userPhotoUrl}
          onMenuClick={() => setSidebarOpen(true)}
        />
        <main className="p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}