'use client';

// ============================================================================
// 📁 components/audit/FindingCard.tsx
// UN écart de contrôle avec TOUS les champs renvoyés par le back : règle, gravité,
// bloquant, statut, message, attendu/constaté, employé, période, dates de
// détection, motif, qui l'a clos (ou « automatiquement »), identifiants techniques.
// Actions : justifier (non bloquant), passer outre (bloquant, admin), rouvrir.
// ============================================================================
import React, { useState } from 'react';
import Link from 'next/link';
import {
  ChevronDown, ChevronRight, Lock, User, CalendarDays, Loader2, CheckCircle2, Undo2, ShieldAlert,
  ExternalLink, Bot, Scale, FileText,
} from 'lucide-react';
import { auditEngineService, type Finding, type RuleDef } from '@/services/audit-engine';
import { SeverityBadge } from './AuditEventCard';
import { useBasePath } from '@/hooks/useBasePath';
import {
  CATEGORY_LABEL, FINDING_STATUS_LABEL, MONTHS_FR, entityLabel, fmtDateTime,
} from '@/lib/audit-labels';

const STATUS_CLS: Record<string, string> = {
  OPEN: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400',
  JUSTIFIED: 'bg-[var(--surface-2)] text-[var(--text)]',
  WAIVED: 'bg-gray-200 text-gray-800 dark:bg-gray-600 dark:text-gray-100',
  RESOLVED: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400',
};

function Tech({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="min-w-0">
      <dt className="text-[10px] uppercase tracking-wider text-[var(--text-muted)]">{label}</dt>
      <dd className="text-xs font-mono text-[var(--text)] break-all">{value ?? '—'}</dd>
    </div>
  );
}

const input = 'w-full px-3 py-2 text-sm rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--brand)]';

