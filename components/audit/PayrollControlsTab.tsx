'use client';

// ============================================================================
// 📁 components/audit/PayrollControlsTab.tsx
// Onglet « Contrôles de paie » de la page Audit : synthèse du mois, dernier
// contrôle, déclarations à attester, liste des écarts filtrable, catalogue des
// règles. Tout ce que renvoient /audit-engine/summary, /findings et /rules est affiché.
// ============================================================================
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Loader2, RefreshCw, Play, ShieldCheck, ShieldAlert, ChevronLeft, ChevronRight, Lock, Eye, Bot, User,
  ChevronDown, ChevronRight as ChevronR, Info, Gauge, ListChecks,
} from 'lucide-react';
import { KonzaLoader } from '@/components/ui/KonzaLoader';
import {
  auditEngineService, type AuditSummary, type CheckpointView, type Finding, type FindingsResponse,
  type FindingStatus, type RulesCatalog, type RunSummary,
} from '@/services/audit-engine';
import type { AuditSeverity } from '@/services/audit-trail';
import FindingCard from './FindingCard';
import { SeverityBadge } from './AuditEventCard';
import CheckpointPanel from './CheckpointPanel';
import TrendSection from './charts/TrendSection';
import { CATEGORY_LABEL, FINDING_STATUS_LABEL, MONTHS_FR, TRIGGER_LABEL, fmtDateTime } from '@/lib/audit-labels';

const field = 'px-3 py-2 text-sm rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--brand)]';
const lbl = 'block text-xs font-semibold text-[var(--text-muted)] mb-1';

function Stat({ label, value, tone }: { label: string; value: React.ReactNode; tone?: 'red' | 'green' }) {
  return (
    <div className="bg-[var(--surface)] rounded-xl border border-[var(--border)] p-3">
      <p className="text-[11px] uppercase tracking-wider text-[var(--text-muted)]">{label}</p>
      <p className={`text-xl font-black mt-0.5 ${tone === 'red' ? 'text-red-600' : tone === 'green' ? 'text-emerald-600' : 'text-[var(--text)]'}`}>{value}</p>
    </div>
  );
}

