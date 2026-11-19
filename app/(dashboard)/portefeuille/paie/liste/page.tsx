'use client';
import { PortfolioDialog } from '@/components/portfolio/PortfolioDialog';

// app/(dashboard)/portefeuille/paie/liste/page.tsx

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  FileText, Loader2, AlertCircle, CheckCircle2, XCircle, Trash2,
  Printer, Wallet,
} from 'lucide-react';
import { GlobalLoader } from '@/components/ui/GlobalLoader';
import { api } from '@/services/api';
import { PortfolioPageFrame as ModulePageFrame } from '@/components/portfolio/PortfolioPageFrame';

interface PortfolioCompany { id: string; name: string; }

interface PayrollEntry {
  id: string;
  month: number | string;
  year: number;
  netSalary: number;
  grossSalary: number;
  status: 'DRAFT' | 'VALIDATED' | 'PAID' | 'CANCELLED';
  employee: { id: string; firstName: string; lastName: string; employeeNumber: string; position: string };
  company: { id: string; legalName: string; tradeName: string | null };
}

const MONTHS = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
];
const CURRENT_YEAR = new Date().getFullYear();
const YEARS = [CURRENT_YEAR - 1, CURRENT_YEAR, CURRENT_YEAR + 1];

const STATUS_META: Record<string, { label: string; cls: string }> = {
  DRAFT: { label: 'Brouillon', cls: "bg-[var(--surface-2)] text-[var(--text-secondary)]  " },
  VALIDATED: { label: 'Validé', cls: "bg-[var(--brand-soft)] text-[var(--action)]  " },
  PAID: { label: 'Payé', cls: "bg-[var(--portfolio-positive-soft)] text-[var(--success-text)]  " },
  CANCELLED: { label: 'Annulé', cls: "bg-[var(--portfolio-danger-soft)] text-[var(--danger-text)]  " },
};

const fmtFCFA = (n: number) => new Intl.NumberFormat('fr-FR').format(Math.round(n || 0)) + ' FCFA';

