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
  ChevronDown, ChevronUp, FileCheck, History, UserMinus, AlertCircle, BookOpen, Inbox, PenTool, MessageSquare,
  MessageCircle, PanelLeftClose, PanelLeftOpen, ShieldCheck
} from 'lucide-react';
import { NavItem, UserProfile, UserRole } from '../../types';
import Image from 'next/image';
import { useMyEmployeePhoto } from '@/hooks/useMyEmployeePhoto';
import { useChatUnread } from '@/components/chat/ChatProvider';
import { KonzaMark } from '@/components/ui/KonzaMark';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  brandName?: string | null;
  brandLogo?: string | null;
  brandColor?: string | null;
  basePath?: string;
}

// 🔔 Avis en attente = taille de la boîte « Avis à donner » (toutes entreprises confondues).
// Échec silencieux → aucune alerte, le menu reste normal.
const AVIS_PENDING_ENDPOINT = '/approvals/inbox/all';

const readCount = (res: any): number => {
  if (typeof res === 'number') return res;
  if (Array.isArray(res)) return res.length;
  if (Array.isArray(res?.items)) return res.items.length;
  const n = res?.total ?? res?.count ?? res?.pending ?? res?.pendingCount ?? 0;
  return Number.isFinite(Number(n)) ? Number(n) : 0;
};

type AlertTone = 'red' | 'emerald' | 'amber';
const ALERT_TONES: Record<AlertTone, { solid: string; text: string; tint: string; ring: string }> = {
  red:     { solid: '#EF4444', text: '#DC2626', tint: 'rgba(239,68,68,0.10)',  ring: 'rgba(239,68,68,0.28)' },
  emerald: { solid: '#10B981', text: '#059669', tint: 'rgba(16,185,129,0.10)', ring: 'rgba(16,185,129,0.28)' },
  amber:   { solid: '#F59E0B', text: '#D97706', tint: 'rgba(245,158,11,0.12)', ring: 'rgba(245,158,11,0.32)' },
};

// Pastille d'alerte clignotante (compteur + halo qui pulse). Respecte prefers-reduced-motion.
const AlertBadge: React.FC<{ count: number; tone: AlertTone; mini: boolean }> = ({ count, tone, mini }) => {
  const t = ALERT_TONES[tone];
  const label = count > 99 ? '99+' : String(count);
  if (mini) {
    return (
      <span className="absolute top-1 right-1.5 flex w-3 h-3" aria-hidden="true">
        <span className="absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping motion-reduce:animate-none" style={{ background: t.solid }} />
        <span className="relative inline-flex w-3 h-3 rounded-full" style={{ background: t.solid, border: '2px solid var(--surface)' }} />
      </span>
    );
  }
  return (
    <span className="relative flex shrink-0">
      <span className="absolute inset-0 rounded-full opacity-60 animate-ping motion-reduce:animate-none" style={{ background: t.solid }} />
      <span className="relative min-w-[22px] h-[22px] px-1.5 rounded-full text-white text-[11px] font-bold flex items-center justify-center shadow-sm" style={{ background: t.solid }}>
        {label}
      </span>
    </span>
  );
};