export default function PayrollControlsTab({
  role, companyId, initialMonth, initialYear,
}: { role: string; companyId?: string; initialMonth?: number; initialYear?: number }) {
  const now = new Date();
  const [month, setMonth] = useState(initialMonth ?? now.getMonth() + 1);
  const [year, setYear] = useState(initialYear ?? now.getFullYear());
  const [summary, setSummary] = useState<AuditSummary | null>(null);
  const [catalog, setCatalog] = useState<RulesCatalog | null>(null);
  const [res, setRes] = useState<FindingsResponse | null>(null);
  const [status, setStatus] = useState<'' | FindingStatus>('OPEN');
  const [severity, setSeverity] = useState<'' | AuditSeverity>('');
  const [ruleCode, setRuleCode] = useState('');
  const [blockingOnly, setBlockingOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [runResult, setRunResult] = useState<RunSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showCatalog, setShowCatalog] = useState(false);

  const canRun = role === 'ADMIN' || role === 'HR_MANAGER';
  const rulesByCode = useMemo(() => Object.fromEntries((catalog?.rules ?? []).map(r => [r.code, r])), [catalog]);

  useEffect(() => { auditEngineService.rules().then(setCatalog).catch(() => {}); }, []);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const s = await auditEngineService.summary({ companyId, month, year });
      setSummary(s);
      if (s.detailVisible) {
        setRes(await auditEngineService.findings({
          companyId, month, year, status: status || undefined, severity: severity || undefined,
          ruleCode: ruleCode || undefined, blocking: blockingOnly ? true : undefined, page, limit: 20,
        }));
      } else setRes(null);
    } catch (e: any) { setError(e?.message || 'Impossible de charger les contrôles'); }
    finally { setLoading(false); }
  }, [companyId, month, year, status, severity, ruleCode, blockingOnly, page]);

  useEffect(() => { load(); }, [load]);

  async function run() {
    setRunning(true); setError(null); setRunResult(null);
    try { setRunResult(await auditEngineService.run({ companyId, month, year })); setPage(1); await load(); }
    catch (e: any) { setError(e?.status === 429 ? 'Trop de contrôles : réessayez dans une minute.' : (e?.message || 'Contrôle impossible')); }
    finally { setRunning(false); }
  }

  const onFindingChanged = (u: Finding) => {
    setRes(r => r ? { ...r, data: r.data.map(f => f.id === u.id ? u : f) } : r);
    load();
  };
  const onCheckpoints = (list: CheckpointView[]) => { setSummary(s => s ? { ...s, checkpoints: list } : s); load(); };

  const setF = (fn: () => void) => { fn(); setPage(1); };
  const years = [now.getFullYear() - 2, now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1];
  const mode = catalog?.gateMode;
  const auto = catalog?.rules.filter(r => r.automation === 'AUTO').length ?? 0;
  const semi = catalog?.rules.filter(r => r.automation === 'SEMI').length ?? 0;
  const lr = summary?.lastRun;

  return (
    <div className="space-y-5">
      {/* Période + lancement */}
      <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] p-4 flex flex-wrap items-end gap-3">
        <div>
          <label className={lbl}>Mois</label>
          <select value={month} onChange={e => setF(() => setMonth(Number(e.target.value)))} className={field}>
            {MONTHS_FR.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
          </select>
        </div>
        <div>
          <label className={lbl}>Année</label>
          <select value={year} onChange={e => setF(() => setYear(Number(e.target.value)))} className={field}>
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        {canRun && (
          <button type="button" onClick={run} disabled={running} className="flex items-center gap-2 px-4 py-2.5 text-sm font-bold rounded-xl bg-[var(--brand)] hover:bg-[var(--brand-strong)] text-white disabled:opacity-60">
            {running ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />} Lancer le contrôle
          </button>
        )}
        <button type="button" onClick={load} className="flex items-center gap-1.5 px-3 py-2.5 text-sm font-semibold rounded-xl bg-[var(--surface-2)] hover:bg-[var(--border)] text-[var(--text)]">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Actualiser
        </button>
        {mode && (
          <p className="ml-auto text-xs text-[var(--text-muted)] flex items-center gap-1.5 max-w-sm">
            {mode === 'enforce' ? <><Lock className="w-3.5 h-3.5 shrink-0" /> Barrière active : un écart bloquant empêche la validation de la paie.</>
              : <><Eye className="w-3.5 h-3.5 shrink-0" /> Mode observation : les écarts sont signalés et tracés, la validation n'est pas bloquée.</>}
          </p>
        )}
      </div>

      {runResult && (
        <div className="rounded-xl border border-emerald-300 dark:border-emerald-900/60 bg-emerald-50 dark:bg-emerald-950/30 p-3 text-sm text-[var(--text)]">
          <p className="font-bold text-emerald-700 dark:text-emerald-400">Contrôle terminé — {MONTHS_FR[runResult.month - 1]} {runResult.year}</p>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            {runResult.payrollsChecked} bulletin(s) contrôlé(s) dont {runResult.payrollsWithFindings} avec écart · {runResult.rulesRun} règle(s) · {runResult.findingsNew} nouveau(x)/rouvert(s) · {runResult.findingsResolved} résolu(s) ·
            {' '}{runResult.findingsOpen} ouvert(s) dont {runResult.openCritical} critique(s) et {runResult.openBlocking} bloquant(s) · {TRIGGER_LABEL[runResult.trigger]} · {fmtDateTime(runResult.startedAt)} → {fmtDateTime(runResult.finishedAt)}
            {' '}· réf. <span className="font-mono">{runResult.runId.slice(0, 8)}…</span>
          </p>
        </div>
      )}
      {error && <p className="text-sm text-red-600 dark:text-red-400 flex items-start gap-2"><ShieldAlert className="w-4 h-4 mt-0.5 shrink-0" /> {error}</p>}

      {!summary ? (
        <KonzaLoader variant="section" />
      ) : (
        <>
          {/* Synthèse */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Stat label="Conformité" value={summary.conformityRate === null ? '—' : `${summary.conformityRate} %`} tone={summary.conformityRate === 100 ? 'green' : undefined} />
            <Stat label="Bulletins contrôlés" value={summary.payrollsChecked} />
            <Stat label="Bulletins avec écart" value={summary.payrollsWithOpenFindings} tone={summary.payrollsWithOpenFindings > 0 ? 'red' : undefined} />
            <Stat label="Écarts bloquants" value={summary.open.blocking} tone={summary.open.blocking > 0 ? 'red' : 'green'} />
            <Stat label="Écarts ouverts" value={summary.open.total} />
            <Stat label="Critiques" value={summary.open.critical} tone={summary.open.critical > 0 ? 'red' : undefined} />
            <Stat label="Importants" value={summary.open.warn} />
            <Stat label="Informations" value={summary.open.info} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] p-4 space-y-2">
              <p className="text-sm font-black text-[var(--text)] flex items-center gap-2"><Gauge className="w-4 h-4 text-[var(--brand)]" /> Répartition</p>
              <div className="flex flex-wrap gap-2">
                {(['OPEN', 'JUSTIFIED', 'WAIVED', 'RESOLVED'] as FindingStatus[]).map(s => (
                  <span key={s} className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-[var(--surface-2)] text-[var(--text)]">{FINDING_STATUS_LABEL[s]} : <b>{summary.byStatus[s]}</b></span>
                ))}
              </div>
              {summary.byCategory.length > 0 ? (
                <div className="space-y-1.5 pt-1">
                  {summary.byCategory.map(c => (
                    <div key={c.category} className="flex items-center gap-2 text-xs">
                      <span className="w-24 text-[var(--text-muted)]">{CATEGORY_LABEL[c.category] ?? c.category}</span>
                      <div className="flex-1 h-2 rounded-full bg-[var(--surface-2)] overflow-hidden"><div className="h-full bg-[var(--brand)]" style={{ width: `${Math.min(100, (c.open / Math.max(1, summary.open.total)) * 100)}%` }} /></div>
                      <span className="w-6 text-right font-bold text-[var(--text)]">{c.open}</span>
                    </div>
                  ))}
                </div>
              ) : <p className="text-xs text-[var(--text-muted)] flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5" /> Aucun écart ouvert par catégorie.</p>}
            </div>

            <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] p-4 space-y-1.5">
              <p className="text-sm font-black text-[var(--text)] flex items-center gap-2"><ListChecks className="w-4 h-4 text-[var(--brand)]" /> Dernier contrôle</p>
              {lr ? (
                <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
                  {([
                    ['Période', `${MONTHS_FR[lr.month - 1]} ${lr.year}`], ['Déclencheur', TRIGGER_LABEL[lr.trigger] ?? lr.trigger],
                    ['Lancé par', lr.startedByName ?? 'Système'], ['Début', fmtDateTime(lr.startedAt)], ['Fin', fmtDateTime(lr.finishedAt)],
                    ['Bulletins contrôlés', lr.payrollsChecked], ['Bulletins avec écart', lr.payrollsWithFindings], ['Règles exécutées', lr.rulesRun], ['Nouveaux / rouverts', lr.findingsNew],
                    ['Résolus', lr.findingsResolved], ['Ouverts', lr.findingsOpen], ['Dont critiques', lr.openCritical], ['Dont bloquants', lr.openBlocking],
                    ['Référence', lr.id.slice(0, 8) + '…'],
                  ] as Array<[string, React.ReactNode]>).map(([k, v]) => (
                    <div key={k}><dt className="text-[var(--text-muted)]">{k}</dt><dd className="font-semibold text-[var(--text)]">{v}</dd></div>
                  ))}
                </dl>
              ) : <p className="text-xs text-[var(--text-muted)] flex items-center gap-1.5"><Info className="w-3.5 h-3.5" /> Aucun contrôle pour ce mois. {canRun ? 'Lancez-le ci-dessus.' : ''}</p>}
            </div>
          </div>

          <TrendSection companyId={companyId} open={summary.open} rulesByCode={rulesByCode} refreshKey={summary.lastRun?.id} />

          <CheckpointPanel checkpoints={summary.checkpoints} month={month} year={year} companyId={companyId}
            canAttest={canRun} onChanged={onCheckpoints} />

          {/* Écarts */}
          {!summary.detailVisible ? (
            <p className="text-xs text-[var(--text-muted)] flex items-center gap-2"><Lock className="w-3.5 h-3.5" /> Votre rôle (support plateforme) voit les compteurs, pas le détail nominatif des écarts.</p>
          ) : (
            <section className="space-y-3">
              <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] p-4 grid grid-cols-2 lg:grid-cols-4 gap-3 items-end">
                <div>
                  <label className={lbl}>Statut</label>
                  <select value={status} onChange={e => setF(() => setStatus(e.target.value as any))} className={`${field} w-full`}>
                    <option value="">Tous</option>
                    {(['OPEN', 'JUSTIFIED', 'WAIVED', 'RESOLVED'] as FindingStatus[]).map(s => <option key={s} value={s}>{FINDING_STATUS_LABEL[s]}</option>)}
                  </select>
                </div>
                <div>
                  <label className={lbl}>Gravité</label>
                  <select value={severity} onChange={e => setF(() => setSeverity(e.target.value as any))} className={`${field} w-full`}>
                    <option value="">Toutes</option><option value="CRITICAL">Critique</option><option value="WARN">Important</option><option value="INFO">Information</option>
                  </select>
                </div>
                <div>
                  <label className={lbl}>Règle</label>
                  <select value={ruleCode} onChange={e => setF(() => setRuleCode(e.target.value))} className={`${field} w-full`}>
                    <option value="">Toutes</option>
                    {(catalog?.rules ?? []).map(r => <option key={r.code} value={r.code}>{r.label}</option>)}
                  </select>
                </div>
                <label className="flex items-center gap-2 text-sm text-[var(--text)] pb-2">
                  <input type="checkbox" checked={blockingOnly} onChange={e => setF(() => setBlockingOnly(e.target.checked))} /> Bloquants seulement
                </label>
              </div>

              {loading && !res ? <KonzaLoader variant="section" />
                : res && res.data.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-[var(--border)] p-10 text-center text-sm text-[var(--text-muted)]">
                    <ShieldCheck className="w-8 h-8 mx-auto mb-3 opacity-50" /> Aucun écart pour ces filtres.
                  </div>
                ) : (
                  <div className={`space-y-2.5 ${loading ? 'opacity-60' : ''}`}>
                    <p className="text-xs text-[var(--text-muted)]">{res?.meta.total} écart{(res?.meta.total ?? 0) > 1 ? 's' : ''}</p>
                    {res?.data.map(f => <FindingCard key={f.id} finding={f} rule={rulesByCode[f.ruleCode]} role={role} onChanged={onFindingChanged} />)}
                  </div>
                )}

              {res && res.meta.totalPages > 1 && (
                <div className="flex items-center justify-between pt-1">
                  <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="flex items-center gap-1 px-3 py-2 text-sm font-semibold rounded-xl bg-[var(--surface)] border border-[var(--border)] disabled:opacity-40 text-[var(--text)]"><ChevronLeft className="w-4 h-4" /> Précédent</button>
                  <span className="text-xs text-[var(--text-muted)]">Page {res.meta.page} / {res.meta.totalPages} · {res.meta.limit} par page</span>
                  <button disabled={page >= res.meta.totalPages} onClick={() => setPage(p => p + 1)} className="flex items-center gap-1 px-3 py-2 text-sm font-semibold rounded-xl bg-[var(--surface)] border border-[var(--border)] disabled:opacity-40 text-[var(--text)]">Suivant <ChevronRight className="w-4 h-4" /></button>
                </div>
              )}
            </section>
          )}

          {/* Catalogue : transparence sur ce qui est automatique et ce qui reste humain */}
          {catalog && (
            <section className="bg-[var(--surface)] rounded-2xl border border-[var(--border)]">
              <button type="button" onClick={() => setShowCatalog(o => !o)} className="w-full flex items-center justify-between gap-3 p-4 text-left">
                <span className="text-sm font-black text-[var(--text)] flex items-center gap-2">
                  {showCatalog ? <ChevronDown className="w-4 h-4" /> : <ChevronR className="w-4 h-4" />} Ce que le logiciel contrôle
                </span>
                <span className="text-xs text-[var(--text-muted)]">{auto} automatique{auto > 1 ? 's' : ''} · {semi} avec décision humaine · {catalog.checkpoints.length} déclaration{catalog.checkpoints.length > 1 ? 's' : ''} à attester</span>
              </button>
              {showCatalog && (
                <div className="border-t border-[var(--border)] divide-y divide-[var(--border)]">
                  {catalog.rules.map(r => (
                    <div key={r.code} className="p-4 space-y-1">
                      <p className="text-sm font-bold text-[var(--text)] flex items-center gap-2 flex-wrap">
                        {r.automation === 'AUTO' ? <Bot className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />} {r.label}
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[var(--surface-2)] text-[var(--text-muted)]">{CATEGORY_LABEL[r.category]}</span>
                        <SeverityBadge severity={r.severity} />
                        {r.blocking && <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400">Bloquant</span>}
                      </p>
                      <p className="text-xs text-[var(--text)]">{r.description}</p>
                      <p className="text-[11px] text-[var(--text-muted)]">
                        {r.automation === 'AUTO' ? 'Automatique' : 'Détection automatique, décision humaine'}
                        {r.legalRef ? ` · ${r.legalRef}` : ''}{r.checklistRef ? ` · ${r.checklistRef}` : ''} · <span className="font-mono">{r.code}</span>
                      </p>
                    </div>
                  ))}
                  {catalog.checkpoints.map(c => (
                    <div key={c.code} className="p-4 space-y-1">
                      <p className="text-sm font-bold text-[var(--text)] flex items-center gap-2 flex-wrap"><User className="w-3.5 h-3.5" /> {c.label}
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[var(--surface-2)] text-[var(--text-muted)]">Attestation humaine</span></p>
                      <p className="text-[11px] text-[var(--text-muted)]">Preuve attendue : {c.evidenceHint} · {c.legalRef} · <span className="font-mono">{c.code}</span></p>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}
        </>
      )}
    </div>
  );
}