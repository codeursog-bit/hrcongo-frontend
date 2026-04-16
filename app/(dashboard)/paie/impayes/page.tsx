'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard, Users, Wallet, Calendar, Clock, BarChart3,
  FileText, Settings, LogOut, Hexagon, Briefcase, Target,
  GraduationCap, Flag, Monitor, Fingerprint, FolderHeart,
  UserCircle, Users2, HandCoins, ScanLine, ClipboardEdit,
  ChevronDown, ChevronUp, FileCheck, History, UserMinus, AlertCircle
} from 'lucide-react';
import { NavItem, UserProfile, UserRole } from '../../../../types';
import Image from 'next/image';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  brandName?: string | null;
  brandLogo?: string | null;
  brandColor?: string | null;
  basePath?: string;
}

const navItems: NavItem[] = [
  {
    id: 'dashboard',
    label: 'Tableau de bord',
    icon: LayoutDashboard,
    path: '/dashboard',
    allowedRoles: ['SUPER_ADMIN', 'ADMIN', 'HR_MANAGER', 'MANAGER', 'EMPLOYEE'],
  },

  // ─── Section Admin / RH ─────────────────────────────────────────────────────
  {
    id: 'employes',
    label: 'Gestion Employés',
    icon: Users,
    path: '/employes',
    allowedRoles: ['SUPER_ADMIN', 'ADMIN', 'HR_MANAGER'],
  },
  {
    id: 'paie',
    label: 'Paie & Salaires',
    icon: Wallet,
    path: '/paie',
    allowedRoles: ['SUPER_ADMIN', 'ADMIN', 'HR_MANAGER'],
  },
  {
    id: 'loans',
    label: 'Avances & Prêts',
    icon: HandCoins,
    path: '/loans',
    allowedRoles: ['SUPER_ADMIN', 'ADMIN', 'HR_MANAGER'],
  },
  {
    id: 'conges',
    label: 'Validation Congés',
    icon: Calendar,
    path: '/conges',
    allowedRoles: ['SUPER_ADMIN', 'ADMIN', 'HR_MANAGER'],
  },

  // Pointage Admin / RH (ORDRE CORRIGÉ : Présences avant Pointage Manuel)
  {
    id: 'presences_equipe_admin',
    label: 'Présences Équipe',
    icon: Users2,
    path: '/presences',
    allowedRoles: ['SUPER_ADMIN', 'ADMIN', 'HR_MANAGER'],
  },
  {
    id: 'pointage_manuel_admin',
    label: 'Pointage Manuel',
    icon: ClipboardEdit,
    path: '/presences/pointage-manuel',
    allowedRoles: ['SUPER_ADMIN', 'ADMIN', 'HR_MANAGER'],
  },
    
  // ─── Section Manager ────────────────────────────────────────────────────────
  {
    id: 'mon_equipe',
    label: 'Mon Équipe',
    icon: Users2,
    path: '/employes',
    allowedRoles: ['MANAGER'],
  },
  {
    id: 'conges_manager',
    label: 'Validation Congés',
    icon: Calendar,
    path: '/conges',
    allowedRoles: ['MANAGER'],
  },
  {
    id: 'presences_equipe_manager',
    label: 'Présences Équipe',
    icon: Users2,
    path: '/presences',
    allowedRoles: ['MANAGER'],
  },
  {
    id: 'pointage_manuel_manager',
    label: 'Pointage Équipe',
    icon: ClipboardEdit,
    path: '/presences/pointage-manuel',
    allowedRoles: ['MANAGER'],
  },
  {
    id: 'pointage_gps_manager',
    label: 'Ma Pointeuse GPS',
    icon: ScanLine,
    path: '/presences/pointage',
    allowedRoles: ['MANAGER'],
  },
  {
    id: 'mes_conges_manager',
    label: 'Mes Demandes',
    icon: FolderHeart,
    path: '/conges/mon-espace',
    allowedRoles: ['MANAGER'],
  },

  // ─── Section Employé ────────────────────────────────────────────────────────
  {
    id: 'mes_presences',
    label: 'Mes Présences',
    icon: Users2,
    path: '/presences',
    allowedRoles: ['EMPLOYEE'],
  },
  {
    id: 'pointage_gps_employee',
    label: 'Ma Pointeuse GPS',
    icon: ScanLine,
    path: '/presences/pointage',
    allowedRoles: ['EMPLOYEE'],
  },
  {
    id: 'mes_conges',
    label: 'Mes Demandes',
    icon: FolderHeart,
    path: '/conges/mon-espace',
    allowedRoles: ['EMPLOYEE'],
  },

  // ─── Autres modules ────────────────────────────────────────────
  {
    id: 'recrutement',
    label: 'Recrutement',
    icon: Briefcase,
    path: '/recrutement',
    allowedRoles: ['SUPER_ADMIN', 'ADMIN', 'HR_MANAGER'],
  },
  {
    id: 'materiel',
    label: 'Matériel',
    icon: Monitor,
    path: '/materiel',
    allowedRoles: ['SUPER_ADMIN', 'ADMIN', 'HR_MANAGER'],
  },
  {
    id: 'formation',
    label: 'Formation',
    icon: GraduationCap,
    path: '/formation',
    allowedRoles: ['SUPER_ADMIN', 'ADMIN', 'HR_MANAGER', 'MANAGER', 'EMPLOYEE'], // Manager Ajouté
  },
  {
    id: 'rapports',
    label: 'Rapports',
    icon: BarChart3,
    path: '/rapports',
    allowedRoles: ['SUPER_ADMIN', 'ADMIN', 'HR_MANAGER'],
  },
  {
    id: 'parametres',
    label: 'Paramètres',
    icon: Settings,
    path: '/parametres',
    allowedRoles: ['SUPER_ADMIN', 'ADMIN', 'HR_MANAGER'],
  },
];

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  brandName,
  brandLogo,
  brandColor,
  basePath = '',
}) => {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isAutreOpen, setIsAutreOpen] = useState(false); // État pour le dropdown "Autre"

  const isWhiteLabel = !!(brandName || brandLogo);
  const accentColor = brandColor || '#0ea5e9';

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setUser({
          id: parsed.id,
          name: `${parsed.firstName} ${parsed.lastName}`,
          role: (parsed.role as UserRole) || 'EMPLOYEE',
          avatarUrl: `https://ui-avatars.com/api/?name=${parsed.firstName}+${parsed.lastName}&background=random&color=fff&background=0ea5e9`,
          isOnline: true,
        });
      } catch (e) { console.error('Session sync error', e); }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
    localStorage.removeItem('notifications_muted_until');
    router.replace('/auth/login');
  };

  const roleLabels: Record<string, string> = {
    SUPER_ADMIN: 'Super Admin',
    ADMIN: 'Admin',
    HR_MANAGER: 'RH',
    MANAGER: 'Manager',
    EMPLOYEE: 'Employé',
  };

  const buildPath = (itemPath: string) => {
    if (!basePath) return itemPath;
    const slug = itemPath.replace(/^\//, '');
    return `${basePath}/${slug}`;
  };

  // ✅ Correction du Bug d'activation : 
  // Si le path est /presences, on veut un match exact pour éviter d'activer "Présences Équipe" quand on est sur "Pointage Manuel"
  const isActive = (itemPath: string) => {
    const full = buildPath(itemPath);
    if (full === '/presences') return pathname === full;
    return pathname === full || pathname.startsWith(full + '/');
  };

  // Menu "Autre" Items
  const autreItems = [
    { label: 'Déclaration CNSS', path: '/cnss-declaration', icon: FileCheck },
    { label: 'Contrats', path: '/contrats', icon: History },
    { label: 'Rupture Contrats', path: '/contrats/rupture', icon: UserMinus },
    { label: 'Salaires Impayés', path: '/paie/impayes', icon: AlertCircle },
  ];

  const showAutreMenu = user && ['SUPER_ADMIN', 'ADMIN', 'HR_MANAGER'].includes(user.role);

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden print:hidden" onClick={onClose} />
      )}

      <aside className={`fixed md:static inset-y-0 left-0 z-50 w-[280px] m-4 rounded-[2rem] bg-white/80 border border-white/50 shadow-xl shadow-slate-200/50 dark:bg-slate-900/80 dark:border-white/10 dark:shadow-[0_0_40px_-10px_rgba(0,0,0,0.5)] backdrop-blur-2xl transform transition-all duration-500 cubic-bezier(0.4, 0, 0.2, 1) flex flex-col overflow-hidden ${isOpen ? 'translate-x-0' : '-translate-x-[120%] md:translate-x-0'} print:hidden`}>
        <div className="absolute top-0 left-0 right-0 h-px opacity-0 dark:opacity-60" style={{ background: isWhiteLabel ? `linear-gradient(to right, transparent, ${accentColor}, transparent)` : 'linear-gradient(to right, transparent, #06b6d4, transparent)' }} />

        {/* Logo Section */}
        <div className="px-6 pt-5 pb-2">
          {isWhiteLabel ? (
            <div className="flex flex-col items-start">
              <div className="flex items-center gap-3">
                {brandLogo ? (
                  <img src={brandLogo} alt={brandName ?? 'Cabinet'} style={{ height: 36, width: 'auto', maxWidth: 150, objectFit: 'contain' }} />
                ) : (
                  <div className="flex items-center justify-center rounded-xl shrink-0" style={{ width: 40, height: 40, background: `${accentColor}22`, border: `1.5px solid ${accentColor}50` }}>
                    <span className="text-sm font-black" style={{ color: accentColor }}>{(brandName ?? 'C').slice(0, 2).toUpperCase()}</span>
                  </div>
                )}
                {!brandLogo && brandName && <p className="font-black text-sm leading-tight" style={{ color: accentColor, maxWidth: 160 }}>{brandName}</p>}
              </div>
              <div className="flex items-center gap-1.5 mt-2 pl-1">
                <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: accentColor, boxShadow: `0 0 6px ${accentColor}` }} />
                <span className="text-[10px] font-bold tracking-widest uppercase" style={{ color: accentColor }}>Portail RH</span>
              </div>
            </div>
          ) : (
            <Link href="/dashboard" className="inline-flex flex-col items-start group">
              <Image src="/logos/konza_logo_h_color.png" alt="Konza RH Logo" width={507} height={240} priority className="block dark:hidden transition-opacity duration-300 group-hover:opacity-80" style={{ width: '170px', height: 'auto', objectFit: 'contain' }} />
              <Image src="/logos/konza_logo_h_white.png" alt="Konza RH Logo" width={507} height={240} priority className="hidden dark:block transition-opacity duration-300 group-hover:opacity-80" style={{ width: '170px', height: 'auto', objectFit: 'contain' }} />
              <div className="flex items-center gap-1.5 mt-1.5 pl-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_6px_#10b981]" />
                <span className="text-[10px] text-slate-500 dark:text-cyan-400 font-bold tracking-widest uppercase">Online</span>
              </div>
            </Link>
          )}
        </div>

        {/* User Card */}
        <div className="px-4 pb-4 pt-2">
          <div className="bg-slate-50/80 dark:bg-white/5 rounded-2xl p-3 flex items-center gap-3 border border-slate-100 dark:border-white/5 hover:border-sky-200 dark:hover:border-white/10 transition-colors group">
            <div className="relative shrink-0">
              {user ? (
                <img src={user.avatarUrl} alt={user.name} className="w-10 h-10 rounded-xl object-cover ring-2 ring-white dark:ring-white/10 shadow-sm" />
              ) : (
                <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-slate-700 animate-pulse" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              {user ? (
                <>
                  <h3 className="text-sm font-bold text-slate-800 dark:text-white truncate">{user.name}</h3>
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-white dark:bg-white/10 text-sky-600 dark:text-cyan-300 border border-slate-100 dark:border-white/5 shadow-sm" style={isWhiteLabel ? { color: accentColor } : {}}>
                    {roleLabels[user.role] || user.role}
                  </span>
                </>
              ) : (
                <div className="h-8 w-20 bg-slate-200 dark:bg-slate-700/50 rounded animate-pulse" />
              )}
            </div>
          </div>
        </div>

        {/* Nav Menu */}
        <nav className="flex-1 px-3 pb-4 overflow-y-auto space-y-1 custom-scrollbar">
          {navItems
            .filter(item => user && item.allowedRoles.includes(user.role))
            .map(item => {
              const active = isActive(item.path);
              const fullPath = buildPath(item.path);

              return (
                <Link
                  key={item.id}
                  href={fullPath}
                  onClick={() => { if (window.innerWidth < 768) onClose(); }}
                  className={`relative w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 group overflow-hidden ${active ? 'text-sky-700 dark:text-white bg-sky-50 dark:bg-white/5 border border-sky-100 dark:border-cyan-500/30 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/5 border border-transparent'}`}
                  style={active && isWhiteLabel ? { color: accentColor, background: `${accentColor}12`, borderColor: `${accentColor}40` } : {}}
                >
                  {active && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full" style={{ background: isWhiteLabel ? accentColor : '#0ea5e9', boxShadow: isWhiteLabel ? `0 0 15px ${accentColor}80` : '0 0 15px #0ea5e9' }} />
                  )}
                  <item.icon size={20} className={`transition-all duration-300 z-10 ${active ? 'scale-110' : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-200'}`} style={active && isWhiteLabel ? { color: accentColor } : {}} />
                  <span className="relative z-10">{item.label}</span>
                </Link>
              );
            })}

          {/* ── Menu Déroulant "Autre" (Admin/RH) ── */}
          {showAutreMenu && (
            <div className="pt-2">
              <button
                onClick={() => setIsAutreOpen(!isAutreOpen)}
                className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5 transition-all"
              >
                <div className="flex items-center gap-3">
                  <Hexagon size={20} className="text-slate-400" />
                  <span>Autre</span>
                </div>
                {isAutreOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
              
              {isAutreOpen && (
                <div className="mt-1 ml-4 pl-4 border-l border-slate-100 dark:border-white/10 space-y-1">
                  {autreItems.map((sub) => {
                    const subActive = pathname === sub.path;
                    return (
                      <Link
                        key={sub.path}
                        href={sub.path}
                        className={`flex items-center gap-3 px-4 py-2 rounded-lg text-xs font-medium transition-all ${subActive ? 'text-sky-600 dark:text-cyan-400 bg-sky-50/50 dark:bg-white/5' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}
                      >
                        <sub.icon size={14} />
                        {sub.label}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-slate-100 dark:border-white/5">
          <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-bold text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-all border border-transparent hover:border-red-100 dark:hover:border-red-500/20 group">
            <LogOut size={18} className="group-hover:-translate-x-1 transition-transform" />
            <span>Déconnexion</span>
          </button>
        </div>
      </aside>
    </>
  );
};