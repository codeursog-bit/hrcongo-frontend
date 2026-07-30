
'use client';

import React from 'react';
import { WifiOff, RefreshCw, Save } from 'lucide-react';
import { ErrorLayout } from '@/components/ui/ErrorLayout';

export default function OfflinePage() {
  return (
    <ErrorLayout
      code="Offline"
      title="Pas de connexion Internet"
      description="Ne vous inquiétez pas, vos modifications seront synchronisées automatiquement dès le retour de la connexion."
      icon={WifiOff}
      gradient="from-gray-400 to-gray-600"
    >
      <div className="w-full max-w-md space-y-6">
        
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800 p-4 rounded-xl flex items-center gap-3">
          <Save className="text-amber-500 shrink-0" size={20} />
          <div className="text-left">
            <p className="text-sm font-bold text-amber-800 dark:text-amber-300">Mode Hors-ligne Actif</p>
            <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">3 modifications en attente de synchronisation.</p>
          </div>
        </div>

        <button 
          onClick={() => window.location.reload()}
          className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-sky-500 hover:bg-sky-600 text-white font-bold rounded-xl transition-all shadow-lg hover:scale-105"
        >
          <RefreshCw size={20} /> Réessayer la connexion
        </button>
      </div>
    </ErrorLayout>
  );
}
