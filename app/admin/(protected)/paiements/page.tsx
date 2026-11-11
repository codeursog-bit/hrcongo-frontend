// ============================================================================
// 💳 PAGE SUPER ADMIN — Paiements & abonnements
// Fichier: frontend/app/admin/(protected)/paiements/page.tsx
// Vue d'ensemble (MRR, revenus, « à traiter ») · Liste des paiements · Fiche + actions
// Les actions exigent un motif et sont tracées dans le journal d'audit.
// ============================================================================

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  CreditCard, Search, Loader2, AlertTriangle, CheckCircle2, X, ChevronLeft, ChevronRight, RefreshCw,
  TrendingUp, TrendingDown, Minus, Clock, Ban, Undo2, BadgeCheck, ExternalLink, Layers, Receipt,
} from 'lucide-react';
import { adminService } from '@/lib/services/adminService';

const errMsg = (e: any) => e?.message || 'Une erreur est survenue';
const fmt = (n?: number | null) => `${Math.round(n ?? 0).toLocaleString('fr-FR')} F`;
const fmtDT = (d?: string | null) => (d ? new Date(d).toLocaleString('fr-FR') : '—');
const fmtD = (d?: string | null) => (d ? new Date(d).toLocaleDateString('fr-FR') : '—');

const STATUS_LABEL: Record<string, string> = {
  PENDING: 'En attente', PROCESSING: 'En cours', SUCCEEDED: 'Réussi', FAILED: 'Échoué', REFUNDED: 'Remboursé',
};
const STATUS_CLS: Record<string, string> = {
  PENDING: 'bg-gray-700/40 text-gray-300', PROCESSING: 'bg-blue-500/15 text-blue-300',
  SUCCEEDED: 'bg-emerald-500/15 text-emerald-300', FAILED: 'bg-red-500/15 text-red-300',
  REFUNDED: 'bg-purple-500/15 text-purple-300',
};
const PROVIDER_LABEL: Record<string, string> = { YABETOOPAY: 'YabetooPay', MOTEKI: 'Moteki', CHARIOW: 'Chariow', MANUAL: 'Manuel' };
const SUB_STATUS_LABEL: Record<string, string> = { ACTIVE: 'Actif', PAST_DUE: 'Impayé', CANCELED: 'Annulé', TRIALING: 'Essai', PAUSED: 'Suspendu' };
const PERIOD_LABEL: Record<string, string> = { monthly: 'mensuel', yearly: 'annuel' };

const card = 'bg-gray-900 border border-gray-800 rounded-2xl p-4';
const inputCls = 'w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-gray-600';
const btnGhost = 'flex items-center gap-1.5 px-2.5 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-xs transition-colors disabled:opacity-50';
const btnDanger = 'flex items-center gap-1.5 px-2.5 py-1.5 bg-red-600/15 hover:bg-red-600/30 text-red-300 rounded-lg text-xs transition-colors disabled:opacity-50';

function Msg({ m }: { m: { ok: boolean; text: string } | null }) {
  if (!m) return null;
  return (
    <div className={`flex items-center gap-2 text-sm rounded-xl px-4 py-2 border ${
      m.ok ? 'text-emerald-300 border-emerald-500/25 bg-emerald-500/10' : 'text-red-300 border-red-500/25 bg-red-500/10'}`}>
      {m.ok ? <CheckCircle2 size={14} /> : <AlertTriangle size={14} />} {m.text}
    </div>
  );
}
function Variation({ v }: { v?: number | null }) {
  if (v == null) return <span className="text-gray-600">—</span>;
  const Icon = v === 0 ? Minus : v > 0 ? TrendingUp : TrendingDown;
  return <span className={`inline-flex items-center gap-1 text-xs ${v === 0 ? 'text-gray-400' : v > 0 ? 'text-emerald-300' : 'text-red-300'}`}><Icon size={12} /> {v > 0 ? '+' : ''}{v} %</span>;
}
function Stat({ label, value, sub }: { label: string; value: React.ReactNode; sub?: React.ReactNode }) {
  return <div className={card}><div className="text-xs text-gray-500">{label}</div><div className="text-2xl font-semibold text-white mt-1">{value}</div>{sub && <div className="text-xs text-gray-500 mt-1">{sub}</div>}</div>;
}
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <div className="space-y-2"><h3 className="text-xs uppercase tracking-wide text-gray-500">{title}</h3>{children}</div>;
}