const navItems: NavItem[] = [
  {
    id: 'dashboard',
    label: 'Tableau de bord',
    icon: LayoutDashboard,
    path: '/dashboard',
    allowedRoles: ['SUPER_ADMIN', 'ADMIN', 'HR_MANAGER', 'MANAGER', 'EMPLOYEE'],
  },

  // ─── Messagerie interne ─────────────────────────────────────────────────────
  {
    id: 'messages',
    label: 'Messages',
    icon: MessageCircle,
    path: '/messages',
    allowedRoles: ['ADMIN', 'HR_MANAGER', 'MANAGER', 'EMPLOYEE'],
  },
  // Demandes (absences, permissions, congés) — juste après Messages, réservé Admin / RH
  {
    id: 'demandes',
    label: 'Demandes',
    icon: Inbox,
    path: '/demandes',
    allowedRoles: ['SUPER_ADMIN', 'ADMIN', 'HR_MANAGER'],
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
    id: 'ma_performance_manager',
    label: 'Ma Performance',
    icon: Target,
    path: '/performance/mon-espace',
    allowedRoles: ['MANAGER'],
  },
  {
    id: 'ma_performance',
    label: 'Ma Performance',
    icon: Target,
    path: '/performance/mon-espace',
    allowedRoles: ['EMPLOYEE'],
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
  const unreadChat = useChatUnread();
  // 🆕 Sidebar réductible (desktop) — préférence mémorisée dans le navigateur
  const [collapsed, setCollapsed] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [animate, setAnimate] = useState(false); // évite l'animation au 1er affichage
  const [tip, setTip] = useState<{ label: string; top: number; left: number } | null>(null);
  const mini = collapsed && isDesktop; // en mobile, le tiroir reste toujours déployé
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);
  // 🔔 Avis en attente de MON avis (fonction de validation)
  const [pendingAvisCount, setPendingAvisCount] = useState(0);
  const lastRefreshRef = React.useRef(0);
  // 🆕 Permission "secrétaire" : pointage manuel pour tout le monde
  const [hasAttendanceAllPermission, setHasAttendanceAllPermission] = useState(false);
  // ✅ LOT A — droit de signer accordé par l'admin (fonction de validation)
  const [canSignPersonally, setCanSignPersonally] = useState(false);
  // ✅ LOT B — l'entrée "Avis à donner" n'apparaît que pour les titulaires d'une fonction
  const [hasApprovalFunction, setHasApprovalFunction] = useState(false);

  const isWhiteLabel = !!(brandName || brandLogo);
  const accentColor = brandColor || '#10B981';

  useEffect(() => {
    try { setCollapsed(localStorage.getItem('sidebar_collapsed') === '1'); } catch { /* stockage indisponible */ }
    const mq = window.matchMedia('(min-width: 768px)');
    const sync = () => setIsDesktop(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    const raf = requestAnimationFrame(() => setAnimate(true));
    return () => { mq.removeEventListener('change', sync); cancelAnimationFrame(raf); };
  }, []);

  const toggleCollapsed = () => {
    setCollapsed((c) => {
      const next = !c;
      try { localStorage.setItem('sidebar_collapsed', next ? '1' : '0'); } catch { /* ignore */ }
      return next;
    });
    setTip(null);
  };

  // Raccourci clavier : Ctrl/Cmd + B (ignoré pendant la saisie de texte)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey) || e.key.toLowerCase() !== 'b' || window.innerWidth < 768) return;
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
      e.preventDefault();
      toggleCollapsed();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Info-bulle en position fixe (l'aside a overflow-hidden + transform : un tooltip absolu serait coupé)
  const showTip = (e: React.MouseEvent<HTMLElement>, label: string) => {
    if (!mini) return;
    const r = e.currentTarget.getBoundingClientRect();
    setTip({ label, top: r.top + r.height / 2, left: r.right + 10 });
  };

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

  // Compteurs d'alerte : demandes en attente (Admin/RH) + avis à donner (titulaires d'une fonction).
  // Rafraîchis à chaque navigation, toutes les 60 s et au retour sur l'onglet.
  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (!stored) return;
    let parsedUser: any;
    try { parsedUser = JSON.parse(stored); } catch { return; }
    const canSeeRequests = ['SUPER_ADMIN', 'ADMIN', 'HR_MANAGER'].includes(parsedUser.role);
    let cancelled = false;

    const refresh = (force?: boolean | Event) => {
      // Anti-spam : pas plus d'un rafraîchissement toutes les 15 s (sauf évènement explicite)
      const now = Date.now();
      if (force !== true && now - lastRefreshRef.current < 15000) return;
      lastRefreshRef.current = now;

      if (canSeeRequests) {
        api.get('/dashboard/pending-requests-count')
          .then((counts: any) => { if (!cancelled) setPendingRequestsCount(counts?.total || 0); })
          .catch(() => {});
      }
      if (hasApprovalFunction) {
        api.get(AVIS_PENDING_ENDPOINT)
          .then((res: any) => { if (!cancelled) setPendingAvisCount(readCount(res)); })
          .catch(() => {});
      } else {
        setPendingAvisCount(0);
      }
    };

    // Un avis vient d'être donné / une validation finalisée → compteur à jour tout de suite
    const onAvisChanged = () => refresh(true);

    refresh(true);
    const timer = setInterval(() => refresh(), 60000);
    const onFocus = () => refresh();
    window.addEventListener('focus', onFocus);
    window.addEventListener('konza:avis-changed', onAvisChanged);
    return () => {
      cancelled = true;
      clearInterval(timer);
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('konza:avis-changed', onAvisChanged);
    };
  }, [pathname, hasApprovalFunction]);

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
  // scoped: true → le lien reste dans le portail cabinet (basePath) quand il existe
  const autreItems: { label: string; path: string; icon: React.ElementType; scoped?: boolean }[] = [
    { label: 'Planning des Shifts', path: '/presences/shifts', icon: Clock },
    { label: 'Déclaration CNSS', path: '/cnss-declaration', icon: FileCheck },
    { label: 'Contrats', path: '/contrats', icon: History },
    { label: 'Documents admnistratifs', path: '/documents', icon: FileCheck },
    { label: 'Journal de paie', path: '/rapports/journal-paie', icon: BookOpen },
    { label: 'Salaires Impayés', path: '/paie/impayes', icon: AlertCircle }, 
    { label: 'Audit', path: '/audit', icon: ShieldCheck, scoped: true },
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

  // 🆕 Admin / RH : ils ont aussi leur propre fiche employé → « Ma Pointeuse ».
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
        {
          id: 'mon_profil_admin',
          label: 'Mon Profil',
          icon: UserCircle,
          path: '/mon-profil',
          allowedRoles: ['ADMIN', 'HR_MANAGER'],
        },
      ]
    : [];

  // ✅ LOT A — "Ma signature" : visible quel que soit le rôle, si le droit est accordé.
  // 🆕 « Avis à donner » : pour TOUS les titulaires d'une fonction d'avis, placé juste après
  //    Demandes / Messages (jamais dans « Mon espace »).
  const avisItem: NavItem | null = hasApprovalFunction
    ? {
        id: 'avis',
        label: 'Avis à donner',
        icon: MessageSquare,
        path: '/avis',
        allowedRoles: ['SUPER_ADMIN', 'ADMIN', 'HR_MANAGER', 'MANAGER', 'EMPLOYEE'],
      }
    : null;

  const approvalExtraItems: NavItem[] = [
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

      <style>{`
        @keyframes konza-wiggle { 0%,84%,100% { transform: rotate(0); } 87% { transform: rotate(-14deg); } 91% { transform: rotate(12deg); } 95% { transform: rotate(-7deg); } }
        .konza-wiggle { animation: konza-wiggle 3.2s ease-in-out infinite; transform-origin: 50% 10%; }
        @media (prefers-reduced-motion: reduce) { .konza-wiggle { animation: none; } }
      `}</style>

      <aside className={`fixed md:static inset-y-0 left-0 z-50 w-[272px] ${collapsed ? 'md:w-[76px]' : 'md:w-[272px]'} shrink-0 flex flex-col overflow-hidden rounded-r-[28px] md:rounded-[28px] md:m-3 md:mr-0 shadow-[0_12px_40px_-14px_rgba(15,23,42,0.22)] dark:shadow-[0_12px_40px_-14px_rgba(0,0,0,0.65)] transform ${animate ? 'transition-[width,transform] duration-300 ease-out' : ''} ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'} print:hidden`} style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
        <div className="absolute top-0 left-0 right-0 h-px opacity-0 dark:opacity-70" style={{ background: isWhiteLabel ? `linear-gradient(to right, transparent, ${accentColor}, transparent)` : 'linear-gradient(to right, transparent, #10B981, transparent)' }} />

        {/* Logo Section */}
        <div className={mini ? 'px-3 pt-5 pb-2 flex flex-col items-center gap-3' : 'px-6 pt-5 pb-2 relative'}>
          {mini ? (
            <Link
              href="/dashboard"
              aria-label="Tableau de bord"
              className="flex items-center justify-center rounded-2xl shrink-0"
              style={{ width: 44, height: 44, background: isWhiteLabel ? `${accentColor}22` : 'var(--brand-soft)', border: `1.5px solid ${isWhiteLabel ? `${accentColor}50` : 'var(--border)'}` }}
            >
              {isWhiteLabel && brandLogo ? (
                <img src={brandLogo} alt={brandName ?? 'Cabinet'} style={{ width: 24, height: 24, objectFit: 'contain' }} />
              ) : (
                isWhiteLabel ? (
                  <span className="text-sm font-black" style={{ color: accentColor }}>
                    {(brandName ?? 'C').slice(0, 2).toUpperCase()}
                  </span>
                ) : (
                  <KonzaMark size={28} />
                )
              )}
            </Link>
          ) : isWhiteLabel ? (
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
          <button
            onClick={toggleCollapsed}
            onMouseEnter={(e) => showTip(e, 'Déployer le menu (Ctrl+B)')}
            onMouseLeave={() => setTip(null)}
            aria-label={collapsed ? 'Déployer le menu' : 'Réduire le menu'}
            aria-expanded={!collapsed}
            className={`hidden md:flex items-center justify-center rounded-xl transition-colors hover:bg-black/5 dark:hover:bg-white/10 ${mini ? 'w-10 h-8' : 'absolute top-4 right-3 w-8 h-8'}`}
            style={{ color: 'var(--text-muted)' }}
            title={mini ? undefined : 'Réduire le menu (Ctrl+B)'}
          >
            {collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
          </button>
        </div>

        {/* User Profile Card */}
        <div className={mini ? 'px-3 pb-3 pt-1' : 'px-4 pb-4 pt-2'}>
          <div className={`rounded-2xl ${mini ? 'p-1.5 justify-center' : 'p-3'} flex items-center gap-3 transition-colors group`} style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
            <div className="relative shrink-0">
              {user ? (
                <img src={employeePhotoUrl || user.avatarUrl} alt={user.name} className="w-9 h-9 rounded-xl object-cover" />
              ) : (
                <div className="w-9 h-9 rounded-xl animate-pulse" style={{ background: 'var(--border)' }} />
              )}
            </div>
            <div className={mini ? 'hidden' : 'flex-1 min-w-0'}>
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
        <nav className={`flex-1 ${mini ? 'px-2' : 'px-3'} pb-4 overflow-y-auto overflow-x-hidden space-y-0.5 custom-scrollbar`}>
          {(() => {
            // 🆕 Regroupement visuel des menus par thème — purement d'affichage,
            //    ne touche ni à la liste filtrée par rôle ni aux permissions.
            const CATEGORY: Record<string, string> = {
              employes: 'Gestion RH', paie: 'Gestion RH', loans: 'Gestion RH', conges: 'Gestion RH',
              presences_equipe_admin: 'Gestion RH', pointage_manuel_admin: 'Gestion RH',
              presences_equipe_secretary: 'Gestion RH', pointage_manuel_secretary: 'Gestion RH',
              mon_equipe: 'Mon équipe', performance_manager: 'Mon équipe', conges_manager: 'Mon équipe', presences_equipe_manager: 'Mon équipe', pointage_manuel_manager: 'Mon équipe',
              pointage_gps_manager: 'Mon espace', mes_conges_manager: 'Mon espace', mes_absences_manager: 'Mon espace', mes_permissions_manager: 'Mon espace', mes_prets_manager: 'Mon espace', ma_paie_manager: 'Mon espace', mon_profil_manager: 'Mon espace', ma_performance_manager: 'Organisation',
              mes_presences: 'Mon espace', pointage_gps_employee: 'Mon espace', mes_conges: 'Mon espace', mes_absences: 'Mon espace', mes_permissions: 'Mon espace', mes_prets: 'Mon espace', ma_paie: 'Mon espace', mon_profil: 'Mon espace', ma_performance: 'Organisation',
              ma_signature: 'Mon espace', pointage_gps_admin: 'Mon espace', mon_profil_admin: 'Mon espace',
              recrutement: 'Organisation', materiel: 'Organisation', formation: 'Organisation', performance: 'Organisation', rapports: 'Organisation', parametres: 'Organisation',
            };

            const baseItems = navItems.filter(item => user && item.allowedRoles.includes(user.role) && !(item.id === 'messages' && basePath));
            const trailingExtras = [...secretaryExtraItems, ...approvalExtraItems];
            const TOP_IDS = ['dashboard', 'messages', 'demandes'];
            const flat: NavItem[] = isAdminLike
              ? [
                  ...baseItems.filter(i => TOP_IDS.includes(i.id)),
                  ...adminSelfItems,
                  ...baseItems.filter(i => !TOP_IDS.includes(i.id)),
                  ...trailingExtras,
                ]
              : [...baseItems, ...trailingExtras];

            // 🆕 Chaque thème est regroupé en un seul bloc (ex. Ma Performance avec Formation
            //    dans « Organisation », Ma signature dans « Mon espace »). Ordre des blocs selon le rôle.
            const GROUP_ORDER = isAdminLike
              ? ['Mon espace', 'Gestion RH', 'Organisation']
              : user?.role === 'MANAGER'
                ? ['Mon équipe', 'Mon espace', 'Organisation']
                : ['Mon espace', 'Gestion RH', 'Organisation'];
            const rank = (id: string) => {
              if (TOP_IDS.includes(id)) return -1;
              const idx = GROUP_ORDER.indexOf(CATEGORY[id]);
              return idx >= 0 ? idx : GROUP_ORDER.length;
            };
            const ordered: NavItem[] = [...flat].sort((x, y) => rank(x.id) - rank(y.id));

            // 🆕 « Avis à donner » : juste après Demandes, sinon Messages, sinon Tableau de bord
            const items: NavItem[] = [...ordered];
            if (avisItem) {
              const anchor = ['demandes', 'messages', 'dashboard']
                .map(id => ordered.findIndex(i => i.id === id))
                .find(idx => idx >= 0) ?? -1;
              items.splice(anchor + 1, 0, avisItem);
            }

            // 🔔 Alertes clignotantes (Demandes / Messages / Avis)
            const alertFor = (id: string): { count: number; tone: AlertTone } | null => {
              if (id === 'demandes' && pendingRequestsCount > 0) return { count: pendingRequestsCount, tone: 'red' };
              if (id === 'messages' && unreadChat > 0) return { count: unreadChat, tone: 'emerald' };
              if (id === 'avis' && pendingAvisCount > 0) return { count: pendingAvisCount, tone: 'amber' };
              return null;
            };

            let lastCategory: string | null = null;

            return items.map(item => {
              const active = isActive(item.path);
              const alert = alertFor(item.id);
              const tone = alert ? ALERT_TONES[alert.tone] : null;
              const fullPath = buildPath(item.path);
              const category = CATEGORY[item.id] || null;
              const showLabel = category && category !== lastCategory;
              lastCategory = category;

              return (
                <React.Fragment key={item.id}>
                  {showLabel && (mini ? (
                    <div className="mx-3 my-2 h-px" style={{ background: 'var(--border)' }} />
                  ) : (
                    <div className="px-4 pt-4 pb-1.5 first:pt-1">
                      <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>{category}</span>
                    </div>
                  ))}
                  <Link
                    href={fullPath}
                    onClick={() => { setTip(null); if (window.innerWidth < 768) onClose(); }}
                    onMouseEnter={(e) => showTip(e, alert ? `${item.label} (${alert.count})` : item.label)}
                    onMouseLeave={() => setTip(null)}
                    aria-label={mini ? item.label : undefined}
                    className={`relative w-full flex items-center ${mini ? 'justify-center px-0' : 'gap-3 px-3'} py-2.5 rounded-xl text-sm ${alert && !active ? 'font-semibold' : 'font-medium'} transition-all duration-200 group ${active ? '' : 'hover:bg-black/[0.04] dark:hover:bg-white/[0.06]'}`}
                    style={{
                      color: active ? (isWhiteLabel ? accentColor : 'var(--text)') : tone ? tone.text : 'var(--text-muted)',
                      background: active ? (isWhiteLabel ? `${accentColor}14` : 'var(--brand-soft)') : tone ? tone.tint : 'transparent',
                      boxShadow: active
                        ? `inset 0 0 0 1px ${isWhiteLabel ? `${accentColor}26` : 'rgba(16,185,129,0.18)'}`
                        : tone ? `inset 0 0 0 1px ${tone.ring}` : 'none',
                    }}
                  >
                    {active && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full" style={{ background: isWhiteLabel ? accentColor : '#10B981' }} />
                    )}
                    <item.icon
                      size={18}
                      className={`transition-transform duration-200 group-hover:scale-105 ${alert && !active ? 'konza-wiggle' : ''}`}
                      style={active && isWhiteLabel ? { color: accentColor } : {}}
                    />
                    {!mini && <span className="flex-1 truncate">{item.label}</span>}
                    {alert && <AlertBadge count={alert.count} tone={alert.tone} mini={mini} />}
                  </Link>
                </React.Fragment>
              );
            });
          })()}

          {showAutreMenu && (
            <div className="pt-3">
              <button
                onClick={() => {
                  if (mini) {
                    // en mode réduit : on déploie le menu puis on ouvre « Autre »
                    setCollapsed(false);
                    try { localStorage.setItem('sidebar_collapsed', '0'); } catch { /* ignore */ }
                    setIsAutreOpen(true);
                    setTip(null);
                  } else setIsAutreOpen(!isAutreOpen);
                }}
                onMouseEnter={(e) => showTip(e, 'Autre')}
                onMouseLeave={() => setTip(null)}
                aria-label={mini ? 'Autre' : undefined}
                className={`relative w-full flex items-center ${mini ? 'justify-center' : 'justify-between px-3'} py-2.5 rounded-xl text-sm font-medium transition-colors hover:bg-black/[0.04] dark:hover:bg-white/[0.06]`}
                style={{ color: 'var(--text-muted)' }}
              >
                <div className="flex items-center gap-3">
                  <Hexagon size={18} />
                  {!mini && <span>Autre</span>}
                </div>
                {!mini && (isAutreOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
              </button>

              {isAutreOpen && !mini && (
                <div className="mt-0.5 ml-[26px] pl-3 space-y-0.5" style={{ borderLeft: '1px solid var(--border)' }}>
                  {autreItems.map((sub) => {
                    const subHref = sub.scoped ? buildPath(sub.path) : sub.path;
                    const subActive = pathname === subHref;
                    return (
                      <Link
                        key={sub.path}
                        href={subHref}
                        className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-colors relative"
                        style={{ color: subActive ? '#10B981' : 'var(--text-muted)', background: subActive ? 'var(--brand-soft)' : 'transparent' }}
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
        <div className={mini ? 'p-2' : 'p-4'} style={{ borderTop: '1px solid var(--border)' }}>
          <button onClick={handleLogout} onMouseEnter={(e) => showTip(e, 'Déconnexion')} onMouseLeave={() => setTip(null)} aria-label="Déconnexion" className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-bold text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-all group">
            <LogOut size={18} className="group-hover:-translate-x-1 transition-transform" />
            {!mini && <span>Déconnexion</span>}
          </button>
        </div>
      </aside>

      {mini && tip && (
        <div
          className="fixed z-[60] -translate-y-1/2 px-3 py-1.5 rounded-xl text-xs font-semibold pointer-events-none shadow-lg whitespace-nowrap print:hidden"
          style={{ top: tip.top, left: tip.left, background: 'var(--text)', color: 'var(--bg)' }}
          role="tooltip"
        >
          {tip.label}
        </div>
      )}
    </>
  );
};