// ===========================
// FILE: SuccessModal.tsx
// ===========================
import React from 'react';
import { CheckCircle2, Terminal, AlertTriangle, X } from 'lucide-react';
import { Badge, Button, Card, EmptyState } from '@/components/design-system/primitives';
import { Modal } from '@/components/design-system/feedback';

interface SuccessModalProps {
  show: boolean;
  results: { success: number; failed: number; skipped: number };
  processingDetails: any[];
  onClose: () => void;
  onNewBatch: () => void;
  onViewPayrolls: () => void;
}

export default function SuccessModal({ 
  show, 
  results, 
  processingDetails, 
  onClose, 
  onNewBatch, 
  onViewPayrolls 
}: SuccessModalProps) {
  return (
    <Modal open={show} onClose={onClose} title="Traitement du lot terminé"
      actions={<><Button variant="secondary" onClick={onNewBatch}>Nouveau lot</Button><Button onClick={onViewPayrolls}>Voir les bulletins</Button></>}>
      <div className="space-y-5">
        <div className="grid gap-3 sm:grid-cols-3">
          <Card title="Créés"><p className="text-2xl font-semibold tabular-nums text-[var(--success-text)]">{results.success}</p></Card>
          <Card title="Ignorés"><p className="text-2xl font-semibold tabular-nums text-[var(--warning-text)]">{results.skipped}</p></Card>
          <Card title="Échecs"><p className="text-2xl font-semibold tabular-nums text-[var(--danger-text)]">{results.failed}</p></Card>
        </div>
        <section>
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-[var(--text)]"><Terminal size={16} aria-hidden="true" />Détail par employé</h3>
          {processingDetails.length ? (
            <ul className="max-h-64 space-y-2 overflow-y-auto">
              {processingDetails.map((detail, i) => {
                const tone = detail.status === 'SUCCESS' ? 'success' : detail.status === 'SKIPPED' ? 'warning' : 'danger';
                const Icon = detail.status === 'SUCCESS' ? CheckCircle2 : detail.status === 'SKIPPED' ? AlertTriangle : X;
                return (
                  <li key={i} className="flex items-start justify-between gap-3 rounded-xl bg-[var(--surface-2)] p-3">
                    <div className="flex min-w-0 items-start gap-3">
                      <Icon size={17} className="mt-0.5 shrink-0 text-[var(--text-secondary)]" aria-hidden="true" />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-[var(--text)]">{detail.employeeName}</p>
                        {detail.reason && <p className="mt-1 text-xs text-[var(--text-secondary)]">{detail.reason}</p>}
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      {detail.netSalary && <span className="font-mono text-xs tabular-nums text-[var(--text-secondary)]">{detail.netSalary.toLocaleString('fr-FR')} F</span>}
                      <Badge tone={tone}>{detail.status === 'SUCCESS' ? 'Créé' : detail.status === 'SKIPPED' ? 'Ignoré' : 'Échec'}</Badge>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <EmptyState title="Aucun détail de traitement">Les résultats apparaîtront ici à la fin du lot.</EmptyState>
          )}
        </section>
      </div>
    </Modal>
  );
}