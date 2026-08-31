'use client';

// ============================================================================
// 📁 components/PermissionsSubNav.tsx
// ✅ Sous-navigation entre les pages du module Permissions (Gestion, Suivi,
//    Validations, Rapport, Nouveau, Mon espace) — même rôle que
//    FinanceSubNav pour les prêts. Se place SOUS PresenceSubNav (qui reste
//    la navigation générale du module Présences, inchangée).
// ============================================================================

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutGrid, LineChart, CheckSquare, FileBarChart, Plus, UserCircle } from 'lucide-react';
import { useBasePath } from '@/hooks/useBasePath';

const MANAGE_ROLES = ['ADMIN', 'SUPER_ADMIN', 'HR_MANAGER'];

export default function PermissionsSubNav({ userRole }: { userRole: string }) {
  const { bp } = useBasePath();
  const pathname = usePathname();
  const canManage = MANAGE_ROLES.includes(userRole);

  const links = [
    ...(canManage ? [{ href: '/presences/permissions', label: 'Gestion', icon: LayoutGrid }] : []),
    ...(canManage ? [{ href: '/presences/permissions/suivi', label: 'Suivi', icon: LineChart }] : []),
    ...(canManage ? [{ href: '/presences/permissions/validations', label: 'Validations', icon: CheckSquare }] : []),
    ...(canManage ? [{ href: '/presences/permissions/rapport', label: 'Rapport', icon: FileBarChart }] : []),
    { href: '/presences/permissions/nouveau', label: 'Nouveau ticket', icon: Plus },
    { href: '/presences/permissions/mon-espace', label: 'Mon espace', icon: UserCircle },
  ];

  const isActive = (href: string) => {
    const target = bp(href);
    return pathname === target || (href === '/presences/permissions' ? pathname === target : pathname?.startsWith(target));
  };

  return (
    <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl w-fit overflow-x-auto mb-1">
      {links.map(l => {
        const Icon = l.icon;
        const active = isActive(l.href);
        return (
          <Link key={l.href} href={bp(l.href)} className={`px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap transition-all shrink-0 ${active ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}>
            <Icon size={13} /> {l.label}
          </Link>
        );
      })}
    </div>
  );
}