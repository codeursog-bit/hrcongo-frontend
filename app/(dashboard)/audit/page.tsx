'use client';

// ============================================================================
// 📁 app/(dashboard)/audit/page.tsx
// Journal d'audit de l'entreprise (ADMIN, HR_MANAGER, cabinet, super admin).
// Sous-navigation INTERNE (Journal / Intégrité) — aucune barre de nav en plus.
// Tout ce que renvoie GET /audit-trail/events et /audit-trail/verify est affiché.
// ============================================================================
import React, { useCallback, useEffect, useState } from 'react';
import {
  ShieldCheck, ShieldAlert, ShieldX, Loader2, ChevronLeft, ChevronRight, X, RefreshCw,
  ScrollText, Fingerprint, Copy, Check, Lock, ClipboardCheck,
} from 'lucide-react';
import {
  auditTrailService, type AuditEvent, type AuditListResponse, type AuditSeverity, type ChainVerification,
} from '@/services/audit-trail';
import { authService } from '@/lib/services/authService';
import { useBasePath } from '@/hooks/useBasePath';
import AuditEventCard from '@/components/audit/AuditEventCard';
import PayrollControlsTab from '@/components/audit/PayrollControlsTab';
import ActivityPanel from '@/components/audit/charts/ActivityPanel';
import { ACTION_LABEL, ENTITY_LABEL, VERIFY_REASON_LABEL } from '@/lib/audit-labels';

const VIEW_ROLES = ['ADMIN', 'HR_MANAGER', 'CABINET_ADMIN', 'SUPER_ADMIN'];
const VERIFY_ROLES = ['ADMIN', 'SUPER_ADMIN'];

interface Filters {
  severity: '' | AuditSeverity;
  entity: string;
  action: string;
  from: string;
  to: string;
  actor?: { id: string; label: string };
  object?: { entity: string; id: string; label: string };
}
const EMPTY: Filters = { severity: '', entity: '', action: '', from: '', to: '' };

const field = 'px-3 py-2 text-sm rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--brand)]';
const lbl = 'block text-xs font-semibold text-[var(--text-muted)] mb-1';

