'use client';

// ============================================================================
// 📁 components/RequestModuleNav.tsx
// ✅ Navigation COMMUNE des modules « demandes » (Absences, Permissions, Prêts).
//    Trois groupes lisibles, identiques partout :
//      PILOTAGE  → Gestion · Validations · Suivi
//      ANALYSE   → Historique · Rapport          ← bien visibles, jamais cachés
//      ACTIONS   → Nouvelle demande · Mon espace
//    🆕 Groupe optionnel MODULES (sélecteur Présences · Absences · Permissions) :
//      affiché AVANT les autres, avec exactement le même rendu.
//    🆕 Aussi utilisée par Présences et Congés : tous les modules ont le même rendu que Prêts.
//    - Passe à la ligne sur petit écran (plus d'onglets hors-écran à faire défiler)
//    - L'onglet actif est celui dont le lien est le PLUS SPÉCIFIQUE
//      (« Gestion » ne reste plus allumé sur /historique ou /rapport)
// ============================================================================

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import '@/components/ui/select.css';
import { useBasePath } from '@/hooks/useBasePath';
import ModuleNav, { ModuleNavItem } from '@/components/requests/ModuleNav';

export type NavGroup = 'module' | 'pilot' | 'analysis' | 'action';
export interface NavLinkDef { href: string; label: string; icon: any; group: NavGroup }

const GROUP_LABEL: Record<NavGroup, string> = { module: 'Modules', pilot: 'Pilotage', analysis: 'Analyse', action: 'Actions' };
const ACCENT = {
  emerald: { on: 'bg-emerald-500 text-white shadow-sm', analysis: 'text-emerald-700 dark:text-emerald-300' },
  sky: { on: 'bg-sky-500 text-white shadow-sm', analysis: 'text-sky-700 dark:text-sky-300' },
};

export default function RequestModuleNav({ links, accent = 'emerald' }: { links: NavLinkDef[]; accent?: 'emerald' | 'sky' }) {
  const { bp } = useBasePath();
  const pathname = usePathname() || '';
  const a = ACCENT[accent];
  const legacy = /^\/(admin|cabinet|portefeuille)(\/|$)/.test(pathname);

  // Lien actif = le plus long href qui correspond au chemin courant
  const matches = links.filter(l => pathname === bp(l.href) || pathname.startsWith(bp(l.href) + '/'));
  const activeHref = matches.sort((x, y) => y.href.length - x.href.length)[0]?.href;

  // Nouvelle barre unique (espace entreprise) ; l'ancien rendu reste pour admin, cabinet et portefeuille (phase 2).
  if (!legacy) {
    const allModules = links.length > 0 && links.every(l => l.group === 'module');
    if (allModules) {
      // Sélecteur de module (Présences · Absences · Permissions) : petit groupe de choix.
      return (
        <nav aria-label="Navigation du module" className="mb-5">
          <div className="k-segmented" role="group">
            {links.map(l => {
              const Icon = l.icon;
              const active = activeHref === l.href;
              return (
                <Link key={l.href} href={bp(l.href)} aria-current={active ? 'page' : undefined} className="k-segmented-item">
                  {Icon ? <Icon size={16} strokeWidth={1.5} aria-hidden="true" /> : null}{l.label}
                </Link>
              );
            })}
          </div>
        </nav>
      );
    }
    const ctaLink = links.find(l => l.group === 'action' && (/\/nouveau$/.test(l.href) || /^nouvel/i.test(l.label)));
    const toItem = (l: NavLinkDef): ModuleNavItem => ({ href: bp(l.href), label: l.label, icon: l.icon, group: l.group, active: activeHref === l.href });
    return (
      <ModuleNav
        items={links.filter(l => l !== ctaLink).map(toItem)}
        cta={ctaLink ? toItem(ctaLink) : null}
        groupLabels={GROUP_LABEL}
      />
    );
  }

  const groups = (['module', 'pilot', 'analysis', 'action'] as NavGroup[])
    .map(g => ({ g, items: links.filter(l => l.group === g) }))
    .filter(x => x.items.length > 0);

  return (
    <nav aria-label="Navigation du module" className={legacy ? "flex flex-wrap items-stretch gap-x-3 gap-y-2 mb-2" : "request-module-nav"}>
      {groups.map(({ g, items }) => (
        <div key={g} className={legacy ? "flex items-center gap-1 bg-[var(--surface-2)] p-1 rounded-xl" : undefined}>
          <span className={`${legacy ? 'hidden md:block' : ''} px-2 text-[9px] font-bold uppercase tracking-widest ${g === 'analysis' ? a.analysis : 'text-[var(--text-muted)]'}`}>{GROUP_LABEL[g]}</span>
          {items.map(l => {
            const Icon = l.icon;
            const active = activeHref === l.href;
            return (
              <Link
                key={l.href}
                href={bp(l.href)}
                aria-current={active ? 'page' : undefined}
                className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap transition-all ${active ? (legacy ? a.on : 'bg-[var(--brand-soft)] text-[var(--text)]') : 'text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface)]'}`}
              >
                <Icon size={13} strokeWidth={legacy ? 2 : 1.5} /> {l.label}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}