'use client';

import React, { useEffect, useState } from 'react';
import { usePathname, useRouter }      from 'next/navigation';
import { Sidebar }                     from './Sidebar';
import { Header }                      from './Header';
import { adminService }                from '@/lib/services/adminService';
import { authService }                 from '@/lib/services/authService';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// ─── Vérifie le cookie HttpOnly via /auth/verify + refresh si besoin ─────────
async function verifyCookie(): Promise<boolean> {
  try {
    // 1. Vérifier l'access_token courant
    const res = await fetch(`${API_URL}/auth/verify`, {
      method:      'POST',
      credentials: 'include',
    });

    if (res.ok) return true;

    if (res.status === 401) {
      // 2. Tenter un refresh silencieux
      const refreshRes = await fetch(`${API_URL}/auth/refresh`, {
        method:      'POST',
        credentials: 'include',
      });

      if (refreshRes.ok) {
        // 3. Re-vérifier avec le nouveau cookie
        const verify2 = await fetch(`${API_URL}/auth/verify`, {
          method:      'POST',
          credentials: 'include',
        });
        return verify2.ok;
      }
    }
  } catch { /* réseau indisponible → pas autorisé */ }

  return false;
}

export const LayoutWrapper = ({ children }: { children: React.ReactNode }) => {
  const pathname  = usePathname();
  const router    = useRouter();
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [headerStats,  setHeaderStats]  = useState<any>(null);

  const publicPages = ['/admin/login', '/admin/register'];
  const isPublicPage = publicPages.includes(pathname);

  useEffect(() => {
    if (isPublicPage) {
      // Sur la page login : nettoyer localStorage uniquement
      if (typeof window !== 'undefined') {
        localStorage.removeItem('user');
        localStorage.removeItem('admin_user');
      }
      setIsAuthorized(true);
      return;
    }

    // ── Vérification en 2 temps ───────────────────────────────────────────
    // 1. Vérification rapide localStorage (évite un écran blanc inutile)
    const user  = authService.getCurrentUser();
    const token = authService.getToken(); // truthy si user en localStorage

    if (!token || !user) {
      setIsAuthorized(false);
      router.push('/admin/login');
      return;
    }

    if (user.role !== 'SUPER_ADMIN') {
      setIsAuthorized(false);
      authService.logout();
      router.push('/admin/login');
      return;
    }

    // 2. Vérification réelle du cookie HttpOnly (évite le faux-positif)
    verifyCookie().then(valid => {
      if (!valid) {
        // Cookie expiré ET refresh échoué → vraiment déconnecté
        localStorage.removeItem('user');
        localStorage.removeItem('admin_user');
        setIsAuthorized(false);
        router.push('/admin/login');
      } else {
        setIsAuthorized(true);
      }
    });
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
        totalUsers:     stats.totalUsers,
        totalMRR:       stats.totalMRR,
        growth:         12.5,
      });
    } catch (err) {
      console.error('Erreur stats header:', err);
    }
  };

  if (isAuthorized === null && !isPublicPage) {
    return (
      <div className="h-screen bg-[#0B0F19] flex items-center justify-center">
        <div className="text-white">Vérification...</div>
      </div>
    );
  }

  if (isPublicPage) {
    return (
      <div className="h-screen bg-[#0B0F19]">
        {children}
      </div>
    );
  }

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