export default function AuditPage() {
  const { companyId, isPme } = useBasePath();
  const [role, setRole] = useState<string | null | undefined>(undefined);
  const [tab, setTab] = useState<'journal' | 'controles' | 'integrite'>('journal');
  const [initPeriod, setInitPeriod] = useState<{ month?: number; year?: number }>({});
  const [filters, setFilters] = useState<Filters>(EMPTY);
  const [page, setPage] = useState(1);
  const [res, setRes] = useState<AuditListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { setRole(authService.getCurrentUser()?.role ?? null); }, []);
  // Arrivée depuis la page Paie ou la fenêtre de refus : ?tab=controles&month=7&year=2026
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const t = q.get('tab');
    if (t === 'controles' || t === 'integrite') setTab(t);
    const m = Number(q.get('month')), y = Number(q.get('year'));
    if (m >= 1 && m <= 12 && y >= 2020) setInitPeriod({ month: m, year: y });
  }, []);
  const scopedCompany = isPme ? companyId : undefined;

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const r = await auditTrailService.events({
        companyId: scopedCompany,
        severity: filters.severity || undefined,
        entity: filters.object?.entity ?? (filters.entity || undefined),
        entityId: filters.object?.id,
        action: filters.action || undefined,
        actorId: filters.actor?.id,
        from: filters.from ? `${filters.from}T00:00:00.000Z` : undefined,
        to: filters.to ? `${filters.to}T23:59:59.999Z` : undefined,
        page, limit: 25,
      });
      setRes(r);
    } catch (e: any) {
      setError(e?.message || 'Impossible de charger le journal');
      setRes(null);
    } finally { setLoading(false); }
  }, [filters, page, scopedCompany]);

  useEffect(() => { if (role && VIEW_ROLES.includes(role) && tab === 'journal') load(); }, [load, role, tab]);

  const setF = (patch: Partial<Filters>) => { setFilters(f => ({ ...f, ...patch })); setPage(1); };

  if (role === undefined) return <div className="flex justify-center py-24"><Loader2 className="w-6 h-6 text-[var(--brand)] animate-spin" /></div>;
  if (!role || !VIEW_ROLES.includes(role)) {
    return (
      <div className="max-w-xl mx-auto py-24 text-center">
        <Lock className="w-8 h-8 mx-auto mb-3 text-[var(--text-muted)]" />
        <p className="text-sm font-semibold text-[var(--text)]">Accès réservé</p>
        <p className="text-xs text-[var(--text-muted)] mt-1">Le journal d'audit est réservé aux administrateurs et aux responsables RH.</p>
      </div>
    );
  }

  const active = filters.severity || filters.entity || filters.action || filters.from || filters.to || filters.actor || filters.object;

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-5">
      <div>
        <h1 className="text-xl font-black text-[var(--text)] flex items-center gap-2"><ScrollText className="w-5 h-5 text-[var(--brand)]" /> Journal d'audit</h1>
        <p className="text-xs text-[var(--text-muted)] mt-1">
          Trace inaltérable des actions sensibles (qui, quoi, quand, valeurs modifiées) et contrôles de conformité de la paie.
        </p>
      </div>

      <div className="flex gap-1 p-1 rounded-xl bg-[var(--surface-2)] w-fit">
        {([['journal', 'Journal', ScrollText], ['controles', 'Contrôles de paie', ClipboardCheck], ['integrite', 'Intégrité', Fingerprint]] as const).map(([k, text, Icon]) => (
          <button key={k} type="button" onClick={() => setTab(k)}
            className={`flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${tab === k ? 'bg-[var(--surface)] text-[var(--text)] shadow-sm' : 'text-[var(--text-muted)] hover:text-[var(--text)]'}`}>
            <Icon className="w-4 h-4" /> {text}
          </button>
        ))}
      </div>

      {tab === 'controles' ? (
        <PayrollControlsTab role={role} companyId={scopedCompany} initialMonth={initPeriod.month} initialYear={initPeriod.year} />
      ) : tab === 'journal' ? (
        <>
          <ActivityPanel companyId={scopedCompany} />

          <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] p-4 space-y-3">
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
              <div>
                <label className={lbl}>Gravité</label>
                <select value={filters.severity} onChange={e => setF({ severity: e.target.value as Filters['severity'] })} className={`${field} w-full`}>
                  <option value="">Toutes</option><option value="INFO">Information</option><option value="WARN">Important</option><option value="CRITICAL">Critique</option>
                </select>
              </div>
              <div>
                <label className={lbl}>Type d'objet</label>
                <select value={filters.entity} disabled={!!filters.object} onChange={e => setF({ entity: e.target.value })} className={`${field} w-full`}>
                  <option value="">Tous</option>
                  {Object.entries(ENTITY_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div>
                <label className={lbl}>Action</label>
                <select value={filters.action} onChange={e => setF({ action: e.target.value })} className={`${field} w-full`}>
                  <option value="">Toutes</option>
                  {Object.entries(ACTION_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div>
                <label className={lbl}>Du</label>
                <input type="date" value={filters.from} onChange={e => setF({ from: e.target.value })} className={`${field} w-full`} />
              </div>
              <div>
                <label className={lbl}>Au</label>
                <input type="date" value={filters.to} onChange={e => setF({ to: e.target.value })} className={`${field} w-full`} />
              </div>
            </div>

            {(filters.actor || filters.object) && (
              <div className="flex flex-wrap gap-2">
                {filters.actor && (
                  <span className="inline-flex items-center gap-1.5 pl-3 pr-1.5 py-1 rounded-full text-xs font-semibold bg-[var(--brand-soft)] text-[var(--brand)]">
                    Acteur : {filters.actor.label}
                    <button onClick={() => setF({ actor: undefined })} className="p-0.5 rounded-full hover:bg-black/10"><X className="w-3 h-3" /></button>
                  </span>
                )}
                {filters.object && (
                  <span className="inline-flex items-center gap-1.5 pl-3 pr-1.5 py-1 rounded-full text-xs font-semibold bg-[var(--brand-soft)] text-[var(--brand)]">
                    Objet : {filters.object.label}
                    <button onClick={() => setF({ object: undefined })} className="p-0.5 rounded-full hover:bg-black/10"><X className="w-3 h-3" /></button>
                  </span>
                )}
              </div>
            )}

            <div className="flex items-center justify-between gap-3 flex-wrap">
              <p className="text-xs text-[var(--text-muted)]">
                {res ? `${res.meta.total} événement${res.meta.total > 1 ? 's' : ''}` : '—'}
                {active ? ' correspondant aux filtres' : ''}
              </p>
              <div className="flex gap-2">
                {active && <button onClick={() => { setFilters(EMPTY); setPage(1); }} className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-[var(--surface-2)] hover:bg-[var(--border)] text-[var(--text)]">Réinitialiser les filtres</button>}
                <button onClick={load} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-[var(--surface-2)] hover:bg-[var(--border)] text-[var(--text)]">
                  <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} /> Actualiser
                </button>
              </div>
            </div>
          </div>

          {error && <p className="text-sm text-red-600 dark:text-red-400 flex items-start gap-2"><ShieldAlert className="w-4 h-4 mt-0.5 shrink-0" /> {error}</p>}

          {loading && !res ? (
            <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 text-[var(--brand)] animate-spin" /></div>
          ) : res && res.data.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[var(--border)] p-12 text-center text-sm text-[var(--text-muted)]">
              <ShieldCheck className="w-8 h-8 mx-auto mb-3 opacity-50" />
              Aucun événement{active ? ' pour ces filtres' : ' enregistré pour le moment'}.
            </div>
          ) : (
            <div className={`space-y-2.5 ${loading ? 'opacity-60' : ''}`}>
              {res?.data.map((ev: AuditEvent) => (
                <AuditEventCard key={ev.id} event={ev} viewerRole={role}
                  onFilterActor={(id, label) => setF({ actor: { id, label } })}
                  onShowHistory={(entity, id, label) => setF({ object: { entity, id, label } })} />
              ))}
            </div>
          )}

          {res && res.meta.totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}
                className="flex items-center gap-1 px-3 py-2 text-sm font-semibold rounded-xl bg-[var(--surface)] border border-[var(--border)] disabled:opacity-40 text-[var(--text)]">
                <ChevronLeft className="w-4 h-4" /> Précédent
              </button>
              <span className="text-xs text-[var(--text-muted)]">Page {res.meta.page} / {res.meta.totalPages} · {res.meta.limit} par page</span>
              <button disabled={page >= res.meta.totalPages} onClick={() => setPage(p => p + 1)}
                className="flex items-center gap-1 px-3 py-2 text-sm font-semibold rounded-xl bg-[var(--surface)] border border-[var(--border)] disabled:opacity-40 text-[var(--text)]">
                Suivant <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </>
      ) : (
        <IntegrityTab canVerify={VERIFY_ROLES.includes(role)} companyId={scopedCompany} />
      )}
    </div>
  );
}

