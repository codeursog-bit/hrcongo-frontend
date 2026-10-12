'use client';

// ============================================================================
// 📁 components/audit/PayrollAuditBanner.tsx
// Bandeau à placer en haut de la page Paie : met le contrôle DANS le flux de paie
// (état du mois, écarts bloquants, mode de la barrière, lien vers le détail).
// Se masque tout seul si l'utilisateur n'a pas accès (403) ou si rien n'a été contrôlé.
// ============================================================================
import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ShieldCheck, ShieldAlert, Loader2, RefreshCw, Lock, Eye } from 'lucide-react';
import { auditEngineService, type AuditSummary, type GateMode } from '@/services/audit-engine';
import { authService } from '@/lib/services/authService';
import { useBasePath } from '@/hooks/useBasePath';
import { MONTHS_FR, fmtDateTime } from '@/lib/audit-labels';

export default function PayrollAuditBanner({ month, year, refreshKey }: { month: number; year: number; refreshKey?: number }) {
  const { bp, companyId, isPme } = useBasePath();
  const [role, setRole] = useState<string | null>(null);
  const [summary, setSummary] = useState<AuditSummary | null>(null);
  const [mode, setMode] = useState<GateMode | null>(null);
  const [hidden, setHidden] = useState(false);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scoped = isPme ? companyId : undefined;

  useEffect(() => { setRole(authService.getCurrentUser()?.role ?? null); }, []);
  const canRun = role === 'ADMIN' || role === 'HR_MANAGER';

  const load = useCallback(async () => {
    try {
      const [s, r] = await Promise.all([
        auditEngineService.summary({ companyId: scoped, month, year }),
        auditEngineService.rules().catch(() => null),
      ]);
      setSummary(s); setMode(r?.gateMode ?? null); setHidden(false);
    } catch { setHidden(true); }
  }, [month, year, scoped]);

  useEffect(() => { load(); }, [load, refreshKey]);

  async function run() {
    setRunning(true); setError(null);
    try { await auditEngineService.run({ companyId: scoped, month, year }); await load(); }
    catch (e: any) { setError(e?.status === 429 ? 'Trop de contrôles : réessayez dans une minute.' : (e?.message || 'Contrôle impossible')); }
    finally { setRunning(false); }
  }

  if (hidden || !role) return null;
  if (!summary) return <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]"><Loader2 className="w-3.5 h-3.5 animate-spin" /> Contrôle de paie…</div>;

  const blocking = summary.open.blocking;
  const ok = summary.lastRun && summary.open.total === 0;
  const never = !summary.lastRun;
  const tone = blocking > 0 ? 'border-red-300 dark:border-red-900/60 bg-red-50 dark:bg-red-950/30'
    : ok ? 'border-emerald-300 dark:border-emerald-900/60 bg-emerald-50 dark:bg-emerald-950/30'
    : 'border-[var(--border)] bg-[var(--surface)]';
  const Icon = blocking > 0 ? ShieldAlert : ShieldCheck;

  return (
    <div className={`rounded-2xl border p-4 flex items-center justify-between gap-3 flex-wrap ${tone}`}>
      <div className="flex items-start gap-3 min-w-0">
        <Icon className={`w-5 h-5 mt-0.5 shrink-0 ${blocking > 0 ? 'text-red-600' : ok ? 'text-emerald-600' : 'text-[var(--text-muted)]'}`} />
        <div className="min-w-0">
          <p className="text-sm font-bold text-[var(--text)]">
            Contrôle de paie — {MONTHS_FR[month - 1]} {year}
            {summary.conformityRate !== null && <span className="ml-2 font-black">{summary.conformityRate} % conforme</span>}
          </p>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">
            {never ? 'Aucun contrôle effectué pour ce mois.'
              : <>{summary.payrollsChecked} bulletin{summary.payrollsChecked > 1 ? 's' : ''} contrôlé{summary.payrollsChecked > 1 ? 's' : ''} · {summary.open.total} écart{summary.open.total > 1 ? 's' : ''} ouvert{summary.open.total > 1 ? 's' : ''}
                  {summary.open.critical > 0 && <> dont {summary.open.critical} critique{summary.open.critical > 1 ? 's' : ''}</>}
                  {blocking > 0 && <> · <b className="text-red-600">{blocking} bloquant{blocking > 1 ? 's' : ''}</b></>}
                  {summary.lastRun && <> · dernier contrôle {fmtDateTime(summary.lastRun.finishedAt)}</>}</>}
          </p>
          {mode && (
            <p className="text-[11px] text-[var(--text-muted)] mt-0.5 flex items-center gap-1">
              {mode === 'enforce' ? <><Lock className="w-3 h-3" /> Les écarts bloquants empêchent la validation.</> : <><Eye className="w-3 h-3" /> Mode observation : les écarts sont signalés mais n'empêchent pas la validation.</>}
            </p>
          )}
          {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
        </div>
      </div>
      <div className="flex gap-2">
        {canRun && (
          <button type="button" onClick={run} disabled={running} className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl bg-[var(--surface)] border border-[var(--border)] hover:bg-[var(--surface-2)] text-[var(--text)] disabled:opacity-50">
            <RefreshCw className={`w-3.5 h-3.5 ${running ? 'animate-spin' : ''}`} /> Contrôler maintenant
          </button>
        )}
        <Link href={bp(`/audit?tab=controles&month=${month}&year=${year}`)} className="px-3 py-2 text-xs font-bold rounded-xl bg-[var(--brand)] hover:bg-[var(--brand-strong)] text-white">Voir le détail</Link>
      </div>
    </div>
  );
}