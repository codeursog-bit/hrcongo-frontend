
'use client';

import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { TopNav } from './TopNav';

interface DashboardShellProps {
  children: React.ReactNode;
}

export const DashboardShell: React.FC<DashboardShellProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen font-sans text-slate-900 dark:text-slate-100 overflow-hidden relative bg-gray-50 dark:bg-[#020617]">
      {/* Background is handled in layout.tsx via global css class on body */}
      
      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0 h-full relative z-10 transition-all duration-300">
        <TopNav 
          onMenuClick={() => setSidebarOpen(true)} 
        />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 scroll-smooth custom-scrollbar">
          {children}
        </main>
      </div>
    </div>
  );
};
