// ============================================================================
// Fichier: frontend/components/admin/Sidebar.tsx
// ============================================================================

'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { NAVIGATION_ITEMS } from '@/lib/admin/constants';
import { Plus, Mail, Database, RefreshCw, AlertTriangle, Zap, LogOut } from 'lucide-react';

interface SidebarProps {
  recentActivity?: Array<{
    id: string;
    type: 'success' | 'critical' | 'info';
    message: string;
    time: string;
  }>;
}

export const Sidebar: React.FC<SidebarProps> = ({ recentActivity = [] }) => {
  const pathname = usePathname();

  return (
    <div className="hidden xl:flex flex-col w-[280px] shrink-0 border-l border-gray-800 bg-[#0B0F19]/50 backdrop-blur-sm h-full overflow-hidden">
      
      {/* Navigation Menu */}
      <div className="p-4 border-b border-gray-800">
        <nav className="space-y-1">
          {NAVIGATION_ITEMS.map((item) => {
            const isActive = pathname === item.path || (item.path !== '/' && pathname.startsWith(item.path));
            return (
              <Link
                key={item.path}
                href={item.path}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive 
                    ? 'bg-brand-red/10 text-brand-red border border-brand-red/20' 
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`}
              >
                <item.icon className={`w-4 h-4 ${isActive ? 'text-brand-red' : 'text-gray-500'}`} />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="p-4 space-y-6 overflow-y-auto flex-1 custom-scrollbar">
        {/* Quick Actions Panel */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Zap className="w-3 h-3 text-brand-gold" /> Actions Rapides
          </h3>
          <div className="grid grid-cols-2 gap-2">
            <button className="flex flex-col items-center justify-center p-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg transition-all group">
              <Plus className="w-4 h-4 text-brand-red mb-1 group-hover:scale-110 transition-transform" />
              <span className="text-[10px] font-medium text-gray-300">Nouvelle Ent.</span>
            </button>
            <button className="flex flex-col items-center justify-center p-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg transition-all group">
              <Mail className="w-4 h-4 text-sky-400 mb-1 group-hover:scale-110 transition-transform" />
              <span className="text-[10px] font-medium text-gray-300">Email</span>
            </button>
            <button className="flex flex-col items-center justify-center p-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg transition-all group">
              <Database className="w-4 h-4 text-purple-400 mb-1 group-hover:scale-110 transition-transform" />
              <span className="text-[10px] font-medium text-gray-300">Sauvegarde</span>
            </button>
            <button className="flex flex-col items-center justify-center p-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg transition-all group">
              <RefreshCw className="w-4 h-4 text-green-400 mb-1 group-hover:scale-110 transition-transform" />
              <span className="text-[10px] font-medium text-gray-300">Synchro</span>
            </button>
          </div>
        </div>

        {/* Platform Alerts */}
        <div className="bg-gray-900 border border-red-900/30 rounded-xl p-4">
          <h3 className="text-xs font-bold text-red-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            <AlertTriangle className="w-3 h-3" /> Alertes
          </h3>
          <div className="space-y-2">
            <div className="p-2.5 bg-red-900/10 border border-red-900/30 rounded-lg flex items-start gap-2.5">
               <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 shrink-0 animate-pulse"></div>
               <div>
                  <p className="text-[11px] font-bold text-red-200">Charge CPU Élevée</p>
                  <p className="text-[10px] text-red-400/80 mt-0.5">Région-1 &gt; 80%</p>
               </div>
            </div>
            <div className="p-2.5 bg-orange-900/10 border border-orange-900/30 rounded-lg flex items-start gap-2.5">
               <div className="w-1.5 h-1.5 rounded-full bg-orange-500 mt-1.5 shrink-0"></div>
               <div>
                  <p className="text-[11px] font-bold text-orange-200">Échecs Paiement</p>
                  <p className="text-[10px] text-orange-400/80 mt-0.5">2 échoués ajd.</p>
               </div>
            </div>
          </div>
        </div>

        {/* Recent Activity Feed */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <div className="flex justify-between items-center mb-4">
             <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Flux en Direct</h3>
             <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.5)]"></span>
          </div>
          
          <div className="relative pl-3 border-l border-gray-800 space-y-5">
            {recentActivity.length > 0 ? (
              recentActivity.map((activity) => (
                <div key={activity.id} className="relative">
                  <div className={`absolute -left-[17px] top-1 w-2 h-2 rounded-full border border-gray-900 ${
                    activity.type === 'success' ? 'bg-green-500' :
                    activity.type === 'critical' ? 'bg-red-500' :
                    'bg-sky-500'
                  }`}></div>
                  <p className="text-[11px] text-gray-300 font-medium leading-snug">{activity.message}</p>
                  <span className="text-[10px] text-gray-600 font-mono mt-0.5 block">{activity.time}</span>
                </div>
              ))
            ) : (
              <p className="text-xs text-gray-500 italic">Aucune activité récente</p>
            )}
          </div>
        </div>
      </div>
      
      <div className="p-4 border-t border-gray-800 mt-auto">
         <button className="flex items-center gap-2 text-gray-500 hover:text-white text-xs font-medium w-full px-2 py-2 rounded-lg hover:bg-gray-800 transition-colors">
            <LogOut className="w-4 h-4" /> Déconnexion
         </button>
      </div>

    </div>
  );
};