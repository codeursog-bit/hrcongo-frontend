'use client';

// app/(dashboard)/portefeuille/layout.tsx
// Layout dédié à l'espace "Mon portefeuille" (admin multi-entreprises).
// Rend sa propre sidebar + top bar au lieu du DashboardShell global — même
// principe que /cabinet/[cabinetId] et /pme/[companyId], qui sont exclus du
// DashboardShell dans app/(dashboard)/layout.tsx (voir isSpecialRoute).

import React, { useEffect, useState } from 'react';
import PortfolioSidebar from '@/components/portfolio/PortfolioSidebar';
import PortfolioTopNav from '@/components/portfolio/PortfolioTopNav';

interface StoredUser {
  firstName?: string;
  lastName?: string;
  email?: string;
}

export default function PortfolioLayout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<StoredUser | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) {
      try { setUser(JSON.parse(stored)); } catch {}
    }
  }, []);

  // 🐛 FIX : le user stocké a firstName/lastName, jamais "name" —
  // userName était toujours undefined avant ce correctif.
  const userName = [user?.firstName, user?.lastName].filter(Boolean).join(' ') || undefined;

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      <PortfolioSidebar userName={userName} userEmail={user?.email} />
      <div className="ml-[240px]">
        <PortfolioTopNav userName={userName} userEmail={user?.email} />
        <main className="p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}