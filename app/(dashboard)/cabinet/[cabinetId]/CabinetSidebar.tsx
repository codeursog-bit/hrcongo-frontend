'use client';

// ============================================================================
// app/(dashboard)/cabinet/[cabinetId]/CabinetSidebar.tsx
// REFONTE UX — Sidebar navy premium, SVG custom, menus collapsibles, no Lucide
// ============================================================================

import React, { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';

interface CabinetSidebarProps {
  cabinetId: string;
  userEmail?: string;
  userName?: string;
}

// ─── SVG Icons custom (16×16 grid, stroke-linecap round) ─────────────────────
const Icons = {
  Dashboard: () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <rect x="1" y="1" width="6" height="6" rx="1.5" fill="currentColor"/>
      <rect x="9" y="1" width="6" height="6" rx="1.5" fill="currentColor" opacity=".45"/>
      <rect x="1" y="9" width="6" height="6" rx="1.5" fill="currentColor" opacity=".45"/>
      <rect x="9" y="9" width="6" height="6" rx="1.5" fill="currentColor" opacity=".45"/>
    </svg>
  ),
  Companies: () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <rect x="2" y="5" width="12" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M5 5V4a3 3 0 016 0v1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M6 10h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
  Close: () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M2 4h12M2 8h8M2 12h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <circle cx="13" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M11.5 11.5l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
  Wallet: () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <rect x="1" y="4" width="14" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M1 7h14" stroke="currentColor" strokeWidth="1.5"/>
      <circle cx="12" cy="10.5" r="1" fill="currentColor"/>
    </svg>
  ),
  Users: () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="6" cy="5" r="2.5" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M1 13c0-2.21 2.24-4 5-4s5 1.79 5 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M11 7c1.1 0 2 .9 2 2M13 13c0-1.66-1.34-3-3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
  Settings: () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.05 3.05l1.41 1.41M11.54 11.54l1.41 1.41M3.05 12.95l1.41-1.41M11.54 4.46l1.41-1.41" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
  Logout: () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M6 2H3a1 1 0 00-1 1v10a1 1 0 001 1h3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M10 11l3-3-3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M13 8H6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
  Chevron: () => (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <path d="M4 2.5l3.5 3.5L4 9.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  Briefcase: () => (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <rect x="1" y="4" width="12" height="8" rx="1.5" stroke="white" strokeWidth="1.5"/>
      <path d="M4.5 4V3a2.5 2.5 0 015 0v1" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M1 8h12" stroke="white" strokeWidth="1.2" opacity=".5"/>
    </svg>
  ),
  AddPme: () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <rect x="2" y="5" width="9" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M12 2v6M9 5h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
};

// ─── Types ────────────────────────────────────────────────────────────────────
interface NavGroup {
  id: string;
  label: string;
  icon: React.FC;
  slug?: string;           // direct link (no children)
  children?: { label: string; slug: string }[];
  badge?: string;
}

