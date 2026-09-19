'use client';

// app/(dashboard)/portefeuille/paie/page.tsx

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Wallet, Search, Building2, Loader2, AlertCircle, CheckCircle2, Plus,
  Trash2, ChevronDown, ChevronRight, Square, CheckSquare, Play, FileEdit, ListChecks,
} from 'lucide-react';
import { GlobalLoader } from '@/components/ui/GlobalLoader';
import { api } from '@/services/api';

// ─── Types ────────────────────────────────────────────────────────────────────

interface PortfolioCompany { id: string; name: string; isActive: boolean; }

interface PortfolioEmployee {
  id: string;
  firstName: string;
  lastName: string;
  employeeNumber: string;
  position: string;
  companyId: string;
  company: { id: string; legalName: string; tradeName: string | null };
}

const MONTHS = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
];
const CURRENT_YEAR = new Date().getFullYear();
const YEARS = [CURRENT_YEAR - 1, CURRENT_YEAR, CURRENT_YEAR + 1];

const TABS = [
  { id: 'individuelle', label: 'Paie individuelle', icon: Wallet },
  { id: 'manuelle', label: 'Paie manuelle', icon: FileEdit },
  { id: 'masse', label: 'Paie en masse', icon: Play },
] as const;

type TabId = typeof TABS[number]['id'];

// ─── Sélecteur employé (entreprise + recherche) ───────────────────────────────

