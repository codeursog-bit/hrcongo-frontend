'use client';

// ============================================================================
// 📁 components/FinanceSubNav.tsx
// ✅ Sous-nav du module Prêts & Avances. La gestion (/loans) n'apparaît que
//    pour ADMIN/SUPER_ADMIN/HR_MANAGER — les autres rôles ne voient que
//    "Nouvelle demande" et "Mon espace" (self-service personnel).
// ============================================================================

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutGrid, Plus, UserCircle, LineChart, CheckSquare, FileBarChart } from 'lucide-react';
import { useBasePath } from '@/hooks/useBasePath';

const FINANCE_ROLES = ['ADMIN', 'SUPER_ADMIN', 'HR_MANAGER'];

export default function FinanceSubNav({ userRole }: { userRole: string }) {
  const { bp } = useBasePath();
  const pathname = usePathname();
  const canManage = FINANCE_ROLES.includes(userRole);

  const links = [
    ...(canManage ? [{ href: '/loans', label: 'Gestion', icon: LayoutGrid }] : []),
    ...(canManage ? [{ href: '/loans/suivi-dettes', label: 'Suivi des dettes', icon: LineChart }] : []),
    ...(canManage ? [{ href: '/loans/validations', label: 'Validations', icon: CheckSquare }] : []),
    ...(canManage ? [{ href: '/loans/rapport', label: 'Rapport', icon: FileBarChart }] : []),
    { href: '/loans/nouveau',    label: 'Nouvelle demande', icon: Plus },
    { href: '/loans/mon-espace', label: 'Mon espace',       icon: UserCircle },
  ];

  const isActive = (href: string) => {
    const target = bp(href);
    return pathname === target || (href !== '/loans' && pathname?.startsWith(target));
  };

  return (
    <div className="flex gap-1.5 overflow-x-auto pb-1 mb-5 -mt-1">
      {links.map(l => {
        const Icon = l.icon;
        const active = isActive(l.href);
        return (
          <Link
            key={l.href}
            href={bp(l.href)}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all shrink-0 ${
              active ? 'bg-sky-500 text-white shadow-sm' : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            <Icon size={14} /> {l.label}
          </Link>
        );
      })}
    </div>
  );
}