const buildNav = (cabinetId: string): NavGroup[] => [
  {
    id: 'dashboard',
    label: 'Tableau de bord',
    icon: Icons.Dashboard,
    slug: 'dashboard',
  },
  {
    id: 'mes-pme',
    label: 'Mes PME',
    icon: Icons.Companies,
    children: [
      { label: 'Liste des PME',  slug: 'mes-pme'       },
      { label: 'Ajouter une PME', slug: 'ajouter-pme'  },
    ],
  },
  {
    id: 'cloture',
    label: 'Clôture & Import',
    icon: Icons.Close,
    slug: 'cloture',
  },
  {
    id: 'abonnement',
    label: 'Abonnement',
    icon: Icons.Wallet,
    slug: 'abonnement',
  },
  {
    id: 'gestionnaires',
    label: 'Gestionnaires',
    icon: Icons.Users,
    slug: 'gestionnaires',
  },
  {
    id: 'parametres',
    label: 'Paramètres',
    icon: Icons.Settings,
    slug: 'parametres',
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getInitials(email?: string, name?: string): string {
  if (name) {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  }
  if (email) return email.slice(0, 2).toUpperCase();
  return 'CA';
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function CabinetSidebar({ cabinetId, userEmail, userName }: CabinetSidebarProps) {
  const router   = useRouter();
  const pathname = usePathname();
  const nav      = buildNav(cabinetId);

  const [openGroups, setOpenGroups] = useState<Set<string>>(new Set(['mes-pme']));

  const toggleGroup = (id: string) => {
    setOpenGroups(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const isActive = (slug: string) =>
    pathname === `/cabinet/${cabinetId}/${slug}` ||
    pathname.startsWith(`/cabinet/${cabinetId}/${slug}/`);

  const isGroupActive = (group: NavGroup) => {
    if (group.slug) return isActive(group.slug);
    return group.children?.some(c => isActive(c.slug)) ?? false;
  };

  const logout = () => { localStorage.clear(); router.push('/auth/login'); };

  const initials = getInitials(userEmail, userName);

  return (
    <aside
      className="fixed left-0 top-0 h-full flex flex-col z-20"
      style={{
        width: '220px',
        background: 'linear-gradient(180deg, #1a2540 0%, #151e34 100%)',
        borderRight: '1px solid rgba(255,255,255,0.07)',
      }}
    >
      {/* ── Logo ──────────────────────────────────────────────────────────── */}
      <div className="px-4 py-5" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: 'linear-gradient(135deg, #4f6ef7 0%, #7c3aed 100%)' }}
          >
            <Icons.Briefcase />
          </div>
          <div>
            <p className="text-white font-semibold text-sm leading-none">KonzaRH</p>
            <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>
              Portail Cabinet
            </p>
          </div>
        </div>
      </div>

      {/* ── Navigation ────────────────────────────────────────────────────── */}
      <nav className="flex-1 py-3 px-2 overflow-y-auto space-y-0.5">
        {nav.map(group => {
          const active      = isGroupActive(group);
          const isOpen      = openGroups.has(group.id);
          const hasChildren = !!group.children?.length;
          const Icon        = group.icon;

          return (
            <div key={group.id}>
              {/* Niveau 1 */}
              <button
                onClick={() => {
                  if (hasChildren) toggleGroup(group.id);
                  else if (group.slug) router.push(`/cabinet/${cabinetId}/${group.slug}`);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm transition-all duration-150 group"
                style={{
                  background: active ? 'rgba(99,102,241,0.18)' : 'transparent',
                  color: active ? '#fff' : 'rgba(255,255,255,0.55)',
                  position: 'relative',
                }}
              >
                {/* indicateur actif */}
                {active && (
                  <span
                    className="absolute left-0 top-2 bottom-2 w-0.5 rounded-r"
                    style={{ background: '#6366f1' }}
                  />
                )}
                <span style={{ color: active ? '#818cf8' : 'rgba(255,255,255,0.45)' }}>
                  <Icon />
                </span>
                <span className="flex-1 text-left font-medium text-[13px]">{group.label}</span>

                {/* Badge */}
                {group.badge && (
                  <span
                    className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                    style={{
                      background: 'rgba(99,102,241,0.2)',
                      color: '#a5b4fc',
                      border: '1px solid rgba(99,102,241,0.3)',
                    }}
                  >
                    {group.badge}
                  </span>
                )}

                {/* Chevron */}
                {hasChildren && (
                  <span
                    className="transition-transform duration-200"
                    style={{
                      color: 'rgba(255,255,255,0.25)',
                      transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)',
                    }}
                  >
                    <Icons.Chevron />
                  </span>
                )}
              </button>

              {/* Sous-items */}
              {hasChildren && isOpen && (
                <div className="mt-0.5 ml-4 space-y-0.5">
                  {group.children!.map(child => {
                    const childActive = isActive(child.slug);
                    return (
                      <button
                        key={child.slug}
                        onClick={() => router.push(`/cabinet/${cabinetId}/${child.slug}`)}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[12px] transition-all"
                        style={{
                          background: childActive ? 'rgba(99,102,241,0.15)' : 'transparent',
                          color: childActive ? '#a5b4fc' : 'rgba(255,255,255,0.4)',
                        }}
                      >
                        <span
                          className="w-1 h-1 rounded-full shrink-0"
                          style={{
                            background: childActive ? '#818cf8' : 'rgba(255,255,255,0.2)',
                          }}
                        />
                        {child.label}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* ── User footer ───────────────────────────────────────────────────── */}
      <div className="p-3" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
        {/* User chip */}
        <div className="flex items-center gap-2.5 px-2 py-2 mb-1 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)' }}>
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-[11px] font-semibold text-white"
            style={{ background: 'linear-gradient(135deg, #4f6ef7, #7c3aed)' }}
          >
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[12px] font-medium text-white truncate leading-none">
              {userName ?? 'Mon Cabinet'}
            </p>
            <p className="text-[10px] truncate mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>
              {userEmail ?? ''}
            </p>
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={logout}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[12px] transition-all group"
          style={{ color: 'rgba(255,255,255,0.35)' }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.1)';
            (e.currentTarget as HTMLElement).style.color = '#f87171';
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLElement).style.background = 'transparent';
            (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.35)';
          }}
        >
          <Icons.Logout />
          Déconnexion
        </button>
      </div>
    </aside>
  );
}