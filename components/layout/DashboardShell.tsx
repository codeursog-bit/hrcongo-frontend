'use client';

// components/layout/DashboardShell.tsx
// ✅ Accepte des props white-label optionnelles et les transmet à <Sidebar>
// → En mode Konza normal : aucun changement de comportement
// → En mode PME cabinet (depuis PmeLayout) : Sidebar affiche le logo/nom du cabinet

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Sidebar } from './Sidebar';
import { ChatProvider } from '@/components/chat/ChatProvider';
import { TopNav } from './TopNav';
import { KonzaLoader } from '@/components/ui/KonzaLoader';
import { authService } from '@/lib/services/authService';
import { ToastProvider } from '@/components/design-system/feedback';
import { DemoBadge } from '@/components/providers/DemoProvider';
import { CompanyBrandProvider } from './CompanyBrand';
import { AssistantProvider } from '@/components/assistant/AssistantProvider';
import './shell.css';
import '@/components/ui/select.css';

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
  const pathname = usePathname() || '';
  useEffect(() => setSidebarOpen(false), [pathname]);
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

    if (user.role === 'SUPER_ADMIN' || user.role === 'SUPPORT') {
      router.push(user.role === 'SUPPORT' ? '/admin/support' : '/admin');
      return;
    }

    setIsAuthorized(true);
  }, [router, skipAuthCheck]);

  if (isAuthorized === null) {
    return (
      <KonzaLoader variant="screen" logoSrc={brandLogo} label="Vérification…" />
    );
  }

  if (!isAuthorized) return null;

  return (
    <ToastProvider><CompanyBrandProvider enabled={!brandName && !brandLogo}><ChatProvider><AssistantProvider>
    <div className={`konza-shell ${brandName || brandLogo ? 'shell-brand-legacy' : ''} flex h-screen font-sans overflow-hidden relative`} style={{ background: 'var(--bg)', color: 'var(--text)' }}>
      <a href="#konza-main" className="shell-skip-link">Aller au contenu</a>
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

        <main id="konza-main" tabIndex={-1} className="shell-main flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 scroll-smooth custom-scrollbar">
          <DemoBadge />
          {children}
        </main>
      </div>
    </div>
    </AssistantProvider></ChatProvider></CompanyBrandProvider></ToastProvider>
  );
};
