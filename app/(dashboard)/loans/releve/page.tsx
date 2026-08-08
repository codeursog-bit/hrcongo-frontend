'use client';

// ============================================================================
// 📁 app/(dashboard)/loans/releve/page.tsx
// ✅ "Relevé" — page dédiée au suivi des remboursements, calquée sur le
//    modèle Excel du client (feuille RECAP + une feuille par employé).
//    Contrairement à "Suivi des dettes" (dashboard/KPI), ici c'est un vrai
//    relevé de compte : Numéro / Nom / Prénom / Solde, cliquable vers le
//    détail chronologique de chaque employé.
// ============================================================================

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Loader2, Search, ChevronRight, Wallet, Users2 } from 'lucide-react';
import { api } from '@/services/api';
import { useBasePath } from '@/hooks/useBasePath';
import FinanceSubNav from '@/components/FinanceSubNav';

const fmt = (n: number) => Math.round(n).toLocaleString('fr-FR') + ' FCFA';

export default function ReleveRecapPage() {
  const { bp } = useBasePath();
  const [loans, setLoans] = useState<any[]>([]);
  const [advances, setAdvances] = useState<any[]>([]);
  const [deductions, setDeductions] = useState<any[]>([]);
  const [userRole, setUserRole] = useState('');
  const [nameFilter, setNameFilter] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try { const stored = localStorage.getItem('user'); if (stored) setUserRole(JSON.parse(stored).role || ''); } catch {}
    (async () => {
      try {
        const [l, a, d]: any = await Promise.all([
          api.get('/loans'), api.get('/loans/advances'), api.get('/company-deductions'),
        ]);
        setLoans(l || []); setAdvances(a || []); setDeductions(d || []);
      } catch (e) { console.error('Erreur chargement relevé', e); }
      finally { setIsLoading(false); }
    })();
  }, []);

  // ── Un solde par employé, façon feuille RECAP ────────────────────────────
  const rows = useMemo(() => {
    const byEmployee: Record<string, any> = {};
    const touch = (emp: any, employeeId: string) => {
      if (!byEmployee[employeeId]) {
        byEmployee[employeeId] = { employeeId, employee: emp, totalDu: 0, totalRembourse: 0 };
      }
      return byEmployee[employeeId];
    };

    loans.filter(l => ['ACTIVE', 'PAID'].includes(l.status)).forEach(l => {
      const row = touch(l.employee, l.employeeId);
      row.totalDu += Number(l.amount);
      row.totalRembourse += Number(l.amount) - Number(l.remainingBalance);
    });
    advances.filter(a => ['APPROVED', 'DEDUCTED', 'PAID'].includes(a.status)).forEach(a => {
      const row = touch(a.employee, a.employeeId);
      row.totalDu += Number(a.amount);
      row.totalRembourse += Number(a.amount) - Number(a.remainingBalance ?? a.amount);
    });
    // Les retenues diverses (Pharmacie, Hôpital, Cantine...) sont directement
    // déduites sur la paie du mois — dès que DEDUCTED, elles comptent comme
    // "dû" ET "remboursé" en même temps (donc neutres sur le solde), et comme
    // "dû" seul tant qu'elles sont PENDING (pas encore passées en paie).
    deductions.filter(d => d.status !== 'CANCELLED').forEach(d => {
      const row = touch(d.employee, d.employeeId);
      row.totalDu += Number(d.amount);
      if (d.status === 'DEDUCTED') row.totalRembourse += Number(d.amount);
    });

    const nameQuery = nameFilter.trim().toLowerCase();
    return Object.values(byEmployee)
      .map((r: any) => ({ ...r, solde: r.totalDu - r.totalRembourse }))
      .filter((r: any) => !nameQuery || `${r.employee?.firstName ?? ''} ${r.employee?.lastName ?? ''}`.toLowerCase().includes(nameQuery))
      .sort((a: any, b: any) => `${a.employee?.lastName}`.localeCompare(`${b.employee?.lastName}`));
  }, [loans, advances, deductions, nameFilter]);

  const totalSolde = rows.reduce((s, r) => s + r.solde, 0);

  if (isLoading) return <div className="flex justify-center py-24"><Loader2 className="animate-spin text-sky-500" size={40} /></div>;

  return (
    <div className="max-w-[900px] mx-auto pb-24 space-y-5">
      <FinanceSubNav userRole={userRole} />

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Relevé — Prêts, avances & remboursements</h1>
          <p className="text-sm text-gray-500">Solde par employé, pour suivre qui doit quoi.</p>
        </div>
        <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl px-4 py-2.5 flex items-center gap-2">
          <Wallet size={16} className="text-sky-500" />
          <div>
            <p className="text-[10px] font-semibold text-gray-400 uppercase">Total dû (tous employés)</p>
            <p className="text-sm font-bold text-gray-900 dark:text-white">{fmt(totalSolde)}</p>
          </div>
        </div>
      </div>

      <div className="relative max-w-xs">
        <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        <input
          type="text" value={nameFilter} onChange={e => setNameFilter(e.target.value)}
          placeholder="Rechercher un nom..."
          className="pl-7 pr-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 text-sm w-full"
        />
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[11px] font-semibold text-gray-400 uppercase border-b border-gray-100 dark:border-gray-700">
              <th className="px-4 py-3">Employé</th>
              <th className="px-4 py-3 text-right">Total dû</th>
              <th className="px-4 py-3 text-right">Remboursé</th>
              <th className="px-4 py-3 text-right">Solde</th>
              <th className="px-4 py-3 w-8" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
            {rows.length === 0 ? (
              <tr><td colSpan={5} className="text-center py-12 text-gray-400"><Users2 className="mx-auto mb-2" size={28} />Aucun employé avec un prêt, une avance ou une retenue.</td></tr>
            ) : rows.map((r: any) => (
              <tr key={r.employeeId}>
                <td className="px-4 py-3">
                  <Link href={bp(`/loans/releve/${r.employeeId}`)} className="font-semibold text-gray-800 dark:text-gray-100 hover:text-sky-600 hover:underline">
                    {r.employee?.firstName} {r.employee?.lastName}
                  </Link>
                  <p className="text-xs text-gray-400">{r.employee?.department?.name || '—'}</p>
                </td>
                <td className="px-4 py-3 text-right text-gray-600 dark:text-gray-300">{fmt(r.totalDu)}</td>
                <td className="px-4 py-3 text-right text-emerald-600">{fmt(r.totalRembourse)}</td>
                <td className={`px-4 py-3 text-right font-bold ${r.solde > 0 ? 'text-amber-600' : 'text-gray-400'}`}>{fmt(r.solde)}</td>
                <td className="px-4 py-3">
                  <Link href={bp(`/loans/releve/${r.employeeId}`)}><ChevronRight size={16} className="text-gray-300" /></Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}