export default function FindingCard({
  finding, rule, role, onChanged,
}: {
  finding: Finding;
  rule?: RuleDef;
  role: string;
  onChanged: (updated: Finding) => void;
}) {
  const { bp } = useBasePath();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<null | 'justify' | 'waive'>(null);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isOpen = finding.status === 'OPEN';
  const canHr = role === 'ADMIN' || role === 'HR_MANAGER';
  const canJustify = canHr && isOpen && !finding.blocking;
  const canWaive = role === 'ADMIN' && isOpen && finding.blocking;
  const canReopen = canHr && !isOpen;
  const hrBlockedByRole = isOpen && finding.blocking && role === 'HR_MANAGER';

  const period = finding.periodMonth && finding.periodYear ? `${MONTHS_FR[finding.periodMonth - 1]} ${finding.periodYear}` : 'Situation de l’employé (hors période)';

  async function act(kind: 'justify' | 'waive' | 'reopen') {
    setBusy(true); setError(null);
    try {
      const updated = kind === 'reopen' ? await auditEngineService.reopen(finding.id)
        : kind === 'justify' ? await auditEngineService.justify(finding.id, note.trim())
        : await auditEngineService.waive(finding.id, note.trim());
      setMode(null); setNote('');
      onChanged(updated);
    } catch (e: any) { setError(e?.message || 'Action refusée'); }
    finally { setBusy(false); }
  }

  return (
    <div className={`bg-[var(--surface)] rounded-xl border overflow-hidden ${isOpen && finding.blocking ? 'border-red-300 dark:border-red-900/60' : 'border-[var(--border)]'}`}>
      <button type="button" onClick={() => setOpen(o => !o)} className="w-full text-left p-4 flex items-start gap-3 hover:bg-[var(--surface-2)]/50 transition-colors">
        <span className="mt-0.5 text-[var(--text-muted)] shrink-0">{open ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <SeverityBadge severity={finding.severity} />
            {finding.blocking && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400">
                <Lock className="w-3 h-3" /> Bloquant
              </span>
            )}
            <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${STATUS_CLS[finding.status] ?? STATUS_CLS.JUSTIFIED}`}>
              {FINDING_STATUS_LABEL[finding.status] ?? finding.status}
            </span>
            <span className="text-sm font-bold text-[var(--text)]">{rule?.label ?? finding.ruleCode}</span>
            {rule && <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[var(--surface-2)] text-[var(--text-muted)]">{CATEGORY_LABEL[rule.category] ?? rule.category}</span>}
          </div>
          <p className="text-sm text-[var(--text)] mt-1.5 break-words">{finding.message}</p>
          {(finding.expected || finding.actual) && (
            <p className="text-xs text-[var(--text-muted)] mt-1.5">
              {finding.expected && <>Attendu : <span className="font-semibold text-[var(--text)]">{finding.expected}</span></>}
              {finding.expected && finding.actual && ' · '}
              {finding.actual && <>Constaté : <span className="font-semibold text-[var(--text)]">{finding.actual}</span></>}
            </p>
          )}
          <div className="flex items-center gap-x-4 gap-y-1 flex-wrap mt-1.5 text-xs text-[var(--text-muted)]">
            {finding.employeeName && <span className="flex items-center gap-1"><User className="w-3 h-3" /> {finding.employeeName}</span>}
            <span className="flex items-center gap-1"><CalendarDays className="w-3 h-3" /> {period}</span>
            <span>Dernière détection : {fmtDateTime(finding.lastDetectedAt)}</span>
          </div>
        </div>
      </button>

      {open && (
        <div className="border-t border-[var(--border)] p-4 space-y-4 bg-[var(--surface-2)]/30">
          {rule && (
            <div className="space-y-1.5">
              <p className="text-sm text-[var(--text)]">{rule.description}</p>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-[var(--text-muted)]">
                <span className="flex items-center gap-1">{rule.automation === 'AUTO' ? <Bot className="w-3 h-3" /> : <User className="w-3 h-3" />}
                  {rule.automation === 'AUTO' ? 'Contrôle automatique' : 'Détecté par le logiciel, décision humaine'}</span>
                {rule.legalRef && <span className="flex items-center gap-1"><Scale className="w-3 h-3" /> {rule.legalRef}</span>}
                {rule.checklistRef && <span className="flex items-center gap-1"><FileText className="w-3 h-3" /> Checklist : {rule.checklistRef}</span>}
              </div>
            </div>
          )}

          {!isOpen && (
            <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3 text-sm space-y-1">
              <p className="font-semibold text-[var(--text)] flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4" /> {FINDING_STATUS_LABEL[finding.status]}
                {finding.autoResolved && <span className="text-xs font-normal text-[var(--text-muted)]">· clos automatiquement</span>}</p>
              {finding.resolutionNote && <p className="text-[var(--text)]">Motif : {finding.resolutionNote}</p>}
              <p className="text-xs text-[var(--text-muted)]">
                {finding.resolvedByName ? `Par ${finding.resolvedByName}` : finding.autoResolved ? 'Par le système' : ''}
                {finding.resolvedAt ? ` · ${fmtDateTime(finding.resolvedAt)}` : ''}
              </p>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            {finding.employeeId && (
              <Link href={bp(`/contrats/employe/${finding.employeeId}`)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-[var(--surface)] border border-[var(--border)] hover:bg-[var(--surface-2)] text-[var(--text)]">
                <ExternalLink className="w-3 h-3" /> Contrats de l'employé
              </Link>
            )}
            {finding.entity === 'PAYROLL' && finding.entityId && (
              <Link href={bp(`/paie/${finding.entityId}`)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-[var(--surface)] border border-[var(--border)] hover:bg-[var(--surface-2)] text-[var(--text)]">
                <ExternalLink className="w-3 h-3" /> Ouvrir le bulletin
              </Link>
            )}
            {canJustify && <button type="button" onClick={() => { setMode('justify'); setError(null); }} className="px-3 py-1.5 text-xs font-bold rounded-lg bg-[var(--brand)] hover:bg-[var(--brand-strong)] text-white">Justifier</button>}
            {canWaive && <button type="button" onClick={() => { setMode('waive'); setError(null); }} className="px-3 py-1.5 text-xs font-bold rounded-lg bg-red-600 hover:bg-red-700 text-white">Passer outre</button>}
            {canReopen && (
              <button type="button" disabled={busy} onClick={() => act('reopen')} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-[var(--surface)] border border-[var(--border)] hover:bg-[var(--surface-2)] text-[var(--text)] disabled:opacity-50">
                {busy ? <Loader2 className="w-3 h-3 animate-spin" /> : <Undo2 className="w-3 h-3" />} Rouvrir
              </button>
            )}
          </div>
          {hrBlockedByRole && <p className="text-xs text-[var(--text-muted)] flex items-center gap-1.5"><Lock className="w-3 h-3" /> Écart bloquant : corrigez-le, ou demandez à un administrateur de passer outre avec un motif.</p>}

          {mode && (
            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3 space-y-2">
              <p className="text-sm font-semibold text-[var(--text)]">{mode === 'waive' ? 'Passer outre cet écart bloquant' : 'Justifier cet écart'}</p>
              <p className="text-xs text-[var(--text-muted)]">
                {mode === 'waive'
                  ? "Le motif est obligatoire (10 caractères min.). L'événement sera enregistré comme critique dans le journal d'audit. L'écart se rouvre si les faits changent."
                  : "Le motif est conservé dans l'écart et dans le journal d'audit. L'écart se rouvre si les faits changent."}
              </p>
              <textarea value={note} onChange={e => setNote(e.target.value)} rows={2} maxLength={500} placeholder="Motif…" className={input} />
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => { setMode(null); setNote(''); }} className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-[var(--surface-2)] hover:bg-[var(--border)] text-[var(--text)]">Annuler</button>
                <button type="button" disabled={busy || note.trim().length < 10} onClick={() => act(mode)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg text-white disabled:opacity-50 ${mode === 'waive' ? 'bg-red-600 hover:bg-red-700' : 'bg-[var(--brand)] hover:bg-[var(--brand-strong)]'}`}>
                  {busy && <Loader2 className="w-3 h-3 animate-spin" />} Confirmer
                </button>
              </div>
            </div>
          )}
          {error && <p className="text-sm text-red-600 dark:text-red-400 flex items-start gap-2"><ShieldAlert className="w-4 h-4 mt-0.5 shrink-0" /> {error}</p>}

          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-[var(--border)]">
            <Tech label="Identifiant de l'écart" value={finding.id} />
            <Tech label="Code de la règle" value={finding.ruleCode} />
            <Tech label="Objet concerné" value={`${entityLabel(finding.entity)} (${finding.entity})`} />
            <Tech label="Identifiant de l'objet" value={finding.entityId} />
            <Tech label="Identifiant de l'employé" value={finding.employeeId} />
            <Tech label="Dernier contrôle l'ayant vu" value={finding.runId} />
            <Tech label="Première détection" value={fmtDateTime(finding.firstDetectedAt)} />
            <Tech label="Dernière détection" value={fmtDateTime(finding.lastDetectedAt)} />
          </dl>
        </div>
      )}
    </div>
  );
}