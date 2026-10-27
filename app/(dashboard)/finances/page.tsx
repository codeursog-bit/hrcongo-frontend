'use client';

// ============================================================================
// 📁 app/(dashboard)/finances/page.tsx
// Module Finances — caisse, dépenses, entrées, budgets mensuels (ADMIN only)
// ============================================================================

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Wallet, TrendingUp, TrendingDown, Plus, X, Loader2, Pencil, Trash2,
  Paperclip, Download, Search, ChevronLeft, ChevronRight, AlertCircle,
  Settings2, BarChart3, ListOrdered, Target, Check, Archive, RotateCcw,
  ArrowDownCircle, ArrowUpCircle, ExternalLink,
} from 'lucide-react';
import {
  ResponsiveContainer, ComposedChart, Bar, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend,
} from 'recharts';
import {
  financeApi,
  FinanceCategory,
  FinanceDashboard,
  FinanceFlow,
  FinanceSettings,
  FinanceTransaction,
  BudgetsMonth,
  BudgetRow,
} from '@/services/finance-api';

// ── Helpers ───────────────────────────────────────────────────────────────────
const nf = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 2 });
const money = (n: number) => `${nf.format(n)} FCFA`;
const shortMoney = (n: number) => {
  const a = Math.abs(n);
  if (a >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)} Md`;
  if (a >= 1_000_000) return `${(n / 1_000_000).toFixed(1)} M`;
  if (a >= 1_000) return `${Math.round(n / 1_000)} k`;
  return String(Math.round(n));
};
const pad = (n: number) => String(n).padStart(2, '0');
const toYmd = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const MONTHS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
const monthLabel = (ym: string) => {
  const [y, m] = ym.split('-').map(Number);
  return `${MONTHS[m - 1]} ${String(y).slice(2)}`;
};
const frDate = (ymd: string) => {
  const [y, m, d] = ymd.split('-');
  return `${d}/${m}/${y}`;
};
const parseNum = (s: string) => Number(String(s).replace(/\s/g, '').replace(',', '.'));

type PresetKey = 'month' | 'lastMonth' | 'quarter' | 'year' | 'custom';
const PRESETS: { key: PresetKey; label: string }[] = [
  { key: 'month', label: 'Ce mois' },
  { key: 'lastMonth', label: 'Mois dernier' },
  { key: 'quarter', label: '3 derniers mois' },
  { key: 'year', label: 'Cette année' },
  { key: 'custom', label: 'Personnalisé' },
];
function presetRange(key: PresetKey): { from: string; to: string } {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  switch (key) {
    case 'lastMonth':
      return { from: toYmd(new Date(y, m - 1, 1)), to: toYmd(new Date(y, m, 0)) };
    case 'quarter':
      return { from: toYmd(new Date(y, m - 2, 1)), to: toYmd(new Date(y, m + 1, 0)) };
    case 'year':
      return { from: `${y}-01-01`, to: `${y}-12-31` };
    case 'month':
    default:
      return { from: toYmd(new Date(y, m, 1)), to: toYmd(new Date(y, m + 1, 0)) };
  }
}

const inputCls =
  'w-full px-3 py-2.5 bg-[var(--surface-2)] border border-[var(--border)] rounded-xl text-[var(--text)] outline-none focus:border-emerald-500/70 focus:ring-1 focus:ring-emerald-500/50 transition-colors placeholder:text-[var(--text-muted)] text-sm';
const labelCls = 'block text-xs font-bold text-[var(--text-muted)] uppercase mb-1.5 ml-1';
const cardCls = 'bg-[var(--surface)] border border-[var(--border)] rounded-2xl';
const btnPrimary =
  'inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold transition-colors disabled:opacity-60 disabled:cursor-not-allowed';
const btnGhost =
  'inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-2)] text-[var(--text)] text-sm font-medium transition-colors disabled:opacity-60';

type Notify = (msg: string, kind?: 'ok' | 'err') => void;
const errMsg = (e: any) => e?.message || 'Une erreur est survenue.';

// ── Petits composants ─────────────────────────────────────────────────────────
function Spinner() {
  return (
    <div className="flex items-center justify-center py-16 text-[var(--text-muted)]">
      <Loader2 className="animate-spin" size={22} />
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return <p className="text-sm text-[var(--text-muted)] py-6 text-center">{text}</p>;
}

function Bar100({ percent, color, over }: { percent: number; color?: string | null; over?: boolean }) {
  const w = Math.max(0, Math.min(100, percent));
  return (
    <div className="h-2 w-full rounded-full bg-[var(--surface-2)] overflow-hidden">
      <div
        className="h-full rounded-full transition-all"
        style={{ width: `${w}%`, background: over ? '#EF4444' : color || '#10B981' }}
      />
    </div>
  );
}

function StatCard(props: {
  label: string; value: string; icon: React.ReactNode; tone?: 'green' | 'red' | 'sky' | 'default'; hint?: string;
}) {
  const tones: Record<string, string> = {
    green: 'text-emerald-500 bg-emerald-500/10',
    red: 'text-red-500 bg-red-500/10',
    sky: 'text-sky-500 bg-sky-500/10',
    default: 'text-[var(--text-muted)] bg-[var(--surface-2)]',
  };
  return (
    <div className={`${cardCls} p-5`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-bold uppercase text-[var(--text-muted)]">{props.label}</span>
        <span className={`w-9 h-9 rounded-xl flex items-center justify-center ${tones[props.tone || 'default']}`}>
          {props.icon}
        </span>
      </div>
      <div className="text-xl md:text-2xl font-extrabold text-[var(--text)] break-words">{props.value}</div>
      {props.hint && <div className="text-xs text-[var(--text-muted)] mt-1">{props.hint}</div>}
    </div>
  );
}

function CategoryBars({ title, items, color }: {
  title: string;
  items: { categoryId: string; name: string; color: string | null; total: number; percent: number }[];
  color: string;
}) {
  return (
    <div className={`${cardCls} p-5`}>
      <h3 className="text-sm font-bold text-[var(--text)] mb-4">{title}</h3>
      {items.length === 0 ? (
        <Empty text="Aucune opération sur la période." />
      ) : (
        <div className="space-y-3.5">
          {items.map((c) => (
            <div key={c.categoryId}>
              <div className="flex justify-between text-sm mb-1.5">
                <span className="text-[var(--text)] font-medium">{c.name}</span>
                <span className="text-[var(--text-muted)]">
                  {money(c.total)} <span className="text-xs">({c.percent}%)</span>
                </span>
              </div>
              <Bar100 percent={c.percent} color={c.color || color} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function BudgetList({ rows }: { rows: BudgetRow[] }) {
  if (rows.length === 0) return <Empty text="Aucun budget défini ni dépense sur la période." />;
  return (
    <div className="space-y-4">
      {rows.map((r) => {
        const over = r.budget > 0 && r.spent > r.budget;
        return (
          <div key={r.categoryId}>
            <div className="flex flex-wrap justify-between gap-x-3 text-sm mb-1.5">
              <span className="text-[var(--text)] font-medium">{r.name}</span>
              <span className="text-[var(--text-muted)]">
                {money(r.spent)}
                {r.budget > 0 ? ` / ${money(r.budget)}` : ' (sans budget)'}
                {r.percent !== null && (
                  <span className={`ml-1 text-xs font-bold ${over ? 'text-red-500' : ''}`}>{r.percent}%</span>
                )}
              </span>
            </div>
            {r.budget > 0 && <Bar100 percent={r.percent ?? 0} over={over} color={r.color} />}
            {over && (
              <p className="text-xs text-red-500 mt-1">Dépassement de {money(r.spent - r.budget)}</p>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Onglet Tableau de bord ────────────────────────────────────────────────────
function DashboardTab({ from, to, version, notify }: { from: string; to: string; version: number; notify: Notify }) {
  const [data, setData] = useState<FinanceDashboard | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    financeApi
      .getDashboard(from, to)
      .then((d) => { if (!cancelled) setData(d); })
      .catch((e) => { if (!cancelled) { setData(null); notify(errMsg(e), 'err'); } })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [from, to, version, notify]);

  if (loading && !data) return <Spinner />;
  if (!data) return <Empty text="Impossible de charger le tableau de bord." />;

  const chart = data.monthly.map((m) => ({ ...m, label: monthLabel(m.month) }));
  const net = data.totals.net;

  return (
    <div className="space-y-5">
      <div className={`${cardCls} p-6 bg-gradient-to-br from-emerald-500/10 to-transparent`}>
        <div className="flex items-center gap-2 text-xs font-bold uppercase text-[var(--text-muted)] mb-2">
          <Wallet size={14} /> Solde actuel de la caisse
        </div>
        <div className={`text-3xl md:text-4xl font-extrabold ${data.balance.current < 0 ? 'text-red-500' : 'text-[var(--text)]'}`}>
          {money(data.balance.current)}
        </div>
        <div className="text-xs text-[var(--text-muted)] mt-2">
          Solde de départ {money(data.balance.openingBalance)} au {frDate(data.balance.openingDate)}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Entrées" value={money(data.totals.income)} tone="green" icon={<TrendingUp size={18} />} hint="Sur la période" />
        <StatCard label="Sorties" value={money(data.totals.expense)} tone="red" icon={<TrendingDown size={18} />} hint="Sur la période" />
        <StatCard
          label="Résultat"
          value={`${net > 0 ? '+' : ''}${money(net)}`}
          tone={net >= 0 ? 'green' : 'red'}
          icon={<Wallet size={18} />}
          hint={`Caisse : ${shortMoney(data.balance.atPeriodStart)} → ${shortMoney(data.balance.atPeriodEnd)} FCFA`}
        />
      </div>

      <div className={`${cardCls} p-5`}>
        <h3 className="text-sm font-bold text-[var(--text)] mb-4">Évolution mensuelle</h3>
        {chart.every((c) => c.income === 0 && c.expense === 0) ? (
          <Empty text="Aucune opération sur la période." />
        ) : (
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chart} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                <YAxis yAxisId="l" tickFormatter={shortMoney} tick={{ fontSize: 11, fill: 'var(--text-muted)' }} width={48} />
                <YAxis yAxisId="r" orientation="right" tickFormatter={shortMoney} tick={{ fontSize: 11, fill: 'var(--text-muted)' }} width={48} />
                <Tooltip
                  formatter={(v: any) => money(Number(v))}
                  contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, color: 'var(--text)' }}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar yAxisId="l" dataKey="income" name="Entrées" fill="#10B981" radius={[4, 4, 0, 0]} />
                <Bar yAxisId="l" dataKey="expense" name="Sorties" fill="#EF4444" radius={[4, 4, 0, 0]} />
                <Line yAxisId="r" type="monotone" dataKey="closingBalance" name="Solde en caisse" stroke="#0EA5E9" strokeWidth={2} dot={{ r: 3 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <CategoryBars title="Dépenses par catégorie" items={data.expenseByCategory} color="#EF4444" />
        <CategoryBars title="Entrées par catégorie" items={data.incomeByCategory} color="#10B981" />
      </div>

      <div className={`${cardCls} p-5`}>
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <h3 className="text-sm font-bold text-[var(--text)]">Budget et réel</h3>
          {data.budgetTotals.budget > 0 && (
            <span className="text-xs text-[var(--text-muted)]">
              Total : {money(data.budgetTotals.spent)} / {money(data.budgetTotals.budget)}
            </span>
          )}
        </div>
        <BudgetList rows={data.budgetComparison} />
      </div>
    </div>
  );
}

// ── Modal opération (création / modification) ─────────────────────────────────
interface TxFormState {
  type: FinanceFlow;
  categoryId: string;
  label: string;
  quantity: string;
  unitPrice: string;
  date: string;
  counterparty: string;
  note: string;
}

function TransactionModal({
  tx, categories, defaultType, onClose, onSaved, notify,
}: {
  tx: FinanceTransaction | null;
  categories: FinanceCategory[];
  defaultType: FinanceFlow;
  onClose: () => void;
  onSaved: () => void;
  notify: Notify;
}) {
  const editing = !!tx;
  const [form, setForm] = useState<TxFormState>({
    type: tx?.type ?? defaultType,
    categoryId: tx?.categoryId ?? '',
    label: tx?.label ?? '',
    quantity: tx ? String(tx.quantity) : '1',
    unitPrice: tx ? String(tx.unitPrice) : '',
    date: tx?.date ?? toYmd(new Date()),
    counterparty: tx?.counterparty ?? '',
    note: tx?.note ?? '',
  });
  const [file, setFile] = useState<File | null>(null);
  const [removeReceipt, setRemoveReceipt] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const typeCats = useMemo(() => {
    const list = categories.filter((c) => c.type === form.type);
    // Opération liée à une catégorie archivée : on la garde sélectionnable
    if (tx?.category && tx.type === form.type && !list.some((c) => c.id === tx.categoryId)) {
      list.push({
        id: tx.categoryId,
        name: `${tx.category.name} (archivée)`,
        type: tx.type,
        color: tx.category.color,
        isActive: false,
      });
    }
    return list;
  }, [categories, form.type, tx]);

  // Catégorie par défaut = première de ce type
  useEffect(() => {
    if (!typeCats.some((c) => c.id === form.categoryId)) {
      setForm((f) => ({ ...f, categoryId: typeCats[0]?.id ?? '' }));
    }
  }, [typeCats, form.categoryId]);

  const qty = parseNum(form.quantity || '1');
  const price = parseNum(form.unitPrice || '0');
  const total = Number.isFinite(qty) && Number.isFinite(price) ? Math.round(qty * price * 100) / 100 : 0;

  const set = (k: keyof TxFormState, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.label.trim()) return setError('Le libellé est obligatoire.');
    if (!form.categoryId) return setError('Choisissez une catégorie.');
    if (!Number.isFinite(qty) || qty <= 0) return setError('La quantité doit être supérieure à 0.');
    if (!Number.isFinite(price) || price < 0) return setError('Le prix unitaire est invalide.');
    if (!form.date) return setError('La date est obligatoire.');

    setSaving(true);
    try {
      let saved: FinanceTransaction;
      if (editing && tx) {
        saved = await financeApi.updateTransaction(tx.id, {
          categoryId: form.categoryId,
          label: form.label.trim(),
          quantity: qty,
          unitPrice: price,
          date: form.date,
          counterparty: form.counterparty.trim(),
          note: form.note.trim(),
        });
        if (removeReceipt && !file && tx.receiptUrl) await financeApi.deleteReceipt(tx.id);
      } else {
        saved = await financeApi.createTransaction({
          type: form.type,
          categoryId: form.categoryId,
          label: form.label.trim(),
          quantity: qty,
          unitPrice: price,
          date: form.date,
          counterparty: form.counterparty.trim() || undefined,
          note: form.note.trim() || undefined,
        });
      }
      if (file) {
        try {
          await financeApi.uploadReceipt(saved.id, file);
        } catch (ue) {
          notify(`Opération enregistrée, mais le justificatif a échoué : ${errMsg(ue)}`, 'err');
          onSaved();
          onClose();
          return;
        }
      }
      notify(editing ? 'Opération modifiée.' : 'Opération enregistrée.');
      onSaved();
      onClose();
    } catch (ex) {
      setError(errMsg(ex));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4" onClick={onClose}>
      <form
        onSubmit={submit}
        onClick={(e) => e.stopPropagation()}
        className="w-full sm:max-w-lg max-h-[92vh] overflow-y-auto bg-[var(--surface)] border border-[var(--border)] rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl"
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-extrabold text-[var(--text)]">
            {editing ? "Modifier l'opération" : 'Nouvelle opération'}
          </h2>
          <button type="button" onClick={onClose} className="p-2 rounded-lg hover:bg-[var(--surface-2)] text-[var(--text-muted)]">
            <X size={18} />
          </button>
        </div>

        {!editing && (
          <div className="grid grid-cols-2 gap-2 mb-4 p-1 rounded-2xl bg-[var(--surface-2)]">
            {(['EXPENSE', 'INCOME'] as FinanceFlow[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => set('type', t)}
                className={`py-2.5 rounded-xl text-sm font-bold transition-colors ${
                  form.type === t
                    ? t === 'EXPENSE' ? 'bg-red-500 text-white' : 'bg-emerald-600 text-white'
                    : 'text-[var(--text-muted)]'
                }`}
              >
                {t === 'EXPENSE' ? 'Sortie (dépense)' : 'Entrée (gain)'}
              </button>
            ))}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className={labelCls}>Libellé</label>
            <input
              className={inputCls}
              value={form.label}
              onChange={(e) => set('label', e.target.value)}
              placeholder={form.type === 'EXPENSE' ? 'Ex : Achat ordinateurs portables' : 'Ex : Vente de marchandises'}
              maxLength={255}
              autoFocus
            />
          </div>

          <div>
            <label className={labelCls}>Catégorie</label>
            <select className={inputCls} value={form.categoryId} onChange={(e) => set('categoryId', e.target.value)}>
              {typeCats.length === 0 && <option value="">Aucune catégorie — créez-en dans Paramètres</option>}
              {typeCats.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Quantité</label>
              <input className={inputCls} inputMode="decimal" value={form.quantity} onChange={(e) => set('quantity', e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>Prix unitaire (FCFA)</label>
              <input className={inputCls} inputMode="decimal" value={form.unitPrice} onChange={(e) => set('unitPrice', e.target.value)} placeholder="0" />
            </div>
          </div>

          <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-[var(--surface-2)] border border-[var(--border)]">
            <span className="text-xs font-bold uppercase text-[var(--text-muted)]">Total</span>
            <span className="text-lg font-extrabold text-[var(--text)]">{money(total)}</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Date</label>
              <input type="date" className={inputCls} value={form.date} max={toYmd(new Date())} onChange={(e) => set('date', e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>{form.type === 'EXPENSE' ? 'Fournisseur' : 'Client'} (facultatif)</label>
              <input className={inputCls} value={form.counterparty} onChange={(e) => set('counterparty', e.target.value)} maxLength={255} />
            </div>
          </div>

          <div>
            <label className={labelCls}>Note (facultatif)</label>
            <textarea className={`${inputCls} resize-none`} rows={2} value={form.note} onChange={(e) => set('note', e.target.value)} maxLength={2000} />
          </div>

          <div>
            <label className={labelCls}>Justificatif (photo ou PDF, facultatif)</label>
            {tx?.receiptUrl && !removeReceipt && !file && (
              <div className="flex items-center justify-between gap-2 mb-2 px-3 py-2 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-sm">
                <a href={tx.receiptUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-sky-500 hover:underline">
                  <Paperclip size={14} /> Voir le justificatif <ExternalLink size={12} />
                </a>
                <button type="button" onClick={() => setRemoveReceipt(true)} className="text-xs text-red-500 hover:underline">Retirer</button>
              </div>
            )}
            {removeReceipt && !file && (
              <p className="text-xs text-amber-500 mb-2">Le justificatif sera retiré à l'enregistrement.</p>
            )}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,application/pdf"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="block w-full text-sm text-[var(--text-muted)] file:mr-3 file:py-2 file:px-3.5 file:rounded-lg file:border-0 file:bg-[var(--surface-2)] file:text-[var(--text)] file:font-medium hover:file:bg-[var(--border)]"
            />
          </div>

          {error && (
            <div className="flex items-start gap-2 text-sm text-red-500 bg-red-500/10 rounded-xl px-3.5 py-3">
              <AlertCircle size={16} className="mt-0.5 shrink-0" /> <span>{error}</span>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={onClose} className={btnGhost}>Annuler</button>
            <button type="submit" disabled={saving} className={btnPrimary}>
              {saving && <Loader2 size={15} className="animate-spin" />}
              {editing ? 'Enregistrer' : 'Ajouter'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

// ── Onglet Opérations ─────────────────────────────────────────────────────────
function TransactionsTab({
  from, to, categories, version, onChanged, notify,
}: {
  from: string; to: string; categories: FinanceCategory[]; version: number; onChanged: () => void; notify: Notify;
}) {
  const [type, setType] = useState<'' | FinanceFlow>('');
  const [categoryId, setCategoryId] = useState('');
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [page, setPage] = useState(1);
  const [data, setData] = useState<Awaited<ReturnType<typeof financeApi.getTransactions>> | null>(null);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<{ tx: FinanceTransaction | null; type: FinanceFlow } | null>(null);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => { setPage(1); }, [from, to, type, categoryId, debounced]);

  // Catégorie incompatible avec le type filtré → on la réinitialise
  useEffect(() => {
    if (categoryId && type) {
      const c = categories.find((x) => x.id === categoryId);
      if (c && c.type !== type) setCategoryId('');
    }
  }, [type, categoryId, categories]);

  const load = useCallback(() => {
    let cancelled = false;
    setLoading(true);
    financeApi
      .getTransactions({
        from, to,
        type: type || undefined,
        categoryId: categoryId || undefined,
        search: debounced || undefined,
        page, limit: 25,
      })
      .then((d) => { if (!cancelled) setData(d); })
      .catch((e) => { if (!cancelled) notify(errMsg(e), 'err'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [from, to, type, categoryId, debounced, page, notify]);

  useEffect(() => load(), [load, version]);

  const remove = async (tx: FinanceTransaction) => {
    if (!window.confirm(`Supprimer « ${tx.label} » (${money(tx.amount)}) ?`)) return;
    try {
      await financeApi.deleteTransaction(tx.id);
      notify('Opération supprimée.');
      onChanged();
    } catch (e) {
      notify(errMsg(e), 'err');
    }
  };

  const exportCsv = async () => {
    setExporting(true);
    try {
      const { items } = await financeApi.exportTransactions({
        from, to, type: type || undefined, categoryId: categoryId || undefined, search: debounced || undefined,
      });
      const esc = (v: string | number) => `"${String(v ?? '').replace(/"/g, '""')}"`;
      const header = ['Date', 'Type', 'Catégorie', 'Libellé', 'Tiers', 'Quantité', 'Prix unitaire', 'Total', 'Note'];
      const lines = items.map((t) => [
        frDate(t.date),
        t.type === 'EXPENSE' ? 'Sortie' : 'Entrée',
        t.category?.name ?? '',
        t.label,
        t.counterparty ?? '',
        String(t.quantity).replace('.', ','),
        String(t.unitPrice).replace('.', ','),
        String(t.amount).replace('.', ','),
        t.note ?? '',
      ].map(esc).join(';'));
      const csv = '\uFEFF' + [header.map(esc).join(';'), ...lines].join('\r\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `finances_${from}_${to}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      if (items.length >= 5000) notify('Export limité aux 5 000 premières opérations.', 'err');
    } catch (e) {
      notify(errMsg(e), 'err');
    } finally {
      setExporting(false);
    }
  };

  const visibleCats = categories.filter((c) => !type || c.type === type);
  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.limit)) : 1;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2.5 items-center">
        <div className="relative flex-1 min-w-[180px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input className={`${inputCls} pl-9`} placeholder="Rechercher (libellé, fournisseur…)" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select className={`${inputCls} !w-auto`} value={type} onChange={(e) => setType(e.target.value as '' | FinanceFlow)}>
          <option value="">Tout</option>
          <option value="EXPENSE">Sorties</option>
          <option value="INCOME">Entrées</option>
        </select>
        <select className={`${inputCls} !w-auto max-w-[200px]`} value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
          <option value="">Toutes catégories</option>
          {visibleCats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <button onClick={exportCsv} disabled={exporting} className={btnGhost}>
          {exporting ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />} CSV
        </button>
        <button onClick={() => setModal({ tx: null, type: 'EXPENSE' })} className={btnPrimary}>
          <Plus size={16} /> Nouvelle opération
        </button>
      </div>

      {data && (
        <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
          <span className="text-[var(--text-muted)]">Entrées : <b className="text-emerald-500">{money(data.totals.income)}</b></span>
          <span className="text-[var(--text-muted)]">Sorties : <b className="text-red-500">{money(data.totals.expense)}</b></span>
          <span className="text-[var(--text-muted)]">{data.total} opération(s)</span>
        </div>
      )}

      <div className={`${cardCls} overflow-hidden`}>
        {loading && !data ? (
          <Spinner />
        ) : !data || data.items.length === 0 ? (
          <Empty text="Aucune opération sur cette période." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase text-[var(--text-muted)] border-b border-[var(--border)]">
                  <th className="px-4 py-3 font-bold">Date</th>
                  <th className="px-4 py-3 font-bold">Libellé</th>
                  <th className="px-4 py-3 font-bold hidden md:table-cell">Catégorie</th>
                  <th className="px-4 py-3 font-bold text-right hidden sm:table-cell">Qté × PU</th>
                  <th className="px-4 py-3 font-bold text-right">Total</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {data.items.map((t) => (
                  <tr key={t.id} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--surface-2)]/60">
                    <td className="px-4 py-3 whitespace-nowrap text-[var(--text-muted)]">{frDate(t.date)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {t.type === 'EXPENSE'
                          ? <ArrowUpCircle size={15} className="text-red-500 shrink-0" />
                          : <ArrowDownCircle size={15} className="text-emerald-500 shrink-0" />}
                        <div className="min-w-0">
                          <div className="font-medium text-[var(--text)] truncate max-w-[260px]">{t.label}</div>
                          {t.counterparty && <div className="text-xs text-[var(--text-muted)] truncate">{t.counterparty}</div>}
                        </div>
                        {t.receiptUrl && (
                          <a href={t.receiptUrl} target="_blank" rel="noreferrer" title="Voir le justificatif" className="text-sky-500 shrink-0">
                            <Paperclip size={14} />
                          </a>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-[var(--surface-2)] text-[var(--text)]">
                        <span className="w-2 h-2 rounded-full" style={{ background: t.category?.color || '#64748B' }} />
                        {t.category?.name ?? '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-[var(--text-muted)] whitespace-nowrap hidden sm:table-cell">
                      {nf.format(t.quantity)} × {nf.format(t.unitPrice)}
                    </td>
                    <td className={`px-4 py-3 text-right font-bold whitespace-nowrap ${t.type === 'EXPENSE' ? 'text-red-500' : 'text-emerald-500'}`}>
                      {t.type === 'EXPENSE' ? '−' : '+'}{nf.format(t.amount)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right">
                      <button onClick={() => setModal({ tx: t, type: t.type })} className="p-1.5 rounded-lg hover:bg-[var(--surface-2)] text-sky-500" title="Modifier">
                        <Pencil size={15} />
                      </button>
                      <button onClick={() => remove(t)} className="p-1.5 rounded-lg hover:bg-[var(--surface-2)] text-red-500" title="Supprimer">
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {data && totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className={btnGhost}><ChevronLeft size={16} /></button>
          <span className="text-sm text-[var(--text-muted)]">Page {page} / {totalPages}</span>
          <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} className={btnGhost}><ChevronRight size={16} /></button>
        </div>
      )}

      {modal && (
        <TransactionModal
          tx={modal.tx}
          categories={categories}
          defaultType={modal.type}
          onClose={() => setModal(null)}
          onSaved={onChanged}
          notify={notify}
        />
      )}
    </div>
  );
}

// ── Onglet Budgets ────────────────────────────────────────────────────────────
function BudgetsTab({ version, onChanged, notify }: { version: number; onChanged: () => void; notify: Notify }) {
  const now = new Date();
  const [ym, setYm] = useState(`${now.getFullYear()}-${pad(now.getMonth() + 1)}`);
  const [data, setData] = useState<BudgetsMonth | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    const [y, m] = ym.split('-').map(Number);
    if (!y || !m) return;
    let cancelled = false;
    setLoading(true);
    financeApi
      .getBudgets(y, m)
      .then((d) => { if (!cancelled) setData(d); })
      .catch((e) => { if (!cancelled) notify(errMsg(e), 'err'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [ym, version, reload, notify]);

  const save = async (row: BudgetRow, raw: string) => {
    const amount = raw.trim() === '' ? 0 : parseNum(raw);
    if (!Number.isFinite(amount) || amount < 0) return notify('Montant de budget invalide.', 'err');
    if (amount === row.budget) return;
    const [y, m] = ym.split('-').map(Number);
    setSavingId(row.categoryId);
    try {
      await financeApi.setBudget({ categoryId: row.categoryId, year: y, month: m, amount });
      notify('Budget enregistré.');
      setReload((r) => r + 1);
      onChanged();
    } catch (e) {
      notify(errMsg(e), 'err');
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div>
          <label className={labelCls}>Mois</label>
          <input type="month" className={`${inputCls} !w-auto`} value={ym} onChange={(e) => e.target.value && setYm(e.target.value)} />
        </div>
        {data && (
          <div className="text-sm text-[var(--text-muted)] sm:ml-auto sm:text-right">
            Budget total : <b className="text-[var(--text)]">{money(data.totals.budget)}</b><br />
            Dépensé : <b className="text-[var(--text)]">{money(data.totals.spent)}</b>
          </div>
        )}
      </div>

      <div className={`${cardCls} p-5`}>
        {loading && !data ? (
          <Spinner />
        ) : !data || data.rows.length === 0 ? (
          <Empty text="Aucune catégorie de dépenses. Créez-en dans l'onglet Paramètres." />
        ) : (
          <div className="space-y-5">
            {data.rows.map((r) => {
              const over = r.budget > 0 && r.spent > r.budget;
              return (
                <div key={r.categoryId} className="grid grid-cols-1 sm:grid-cols-[1fr_190px] gap-x-6 gap-y-2 items-center">
                  <div>
                    <div className="flex justify-between text-sm mb-1.5">
                      <span className="font-medium text-[var(--text)] flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ background: r.color || '#64748B' }} />
                        {r.name}
                      </span>
                      <span className="text-[var(--text-muted)]">
                        {money(r.spent)}
                        {r.percent !== null && <span className={`ml-1 text-xs font-bold ${over ? 'text-red-500' : ''}`}>{r.percent}%</span>}
                      </span>
                    </div>
                    {r.budget > 0
                      ? <Bar100 percent={r.percent ?? 0} over={over} color={r.color} />
                      : <p className="text-xs text-[var(--text-muted)]">Pas de budget défini</p>}
                    {over && <p className="text-xs text-red-500 mt-1">Dépassement de {money(r.spent - r.budget)}</p>}
                  </div>
                  <div className="relative">
                    <input
                      key={`${ym}-${r.categoryId}-${r.budget}`}
                      className={`${inputCls} pr-14 text-right`}
                      inputMode="decimal"
                      defaultValue={r.budget > 0 ? String(r.budget) : ''}
                      placeholder="Budget"
                      onBlur={(e) => save(r, e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[var(--text-muted)]">
                      {savingId === r.categoryId ? <Loader2 size={13} className="animate-spin" /> : 'FCFA'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      <p className="text-xs text-[var(--text-muted)]">
        Saisissez un montant puis validez (Entrée ou clic ailleurs). Laissez vide ou 0 pour retirer le budget.
      </p>
    </div>
  );
}

// ── Onglet Paramètres ─────────────────────────────────────────────────────────
function CategoryColumn({
  title, type, items, onChanged, notify,
}: {
  title: string; type: FinanceFlow; items: FinanceCategory[]; onChanged: () => void; notify: Notify;
}) {
  const [name, setName] = useState('');
  const [color, setColor] = useState(type === 'EXPENSE' ? '#EF4444' : '#10B981');
  const [adding, setAdding] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setAdding(true);
    try {
      await financeApi.createCategory({ name: name.trim(), type, color });
      setName('');
      onChanged();
    } catch (ex) {
      notify(errMsg(ex), 'err');
    } finally {
      setAdding(false);
    }
  };

  const rename = async (c: FinanceCategory) => {
    const n = editName.trim();
    setEditId(null);
    if (!n || n === c.name) return;
    try {
      await financeApi.updateCategory(c.id, { name: n });
      onChanged();
    } catch (ex) {
      notify(errMsg(ex), 'err');
    }
  };

  const remove = async (c: FinanceCategory) => {
    if (!window.confirm(`Supprimer la catégorie « ${c.name} » ? (archivée si elle contient des opérations)`)) return;
    try {
      const r = await financeApi.deleteCategory(c.id);
      notify(r.archived ? 'Catégorie archivée (elle contient des opérations).' : 'Catégorie supprimée.');
      onChanged();
    } catch (ex) {
      notify(errMsg(ex), 'err');
    }
  };

  const reactivate = async (c: FinanceCategory) => {
    try {
      await financeApi.updateCategory(c.id, { isActive: true });
      onChanged();
    } catch (ex) {
      notify(errMsg(ex), 'err');
    }
  };

  return (
    <div className={`${cardCls} p-5`}>
      <h3 className="text-sm font-bold text-[var(--text)] mb-4">{title}</h3>
      <div className="space-y-1.5 mb-4">
        {items.length === 0 && <Empty text="Aucune catégorie." />}
        {items.map((c) => (
          <div key={c.id} className={`flex items-center gap-2 px-3 py-2 rounded-xl bg-[var(--surface-2)] ${c.isActive ? '' : 'opacity-60'}`}>
            <span className="w-3 h-3 rounded-full shrink-0" style={{ background: c.color || '#64748B' }} />
            {editId === c.id ? (
              <input
                autoFocus
                className="flex-1 min-w-0 bg-transparent border-b border-emerald-500 outline-none text-sm text-[var(--text)]"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onBlur={() => rename(c)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
                  if (e.key === 'Escape') setEditId(null);
                }}
                maxLength={100}
              />
            ) : (
              <span className="flex-1 min-w-0 truncate text-sm text-[var(--text)]">
                {c.name} {!c.isActive && <em className="text-xs text-[var(--text-muted)]">(archivée)</em>}
              </span>
            )}
            {c.isActive ? (
              <>
                <button onClick={() => { setEditId(c.id); setEditName(c.name); }} className="p-1 text-sky-500" title="Renommer"><Pencil size={14} /></button>
                <button onClick={() => remove(c)} className="p-1 text-red-500" title="Supprimer / archiver"><Archive size={14} /></button>
              </>
            ) : (
              <button onClick={() => reactivate(c)} className="p-1 text-emerald-500" title="Réactiver"><RotateCcw size={14} /></button>
            )}
          </div>
        ))}
      </div>
      <form onSubmit={add} className="flex gap-2">
        <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="w-10 h-10 rounded-lg border border-[var(--border)] bg-transparent cursor-pointer shrink-0" title="Couleur" />
        <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} placeholder="Nouvelle catégorie" maxLength={100} />
        <button type="submit" disabled={adding || !name.trim()} className={btnPrimary}>
          {adding ? <Loader2 size={15} className="animate-spin" /> : <Plus size={16} />}
        </button>
      </form>
    </div>
  );
}

function SettingsTab({ onChanged, notify }: { onChanged: () => void; notify: Notify }) {
  const [settings, setSettings] = useState<FinanceSettings | null>(null);
  const [balance, setBalance] = useState('');
  const [date, setDate] = useState('');
  const [saving, setSaving] = useState(false);
  const [cats, setCats] = useState<FinanceCategory[]>([]);
  const [loading, setLoading] = useState(true);

  const loadCats = useCallback(() => {
    financeApi.getCategories({ includeInactive: true }).then(setCats).catch((e) => notify(errMsg(e), 'err'));
  }, [notify]);

  useEffect(() => {
    Promise.all([financeApi.getSettings(), financeApi.getCategories({ includeInactive: true })])
      .then(([s, c]) => {
        setSettings(s);
        setBalance(String(s.openingBalance));
        setDate(s.openingDate);
        setCats(c);
      })
      .catch((e) => notify(errMsg(e), 'err'))
      .finally(() => setLoading(false));
  }, [notify]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const b = parseNum(balance === '' ? '0' : balance);
    if (!Number.isFinite(b)) return notify('Solde de départ invalide.', 'err');
    setSaving(true);
    try {
      const s = await financeApi.updateSettings({ openingBalance: b, openingDate: date });
      setSettings(s);
      notify('Paramètres enregistrés.');
      onChanged();
    } catch (ex) {
      notify(errMsg(ex), 'err');
    } finally {
      setSaving(false);
    }
  };

  const catsChanged = () => { loadCats(); onChanged(); };

  if (loading) return <Spinner />;

  return (
    <div className="space-y-5">
      <form onSubmit={save} className={`${cardCls} p-5`}>
        <h3 className="text-sm font-bold text-[var(--text)] mb-1">Caisse — solde de départ</h3>
        <p className="text-xs text-[var(--text-muted)] mb-4">
          Montant disponible au début du suivi. Le solde actuel = solde de départ + entrées − sorties depuis cette date.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-3 items-end">
          <div>
            <label className={labelCls}>Solde de départ (FCFA)</label>
            <input className={inputCls} inputMode="decimal" value={balance} onChange={(e) => setBalance(e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>Au (date)</label>
            <input type="date" className={inputCls} value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <button type="submit" disabled={saving || !settings} className={btnPrimary}>
            {saving ? <Loader2 size={15} className="animate-spin" /> : <Check size={16} />} Enregistrer
          </button>
        </div>
      </form>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <CategoryColumn title="Catégories de dépenses" type="EXPENSE" items={cats.filter((c) => c.type === 'EXPENSE')} onChanged={catsChanged} notify={notify} />
        <CategoryColumn title="Catégories d'entrées" type="INCOME" items={cats.filter((c) => c.type === 'INCOME')} onChanged={catsChanged} notify={notify} />
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
type TabKey = 'dashboard' | 'transactions' | 'budgets' | 'settings';
const TABS: { key: TabKey; label: string; icon: React.ReactNode }[] = [
  { key: 'dashboard', label: 'Tableau de bord', icon: <BarChart3 size={16} /> },
  { key: 'transactions', label: 'Opérations', icon: <ListOrdered size={16} /> },
  { key: 'budgets', label: 'Budgets', icon: <Target size={16} /> },
  { key: 'settings', label: 'Paramètres', icon: <Settings2 size={16} /> },
];

export default function FinancesPage() {
  const [status, setStatus] = useState<'loading' | 'ready' | 'disabled' | 'forbidden' | 'error'>('loading');
  const [tab, setTab] = useState<TabKey>('dashboard');
  const [preset, setPreset] = useState<PresetKey>('month');
  const [range, setRange] = useState(presetRange('month'));
  const [categories, setCategories] = useState<FinanceCategory[]>([]);
  const [version, setVersion] = useState(0);
  const [toast, setToast] = useState<{ msg: string; kind: 'ok' | 'err' } | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const notify: Notify = useCallback((msg, kind = 'ok') => {
    setToast({ msg, kind });
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), kind === 'err' ? 6000 : 3000);
  }, []);

  useEffect(() => () => { if (toastTimer.current) clearTimeout(toastTimer.current); }, []);

  useEffect(() => {
    financeApi
      .getStatus()
      .then((s) => setStatus(s.enabled ? 'ready' : 'disabled'))
      .catch((e: any) => setStatus(e?.status === 403 ? 'forbidden' : 'error'));
  }, []);

  const loadCategories = useCallback(() => {
    financeApi.getCategories().then(setCategories).catch((e) => notify(errMsg(e), 'err'));
  }, [notify]);

  useEffect(() => { if (status === 'ready') loadCategories(); }, [status, loadCategories, version]);

  const changed = useCallback(() => setVersion((v) => v + 1), []);

  const pickPreset = (key: PresetKey) => {
    setPreset(key);
    if (key !== 'custom') setRange(presetRange(key));
  };

  const setCustom = (k: 'from' | 'to', v: string) => {
    if (!v) return;
    setPreset('custom');
    setRange((r) => {
      const next = { ...r, [k]: v };
      // garde from ≤ to
      if (next.from > next.to) return { from: v, to: v };
      return next;
    });
  };

  if (status === 'loading') return <Spinner />;

  if (status !== 'ready') {
    const text =
      status === 'forbidden'
        ? "Le module Finances est réservé à l'administrateur de l'entreprise."
        : status === 'disabled'
          ? "Le module Finances n'est pas activé pour votre entreprise."
          : 'Impossible de charger le module Finances pour le moment.';
    return (
      <div className="max-w-md mx-auto mt-24 text-center px-6">
        <div className="w-14 h-14 rounded-2xl bg-[var(--surface-2)] flex items-center justify-center mx-auto mb-4 text-[var(--text-muted)]">
          <Wallet size={26} />
        </div>
        <p className="text-[var(--text)] font-semibold">{text}</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6">
      {toast && (
        <div
          className={`fixed top-4 right-4 z-[100] max-w-sm px-4 py-3 rounded-xl text-sm font-medium shadow-xl text-white ${
            toast.kind === 'err' ? 'bg-red-600' : 'bg-emerald-600'
          }`}
        >
          {toast.msg}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-[var(--text)] flex items-center gap-2.5">
            <Wallet className="text-emerald-500" size={26} /> Finances
          </h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">Caisse, dépenses, entrées et budgets.</p>
        </div>
      </div>

      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-colors ${
              tab === t.key ? 'bg-emerald-600 text-white' : 'bg-[var(--surface)] border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)]'
            }`}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {(tab === 'dashboard' || tab === 'transactions') && (
        <div className={`${cardCls} p-4 flex flex-wrap items-end gap-3`}>
          <div className="flex flex-wrap gap-1.5">
            {PRESETS.map((p) => (
              <button
                key={p.key}
                onClick={() => pickPreset(p.key)}
                className={`px-3 py-2 rounded-lg text-xs font-bold transition-colors ${
                  preset === p.key ? 'bg-emerald-600 text-white' : 'bg-[var(--surface-2)] text-[var(--text-muted)] hover:text-[var(--text)]'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
          <div className="flex items-end gap-2 sm:ml-auto">
            <div>
              <label className={labelCls}>Du</label>
              <input type="date" className={`${inputCls} !w-auto`} value={range.from} onChange={(e) => setCustom('from', e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>Au</label>
              <input type="date" className={`${inputCls} !w-auto`} value={range.to} onChange={(e) => setCustom('to', e.target.value)} />
            </div>
          </div>
        </div>
      )}

      {tab === 'dashboard' && <DashboardTab from={range.from} to={range.to} version={version} notify={notify} />}
      {tab === 'transactions' && (
        <TransactionsTab from={range.from} to={range.to} categories={categories} version={version} onChanged={changed} notify={notify} />
      )}
      {tab === 'budgets' && <BudgetsTab version={version} onChanged={changed} notify={notify} />}
      {tab === 'settings' && <SettingsTab onChanged={changed} notify={notify} />}
    </div>
  );
}