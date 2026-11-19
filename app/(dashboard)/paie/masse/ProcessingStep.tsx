// ===========================
// FILE: ProcessingStep.tsx
// ===========================
import React from 'react';
import { motion } from 'framer-motion';
import { Zap, Terminal, Play, CheckCircle2, AlertTriangle, X } from 'lucide-react';
import { Badge, Button, Card } from '@/components/design-system/primitives';

interface ProcessingStepProps {
  isProcessing: boolean;
  progress: number;
  currentEmployee: string;
  logs: string[];
  results: { success: number; failed: number; skipped: number };
  selectedCount: number;
  estimatedCost: number;
  onStart: () => void;
  onShowSummary: () => void;
}

export default function ProcessingStep({ 
  isProcessing, 
  progress, 
  currentEmployee, 
  logs, 
  results, 
  selectedCount, 
  estimatedCost, 
  onStart,
  onShowSummary
}: ProcessingStepProps) {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mx-auto w-full max-w-3xl">
      {isProcessing || progress > 0 ? (
        <div className="space-y-5">
          <Card title="Traitement du lot" action={<Badge tone={isProcessing ? 'info' : 'success'}>{isProcessing ? 'En cours' : 'Terminé'}</Badge>}>
            <div className="space-y-4">
              <div className="flex items-end justify-between gap-4">
                <p className="text-sm text-[var(--text-secondary)]">{currentEmployee || 'Mise à jour des bulletins'}</p>
                <strong className="text-2xl tabular-nums text-[var(--text)]">{progress}%</strong>
              </div>
              <div role="progressbar" aria-label="Progression du traitement" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress}
                className="h-2 overflow-hidden rounded-full bg-[var(--surface-2)]">
                <div className="h-full rounded-full bg-[var(--green)] transition-[width] duration-300" style={{ width: `${progress}%` }} />
              </div>
            </div>
          </Card>

          <div className="grid gap-4 sm:grid-cols-3">
            <Card title="Bulletins créés">
              <p className="text-3xl font-semibold tabular-nums text-[var(--success-text)]">{results.success}</p>
              <CheckCircle2 className="mt-2 text-[var(--success-text)]" size={18} aria-hidden="true" />
            </Card>
            <Card title="Ignorés">
              <p className="text-3xl font-semibold tabular-nums text-[var(--warning-text)]">{results.skipped}</p>
              <AlertTriangle className="mt-2 text-[var(--warning-text)]" size={18} aria-hidden="true" />
            </Card>
            <Card title="En échec">
              <p className="text-3xl font-semibold tabular-nums text-[var(--danger-text)]">{results.failed}</p>
              <X className="mt-2 text-[var(--danger-text)]" size={18} aria-hidden="true" />
            </Card>
          </div>

          <Card title="Journal du traitement" action={<Terminal size={16} aria-hidden="true" className="text-[var(--text-secondary)]" />}>
            <div aria-live="polite" className="max-h-56 space-y-2 overflow-y-auto rounded-xl bg-[var(--surface-2)] p-4 font-mono text-xs text-[var(--text-secondary)]">
              {logs.length ? logs.map((log, i) => <p key={i} className="break-words">{log}</p>) : <p>Les étapes du traitement apparaîtront ici.</p>}
            </div>
          </Card>

          {(progress === 100 && !isProcessing) && (
            <Button className="w-full" onClick={onShowSummary}>Voir le résumé complet</Button>
          )}
        </div>
      ) : (
        <Card title="Vérification avant lancement" action={<Badge tone="success">Prêt</Badge>} className="text-center">
          <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--brand-soft)] text-[var(--brand-strong)]">
            <Play size={20} strokeWidth={1.5} aria-hidden="true" />
          </div>
          <h2 className="text-xl font-semibold text-[var(--text)]">Générer les bulletins sélectionnés</h2>
          <p className="mx-auto my-3 max-w-lg text-sm leading-6 text-[var(--text-secondary)]">
            {selectedCount} bulletin(s) à traiter · Masse estimée : <strong className="tabular-nums text-[var(--text)]">{estimatedCost.toLocaleString('fr-FR')} FCFA</strong>
          </p>
          <Button onClick={onStart}><Zap size={17} strokeWidth={1.5} aria-hidden="true" />Lancer le traitement</Button>
        </Card>
      )}
    </motion.div>
  );
}