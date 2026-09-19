'use client';

// app/(dashboard)/portefeuille/prets/page.tsx

import React, { useEffect, useState, useMemo } from 'react';
import {
  HandCoins, Search, Loader2, AlertCircle, CheckCircle2, XCircle,
  Plus, Trash2, X, Ban,
} from 'lucide-react';
import { GlobalLoader } from '@/components/ui/GlobalLoader';
import { api } from '@/services/api';

// ─── Types ────────────────────────────────────────────────────────────────────

interface PortfolioCompany { id: string; name: string; }

interface PortfolioEmployee {
  id: string; firstName: string; lastName: string; employeeNumber: string;
  companyId: string; company: { id: string; legalName: string; tradeName: string | null };
}

interface LoanOrAdvance {
  id: string;
  kind: 'loan' | 'advance';
  amount: number;
  status: string;
  reason: string;
  createdAt: string;
  employee: { id: string; firstName: string; lastName: string; companyId: string; company: { id: string; legalName: string; tradeName: string | null } };
}

const MONTHS = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
];
const CURRENT_YEAR = new Date().getFullYear();

const STATUS_META: Record<string, { label: string; cls: string }> = {
  PENDING: { label: 'En attente', cls: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  PENDING_DG: { label: 'En attente DG', cls: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  APPROVED: { label: 'Approuvé', cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
  ACTIVE: { label: 'Actif', cls: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400' },
  PAID: { label: 'Payé', cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
  DEDUCTED: { label: 'Déduit', cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
  REJECTED: { label: 'Refusé', cls: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
  CANCELLED: { label: 'Annulé', cls: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300' },
};

const fmtFCFA = (n: number) => new Intl.NumberFormat('fr-FR').format(Math.round(n || 0)) + ' FCFA';
const isPending = (status: string) => status === 'PENDING' || status === 'PENDING_DG';
const inputCls = "w-full px-3 py-2.5 rounded-xl text-sm bg-[var(--surface-2)] border border-[var(--border)]";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>{label}</label>
      {children}
    </div>
  );
}

// ─── Sélecteur employé ─────────────────────────────────────────────────────────

function EmployeePicker({ companies, onSelect, selected }: {
  companies: PortfolioCompany[]; onSelect: (e: PortfolioEmployee | null) => void; selected: PortfolioEmployee | null;
}) {
  const [companyId, setCompanyId] = useState('');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<PortfolioEmployee[]>([]);
  const [searching, setSearching] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!query && !companyId) { setResults([]); return; }
    setSearching(true);
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    if (companyId) params.set('companyId', companyId);
    const t = setTimeout(() => {
      api.get<PortfolioEmployee[]>(`/portfolio/employees?${params.toString()}`)
        .then(list => setResults(list ?? []))
        .catch(() => setResults([]))
        .finally(() => setSearching(false));
    }, 300);
    return () => clearTimeout(t);
  }, [query, companyId]);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="Entreprise">
          <select value={companyId} onChange={e => { setCompanyId(e.target.value); onSelect(null); }} className={inputCls} style={{ color: 'var(--text)' }}>
            <option value="">Toutes les entreprises</option>
            {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </Field>
        <Field label="Employé">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              value={selected ? `${selected.firstName} ${selected.lastName}` : query}
              onChange={e => { setQuery(e.target.value); onSelect(null); setOpen(true); }}
              onFocus={() => setOpen(true)}
              placeholder="Rechercher un nom..."
              className="w-full pl-9 pr-3 py-2.5 rounded-xl text-sm bg-[var(--surface-2)] border border-[var(--border)]"
              style={{ color: 'var(--text)' }}
            />
            {searching && <Loader2 size={14} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-emerald-400" />}
          </div>
        </Field>
      </div>
      {open && !selected && results.length > 0 && (
        <div className="rounded-xl overflow-hidden max-h-56 overflow-y-auto" style={{ border: '1px solid var(--border)' }}>
          {results.map(emp => (
            <button key={emp.id} onClick={() => { onSelect(emp); setOpen(false); }} className="w-full flex items-center justify-between px-3 py-2.5 text-left transition-colors hover:bg-[var(--surface-2)]" style={{ borderBottom: '1px solid var(--border)' }}>
              <div>
                <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>{emp.firstName} {emp.lastName}</p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{emp.employeeNumber} · {emp.company.tradeName || emp.company.legalName}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Modal création ───────────────────────────────────────────────────────────

function CreateModal({ companies, onClose, onCreated }: {
  companies: PortfolioCompany[]; onClose: () => void; onCreated: () => void;
}) {
  const [type, setType] = useState<'loan' | 'advance'>('loan');
  const [employee, setEmployee] = useState<PortfolioEmployee | null>(null);
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [monthlyRepayment, setMonthlyRepayment] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [deductMonth, setDeductMonth] = useState(new Date().getMonth() + 1);
  const [deductYear, setDeductYear] = useState(CURRENT_YEAR);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!employee || !amount || !reason) { setError('Employé, montant et motif sont obligatoires'); return; }
    setSaving(true);
    setError('');
    try {
      if (type === 'loan') {
        if (!monthlyRepayment || !startDate || !endDate) { setError('Remboursement mensuel et dates sont obligatoires'); setSaving(false); return; }
        await api.post('/portfolio/loans', {
          employeeId: employee.id,
          amount: Number(amount),
          monthlyRepayment: Number(monthlyRepayment),
          startDate, endDate, reason,
        });
      } else {
        await api.post('/portfolio/loans/advances', {
          employeeId: employee.id,
          amount: Number(amount),
          deductMonth, deductYear, reason,
        });
      }
      onCreated();
    } catch (e: any) {
      setError(e.message || 'Erreur lors de la création');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => !saving && onClose()} />
      <div className="relative w-full max-w-lg rounded-2xl overflow-hidden z-10" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
          <h2 className="text-sm font-bold" style={{ color: 'var(--text)' }}>Nouvelle demande</h2>
          {!saving && <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[var(--surface-2)]" style={{ color: 'var(--text-muted)' }}><X size={18} /></button>}
        </div>

        <div className="px-6 py-5 space-y-4 max-h-[65vh] overflow-y-auto">
          <div className="flex bg-[var(--surface-2)] p-1 rounded-xl w-fit">
            <button onClick={() => setType('loan')} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${type === 'loan' ? 'bg-[var(--surface)] text-emerald-500 shadow-sm' : ''}`} style={{ color: type === 'loan' ? undefined : 'var(--text-muted)' }}>Prêt</button>
            <button onClick={() => setType('advance')} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${type === 'advance' ? 'bg-[var(--surface)] text-emerald-500 shadow-sm' : ''}`} style={{ color: type === 'advance' ? undefined : 'var(--text-muted)' }}>Avance</button>
          </div>

          <EmployeePicker companies={companies} onSelect={setEmployee} selected={employee} />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Montant (FCFA) *">
              <input type="number" value={amount} onChange={e => setAmount(e.target.value)} className={inputCls} style={{ color: 'var(--text)' }} />
            </Field>
            {type === 'loan' ? (
              <Field label="Remboursement mensuel *">
                <input type="number" value={monthlyRepayment} onChange={e => setMonthlyRepayment(e.target.value)} className={inputCls} style={{ color: 'var(--text)' }} />
              </Field>
            ) : (
              <Field label="Mois de déduction *">
                <select value={deductMonth} onChange={e => setDeductMonth(Number(e.target.value))} className={inputCls} style={{ color: 'var(--text)' }}>
                  {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
                </select>
              </Field>
            )}
          </div>

          {type === 'loan' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Date de début *">
                <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className={inputCls} style={{ color: 'var(--text)' }} />
              </Field>
              <Field label="Date de fin *">
                <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className={inputCls} style={{ color: 'var(--text)' }} />
              </Field>
            </div>
          ) : (
            <Field label="Année de déduction *">
              <input type="number" value={deductYear} onChange={e => setDeductYear(Number(e.target.value))} className={inputCls} style={{ color: 'var(--text)' }} />
            </Field>
          )}

          <Field label="Motif *">
            <textarea value={reason} onChange={e => setReason(e.target.value)} rows={2} className={inputCls} style={{ color: 'var(--text)' }} />
          </Field>
        </div>

        {error && (
          <div className="mx-6 mb-4 flex items-center gap-2 px-4 py-3 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs font-medium">
            <AlertCircle size={14} className="shrink-0" />{error}
          </div>
        )}

        <div className="flex items-center gap-2 px-6 py-4" style={{ borderTop: '1px solid var(--border)' }}>
          <button onClick={handleSubmit} disabled={saving} className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold bg-emerald-500 hover:bg-emerald-600 text-white transition-colors disabled:opacity-60">
            {saving ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />}
            {saving ? 'Création…' : 'Créer la demande'}
          </button>
          <button onClick={onClose} disabled={saving} className="px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-[var(--surface-2)]" style={{ color: 'var(--text-muted)', border: '1px solid var(--border)' }}>Annuler</button>
        </div>
      </div>
    </div>
  );
}

// ─── Modal décision (approuver/refuser) ────────────────────────────────────────

function DecisionModal({ item, approve, onClose, onDone }: {
  item: LoanOrAdvance; approve: boolean; onClose: () => void; onDone: () => void;
}) {
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    setSaving(true);
    setError('');
    try {
      const base = item.kind === 'loan' ? `/portfolio/loans/${item.id}/decision` : `/portfolio/loans/advances/${item.id}/decision`;
      const decision = item.kind === 'loan' ? (approve ? 'OUI' : 'NON') : (approve ? 'APPROVED' : 'REJECTED');
      await api.patch(base, { decision, rejectionReason: approve ? undefined : reason });
      onDone();
    } catch (e: any) {
      setError(e.message || 'Erreur');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => !saving && onClose()} />
      <div className="relative w-full max-w-sm rounded-2xl p-6 z-10" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
        <p className="text-sm font-bold mb-1" style={{ color: 'var(--text)' }}>
          {approve ? 'Approuver' : 'Refuser'} cette demande ?
        </p>
        <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>
          {item.employee.firstName} {item.employee.lastName} · {fmtFCFA(item.amount)}
        </p>
        {!approve && (
          <textarea value={reason} onChange={e => setReason(e.target.value)} placeholder="Motif du refus (optionnel)" rows={2} className={`${inputCls} mb-4`} style={{ color: 'var(--text)' }} />
        )}
        {error && <div className="mb-3 text-xs text-red-500 flex items-center gap-1"><AlertCircle size={13} />{error}</div>}
        <div className="flex gap-2">
          <button onClick={submit} disabled={saving} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white transition-colors disabled:opacity-60 ${approve ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-red-500 hover:bg-red-600'}`}>
            {saving && <Loader2 size={14} className="animate-spin" />}
            Confirmer
          </button>
          <button onClick={onClose} disabled={saving} className="px-4 py-2 rounded-xl text-sm font-medium hover:bg-[var(--surface-2)]" style={{ color: 'var(--text-muted)', border: '1px solid var(--border)' }}>Annuler</button>
        </div>
      </div>
    </div>
  );
}

// ─── Page principale ──────────────────────────────────────────────────────────

export default function PortfolioLoansPage() {
  const [companies, setCompanies] = useState<PortfolioCompany[]>([]);
  const [items, setItems] = useState<LoanOrAdvance[]>([]);
  const [loading, setLoading] = useState(true);
  const [companyFilter, setCompanyFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState<'' | 'loan' | 'advance'>('');
  const [showCreate, setShowCreate] = useState(false);
  const [decisionItem, setDecisionItem] = useState<{ item: LoanOrAdvance; approve: boolean } | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get<PortfolioCompany[]>('/auth/my-companies').then(list => setCompanies(list ?? [])).catch(() => setCompanies([]));
  }, []);

  const load = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (companyFilter) params.set('companyId', companyFilter);
    if (statusFilter) params.set('status', statusFilter);
    if (typeFilter) params.set('type', typeFilter);
    api.get<{ loans: any[]; advances: any[] }>(`/portfolio/loans?${params.toString()}`)
      .then(({ loans = [], advances = [] }) => {
        const merged: LoanOrAdvance[] = [
          ...loans.map(l => ({ ...l, kind: 'loan' as const })),
          ...advances.map(a => ({ ...a, kind: 'advance' as const })),
        ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setItems(merged);
      })
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [companyFilter, statusFilter, typeFilter]);

  const runAction = async (item: LoanOrAdvance, action: 'cancel' | 'delete') => {
    setBusyId(item.id);
    setError('');
    const base = item.kind === 'loan' ? `/portfolio/loans/${item.id}` : `/portfolio/loans/advances/${item.id}`;
    try {
      if (action === 'delete') await api.delete(base);
      else await api.patch(`${base}/cancel`, {});
      setItems(prev => action === 'delete' ? prev.filter(i => i.id !== item.id) : prev.map(i => i.id === item.id ? { ...i, status: 'CANCELLED' } : i));
    } catch (e: any) {
      setError(e.message || "Échec de l'action");
    } finally {
      setBusyId(null);
    }
  };

  const pendingCount = items.filter(i => isPending(i.status)).length;

  if (loading && items.length === 0) return <GlobalLoader />;

  return (
    <div className="space-y-6 min-h-screen pb-20">
      {showCreate && <CreateModal companies={companies} onClose={() => setShowCreate(false)} onCreated={() => { setShowCreate(false); load(); }} />}
      {decisionItem && (
        <DecisionModal
          item={decisionItem.item}
          approve={decisionItem.approve}
          onClose={() => setDecisionItem(null)}
          onDone={() => { setDecisionItem(null); load(); }}
        />
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight" style={{ color: 'var(--text)' }}>Prêts & Avances</h1>
          <p className="mt-1 flex items-center gap-2" style={{ color: 'var(--text-muted)' }}>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            {items.length} demande{items.length > 1 ? 's' : ''} {pendingCount > 0 && `· ${pendingCount} en attente`}
          </p>
        </div>
        <button onClick={() => setShowCreate(true)} disabled={companies.length === 0} className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold transition-colors flex items-center gap-2 disabled:opacity-50">
          <Plus size={18} /> Nouvelle demande
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm font-medium">
          <AlertCircle size={16} className="shrink-0" />{error}
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <select value={companyFilter} onChange={e => setCompanyFilter(e.target.value)} className="px-4 py-2.5 bg-[var(--surface)] border border-[var(--border)] rounded-xl text-sm font-medium" style={{ color: 'var(--text)' }}>
          <option value="">Toutes les entreprises</option>
          {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value as any)} className="px-4 py-2.5 bg-[var(--surface)] border border-[var(--border)] rounded-xl text-sm font-medium" style={{ color: 'var(--text)' }}>
          <option value="">Prêts & avances</option>
          <option value="loan">Prêts uniquement</option>
          <option value="advance">Avances uniquement</option>
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-4 py-2.5 bg-[var(--surface)] border border-[var(--border)] rounded-xl text-sm font-medium" style={{ color: 'var(--text)' }}>
          <option value="">Tous statuts</option>
          <option value="PENDING">En attente</option>
          <option value="APPROVED">Approuvé</option>
          <option value="REJECTED">Refusé</option>
          <option value="CANCELLED">Annulé</option>
        </select>
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center rounded-2xl" style={{ border: '2px dashed var(--border)' }}>
          <HandCoins size={24} style={{ color: 'var(--text-muted)' }} className="mb-3" />
          <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>Aucune demande pour le moment</p>
        </div>
      ) : (
        <div className="rounded-2xl overflow-x-auto" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <div className="grid px-4 py-3" style={{ minWidth: 880, gridTemplateColumns: '1fr 150px 110px 120px 130px 170px', gap: 12, borderBottom: '1px solid var(--border)' }}>
            {['Employé', 'Entreprise', 'Type', 'Montant', 'Statut', ''].map((h, i) => (
              <p key={i} className="text-[11px] font-bold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>{h}</p>
            ))}
          </div>
          {items.map(item => {
            const meta = STATUS_META[item.status] ?? STATUS_META.PENDING;
            const isBusy = busyId === item.id;
            const pending = isPending(item.status);
            const cancellable = !['CANCELLED', 'REJECTED', 'PAID', 'DEDUCTED'].includes(item.status);
            return (
              <div key={`${item.kind}-${item.id}`} className="grid items-center px-4 py-3 transition-colors hover:bg-[var(--surface-2)]"
                style={{ minWidth: 880, gridTemplateColumns: '1fr 150px 110px 120px 130px 170px', gap: 12, borderBottom: '1px solid var(--border)' }}>
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: 'var(--text)' }}>{item.employee.firstName} {item.employee.lastName}</p>
                  <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{item.reason}</p>
                </div>
                <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{item.employee.company.tradeName || item.employee.company.legalName}</p>
                <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>{item.kind === 'loan' ? 'Prêt' : 'Avance'}</span>
                <p className="text-sm font-bold" style={{ color: 'var(--text)' }}>{fmtFCFA(item.amount)}</p>
                <span className={`inline-flex w-fit px-2.5 py-1 rounded-full text-[11px] font-bold ${meta.cls}`}>{meta.label}</span>
                <div className="flex items-center gap-1 justify-self-end">
                  {pending ? (
                    <>
                      <button onClick={() => setDecisionItem({ item, approve: true })} disabled={isBusy} title="Approuver" className="p-2 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-900/20 text-emerald-500 disabled:opacity-50"><CheckCircle2 size={15} /></button>
                      <button onClick={() => setDecisionItem({ item, approve: false })} disabled={isBusy} title="Refuser" className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 disabled:opacity-50"><XCircle size={15} /></button>
                    </>
                  ) : cancellable ? (
                    <button onClick={() => runAction(item, 'cancel')} disabled={isBusy} title="Annuler" className="p-2 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-900/20 text-amber-500 disabled:opacity-50">
                      {isBusy ? <Loader2 size={15} className="animate-spin" /> : <Ban size={15} />}
                    </button>
                  ) : null}
                  <button onClick={() => runAction(item, 'delete')} disabled={isBusy} title="Supprimer" className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 disabled:opacity-50">
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}