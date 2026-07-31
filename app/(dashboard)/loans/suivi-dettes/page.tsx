'use client';

// ============================================================================
// 📁 app/(dashboard)/loans/suivi-dettes/page.tsx
// ✅ Page "Suivi des dettes" — uniquement les employés dont un prêt/avance a
//    été VALIDÉ (pas tout le monde), regroupés, avec filtres mois (défaut :
//    mois en cours) / année / département / type, KPI qui se recalculent,
//    et export Excel générique (indépendant du format Orca).
// ============================================================================

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Loader2, Filter, Users2, Download, ChevronRight, Wallet, Banknote, PiggyBank, TrendingDown } from 'lucide-react';
import { api } from '@/services/api';
import { useBasePath } from '@/hooks/useBasePath';
import FinanceSubNav from '@/components/FinanceSubNav';

const MONTHS_FR = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
const TYPE_LABEL: Record<string, string> = { ARGENT: 'Prêt argent', MARCHANDISE: 'Marchandise', AUTRE: 'Autre prêt', AVANCE: 'Avance sur salaire' };
const fmt = (n: number) => Math.round(n).toLocaleString('fr-FR') + ' FCFA';

export default function SuiviDettesPage() {
  const { bp } = useBasePath();
  const [loans, setLoans] = useState<any[]>([]);
  const [advances, setAdvances] = useState<any[]>([]);
  const [userRole, setUserRole] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  const now = new Date();
  const [month, setMonth] = useState<number | ''>(now.getMonth() + 1); // '' = toute l'année
  const [year, setYear] = useState(now.getFullYear());
  const [deptFilter, setDeptFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  useEffect(() => {
    try { const stored = localStorage.getItem('user'); if (stored) setUserRole(JSON.parse(stored).role || ''); } catch {}
    (async () => {
      try {
        const [l, a]: any = await Promise.all([api.get('/loans'), api.get('/loans/advances')]);
        setLoans(l || []); setAdvances(a || []);
      } catch (e) { console.error('Erreur chargement suivi des dettes', e); }
      finally { setIsLoading(false); }
    })();
  }, []);

  const availableYears = useMemo(() => {
    const set = new Set<number>([now.getFullYear()]);
    [...loans, ...advances].forEach(r => set.add(new Date(r.createdAt).getFullYear()));
    return Array.from(set).sort((a, b) => b - a);
  }, [loans, advances]);

  const departments = useMemo(() => Array.from(new Set([...loans, ...advances].map(r => r.employee?.department?.name).filter(Boolean))).sort(), [loans, advances]);

  // ── Uniquement les dettes VALIDÉES, dans la période sélectionnée ─────────
  const validatedInPeriod = useMemo(() => {
    const inPeriod = (dateStr: string) => {
      const d = new Date(dateStr);
      if (d.getFullYear() !== year) return false;
      if (month !== '' && d.getMonth() + 1 !== month) return false;
      return true;
    };

    const l = loans.filter(x => ['ACTIVE', 'PAID'].includes(x.status) && inPeriod(x.createdAt) && (!typeFilter || typeFilter === x.type) && (!deptFilter || x.employee?.department?.name === deptFilter))
      .map(x => ({ ...x, kind: 'loan' as const, requestType: x.type ?? 'ARGENT' }));
    const a = advances.filter(x => ['APPROVED', 'DEDUCTED', 'PAID'].includes(x.status) && inPeriod(x.createdAt) && (!typeFilter || typeFilter === 'AVANCE') && (!deptFilter || x.employee?.department?.name === deptFilter))
      .map(x => ({ ...x, kind: 'advance' as const, requestType: 'AVANCE' }));
    return [...l, ...a];
  }, [loans, advances, month, year, typeFilter, deptFilter]);

  // ── Regroupement par employé ──────────────────────────────────────────
  const byEmployee = useMemo(() => {
    const map = new Map<string, { employeeId: string; employee: any; items: any[]; totalDue: number; totalPaid: number; totalRemaining: number; monthlyLoad: number }>();
    validatedInPeriod.forEach(r => {
      const key = r.employeeId;
      if (!map.has(key)) map.set(key, { employeeId: key, employee: r.employee, items: [], totalDue: 0, totalPaid: 0, totalRemaining: 0, monthlyLoad: 0 });
      const entry = map.get(key)!;
      entry.items.push(r);
      entry.totalDue += Number(r.amount);
      if (r.kind === 'loan') {
        entry.totalPaid += Number(r.amount) - Number(r.remainingBalance);
        if (r.status === 'ACTIVE') { entry.totalRemaining += Number(r.remainingBalance); entry.monthlyLoad += Number(r.monthlyRepayment); }
      } else {
        if (['DEDUCTED', 'PAID'].includes(r.status)) entry.totalPaid += Number(r.amount);
        else entry.totalRemaining += Number(r.amount);
      }
    });
    return Array.from(map.values()).sort((a, b) => b.totalRemaining - a.totalRemaining);
  }, [validatedInPeriod]);

  const kpis = useMemo(() => ({
    employees: byEmployee.length,
    totalValidated: validatedInPeriod.reduce((s, r) => s + Number(r.amount), 0),
    totalRemaining: byEmployee.reduce((s, e) => s + e.totalRemaining, 0),
    totalPaid: byEmployee.reduce((s, e) => s + e.totalPaid, 0),
  }), [byEmployee, validatedInPeriod]);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const params = new URLSearchParams({ year: String(year) });
      if (month !== '') params.set('month', String(month));
      if (deptFilter) params.set('department', deptFilter);
      if (typeFilter) params.set('type', typeFilter);
      const res = await fetch(`${API_URL}/loans/debt-tracking/export-xlsx?${params}`, { credentials: 'include' });
      if (!res.ok) throw new Error("Échec de l'export");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = `suivi-dettes-${year}${month !== '' ? '-' + month : ''}.xlsx`;
      document.body.appendChild(a); a.click(); a.remove(); window.URL.revokeObjectURL(url);
    } catch (e: any) { alert(e?.message || 'Erreur'); } finally { setIsExporting(false); }
  };

  if (isLoading) return <div className="flex justify-center py-24"><Loader2 className="animate-spin text-sky-500" size={40} /></div>;

  return (
    <div className="max-w-[1500px] mx-auto pb-24 space-y-6">
      <FinanceSubNav userRole={userRole} />
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Suivi des dettes</h1>
          <p className="text-sm text-gray-500">Employés avec un prêt ou une avance validé(e) sur la période sélectionnée.</p>
        </div>
        <button onClick={handleExport} disabled={isExporting} className="px-4 py-2.5 bg-sky-500 hover:bg-sky-600 disabled:opacity-50 text-white text-sm font-bold rounded-xl flex items-center gap-2 shrink-0">
          {isExporting ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />} Exporter en Excel
        </button>
      </div>

      {/* ══════════════════ FILTRES ══════════════════ */}
      <div className="flex flex-wrap gap-2">
        <select value={month} onChange={e => setMonth(e.target.value === '' ? '' : Number(e.target.value))} className="text-xs px-2 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800">
          <option value="">Toute l'année</option>
          {MONTHS_FR.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
        </select>
        <select value={year} onChange={e => setYear(Number(e.target.value))} className="text-xs px-2 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800">
          {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
        <FilterSelect icon={Filter} value={typeFilter} onChange={setTypeFilter} placeholder="Tous les types" options={Object.entries(TYPE_LABEL)} />
        {departments.length > 0 && <FilterSelect icon={Users2} value={deptFilter} onChange={setDeptFilter} placeholder="Tous les départements" options={departments.map(d => [d, d] as [string, string])} />}
      </div>

      {/* ══════════════════ KPI ══════════════════ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard icon={Users2} label="Employés concernés" value={String(kpis.employees)} tone="slate" />
        <KpiCard icon={Banknote} label="Total validé (période)" value={fmt(kpis.totalValidated)} tone="sky" />
        <KpiCard icon={PiggyBank} label="Déjà payé" value={fmt(kpis.totalPaid)} tone="emerald" />
        <KpiCard icon={Wallet} label="Reste à recouvrer" value={fmt(kpis.totalRemaining)} tone="amber" />
      </div>

      {/* ══════════════════ LISTE PAR EMPLOYÉ ══════════════════ */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>{['Employé', 'Département', 'Type(s)', 'Montant validé', 'Déjà payé', 'Reste à payer', ''].map(h => <th key={h} className="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase whitespace-nowrap">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {byEmployee.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-14 text-gray-400">Aucune dette validée pour cette période/ce filtre.</td></tr>
              ) : byEmployee.map(e => (
                <tr key={e.employeeId} className="hover:bg-gray-50 dark:hover:bg-gray-700/40">
                  <td className="px-4 py-3">
                    <Link href={bp(`/loans/suivi-dettes/${e.employeeId}`)} className="font-semibold text-gray-800 dark:text-gray-100 hover:text-sky-600 hover:underline">
                      {e.employee?.firstName} {e.employee?.lastName}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{e.employee?.department?.name || '—'}</td>
                  <td className="px-4 py-3 text-gray-500">{Array.from(new Set(e.items.map((i: any) => TYPE_LABEL[i.requestType] ?? i.requestType))).join(', ')}</td>
                  <td className="px-4 py-3 font-semibold text-gray-800 dark:text-gray-100 whitespace-nowrap">{fmt(e.totalDue)}</td>
                  <td className="px-4 py-3 text-emerald-600 whitespace-nowrap">{fmt(e.totalPaid)}</td>
                  <td className="px-4 py-3 text-amber-600 font-semibold whitespace-nowrap">{fmt(e.totalRemaining)}</td>
                  <td className="px-4 py-3 text-right">
                    <Link href={bp(`/loans/suivi-dettes/${e.employeeId}`)} className="text-sky-600 hover:underline text-xs font-semibold flex items-center gap-0.5 justify-end">
                      Voir la fiche <ChevronRight size={12} />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function KpiCard({ icon: Icon, label, value, tone }: { icon: any; label: string; value: string; tone: 'slate' | 'emerald' | 'amber' | 'sky' }) {
  const cls: Record<string, string> = {
    slate: 'bg-gray-50 text-gray-600 dark:bg-gray-900 dark:text-gray-300',
    emerald: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-300',
    amber: 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-300',
    sky: 'bg-sky-50 text-sky-600 dark:bg-sky-900/20 dark:text-sky-300',
  };
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4">
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${cls[tone]}`}><Icon size={18} /></div>
      <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-1">{label}</p>
      <p className="text-lg font-bold text-gray-900 dark:text-white truncate">{value}</p>
    </div>
  );
}

function FilterSelect({ icon: IconEl, value, onChange, placeholder, options }: { icon: any; value: string; onChange: (v: string) => void; placeholder: string; options: [string, string][] }) {
  return (
    <div className="relative">
      <IconEl size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
      <select value={value} onChange={e => onChange(e.target.value)} className="pl-7 pr-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 text-xs">
        <option value="">{placeholder}</option>
        {options.map(([val, label]) => <option key={val} value={val}>{label}</option>)}
      </select>
    </div>
  );
}
