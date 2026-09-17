'use client';

// app/(dashboard)/portefeuille/layout.tsx
// Layout dédié à l'espace "Mon portefeuille" (admin multi-entreprises).
// Rend sa propre sidebar au lieu du DashboardShell global — même principe
// que /cabinet/[cabinetId] et /pme/[companyId], qui sont exclus du
// DashboardShell dans app/(dashboard)/layout.tsx (voir isSpecialRoute).

import React, { useEffect, useState } from 'react';
import PortfolioSidebar from '@/components/portfolio/PortfolioSidebar';

interface StoredUser {
  name?: string;
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

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      <PortfolioSidebar userName={user?.name} userEmail={user?.email} />
      <main className="ml-[240px] p-6 lg:p-8">
        {children}
      </main>
    </div>
  );
}