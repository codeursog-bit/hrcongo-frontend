'use client';

// app/(dashboard)/cabinet/[cabinetId]/entreprise/[companyId]/layout.tsx
// Sidebar premium — collapsible, épurée, même ADN que côté Entreprise

import React, { useEffect, useState } from 'react';
import { useParams, useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/services/api';
import { C, Ico } from '@/components/cabinet/cabinet-ui';

interface CompanyInfo { id: string; legalName: string; tradeName: string | null; city: string }

const NAV: {
  slug: string; label: string;
  icon: (p: { size?: number; color?: string }) => React.ReactElement;
  section: string; desc: string
}[] = [
  // RH
  { slug: 'dashboard',       label: 'Vue d\'ensemble', icon: Ico.BarChart,      section: 'RH',      desc: 'Dashboard PME'       },
  { slug: 'employes',        label: 'Employés',         icon: Ico.Users,         section: 'RH',      desc: 'Profils & salaires'  },
  { slug: 'presences',       label: 'Présences',        icon: Ico.Fingerprint,   section: 'RH',      desc: 'Pointage mensuel'    },
  { slug: 'resume-presences',label: 'Résumé présences', icon: Ico.BarChart,      section: 'RH',      desc: 'Variables pour paie' },
  { slug: 'conges',          label: 'Congés',           icon: Ico.Leave,         section: 'RH',      desc: 'Demandes & soldes'   },
  { slug: 'contrats',        label: 'Contrats',         icon: Ico.FileText,      section: 'RH',      desc: 'CDI, CDD, ruptures'  },
  { slug: 'documents',       label: 'Documents',        icon: Ico.Payroll,       section: 'RH',      desc: 'Docs RH'             },
  { slug: 'formation',       label: 'Formation',        icon: Ico.Book,          section: 'RH',      desc: 'Plans de formation'  },
  { slug: 'performance',     label: 'Performance',      icon: Ico.Target,        section: 'RH',      desc: 'Objectifs & revues'  },
  { slug: 'materiel',        label: 'Matériel',         icon: Ico.Package,       section: 'RH',      desc: 'Actifs'              },
  // Paie
  { slug: 'paie',            label: 'Saisie variables', icon: Ico.Dollar,        section: 'Paie',    desc: 'Variables du mois'   },
  { slug: 'bulletins',       label: 'Bulletins',        icon: Ico.Payroll,       section: 'Paie',    desc: 'Générer & exporter'  },
  { slug: 'declarations',    label: 'Déclarations',     icon: Ico.Wallet,        section: 'Paie',    desc: 'CNSS, TUS, ITS'      },
  // Rapports
  { slug: 'rapports',        label: 'Rapports',         icon: Ico.BarChart,      section: 'Rapports',desc: 'Analyse globale'     },
  // Config
  { slug: 'parametres',      label: 'Paramètres PME',   icon: Ico.Settings,      section: 'Config',  desc: 'Config entreprise'   },
  { slug: 'acces',           label: 'Accès portail',    icon: Ico.Shield,        section: 'Config',  desc: 'Portail & invitation'},
  { slug: 'recrutement',     label: 'Recrutement',      icon: Ico.UserCog,       section: 'Config',  desc: 'Offres & candidats'  },
];

const SECTIONS: { key: string; label: string }[] = [
  { key: 'RH',      label: 'Ressources humaines' },
  { key: 'Paie',    label: 'Paie' },
  { key: 'Rapports',label: 'Rapports' },
  { key: 'Config',  label: 'Configuration' },
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
  const toggle   = (s: string) => setCollapsed(p => ({ ...p, [s]: !p[s] }));

  return (
    <div className="min-h-screen flex flex-col" style={{ background: C.pageBg, color: C.textPrimary }}>

      {/* Topbar */}
      <header
        className="h-14 flex items-center px-5 gap-3 z-30 shrink-0"
        style={{ borderBottom: `1px solid ${C.border}`, background: C.cardBg }}
      >
        <button
          onClick={() => router.push(`/cabinet/${cabinetId}/dashboard`)}
          className="flex items-center gap-1.5 transition-colors text-sm shrink-0 rounded-lg px-2 py-1"
          style={{ color: C.textMuted }}
          onMouseEnter={e => (e.currentTarget.style.color = C.textPrimary)}
          onMouseLeave={e => (e.currentTarget.style.color = C.textMuted)}
        >
          <Ico.ArrowLeft size={14} color="currentColor" />
          <span className="hidden sm:inline">Mes PME</span>
        </button>

        <span style={{ color: C.border }}>{'/'}</span>

        <div className="flex items-center gap-2 min-w-0">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: 'rgba(6,182,212,0.12)', border: '1px solid rgba(6,182,212,0.2)' }}
          >
            <Ico.Building size={12} color={C.cyan} />
          </div>
          <span className="font-semibold text-sm truncate" style={{ color: C.textPrimary }}>
            {company?.tradeName || company?.legalName || '…'}
          </span>
          {company?.city && (
            <span className="text-xs hidden md:inline" style={{ color: C.textMuted }}>
              · {company.city}
            </span>
          )}
        </div>

        <div className="flex-1" />

        <div
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
          style={{
            background: 'rgba(139,92,246,0.1)',
            border: '1px solid rgba(139,92,246,0.2)',
            color: '#c4b5fd',
          }}
        >
          <Ico.Wallet size={11} color="#c4b5fd" />
          <span className="hidden sm:inline">Mode cabinet</span>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">

        {/* Sidebar */}
        <aside
          className="w-52 shrink-0 flex flex-col py-3 px-2 overflow-y-auto"
          style={{ borderRight: `1px solid ${C.border}`, background: C.cardBg }}
        >
          {SECTIONS.map(({ key, label }) => {
            const items = NAV.filter(n => n.section === key);
            const isCollapsed = collapsed[key];

            return (
              <div key={key} className="mb-1">
                <button
                  onClick={() => toggle(key)}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors group"
                  style={{ color: C.textMuted }}
                  onMouseEnter={e => (e.currentTarget.style.color = C.textSecondary)}
                  onMouseLeave={e => (e.currentTarget.style.color = C.textMuted)}
                >
                  <span className="text-[10px] font-semibold uppercase tracking-wider">{label}</span>
                  <span
                    className="transition-transform duration-200"
                    style={{ transform: isCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)' }}
                  >
                    <Ico.ChevronDown size={10} color="currentColor" />
                  </span>
                </button>

                {!isCollapsed && items.map(item => {
                  const active = isActive(item.slug);
                  const href   = `/cabinet/${cabinetId}/entreprise/${companyId}/${item.slug}`;
                  return (
                    <Link
                      key={item.slug}
                      href={href}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all duration-100 mb-0.5"
                      style={active ? {
                        background: 'rgba(99,102,241,0.12)',
                        border: '1px solid rgba(99,102,241,0.2)',
                        color: C.indigoL,
                      } : {
                        color: C.textSecondary,
                        border: '1px solid transparent',
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
                      <span className="text-xs font-medium leading-tight">{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            );
          })}
        </aside>

        <main className="flex-1 overflow-auto" style={{ background: C.pageBg }}>
          {children}
        </main>
      </div>
    </div>
  );
}