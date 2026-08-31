// ============================================================================
// Fichier: frontend/components/admin/SystemAdmin.tsx
// ============================================================================

'use client';

import React from 'react';
import { Users, HardDrive, Settings, Shield } from 'lucide-react';

interface SystemAdminProps {
  stats?: {
    totalUsers?: number;
    superAdmins?: number;
    tenantAdmins?: number;
    newToday?: number;
    dbSize?: number;
    fileStorage?: number;
  };
}

export const SystemAdmin: React.FC<SystemAdminProps> = ({ stats }) => {
  const {
    totalUsers = 0,
    superAdmins = 0,
    tenantAdmins = 0,
    newToday = 0,
    dbSize = 0,
    fileStorage = 0,
  } = stats || {};

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      
      {/* Users Management */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 hover:border-gray-700 transition-colors">
        <div className="w-10 h-10 rounded-lg bg-gray-800 flex items-center justify-center mb-4 text-gray-400">
          <Users className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-bold text-white mb-2">Platform Users</h3>
        <p className="text-sm text-gray-500 mb-6">
          Manage roles and permissions for {totalUsers.toLocaleString()} users across all tenants.
        </p>
        
        <div className="space-y-3 mb-6">
          <div className="flex justify-between text-sm">
             <span className="text-gray-400">Super Admins</span>
             <span className="text-white font-mono">{superAdmins}</span>
          </div>
          <div className="flex justify-between text-sm">
             <span className="text-gray-400">Tenant Admins</span>
             <span className="text-white font-mono">{tenantAdmins}</span>
          </div>
          <div className="flex justify-between text-sm">
             <span className="text-gray-400">New Today</span>
             <span className="text-green-400 font-mono">+{newToday}</span>
          </div>
        </div>
        
        <button className="w-full py-2 bg-gray-800 hover:bg-gray-700 text-white text-sm font-medium rounded-lg transition-colors border border-gray-700">
          Manage Access
        </button>
      </div>

      {/* Data & Storage */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 hover:border-gray-700 transition-colors">
        <div className="w-10 h-10 rounded-lg bg-gray-800 flex items-center justify-center mb-4 text-gray-400">
          <HardDrive className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-bold text-white mb-2">Storage & Backups</h3>
        <p className="text-sm text-gray-500 mb-6">Monitor database growth and file storage limits.</p>
        
        <div className="mb-6">
          <div className="flex justify-between text-sm mb-1">
             <span className="text-gray-400">Database (50GB Limit)</span>
             <span className="text-white text-xs">{(dbSize / 1000).toFixed(1)} GB</span>
          </div>
          <div className="w-full bg-gray-800 h-1.5 rounded-full mb-4">
             <div className="bg-blue-500 h-full rounded-full" style={{ width: `${(dbSize / 50000) * 100}%` }}></div>
          </div>
          
           <div className="flex justify-between text-sm mb-1">
             <span className="text-gray-400">File Storage</span>
             <span className="text-white text-xs">{(fileStorage / 1000).toFixed(1)} GB</span>
          </div>
          <div className="w-full bg-gray-800 h-1.5 rounded-full">
             <div className="bg-purple-500 h-full rounded-full" style={{ width: `${(fileStorage / 100000) * 100}%` }}></div>
          </div>
        </div>
        
        <button className="w-full py-2 bg-gray-800 hover:bg-gray-700 text-white text-sm font-medium rounded-lg transition-colors border border-gray-700">
          Configure Storage
        </button>
      </div>

      {/* Global Settings */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 hover:border-gray-700 transition-colors">
        <div className="w-10 h-10 rounded-lg bg-gray-800 flex items-center justify-center mb-4 text-gray-400">
          <Settings className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-bold text-white mb-2">Global Settings</h3>
        <p className="text-sm text-gray-500 mb-6">Tax brackets, holidays, and system-wide configurations.</p>
        
        <ul className="space-y-2 mb-6">
          <li className="flex items-center gap-2 text-sm text-gray-400">
            <Shield className="w-4 h-4 text-green-500" />
            <span>ITS Brackets (Congo)</span>
          </li>
          <li className="flex items-center gap-2 text-sm text-gray-400">
            <Shield className="w-4 h-4 text-green-500" />
            <span>CNSS Rates (2024)</span>
          </li>
          <li className="flex items-center gap-2 text-sm text-gray-400">
            <Settings className="w-4 h-4 text-gray-500" />
            <span>Maintenance Mode: OFF</span>
          </li>
        </ul>
        
        <button className="w-full py-2 bg-gray-800 hover:bg-gray-700 text-white text-sm font-medium rounded-lg transition-colors border border-gray-700">
          System Configuration
        </button>
      </div>

    </div>
  );
};