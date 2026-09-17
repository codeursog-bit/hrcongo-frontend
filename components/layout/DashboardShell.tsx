'use client';

// components/layout/DashboardShell.tsx
// ✅ Accepte des props white-label optionnelles et les transmet à <Sidebar>
// → En mode Konza normal : aucun changement de comportement
// → En mode PME cabinet (depuis PmeLayout) : Sidebar affiche le logo/nom du cabinet

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from './Sidebar';
import { TopNav } from './TopNav';
import { authService } from '@/lib/services/authService';

interface DashboardShellProps {
  children: React.ReactNode;
  brandName?:  string | null;
  brandLogo?:  string | null;
  brandColor?: string | null;
  basePath?: string;
  skipAuthCheck?: boolean;
}

export const DashboardShell: React.FC<DashboardShellProps> = ({
  children,
  brandName,
  brandLogo,
  brandColor,
  basePath,
  skipAuthCheck = false,
}) => {
  const router = useRouter();
  const [sidebarOpen,   setSidebarOpen]   = useState(false);
  const [isAuthorized,  setIsAuthorized]  = useState<boolean | null>(
    skipAuthCheck ? true : null,
  );

  useEffect(() => {
    if (skipAuthCheck) {
      setIsAuthorized(true);
      return;
    }

    const user  = authService.getCurrentUser();
    const token = authService.getToken();

    if (!token || !user) {
      setIsAuthorized(false);
      router.push('/auth/login');
      return;
    }

    if (user.role === 'SUPER_ADMIN') {
      router.push('/admin');
      return;
    }

    setIsAuthorized(true);
  }, [router, skipAuthCheck]);

  if (isAuthorized === null) {
    return (
      <div className="h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
        <div style={{ color: 'var(--text)' }}>Vérification...</div>
      </div>
    );
  }

  if (!isAuthorized) return null;

  return (
    <div className="flex h-screen font-sans overflow-hidden relative" style={{ background: 'var(--bg)', color: 'var(--text)' }}>
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        brandName={brandName}
        brandLogo={brandLogo}
        brandColor={brandColor}
        basePath={basePath}
      />

      <div className="flex-1 flex flex-col min-w-0 h-full relative z-10 transition-all duration-300">
        <TopNav onMenuClick={() => setSidebarOpen(true)} />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 scroll-smooth custom-scrollbar">
          {children}
        </main>
      </div>
    </div>
  );
};