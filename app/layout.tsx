import React from 'react';
import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { NotificationProvider } from '@/components/providers/NotificationProvider';
import { AlertProvider } from '@/components/providers/AlertProvider';
import { CompanyReminderProvider } from '@/components/providers/CompanyReminderProvider';
import './globals.css'; 

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

const mono = JetBrains_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-mono',
});

export const metadata: Metadata = {
  title: 'HRCongo - Le Futur de la RH',
  description: 'Plateforme de gestion RH nouvelle génération.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className={`${inter.variable} ${mono.variable} font-sans bg-slate-50 dark:bg-[#020617] text-slate-900 dark:text-slate-100 antialiased  selection:bg-cyan-100 selection:text-cyan-900 dark:selection:bg-cyan-900/30 dark:selection:text-white transition-colors duration-500`}>
        <ThemeProvider>
          <AlertProvider>
            <CompanyReminderProvider>
            <NotificationProvider>
              {/* --- DYNAMIC BACKGROUND MESH --- */}
              <div className="fixed inset-0 z-[-1] overflow-hidden pointer-events-none">
                
                {/* LIGHT MODE BACKGROUND (Soft & Clean) */}
                <div className="absolute inset-0 bg-slate-50 dark:opacity-0 transition-opacity duration-700">
                   <div className="absolute top-[-20%] left-[-10%] w-[60vw] h-[60vw] bg-blue-100/40 rounded-full blur-[100px] mix-blend-multiply"></div>
                   <div className="absolute bottom-[-20%] right-[-10%] w-[60vw] h-[60vw] bg-indigo-100/40 rounded-full blur-[100px] mix-blend-multiply"></div>
                   <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-40 brightness-100 contrast-150 mix-blend-overlay"></div>
                </div>

                {/* DARK MODE BACKGROUND (Deep & Neon) */}
                <div className="absolute inset-0 opacity-0 dark:opacity-100 transition-opacity duration-700">
                   <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-sky-600/10 rounded-full blur-[120px] animate-aurora-1"></div>
                   <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] bg-indigo-600/10 rounded-full blur-[120px] animate-aurora-2"></div>
                   <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay"></div>
                </div>
                
              </div>
              
              {children}
            </NotificationProvider>
            </CompanyReminderProvider>
          </AlertProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
