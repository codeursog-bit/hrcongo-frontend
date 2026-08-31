'use client';

// app/(dashboard)/cabinet/[cabinetId]/entreprise/[companyId]/layout.tsx
// Header + Sidebar FIXES — ne scrollent jamais, seul le <main> scrolle

import React, { useEffect, useState } from 'react';
import { useParams, useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/services/api';
import { C, Ico } from '@/components/cabinet/cabinet-ui';

interface CompanyInfo { id: string; legalName: string; tradeName: string | null; city: string }

const NAV: {
  slug: string; label: string;
  icon: (p: { size?: number; color?: string }) => React.ReactElement;
  section: string;
}[] = [
  { slug: 'dashboard',        label: 'Vue d\'ensemble', icon: Ico.BarChart,    section: 'RH'       },
  { slug: 'employes',         label: 'Employés',         icon: Ico.Users,       section: 'RH'       },
  { slug: 'presences',        label: 'Présences',        icon: Ico.Fingerprint, section: 'RH'       },
  { slug: 'resume-presences', label: 'Résumé présences', icon: Ico.BarChart,    section: 'RH'       },
  { slug: 'conges',           label: 'Congés',           icon: Ico.Leave,       section: 'RH'       },
  { slug: 'contrats',         label: 'Contrats',         icon: Ico.FileText,    section: 'RH'       },
  { slug: 'documents',        label: 'Documents',        icon: Ico.Payroll,     section: 'RH'       },
  { slug: 'formation',        label: 'Formation',        icon: Ico.Book,        section: 'RH'       },
  { slug: 'performance',      label: 'Performance',      icon: Ico.Target,      section: 'RH'       },
  { slug: 'materiel',         label: 'Matériel',         icon: Ico.Package,     section: 'RH'       },
  { slug: 'paie',             label: 'Saisie variables', icon: Ico.Dollar,      section: 'Paie'     },
  { slug: 'bulletins',        label: 'Bulletins',        icon: Ico.Payroll,     section: 'Paie'     },
  { slug: 'declarations',     label: 'Déclarations',     icon: Ico.Wallet,      section: 'Paie'     },
  { slug: 'rapports',         label: 'Rapports',         icon: Ico.BarChart,    section: 'Rapports' },
  { slug: 'parametres',       label: 'Paramètres PME',   icon: Ico.Settings,    section: 'Config'   },
  { slug: 'acces',            label: 'Accès portail',    icon: Ico.Shield,      section: 'Config'   },
  { slug: 'recrutement',      label: 'Recrutement',      icon: Ico.UserCog,     section: 'Config'   },
];

const SECTIONS: { key: string; label: string }[] = [
  { key: 'RH',       label: 'Ressources humaines' },
  { key: 'Paie',     label: 'Paie'                },
  { key: 'Rapports', label: 'Rapports'             },
  { key: 'Config',   label: 'Configuration'        },
];

export default function CabinetCompanyLayout({ children }: { children: React.ReactNode }) {
  const params    = useParams();
  const router    = useRouter();
  const pathname  = usePathname();
  const cabinetId = params.cabinetId as string;
  const companyId = params.companyId as string;

  const [company,   setCompany]   = useState<CompanyInfo | null>(null);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({ Config: true });

  useEffect(() => {
    sessionStorage.setItem('cabinetContext',  cabinetId);
    sessionStorage.setItem('activeCompanyId', companyId);
    api.get(`/companies/${companyId}`)
      .then((r: any) => setCompany(r))
      .catch(() => null);
  }, [cabinetId, companyId]);

  const isActive = (slug: string) => pathname.includes(`/${slug}`);
  const toggle   = (s: string)    => setCollapsed(p => ({ ...p, [s]: !p[s] }));

  return (
    /**
     * Astuce CSS pour sidebar+header fixes :
     * - Le wrapper racine occupe exactement 100vh et interdit tout overflow
     * - Le header a une hauteur fixe (shrink-0)
     * - Le corps sous le header est un flex row qui remplit l'espace restant (flex-1 min-h-0)
     * - La sidebar a overflow-y: auto et height: 100% → elle scrolle indépendamment si besoin
     * - Le <main> a overflow-y: auto → seul le contenu scrolle
     */
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        overflow: 'hidden',
        background: C.pageBg,
        color: C.textPrimary,
      }}
    >
      {/* ═══════════════════════════════════════════
          TOPBAR — position dans le flux, ne bouge pas
          car le parent n'a pas overflow scroll
          ═══════════════════════════════════════════ */}
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          height: 56,
          flexShrink: 0,
          padding: '0 20px',
          gap: 12,
          borderBottom: `1px solid ${C.border}`,
          background: C.cardBg,
          zIndex: 30,
        }}
      >
        {/* Retour */}
        <button
          onClick={() => router.push(`/cabinet/${cabinetId}/dashboard`)}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            color: C.textMuted, fontSize: 13, flexShrink: 0,
            background: 'none', border: 'none', cursor: 'pointer',
            borderRadius: 8, padding: '4px 8px',
            transition: 'color 150ms',
          }}
          onMouseEnter={e => (e.currentTarget.style.color = C.textPrimary)}
          onMouseLeave={e => (e.currentTarget.style.color = C.textMuted)}
        >
          <Ico.ArrowLeft size={14} color="currentColor" />
          <span className="hidden sm:inline">Mes PME</span>
        </button>

        <span style={{ color: C.border, userSelect: 'none' }}>/</span>

        {/* Nom société */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 8, flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(6,182,212,0.12)', border: '1px solid rgba(6,182,212,0.2)',
          }}>
            <Ico.Building size={12} color={C.cyan} />
          </div>
          <span style={{ fontWeight: 600, fontSize: 14, color: C.textPrimary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {company?.tradeName || company?.legalName || '…'}
          </span>
          {company?.city && (
            <span className="hidden md:inline" style={{ fontSize: 12, color: C.textMuted }}>
              · {company.city}
            </span>
          )}
        </div>

        <div style={{ flex: 1 }} />

        {/* Badge mode cabinet */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '4px 10px', borderRadius: 999,
          background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)',
          color: '#c4b5fd', fontSize: 12, fontWeight: 500, flexShrink: 0,
        }}>
          <Ico.Wallet size={11} color="#c4b5fd" />
          <span className="hidden sm:inline">Mode cabinet</span>
        </div>
      </header>

      {/* ═══════════════════════════════════════════
          CORPS : sidebar + main
          min-h-0 est indispensable pour que les
          enfants flex puissent calculer leur hauteur
          ═══════════════════════════════════════════ */}
      <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>

        {/* ── SIDEBAR FIXE ── */}
        <aside
          style={{
            width: 208,
            flexShrink: 0,
            height: '100%',        /* remplit exactement la zone sous le header */
            overflowY: 'auto',     /* scrolle toute seule si contenu trop long  */
            overflowX: 'hidden',
            borderRight: `1px solid ${C.border}`,
            background: C.cardBg,
          }}
        >
          <nav style={{ display: 'flex', flexDirection: 'column', padding: '12px 8px' }}>
            {SECTIONS.map(({ key, label }) => {
              const items       = NAV.filter(n => n.section === key);
              const isCollapsed = collapsed[key];

              return (
                <div key={key} style={{ marginBottom: 4 }}>
                  {/* Section label collapsible */}
                  <button
                    onClick={() => toggle(key)}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center',
                      justifyContent: 'space-between', padding: '7px 12px',
                      borderRadius: 8, background: 'none', border: 'none',
                      cursor: 'pointer', color: C.textMuted, transition: 'color 150ms',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.color = C.textSecondary)}
                    onMouseLeave={e => (e.currentTarget.style.color = C.textMuted)}
                  >
                    <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                      {label}
                    </span>
                    <span style={{
                      display: 'inline-block',
                      transition: 'transform 200ms ease',
                      transform: isCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)',
                    }}>
                      <Ico.ChevronDown size={10} color="currentColor" />
                    </span>
                  </button>

                  {/* Items */}
                  {!isCollapsed && items.map(item => {
                    const active = isActive(item.slug);
                    const href   = `/cabinet/${cabinetId}/entreprise/${companyId}/${item.slug}`;
                    return (
                      <Link
                        key={item.slug}
                        href={href}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 10,
                          padding: '8px 12px', borderRadius: 12, marginBottom: 2,
                          textDecoration: 'none', fontSize: 12, fontWeight: 500,
                          transition: 'all 100ms',
                          ...(active ? {
                            background: 'rgba(99,102,241,0.12)',
                            border: '1px solid rgba(99,102,241,0.22)',
                            color: C.indigoL,
                          } : {
                            border: '1px solid transparent',
                            color: C.textSecondary,
                          }),
                        }}
                        onMouseEnter={e => {
                          if (!active) {
                            (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)';
                            (e.currentTarget as HTMLElement).style.color = C.textPrimary;
                          }
                        }}
                        onMouseLeave={e => {
                          if (!active) {
                            (e.currentTarget as HTMLElement).style.background = 'transparent';
                            (e.currentTarget as HTMLElement).style.color = C.textSecondary;
                          }
                        }}
                      >
                        <item.icon size={13} color={active ? C.indigoL : 'currentColor'} />
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {item.label}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              );
            })}
          </nav>
        </aside>

        {/* ── CONTENU — seule zone qui scrolle ── */}
        <main
          style={{
            flex: 1,
            height: '100%',
            overflowY: 'auto',
            overflowX: 'hidden',
            background: C.pageBg,
          }}
        >
          {children}
        </main>
      </div>
    </div>
  );
}