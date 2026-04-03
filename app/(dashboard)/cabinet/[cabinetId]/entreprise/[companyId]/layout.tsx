// =============================================================================
// FICHIER : app/(dashboard)/cabinet/[cabinetId]/entreprise/[companyId]/layout.tsx
// ACTION  : CRÉER (nouveau fichier)
// RÔLE    : Layout partagé pour toutes les pages d'une PME vue par le cabinet
//           Affiche la topbar + sidebar de navigation (paie, bulletins, etc.)
// =============================================================================

'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter, usePathname } from 'next/navigation';
import {
  ArrowLeft, Building2, Briefcase, LayoutDashboard,
  FileText, Users, ClipboardList, Calculator,
} from 'lucide-react';
import Link from 'next/link';
import { api } from '@/services/api';

interface CompanyInfo {
  id: string;
  legalName: string;
  tradeName: string | null;
  city: string;
}

const NAV = [
  { label: 'Saisie variables', icon: FileText,      slug: 'paie',         desc: 'Variables du mois' },
  { label: 'Bulletins',        icon: ClipboardList,  slug: 'bulletins',    desc: 'Générer & exporter' },
  { label: 'Employés',         icon: Users,          slug: 'employes',     desc: 'Profils & salaires' },
  { label: 'Déclarations',     icon: Calculator,     slug: 'declarations', desc: 'CNSS, TUS, ITS' },
];

export default function CabinetCompanyLayout({ children }: { children: React.ReactNode }) {
  const params    = useParams();
  const router    = useRouter();
  const pathname  = usePathname();
  const cabinetId = params.cabinetId as string;
  const companyId = params.companyId as string;

  const [company, setCompany] = useState<CompanyInfo | null>(null);

  useEffect(() => {
    sessionStorage.setItem('cabinetContext', cabinetId);
    sessionStorage.setItem('activeCompanyId', companyId);
    api.get(`/companies/${companyId}`).then((r: any) => setCompany(r)).catch(() => null);
  }, [cabinetId, companyId]);

  const isActive = (slug: string) => pathname.includes(`/${slug}`);

  return (
    <div className="min-h-screen bg-[#020617] text-white flex flex-col">
      {/* Topbar */}
      <header className="h-14 border-b border-white/10 bg-black/40 backdrop-blur-sm flex items-center px-5 gap-3 z-30 shrink-0">
        <button
          onClick={() => router.push(`/cabinet/${cabinetId}/dashboard`)}
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

        <button
          onClick={() => router.push(`/cabinet/${cabinetId}/dashboard`)}
          className="p-1.5 hover:bg-white/5 rounded-lg text-gray-500 hover:text-white transition-colors"
          title="Dashboard cabinet">
          <LayoutDashboard size={15} />
        </button>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-52 shrink-0 border-r border-white/10 bg-black/20 flex flex-col py-4 px-2">
          <p className="text-[10px] text-gray-600 uppercase tracking-wider px-3 mb-2">Paie</p>
          {NAV.map(item => {
            const active = isActive(item.slug);
            const href = `/cabinet/${cabinetId}/entreprise/${companyId}/${item.slug}`;
            return (
              <Link key={item.slug} href={href}
                className={`flex items-start gap-2.5 px-3 py-2.5 rounded-xl text-sm transition-colors mb-0.5 ${
                  active ? 'bg-cyan-500/15 text-cyan-400' : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}>
                <item.icon size={15} className="mt-0.5 shrink-0" />
                <div>
                  <p className={`font-medium leading-tight ${active ? 'text-cyan-400' : ''}`}>{item.label}</p>
                  <p className="text-[10px] text-gray-600 mt-0.5">{item.desc}</p>
                </div>
              </Link>
            );
          })}
        </aside>

        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}