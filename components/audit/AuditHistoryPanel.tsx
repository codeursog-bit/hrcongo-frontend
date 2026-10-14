'use client';

// ============================================================================
// 📁 components/audit/AuditHistoryPanel.tsx
// Historique d'audit d'UN objet (contrat, employé…) — du plus récent au plus ancien.
// ============================================================================
import React, { useEffect, useState } from 'react';
import { ShieldCheck, AlertCircle } from 'lucide-react';
import { KonzaLoader } from '@/components/ui/KonzaLoader';
import { auditTrailService, type AuditEvent } from '@/services/audit-trail';
import AuditEventCard from './AuditEventCard';

export default function AuditHistoryPanel({
  entity, entityId, companyId, viewerRole,
}: { entity: string; entityId: string; companyId?: string; viewerRole?: string }) {
  const [events, setEvents] = useState<AuditEvent[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    setEvents(null); setError(null);
    auditTrailService.history(entity, entityId, companyId)
      .then(r => { if (alive) setEvents(r); })
      .catch(e => { if (alive) setError(e?.message || "Impossible de charger l'historique"); });
    return () => { alive = false; };
  }, [entity, entityId, companyId]);

  if (error) {
    return (
      <p className="flex items-start gap-2 text-sm text-red-600 dark:text-red-400">
        <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" /> {error}
      </p>
    );
  }
  if (!events) {
    return <KonzaLoader variant="section" />;
  }
  if (events.length === 0) {
    return (
      <div className="text-center py-10 text-sm text-[var(--text-muted)]">
        <ShieldCheck className="w-7 h-7 mx-auto mb-2 opacity-50" />
        Aucun événement enregistré pour cet objet.
        <p className="text-xs mt-1">Les actions faites avant l'activation du journal n'y figurent pas.</p>
      </div>
    );
  }
  return (
    <div className="space-y-2.5">
      <p className="text-xs text-[var(--text-muted)]">{events.length} événement{events.length > 1 ? 's' : ''}{events.length >= 500 ? ' (500 plus récents)' : ''}</p>
      {events.map(ev => <AuditEventCard key={ev.id} event={ev} viewerRole={viewerRole} />)}
    </div>
  );
}