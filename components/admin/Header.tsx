// ============================================================================
// Fichier: frontend/components/admin/Header.tsx
// ============================================================================

'use client';

import React, { useState, useEffect } from 'react';
import { Bell, ShieldAlert } from 'lucide-react';
import { authService } from '@/lib/services/authService';

interface HeaderProps {
  stats?: {
    totalCompanies?: number;
    totalUsers?: number;
    totalMRR?: number;
    growth?: number;
  };
}

export const Header: React.FC<HeaderProps> = ({ stats }) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // ✅ RÉCUPÉRER L'UTILISATEUR CONNECTÉ
  useEffect(() => {
    const user = authService.getCurrentUser();
    setCurrentUser(user);
  }, []);

  const {
    totalCompanies = 0,
    totalUsers = 0,
    totalMRR = 0,
    growth = 0,
  } = stats || {};

  // ✅ GÉNÉRER INITIALES DYNAMIQUES
  const getInitials = (user: any) => {
    if (!user) return 'SA';
    const firstName = user.firstName || '';
    const lastName = user.lastName || '';
    return `${firstName[0] || ''}${lastName[0] || ''}`.toUpperCase() || user.email[0].toUpperCase();
  };

  // ✅ NOM COMPLET
  const getFullName = (user: any) => {
    if (!user) return 'Super Admin';
    return `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email;
  };

  return (
    <header className="bg-gray-900 border-b border-gray-800 p-4 sticky top-0 z-50 backdrop-blur-md bg-opacity-90">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        {/* Title Area */}
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="bg-brand-red p-2 rounded-lg shadow-[0_0_15px_rgba(220,38,38,0.5)]">
             <ShieldAlert className="text-white w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-wide">
              SUPER ADMIN <span className="text-gray-500 text-sm font-normal ml-2">Platform Control Center</span>
            </h1>
            <div className="flex items-center gap-2 text-xs text-gray-400 font-mono">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              LIVE
              <span className="mx-1">|</span>
              {currentTime.toLocaleDateString()} {currentTime.toLocaleTimeString()}
            </div>
          </div>
        </div>

        {/* Quick Stats Bar */}
        <div className="hidden lg:flex items-center bg-gray-800/50 rounded-lg px-4 py-2 border border-gray-700 gap-6">
          <div className="flex flex-col">
            <span className="text-[10px] uppercase text-gray-500 font-semibold">Total Companies</span>
            <span className="text-sm font-bold text-white">{totalCompanies}</span>
          </div>
          <div className="w-px h-8 bg-gray-700"></div>
          <div className="flex flex-col">
            <span className="text-[10px] uppercase text-gray-500 font-semibold">Total Users</span>
            <span className="text-sm font-bold text-white">{totalUsers.toLocaleString()}</span>
          </div>
          <div className="w-px h-8 bg-gray-700"></div>
          <div className="flex flex-col">
            <span className="text-[10px] uppercase text-gray-500 font-semibold">MRR</span>
            <span className="text-sm font-bold text-brand-gold">
              {(totalMRR / 1000000).toFixed(2)}M FCFA
            </span>
          </div>
           <div className="w-px h-8 bg-gray-700"></div>
          <div className="flex flex-col">
            <span className="text-[10px] uppercase text-gray-500 font-semibold">Growth</span>
            <span className="text-sm font-bold text-green-400">+{growth.toFixed(1)}%</span>
          </div>
        </div>

        {/* User & Alerts */}
        <div className="flex items-center gap-4 w-full md:w-auto justify-end">
          <button className="hidden md:flex items-center gap-2 bg-red-900/30 text-red-400 px-3 py-1.5 rounded-full border border-red-900/50 hover:bg-red-900/50 transition-colors text-sm font-medium animate-pulse">
            <ShieldAlert className="w-4 h-4" />
            System Alert
          </button>
          
          <div className="relative">
             <Bell className="w-5 h-5 text-gray-400 hover:text-white cursor-pointer transition-colors" />
             <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-gray-900"></span>
          </div>

          <div className="flex items-center gap-3 pl-4 border-l border-gray-800">
            <div className="text-right hidden sm:block">
              <div className="text-sm font-bold text-white">{getFullName(currentUser)}</div>
              <div className="text-xs text-brand-red font-semibold">Super Administrator</div>
            </div>
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-700 to-gray-800 border border-gray-600 flex items-center justify-center text-white font-bold shadow-lg">
              {getInitials(currentUser)}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};