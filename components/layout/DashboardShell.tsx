'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from './Sidebar';
import { TopNav } from './TopNav';
import { authService } from '@/lib/services/authService';

interface DashboardShellProps {
  children: React.ReactNode;
}

export const DashboardShell: React.FC<DashboardShellProps> = ({ children }) => {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    const user = authService.getCurrentUser();
    const token = authService.getToken();
    
    if (!token || !user) {
      setIsAuthorized(false);
      router.push('/auth/login');
      return;
    }

    // ✅ Bloquer les SUPER_ADMIN (ils vont sur /admin)
    if (user.role === 'SUPER_ADMIN') {
      router.push('/admin');
      return;
    }

    setIsAuthorized(true);
  }, [router]);

  // ✅ Écran de chargement pendant la vérification
  if (isAuthorized === null) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50 dark:bg-[#020617]">
        <div className="text-slate-900 dark:text-slate-100">Vérification...</div>
      </div>
    );
  }

  // ✅ Si non autorisé, ne rien afficher (redirection en cours)
  if (!isAuthorized) {
    return null;
  }

  // ✅ Afficher le dashboard normal
  return (
    <div className="flex h-screen font-sans text-slate-900 dark:text-slate-100 overflow-hidden relative bg-gray-50 dark:bg-[#020617]">
      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0 h-full relative z-10 transition-all duration-300">
        <TopNav 
          onMenuClick={() => setSidebarOpen(true)} 
        />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 scroll-smooth custom-scrollbar">
          {children}
        </main>
      </div>
    </div>
  );
};