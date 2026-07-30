
'use client';

import React from 'react';
import Link from 'next/link';
import { ShieldAlert, Lock, ArrowLeft, Mail } from 'lucide-react';
import { ErrorLayout } from '@/components/ui/ErrorLayout';

export default function ForbiddenPage() {
  return (
    <ErrorLayout
      code="403"
      title="Accès Refusé"
      description="Désolé, vous n'avez pas les permissions nécessaires pour accéder à cette zone sécurisée."
      icon={ShieldAlert}
      gradient="from-purple-500 to-indigo-600"
    >
      <div className="w-full max-w-md space-y-6">
        
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 text-left shadow-sm">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-bold uppercase text-gray-400">Votre Rôle</span>
            <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded text-xs font-bold">EMPLOYEE</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold uppercase text-gray-400">Requis</span>
            <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded text-xs font-bold">ADMIN</span>
          </div>
          <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700 flex items-center gap-2 text-sm text-gray-500">
            <Lock size={14} /> Cette page est réservée aux administrateurs.
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Link href="/" className="flex items-center justify-center gap-2 px-6 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold rounded-xl transition-all shadow-lg hover:scale-105">
            <ArrowLeft size={18} /> Retour
          </Link>
          <button className="flex items-center justify-center gap-2 px-6 py-3 border border-gray-200 dark:border-gray-700 font-bold rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
            <Mail size={18} /> Demander accès
          </button>
        </div>
      </div>
    </ErrorLayout>
  );
}
