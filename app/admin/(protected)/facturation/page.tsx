// ============================================================================
// 💳 PAGE SUPER ADMIN — Facturation : prix, codes de réduction, devis, agrégateur
// Fichier: frontend/app/admin/(protected)/facturation/page.tsx
// ============================================================================

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Wallet, Tag, FileText, Plug, RefreshCw, Loader2, Save, RotateCcw, Plus, Ban, CheckCircle2, AlertTriangle,
  Receipt, Download, Mail, Search, ChevronLeft, ChevronRight,
} from 'lucide-react';
import { adminService } from '@/lib/services/adminService';

type Tab = 'prices' | 'codes' | 'quotes' | 'invoices' | 'provider';

const fmt = (n: number) => `${(n ?? 0).toLocaleString('fr-FR')} F`;
const fmtDate = (d?: string | null) => (d ? new Date(d).toLocaleDateString('fr-FR') : '—');
const companyName = (c: any) => c?.tradeName || c?.legalName || '—';

const inputCls =
  'w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-gray-600';
const btnPrimary =
  'flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-sm transition-colors disabled:opacity-50';
const btnGhost =
  'flex items-center gap-2 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-xs transition-colors disabled:opacity-50';

function Msg({ m }: { m: { ok: boolean; text: string } | null }) {
  if (!m) return null;
  return (
    <div className={`flex items-center gap-2 text-sm rounded-xl px-4 py-2 border ${
      m.ok ? 'text-emerald-300 border-emerald-500/25 bg-emerald-500/10' : 'text-red-300 border-red-500/25 bg-red-500/10'
    }`}>
      {m.ok ? <CheckCircle2 size={14} /> : <AlertTriangle size={14} />} {m.text}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
export default function BillingConfigPage() {
  const [tab, setTab] = useState<Tab>('prices');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <Wallet className="text-red-500" size={24} /> Facturation
        </h1>
        <p className="text-gray-400 text-sm mt-0.5">
          Prix des plans, codes de réduction, paiements sur devis et agrégateur de paiement
        </p>
      </div>

      <div className="flex bg-gray-900 border border-gray-800 rounded-xl p-1 w-fit flex-wrap">
        {([
          { k: 'prices',   l: 'Prix des plans',  I: Wallet },
          { k: 'codes',    l: 'Codes réduction', I: Tag },
          { k: 'quotes',   l: 'Devis',           I: FileText },
          { k: 'invoices', l: 'Factures',        I: Receipt },
          { k: 'provider', l: 'Agrégateur',      I: Plug },
        ] as { k: Tab; l: string; I: any }[]).map(t => (
          <button key={t.k} onClick={() => setTab(t.k)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors ${
              tab === t.k ? 'bg-red-600 text-white' : 'text-gray-400 hover:text-white'
            }`}>
            <t.I size={14} /> {t.l}
          </button>
        ))}
      </div>

      {tab === 'prices'   && <PricesTab />}
      {tab === 'codes'    && <CodesTab />}
      {tab === 'quotes'   && <QuotesTab />}
      {tab === 'invoices' && <InvoicesTab />}
      {tab === 'provider' && <ProviderTab />}
    </div>
  );
}

// ── Prix ─────────────────────────────────────────────────────────────────────
function PricesTab() {
  const [rows, setRows] = useState<any[]>([]);
  const [edit, setEdit] = useState<Record<string, { m: string; y: string }>>({});
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await adminService.getPlanPrices();
      setRows(r);
      setEdit(Object.fromEntries(r.map((p: any) => [p.plan, { m: String(p.priceMonthly), y: String(p.priceYearly) }])));
    } finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const save = async (plan: string) => {
    setBusy(plan); setMsg(null);
    try {
      await adminService.updatePlanPrice(plan, {
        priceMonthly: parseInt(edit[plan].m),
        priceYearly: parseInt(edit[plan].y),
      });
      setMsg({ ok: true, text: `Prix du plan ${plan} mis à jour` });
      await load();
    } catch (e: any) { setMsg({ ok: false, text: e.message }); } finally { setBusy(null); }
  };
  const reset = async (plan: string) => {
    setBusy(plan); setMsg(null);
    try {
      await adminService.resetPlanPrice(plan);
      setMsg({ ok: true, text: `Plan ${plan} remis au prix par défaut` });
      await load();
    } catch (e: any) { setMsg({ ok: false, text: e.message }); } finally { setBusy(null); }
  };

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="animate-spin text-gray-500" /></div>;

  return (
    <div className="space-y-4">
      <Msg m={msg} />
      <div className="bg-gray-900 border border-gray-800 rounded-2xl divide-y divide-gray-800">
        {rows.map(p => (
          <div key={p.plan} className="p-5 grid grid-cols-1 md:grid-cols-[160px_1fr_1fr_auto] gap-4 items-end">
            <div>
              <p className="text-white font-semibold">{p.name}</p>
              <p className="text-xs text-gray-500">{p.plan}{p.isCustomized ? ' · modifié' : ' · par défaut'}</p>
            </div>
            <label className="text-xs text-gray-400 space-y-1 block">
              Prix mensuel (FCFA) <span className="text-gray-600">défaut {fmt(p.defaultMonthly)}</span>
              <input type="number" min={100} className={inputCls} value={edit[p.plan]?.m ?? ''}
                onChange={e => setEdit(s => ({ ...s, [p.plan]: { ...s[p.plan], m: e.target.value } }))} />
            </label>
            <label className="text-xs text-gray-400 space-y-1 block">
              Prix annuel (FCFA) <span className="text-gray-600">défaut {fmt(p.defaultYearly)}</span>
              <input type="number" min={100} className={inputCls} value={edit[p.plan]?.y ?? ''}
                onChange={e => setEdit(s => ({ ...s, [p.plan]: { ...s[p.plan], y: e.target.value } }))} />
            </label>
            <div className="flex gap-2">
              <button className={btnPrimary} disabled={busy === p.plan} onClick={() => save(p.plan)}>
                {busy === p.plan ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Enregistrer
              </button>
              {p.isCustomized && (
                <button className={btnGhost} disabled={busy === p.plan} onClick={() => reset(p.plan)}>
                  <RotateCcw size={12} /> Défaut
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
      <p className="text-xs text-gray-500">
        Les nouveaux prix s'appliquent aux prochains paiements. Les abonnements en cours ne changent pas.
        Ces prix, ainsi que les codes de réduction et les devis, ne valent qu'avec YabetoPay : Moteki et Chariow
        utilisent les prix préconfigurés sur leurs propres dashboards.
      </p>
    </div>
  );
}

// ── Sélecteur d'entreprise partagé (codes + devis) ───────────────────────────
function useCompanies() {
  const [companies, setCompanies] = useState<any[]>([]);
  useEffect(() => {
    adminService.getCompanies().then((r: any) => setCompanies(Array.isArray(r) ? r : r?.data ?? [])).catch(() => {});
  }, []);
  return companies;
}

// ── Codes de réduction ───────────────────────────────────────────────────────
function CodesTab() {
  const companies = useCompanies();
  const [codes, setCodes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [f, setF] = useState({ code: '', percentOff: '10', companyId: '', maxUses: '', maxUsesPerCompany: '', validUntil: '', note: '' });

  const load = useCallback(async () => {
    setLoading(true);
    try { setCodes(await adminService.getDiscountCodes()); } finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const create = async () => {
    setBusy(true); setMsg(null);
    try {
      await adminService.createDiscountCode({
        code: f.code,
        percentOff: parseInt(f.percentOff),
        companyId: f.companyId || undefined,
        maxUses: f.maxUses ? parseInt(f.maxUses) : undefined,
        maxUsesPerCompany: f.maxUsesPerCompany ? parseInt(f.maxUsesPerCompany) : undefined,
        validUntil: f.validUntil ? new Date(f.validUntil).toISOString() : undefined,
        note: f.note || undefined,
      });
      setF({ code: '', percentOff: '10', companyId: '', maxUses: '', maxUsesPerCompany: '', validUntil: '', note: '' });
      setMsg({ ok: true, text: 'Code créé' });
      await load();
    } catch (e: any) { setMsg({ ok: false, text: e.message }); } finally { setBusy(false); }
  };

  const toggle = async (c: any) => {
    try { await adminService.updateDiscountCode(c.id, { isActive: !c.isActive }); await load(); }
    catch (e: any) { setMsg({ ok: false, text: e.message }); }
  };

  return (
    <div className="space-y-4">
      <Msg m={msg} />
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 space-y-4">
        <p className="text-white font-semibold flex items-center gap-2"><Plus size={16} /> Nouveau code</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <label className="text-xs text-gray-400 space-y-1 block">Code
            <input className={inputCls} placeholder="BIENVENUE10" value={f.code} onChange={e => setF({ ...f, code: e.target.value })} />
          </label>
          <label className="text-xs text-gray-400 space-y-1 block">Réduction (%)
            <input type="number" min={1} max={99} className={inputCls} value={f.percentOff} onChange={e => setF({ ...f, percentOff: e.target.value })} />
          </label>
          <label className="text-xs text-gray-400 space-y-1 block">Réservé à l'entreprise (optionnel)
            <select className={inputCls} value={f.companyId} onChange={e => setF({ ...f, companyId: e.target.value })}>
              <option value="">Toutes les entreprises</option>
              {companies.map(c => <option key={c.id} value={c.id}>{companyName(c)}</option>)}
            </select>
          </label>
          <label className="text-xs text-gray-400 space-y-1 block">Utilisations max au total
            <input type="number" min={1} className={inputCls} placeholder="Illimité" value={f.maxUses} onChange={e => setF({ ...f, maxUses: e.target.value })} />
          </label>
          <label className="text-xs text-gray-400 space-y-1 block">Utilisations max par entreprise
            <input type="number" min={1} className={inputCls} placeholder="Illimité (chaque paiement)" value={f.maxUsesPerCompany} onChange={e => setF({ ...f, maxUsesPerCompany: e.target.value })} />
          </label>
          <label className="text-xs text-gray-400 space-y-1 block">Valable jusqu'au
            <input type="date" className={inputCls} value={f.validUntil} onChange={e => setF({ ...f, validUntil: e.target.value })} />
          </label>
        </div>
        <label className="text-xs text-gray-400 space-y-1 block">Note interne
          <input className={inputCls} value={f.note} onChange={e => setF({ ...f, note: e.target.value })} />
        </label>
        <button className={btnPrimary} disabled={busy || !f.code || !f.percentOff} onClick={create}>
          {busy ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />} Créer le code
        </button>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-x-auto">
        {loading ? <div className="flex justify-center py-12"><Loader2 className="animate-spin text-gray-500" /></div> : (
          <table className="w-full text-sm">
            <thead className="text-xs text-gray-500 border-b border-gray-800">
              <tr>
                {['Code', '%', 'Entreprise', 'Utilisé', 'Expire', 'Statut', ''].map(h => <th key={h} className="text-left px-4 py-3 font-medium">{h}</th>)}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800 text-gray-300">
              {codes.length === 0 && <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-500">Aucun code</td></tr>}
              {codes.map(c => (
                <tr key={c.id}>
                  <td className="px-4 py-3 font-mono text-white">{c.code}</td>
                  <td className="px-4 py-3">{c.percentOff}%</td>
                  <td className="px-4 py-3">{c.company ? companyName(c.company) : 'Toutes'}</td>
                  <td className="px-4 py-3">{c.usesCount}{c.maxUses ? ` / ${c.maxUses}` : ''}</td>
                  <td className="px-4 py-3">{fmtDate(c.validUntil)}</td>
                  <td className="px-4 py-3">{c.isActive ? 'Actif' : 'Désactivé'}</td>
                  <td className="px-4 py-3 text-right">
                    <button className={btnGhost} onClick={() => toggle(c)}>
                      {c.isActive ? <><Ban size={12} /> Désactiver</> : <><CheckCircle2 size={12} /> Activer</>}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// ── Devis ────────────────────────────────────────────────────────────────────
const QUOTE_STATUS: Record<string, string> = { ACTIVE: 'Actif', USED: 'Utilisé', CANCELED: 'Annulé' };

function QuotesTab() {
  const companies = useCompanies();
  const [quotes, setQuotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [f, setF] = useState({ companyId: '', plan: 'PRO', amount: '', months: '1', isRecurring: false, validUntil: '', note: '' });

  const load = useCallback(async () => {
    setLoading(true);
    try { setQuotes(await adminService.getCustomQuotes()); } finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const create = async () => {
    setBusy(true); setMsg(null);
    try {
      await adminService.createCustomQuote({
        companyId: f.companyId,
        plan: f.plan,
        amount: parseInt(f.amount),
        months: parseInt(f.months) || 1,
        isRecurring: f.isRecurring,
        validUntil: f.validUntil ? new Date(f.validUntil).toISOString() : undefined,
        note: f.note || undefined,
      });
      setF({ companyId: '', plan: 'PRO', amount: '', months: '1', isRecurring: false, validUntil: '', note: '' });
      setMsg({ ok: true, text: 'Devis enregistré — le client pourra le payer depuis la page des plans' });
      await load();
    } catch (e: any) { setMsg({ ok: false, text: e.message }); } finally { setBusy(false); }
  };

  const cancel = async (id: string) => {
    try { await adminService.cancelCustomQuote(id); await load(); }
    catch (e: any) { setMsg({ ok: false, text: e.message }); }
  };

  return (
    <div className="space-y-4">
      <Msg m={msg} />
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 space-y-4">
        <p className="text-white font-semibold flex items-center gap-2"><Plus size={16} /> Nouveau devis</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <label className="text-xs text-gray-400 space-y-1 block">Entreprise
            <select className={inputCls} value={f.companyId} onChange={e => setF({ ...f, companyId: e.target.value })}>
              <option value="">Choisir…</option>
              {companies.map(c => <option key={c.id} value={c.id}>{companyName(c)}</option>)}
            </select>
          </label>
          <label className="text-xs text-gray-400 space-y-1 block">Plan activé (fonctionnalités)
            <select className={inputCls} value={f.plan} onChange={e => setF({ ...f, plan: e.target.value })}>
              <option value="BASIC">Basique</option><option value="PRO">Pro</option><option value="ENTERPRISE">Enterprise</option>
            </select>
          </label>
          <label className="text-xs text-gray-400 space-y-1 block">Montant à payer (FCFA)
            <input type="number" min={100} className={inputCls} placeholder="10000" value={f.amount} onChange={e => setF({ ...f, amount: e.target.value })} />
          </label>
          <label className="text-xs text-gray-400 space-y-1 block">Durée accordée (mois)
            <input type="number" min={1} max={36} className={inputCls} value={f.months} onChange={e => setF({ ...f, months: e.target.value })} />
          </label>
          <label className="text-xs text-gray-400 space-y-1 block">Devis valable jusqu'au (optionnel)
            <input type="date" className={inputCls} value={f.validUntil} onChange={e => setF({ ...f, validUntil: e.target.value })} />
          </label>
          <label className="flex items-center gap-2 text-sm text-gray-300 pt-5">
            <input type="checkbox" checked={f.isRecurring} onChange={e => setF({ ...f, isRecurring: e.target.checked })} />
            Reconduire ce tarif à chaque renouvellement
          </label>
        </div>
        <label className="text-xs text-gray-400 space-y-1 block">Note interne
          <input className={inputCls} value={f.note} onChange={e => setF({ ...f, note: e.target.value })} />
        </label>
        <button className={btnPrimary} disabled={busy || !f.companyId || !f.amount} onClick={create}>
          {busy ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />} Enregistrer le devis
        </button>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-x-auto">
        {loading ? <div className="flex justify-center py-12"><Loader2 className="animate-spin text-gray-500" /></div> : (
          <table className="w-full text-sm">
            <thead className="text-xs text-gray-500 border-b border-gray-800">
              <tr>{['Entreprise', 'Plan', 'Montant', 'Durée', 'Reconduit', 'Statut', 'Créé le', ''].map(h => <th key={h} className="text-left px-4 py-3 font-medium">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-gray-800 text-gray-300">
              {quotes.length === 0 && <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-500">Aucun devis</td></tr>}
              {quotes.map(q => (
                <tr key={q.id}>
                  <td className="px-4 py-3 text-white">{companyName(q.company)}</td>
                  <td className="px-4 py-3">{q.plan}</td>
                  <td className="px-4 py-3">{fmt(q.amount)}</td>
                  <td className="px-4 py-3">{q.months} mois</td>
                  <td className="px-4 py-3">{q.isRecurring ? 'Oui' : 'Non'}</td>
                  <td className="px-4 py-3">{QUOTE_STATUS[q.status] ?? q.status}</td>
                  <td className="px-4 py-3">{fmtDate(q.createdAt)}</td>
                  <td className="px-4 py-3 text-right">
                    {q.status === 'ACTIVE' && <button className={btnGhost} onClick={() => cancel(q.id)}><Ban size={12} /> Annuler</button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// ── Factures ─────────────────────────────────────────────────────────────────
function InvoicesTab() {
  const [data, setData] = useState<any>({ items: [], total: 0, page: 1, pageSize: 25, totalAmount: 0 });
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try { setData(await adminService.getInvoices({ search: query || undefined, page })); }
    catch (e: any) { setMsg({ ok: false, text: e.message }); }
    finally { setLoading(false); }
  }, [query, page]);
  useEffect(() => { load(); }, [load]);

  const download = async (inv: any) => {
    setBusy(`d${inv.id}`); setMsg(null);
    try { await adminService.downloadInvoice(inv.id, inv.number); }
    catch (e: any) { setMsg({ ok: false, text: e.message }); } finally { setBusy(null); }
  };
  const resend = async (inv: any) => {
    setBusy(`r${inv.id}`); setMsg(null);
    try { await adminService.resendInvoice(inv.id); setMsg({ ok: true, text: `Facture ${inv.number} renvoyée` }); await load(); }
    catch (e: any) { setMsg({ ok: false, text: e.message }); } finally { setBusy(null); }
  };

  const pages = Math.max(1, Math.ceil(data.total / data.pageSize));

  return (
    <div className="space-y-4">
      <Msg m={msg} />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <form className="flex items-center gap-2" onSubmit={e => { e.preventDefault(); setPage(1); setQuery(search); }}>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input className={`${inputCls} pl-9 w-72`} placeholder="N° de facture ou entreprise" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <button type="submit" className={btnGhost}>Rechercher</button>
        </form>
        <p className="text-sm text-gray-400">
          {data.total} facture{data.total > 1 ? 's' : ''} · total <span className="text-white font-semibold">{fmt(data.totalAmount)}</span>
        </p>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-x-auto">
        {loading ? <div className="flex justify-center py-12"><Loader2 className="animate-spin text-gray-500" /></div> : (
          <table className="w-full text-sm">
            <thead className="text-xs text-gray-500 border-b border-gray-800">
              <tr>{['N°', 'Entreprise', 'Date', 'Montant', 'Email', ''].map(h => <th key={h} className="text-left px-4 py-3 font-medium">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-gray-800 text-gray-300">
              {data.items.length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">Aucune facture</td></tr>}
              {data.items.map((inv: any) => (
                <tr key={inv.id}>
                  <td className="px-4 py-3 font-mono text-white">{inv.number}</td>
                  <td className="px-4 py-3">{companyName(inv.company)}</td>
                  <td className="px-4 py-3">{fmtDate(inv.issuedAt)}</td>
                  <td className="px-4 py-3">{fmt(inv.total)}</td>
                  <td className="px-4 py-3">{inv.emailSentAt ? `Envoyé le ${fmtDate(inv.emailSentAt)}` : 'Non envoyé'}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button className={btnGhost} disabled={busy !== null} onClick={() => download(inv)}>
                        {busy === `d${inv.id}` ? <Loader2 size={12} className="animate-spin" /> : <Download size={12} />} PDF
                      </button>
                      <button className={btnGhost} disabled={busy !== null} onClick={() => resend(inv)}>
                        {busy === `r${inv.id}` ? <Loader2 size={12} className="animate-spin" /> : <Mail size={12} />} Renvoyer
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {pages > 1 && (
        <div className="flex items-center justify-end gap-3 text-sm text-gray-400">
          <button className={btnGhost} disabled={page <= 1} onClick={() => setPage(p => p - 1)}><ChevronLeft size={12} /> Précédent</button>
          Page {page} / {pages}
          <button className={btnGhost} disabled={page >= pages} onClick={() => setPage(p => p + 1)}>Suivant <ChevronRight size={12} /></button>
        </div>
      )}
    </div>
  );
}

// ── Agrégateur ───────────────────────────────────────────────────────────────
const PROVIDERS = [
  { k: 'YABETOOPAY', l: 'YabetoPay', d: 'Mobile Money MTN / Airtel / Orange — principal' },
  { k: 'MOTEKI',     l: 'Moteki',    d: 'Secours — prix préconfigurés sur le dashboard Moteki' },
  { k: 'CHARIOW',    l: 'Chariow',   d: 'Secours — prix préconfigurés sur le dashboard Chariow' },
] as const;

function ProviderTab() {
  const [state, setState] = useState<any>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const load = useCallback(async () => { setState(await adminService.getPaymentProvider()); }, []);
  useEffect(() => { load(); }, [load]);

  const choose = async (k: 'YABETOOPAY' | 'MOTEKI' | 'CHARIOW') => {
    setBusy(k); setMsg(null);
    try {
      setState(await adminService.setPaymentProvider(k));
      setMsg({ ok: true, text: 'Agrégateur mis à jour — effectif immédiatement pour les nouveaux paiements' });
    } catch (e: any) { setMsg({ ok: false, text: e.message }); } finally { setBusy(null); }
  };

  if (!state) return <div className="flex justify-center py-16"><Loader2 className="animate-spin text-gray-500" /></div>;

  return (
    <div className="space-y-4">
      <Msg m={msg} />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {PROVIDERS.map(p => {
          const active = state.provider === p.k;
          const configured = state.configured?.[p.k];
          return (
            <div key={p.k} className={`bg-gray-900 rounded-2xl p-5 border ${active ? 'border-red-600' : 'border-gray-800'}`}>
              <div className="flex items-center justify-between">
                <p className="text-white font-semibold">{p.l}</p>
                {active && <span className="text-xs px-2 py-0.5 rounded-full bg-red-600/20 text-red-300 border border-red-600/30">Actif</span>}
              </div>
              <p className="text-xs text-gray-500 mt-1">{p.d}</p>
              <p className={`text-xs mt-3 ${configured ? 'text-gray-400' : 'text-red-400'}`}>
                {configured ? 'Clés configurées sur le serveur' : 'Clés API absentes sur le serveur'}
              </p>
              <button className={`${btnGhost} mt-4`} disabled={active || !configured || busy !== null} onClick={() => choose(p.k)}>
                {busy === p.k ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />} Utiliser
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}