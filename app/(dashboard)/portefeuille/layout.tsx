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

interface StoredUser {
  firstName?: string;
  lastName?: string;
  email?: string;
}

export default function PortfolioLayout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<StoredUser | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) {
      try { setUser(JSON.parse(stored)); } catch {}
    }
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
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <div className="md:ml-[240px]">
        <PortfolioTopNav
          userName={userName}
          userEmail={user?.email}
          onMenuClick={() => setSidebarOpen(true)}
        />
        <main className="p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}