function IntegrityTab({ canVerify, companyId }: { canVerify: boolean; companyId?: string }) {
  const [result, setResult] = useState<ChainVerification | null>(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function run() {
    setRunning(true); setError(null);
    try { setResult(await auditTrailService.verify(companyId)); }
    catch (e: any) { setResult(null); setError(e?.status === 429 ? 'Trop de vérifications : réessayez dans une minute.' : (e?.message || 'Vérification impossible')); }
    finally { setRunning(false); }
  }

  const copy = async () => {
    if (!result?.headHash) return;
    try { await navigator.clipboard.writeText(result.headHash); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch { /* presse-papiers indisponible */ }
  };

  return (
    <div className="space-y-4">
      <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] p-5 space-y-3">
        <p className="text-sm text-[var(--text)]">
          Chaque événement contient l'empreinte du précédent. La vérification recalcule toute la chaîne : si un événement a été modifié ou supprimé, elle le détecte et indique où.
        </p>
        {canVerify ? (
          <button onClick={run} disabled={running}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-bold rounded-xl bg-[var(--brand)] hover:bg-[var(--brand-strong)] text-white disabled:opacity-60">
            {running ? <Loader2 className="w-4 h-4 animate-spin" /> : <Fingerprint className="w-4 h-4" />} Vérifier l'intégrité du journal
          </button>
        ) : (
          <p className="text-xs text-[var(--text-muted)] flex items-center gap-2"><Lock className="w-3.5 h-3.5" /> La vérification est réservée aux administrateurs.</p>
        )}
        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
      </div>

      {result && (
        <div className={`rounded-2xl border p-5 space-y-3 ${result.ok
          ? 'border-emerald-300 bg-emerald-50 dark:border-emerald-900/60 dark:bg-emerald-950/30'
          : 'border-red-300 bg-red-50 dark:border-red-900/60 dark:bg-red-950/30'}`}>
          <p className={`flex items-center gap-2 font-black ${result.ok ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-700 dark:text-red-400'}`}>
            {result.ok ? <ShieldCheck className="w-5 h-5" /> : <ShieldX className="w-5 h-5" />}
            {result.ok ? 'Journal intact' : 'Anomalie détectée'}
          </p>
          <dl className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
            <div><dt className="text-[11px] uppercase tracking-wider text-[var(--text-muted)]">Événements vérifiés</dt><dd className="font-bold text-[var(--text)]">{result.checked}</dd></div>
            {result.truncated && <div className="sm:col-span-2"><dt className="text-[11px] uppercase tracking-wider text-[var(--text-muted)]">Portée</dt><dd className="text-[var(--text)]">Vérification partielle : limite de {result.checked} événements atteinte.</dd></div>}
            {!result.ok && result.brokenAtSeq && <div><dt className="text-[11px] uppercase tracking-wider text-[var(--text-muted)]">Rupture à l'événement</dt><dd className="font-bold font-mono text-red-700 dark:text-red-400">#{result.brokenAtSeq}</dd></div>}
            {!result.ok && result.reason && <div className="sm:col-span-3"><dt className="text-[11px] uppercase tracking-wider text-[var(--text-muted)]">Nature</dt><dd className="text-[var(--text)]">{VERIFY_REASON_LABEL[result.reason] ?? result.reason} <span className="font-mono text-xs text-[var(--text-muted)]">({result.reason})</span></dd></div>}
          </dl>
          {result.headHash && (
            <div>
              <p className="text-[11px] uppercase tracking-wider text-[var(--text-muted)] mb-1">Empreinte du dernier événement vérifié</p>
              <div className="flex items-center gap-2">
                <code className="text-xs font-mono text-[var(--text)] break-all flex-1">{result.headHash}</code>
                <button onClick={copy} className="p-2 rounded-lg bg-[var(--surface)] border border-[var(--border)] hover:bg-[var(--surface-2)] text-[var(--text)] shrink-0" title="Copier">
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
              <p className="text-[11px] text-[var(--text-muted)] mt-1.5">Conservez-la hors de la plateforme (archive, email) : c'est une preuve datée de l'état du journal.</p>
            </div>
          )}
          {!result.ok && <p className="text-xs text-red-700 dark:text-red-400">Contactez le support sans modifier de données : cette alerte peut indiquer une altération volontaire.</p>}
        </div>
      )}
    </div>
  );
}