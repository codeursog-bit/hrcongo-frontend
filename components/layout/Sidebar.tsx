
'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  LayoutDashboard, Users, Wallet, Calendar, Clock, BarChart3, 
  FileText, Settings, LogOut, Hexagon, Briefcase, Target, 
  GraduationCap, Flag, Monitor, Fingerprint, FolderHeart,
  UserCircle, Users2, HandCoins
} from 'lucide-react';
import { NavItem, UserProfile, UserRole } from '../../types';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const navItems: NavItem[] = [
  { id: 'dashboard', label: 'Tableau de bord', icon: LayoutDashboard, path: '/dashboard', allowedRoles: ['SUPER_ADMIN', 'ADMIN', 'HR_MANAGER', 'MANAGER', 'EMPLOYEE'] },
  
  // Section Gestion (Admin/RH)
  { id: 'employes', label: 'Dossiers Employés', icon: Users, path: '/employes', allowedRoles: ['SUPER_ADMIN', 'ADMIN', 'HR_MANAGER', 'MANAGER'] },
  { id: 'paie', label: 'Paie & Salaires', icon: Wallet, path: '/paie', allowedRoles: ['SUPER_ADMIN', 'ADMIN', 'HR_MANAGER'] },
  { id: 'loans', label: 'Avances & Prêts', icon: HandCoins, path: '/loans', allowedRoles: ['SUPER_ADMIN', 'ADMIN', 'HR_MANAGER'] },
  
  // NOTE: Le label de cet item sera écrasé dynamiquement dans le render si l'utilisateur est EMPLOYEE
  { id: 'presences', label: 'Présences Équipe', icon: Users2, path: '/presences', allowedRoles: ['SUPER_ADMIN', 'ADMIN', 'HR_MANAGER', 'MANAGER', 'EMPLOYEE'] },
  
  { id: 'conges', label: 'Validation Congés', icon: Calendar, path: '/conges', allowedRoles: ['SUPER_ADMIN', 'ADMIN', 'HR_MANAGER', 'MANAGER'] },
  
  // Section Personnelle (Employé)
  { id: 'pointage', label: 'Pointeuse (Moi)', icon: Fingerprint, path: '/presences/pointage', allowedRoles: ['EMPLOYEE', 'MANAGER', 'HR_MANAGER', 'ADMIN', 'SUPER_ADMIN'] },
  { id: 'mes_conges', label: 'Mes Demandes', icon: FolderHeart, path: '/conges/mon-espace', allowedRoles: ['EMPLOYEE', 'MANAGER', 'HR_MANAGER', 'ADMIN', 'SUPER_ADMIN'] },
  
  // Autres modules
  { id: 'recrutement', label: 'Recrutement', icon: Briefcase, path: '/recrutement', allowedRoles: ['SUPER_ADMIN', 'ADMIN', 'HR_MANAGER'] },
  // { id: 'performance', label: 'Performance', icon: Target, path: '/performance', allowedRoles: ['SUPER_ADMIN', 'ADMIN', 'HR_MANAGER', 'MANAGER'] },
  // { id: 'formation', label: 'Formation', icon: GraduationCap, path: '/formation', allowedRoles: ['SUPER_ADMIN', 'ADMIN', 'HR_MANAGER', 'EMPLOYEE'] },
  { id: 'materiel', label: 'Matériel', icon: Monitor, path: '/materiel', allowedRoles: ['SUPER_ADMIN', 'ADMIN', 'HR_MANAGER'] },
  // { id: 'onboarding', label: 'Onboarding', icon: Flag, path: '/onboarding', allowedRoles: ['SUPER_ADMIN', 'ADMIN', 'HR_MANAGER'] },
  // { id: 'documents', label: 'Documents', icon: FileText, path: '/documents', allowedRoles: ['SUPER_ADMIN', 'ADMIN', 'HR_MANAGER', 'EMPLOYEE'] },
  { id: 'rapports', label: 'Rapports', icon: BarChart3, path: '/rapports', allowedRoles: ['SUPER_ADMIN', 'ADMIN', 'HR_MANAGER'] },
  { id: 'parametres', label: 'Paramètres', icon: Settings, path: '/parametres', allowedRoles: ['SUPER_ADMIN', 'ADMIN'] },
];

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);

  useEffect(() => {
    const syncUser = async () => {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        try {
          let parsed = JSON.parse(storedUser);
          updateUserState(parsed);
        } catch (e) { console.error("Session sync error", e); }
      }
    };
    syncUser();
  }, []);

  const updateUserState = (userData: any) => {
    setUser({
      id: userData.id,
      name: `${userData.firstName} ${userData.lastName}`,
      role: (userData.role as UserRole) || 'EMPLOYEE',
      avatarUrl: `https://ui-avatars.com/api/?name=${userData.firstName}+${userData.lastName}&background=random&color=fff&background=0ea5e9`,
      isOnline: true
    });
  };

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
    EMPLOYEE: 'Employé'
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden print:hidden" onClick={onClose} />
      )}

      <aside 
        className={`
          fixed md:static inset-y-0 left-0 z-50
          w-[280px] m-4 rounded-[2rem]
          bg-white/80 border border-white/50 shadow-xl shadow-slate-200/50
          dark:bg-slate-900/80 dark:border-white/10 dark:shadow-[0_0_40px_-10px_rgba(0,0,0,0.5)]
          backdrop-blur-2xl
          transform transition-all duration-500 cubic-bezier(0.4, 0, 0.2, 1)
          flex flex-col overflow-hidden
          ${isOpen ? 'translate-x-0' : '-translate-x-[120%] md:translate-x-0'}
          print:hidden
        `}
      >
        {/* Glow Line Top */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-0 dark:opacity-50"></div>

        {/* Logo Section */}
        <div className="h-24 flex items-center px-8">
          <Link href="/dashboard" className="flex items-center gap-3 group w-full">
            <div className="relative">
              <div className="absolute inset-0 bg-cyan-500 blur-md opacity-20 dark:opacity-40 group-hover:opacity-60 transition-opacity duration-500"></div>
              <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center text-white shadow-lg border border-white/20 group-hover:scale-105 transition-transform duration-300">
                <Hexagon size={24} fill="currentColor" className="text-white" />
              </div>
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800 dark:text-white tracking-tight font-sans">HRCongo</h1>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-[10px] text-slate-500 dark:text-cyan-400 font-bold tracking-widest uppercase">Online</span>
              </div>
            </div>
          </Link>
        </div>

        {/* User Profile Card */}
        <div className="px-4 pb-6">
          <div className="bg-slate-50/80 dark:bg-white/5 rounded-2xl p-3 flex items-center gap-3 border border-slate-100 dark:border-white/5 hover:border-sky-200 dark:hover:border-white/10 transition-colors group">
            <div className="relative shrink-0">
              {user ? (
                  <img src={user.avatarUrl} alt={user.name} className="w-10 h-10 rounded-xl object-cover ring-2 ring-white dark:ring-white/10 shadow-sm" />
              ) : (
                  <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-slate-700 animate-pulse"></div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              {user ? (
                  <>
                    <h3 className="text-sm font-bold text-slate-800 dark:text-white truncate">{user.name}</h3>
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-white dark:bg-white/10 text-sky-600 dark:text-cyan-300 border border-slate-100 dark:border-white/5 shadow-sm">
                        {roleLabels[user.role] || user.role}
                    </span>
                  </>
              ) : (
                  <div className="h-8 w-20 bg-slate-200 dark:bg-slate-700/50 rounded animate-pulse"></div>
              )}
            </div>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 px-3 pb-4 overflow-y-auto space-y-1 custom-scrollbar">
          {navItems
            .filter(item => user && item.allowedRoles.includes(user.role))
            .map((item) => {
            const isActive = pathname === item.path;
            
            // Custom label logic for Employees
            let displayLabel = item.label;
            if (item.id === 'presences' && user?.role === 'EMPLOYEE') {
                displayLabel = 'Mes Présences';
            }

            return (
              <Link
                key={item.id}
                href={item.path}
                onClick={() => { if (window.innerWidth < 768) onClose(); }}
                className={`
                  relative w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300
                  group overflow-hidden
                  ${isActive 
                    ? 'text-sky-700 dark:text-white bg-sky-50 dark:bg-white/5 border border-sky-100 dark:border-cyan-500/30 shadow-sm dark:shadow-none' 
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/5 border border-transparent'
                  }
                `}
              >
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-sky-500 dark:bg-cyan-400 rounded-r-full shadow-[0_0_15px_#0ea5e9]"></div>
                )}
                
                <item.icon 
                  size={20} 
                  className={`
                    transition-all duration-300 z-10
                    ${isActive ? 'text-sky-600 dark:text-cyan-400 scale-110' : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-200'}
                  `} 
                />
                <span className="relative z-10">{displayLabel}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer / Logout */}
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