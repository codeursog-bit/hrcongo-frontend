'use client';

// app/pme/[companyId]/layout.tsx
// Layout PME blanc-marque — mêmes pages que Konza entreprise, sans boutons génération paie

import React, { useEffect, useState } from 'react';
import { useParams, useRouter, usePathname } from 'next/navigation';
import {
  LayoutDashboard, Users, Fingerprint, Calendar, FileText,
  BarChart3, BookOpen, Package, Star, FileCheck, Settings,
  LogOut, Building2, ChevronRight, DollarSign, Briefcase,
  Network, AlertCircle, User,
} from 'lucide-react';
import { api } from '@/services/api';

interface Branding {
  name: string;
  logo: string | null;
  primaryColor: string;
  secondaryColor: string;
}

// Navigation PME complète — identique Konza entreprise
// SAUF : pas de liens vers génération paie (/paie/nouveau, /paie/masse, /paie/simulateur)
// Ces routes sont bloquées côté PME mais la "vue paie" (stats) reste accessible
const NAV: { slug: string; label: string; icon: React.ElementType; section: string }[] = [
  // RH
  { slug: 'dashboard',   label: 'Tableau de bord',  icon: LayoutDashboard, section: 'RH' },
  { slug: 'employes',    label: 'Employés',          icon: Users,           section: 'RH' },
  { slug: 'presences',   label: 'Présences',         icon: Fingerprint,     section: 'RH' },
  { slug: 'conges',      label: 'Congés',            icon: Calendar,        section: 'RH' },
  { slug: 'contrats',    label: 'Contrats',          icon: FileCheck,       section: 'RH' },
  { slug: 'documents',   label: 'Documents',         icon: FileText,        section: 'RH' },
  { slug: 'formation',   label: 'Formation',         icon: BookOpen,        section: 'RH' },
  { slug: 'performance', label: 'Performance',       icon: Star,            section: 'RH' },
  { slug: 'materiel',    label: 'Matériel',          icon: Package,         section: 'RH' },
  // Paie (lecture seule)
  { slug: 'paie',        label: 'Paie',              icon: DollarSign,      section: 'Paie' },
  { slug: 'bulletins',   label: 'Bulletins',         icon: FileText,        section: 'Paie' },
  // Rapports
  { slug: 'rapports',    label: 'Rapports',          icon: BarChart3,       section: 'Rapports' },
  // Config
  { slug: 'parametres',  label: 'Paramètres',        icon: Settings,        section: 'Config' },
];

const SECTIONS = ['RH', 'Paie', 'Rapports', 'Config'];