// ── Modale de confirmation (motif obligatoire) ───────────────────────────────
type Confirm = { title: string; description: React.ReactNode; danger?: boolean; confirmLabel: string; run: (reason: string) => Promise<void> };

function ConfirmModal({ c, onClose }: { c: Confirm; onClose: () => void }) {
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const go = async () => {
    setBusy(true); setErr(null);
    try { await c.run(reason.trim()); onClose(); } catch (e) { setErr(errMsg(e)); setBusy(false); }
  };
  return (
    <div className="fixed inset-0 z-[60] bg-black/70 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-gray-900 border border-gray-800 rounded-2xl p-5 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <h3 className={`font-semibold ${c.danger ? 'text-red-300' : 'text-white'}`}>{c.title}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-white"><X size={16} /></button>
        </div>
        <div className="text-sm text-gray-400 space-y-1">{c.description}</div>
        <label className="text-xs text-gray-400 space-y-1 block">
          Motif (obligatoire — enregistré dans le journal d'audit)
          <textarea className={`${inputCls} min-h-[70px]`} maxLength={300} value={reason} onChange={e => setReason(e.target.value)}
            placeholder="Ex. : reçu Mobile Money vérifié, webhook non reçu" />
        </label>
        {err && <Msg m={{ ok: false, text: err }} />}
        <div className="flex justify-end gap-2">
          <button className={btnGhost} onClick={onClose} disabled={busy}>Annuler</button>
          <button disabled={reason.trim().length < 5 || busy} onClick={go}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm text-white disabled:opacity-50 ${c.danger ? 'bg-red-600 hover:bg-red-500' : 'bg-blue-600 hover:bg-blue-500'}`}>
            {busy && <Loader2 size={14} className="animate-spin" />} {c.confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Fiche paiement ───────────────────────────────────────────────────────────
function PaymentDrawer({ id, onClose, onChanged, ask, notify }: {
  id: string; onClose: () => void; onChanged: () => void; ask: (c: Confirm) => void; notify: (m: { ok: boolean; text: string }) => void;
}) {
  const router = useRouter();
  const [p, setP] = useState<any>(null);
  const load = useCallback(async () => {
    try { setP(await adminService.get<any>(`/admin/payments/${id}`)); } catch (e) { notify({ ok: false, text: errMsg(e) }); onClose(); }
  }, [id, notify, onClose]);
  useEffect(() => { load(); }, [load]);

  const act = (path: string, ok: string) => async (reason: string) => {
    const r = await adminService.post<any>(`/admin/payments/${id}/${path}`, { reason });
    notify({ ok: true, text: path === 'recheck' ? `${ok} — statut prestataire : ${r.status}${r.activated ? ' · abonnement activé' : ''}` : ok });
    load(); onChanged();
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60">
      <div className="absolute inset-0" onClick={onClose} />
      <aside className="relative w-full max-w-xl h-full overflow-y-auto bg-gray-900 border-l border-gray-800 p-5 space-y-5">
        <button onClick={onClose} className="absolute right-4 top-4 text-gray-500 hover:text-white"><X size={18} /></button>
        {!p ? <p className="text-sm text-gray-500 flex items-center gap-2"><Loader2 size={14} className="animate-spin" /> Chargement…</p> : (
          <>
            <div>
              <h2 className="text-lg font-semibold text-white">{fmt(p.amount)} <span className="text-sm text-gray-500">· {PROVIDER_LABEL[p.provider]}</span></h2>
              <p className="text-sm text-gray-500">{p.company.name}</p>
              <span className={`inline-block mt-2 px-2 py-0.5 rounded-full text-xs ${STATUS_CLS[p.status]}`}>{STATUS_LABEL[p.status]}</span>
            </div>

            {(p.allowed.recheck || p.allowed.validate || p.allowed.fail || p.allowed.refund) && (
              <Section title="Actions">
                <div className="flex flex-wrap gap-2">
                  {p.allowed.recheck && <button className={btnGhost} onClick={() => ask({
                    title: 'Revérifier chez le prestataire', confirmLabel: 'Revérifier',
                    description: <p>Interroge {PROVIDER_LABEL[p.provider]} : si l'argent est bien reçu, l'abonnement est activé automatiquement.</p>,
                    run: act('recheck', 'Paiement revérifié'),
                  })}><RefreshCw size={12} /> Revérifier</button>}
                  {p.allowed.validate && <button className={btnGhost} onClick={() => ask({
                    title: 'Valider manuellement', danger: true, confirmLabel: 'Valider et activer',
                    description: <><p>À faire <b className="text-gray-200">seulement si l'argent est bien reçu</b>. Le paiement passe en « Réussi », {p.coveredCompanies.length > 1 ? `les ${p.coveredCompanies.length} entreprises couvertes sont activées` : "l'abonnement est activé"}, la facture est émise.</p></>,
                    run: act('validate', 'Paiement validé, abonnement activé'),
                  })}><BadgeCheck size={12} /> Valider à la main</button>}
                  {p.allowed.fail && <button className={btnDanger} onClick={() => ask({
                    title: 'Marquer comme échoué', danger: true, confirmLabel: 'Marquer échoué',
                    description: <p>Le paiement ne sera plus considéré en attente.</p>, run: act('fail', 'Paiement marqué échoué'),
                  })}><Ban size={12} /> Marquer échoué</button>}
                  {p.allowed.refund && <button className={btnDanger} onClick={() => ask({
                    title: 'Marquer comme remboursé', danger: true, confirmLabel: 'Marquer remboursé',
                    description: <p>Écriture comptable uniquement : l'argent se rend hors plateforme et <b className="text-gray-200">l'accès du client n'est pas modifié</b> (utilisez « Suspendre » sur l'abonnement si besoin).</p>,
                    run: act('refund', 'Paiement marqué remboursé'),
                  })}><Undo2 size={12} /> Marquer remboursé</button>}
                </div>
              </Section>
            )}

            <Section title="Détails">
              <dl className="grid grid-cols-2 gap-y-1.5 text-xs">
                <dt className="text-gray-500">Plan</dt><dd className="text-gray-300">{p.plan ?? '—'}{p.billingPeriod ? ` · ${PERIOD_LABEL[p.billingPeriod] ?? p.billingPeriod}` : ''}{p.months ? ` · ${p.months} mois` : ''}</dd>
                <dt className="text-gray-500">Moyen</dt><dd className="text-gray-300">{p.method ?? '—'}</dd>
                <dt className="text-gray-500">Créé le</dt><dd className="text-gray-300">{fmtDT(p.dates.createdAt)}</dd>
                <dt className="text-gray-500">Payé le</dt><dd className="text-gray-300">{fmtDT(p.dates.paidAt)}</dd>
                {p.dates.failedAt && <><dt className="text-gray-500">Échoué le</dt><dd className="text-gray-300">{fmtDT(p.dates.failedAt)}</dd></>}
                {p.dates.refundedAt && <><dt className="text-gray-500">Remboursé le</dt><dd className="text-gray-300">{fmtDT(p.dates.refundedAt)}</dd></>}
                {p.discountCode && <><dt className="text-gray-500">Code promo</dt><dd className="text-gray-300">{p.discountCode} (−{fmt(p.discountAmount)})</dd></>}
                {p.quote && <><dt className="text-gray-500">Devis</dt><dd className="text-gray-300">{fmt(p.quote.amount)} · {p.quote.months} mois{p.quote.coversPortfolio ? ' · portefeuille' : ''}</dd></>}
                {p.invoice && <><dt className="text-gray-500">Facture</dt><dd className="text-gray-300">{p.invoice.number}</dd></>}
              </dl>
              {p.description && <p className="text-xs text-gray-500">{p.description}</p>}
              {p.manualValidation && <p className="text-xs text-amber-300">Validé manuellement par {p.manualValidation.by} — {p.manualValidation.reason}</p>}
              {p.refund && <p className="text-xs text-purple-300">Remboursement noté par {p.refund.by} — {p.refund.reason}</p>}
            </Section>

            {p.coveredCompanies.length > 0 && (
              <Section title={`Entreprises couvertes (${p.coveredCompanies.length})`}>
                <div className="space-y-1.5">
                  {p.coveredCompanies.map((c: any) => (
                    <div key={c.id} className="flex items-center justify-between text-sm bg-gray-950 border border-gray-800 rounded-lg px-3 py-2">
                      <span className="text-white flex items-center gap-2"><Layers size={13} /> {c.name}</span>
                      <span className={`text-xs ${c.activated ? 'text-emerald-300' : 'text-amber-300'}`}>{c.activated ? 'activée' : 'non activée'}</span>
                    </div>
                  ))}
                </div>
              </Section>
            )}

            <Section title="Références prestataire">
              <dl className="grid grid-cols-2 gap-y-1.5 text-xs break-all">
                {Object.entries(p.references).filter(([, v]) => v).map(([k, v]: any) => (<React.Fragment key={k}><dt className="text-gray-500">{k}</dt><dd className="text-gray-300">{v}</dd></React.Fragment>))}
                {Object.values(p.references).every(v => !v) && <dd className="text-gray-500 col-span-2">Aucune référence</dd>}
              </dl>
              {p.methodDetails && <pre className="text-[11px] text-gray-500 bg-gray-950 border border-gray-800 rounded-lg p-2 overflow-x-auto">{JSON.stringify(p.methodDetails, null, 2)}</pre>}
            </Section>

            {p.subscription && (
              <Section title="Abonnement">
                <p className="text-xs text-gray-400">{p.subscription.plan} · {SUB_STATUS_LABEL[p.subscription.status] ?? p.subscription.status} · fin {fmtD(p.subscription.currentPeriodEnd)}</p>
                <div className="flex gap-2">
                  <button className={btnGhost} onClick={() => router.push(`/admin/companies/${p.company.id}/gestion`)}><ExternalLink size={12} /> Gestion de l'entreprise</button>
                  <button className={btnGhost} onClick={() => router.push('/admin/subscriptions')}><Receipt size={12} /> Actions sur l'abonnement</button>
                </div>
              </Section>
            )}

            {p.history.length > 0 && (
              <Section title="Actions super admin sur ce paiement">
                {p.history.map((h: any) => <div key={h.id} className="text-xs"><p className="text-gray-300">{h.summary}</p><p className="text-gray-600">{fmtDT(h.occurredAt)}</p></div>)}
              </Section>
            )}
          </>
        )}
      </aside>
    </div>
  );
}

// ── Vue d'ensemble ───────────────────────────────────────────────────────────
function OverviewTab({ onOpenPayment, onFilterStuck }: { onOpenPayment: (id: string) => void; onFilterStuck: () => void }) {
  const router = useRouter();
  const [o, setO] = useState<any>(null);
  const [err, setErr] = useState<string | null>(null);
  const load = useCallback(() => { adminService.get<any>('/admin/payments/overview').then(setO).catch(e => setErr(errMsg(e))); }, []);
  useEffect(() => { load(); }, [load]);
  if (err) return <Msg m={{ ok: false, text: err }} />;
  if (!o) return <p className="text-sm text-gray-500 flex items-center gap-2"><Loader2 size={14} className="animate-spin" /> Chargement…</p>;

  const goCompany = (id: string) => router.push(`/admin/companies/${id}/gestion`);
  const subRow = (s: any, extra: string) => (
    <button key={s.companyId} onClick={() => goCompany(s.companyId)} className="w-full flex items-center justify-between text-left text-sm hover:bg-gray-800/50 rounded-lg px-2 py-1.5">
      <span className="text-white">{s.company} <span className="text-xs text-gray-500">· {s.plan}</span></span>
      <span className="text-xs text-gray-400">{extra} {fmtD(s.currentPeriodEnd)}</span>
    </button>
  );

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat label="MRR" value={fmt(o.recurring.mrr)} sub={`ARR ${fmt(o.recurring.arr)}`} />
        <Stat label="Entreprises payantes" value={o.recurring.payingCompanies} sub={`Panier moyen ${fmt(o.recurring.arpa)} / mois`} />
        <Stat label="Encaissé ce mois" value={fmt(o.revenue.thisMonth)} sub={<span>{o.revenue.thisMonthCount} paiement(s) · <Variation v={o.revenue.variationPct} /></span>} />
        <Stat label="Encaissé cette année" value={fmt(o.revenue.thisYear)} sub={o.revenue.refundedThisMonth.count ? `${fmt(o.revenue.refundedThisMonth.amount)} remboursés ce mois` : `Mois dernier : ${fmt(o.revenue.lastMonth)}`} />
      </div>

      <div className="grid md:grid-cols-2 gap-3">
        <div className={card}>
          <h3 className="text-sm font-medium text-white mb-3">Abonnements</h3>
          <div className="flex flex-wrap gap-2 text-xs">
            {Object.entries(o.subscriptions.byStatus).map(([k, v]: any) => <span key={k} className="px-2.5 py-1 rounded-full bg-gray-800 text-gray-300">{SUB_STATUS_LABEL[k] ?? k} · {v}</span>)}
          </div>
          <p className="text-xs text-gray-500 mt-3">{o.subscriptions.expiringIn30Days} expirent d'ici 30 jours · {o.subscriptions.canceledLast30Days} annulé(s) sur 30 jours · {o.subscriptions.failedPaymentsLast7Days} paiement(s) échoué(s) sur 7 jours</p>
          <h3 className="text-sm font-medium text-white mt-4 mb-2">Par plan</h3>
          <div className="space-y-1">{o.recurring.byPlan.map((p: any) => <p key={p.plan} className="text-xs text-gray-400 flex justify-between"><span>{p.plan} · {p.companies} entreprise(s)</span><span>{fmt(p.mrr)} / mois</span></p>)}</div>
        </div>
        <div className={card}>
          <h3 className="text-sm font-medium text-white mb-3">Encaissé cette année par prestataire</h3>
          <div className="space-y-1">
            {o.revenue.byProvider.length === 0 && <p className="text-sm text-gray-500">Aucun encaissement</p>}
            {o.revenue.byProvider.map((r: any) => <p key={r.provider} className="text-sm text-gray-300 flex justify-between"><span>{PROVIDER_LABEL[r.provider]} <span className="text-xs text-gray-500">· {r.count}</span></span><span className="text-white">{fmt(r.amount)}</span></p>)}
          </div>
        </div>
      </div>

      <div className={card}>
        <h3 className="text-sm font-medium text-white mb-3 flex items-center gap-2"><AlertTriangle size={14} className="text-amber-300" /> À traiter</h3>
        {o.attention.stuckPayments.length + o.attention.expiredStillActive.length + o.attention.pastDue.length + o.attention.expiringSoon.length === 0 && (
          <p className="text-sm text-emerald-300 flex items-center gap-2"><CheckCircle2 size={14} /> Rien à traiter.</p>
        )}
        <div className="grid md:grid-cols-2 gap-4">
          {o.attention.stuckPayments.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-1"><p className="text-xs text-amber-300 flex items-center gap-1.5"><Clock size={12} /> Paiements bloqués (&gt; 1 h)</p><button className="text-xs text-gray-400 hover:text-white" onClick={onFilterStuck}>Tout voir</button></div>
              {o.attention.stuckPayments.map((p: any) => (
                <button key={p.id} onClick={() => onOpenPayment(p.id)} className="w-full flex items-center justify-between text-left text-sm hover:bg-gray-800/50 rounded-lg px-2 py-1.5">
                  <span className="text-white">{p.company} <span className="text-xs text-gray-500">· {PROVIDER_LABEL[p.provider]}</span></span>
                  <span className="text-xs text-gray-400">{fmt(p.amount)} · {fmtDT(p.createdAt)}</span>
                </button>
              ))}
            </div>
          )}
          {o.attention.expiredStillActive.length > 0 && <div><p className="text-xs text-red-300 mb-1">Période dépassée, abonnement encore actif</p>{o.attention.expiredStillActive.map((s: any) => subRow(s, 'expiré le'))}</div>}
          {o.attention.pastDue.length > 0 && <div><p className="text-xs text-red-300 mb-1">Impayés</p>{o.attention.pastDue.map((s: any) => subRow(s, 'depuis le'))}</div>}
          {o.attention.expiringSoon.length > 0 && <div><p className="text-xs text-amber-300 mb-1">Expirent sous 7 jours</p>{o.attention.expiringSoon.map((s: any) => subRow(s, 'fin le'))}</div>}
        </div>
      </div>
    </div>
  );
}

// ── Liste des paiements ──────────────────────────────────────────────────────
function PaymentsTab({ initialStuck, onOpen, refreshKey }: { initialStuck: boolean; onOpen: (id: string) => void; refreshKey: number }) {
  const [companies, setCompanies] = useState<any[]>([]);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [provider, setProvider] = useState('');
  const [companyId, setCompanyId] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [stuck, setStuck] = useState(initialStuck);
  const [page, setPage] = useState(1);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => { adminService.getCompanies().then((r: any) => setCompanies(Array.isArray(r) ? r : r?.data ?? [])).catch(() => {}); }, []);

  const load = useCallback(async () => {
    setLoading(true); setErr(null);
    try {
      const qs = new URLSearchParams({ page: String(page) });
      if (q.trim()) qs.set('q', q.trim());
      if (status) qs.set('status', status);
      if (provider) qs.set('provider', provider);
      if (companyId) qs.set('companyId', companyId);
      if (from) qs.set('from', new Date(from).toISOString());
      if (to) qs.set('to', new Date(`${to}T23:59:59`).toISOString());
      if (stuck) qs.set('stuck', 'true');
      setData(await adminService.get<any>(`/admin/payments?${qs.toString()}`));
    } catch (e) { setErr(errMsg(e)); } finally { setLoading(false); }
  }, [q, status, provider, companyId, from, to, stuck, page]);

  useEffect(() => { const t = setTimeout(load, 250); return () => clearTimeout(t); }, [load, refreshKey]);
  useEffect(() => { setPage(1); }, [q, status, provider, companyId, from, to, stuck]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="relative col-span-2">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input className={`${inputCls} pl-9`} placeholder="Entreprise, référence prestataire, n° de commande, id…" value={q} onChange={e => setQ(e.target.value)} />
        </div>
        <select className={inputCls} value={status} onChange={e => setStatus(e.target.value)}>
          <option value="">Tous statuts</option>{Object.entries(STATUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select className={inputCls} value={provider} onChange={e => setProvider(e.target.value)}>
          <option value="">Tous prestataires</option>{Object.entries(PROVIDER_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select className={`${inputCls} col-span-2`} value={companyId} onChange={e => setCompanyId(e.target.value)}>
          <option value="">Toutes les entreprises</option>{companies.map((c: any) => <option key={c.id} value={c.id}>{c.name || c.tradeName || c.legalName}</option>)}
        </select>
        <input type="date" className={inputCls} value={from} onChange={e => setFrom(e.target.value)} />
        <input type="date" className={inputCls} value={to} onChange={e => setTo(e.target.value)} />
      </div>
      <label className="flex items-center gap-2 text-xs text-gray-400"><input type="checkbox" checked={stuck} onChange={e => setStuck(e.target.checked)} /> Seulement les paiements bloqués (en attente/en cours depuis plus d'1 h)</label>

      {err && <Msg m={{ ok: false, text: err }} />}

      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-xs text-gray-500 text-left"><tr><th className="px-4 py-3">Date</th><th className="px-4 py-3">Entreprise</th><th className="px-4 py-3">Montant</th><th className="px-4 py-3">Prestataire</th><th className="px-4 py-3">Statut</th></tr></thead>
          <tbody className="divide-y divide-gray-800">
            {loading && !data && <tr><td colSpan={5} className="px-4 py-6 text-center text-gray-500"><Loader2 size={14} className="inline animate-spin" /> Chargement…</td></tr>}
            {data?.items.length === 0 && <tr><td colSpan={5} className="px-4 py-6 text-center text-gray-500">Aucun paiement</td></tr>}
            {data?.items.map((p: any) => (
              <tr key={p.id} onClick={() => onOpen(p.id)} className="hover:bg-gray-800/50 cursor-pointer">
                <td className="px-4 py-3 text-xs text-gray-400">{fmtDT(p.createdAt)}</td>
                <td className="px-4 py-3"><p className="text-white">{p.company.name}</p><p className="text-xs text-gray-500">{p.plan ?? '—'}{p.billingPeriod ? ` · ${PERIOD_LABEL[p.billingPeriod] ?? p.billingPeriod}` : ''}{p.isQuote ? ' · devis' : ''}{p.coveredCount > 1 ? ` · ${p.coveredCount} entreprises` : ''}{p.hasDiscount ? ' · promo' : ''}</p></td>
                <td className="px-4 py-3 text-white">{fmt(p.amount)}</td>
                <td className="px-4 py-3 text-gray-300">{PROVIDER_LABEL[p.provider]}</td>
                <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs ${STATUS_CLS[p.status]}`}>{STATUS_LABEL[p.status]}</span>{p.stuck && <span className="ml-2 text-xs text-amber-300">bloqué</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {data && (
          <div className="flex items-center justify-between px-4 py-3 text-xs text-gray-500 border-t border-gray-800">
            <span>{data.total} paiement(s) · encaissé sur ce filtre : <span className="text-gray-300">{fmt(data.succeededAmount)}</span></span>
            <div className="flex items-center gap-2">
              <button className={btnGhost} disabled={page <= 1} onClick={() => setPage(p => p - 1)}><ChevronLeft size={12} /></button>
              <span>Page {page}</span>
              <button className={btnGhost} disabled={page * data.pageSize >= data.total} onClick={() => setPage(p => p + 1)}><ChevronRight size={12} /></button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default function PaymentsAdminPage() {
  const [tab, setTab] = useState<'overview' | 'payments'>('overview');
  const [stuckFilter, setStuckFilter] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<Confirm | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const notify = useCallback((m: { ok: boolean; text: string }) => { setMsg(m); setTimeout(() => setMsg(null), 6000); }, []);

  return (
    <div className="p-6 space-y-5 max-w-6xl mx-auto">
      <div>
        <h1 className="text-xl font-semibold text-white flex items-center gap-2"><CreditCard size={20} /> Paiements & abonnements</h1>
        <p className="text-sm text-gray-500 mt-1">Suivi des revenus et des paiements bloqués. Les actions exigent un motif et sont tracées.</p>
      </div>

      <div className="flex gap-2 border-b border-gray-800">
        {([['overview', "Vue d'ensemble"], ['payments', 'Paiements']] as const).map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)}
            className={`px-4 py-2 text-sm border-b-2 -mb-px transition-colors ${tab === id ? 'border-red-500 text-white' : 'border-transparent text-gray-500 hover:text-gray-300'}`}>{label}</button>
        ))}
      </div>

      <Msg m={msg} />

      {tab === 'overview' && <OverviewTab onOpenPayment={setSelected} onFilterStuck={() => { setStuckFilter(true); setTab('payments'); }} />}
      {tab === 'payments' && <PaymentsTab key={String(stuckFilter)} initialStuck={stuckFilter} onOpen={setSelected} refreshKey={refreshKey} />}

      {selected && <PaymentDrawer id={selected} onClose={() => setSelected(null)} onChanged={() => setRefreshKey(k => k + 1)} ask={setConfirm} notify={notify} />}
      {confirm && <ConfirmModal c={confirm} onClose={() => setConfirm(null)} />}
    </div>
  );
}