'use client';

// ============================================================================
// 📁 components/audit/AuditBlockedModal.tsx
// Affiché quand la validation d'une paie est refusée (422 AUDIT_BLOCKED) :
// la liste des écarts bloquants, avec — pour un administrateur — la possibilité
// de passer outre un écart avec motif, puis de relancer la validation.
// ============================================================================
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { X, ShieldAlert, Lock, ExternalLink, Loader2, CheckCircle2, RotateCcw, Info } from 'lucide-react';
import { auditEngineService, type AuditBlocked, type RuleDef } from '@/services/audit-engine';
import { authService } from '@/lib/services/authService';
import { useBasePath } from '@/hooks/useBasePath';

const input = 'w-full px-3 py-2 text-sm rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--brand)]';

export default function AuditBlockedModal({
  blocked, month, year, onClose, onRetry,
}: {
  blocked: AuditBlocked;
  month?: number;
  year?: number;
  onClose: () => void;
  /** Relance la validation (appelée quand tous les écarts affichés sont réglés). */
  onRetry?: () => void;
}) {
  const { bp } = useBasePath();
  const [role, setRole] = useState<string | null>(null);
  const [rules, setRules] = useState<Record<string, RuleDef>>({});
  const [waived, setWaived] = useState<Set<string>>(new Set());
  const [editing, setEditing] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { setRole(authService.getCurrentUser()?.role ?? null); }, []);
  useEffect(() => {
    auditEngineService.rules().then(r => setRules(Object.fromEntries(r.rules.map(x => [x.code, x])))).catch(() => {});
  }, []);

  const isAdmin = role === 'ADMIN';
  const remaining = blocked.findings.filter(f => !waived.has(f.id)).length;
  const truncated = blocked.total > blocked.findings.length;
  const link = `/audit?tab=controles${month && year ? `&month=${month}&year=${year}` : ''}`;

  async function waive(id: string) {
    setBusy(true); setError(null);
    try {
      await auditEngineService.waive(id, note.trim());
      setWaived(prev => new Set(prev).add(id));
      setEditing(null); setNote('');
    } catch (e: any) { setError(e?.message || 'Action refusée'); }
    finally { setBusy(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={onClose}>
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} onClick={e => e.stopPropagation()}
        className="w-full max-w-2xl max-h-[92vh] overflow-y-auto bg-[var(--surface)] rounded-2xl border border-[var(--border)] shadow-2xl">
        <div className="sticky top-0 z-10 bg-[var(--surface)] border-b border-[var(--border)] p-5 flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <ShieldAlert className="w-6 h-6 text-red-600 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-lg font-black text-[var(--text)]">Validation refusée par le contrôle de paie</h3>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">{blocked.message}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-[var(--surface-2)] text-[var(--text-muted)]"><X className="w-4 h-4" /></button>
        </div>

        <div className="p-5 space-y-3">
          {truncated && <p className="text-xs text-[var(--text-muted)] flex items-center gap-1.5"><Info className="w-3.5 h-3.5" /> {blocked.total} écarts bloquants au total — les {blocked.findings.length} plus récents sont affichés.</p>}

          {blocked.findings.map(f => {
            const done = waived.has(f.id);
            const rule = rules[f.ruleCode];
            return (
              <div key={f.id} className={`rounded-xl border p-3 space-y-2 ${done ? 'border-[var(--border)] opacity-60' : 'border-red-300 dark:border-red-900/60'}`}>
                <div className="flex items-start gap-2">
                  {done ? <CheckCircle2 className="w-4 h-4 mt-0.5 text-emerald-600 shrink-0" /> : <Lock className="w-4 h-4 mt-0.5 text-red-600 shrink-0" />}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-[var(--text)]">{rule?.label ?? f.ruleCode}{done && <span className="ml-2 text-xs font-normal text-[var(--text-muted)]">passé outre</span>}</p>
                    <p className="text-sm text-[var(--text)] break-words">{f.message}</p>
                    {(f.expected || f.actual) && (
                      <p className="text-xs text-[var(--text-muted)] mt-1">
                        {f.expected && <>Attendu : <b className="text-[var(--text)]">{f.expected}</b></>}{f.expected && f.actual && ' · '}{f.actual && <>Constaté : <b className="text-[var(--text)]">{f.actual}</b></>}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-2 mt-2">
                      {f.employeeId && <Link href={bp(`/contrats/employe/${f.employeeId}`)} className="flex items-center gap-1 text-xs font-semibold text-[var(--brand)] hover:underline"><ExternalLink className="w-3 h-3" /> Contrats de l'employé</Link>}
                      {f.entity === 'PAYROLL' && f.entityId && <Link href={bp(`/paie/${f.entityId}`)} className="flex items-center gap-1 text-xs font-semibold text-[var(--brand)] hover:underline"><ExternalLink className="w-3 h-3" /> Ouvrir le bulletin</Link>}
                      {isAdmin && !done && <button type="button" onClick={() => { setEditing(f.id); setError(null); setNote(''); }} className="text-xs font-bold text-red-600 hover:underline">Passer outre…</button>}
                    </div>
                  </div>
                </div>
                {editing === f.id && (
                  <div className="space-y-2 pt-1">
                    <textarea value={note} onChange={e => setNote(e.target.value)} rows={2} maxLength={500} placeholder="Motif (10 caractères min.) — tracé comme critique dans le journal" className={input} />
                    <div className="flex justify-end gap-2">
                      <button type="button" onClick={() => setEditing(null)} className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-[var(--surface-2)] hover:bg-[var(--border)] text-[var(--text)]">Annuler</button>
                      <button type="button" disabled={busy || note.trim().length < 10} onClick={() => waive(f.id)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-red-600 hover:bg-red-700 text-white disabled:opacity-50">
                        {busy && <Loader2 className="w-3 h-3 animate-spin" />} Confirmer
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
          {!isAdmin && <p className="text-xs text-[var(--text-muted)]">Corrigez les données concernées (puis revalidez), ou demandez à un administrateur de passer outre avec un motif.</p>}
        </div>

        <div className="sticky bottom-0 bg-[var(--surface)] border-t border-[var(--border)] p-4 flex flex-wrap justify-end gap-2">
          <Link href={bp(link)} className="px-4 py-2 text-sm font-semibold rounded-xl bg-[var(--surface-2)] hover:bg-[var(--border)] text-[var(--text)]">Voir tous les contrôles</Link>
          <button onClick={onClose} className="px-4 py-2 text-sm font-semibold rounded-xl bg-[var(--surface-2)] hover:bg-[var(--border)] text-[var(--text)]">Fermer</button>
          {onRetry && remaining === 0 && !truncated && (
            <button onClick={onRetry} className="flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-xl bg-[var(--brand)] hover:bg-[var(--brand-strong)] text-white">
              <RotateCcw className="w-4 h-4" /> Relancer la validation
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}