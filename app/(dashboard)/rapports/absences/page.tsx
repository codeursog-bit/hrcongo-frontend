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
import { Button } from '@/components/design-system/primitives';
import { PageHeader } from '@/components/templates';
import { ReportsFrame as ModulePageFrame } from '@/components/reports/ReportsFrame';
import styles from './page.module.css';

export default function RapportAbsencesPage() {
  const router = useRouter();
  const { bp } = useBasePath();

  return (
    <main className={styles.page}>
      <ModulePageFrame kind="dashboard">
        <PageHeader
          title="Observatoire RH des absences"
          description="Congés, permissions et absences injustifiées — vue consolidée pour le pilotage RH"
          action={
            <Button variant="secondary" onClick={() => router.push(bp('/rapports'))}>
              <ArrowLeft size={17} strokeWidth={1.5} aria-hidden="true" />
              Vue d’ensemble
            </Button>
          }
          navigation={
            <nav aria-label="Navigation des rapports">
              <RapportsSubNav active="/rapports/absences" />
            </nav>
          }
        />
        <AbsenceAnalyticsBoard scope="all" />
      </ModulePageFrame>
    </main>
  );
}