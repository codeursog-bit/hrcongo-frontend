'use client';

// ============================================================================
// 📁 app/(dashboard)/rapports/observatoire-conges/page.tsx
// ✅ Version "Rapports" de l'analyse des congés — scope="leave".
//    Navigation via le composant partagé RapportsSubNav (5 boutons + "Plus").
// ============================================================================

import React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { useBasePath } from '@/hooks/useBasePath';
import RapportsSubNav from '@/components/RapportsSubNav';
import AbsenceAnalyticsBoard from '@/components/absence-analytics/AbsenceAnalyticsBoard';

export default function RapportObservatoireCongesPage() {
  const router = useRouter();
  const { bp } = useBasePath();

  return (
    <div className="max-w-[1600px] mx-auto pb-20 space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => router.push(bp('/rapports'))} className="p-2 bg-[var(--surface)] rounded-xl border border-[var(--border)]">
          <ArrowLeft size={20} className="text-[var(--text-muted)]" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-[var(--text)]">Observatoire RH des congés</h1>
          <p className="text-[var(--text-muted)]">Calendrier, tableau de bord et tendances pluriannuelles — congés uniquement</p>
        </div>
      </div>

      <RapportsSubNav active="/rapports/observatoire-conges" />

      <AbsenceAnalyticsBoard scope="leave" />
    </div>
  );
}