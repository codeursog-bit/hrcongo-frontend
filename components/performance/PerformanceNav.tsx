'use client';

// ============================================================================
// 📄 components/performance/PerformanceNav.tsx
// Barre de navigation commune à toutes les pages « Performance » : on passe
// d'une section à l'autre en un clic, sans taper d'URL. N'affiche que ce que le
// rôle peut utiliser (le serveur reste l'autorité : masquer un lien n'ouvre ni
// ne ferme aucun droit). Fonctionne aussi dans le contexte /pme/[companyId].
//
// Usage : <PerformanceNav />  en première ligne de la page (aucune prop).
// ============================================================================

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ClipboardCheck, UserCircle, Rocket, GraduationCap, Route, Target } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useBasePath } from '@/hooks/useBasePath';
import { MANAGE_ROLES, getStoredUser } from './sheet-types';

interface Item {
  href: string;
  label: string;
  Icon: LucideIcon;
  manageOnly?: boolean;
  /** Pages dont le chemin commence ainsi comptent comme « actives » pour cet onglet */
  also?: string[];
}

const ITEMS: Item[] = [
  { href: '/performance',             label: 'Évaluations', Icon: ClipboardCheck, also: ['/performance/fiche'] },
  { href: '/performance/mon-espace',  label: 'Mon espace',  Icon: UserCircle },
  { href: '/performance/objectifs',   label: 'Objectifs',   Icon: Target },
  { href: '/performance/cycles',      label: 'Campagnes',   Icon: Rocket, manageOnly: true, also: ['/performance/modeles'] },
  { href: '/performance/competences', label: 'Compétences', Icon: GraduationCap, manageOnly: true },
  { href: '/performance/carriere',    label: 'Carrière',    Icon: Route, manageOnly: true },
];

export default function PerformanceNav() {
  const pathname = usePathname() ?? '';
  const { bp } = useBasePath();
  const [canManage, setCanManage] = useState(false);

  useEffect(() => {
    const u = getStoredUser();
    setCanManage(!!u?.role && MANAGE_ROLES.includes(u.role));
  }, []);

  const isActive = (it: Item) => {
    const match = (p: string) => {
      const full = bp(p);
      return it.href === '/performance'
        ? pathname === full || (it.also ?? []).some(a => pathname.startsWith(bp(a)))
        : pathname === full || pathname.startsWith(full + '/');
    };
    return match(it.href) || (it.also ?? []).some(a => pathname === bp(a) || pathname.startsWith(bp(a) + '/'));
  };

  return (
    <nav aria-label="Navigation performance" className="print:hidden">
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
        {ITEMS.filter(i => !i.manageOnly || canManage).map(it => {
          const active = isActive(it);
          return (
            <Link
              key={it.href}
              href={bp(it.href)}
              aria-current={active ? 'page' : undefined}
              className={`whitespace-nowrap px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-colors min-h-[44px] ${
                active
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20'
                  : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              <it.Icon size={16} /> {it.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}