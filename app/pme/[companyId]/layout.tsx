'use client';

// app/pme/[companyId]/layout.tsx
// ✅ Layout PME white-label — utilise le MÊME DashboardShell que Konza Entreprise
// La seule différence : on passe brandName/brandLogo/brandColor du cabinet
// → La Sidebar remplace le logo Konza par celui du cabinet
// → Toutes les autres fonctionnalités (TopNav, notifications, thème) sont identiques

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { api } from '@/services/api';

interface CabinetBranding {
  name:           string;
  logo:           string | null;
  primaryColor:   string;
  secondaryColor: string;
}

export default function PmeLayout({ children }: { children: React.ReactNode }) {
  const params    = useParams();
  const router    = useRouter();
  const companyId = params.companyId as string;

  const [branding,  setBranding]  = useState<CabinetBranding>({
    name: '', logo: null, primaryColor: '#0ea5e9', secondaryColor: '#6366f1',
  });
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('user');
    const user   = stored ? JSON.parse(stored) : {};

    // Vérification accès : l'utilisateur doit appartenir à cette entreprise
    if (user.companyId !== companyId && user.role !== 'SUPER_ADMIN') {
      router.replace('/auth/login');
      return;
    }

    const load = async () => {
      try {
        // 1. Récupérer les infos de l'entreprise
        const comp: any = await api.get(`/companies/${companyId}`);

        // 2. Récupérer le branding du cabinet
        const cabId = user.cabinetId || comp.cabinetId;
        if (cabId) {
          try {
            const cab: any = await api.get(`/cabinet/${cabId}`);
            setBranding({
              name:           cab.name           || '',
              logo:           cab.logo           || null,
              primaryColor:   cab.primaryColor   || '#0ea5e9',
              secondaryColor: cab.secondaryColor || '#6366f1',
            });
          } catch {
            // Cabinet non trouvé → branding vide, Konza par défaut
          }
        }
      } catch {
        // Entreprise non trouvée → redirection login
        router.replace('/auth/login');
        return;
      }

      setReady(true);
    };

    load();
  }, [companyId, router]);

  // Splash pendant le chargement du branding
  if (!ready) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50 dark:bg-[#020617]">
        <div className="w-8 h-8 rounded-full border-2 border-slate-200 dark:border-white/10 border-t-slate-600 dark:border-t-white/60 animate-spin" />
      </div>
    );
  }

  return (
    <DashboardShell
      // ✅ Props white-label : la Sidebar affiche le cabinet au lieu de Konza
      brandName={branding.name   || null}
      brandLogo={branding.logo}
      brandColor={branding.primaryColor}
      // ✅ basePath : tous les liens de nav pointent vers /pme/[companyId]/...
      // Exemple : item.path='/dashboard' → lien='/pme/abc123/dashboard'
      basePath={`/pme/${companyId}`}
      // ✅ L'auth est déjà vérifiée ci-dessus, pas besoin de re-vérifier dans DashboardShell
      skipAuthCheck
    >
      {children}
    </DashboardShell>
  );
}