function EmployeePicker({ companies, onSelect, selected }: {
  companies: PortfolioCompany[];
  onSelect: (e: PortfolioEmployee | null) => void;
  selected: PortfolioEmployee | null;
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
        <div>
          <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>Entreprise</label>
          <select
            value={companyId}
            onChange={e => { setCompanyId(e.target.value); onSelect(null); }}
            className="w-full px-3 py-2.5 rounded-xl text-sm bg-[var(--surface-2)] border border-[var(--border)]"
            style={{ color: 'var(--text)' }}
          >
            <option value="">Toutes les entreprises</option>
            {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>Employé</label>
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
        </div>
      </div>

      {open && !selected && results.length > 0 && (
        <div className="rounded-xl overflow-hidden max-h-56 overflow-y-auto" style={{ border: '1px solid var(--border)' }}>
          {results.map(emp => (
            <button
              key={emp.id}
              onClick={() => { onSelect(emp); setOpen(false); }}
              className="w-full flex items-center justify-between px-3 py-2.5 text-left transition-colors hover:bg-[var(--surface-2)]"
              style={{ borderBottom: '1px solid var(--border)' }}
            >
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>{label}</label>
      {children}
    </div>
  );
}

const inputCls = "w-full px-3 py-2.5 rounded-xl text-sm bg-[var(--surface-2)] border border-[var(--border)]";

// ─── Onglet Paie individuelle ─────────────────────────────────────────────────

function IndividualPayrollTab({ companies }: { companies: PortfolioCompany[] }) {
  const [employee, setEmployee] = useState<PortfolioEmployee | null>(null);
  const [month, setMonth] = useState(MONTHS[new Date().getMonth()]);
  const [year, setYear] = useState(CURRENT_YEAR);
  const [workedDays, setWorkedDays] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  const handleSubmit = async () => {
    if (!employee) { setResult({ ok: false, message: 'Sélectionnez un employé' }); return; }
    setSaving(true);
    setResult(null);
    try {
      await api.post('/portfolio/payroll', {
        employeeId: employee.id,
        companyId: employee.companyId,
        month,
        year,
        ...(workedDays ? { workedDays: Number(workedDays) } : {}),
      });
      setResult({ ok: true, message: `Bulletin généré pour ${employee.firstName} ${employee.lastName}` });
      setEmployee(null);
    } catch (e: any) {
      setResult({ ok: false, message: e.message || 'Erreur lors de la génération' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5 max-w-2xl">
      <EmployeePicker companies={companies} onSelect={setEmployee} selected={employee} />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Field label="Mois">
          <select value={month} onChange={e => setMonth(e.target.value)} className={inputCls} style={{ color: 'var(--text)' }}>
            {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </Field>
        <Field label="Année">
          <select value={year} onChange={e => setYear(Number(e.target.value))} className={inputCls} style={{ color: 'var(--text)' }}>
            {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </Field>
        <Field label="Jours travaillés (optionnel)">
          <input type="number" value={workedDays} onChange={e => setWorkedDays(e.target.value)} placeholder="Auto" className={inputCls} style={{ color: 'var(--text)' }} />
        </Field>
      </div>

      {result && (
        <div className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium ${result.ok ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400' : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'}`}>
          {result.ok ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          {result.message}
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={saving || !employee}
        className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold bg-emerald-500 hover:bg-emerald-600 text-white transition-colors disabled:opacity-50"
      >
        {saving ? <Loader2 size={16} className="animate-spin" /> : <Wallet size={16} />}
        {saving ? 'Génération…' : 'Générer le bulletin'}
      </button>
    </div>
  );
}

// ─── Onglet Paie manuelle ──────────────────────────────────────────────────────

interface ManualBonusRow { bonusType: string; amount: string; fiscalType: 'TAXABLE_CNSS' | 'TAXABLE_NO_CNSS' | 'NON_TAXABLE'; }
interface ManualDeductionRow { label: string; amount: string; }

function ManualPayrollTab({ companies }: { companies: PortfolioCompany[] }) {
  const [employee, setEmployee] = useState<PortfolioEmployee | null>(null);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(CURRENT_YEAR);
  const [workedDays, setWorkedDays] = useState('26');
  const [baseSalary, setBaseSalary] = useState('');
  const [bonuses, setBonuses] = useState<ManualBonusRow[]>([]);
  const [deductions, setDeductions] = useState<ManualDeductionRow[]>([]);
  const [saving, setSaving] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const [simulation, setSimulation] = useState<any>(null);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  const buildDto = () => ({
    employeeId: employee!.id,
    companyId: employee!.companyId,
    month,
    year,
    workedDays: Number(workedDays) || 26,
    ...(baseSalary ? { baseSalary: Number(baseSalary) } : {}),
    manualBonuses: bonuses.filter(b => b.bonusType && b.amount).map(b => ({ bonusType: b.bonusType, amount: Number(b.amount), fiscalType: b.fiscalType })),
    manualDeductions: deductions.filter(d => d.label && d.amount).map(d => ({ label: d.label, amount: Number(d.amount) })),
  });

  const handleSimulate = async () => {
    if (!employee) return;
    setSimulating(true);
    setResult(null);
    try {
      const sim = await api.post('/portfolio/payroll/manual-simulate', buildDto());
      setSimulation(sim);
    } catch (e: any) {
      setResult({ ok: false, message: e.message || 'Erreur lors de la simulation' });
    } finally {
      setSimulating(false);
    }
  };

  const handleSave = async () => {
    if (!employee) return;
    setSaving(true);
    setResult(null);
    try {
      await api.post('/portfolio/payroll/manual', buildDto());
      setResult({ ok: true, message: `Bulletin manuel enregistré pour ${employee.firstName} ${employee.lastName}` });
      setSimulation(null);
      setEmployee(null);
      setBonuses([]);
      setDeductions([]);
    } catch (e: any) {
      setResult({ ok: false, message: e.message || "Erreur lors de l'enregistrement" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5 max-w-2xl">
      <EmployeePicker companies={companies} onSelect={setEmployee} selected={employee} />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Field label="Mois">
          <select value={month} onChange={e => setMonth(Number(e.target.value))} className={inputCls} style={{ color: 'var(--text)' }}>
            {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
          </select>
        </Field>
        <Field label="Année">
          <select value={year} onChange={e => setYear(Number(e.target.value))} className={inputCls} style={{ color: 'var(--text)' }}>
            {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </Field>
        <Field label="Jours travaillés">
          <input type="number" value={workedDays} onChange={e => setWorkedDays(e.target.value)} className={inputCls} style={{ color: 'var(--text)' }} />
        </Field>
        <Field label="Salaire de base (optionnel)">
          <input type="number" value={baseSalary} onChange={e => setBaseSalary(e.target.value)} placeholder="Auto" className={inputCls} style={{ color: 'var(--text)' }} />
        </Field>
      </div>

      {/* Primes */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>Primes</p>
          <button onClick={() => setBonuses(b => [...b, { bonusType: '', amount: '', fiscalType: 'TAXABLE_CNSS' }])} className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
            <Plus size={13} /> Ajouter
          </button>
        </div>
        <div className="space-y-2">
          {bonuses.map((b, i) => (
            <div key={i} className="grid grid-cols-1 sm:grid-cols-[1fr_120px_150px_32px] gap-2 sm:items-center">
              <input placeholder="Libellé (ex: Prime transport)" value={b.bonusType} onChange={e => setBonuses(rows => rows.map((r, idx) => idx === i ? { ...r, bonusType: e.target.value } : r))} className={inputCls} style={{ color: 'var(--text)' }} />
              <input type="number" placeholder="Montant" value={b.amount} onChange={e => setBonuses(rows => rows.map((r, idx) => idx === i ? { ...r, amount: e.target.value } : r))} className={inputCls} style={{ color: 'var(--text)' }} />
              <select value={b.fiscalType} onChange={e => setBonuses(rows => rows.map((r, idx) => idx === i ? { ...r, fiscalType: e.target.value as any } : r))} className={inputCls} style={{ color: 'var(--text)' }}>
                <option value="TAXABLE_CNSS">Imposable + CNSS</option>
                <option value="TAXABLE_NO_CNSS">Imposable seul</option>
                <option value="NON_TAXABLE">Non imposable</option>
              </select>
              <button onClick={() => setBonuses(rows => rows.filter((_, idx) => idx !== i))} className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500"><Trash2 size={14} /></button>
            </div>
          ))}
        </div>
      </div>

      {/* Déductions */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>Déductions</p>
          <button onClick={() => setDeductions(d => [...d, { label: '', amount: '' }])} className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
            <Plus size={13} /> Ajouter
          </button>
        </div>
        <div className="space-y-2">
          {deductions.map((d, i) => (
            <div key={i} className="grid grid-cols-1 sm:grid-cols-[1fr_120px_32px] gap-2 sm:items-center">
              <input placeholder="Libellé (ex: Avance sur salaire)" value={d.label} onChange={e => setDeductions(rows => rows.map((r, idx) => idx === i ? { ...r, label: e.target.value } : r))} className={inputCls} style={{ color: 'var(--text)' }} />
              <input type="number" placeholder="Montant" value={d.amount} onChange={e => setDeductions(rows => rows.map((r, idx) => idx === i ? { ...r, amount: e.target.value } : r))} className={inputCls} style={{ color: 'var(--text)' }} />
              <button onClick={() => setDeductions(rows => rows.filter((_, idx) => idx !== i))} className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500"><Trash2 size={14} /></button>
            </div>
          ))}
        </div>
      </div>

      {simulation && (
        <div className="rounded-xl p-4 bg-[var(--surface-2)] space-y-1">
          <p className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: 'var(--text-muted)' }}>Aperçu de la simulation</p>
          <pre className="text-xs overflow-x-auto" style={{ color: 'var(--text)' }}>{JSON.stringify(simulation, null, 2)}</pre>
        </div>
      )}

      {result && (
        <div className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium ${result.ok ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400' : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'}`}>
          {result.ok ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          {result.message}
        </div>
      )}

      <div className="flex items-center gap-2">
        <button onClick={handleSimulate} disabled={simulating || !employee} className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-colors disabled:opacity-50" style={{ border: '1px solid var(--border)', color: 'var(--text)' }}>
          {simulating ? <Loader2 size={16} className="animate-spin" /> : null}
          Simuler
        </button>
        <button onClick={handleSave} disabled={saving || !employee} className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold bg-emerald-500 hover:bg-emerald-600 text-white transition-colors disabled:opacity-50">
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Wallet size={16} />}
          {saving ? 'Enregistrement…' : 'Enregistrer le bulletin'}
        </button>
      </div>
    </div>
  );
}

// ─── Onglet Paie en masse ──────────────────────────────────────────────────────

const MAX_COMPANIES_PER_RUN = 4; // même limite que le back (garde-fou double)
const MASS_BATCH_SIZE = 60;      // doit rester ≤ MASS_PAYROLL_BATCH_SIZE côté back
const MASS_WARN_THRESHOLD = 200;

interface CompanyBlock {
  company: PortfolioCompany;
  expanded: boolean;
  loading: boolean;
  employees: PortfolioEmployee[];
  selectedIds: Set<string>;
  companyChecked: boolean;
}

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

function MassPayrollTab({ companies }: { companies: PortfolioCompany[] }) {
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(CURRENT_YEAR);
  const [blocks, setBlocks] = useState<Record<string, CompanyBlock>>({});
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [results, setResults] = useState<Record<string, { ok: boolean; message: string }>>({});
  const [limitError, setLimitError] = useState('');

  useEffect(() => {
    const init: Record<string, CompanyBlock> = {};
    companies.forEach(c => {
      init[c.id] = { company: c, expanded: false, loading: false, employees: [], selectedIds: new Set(), companyChecked: false };
    });
    setBlocks(init);
  }, [companies]);

  const activeCompanyCount = Object.values(blocks).filter(b => b.selectedIds.size > 0).length;

  const loadEmployees = (companyId: string, onDone?: (list: PortfolioEmployee[]) => void) => {
    setBlocks(b => ({ ...b, [companyId]: { ...b[companyId], loading: true } }));
    // 🆕 limit=300 : on veut TOUS les employés de l'entreprise pour ne pas
    // en oublier dans la sélection, pas les 50 par défaut de la recherche.
    api.get<PortfolioEmployee[]>(`/portfolio/employees?companyId=${companyId}&limit=300`)
      .then(list => {
        setBlocks(b => ({
          ...b,
          [companyId]: { ...b[companyId], employees: list ?? [], loading: false, expanded: true },
        }));
        onDone?.(list ?? []);
      })
      .catch(() => setBlocks(b => ({ ...b, [companyId]: { ...b[companyId], loading: false } })));
  };

  const toggleExpand = (companyId: string) => {
    const block = blocks[companyId];
    if (!block.expanded && block.employees.length === 0) { loadEmployees(companyId); return; }
    setBlocks(prev => ({ ...prev, [companyId]: { ...prev[companyId], expanded: !prev[companyId].expanded } }));
  };

  const toggleCompanyChecked = (companyId: string) => {
    const block = blocks[companyId];
    const willCheck = !block.companyChecked;
    if (willCheck && activeCompanyCount >= MAX_COMPANIES_PER_RUN) {
      setLimitError(`Maximum ${MAX_COMPANIES_PER_RUN} entreprises en même temps. Générez d'abord pour celles déjà sélectionnées.`);
      return;
    }
    setLimitError('');

    if (willCheck && block.employees.length === 0) {
      loadEmployees(companyId, list => {
        setBlocks(b => ({ ...b, [companyId]: { ...b[companyId], companyChecked: true, selectedIds: new Set(list.map(e => e.id)) } }));
      });
      return;
    }
    setBlocks(prev => ({
      ...prev,
      [companyId]: {
        ...block,
        companyChecked: willCheck,
        selectedIds: willCheck ? new Set(block.employees.map(e => e.id)) : new Set(),
      },
    }));
  };

  const toggleEmployee = (companyId: string, employeeId: string) => {
    setBlocks(prev => {
      const block = prev[companyId];
      const next = new Set(block.selectedIds);
      const adding = !next.has(employeeId);
      if (adding && activeCompanyCount >= MAX_COMPANIES_PER_RUN && block.selectedIds.size === 0) {
        setLimitError(`Maximum ${MAX_COMPANIES_PER_RUN} entreprises en même temps.`);
        return prev;
      }
      if (adding) next.add(employeeId); else next.delete(employeeId);
      return { ...prev, [companyId]: { ...block, selectedIds: next, companyChecked: next.size === block.employees.length && block.employees.length > 0 } };
    });
  };

  const totalSelected = Object.values(blocks).reduce((sum, b) => sum + b.selectedIds.size, 0);
  const companiesWithSelection = Object.values(blocks).filter(b => b.selectedIds.size > 0);

  // 🆕 Découpe chaque entreprise sélectionnée en lots de MASS_BATCH_SIZE et
  // boucle jusqu'à épuiser la liste — aucun employé n'est laissé de côté,
  // même au-delà de 200 au total ; c'est juste plus d'appels séquentiels.
  const handleGenerate = async () => {
    setRunning(true);
    setResults({});
    const allChunks = companiesWithSelection.flatMap(block =>
      chunk(Array.from(block.selectedIds), MASS_BATCH_SIZE).map(ids => ({ block, ids })),
    );
    setProgress({ done: 0, total: allChunks.length });

    for (const { block, ids } of allChunks) {
      try {
        await api.post('/portfolio/payroll/generate', {
          companyId: block.company.id,
          month,
          year,
          employeeIds: ids,
        });
        setResults(r => {
          const prevOk = r[block.company.id]?.ok !== false;
          const prevCount = (r[block.company.id] as any)?.count || 0;
          const count = prevCount + ids.length;
          return { ...r, [block.company.id]: { ok: prevOk, message: `${count} bulletin(s) traité(s)`, ...( { count } as any) } };
        });
      } catch (e: any) {
        setResults(r => ({ ...r, [block.company.id]: { ok: false, message: e.message || 'Échec sur un lot — voir logs' } }));
      }
      setProgress(p => p ? { ...p, done: p.done + 1 } : p);
    }
    setRunning(false);
  };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-xl">
        <Field label="Mois">
          <select value={month} onChange={e => setMonth(Number(e.target.value))} className={inputCls} style={{ color: 'var(--text)' }}>
            {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
          </select>
        </Field>
        <Field label="Année">
          <select value={year} onChange={e => setYear(Number(e.target.value))} className={inputCls} style={{ color: 'var(--text)' }}>
            {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </Field>
      </div>

      {limitError && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 text-sm font-medium">
          <AlertCircle size={16} className="shrink-0" />{limitError}
        </div>
      )}

      <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
        {companies.map(c => {
          const block = blocks[c.id];
          if (!block) return null;
          const res = results[c.id];
          const disabledCheckbox = !block.companyChecked && activeCompanyCount >= MAX_COMPANIES_PER_RUN;
          return (
            <div key={c.id} style={{ borderBottom: '1px solid var(--border)' }}>
              <div className="flex items-center gap-3 px-4 py-3">
                <button onClick={() => toggleCompanyChecked(c.id)} disabled={disabledCheckbox} className="disabled:opacity-30">
                  {block.companyChecked ? <CheckSquare size={18} className="text-emerald-500" /> : <Square size={18} style={{ color: 'var(--text-muted)' }} />}
                </button>
                <button onClick={() => toggleExpand(c.id)} className="flex-1 flex items-center gap-2 text-left">
                  <Building2 size={15} style={{ color: 'var(--text-muted)' }} />
                  <span className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{c.name}</span>
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>({block.selectedIds.size} sélectionné{block.selectedIds.size > 1 ? 's' : ''})</span>
                </button>
                {res && (
                  <span className={`text-xs font-bold flex items-center gap-1 ${res.ok ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}>
                    {res.ok ? <CheckCircle2 size={13} /> : <AlertCircle size={13} />} {res.message}
                  </span>
                )}
                <button onClick={() => toggleExpand(c.id)}>
                  {block.loading ? <Loader2 size={16} className="animate-spin" /> : block.expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                </button>
              </div>
              {block.expanded && (
                <div className="px-4 pb-3 pl-11 space-y-1 max-h-64 overflow-y-auto">
                  {block.loading ? (
                    <p className="text-xs py-2 flex items-center gap-2" style={{ color: 'var(--text-muted)' }}><Loader2 size={12} className="animate-spin" /> Chargement…</p>
                  ) : block.employees.length === 0 ? (
                    <p className="text-xs py-2" style={{ color: 'var(--text-muted)' }}>Aucun employé actif</p>
                  ) : block.employees.map(emp => (
                    <button key={emp.id} onClick={() => toggleEmployee(c.id, emp.id)} className="w-full flex items-center gap-2.5 py-1.5 text-left">
                      {block.selectedIds.has(emp.id) ? <CheckSquare size={15} className="text-emerald-500" /> : <Square size={15} style={{ color: 'var(--text-muted)' }} />}
                      <span className="text-xs" style={{ color: 'var(--text)' }}>{emp.firstName} {emp.lastName}</span>
                      <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{emp.employeeNumber}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {totalSelected > MASS_WARN_THRESHOLD && !running && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 text-sm font-medium">
          <AlertCircle size={16} className="shrink-0" />
          {totalSelected} employés sélectionnés — au-delà de {MASS_WARN_THRESHOLD}, la génération prendra plus de temps (traitement automatique par lots de {MASS_BATCH_SIZE}, personne ne sera oublié).
        </div>
      )}

      {running && progress && (
        <div className="space-y-2">
          <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--surface-2)' }}>
            <div className="h-full bg-emerald-500 transition-all" style={{ width: `${(progress.done / progress.total) * 100}%` }} />
          </div>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Lot {progress.done}/{progress.total} traité{progress.done > 1 ? 's' : ''}…</p>
        </div>
      )}

      <button
        onClick={handleGenerate}
        disabled={running || totalSelected === 0}
        className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold bg-emerald-500 hover:bg-emerald-600 text-white transition-colors disabled:opacity-50"
      >
        {running ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />}
        {running ? 'Génération en cours…' : `Générer pour ${totalSelected} employé${totalSelected > 1 ? 's' : ''}`}
      </button>
    </div>
  );
}

// ─── Page principale ──────────────────────────────────────────────────────────

export default function PortfolioPayrollPage() {
  const [companies, setCompanies] = useState<PortfolioCompany[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<TabId>('individuelle');

  useEffect(() => {
    api.get<PortfolioCompany[]>('/auth/my-companies')
      .then(list => setCompanies(list ?? []))
      .catch(() => setCompanies([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <GlobalLoader />;

  return (
    <div className="space-y-6 min-h-screen pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight" style={{ color: 'var(--text)' }}>Paie</h1>
          <p className="mt-1 flex items-center gap-2" style={{ color: 'var(--text-muted)' }}>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Individuelle, manuelle ou en masse sur toutes vos entreprises
          </p>
        </div>
        <Link
          href="/portefeuille/paie/liste"
          className="px-4 py-2.5 rounded-xl text-sm font-bold transition-colors flex items-center gap-2 hover:bg-[var(--surface-2)]"
          style={{ border: '1px solid var(--border)', color: 'var(--text)' }}
        >
          <ListChecks size={16} /> Liste de paie
        </Link>
      </div>

      {companies.length === 0 ? (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 text-sm font-medium">
          <AlertCircle size={16} />
          Ajoutez au moins une entreprise pour générer de la paie.
        </div>
      ) : (
        <>
          <div className="flex bg-[var(--surface-2)] p-1 rounded-xl w-fit max-w-full overflow-x-auto">
            {TABS.map(t => {
              const Icon = t.icon;
              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${tab === t.id ? 'bg-[var(--surface)] text-emerald-500 shadow-sm' : ''}`}
                  style={{ color: tab === t.id ? undefined : 'var(--text-muted)' }}
                >
                  <Icon size={15} /> {t.label}
                </button>
              );
            })}
          </div>

          <div className="rounded-2xl p-5" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            {tab === 'individuelle' && <IndividualPayrollTab companies={companies} />}
            {tab === 'manuelle' && <ManualPayrollTab companies={companies} />}
            {tab === 'masse' && <MassPayrollTab companies={companies} />}
          </div>
        </>
      )}
    </div>
  );
}