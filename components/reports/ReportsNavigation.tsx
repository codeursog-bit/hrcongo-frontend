'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, FileBarChart, Wallet, Users, Calendar } from 'lucide-react';

const REPORT_PAGES = [
  {
    href: '/rapports',
    label: 'Vue d\'ensemble',
    icon: LayoutDashboard,
    description: 'Dashboard principal'
  },
  {
    href: '/rapports/complet',
    label: 'Rapport Complet',
    icon: FileBarChart,
    description: 'Analyse exhaustive'
  },
  {
    href: '/rapports/analyse-paie',
    label: 'Paie & Coûts',
    icon: Wallet,
    description: 'Masse salariale détaillée'
  },
  {
    href: '/rapports/effectifs',
    label: 'Effectifs',
    icon: Users,
    description: 'Démographie RH'
  },
  {
    href: '/rapports/analyse-conges',
    label: 'Congés',
    icon: Calendar,
    description: 'Suivi absences'
  }
];

export function ReportsNavigation() {
  const pathname = usePathname();

  return (
    <div className="mb-8">
      {/* Navigation en onglets (Desktop) */}
      <div className="hidden md:block border-b border-gray-200 dark:border-gray-700">
        <div className="flex gap-1 overflow-x-auto no-scrollbar">
          {REPORT_PAGES.map((page) => {
            const Icon = page.icon;
            const isActive = pathname === page.href;
            
            return (
              <Link
                key={page.href}
                href={page.href}
                className={`
                  group relative flex items-center gap-2 px-6 py-4 text-sm font-bold whitespace-nowrap transition-all
                  ${isActive 
                    ? 'text-sky-600 dark:text-sky-400' 
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                  }
                `}
              >
                <Icon size={18} />
                <span>{page.label}</span>
                
                {/* Indicateur actif */}
                {isActive && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-sky-500 rounded-t-full" />
                )}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Navigation en cartes (Mobile) */}
      <div className="md:hidden grid grid-cols-2 gap-3">
        {REPORT_PAGES.map((page) => {
          const Icon = page.icon;
          const isActive = pathname === page.href;
          
          return (
            <Link
              key={page.href}
              href={page.href}
              className={`
                p-4 rounded-xl border transition-all
                ${isActive 
                  ? 'bg-sky-50 dark:bg-sky-900/20 border-sky-500 shadow-sm' 
                  : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-sky-300'
                }
              `}
            >
              <Icon 
                size={20} 
                className={isActive ? 'text-sky-600 dark:text-sky-400 mb-2' : 'text-gray-400 mb-2'} 
              />
              <p className={`text-sm font-bold ${isActive ? 'text-sky-600 dark:text-sky-400' : 'text-gray-900 dark:text-white'}`}>
                {page.label}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {page.description}
              </p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

// Export aussi une version compacte pour les sous-pages
export function ReportsQuickNav() {
  const pathname = usePathname();

  return (
    <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2">
      {REPORT_PAGES.map((page) => {
        const Icon = page.icon;
        const isActive = pathname === page.href;
        
        return (
          <Link
            key={page.href}
            href={page.href}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all
              ${isActive 
                ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/30' 
                : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-sky-300'
              }
            `}
          >
            <Icon size={16} />
            <span className="hidden sm:inline">{page.label}</span>
          </Link>
        );
      })}
    </div>
  );
}