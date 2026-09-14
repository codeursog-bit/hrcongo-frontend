// ============================================================================
// 📁 lib/admin/constants.ts — Navigation Super Admin
// ============================================================================
import {
  LayoutDashboard, Building2, BarChart2, CreditCard, Bug,
  Terminal, Users, Settings, Link2, BookOpen, Repeat, ScrollText, Radio,
} from 'lucide-react';

export const NAVIGATION_ITEMS = [
  { path: '/admin',              label: 'Dashboard',     icon: LayoutDashboard },
  { path: '/admin/companies',    label: 'Entreprises',   icon: Building2       },
  { path: '/admin/subscriptions',label: 'Abonnements',   icon: Repeat          },
  { path: '/admin/user-activity',label: 'Activité Users',icon: Radio           },
  { path: '/admin/analytics',    label: 'Analytics',     icon: BarChart2       },
  { path: '/admin/billing',      label: 'Revenus',       icon: CreditCard      },
  { path: '/admin/monitoring',   label: 'Monitoring',    icon: Terminal        },
  { path: '/admin/mes-logs',         label: 'Mes Logs Système',  icon: ScrollText      },
  { path: '/admin/users',        label: 'Admins',        icon: Users           },
  { path: '/admin/affiliates',   label: 'Affiliés',      icon: Link2           },
  { path: '/admin/errors',       label: 'Error Tracker', icon: Bug             },
  { path: '/admin/settings',     label: 'Paramètres',    icon: Settings        },
  { path:  '/admin/blog',        label: 'Blog',          icon:  BookOpen,},
];