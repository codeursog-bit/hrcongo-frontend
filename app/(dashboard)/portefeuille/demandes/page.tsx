'use client';
import { PortfolioDialog } from '@/components/portfolio/PortfolioDialog';

// app/(dashboard)/portefeuille/demandes/page.tsx
// Centre des demandes de TOUTES les entreprises du portefeuille :
// congés, absences, prêts et avances dans un seul fil, avec approbation /
// refus directement depuis la liste.
//
// • « À traiter »  : demandes en attente — restent tant qu'elles ne sont pas traitées
// • « Traitées »   : décisions des dernières 24 h — disparaissent ensuite
//
// Les routes de décision sont exactement celles des pages /portefeuille/conges,
// /absences et /prets (voir components/portfolio/requests.ts).

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Calendar, FileText, HandCoins, CheckCircle2, XCircle, Loader2, AlertCircle,
  Building2, Clock, RefreshCw, Inbox,
} from 'lucide-react';
import { KonzaLoader } from '@/components/ui/KonzaLoader';
import { api } from '@/services/api';
import {
  PortfolioRequest, HandledRequest, RequestKind, REQUESTS_CHANGED_EVENT,
  fetchPortfolioRequests, splitByLifecycle, decideRequest, markHandled,
  timeAgo, disappearsIn,
} from '@/components/portfolio/requests';
import { PortfolioPageFrame as ModulePageFrame } from '@/components/portfolio/PortfolioPageFrame';

interface PortfolioCompany { id: string; name: string; }

type KindFilter = 'all' | 'leave' | 'absence' | 'loan';
type Tab = 'pending' | 'recent';

const KIND_META: Record<RequestKind, { label: string; icon: React.ReactNode; cls: string }> = {
  leave:   { label: 'Congé',   icon: <Calendar size={16} />,  cls: "bg-[var(--portfolio-warning-soft)] text-[var(--warning-text)]  " },
  absence: { label: 'Absence', icon: <FileText size={16} />,  cls: "bg-[var(--brand-soft)] text-[var(--action)]  " },
  loan:    { label: 'Prêt',    icon: <HandCoins size={16} />, cls: "bg-[var(--brand-soft)] text-[var(--action)]  " },
  advance: { label: 'Avance',  icon: <HandCoins size={16} />, cls: "bg-[var(--brand-soft)] text-[var(--action)]  " },
};

const STATUS_META: Record<string, { label: string; cls: string }> = {
  PENDING:    { label: 'En attente',    cls: "bg-[var(--portfolio-warning-soft)] text-[var(--warning-text)]  " },
  PENDING_DG: { label: 'En attente DG', cls: "bg-[var(--portfolio-warning-soft)] text-[var(--warning-text)]  " },
  APPROVED:   { label: 'Approuvé',      cls: "bg-[var(--portfolio-positive-soft)] text-[var(--success-text)]  " },
  ACTIVE:     { label: 'Approuvé',      cls: "bg-[var(--portfolio-positive-soft)] text-[var(--success-text)]  " },
  REJECTED:   { label: 'Refusé',        cls: "bg-[var(--portfolio-danger-soft)] text-[var(--danger-text)]  " },
  CANCELLED:  { label: 'Annulé',        cls: "bg-[var(--surface-2)] text-[var(--text-secondary)]  " },
};

const inputCls = 'w-full px-3 py-2.5 rounded-xl text-sm bg-[var(--surface-2)] border border-[var(--border)]';

const matchesKind = (r: PortfolioRequest, f: KindFilter) =>
  f === 'all' ? true : f === 'loan' ? r.kind === 'loan' || r.kind === 'advance' : r.kind === f;

// ─── Modal décision ──────────────────────────────────────────────────────────

