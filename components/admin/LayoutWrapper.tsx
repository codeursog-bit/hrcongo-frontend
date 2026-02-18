'use client';

import React, { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { adminService } from '@/lib/services/adminService';
import { authService } from '@/lib/services/authService';

export const LayoutWrapper = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [headerStats, setHeaderStats] = useState<any>(null);

  // ✅ Pages publiques (login/register)
  const publicPages = ['/admin/login', '/admin/register'];
  const isPublicPage = publicPages.includes(pathname);

  useEffect(() => {
    // ✅ Ne pas vérifier l'auth sur les pages publiques
    if (isPublicPage) {
      setIsAuthorized(true);
      return;
    }

    // Vérifier l'authentification
    const user = authService.getCurrentUser();
    const token = authService.getToken();
    
    if (!token || !user) {
      setIsAuthorized(false);
      router.push('/admin/login');
      return;
    }

    // Vérifier que c'est bien un Super Admin
    if (user.role !== 'SUPER_ADMIN') {
      setIsAuthorized(false);
      authService.logout();
      router.push('/admin/login');
      return;
    }

    setIsAuthorized(true);
  }, [pathname, router, isPublicPage]);

  useEffect(() => {
    if (isAuthorized && !isPublicPage) {
      loadHeaderStats();
    }
  }, [isAuthorized, isPublicPage]);

  const loadHeaderStats = async () => {
    try {
      const stats: any = await adminService.getDashboardStats();
      setHeaderStats({
        totalCompanies: stats.totalCompanies,
        totalUsers: stats.totalUsers,
        totalMRR: stats.totalMRR,
        growth: 12.5
      });
    } catch (err) {
      console.error('Erreur stats header:', err);
    }
  };

  // ✅ Affichage pendant la vérification
  if (isAuthorized === null && !isPublicPage) {
    return (
      <div className="h-screen bg-[#0B0F19] flex items-center justify-center">
        <div className="text-white">Vérification...</div>
      </div>
    );
  }

  // ✅ Pages publiques : afficher sans Header/Sidebar
  if (isPublicPage) {
    return (
      <div className="h-screen bg-[#0B0F19]">
        {children}
      </div>
    );
  }

  // ✅ Pages protégées : afficher avec Header/Sidebar
  return (
    <div className="h-screen bg-[#0B0F19] flex flex-col">
      <Header stats={headerStats} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar recentActivity={[]} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 scroll-smooth custom-scrollbar relative">
          <div className="max-w-[1600px] mx-auto min-h-full pb-10">
             {children}
          </div>
        </main>
      </div>
    </div>
  );
};