'use client';

// app/(dashboard)/cabinet/[cabinetId]/entreprise/[companyId]/layout.tsx
// REMPLACE l'existant — navigation complète identique PME + sections paie cabinet

import React, { useEffect, useState } from 'react';
import { useParams, useRouter, usePathname } from 'next/navigation';
import {
  ArrowLeft, Building2, Briefcase, LayoutDashboard,
  FileText, Users, ClipboardList, Calculator,
  Fingerprint, Calendar, BarChart3, BookOpen,
  Package, Star, FileCheck, Settings, ChevronDown,
  DollarSign, Shield, UserCog, Network,
} from 'lucide-react';
import Link from 'next/link';
import { api } from '@/services/api';

interface CompanyInfo { id: string; legalName: string; tradeName: string | null; city: string }

// Navigation cabinet — IDENTIQUE à PME + la section Paie cabinet (avec boutons génération)
const NAV: { slug: string; label: string; icon: React.ElementType; section: string; desc: string }[] = [
  // RH — exactement comme PME
  { slug: 'dashboard',     label: 'Vue d\'ensemble',   icon: LayoutDashboard, section: 'RH',     desc: 'Dashboard PME'        },
  { slug: 'employes',      label: 'Employés',           icon: Users,           section: 'RH',     desc: 'Profils & salaires'   },
  { slug: 'presences',     label: 'Présences',          icon: Fingerprint,     section: 'RH',     desc: 'Pointage mensuel'     },
  { slug: 'resume-presences', label: 'Résumé prés.',    icon: BarChart3,       section: 'RH',     desc: 'Variables pour paie'  },
  { slug: 'conges',        label: 'Congés',             icon: Calendar,        section: 'RH',     desc: 'Demandes & soldes'    },
  { slug: 'contrats',      label: 'Contrats',           icon: FileCheck,       section: 'RH',     desc: 'CDI, CDD, ruptures'   },
  { slug: 'documents',     label: 'Documents',          icon: FileText,        section: 'RH',     desc: 'Docs RH'              },
  { slug: 'formation',     label: 'Formation',          icon: BookOpen,        section: 'RH',     desc: 'Plans de formation'   },
  { slug: 'performance',   label: 'Performance',        icon: Star,            section: 'RH',     desc: 'Objectifs & revues'   },
  { slug: 'materiel',      label: 'Matériel',           icon: Package,         section: 'RH',     desc: 'Actifs'               },
  // Paie cabinet — boutons génération disponibles
  { slug: 'paie',          label: 'Saisie variables',   icon: DollarSign,      section: 'Paie',   desc: 'Variables du mois'    },
  { slug: 'bulletins',     label: 'Bulletins',          icon: ClipboardList,   section: 'Paie',   desc: 'Générer & exporter'   },
  { slug: 'declarations',  label: 'Déclarations',       icon: Calculator,      section: 'Paie',   desc: 'CNSS, TUS, ITS'       },
  // Rapports
  { slug: 'rapports',      label: 'Rapports',           icon: BarChart3,       section: 'Rapports', desc: 'Analyse globale'    },
  // Config
  { slug: 'parametres',    label: 'Paramètres PME',     icon: Settings,        section: 'Config', desc: 'Config entreprise'    },
  { slug: 'acces',         label: 'Accès portail',      icon: Shield,          section: 'Config', desc: 'Portail & invitation' },
  { slug: 'recrutement',   label: 'Recrutement',        icon: UserCog,         section: 'Config', desc: 'Offres & candidats'   },
];

const SECTIONS = ['RH', 'Paie', 'Rapports', 'Config'];

export default function CabinetCompanyLayout({ children }: { children: React.ReactNode }) {
  const params    = useParams();
  const router    = useRouter();
  const pathname  = usePathname();
  const cabinetId = params.cabinetId as string;
  const companyId = params.companyId as string;

  const [company,   setCompany]   = useState<CompanyInfo | null>(null);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  useEffect(() => {
    // Stocker le contexte cabinet pour que les pages puissent détecter isCabinet
    sessionStorage.setItem('cabinetContext',  cabinetId);
    sessionStorage.setItem('activeCompanyId', companyId);
    api.get(`/companies/${companyId}`)
      .then((r: any) => setCompany(r))
      .catch(() => null);
  }, [cabinetId, companyId]);

  const isActive = (slug: string) => pathname.includes(`/${slug}`);
  const toggle   = (s: string) => setCollapsed(p => ({ ...p, [s]: !p[s] }));

  return (
    <div className="min-h-screen bg-[#020617] text-white flex flex-col">

      {/* Topbar */}
      <header className="h-14 border-b border-white/10 bg-black/40 backdrop-blur-sm flex items-center px-5 gap-3 z-30 shrink-0">
        <button onClick={() => router.push(`/cabinet/${cabinetId}/dashboard`)}
          className="flex items-center gap-1.5 text-gray-500 hover:text-white transition-colors text-sm shrink-0">
          <ArrowLeft size={15} />
          <span className="hidden sm:inline">Mes PME</span>
        </button>
        <span className="text-white/20">/</span>
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-6 h-6 bg-cyan-500/20 border border-cyan-500/30 rounded-md flex items-center justify-center shrink-0">
            <Building2 size={11} className="text-cyan-400" />
          </div>
          <span className="text-white font-semibold text-sm truncate">
            {company?.tradeName || company?.legalName || '...'}
          </span>
          {company?.city && <span className="text-gray-600 text-xs hidden md:inline">· {company.city}</span>}
        </div>
        <div className="flex-1" />
        <span className="flex items-center gap-1.5 px-2.5 py-1 bg-purple-500/10 border border-purple-500/20 rounded-full text-purple-400 text-xs font-medium">
          <Briefcase size={11} />
          <span className="hidden sm:inline">Mode cabinet</span>
        </span>
      </header>

      <div className="flex flex-1 overflow-hidden">

        {/* Sidebar */}
        <aside className="w-52 shrink-0 border-r border-white/10 bg-black/20 flex flex-col py-3 px-2 overflow-y-auto">
          {SECTIONS.map(section => (
            <div key={section} className="mb-2">
              <button onClick={() => toggle(section)}
                className="w-full flex items-center justify-between px-3 py-1 text-[9px] text-gray-600 uppercase tracking-widest hover:text-gray-400 transition-colors">
                {section}
                <ChevronDown size={9} className={`transition-transform ${collapsed[section] ? '-rotate-90' : ''}`} />
              </button>
              {!collapsed[section] && NAV.filter(n => n.section === section).map(item => {
                const active = isActive(item.slug);
                const href   = `/cabinet/${cabinetId}/entreprise/${companyId}/${item.slug}`;
                return (
                  <Link key={item.slug} href={href}
                    className={`flex items-start gap-2 px-3 py-2 rounded-xl text-sm transition-colors mb-0.5 ${
                      active ? 'bg-cyan-500/15 text-cyan-400' : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}>
                    <item.icon size={13} className="mt-0.5 shrink-0" />
                    <div>
                      <p className={`font-medium leading-tight text-xs ${active ? 'text-cyan-400' : ''}`}>{item.label}</p>
                      <p className="text-[9px] text-gray-700 mt-0.5 leading-tight">{item.desc}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          ))}
        </aside>

        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}