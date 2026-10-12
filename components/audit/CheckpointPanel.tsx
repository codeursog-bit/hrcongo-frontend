'use client';

// ============================================================================
// 📁 components/audit/CheckpointPanel.tsx
// Les ~10 % humains : déclarations dont le logiciel suit l'échéance mais dont
// la personne atteste le dépôt AVEC sa preuve (reçu CNSS, accusé e-Tax).
// Affiche tous les champs : échéance, statut, retard, preuve, note, qui, quand.
// ============================================================================
import React, { useState } from 'react';
import { ClipboardCheck, CalendarClock, Loader2, CheckCircle2, AlertTriangle, MinusCircle, Scale, UserCheck } from 'lucide-react';
import { auditEngineService, type CheckpointView } from '@/services/audit-engine';
import { CHECKPOINT_STATUS_LABEL, MONTHS_FR, fmtDate, fmtDateTime } from '@/lib/audit-labels';

const input = 'w-full px-3 py-2 text-sm rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--brand)]';

const CHIP: Record<string, string> = {
  DONE: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400',
  NOT_APPLICABLE: 'bg-[var(--surface-2)] text-[var(--text-muted)]',
  PENDING: 'bg-gray-200 text-gray-800 dark:bg-gray-600 dark:text-gray-100',
  NOT_DUE: 'bg-[var(--surface-2)] text-[var(--text-muted)]',
};

export default function CheckpointPanel({
  checkpoints, month, year, canAttest, companyId, onChanged,
}: {
  checkpoints: CheckpointView[];
  month: number;
  year: number;
  canAttest: boolean;
  companyId?: string;
  onChanged: (list: CheckpointView[]) => void;
}) {
  const [editing, setEditing] = useState<string | null>(null);
  const [kind, setKind] = useState<'DONE' | 'NOT_APPLICABLE'>('DONE');
  const [evidence, setEvidence] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const open = (c: CheckpointView) => {
    setEditing(c.code); setError(null);
    setKind(c.status === 'NOT_APPLICABLE' ? 'NOT_APPLICABLE' : 'DONE');
    setEvidence(c.evidenceRef ?? ''); setNote(c.note ?? '');
  };

  async function submit(c: CheckpointView) {
    setBusy(true); setError(null);
    try {
      const list = await auditEngineService.attest({
        companyId, code: c.code, month, year, status: kind,
        evidenceRef: kind === 'DONE' ? evidence.trim() : undefined,
        note: kind === 'NOT_APPLICABLE' ? note.trim() : undefined,
      });
      setEditing(null);
      onChanged(list);
    } catch (e: any) { setError(e?.message || 'Attestation refusée'); }
    finally { setBusy(false); }
  }

  if (checkpoints.length === 0) return null;

  return (
    <section className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] p-4 sm:p-5 space-y-3">
      <div>
        <p className="text-sm font-black text-[var(--text)] flex items-center gap-2"><ClipboardCheck className="w-4 h-4 text-[var(--brand)]" /> Déclarations à attester — {MONTHS_FR[month - 1]} {year}</p>
        <p className="text-xs text-[var(--text-muted)] mt-1">
          Le logiciel calcule l'échéance et vous relance ; vous attestez le dépôt avec sa preuve. C'est la part de l'audit qui reste humaine.
        </p>
      </div>

      {checkpoints.map(c => {
        const Icon = c.status === 'DONE' ? CheckCircle2 : c.status === 'NOT_APPLICABLE' || c.status === 'NOT_DUE' ? MinusCircle : AlertTriangle;
        return (
          <div key={c.code} className={`rounded-xl border p-3 space-y-2 ${c.overdue ? 'border-red-300 dark:border-red-900/60' : 'border-[var(--border)]'}`}>
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div className="min-w-0">
                <p className="text-sm font-bold text-[var(--text)] flex items-center gap-2 flex-wrap">
                  <Icon className="w-4 h-4 shrink-0" /> {c.label}
                  <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${CHIP[c.status]}`}>{CHECKPOINT_STATUS_LABEL[c.status]}</span>
                  {c.overdue && <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400">Échéance dépassée</span>}
                </p>
                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-xs text-[var(--text-muted)]">
                  <span className="flex items-center gap-1"><CalendarClock className="w-3 h-3" /> Échéance : {c.dueDate ? fmtDate(c.dueDate) : 'aucune ce mois-ci'}</span>
                  <span className="flex items-center gap-1"><Scale className="w-3 h-3" /> {c.legalRef}</span>
                </div>
              </div>
              {canAttest && c.status !== 'NOT_DUE' && editing !== c.code && (
                <button type="button" onClick={() => open(c)} className="px-3 py-1.5 text-xs font-bold rounded-lg bg-[var(--brand)] hover:bg-[var(--brand-strong)] text-white">
                  {c.status === 'PENDING' ? 'Attester' : 'Modifier'}
                </button>
              )}
            </div>

            {(c.status === 'DONE' || c.status === 'NOT_APPLICABLE') && (
              <div className="rounded-lg bg-[var(--surface-2)]/60 p-2.5 text-xs text-[var(--text)] space-y-0.5">
                {c.evidenceRef && <p>Preuve : <b>{c.evidenceRef}</b></p>}
                {c.note && <p>Note : {c.note}</p>}
                <p className="text-[var(--text-muted)] flex items-center gap-1"><UserCheck className="w-3 h-3" /> {c.attestedByName ? `Attesté par ${c.attestedByName}` : 'Attesté'}{c.attestedAt ? ` · ${fmtDateTime(c.attestedAt)}` : ''}</p>
              </div>
            )}

            {editing === c.code && (
              <div className="space-y-2 pt-1">
                <div className="grid grid-cols-2 gap-2">
                  {(['DONE', 'NOT_APPLICABLE'] as const).map(k => (
                    <button key={k} type="button" onClick={() => setKind(k)}
                      className={`px-3 py-2 text-xs font-bold rounded-xl border transition-colors ${kind === k ? 'bg-[var(--brand)] text-white border-transparent' : 'bg-[var(--surface)] text-[var(--text)] border-[var(--border)] hover:bg-[var(--surface-2)]'}`}>
                      {k === 'DONE' ? 'Déposé / fait' : 'Sans objet ce mois-ci'}
                    </button>
                  ))}
                </div>
                {kind === 'DONE' ? (
                  <div>
                    <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1">Preuve * — {c.evidenceHint}</label>
                    <input value={evidence} onChange={e => setEvidence(e.target.value)} maxLength={200} className={input} />
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1">Motif * (10 caractères min.)</label>
                    <textarea value={note} onChange={e => setNote(e.target.value)} rows={2} maxLength={500} className={input} />
                  </div>
                )}
                {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
                <div className="flex justify-end gap-2">
                  <button type="button" onClick={() => setEditing(null)} className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-[var(--surface-2)] hover:bg-[var(--border)] text-[var(--text)]">Annuler</button>
                  <button type="button" disabled={busy || (kind === 'DONE' ? evidence.trim().length < 3 : note.trim().length < 10)} onClick={() => submit(c)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-[var(--brand)] hover:bg-[var(--brand-strong)] text-white disabled:opacity-50">
                    {busy && <Loader2 className="w-3 h-3 animate-spin" />} Enregistrer l'attestation
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </section>
  );
}