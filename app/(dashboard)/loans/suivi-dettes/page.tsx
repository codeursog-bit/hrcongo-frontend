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
import { Loader2, Filter, Users2, Download, ChevronRight, Wallet, Banknote, PiggyBank, TrendingDown, Search } from 'lucide-react';
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
  const [nameFilter, setNameFilter] = useState('');

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
    loans.forEach(r => set.add(new Date(r.startDate ?? r.createdAt).getFullYear()));
    advances.forEach(r => set.add(r.deductYear ?? new Date(r.createdAt).getFullYear()));
    return Array.from(set).sort((a, b) => b - a);
  }, [loans, advances]);

  const departments = useMemo(() => Array.from(new Set([...loans, ...advances].map(r => r.employee?.department?.name).filter(Boolean))).sort(), [loans, advances]);

  // ── Regroupement par employé ──────────────────────────────────────────
  // ⚠️ Distinction essentielle :
  //  - "Donné (période)" et "Remboursé (période)" reflètent l'ACTIVITÉ du
  //    mois/année sélectionné (nouveaux prêts/avances accordés, paiements
  //    effectués) — c'est normal que ça varie selon la période affichée.
  //  - "Reste à rembourser" est TOUJOURS le vrai solde global actuel de
  //    l'employé, TOUT PRÊT/TOUTE AVANCE ACTIF confondu, peu importe quand
  //    ils ont été accordés. Un prêt de 2020 jamais remboursé doit continuer
  //    à apparaître ici quel que soit le mois/l'année affiché — le filtre de
  //    période ne doit JAMAIS faire disparaître une dette réelle. À l'inverse,
  //    un nouveau prêt accordé aujourd'hui s'ajoute immédiatement à ce total,
  //    et un remboursement le fait baisser immédiatement, peu importe la
  //    période affichée au moment où on regarde.
  const byEmployee = useMemo(() => {
    const inPeriodDate = (dateStr: string) => {
      const d = new Date(dateStr);
      if (d.getFullYear() !== year) return false;
      if (month !== '' && d.getMonth() + 1 !== month) return false;
      return true;
    };
    const inPeriodLog = (log: any) => {
      if (log.year !== year) return false;
      if (month !== '' && log.month !== month) return false;
      return true;
    };
    const nameQuery = nameFilter.trim().toLowerCase();
    const matchesName = (x: any) => !nameQuery || `${x.employee?.firstName ?? ''} ${x.employee?.lastName ?? ''}`.toLowerCase().includes(nameQuery);
    const matchesCommon = (x: any) => matchesName(x) && (!deptFilter || x.employee?.department?.name === deptFilter);

    type Row = { employeeId: string; employee: any; types: Set<string>; givenInPeriod: number; paidInPeriod: number; totalGranted: number; totalRepaidCumul: number; totalRemaining: number };
    const map = new Map<string, Row>();
    const touch = (emp: any, id: string): Row => {
      if (!map.has(id)) map.set(id, { employeeId: id, employee: emp, types: new Set(), givenInPeriod: 0, paidInPeriod: 0, totalGranted: 0, totalRepaidCumul: 0, totalRemaining: 0 });
      return map.get(id)!;
    };

    // 1) Cumul (accordé/remboursé/solde) — jamais filtré par période, seulement par type/dept/nom
    loans.forEach(l => {
      if (!matchesCommon(l) || (typeFilter && typeFilter !== l.type) || !['ACTIVE', 'PAID'].includes(l.status)) return;
      const row = touch(l.employee, l.employeeId);
      row.totalGranted += Number(l.amount);
      row.totalRepaidCumul += Number(l.amount) - Number(l.remainingBalance);
      row.totalRemaining += Number(l.remainingBalance);
      row.types.add(l.type ?? 'ARGENT');
    });
    advances.forEach(a => {
      if (!matchesCommon(a) || (typeFilter && typeFilter !== 'AVANCE') || !['APPROVED', 'DEDUCTED', 'PAID'].includes(a.status)) return;
      const row = touch(a.employee, a.employeeId);
      row.totalGranted += Number(a.amount);
      row.totalRepaidCumul += Number(a.amount) - Number(a.remainingBalance ?? a.amount);
      row.totalRemaining += Number(a.remainingBalance ?? (['DEDUCTED', 'PAID'].includes(a.status) ? 0 : a.amount));
      row.types.add('AVANCE');
    });

    // 2) "Donné" — nouveaux prêts/avances accordés PENDANT la période affichée
    loans.forEach(l => {
      if (!matchesCommon(l) || (typeFilter && typeFilter !== l.type) || !['ACTIVE', 'PAID'].includes(l.status)) return;
      if (inPeriodDate(l.startDate ?? l.createdAt)) {
        const row = touch(l.employee, l.employeeId);
        row.givenInPeriod += Number(l.amount);
        row.types.add(l.type ?? 'ARGENT');
      }
    });
    advances.forEach(a => {
      if (!matchesCommon(a) || (typeFilter && typeFilter !== 'AVANCE') || !['APPROVED', 'DEDUCTED', 'PAID'].includes(a.status)) return;
      if (inPeriodDate(a.createdAt)) {
        const row = touch(a.employee, a.employeeId);
        row.givenInPeriod += Number(a.amount);
        row.types.add('AVANCE');
      }
    });

    // 3) "Remboursé" — paiements réellement journalisés PENDANT la période
    loans.forEach(l => {
      if (!matchesCommon(l) || (typeFilter && typeFilter !== l.type)) return;
      (l.repaymentLogs ?? []).forEach((log: any) => {
        if (inPeriodLog(log)) touch(l.employee, l.employeeId).paidInPeriod += Number(log.amount);
      });
    });
    advances.forEach(a => {
      if (!matchesCommon(a) || (typeFilter && typeFilter !== 'AVANCE')) return;
      (a.repaymentLogs ?? []).forEach((log: any) => {
        if (inPeriodLog(log)) touch(a.employee, a.employeeId).paidInPeriod += Number(log.amount);
      });
    });

    // On affiche tout employé ayant déjà eu un prêt/une avance (comme sur la
    // page Relevé) — pas seulement ceux avec une activité dans la période.
    return Array.from(map.values())
      .filter(r => r.totalGranted > 0)
      .sort((a, b) => b.totalRemaining - a.totalRemaining);
  }, [loans, advances, month, year, typeFilter, deptFilter, nameFilter]);

  const kpis = useMemo(() => ({
    employees: byEmployee.length,
    totalGranted: byEmployee.reduce((s, e) => s + e.totalGranted, 0),
    totalRepaidCumul: byEmployee.reduce((s, e) => s + e.totalRepaidCumul, 0),
    totalGiven: byEmployee.reduce((s, e) => s + e.givenInPeriod, 0),
    totalRemaining: byEmployee.reduce((s, e) => s + e.totalRemaining, 0),
    totalPaid: byEmployee.reduce((s, e) => s + e.paidInPeriod, 0),
  }), [byEmployee]);

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

  if (isLoading) return <div className="flex justify-center py-24"><Loader2 className="animate-spin text-emerald-500" size={40} /></div>;

  return (
    <div className="max-w-[1500px] mx-auto pb-24 space-y-6">
      <FinanceSubNav userRole={userRole} />
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-[var(--text)]">Suivi des dettes</h1>
          <p className="text-sm text-[var(--text-muted)]">Le solde restant est toujours à jour ; "accordé" et "remboursé" reflètent l'activité de la période affichée.</p>
        </div>
        <button onClick={handleExport} disabled={isExporting} className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white text-sm font-bold rounded-xl flex items-center gap-2 shrink-0">
          {isExporting ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />} Exporter en Excel
        </button>
      </div>

      {/* ══════════════════ KPI — cumul global (jamais filtré) ══════════════════ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard icon={Users2} label="Employés concernés" value={String(kpis.employees)} tone="slate" />
        <KpiCard icon={Banknote} label="Montant total accordé" value={fmt(kpis.totalGranted)} tone="sky" />
        <KpiCard icon={PiggyBank} label="Total remboursé (cumul)" value={fmt(kpis.totalRepaidCumul)} tone="emerald" />
        <KpiCard icon={Wallet} label="Solde restant (à ce jour)" value={fmt(kpis.totalRemaining)} tone="amber" />
      </div>

      {/* ══════════════════ FILTRES + KPI de la période ══════════════════ */}
      <div className="flex flex-wrap gap-2">
        <div className="relative">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" />
          <input
            type="text" value={nameFilter} onChange={e => setNameFilter(e.target.value)}
            placeholder="Rechercher un nom..."
            className="pl-7 pr-3 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-xs w-48"
          />
        </div>
        <div className="flex rounded-lg border border-[var(--border)] overflow-hidden text-xs">
          <button onClick={() => { if (month === '') setMonth(now.getMonth() + 1); }} className={`px-3 py-1.5 font-bold transition-colors ${month !== '' ? 'bg-emerald-500 text-white' : 'text-[var(--text-muted)] hover:bg-[var(--surface-2)]'}`}>Mensuelle</button>
          <button onClick={() => setMonth('')} className={`px-3 py-1.5 font-bold transition-colors ${month === '' ? 'bg-emerald-500 text-white' : 'text-[var(--text-muted)] hover:bg-[var(--surface-2)]'}`}>Annuelle</button>
        </div>
        {month !== '' && (
          <select value={month} onChange={e => setMonth(Number(e.target.value))} className="text-xs px-2 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface)]">
            {MONTHS_FR.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
          </select>
        )}
        <select value={year} onChange={e => setYear(Number(e.target.value))} className="text-xs px-2 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface)]">
          {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
        <FilterSelect icon={Filter} value={typeFilter} onChange={setTypeFilter} placeholder="Tous les types" options={Object.entries(TYPE_LABEL)} />
        {departments.length > 0 && <FilterSelect icon={Users2} value={deptFilter} onChange={setDeptFilter} placeholder="Tous les départements" options={departments.map(d => [d, d] as [string, string])} />}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <KpiCard icon={Banknote} label={`Accordé (${month !== '' ? MONTHS_FR[month - 1] : year})`} value={fmt(kpis.totalGiven)} tone="sky" />
        <KpiCard icon={PiggyBank} label={`Remboursé (${month !== '' ? MONTHS_FR[month - 1] : year})`} value={fmt(kpis.totalPaid)} tone="emerald" />
      </div>

      {/* ══════════════════ LISTE PAR EMPLOYÉ ══════════════════ */}
      <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[var(--surface-2)]">
              <tr>{['Employé', 'Département', 'Type(s)', `Accordé (${month !== '' ? MONTHS_FR[month - 1] : year})`, `Remboursé (${month !== '' ? MONTHS_FR[month - 1] : year})`, 'Solde restant (à ce jour)', ''].map(h => <th key={h} className="px-4 py-3 text-left text-xs font-bold text-[var(--text-muted)] uppercase whitespace-nowrap">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {byEmployee.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-14 text-[var(--text-muted)]">Aucun employé avec un prêt ou une avance.</td></tr>
              ) : byEmployee.map(e => (
                <tr key={e.employeeId} className="hover:bg-[var(--surface-2)]/40">
                  <td className="px-4 py-3">
                    <Link href={bp(`/loans/suivi-dettes/${e.employeeId}`)} className="font-semibold text-[var(--text)] hover:text-emerald-600 hover:underline">
                      {e.employee?.firstName} {e.employee?.lastName}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-[var(--text-muted)]">{e.employee?.department?.name || '—'}</td>
                  <td className="px-4 py-3 text-[var(--text-muted)]">{Array.from(e.types as Set<string>).map((t: string) => TYPE_LABEL[t] ?? t).join(', ') || '—'}</td>
                  <td className="px-4 py-3 font-semibold text-[var(--text)] whitespace-nowrap">{e.givenInPeriod > 0 ? fmt(e.givenInPeriod) : '—'}</td>
                  <td className="px-4 py-3 text-emerald-600 whitespace-nowrap">{e.paidInPeriod > 0 ? fmt(e.paidInPeriod) : '—'}</td>
                  <td className="px-4 py-3 text-amber-600 font-semibold whitespace-nowrap">{fmt(e.totalRemaining)}</td>
                  <td className="px-4 py-3 text-right">
                    <Link href={bp(`/loans/suivi-dettes/${e.employeeId}`)} className="text-emerald-600 hover:underline text-xs font-semibold flex items-center gap-0.5 justify-end">
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
    slate: 'bg-[var(--surface-2)] text-[var(--text-muted)]',
    emerald: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-300',
    amber: 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-300',
    sky: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-300',
  };
  return (
    <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] p-4">
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${cls[tone]}`}><Icon size={18} /></div>
      <p className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-1">{label}</p>
      <p className="text-lg font-bold text-[var(--text)] truncate">{value}</p>
    </div>
  );
}

function FilterSelect({ icon: IconEl, value, onChange, placeholder, options }: { icon: any; value: string; onChange: (v: string) => void; placeholder: string; options: [string, string][] }) {
  return (
    <div className="relative">
      <IconEl size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" />
      <select value={value} onChange={e => onChange(e.target.value)} className="pl-7 pr-3 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-xs">
        <option value="">{placeholder}</option>
        {options.map(([val, label]) => <option key={val} value={val}>{label}</option>)}
      </select>
    </div>
  );
}