function ConfirmModal({ title, message, danger, onConfirm, onCancel, loading }: {
  title: string; message: string; danger?: boolean; onConfirm: () => void; onCancel: () => void; loading: boolean;
}) {
  return (
    <PortfolioDialog onClose={() => !loading && onCancel()}>

<div className="relative w-full max-w-sm rounded-2xl p-6 z-10" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
        <p className="text-sm font-semibold mb-1" style={{ color: 'var(--text)' }}>{title}</p>
        <p className="text-sm mb-5" style={{ color: 'var(--text-muted)' }}>{message}</p>
        <div className="flex gap-2">
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-[var(--on-brand)] transition-colors disabled:opacity-60 ${danger ? "bg-[var(--portfolio-danger-soft)] hover:bg-[var(--portfolio-danger-soft)]" : "bg-[var(--action)] hover:bg-[var(--action)]"}`}
          >
            {loading && <Loader2 size={14} className="animate-spin" />}
            Confirmer
          </button>
          <button onClick={onCancel} disabled={loading} className="px-4 py-2 rounded-xl text-sm font-medium hover:bg-[var(--surface-2)]" style={{ color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
            Annuler
          </button>
        </div>
      </div>
</PortfolioDialog>
  );
}

function PortfolioPayrollListPage() {
  const router = useRouter();
  const [companies, setCompanies] = useState<PortfolioCompany[]>([]);
  const [entries, setEntries] = useState<PayrollEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(CURRENT_YEAR);
  const [companyFilter, setCompanyFilter] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [confirmAction, setConfirmAction] = useState<{ id: string; type: 'paid' | 'cancel' | 'delete' } | null>(null);
  const [switching, setSwitching] = useState(false);

  useEffect(() => {
    api.get<PortfolioCompany[]>('/auth/my-companies').then(list => setCompanies(list ?? [])).catch(() => setCompanies([]));
  }, []);

  const load = () => {
    setLoading(true);
    const params = new URLSearchParams({ month: String(month), year: String(year) });
    if (companyFilter) params.set('companyId', companyFilter);
    api.get<PayrollEntry[]>(`/portfolio/payroll?${params.toString()}`)
      .then(list => setEntries(list ?? []))
      .catch(() => setEntries([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [month, year, companyFilter]);

  const totals = useMemo(() => ({
    count: entries.length,
    netTotal: entries.reduce((s, e) => s + Number(e.netSalary || 0), 0),
  }), [entries]);

  const runAction = async () => {
    if (!confirmAction) return;
    setBusyId(confirmAction.id);
    setError('');
    try {
      if (confirmAction.type === 'delete') {
        await api.delete(`/portfolio/payroll/${confirmAction.id}`);
        setEntries(prev => prev.filter(e => e.id !== confirmAction.id));
      } else {
        const status = confirmAction.type === 'paid' ? 'PAID' : 'CANCELLED';
        await api.patch(`/portfolio/payroll/${confirmAction.id}/status`, { status });
        setEntries(prev => prev.map(e => e.id === confirmAction.id ? { ...e, status: status as any } : e));
      }
    } catch (e: any) {
      setError(e.message || "Échec de l'action");
    } finally {
      setBusyId(null);
      setConfirmAction(null);
    }
  };

  // Impression → doit se faire depuis l'entreprise concernée : on bascule
  // le contexte puis on ouvre la page de détail/impression normale.
  const handlePrint = async (entry: PayrollEntry) => {
    setSwitching(true);
    setError('');
    try {
      await api.post('/auth/switch-company', { companyId: entry.company.id });
      router.push(`/paie/${entry.id}`);
    } catch (e: any) {
      setError(e.message || "Impossible d'ouvrir cette entreprise");
      setSwitching(false);
    }
  };

  if (loading && entries.length === 0) return <GlobalLoader />;

  return (
    <div className="space-y-6 min-h-screen pb-20">
      {confirmAction && (
        <ConfirmModal
          title={
            confirmAction.type === 'delete' ? 'Supprimer ce bulletin ?'
            : confirmAction.type === 'cancel' ? 'Annuler ce bulletin ?'
            : 'Marquer ce bulletin comme payé ?'
          }
          message={
            confirmAction.type === 'delete' ? 'Cette action est définitive.'
            : confirmAction.type === 'cancel' ? 'Le bulletin passera au statut Annulé.'
            : 'Le bulletin passera au statut Payé.'
          }
          danger={confirmAction.type !== 'paid'}
          loading={busyId === confirmAction.id}
          onConfirm={runAction}
          onCancel={() => setConfirmAction(null)}
        />
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight" style={{ color: 'var(--text)' }}>Liste de paie</h1>
          <p className="mt-1 flex items-center gap-2" style={{ color: 'var(--text-muted)' }}>
            <span className="w-2 h-2 rounded-full bg-[var(--action)] " />
            {totals.count} bulletin{totals.count > 1 ? 's' : ''} · {fmtFCFA(totals.netTotal)} net au total
          </p>
        </div>
        <Link
          href="/portefeuille/paie"
          className="px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors flex items-center gap-2 hover:bg-[var(--surface-2)] w-fit"
          style={{ border: '1px solid var(--border)', color: 'var(--text)' }}
        >
          <Wallet size={16} /> Générer une paie
        </Link>
      </div>

      {error && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-[var(--portfolio-danger-soft)]  text-[var(--danger-text)]  text-sm font-medium">
          <AlertCircle size={16} className="shrink-0" />{error}
        </div>
      )}

      {/* ── FILTRES ── */}
      <div className="flex flex-wrap gap-3">
        <select value={month} onChange={e => setMonth(Number(e.target.value))} className="px-4 py-2.5 bg-[var(--surface)] border border-[var(--border)] rounded-xl text-sm font-medium" style={{ color: 'var(--text)' }}>
          {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
        </select>
        <select value={year} onChange={e => setYear(Number(e.target.value))} className="px-4 py-2.5 bg-[var(--surface)] border border-[var(--border)] rounded-xl text-sm font-medium" style={{ color: 'var(--text)' }}>
          {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
        <select value={companyFilter} onChange={e => setCompanyFilter(e.target.value)} className="px-4 py-2.5 bg-[var(--surface)] border border-[var(--border)] rounded-xl text-sm font-medium" style={{ color: 'var(--text)' }}>
          <option value="">Toutes les entreprises</option>
          {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      {/* ── LISTE ── */}
      {entries.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center rounded-2xl" style={{ border: '2px dashed var(--border)' }}>
          <FileText size={24} style={{ color: 'var(--text-muted)' }} className="mb-3" />
          <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>Aucun bulletin pour cette période</p>
        </div>
      ) : (
        <div className="rounded-2xl overflow-x-auto" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <div className="grid px-4 py-3" style={{ minWidth: 896, gridTemplateColumns: 'minmax(220px, 1fr) 160px 130px 100px 190px', gap: 12, borderBottom: '1px solid var(--border)' }}>
            {['Employé', 'Entreprise', 'Net à payer', 'Statut', ''].map((h, i) => (
              <p key={i} className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>{h}</p>
            ))}
          </div>
          {entries.map(entry => {
            const meta = STATUS_META[entry.status] ?? STATUS_META.DRAFT;
            const isBusy = busyId === entry.id;
            return (
              <div key={entry.id} className="grid items-center px-4 py-3 transition-colors hover:bg-[var(--surface-2)]"
                style={{ minWidth: 896, gridTemplateColumns: 'minmax(220px, 1fr) 160px 130px 100px 190px', gap: 12, borderBottom: '1px solid var(--border)' }}>
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: 'var(--text)' }}>{entry.employee.firstName} {entry.employee.lastName}</p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{entry.employee.employeeNumber}</p>
                </div>
                <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{entry.company.tradeName || entry.company.legalName}</p>
                <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{fmtFCFA(entry.netSalary)}</p>
                <span className={`inline-flex w-fit px-2.5 py-1 rounded-full text-[11px] font-semibold ${meta.cls}`}>{meta.label}</span>
                <div className="flex items-center gap-1 justify-self-end">
                  <button onClick={() => handlePrint(entry)} disabled={switching} title="Ouvrir / imprimer dans l'entreprise" className="p-2 rounded-lg hover:bg-[var(--surface-2)] disabled:opacity-50" style={{ color: 'var(--text-muted)' }}>
                    {switching ? <Loader2 size={15} className="animate-spin" /> : <Printer size={15} />}
                  </button>
                  {entry.status !== 'PAID' && entry.status !== 'CANCELLED' && (
                    <>
                      <button onClick={() => setConfirmAction({ id: entry.id, type: 'paid' })} disabled={isBusy} title="Marquer payé" className="p-2 rounded-lg hover:bg-[var(--brand-soft)]  text-[var(--action)] disabled:opacity-50">
                        <CheckCircle2 size={15} />
                      </button>
                      <button onClick={() => setConfirmAction({ id: entry.id, type: 'cancel' })} disabled={isBusy} title="Annuler" className="p-2 rounded-lg hover:bg-[var(--portfolio-warning-soft)]  text-[var(--warning-text)] disabled:opacity-50">
                        <XCircle size={15} />
                      </button>
                      <button onClick={() => setConfirmAction({ id: entry.id, type: 'delete' })} disabled={isBusy} title="Supprimer" className="p-2 rounded-lg hover:bg-[var(--portfolio-danger-soft)]  text-[var(--danger-text)] disabled:opacity-50">
                        <Trash2 size={15} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}


export default function PortfolioPayrollListPageWithFrame() {
  return (
    <ModulePageFrame kind="list">
      <PortfolioPayrollListPage />
    </ModulePageFrame>
  );
}
