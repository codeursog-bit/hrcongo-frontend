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
import { Loader2, Search, ChevronRight, Wallet, Banknote, PiggyBank, TrendingDown, Users2 } from 'lucide-react';
import { api } from '@/services/api';
import { useBasePath } from '@/hooks/useBasePath';
import FinanceSubNav from '@/components/FinanceSubNav';

const fmt = (n: number) => Math.round(n).toLocaleString('fr-FR') + ' FCFA';

export default function ReleveRecapPage() {
  const { bp } = useBasePath();
  const [loans, setLoans] = useState<any[]>([]);
  const [advances, setAdvances] = useState<any[]>([]);
  const [userRole, setUserRole] = useState('');
  const [nameFilter, setNameFilter] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try { const stored = localStorage.getItem('user'); if (stored) setUserRole(JSON.parse(stored).role || ''); } catch {}
    (async () => {
      try {
        const [l, a]: any = await Promise.all([api.get('/loans'), api.get('/loans/advances')]);
        setLoans(l || []); setAdvances(a || []);
      } catch (e) { console.error('Erreur chargement relevé', e); }
      finally { setIsLoading(false); }
    })();
  }, []);

  // ── Un solde par employé, façon feuille RECAP ────────────────────────────
  const rows = useMemo(() => {
    const byEmployee: Record<string, any> = {};
    const touch = (emp: any, employeeId: string) => {
      if (!byEmployee[employeeId]) {
        byEmployee[employeeId] = { employeeId, employee: emp, totalDu: 0, totalRembourse: 0, nbDettes: 0, dernierMouvement: null as string | null };
      }
      return byEmployee[employeeId];
    };
    const touchDate = (row: any, date: string) => {
      if (!row.dernierMouvement || new Date(date) > new Date(row.dernierMouvement)) row.dernierMouvement = date;
    };

    loans.filter(l => ['ACTIVE', 'PAID'].includes(l.status)).forEach(l => {
      const row = touch(l.employee, l.employeeId);
      row.totalDu += Number(l.amount);
      row.totalRembourse += Number(l.amount) - Number(l.remainingBalance);
      row.nbDettes += 1;
      touchDate(row, l.createdAt);
    });
    advances.filter(a => ['APPROVED', 'DEDUCTED', 'PAID'].includes(a.status)).forEach(a => {
      const row = touch(a.employee, a.employeeId);
      row.totalDu += Number(a.amount);
      row.totalRembourse += Number(a.amount) - Number(a.remainingBalance ?? a.amount);
      row.nbDettes += 1;
      touchDate(row, a.createdAt);
    });
    const nameQuery = nameFilter.trim().toLowerCase();
    return Object.values(byEmployee)
      .map((r: any) => ({ ...r, solde: r.totalDu - r.totalRembourse }))
      .filter((r: any) => !nameQuery || `${r.employee?.firstName ?? ''} ${r.employee?.lastName ?? ''}`.toLowerCase().includes(nameQuery))
      .sort((a: any, b: any) => `${a.employee?.lastName}`.localeCompare(`${b.employee?.lastName}`));
  }, [loans, advances, nameFilter]);

  const kpis = useMemo(() => ({
    totalDu: rows.reduce((s, r) => s + r.totalDu, 0),
    totalRembourse: rows.reduce((s, r) => s + r.totalRembourse, 0),
    totalSolde: rows.reduce((s, r) => s + r.solde, 0),
    nbEmployes: rows.length,
  }), [rows]);

  if (isLoading) return <div className="flex justify-center py-24"><Loader2 className="animate-spin text-sky-500" size={40} /></div>;

  const initials = (emp: any) => `${emp?.firstName?.[0] ?? ''}${emp?.lastName?.[0] ?? ''}`;

  return (
    <div className="max-w-[1500px] mx-auto pb-24 space-y-6">
      <FinanceSubNav userRole={userRole} />

      <div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Relevé — Prêts, avances & remboursements</h1>
        <p className="text-sm text-gray-500">Solde par employé, pour suivre qui doit quoi.</p>
      </div>

      {/* ══════════════════ KPI ══════════════════ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard icon={Users2} label="Employés concernés" value={String(kpis.nbEmployes)} tone="slate" />
        <KpiCard icon={Banknote} label="Total dû (cumul)" value={fmt(kpis.totalDu)} tone="sky" />
        <KpiCard icon={PiggyBank} label="Total remboursé" value={fmt(kpis.totalRembourse)} tone="emerald" />
        <KpiCard icon={TrendingDown} label="Solde restant (tous)" value={fmt(kpis.totalSolde)} tone="amber" />
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
              <th className="px-4 py-3">Département</th>
              <th className="px-4 py-3 text-center">Dettes</th>
              <th className="px-4 py-3">Dernier mouvement</th>
              <th className="px-4 py-3 text-right">Total dû</th>
              <th className="px-4 py-3 text-right">Remboursé</th>
              <th className="px-4 py-3 text-right">Solde</th>
              <th className="px-4 py-3 w-8" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
            {rows.length === 0 ? (
              <tr><td colSpan={8} className="text-center py-12 text-gray-400"><Users2 className="mx-auto mb-2" size={28} />Aucun employé avec un prêt ou une avance.</td></tr>
            ) : rows.map((r: any) => (
              <tr key={r.employeeId} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                <td className="px-4 py-3">
                  <Link href={bp(`/loans/releve/${r.employeeId}`)} className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-sky-100 dark:bg-sky-900/30 flex items-center justify-center text-xs font-bold text-sky-600 overflow-hidden shrink-0">
                      {r.employee?.photoUrl ? <img src={r.employee.photoUrl} className="w-full h-full object-cover" alt="" /> : initials(r.employee)}
                    </div>
                    <span className="font-semibold text-gray-800 dark:text-gray-100 hover:text-sky-600 hover:underline">
                      {r.employee?.firstName} {r.employee?.lastName}
                    </span>
                  </Link>
                </td>
                <td className="px-4 py-3 text-gray-500">{r.employee?.department?.name || '—'}</td>
                <td className="px-4 py-3 text-center text-gray-500">{r.nbDettes}</td>
                <td className="px-4 py-3 text-gray-500">{r.dernierMouvement ? new Date(r.dernierMouvement).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}</td>
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