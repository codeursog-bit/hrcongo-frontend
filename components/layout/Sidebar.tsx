'use client';

import { api } from '@/services/api';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard, Users, Wallet, Calendar, Clock, BarChart3,
  FileText, Settings, LogOut, Hexagon, Briefcase, Target,
  GraduationCap, Flag, Monitor, Fingerprint, FolderHeart,
  UserCircle, Users2, HandCoins, ScanLine, ClipboardEdit, Ticket,
  ChevronDown, ChevronUp, FileCheck, History, UserMinus, AlertCircle, BookOpen, Inbox, PenTool, MessageSquare
} from 'lucide-react';
import { NavItem, UserProfile, UserRole } from '../../types';
import Image from 'next/image';
import { useMyEmployeePhoto } from '@/hooks/useMyEmployeePhoto';

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
    id: 'performance_manager',
    label: 'Performance Équipe',
    icon: Target,
    path: '/performance',
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
    label: 'Mes congés',
    icon: FolderHeart,
    path: '/conges/mon-espace',
    allowedRoles: ['MANAGER'],
  },
  {
    id: 'mes_absences_manager',
    label: 'Mes Absences',
    icon: UserMinus,
    path: '/presences/absences/mon-espace',
    allowedRoles: ['MANAGER'],
  },
  {
    id: 'mes_permissions_manager',
    label: 'Mes Permissions',
    icon: Ticket,
    path: '/presences/permissions/mon-espace',
    allowedRoles: ['MANAGER'],
  },
  {
    id: 'mes_prets_manager',
    label: 'Mes Prêts & Avances',
    icon: HandCoins,
    path: '/loans/mon-espace',
    allowedRoles: ['MANAGER'],
  },
  {
    id: 'ma_paie_manager',
    label: 'Ma Paie',
    icon: Wallet,
    path: '/ma-paie',
    allowedRoles: ['MANAGER'],
  },
  {
    id: 'ma_performance_manager',
    label: 'Ma Performance',
    icon: Target,
    path: '/performance/mon-espace',
    allowedRoles: ['MANAGER'],
  },
  {
    id: 'mon_profil_manager',
    label: 'Mon Profil',
    icon: UserCircle,
    path: '/mon-profil',
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
    label: 'Mes congés',
    icon: FolderHeart,
    path: '/conges/mon-espace',
    allowedRoles: ['EMPLOYEE'],
  },
  {
    id: 'mes_absences',
    label: 'Mes Absences',
    icon: UserMinus,
    path: '/presences/absences/mon-espace',
    allowedRoles: ['EMPLOYEE'],
  },
  {
    id: 'mes_permissions',
    label: 'Mes Permissions',
    icon: Ticket,
    path: '/presences/permissions/mon-espace',
    allowedRoles: ['EMPLOYEE'],
  },
  {
    id: 'mes_prets',
    label: 'Mes Prêts & Avances',
    icon: HandCoins,
    path: '/loans/mon-espace',
    allowedRoles: ['EMPLOYEE'],
  },
  {
    id: 'ma_paie',
    label: 'Ma Paie',
    icon: Wallet,
    path: '/ma-paie',
    allowedRoles: ['EMPLOYEE'],
  },
  {
    id: 'ma_performance',
    label: 'Ma Performance',
    icon: Target,
    path: '/performance/mon-espace',
    allowedRoles: ['EMPLOYEE'],
  },
  {
    id: 'mon_profil',
    label: 'Mon Profil',
    icon: UserCircle,
    path: '/mon-profil',
    allowedRoles: ['EMPLOYEE'],
  },

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
    allowedRoles: ['SUPER_ADMIN', 'ADMIN', 'HR_MANAGER', 'MANAGER', 'EMPLOYEE'],
  },
  {
    id: 'performance',
    label: 'Performance',
    icon: Target,
    path: '/performance',
    allowedRoles: ['SUPER_ADMIN', 'ADMIN', 'HR_MANAGER'],
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
  // 🆕 Photo de la fiche employé si la personne connectée en a une (admin
  // multi-comptes qui est aussi employé, ou employé/manager/RH classique).
  // Reste `null` sinon (404 avalé silencieusement par le hook) — on retombe
  // alors sur l'avatar à initiales généré ci-dessous, comportement inchangé.
  const employeePhotoUrl = useMyEmployeePhoto();
  const [isAutreOpen, setIsAutreOpen] = useState(false);
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);
  // 🆕 Permission "secrétaire" : pointage manuel pour tout le monde
  const [hasAttendanceAllPermission, setHasAttendanceAllPermission] = useState(false);
  // ✅ LOT A — droit de signer accordé par l'admin (fonction de validation)
  const [canSignPersonally, setCanSignPersonally] = useState(false);
  // ✅ LOT B — l'entrée "Avis à donner" n'apparaît que pour les titulaires d'une fonction
  const [hasApprovalFunction, setHasApprovalFunction] = useState(false);

  const isWhiteLabel = !!(brandName || brandLogo);
  const accentColor = brandColor || '#10B981';

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setUser({
          id: parsed.id,
          name: `${parsed.firstName} ${parsed.lastName}`,
          role: (parsed.role as UserRole) || 'EMPLOYEE',
          avatarUrl: `https://ui-avatars.com/api/?name=${parsed.firstName}+${parsed.lastName}&background=random&color=fff&background=10B981`,
          isOnline: true,
        });
        setHasAttendanceAllPermission(!!parsed.canRecordAttendanceForAll); // 🆕
      } catch (e) { console.error('Session sync error', e); }
    }
  }, []);

  // ✅ LOT A — l'entrée "Ma signature" n'apparaît que si l'admin a accordé le droit de signer.
  // Échec silencieux (ex. backend pas encore déployé) → le menu reste identique à avant.
  useEffect(() => {
    if (!localStorage.getItem('user')) return;
    api.get<{ canSign?: boolean; functions?: unknown[]; externalCompanies?: unknown[] }>('/approvals/me')
      .then((me) => {
        setCanSignPersonally(!!me?.canSign);
        setHasApprovalFunction((me?.functions?.length ?? 0) > 0 || (me?.externalCompanies?.length ?? 0) > 0);
      })
      .catch(() => {});
  }, []);

  // Compteur de demandes en attente (absences, permissions, congés) pour Admin/HR_MANAGER
  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (!stored) return;
    let parsedUser: any;
    try { parsedUser = JSON.parse(stored); } catch { return; }
    if (!['SUPER_ADMIN', 'ADMIN', 'HR_MANAGER'].includes(parsedUser.role)) return;

    api.get('/dashboard/pending-requests-count')
      .then((counts: any) => setPendingRequestsCount(counts?.total || 0))
      .catch(() => {});
  }, []);

  const handleLogout = async () => {
    // Le cookie HttpOnly est révoqué côté serveur via /auth/logout
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch { /* silencieux */ } finally {
      localStorage.removeItem('user');
      localStorage.removeItem('notifications_muted_until');
      router.replace('/auth/login');
    }
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

  const isActive = (itemPath: string) => {
    const full = buildPath(itemPath);
    if (itemPath === '/presences') return pathname === full; // exact (marche aussi avec basePath)
    // Manager : « Performance Équipe » (/performance) ne doit pas rester allumé sur sa page « Ma Performance »
    if (full.endsWith('/performance') && user?.role === 'MANAGER' && pathname.startsWith(full + '/mon-espace')) return false;
    return pathname === full || pathname.startsWith(full + '/');
  };

  // ─── Menu "Autre" Items ─────────────────────────────────────────────────────
  const autreItems = [
    { label: 'Planning des Shifts', path: '/presences/shifts', icon: Clock },
    { label: 'Déclaration CNSS', path: '/cnss-declaration', icon: FileCheck },
    { label: 'Contrats', path: '/contrats', icon: History },
    { label: 'Documents admnistratifs', path: '/documents', icon: FileCheck },
    { label: 'Salaires Impayés', path: '/paie/impayes', icon: AlertCircle }, 
    { label: 'Demandes', path: '/demandes', icon: Inbox },
  ];

  const showAutreMenu = user && ['SUPER_ADMIN', 'ADMIN', 'HR_MANAGER'].includes(user.role);

  // 🆕 Items visibles uniquement pour un EMPLOYEE ayant reçu la permission
  //    "secrétaire" (pointage manuel pour tout le monde) — sinon un employé
  //    standard n'a accès qu'à "Mes Présences".
  const secretaryExtraItems: NavItem[] =
    user?.role === 'EMPLOYEE' && hasAttendanceAllPermission
      ? [
          {
            id: 'presences_equipe_secretary',
            label: 'Présences Équipe',
            icon: Users2,
            path: '/presences',
            allowedRoles: ['EMPLOYEE'],
          },
          {
            id: 'pointage_manuel_secretary',
            label: 'Pointage Manuel',
            icon: ClipboardEdit,
            path: '/presences/pointage-manuel',
            allowedRoles: ['EMPLOYEE'],
          },
        ]
      : [];

  // 🆕 Admin / RH : ils ont aussi leur propre fiche employé → « Ma Pointeuse » (+ « Avis à donner »
  //    s'ils ont une fonction de validation) juste après le Tableau de bord.
  const isAdminLike = !!user && ['ADMIN', 'HR_MANAGER'].includes(user.role);
  const adminSelfItems: NavItem[] = isAdminLike
    ? [
        {
          id: 'pointage_gps_admin',
          label: 'Ma Pointeuse',
          icon: ScanLine,
          path: '/presences/pointage',
          allowedRoles: ['ADMIN', 'HR_MANAGER'],
        },
        ...(hasApprovalFunction
          ? [
              {
                id: 'avis',
                label: 'Avis à donner',
                icon: MessageSquare,
                path: '/avis',
                allowedRoles: ['ADMIN', 'HR_MANAGER'],
              } as NavItem,
            ]
          : []),
      ]
    : [];

  // ✅ LOT A — "Ma signature" : visible quel que soit le rôle, si le droit est accordé.
  const approvalExtraItems: NavItem[] = [
    ...(hasApprovalFunction
      ? [
          {
            id: 'avis',
            label: 'Avis à donner',
            icon: MessageSquare,
            path: '/avis',
            allowedRoles: ['SUPER_ADMIN', 'ADMIN', 'HR_MANAGER', 'MANAGER', 'EMPLOYEE'],
          } as NavItem,
        ]
      : []),
    ...(canSignPersonally
    ? [
        {
          id: 'ma_signature',
          label: 'Ma signature',
          icon: PenTool,
          path: '/ma-signature',
          allowedRoles: ['SUPER_ADMIN', 'ADMIN', 'HR_MANAGER', 'MANAGER', 'EMPLOYEE'],
        } as NavItem,
      ]
    : []),
  ];

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden print:hidden" onClick={onClose} />
      )}

      <aside className={`fixed md:static inset-y-0 left-0 z-50 w-[272px] flex flex-col overflow-hidden transform transition-transform duration-300 ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'} print:hidden`} style={{ background: 'var(--surface)', borderRight: '1px solid var(--border)' }}>
        <div className="absolute top-0 left-0 right-0 h-px opacity-0 dark:opacity-70" style={{ background: isWhiteLabel ? `linear-gradient(to right, transparent, ${accentColor}, transparent)` : 'linear-gradient(to right, transparent, #10B981, transparent)' }} />

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
                <span className="text-[10px] text-slate-500 dark:text-emerald-400 font-bold tracking-widest uppercase">Online</span>
              </div>
            </Link>
          )}
        </div>

        {/* User Profile Card */}
        <div className="px-4 pb-4 pt-2">
          <div className="rounded-xl p-3 flex items-center gap-3 transition-colors group" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
            <div className="relative shrink-0">
              {user ? (
                <img src={employeePhotoUrl || user.avatarUrl} alt={user.name} className="w-9 h-9 rounded-lg object-cover" />
              ) : (
                <div className="w-9 h-9 rounded-lg animate-pulse" style={{ background: 'var(--border)' }} />
              )}
            </div>
            <div className="flex-1 min-w-0">
              {user ? (
                <>
                  <h3 className="text-sm font-bold truncate" style={{ color: 'var(--text)' }}>{user.name}</h3>
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold text-emerald-600 dark:text-emerald-400" style={isWhiteLabel ? { color: accentColor } : {}}>
                    {roleLabels[user.role] || user.role}
                  </span>
                </>
              ) : (
                <div className="h-8 w-20 rounded animate-pulse" style={{ background: 'var(--border)' }} />
              )}
            </div>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 px-3 pb-4 overflow-y-auto space-y-0.5 custom-scrollbar">
          {(() => {
            // 🆕 Regroupement visuel des menus par thème — purement d'affichage,
            //    ne touche ni à la liste filtrée par rôle ni aux permissions.
            const CATEGORY: Record<string, string> = {
              employes: 'Gestion RH', paie: 'Gestion RH', loans: 'Gestion RH', conges: 'Gestion RH',
              presences_equipe_admin: 'Gestion RH', pointage_manuel_admin: 'Gestion RH',
              presences_equipe_secretary: 'Gestion RH', pointage_manuel_secretary: 'Gestion RH',
              mon_equipe: 'Mon équipe', performance_manager: 'Mon équipe', conges_manager: 'Mon équipe', presences_equipe_manager: 'Mon équipe', pointage_manuel_manager: 'Mon équipe',
              pointage_gps_manager: 'Mon espace', mes_conges_manager: 'Mon espace', mes_absences_manager: 'Mon espace', mes_permissions_manager: 'Mon espace', mes_prets_manager: 'Mon espace', ma_paie_manager: 'Mon espace', mon_profil_manager: 'Mon espace', ma_performance_manager: 'Mon espace',
              mes_presences: 'Mon espace', pointage_gps_employee: 'Mon espace', mes_conges: 'Mon espace', mes_absences: 'Mon espace', mes_permissions: 'Mon espace', mes_prets: 'Mon espace', ma_paie: 'Mon espace', mon_profil: 'Mon espace', ma_performance: 'Mon espace',
              ma_signature: 'Mon espace', avis: 'Mon espace', pointage_gps_admin: 'Mon espace',
              recrutement: 'Organisation', materiel: 'Organisation', formation: 'Organisation', performance: 'Organisation', rapports: 'Organisation', parametres: 'Organisation',
            };

            const baseItems = navItems.filter(item => user && item.allowedRoles.includes(user.role));
            // Admin/RH : « Avis à donner » est déjà placé sous le tableau de bord → pas de doublon en bas
            const trailingExtras = [
              ...secretaryExtraItems,
              ...approvalExtraItems.filter(i => !(isAdminLike && i.id === 'avis')),
            ];
            const items = isAdminLike
              ? [
                  ...baseItems.filter(i => i.id === 'dashboard'),
                  ...adminSelfItems,
                  ...baseItems.filter(i => i.id !== 'dashboard'),
                  ...trailingExtras,
                ]
              : [...baseItems, ...trailingExtras];

            let lastCategory: string | null = null;

            return items.map(item => {
              const active = isActive(item.path);
              const fullPath = buildPath(item.path);
              const category = CATEGORY[item.id] || null;
              const showLabel = category && category !== lastCategory;
              lastCategory = category;

              return (
                <React.Fragment key={item.id}>
                  {showLabel && (
                    <div className="px-4 pt-4 pb-1.5 first:pt-1">
                      <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>{category}</span>
                    </div>
                  )}
                  <Link
                    href={fullPath}
                    onClick={() => { if (window.innerWidth < 768) onClose(); }}
                    className="relative w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-200 group"
                    style={{
                      color: active ? (isWhiteLabel ? accentColor : 'var(--text)') : 'var(--text-muted)',
                      background: active ? (isWhiteLabel ? `${accentColor}14` : 'var(--brand-soft)') : 'transparent',
                    }}
                  >
                    {active && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full" style={{ background: isWhiteLabel ? accentColor : '#10B981' }} />
                    )}
                    <item.icon size={18} className="transition-transform duration-200 group-hover:scale-105" style={active && isWhiteLabel ? { color: accentColor } : {}} />
                    <span>{item.label}</span>
                  </Link>
                </React.Fragment>
              );
            });
          })()}

          {showAutreMenu && (
            <div className="pt-3">
              <button
                onClick={() => setIsAutreOpen(!isAutreOpen)}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors"
                style={{ color: 'var(--text-muted)' }}
              >
                <div className="flex items-center gap-3">
                  <Hexagon size={18} />
                  <span>Autre</span>
                </div>
                {isAutreOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>

              {isAutreOpen && (
                <div className="mt-0.5 ml-[26px] pl-3 space-y-0.5" style={{ borderLeft: '1px solid var(--border)' }}>
                  {autreItems.map((sub) => {
                    const subActive = pathname === sub.path;
                    return (
                      <Link
                        key={sub.path}
                        href={sub.path}
                        className="flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors relative"
                        style={{ color: subActive ? '#10B981' : 'var(--text-muted)', background: subActive ? 'var(--brand-soft)' : 'transparent' }}
                      >
                        <sub.icon size={14} />
                        {sub.label}
                        {sub.path === '/demandes' && pendingRequestsCount > 0 && (
                          <span className="relative flex h-2 w-2 ml-auto">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </nav>

        {/* Logout */}
        <div className="p-4" style={{ borderTop: '1px solid var(--border)' }}>
          <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-bold text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-all group">
            <LogOut size={18} className="group-hover:-translate-x-1 transition-transform" />
            <span>Déconnexion</span>
          </button>
        </div>
      </aside>
    </>
  );
};