function DecisionModal({ req, approve, onClose, onDone }: {
  req: PortfolioRequest; approve: boolean; onClose: () => void; onDone: () => void;
}) {
  const [reason, setReason] = useState('');
  const [isPaid, setIsPaid] = useState(req.isPaid ?? false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    setSaving(true);
    setError('');
    try {
      await decideRequest(req, approve, { reason, isPaid });
      onDone();
    } catch (e: any) {
      setError(e?.message || 'Erreur');
      setSaving(false);
    }
  };

  return (
    <PortfolioDialog onClose={() => !saving && onClose()}>

<div className="relative w-full max-w-sm rounded-2xl p-6 z-10" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
        <p className="text-sm font-semibold mb-1" style={{ color: 'var(--text)' }}>
          {approve ? 'Approuver' : 'Refuser'} cette demande ?
        </p>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          {req.employeeName} · {req.title}
        </p>
        <p className="text-xs mb-4 flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
          <Building2 size={12} /> {req.companyName} · {req.detail}
        </p>

        {approve && req.kind === 'absence' && (
          <label className="flex items-center gap-2 text-sm mb-4 cursor-pointer" style={{ color: 'var(--text)' }}>
            <input type="checkbox" checked={isPaid} onChange={e => setIsPaid(e.target.checked)} className="accent-emerald-500" />
            Absence payée
          </label>
        )}
        {!approve && (
          <textarea
            value={reason}
            onChange={e => setReason(e.target.value)}
            placeholder="Motif du refus (optionnel)"
            rows={2}
            className={`${inputCls} mb-4`}
            style={{ color: 'var(--text)' }}
          />
        )}
        {error && <div className="mb-3 text-xs text-[var(--danger-text)] flex items-center gap-1"><AlertCircle size={13} />{error}</div>}

        <div className="flex gap-2">
          <button
            onClick={submit}
            disabled={saving}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-[var(--on-brand)] transition-colors disabled:opacity-60 ${approve ? "bg-[var(--action)] hover:bg-[var(--action)]" : "bg-[var(--portfolio-danger-soft)] hover:bg-[var(--portfolio-danger-soft)]"}`}
          >
            {saving && <Loader2 size={14} className="animate-spin" />}
            Confirmer
          </button>
          <button
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2 rounded-xl text-sm font-medium hover:bg-[var(--surface-2)]"
            style={{ color: 'var(--text-muted)', border: '1px solid var(--border)' }}
          >
            Annuler
          </button>
        </div>
      </div>
</PortfolioDialog>
  );
}

// ─── Carte de demande ────────────────────────────────────────────────────────

function RequestCard({ req, onApprove, onReject }: {
  req: PortfolioRequest | HandledRequest;
  onApprove?: () => void;
  onReject?: () => void;
}) {
  const kind = KIND_META[req.kind];
  const status = STATUS_META[req.status] ?? STATUS_META.PENDING;
  const handled = 'handledAt' in req ? (req as HandledRequest) : null;
  const pending = !handled;

  return (
    <div
      className="rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center gap-4"
      style={{ background: 'var(--surface)', border: '1px solid var(--border)', ...(pending ? { borderLeft: "4px solid var(--danger)" } : {}) }}
    >
      <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${kind.cls}`}>{kind.icon}</div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-semibold truncate" style={{ color: 'var(--text)' }}>{req.employeeName}</p>
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-[var(--surface-2)]" style={{ color: 'var(--text-muted)' }}>{req.title}</span>
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md bg-[var(--brand-soft)] text-[var(--action)]  ">
            <Building2 size={11} /> {req.companyName}
          </span>
        </div>
        <p className="text-sm mt-0.5" style={{ color: 'var(--text)' }}>{req.detail}</p>
        {req.reason && <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--text-muted)' }}>{req.reason}</p>}
        <p className="text-[11px] mt-1.5 flex items-center gap-1.5" style={{ color: 'var(--text-muted)' }}>
          <Clock size={11} />
          {handled
            ? <>Traité {timeAgo(handled.handledAt)} · {disappearsIn(handled.handledAt)}</>
            : req.createdAt ? <>Reçue {timeAgo(req.createdAt)}</> : <>En attente de décision</>}
        </p>
      </div>

      {pending ? (
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onApprove}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold text-[var(--on-brand)] bg-[var(--action)] hover:bg-[var(--action)] transition-colors"
          >
            <CheckCircle2 size={15} /> Approuver
          </button>
          <button
            onClick={onReject}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold text-[var(--danger-text)] hover:bg-[var(--portfolio-danger-soft)]  transition-colors"
            style={{ border: '1px solid var(--border)' }}
          >
            <XCircle size={15} /> Refuser
          </button>
        </div>
      ) : (
        <span className={`inline-flex w-fit px-2.5 py-1 rounded-full text-[11px] font-semibold shrink-0 ${status.cls}`}>{status.label}</span>
      )}
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

