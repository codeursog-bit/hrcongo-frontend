
'use client';

import React from 'react';
import { ServerCrash, RotateCcw, AlertTriangle } from 'lucide-react';
import { ErrorLayout } from '@/components/ui/ErrorLayout';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const errorId = error.digest || `ERR-${new Date().toISOString().split('T')[0].replace(/-/g, '')}-${Math.floor(Math.random() * 1000)}`;

  return (
    <ErrorLayout
      code="500"
      title="Quelque chose s'est mal passé"
      description="Notre équipe technique a été notifiée. Ce n'est pas de votre faute ! Essayez de rafraîchir la page."
      icon={ServerCrash}
      gradient="from-red-500 to-orange-500"
    >
      <div className="w-full max-w-md space-y-6">
        
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 p-4 rounded-xl flex items-start gap-3 text-left">
          <AlertTriangle className="text-red-500 shrink-0 mt-0.5" size={18} />
          <div>
            <p className="text-sm font-bold text-red-700 dark:text-red-300">Détails techniques</p>
            <p className="text-xs text-red-600 dark:text-red-400 font-mono mt-1">ID: {errorId}</p>
            <p className="text-xs text-red-600 dark:text-red-400 mt-1 line-clamp-2">{error.message || "Erreur interne du serveur"}</p>
          </div>
        </div>

        <div className="flex gap-3">
          <button 
            onClick={() => reset()}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold rounded-xl transition-all shadow-lg hover:scale-105"
          >
            <RotateCcw size={18} /> Réessayer
          </button>
          <button 
            onClick={() => window.location.href = '/'}
            className="flex-1 px-6 py-3 border border-gray-200 dark:border-gray-700 font-bold rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            Retour Accueil
          </button>
        </div>

        <p className="text-xs text-gray-400">
          Si le problème persiste, contactez le support en mentionnant l'ID d'erreur ci-dessus.
        </p>
      </div>
    </ErrorLayout>
  );
}
