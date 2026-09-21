'use client';

// ============================================================================
// 📁 app/(dashboard)/rapports/absences/page.tsx
// ✅ Version "Rapports" du suivi des absences — scope="all".
//    Navigation via le composant partagé RapportsSubNav (5 boutons + "Plus").
// ============================================================================

import React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { useBasePath } from '@/hooks/useBasePath';
import RapportsSubNav from '@/components/RapportsSubNav';
import AbsenceAnalyticsBoard from '@/components/absence-analytics/AbsenceAnalyticsBoard';

export default function RapportAbsencesPage() {
  const router = useRouter();
  const { bp } = useBasePath();

  return (
    <div className="max-w-[1600px] mx-auto pb-20 space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => router.push(bp('/rapports'))} className="p-2 bg-[var(--surface)] rounded-xl border border-[var(--border)]">
          <ArrowLeft size={20} className="text-[var(--text-muted)]" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-[var(--text)]">Observatoire RH des absences</h1>
          <p className="text-[var(--text-muted)]">Congés, permissions et absences injustifiées — vue consolidée pour le pilotage RH</p>
        </div>
      </div>

      <RapportsSubNav active="/rapports/absences" />

      <AbsenceAnalyticsBoard scope="all" />
    </div>
  );
}