export default function PmeLayout({ children }: { children: React.ReactNode }) {
  const params    = useParams();
  const router    = useRouter();
  const pathname  = usePathname();
  const companyId = params.companyId as string;

  const [branding,  setBranding]  = useState<Branding>({
    name: '', logo: null, primaryColor: '#0ea5e9', secondaryColor: '#6366f1',
  });
  const [companyName, setCompanyName] = useState('...');
  const [loading,     setLoading]     = useState(true);
  const [userEmail,   setUserEmail]   = useState('');

  useEffect(() => {
    const stored = localStorage.getItem('user');
    const user   = stored ? JSON.parse(stored) : {};

    // Vérification accès strict
    if (user.companyId !== companyId && user.role !== 'SUPER_ADMIN') {
      router.replace('/auth/login');
      return;
    }
    setUserEmail(user.email || '');

    const load = async () => {
      try {
        const comp: any = await api.get(`/companies/${companyId}`);
        setCompanyName(comp.tradeName || comp.legalName || '...');

        // Charger le branding du cabinet
        const cabId = user.cabinetId || comp.cabinetId;
        if (cabId) {
          try {
            const cab: any = await api.get(`/cabinet/${cabId}`);
            setBranding({
              name:           cab.name           || 'Cabinet',
              logo:           cab.logo           || null,
              primaryColor:   cab.primaryColor   || '#0ea5e9',
              secondaryColor: cab.secondaryColor || '#6366f1',
            });
          } catch {
            setBranding(b => ({ ...b, name: 'Cabinet' }));
          }
        }
      } catch {
        router.replace('/auth/login');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [companyId, router]);

  const primary = branding.primaryColor;

  const isActive = (slug: string) =>
    pathname === `/pme/${companyId}/${slug}` ||
    pathname.startsWith(`/pme/${companyId}/${slug}/`);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-white/10 border-t-white/60 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020617] text-white flex">

      {/* ── Sidebar ───────────────────────────────────────────────────────────── */}
      <aside className="fixed left-0 top-0 h-full w-56 bg-black/40 border-r border-white/8 flex flex-col z-20 overflow-hidden">

        {/* Logo cabinet (white-label : PME voit son cabinet, pas Konza) */}
        <div className="p-4 border-b border-white/8 shrink-0">
          <div className="flex items-center gap-2.5">
            {branding.logo ? (
              <img src={branding.logo} alt={branding.name}
                   className="h-8 w-auto object-contain max-w-[120px]" />
            ) : (
              <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                   style={{ background: `${primary}30`, border: `1px solid ${primary}50` }}>
                <Briefcase size={14} style={{ color: primary }} />
              </div>
            )}
            <div className="min-w-0">
              <p className="font-bold text-xs text-white truncate">{branding.name || 'Cabinet'}</p>
              <p className="text-[10px] text-gray-600 truncate">{companyName}</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-3 px-2 overflow-y-auto">
          {SECTIONS.map(section => {
            const items = NAV.filter(n => n.section === section);
            return (
              <div key={section} className="mb-3">
                <p className="text-[9px] text-gray-700 uppercase tracking-widest px-3 mb-1">{section}</p>
                {items.map(item => {
                  const active = isActive(item.slug);
                  return (
                    <button key={item.slug}
                      onClick={() => router.push(`/pme/${companyId}/${item.slug}`)}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm transition-all mb-0.5 text-left"
                      style={active
                        ? { background: `${primary}22`, color: primary, fontWeight: 600 }
                        : {}
                      }
                    >
                      <item.icon size={14} className={active ? '' : 'text-gray-500'}
                        style={active ? { color: primary } : {}} />
                      <span className={active ? '' : 'text-gray-400 hover:text-white'}>
                        {item.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            );
          })}
        </nav>

        {/* User + logout */}
        <div className="p-3 border-t border-white/8 shrink-0">
          {userEmail && (
            <p className="text-[10px] text-gray-600 truncate px-2 mb-2">{userEmail}</p>
          )}
          <button onClick={() => { localStorage.clear(); router.push('/auth/login'); }}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-red-500/10 text-gray-500 hover:text-red-400 text-sm transition-colors">
            <LogOut size={14} /> Déconnexion
          </button>
        </div>
      </aside>

      {/* ── Contenu ───────────────────────────────────────────────────────────── */}
      <main className="ml-56 flex-1 min-h-screen flex flex-col">

        {/* Topbar */}
        <header className="h-12 border-b border-white/8 bg-black/20 flex items-center px-5 gap-2 sticky top-0 z-10 shrink-0">
          <span className="text-gray-600 text-xs truncate max-w-[120px]">{companyName}</span>
          <ChevronRight size={11} className="text-gray-700 shrink-0" />
          <span className="text-gray-400 text-xs capitalize truncate">
            {pathname.split('/').pop()?.replace(/-/g, ' ') || 'Dashboard'}
          </span>
          <div className="flex-1" />
          {/* Badge discret cabinet */}
          <span className="text-[10px] text-gray-700 px-2 py-1 bg-white/3 border border-white/5 rounded-full truncate max-w-[100px]">
            {branding.name}
          </span>
        </header>

        {/* Page content */}
        <div className="flex-1 p-6">{children}</div>
      </main>
    </div>
  );
}