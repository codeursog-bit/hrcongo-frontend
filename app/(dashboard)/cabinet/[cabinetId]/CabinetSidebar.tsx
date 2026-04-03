'use client';

// =============================================================================
// FICHIER : app/(dashboard)/cabinet/[cabinetId]/CabinetSidebar.tsx
// ACTION  : CRÉER (nouveau fichier)
// RÔLE    : Sidebar partagée pour toutes les pages du cabinet
//           À importer dans dashboard, abonnement, cloture, parametres,
//           gestionnaires, ajouter-pme — partout où la sidebar doit apparaître.
// =============================================================================

import React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
  Building2, Clock, Crown, Settings, LogOut,
  Briefcase, Users,
} from 'lucide-react';

interface CabinetSidebarProps {
  cabinetId: string;
  userEmail?: string;
}

const NAV = [
  { slug: 'dashboard',     label: 'Mes PME clientes', icon: Building2 },
  { slug: 'cloture',       label: 'Clôture & Import',  icon: Clock     },
  { slug: 'abonnement',    label: 'Abonnement',         icon: Crown     },
  { slug: 'gestionnaires', label: 'Gestionnaires',      icon: Users     },
  { slug: 'parametres',    label: 'Paramètres',         icon: Settings  },
];

export default function CabinetSidebar({ cabinetId, userEmail }: CabinetSidebarProps) {
  const router   = useRouter();
  const pathname = usePathname();

  const logout = () => {
    localStorage.clear();
    router.push('/auth/login');
  };

  const isActive = (slug: string) =>
    pathname === `/cabinet/${cabinetId}/${slug}` ||
    pathname.startsWith(`/cabinet/${cabinetId}/${slug}/`);

  return (
    <aside className="fixed left-0 top-0 h-full w-56 bg-black/30 border-r border-white/10 flex flex-col z-20">
      {/* Logo */}
      <div className="p-5 border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg flex items-center justify-center">
            <Briefcase size={14} className="text-white" />
          </div>
          <span className="font-bold text-sm text-white truncate">Cabinet</span>
        </div>
        {userEmail && (
          <p className="text-xs text-gray-500 mt-2 truncate">{userEmail}</p>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1">
        {NAV.map(({ slug, label, icon: Icon }) => {
          const active = isActive(slug);
          return (
            <button
              key={slug}
              onClick={() => router.push(`/cabinet/${cabinetId}/${slug}`)}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm transition-colors ${
                active
                  ? 'bg-purple-500/20 text-purple-400 font-semibold'
                  : 'hover:bg-white/5 text-gray-400 hover:text-white'
              }`}
            >
              <Icon size={16} />
              {label}
            </button>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="p-3 border-t border-white/10">
        <button
          onClick={logout}
          className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-red-500/10 text-gray-500 hover:text-red-400 text-sm transition-colors"
        >
          <LogOut size={16} />
          Déconnexion
        </button>
      </div>
    </aside>
  );
}