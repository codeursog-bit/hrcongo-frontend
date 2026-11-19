
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
    >
      <div className="w-full max-w-md space-y-6">
        
        <div
          className="p-4 rounded-xl flex items-center gap-3"
          style={{ background: 'var(--surface-2)' }}
        >
          <Save className="shrink-0" size={20} strokeWidth={1.5} style={{ color: 'var(--mustard)' }} />
          <div className="text-left">
            <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>Mode hors-ligne actif</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Vos modifications en attente seront synchronisées dès le retour de la connexion.</p>
          </div>
        </div>

        <button 
          onClick={() => window.location.reload()}
          className="w-full flex items-center justify-center gap-2 px-6 py-3.5 font-semibold rounded-xl transition-colors"
          style={{ background: 'var(--brand)', color: 'var(--on-brand)' }}
        >
          <RefreshCw size={18} strokeWidth={1.75} /> Réessayer la connexion
        </button>
      </div>
    </ErrorLayout>
  );
}