function PortfolioRequestsPage() {
  const [items, setItems] = useState<PortfolioRequest[]>([]);
  const [failed, setFailed] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [companies, setCompanies] = useState<PortfolioCompany[]>([]);
  const [companyFilter, setCompanyFilter] = useState('');
  const [kindFilter, setKindFilter] = useState<KindFilter>('all');
  const [tab, setTab] = useState<Tab>('pending');
  const [decision, setDecision] = useState<{ req: PortfolioRequest; approve: boolean } | null>(null);

  useEffect(() => {
    api.get<PortfolioCompany[]>('/auth/my-companies').then(list => setCompanies(list ?? [])).catch(() => setCompanies([]));
  }, []);

  const load = useCallback(async (silent = false) => {
    if (silent) setRefreshing(true); else setLoading(true);
    try {
      const res = await fetchPortfolioRequests(companyFilter || undefined);
      setItems(res.items);
      setFailed(res.failed);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [companyFilter]);

  useEffect(() => { load(); }, [load]);

  // Rafraîchissement automatique : toutes les 60 s et au retour sur l'onglet
  useEffect(() => {
    const t = setInterval(() => { if (!document.hidden) load(true); }, 60000);
    const onFocus = () => load(true);
    window.addEventListener('focus', onFocus);
    return () => { clearInterval(t); window.removeEventListener('focus', onFocus); };
  }, [load]);

  const { pending, recent } = useMemo(() => splitByLifecycle(items), [items]);

  const pendingFiltered = pending.filter(r => matchesKind(r, kindFilter));
  const recentFiltered = recent.filter(r => matchesKind(r, kindFilter));
  const countOf = (f: KindFilter) => pending.filter(r => matchesKind(r, f)).length;

  const onDecided = () => {
    if (decision) markHandled(decision.req.key);
    setDecision(null);
    window.dispatchEvent(new Event(REQUESTS_CHANGED_EVENT)); // la pastille de la sidebar se met à jour tout de suite
    load(true);
  };

  if (loading && items.length === 0) return <KonzaLoader variant="page" />;

  const KIND_TABS: { id: KindFilter; label: string }[] = [
    { id: 'all', label: 'Toutes' },
    { id: 'leave', label: 'Congés' },
    { id: 'absence', label: 'Absences' },
    { id: 'loan', label: 'Prêts & avances' },
  ];

  const list = tab === 'pending' ? pendingFiltered : recentFiltered;

  return (
    <div className="space-y-6 min-h-screen pb-20">
      {decision && (
        <DecisionModal req={decision.req} approve={decision.approve} onClose={() => setDecision(null)} onDone={onDecided} />
      )}

      {/* ── En-tête ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-3" style={{ color: 'var(--text)' }}>
            Demandes
            {pending.length > 0 && (
              <span className="relative inline-flex">
                <span className="absolute inset-0 rounded-full bg-[var(--portfolio-danger-soft)] opacity-60  motion-reduce:animate-none" />
                <span className="relative inline-flex items-center rounded-full bg-[var(--portfolio-danger-soft)] text-[var(--danger-text)] text-xs font-semibold px-2.5 py-1">
                  {pending.length} à traiter
                </span>
              </span>
            )}
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            Congés, absences, prêts et avances de toutes vos entreprises — à valider ici, sans changer d&apos;entreprise.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={companyFilter}
            onChange={e => setCompanyFilter(e.target.value)}
            className="px-3 py-2.5 rounded-xl text-sm bg-[var(--surface)] border border-[var(--border)]"
            style={{ color: 'var(--text)' }}
          >
            <option value="">Toutes les entreprises</option>
            {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <button
            onClick={() => load(true)}
            disabled={refreshing}
            title="Actualiser"
            className="p-2.5 rounded-xl hover:bg-[var(--surface-2)] disabled:opacity-60"
            style={{ border: '1px solid var(--border)', color: 'var(--text-muted)' }}
          >
            <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {failed > 0 && (
        <div className="px-4 py-3 rounded-xl text-sm flex items-center gap-2 bg-[var(--portfolio-warning-soft)]  text-[var(--warning-text)]  border border-[var(--border)] ">
          <AlertCircle size={15} />
          {failed === 1 ? 'Une liste' : `${failed} listes`} n&apos;a pas pu être chargée{failed > 1 ? 's' : ''} — certaines demandes peuvent manquer. Actualisez pour réessayer.
        </div>
      )}

      {/* ── Onglets + filtres de type ── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="inline-flex p-1 rounded-xl self-start" style={{ background: 'var(--surface-2)' }}>
          <button
            onClick={() => setTab('pending')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 ${tab === 'pending' ? 'bg-[var(--surface)] shadow-sm' : ''}`}
            style={{ color: tab === 'pending' ? 'var(--text)' : 'var(--text-muted)' }}
          >
            À traiter
            {pending.length > 0 && <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-[var(--portfolio-danger-soft)] text-[var(--danger-text)] text-[11px] font-semibold flex items-center justify-center">{pending.length}</span>}
          </button>
          <button
            onClick={() => setTab('recent')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 ${tab === 'recent' ? 'bg-[var(--surface)] shadow-sm' : ''}`}
            style={{ color: tab === 'recent' ? 'var(--text)' : 'var(--text-muted)' }}
          >
            Traitées · 24 h
            {recent.length > 0 && <span className="min-w-[20px] h-5 px-1.5 rounded-full text-[11px] font-semibold flex items-center justify-center" style={{ background: 'var(--border)', color: 'var(--text)' }}>{recent.length}</span>}
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          {KIND_TABS.map(k => {
            const active = kindFilter === k.id;
            const n = countOf(k.id);
            return (
              <button
                key={k.id}
                onClick={() => setKindFilter(k.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${active ? "bg-[var(--action)] text-[var(--on-brand)]" : 'hover:bg-[var(--surface-2)]'}`}
                style={active ? undefined : { color: 'var(--text-muted)', border: '1px solid var(--border)' }}
              >
                {k.label}{n > 0 ? ` · ${n}` : ''}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Liste ── */}
      {list.length === 0 ? (
        <div className="rounded-2xl p-10 text-center" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          {tab === 'pending'
            ? <CheckCircle2 size={32} className="mx-auto mb-3 text-[var(--action)] opacity-70" />
            : <Inbox size={32} className="mx-auto mb-3 opacity-40" style={{ color: 'var(--text-muted)' }} />}
          <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
            {tab === 'pending' ? 'Tout est à jour' : 'Aucune décision dans les dernières 24 h'}
          </p>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            {tab === 'pending'
              ? 'Aucune demande en attente dans vos entreprises.'
              : 'Les demandes traitées apparaissent ici pendant 24 h, puis disparaissent.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {tab === 'pending'
            ? pendingFiltered.map(r => (
                <RequestCard
                  key={r.key}
                  req={r}
                  onApprove={() => setDecision({ req: r, approve: true })}
                  onReject={() => setDecision({ req: r, approve: false })}
                />
              ))
            : recentFiltered.map(r => <RequestCard key={r.key} req={r} />)}
        </div>
      )}
    </div>
  );
}


export default function PortfolioRequestsPageWithFrame() {
  return (
    <ModulePageFrame kind="list">
      <PortfolioRequestsPage />
    </ModulePageFrame>
  );
}
