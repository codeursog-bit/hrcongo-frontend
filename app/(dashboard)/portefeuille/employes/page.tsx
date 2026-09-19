'use client';

// app/(dashboard)/portefeuille/employes/page.tsx

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search, Users, Building2, Loader2, AlertCircle, ArrowRight, Plus, X,
} from 'lucide-react';
import { GlobalLoader } from '@/components/ui/GlobalLoader';
import { api } from '@/services/api';

interface PortfolioCompany { id: string; name: string; isActive: boolean; }

interface PortfolioEmployee {
  id: string;
  firstName: string;
  lastName: string;
  employeeNumber: string;
  position: string;
  photoUrl?: string | null;
  companyId: string;
  company: { id: string; legalName: string; tradeName: string | null };
  department: { id: string; name: string } | null;
}

// ─── Sélecteur d'entreprise (pour ouvrir une entreprise avant une action) ────

function CompanyPickerModal({ companies, title, onPick, onClose }: {
  companies: PortfolioCompany[]; title: string;
  onPick: (companyId: string) => void; onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm rounded-2xl overflow-hidden z-10" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
          <p className="text-sm font-bold" style={{ color: 'var(--text)' }}>{title}</p>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-[var(--surface-2)]" style={{ color: 'var(--text-muted)' }}><X size={16} /></button>
        </div>
        <div className="max-h-80 overflow-y-auto p-2">
          {companies.map(c => (
            <button
              key={c.id}
              onClick={() => onPick(c.id)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors hover:bg-[var(--surface-2)]"
            >
              <div className="w-8 h-8 rounded-lg bg-emerald-500/15 flex items-center justify-center shrink-0">
                <Building2 size={14} className="text-emerald-500" />
              </div>
              <span className="text-sm font-medium truncate" style={{ color: 'var(--text)' }}>{c.name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Page principale ──────────────────────────────────────────────────────────

export default function PortfolioEmployeesPage() {
  const router = useRouter();
  const [companies, setCompanies] = useState<PortfolioCompany[]>([]);
  const [employees, setEmployees] = useState<PortfolioEmployee[]>([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [search, setSearch] = useState('');
  const [companyFilter, setCompanyFilter] = useState<string>('');
  const [error, setError] = useState('');
  const [picker, setPicker] = useState<'add' | 'open' | null>(null);
  const [pendingEmployee, setPendingEmployee] = useState<PortfolioEmployee | null>(null);
  const [switching, setSwitching] = useState(false);

  useEffect(() => {
    api.get<PortfolioCompany[]>('/auth/my-companies')
      .then(list => setCompanies(list ?? []))
      .catch(() => setCompanies([]));
  }, []);

  const loadEmployees = (q: string, companyId: string) => {
    setSearching(true);
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (companyId) params.set('companyId', companyId);
    api.get<PortfolioEmployee[]>(`/portfolio/employees?${params.toString()}`)
      .then(list => setEmployees(list ?? []))
      .catch(() => setEmployees([]))
      .finally(() => { setSearching(false); setLoading(false); });
  };

  useEffect(() => { loadEmployees('', ''); }, []);

  useEffect(() => {
    const t = setTimeout(() => loadEmployees(search, companyFilter), 300);
    return () => clearTimeout(t);
  }, [search, companyFilter]);

  // Ouvrir la fiche d'un employé → bascule vers son entreprise puis navigue
  const openEmployee = async (companyId: string, employeeId: string) => {
    setSwitching(true);
    setError('');
    try {
      await api.post('/auth/switch-company', { companyId });
      router.push(`/employes/${employeeId}`);
    } catch (e: any) {
      setError(e.message || "Impossible d'ouvrir cette entreprise");
      setSwitching(false);
    }
  };

  // Ajouter un employé → choisir l'entreprise cible puis basculer + rediriger
  const handleAddClick = () => {
    if (companyFilter) {
      goToCreate(companyFilter);
    } else if (companies.length === 1) {
      goToCreate(companies[0].id);
    } else {
      setPicker('add');
    }
  };

  const goToCreate = async (companyId: string) => {
    setPicker(null);
    setSwitching(true);
    setError('');
    try {
      await api.post('/auth/switch-company', { companyId });
      router.push('/employes/nouveau');
    } catch (e: any) {
      setError(e.message || "Impossible d'ouvrir cette entreprise");
      setSwitching(false);
    }
  };

  const companyName = (id: string) => companies.find(c => c.id === id)?.name ?? '';

  if (loading) return <GlobalLoader />;

  return (
    <div className="space-y-6 min-h-screen pb-20">
      {picker === 'add' && (
        <CompanyPickerModal
          companies={companies}
          title="Dans quelle entreprise ?"
          onPick={goToCreate}
          onClose={() => setPicker(null)}
        />
      )}

      {/* ── HEADER ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight" style={{ color: 'var(--text)' }}>Employés</h1>
          <p className="mt-1 flex items-center gap-2" style={{ color: 'var(--text-muted)' }}>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            {employees.length} employé{employees.length > 1 ? 's' : ''} {companyFilter ? `chez ${companyName(companyFilter)}` : 'dans votre portefeuille'}
          </p>
        </div>
        <button
          onClick={handleAddClick}
          disabled={switching || companies.length === 0}
          className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold transition-colors flex items-center gap-2 disabled:opacity-60"
        >
          {switching ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
          Ajouter un employé
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm font-medium">
          <AlertCircle size={16} className="shrink-0" />{error}
        </div>
      )}

      {/* ── BARRE FILTRES ── */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Rechercher par nom, matricule..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-[var(--surface)] border border-[var(--border)] rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
            style={{ color: 'var(--text)' }}
          />
          {searching && <Loader2 size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-emerald-400 animate-spin" />}
        </div>
        <select
          value={companyFilter}
          onChange={e => setCompanyFilter(e.target.value)}
          className="px-4 py-2.5 bg-[var(--surface)] border border-[var(--border)] rounded-xl text-sm font-medium"
          style={{ color: 'var(--text)' }}
        >
          <option value="">Toutes les entreprises</option>
          {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      {/* ── LISTE ── */}
      {employees.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center rounded-2xl" style={{ border: '2px dashed var(--border)' }}>
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4 bg-[var(--surface-2)]">
            <Users size={24} style={{ color: 'var(--text-muted)' }} />
          </div>
          <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>
            {search || companyFilter ? 'Aucun employé ne correspond' : 'Aucun employé pour le moment'}
          </p>
        </div>
      ) : (
        <div className="rounded-2xl overflow-x-auto" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <div className="grid px-4 py-3" style={{ minWidth: 620, gridTemplateColumns: '1fr 160px 160px 100px', gap: 12, borderBottom: '1px solid var(--border)' }}>
            {['Employé', 'Entreprise', 'Poste', ''].map((h, i) => (
              <p key={i} className="text-[11px] font-bold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>{h}</p>
            ))}
          </div>
          {employees.map(emp => (
            <div key={emp.id} className="grid items-center px-4 py-3 transition-colors hover:bg-[var(--surface-2)]"
              style={{ minWidth: 620, gridTemplateColumns: '1fr 160px 160px 100px', gap: 12, borderBottom: '1px solid var(--border)' }}>
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-lg bg-emerald-500/15 flex items-center justify-center shrink-0 text-emerald-600 dark:text-emerald-400 text-xs font-bold">
                  {emp.firstName[0]}{emp.lastName[0]}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: 'var(--text)' }}>{emp.firstName} {emp.lastName}</p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{emp.employeeNumber}</p>
                </div>
              </div>
              <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{emp.company.tradeName || emp.company.legalName}</p>
              <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{emp.position}</p>
              <button
                onClick={() => openEmployee(emp.companyId, emp.id)}
                disabled={switching}
                className="flex items-center gap-1 justify-self-end text-xs font-bold text-emerald-600 dark:text-emerald-400 disabled:opacity-60"
              >
                Voir <ArrowRight size={13} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}