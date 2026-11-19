// ============================================================================
// 📁 lib/admin/constants.ts — Navigation Super Admin
// ============================================================================
import {
  LayoutDashboard, Building2, BarChart2, CreditCard, Bug,
  Terminal, Users, Settings, Link2, BookOpen, Repeat, ScrollText, Radio, Layers, Bell, HardDrive, Wallet,
  UserCog, Receipt, Wrench, Landmark,
} from 'lucide-react';

// Navigation regroupée par métier (la barre latérale affiche un titre par groupe)
export const NAVIGATION_GROUPS = [
  {
    label: 'Pilotage',
    items: [
      { path: '/admin',              label: 'Dashboard',      icon: LayoutDashboard },
      { path: '/admin/analytics',    label: 'Analytics',      icon: BarChart2       },
      { path: '/admin/user-activity',label: 'Activité Users', icon: Radio           },
    ],
  },
  {
    label: 'Clients',
    items: [
      { path: '/admin/companies',    label: 'Entreprises',    icon: Building2       },
      { path: '/admin/comptes',      label: 'Comptes',        icon: UserCog         },
      { path: '/admin/cabinets',     label: 'Cabinets',       icon: Landmark        },
      { path: '/admin/portefeuilles',label: 'Portefeuilles',  icon: Layers          },
    ],
  },
  {
    label: 'Abonnements & paiements',
    items: [
      { path: '/admin/subscriptions',label: 'Abonnements',    icon: Repeat          },
      { path: '/admin/paiements',    label: 'Paiements',      icon: Receipt         },
      { path: '/admin/facturation',  label: 'Facturation',    icon: Wallet          },
      { path: '/admin/billing',      label: 'Revenus',        icon: CreditCard      },
      { path: '/admin/affiliates',   label: 'Affiliés',       icon: Link2           },
    ],
  },
  {
    label: 'Support',
    items: [
      { path: '/admin/support', label: 'Conversations support', icon: BookOpen },
      { path: '/admin/actions',      label: 'Actions de support', icon: Wrench      },
      { path: '/admin/push-notifications', label: 'Notifications Push', icon: Bell  },
      { path: '/admin/blog',         label: 'Blog',           icon: BookOpen        },
    ],
  },
  {
    label: 'Système',
    items: [
      { path: '/admin/monitoring',   label: 'Monitoring',     icon: Terminal        },
      { path: '/admin/serveur',      label: 'Serveur',        icon: HardDrive       },
      { path: '/admin/mes-logs',     label: 'Mes Logs Système', icon: ScrollText    },
      { path: '/admin/errors',       label: 'Error Tracker',  icon: Bug             },
      { path: '/admin/users',        label: 'Admins',         icon: Users           },
      { path: '/admin/settings',     label: 'Paramètres',     icon: Settings        },
      { path: '/admin/assistant',    label: 'Assistant Konza',icon: BookOpen        },
    ],
  },
];

/** Liste à plat (compatibilité avec le code existant) */
export const NAVIGATION_ITEMS = NAVIGATION_GROUPS.flatMap((g) => g.items);
