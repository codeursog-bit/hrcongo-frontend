'use client';

// ============================================================================
// 📁 app/(dashboard)/presences/permissions/suivi/page.tsx
// ✅ Page "Suivi des permissions" — employés avec au moins un ticket autorisé
//    sur la période sélectionnée, filtres mois/année/département/type, KPI,
//    clic → fiche employé. Même modèle que /loans/suivi-dettes.
// ============================================================================

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Loader2, Filter, Users2, ChevronRight, Ticket, CheckCircle2, Clock } from 'lucide-react';
import { api } from '@/services/api';
import { useBasePath } from '@/hooks/useBasePath';
import PresenceSubNav from '@/components/PresenceSubNav';
import PermissionsSubNav from '@/components/PermissionsSubNav';

const MONTHS_FR = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
const TYPE_LABEL: Record<string, string> = { URGENCE: 'Urgence', MISSION: 'Mission', AUTRE: 'Autre' };

export default function PermissionsSuiviPage() {
  const { bp } = useBasePath();
  const [tickets, setTickets] = useState<any[]>([]);
  const [userRole, setUserRole] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const now = new Date();
  const [month, setMonth] = useState<number | ''>(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [deptFilter, setDeptFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  useEffect(() => {
    try { const stored = localStorage.getItem('user'); if (stored) setUserRole(JSON.parse(stored).role || ''); } catch {}
    (async () => {
      try { setTickets((await api.get('/permission-tickets')) || []); }
      catch (e) { console.error('Erreur chargement suivi permissions', e); }
      finally { setIsLoading(false); }
    })();
  }, []);

  const availableYears = useMemo(() => {
    const set = new Set<number>([now.getFullYear()]);
    tickets.forEach(t => set.add(new Date(t.createdAt).getFullYear()));
    return Array.from(set).sort((a, b) => b - a);
  }, [tickets, now]);

  const departments = useMemo(() => Array.from(new Set(tickets.map(t => t.employee?.department?.name).filter(Boolean))).sort(), [tickets]);

  const inPeriod = useMemo(() => tickets.filter(t => {
    const d = new Date(t.createdAt);
    if (d.getFullYear() !== year) return false;
    if (month !== '' && d.getMonth() + 1 !== month) return false;
    return (!typeFilter || t.type === typeFilter) && (!deptFilter || t.employee?.department?.name === deptFilter);
  }), [tickets, month, year, typeFilter, deptFilter]);

  const byEmployee = useMemo(() => {
    const map = new Map<string, { employeeId: string; employee: any; total: number; approved: number; pending: number; rejected: number }>();
    inPeriod.forEach(t => {
      const key = t.employeeId;
      if (!map.has(key)) map.set(key, { employeeId: key, employee: t.employee, total: 0, approved: 0, pending: 0, rejected: 0 });
      const e = map.get(key)!;
      e.total += 1;
      if (t.status === 'APPROVED') e.approved += 1;
      else if (t.status === 'PENDING') e.pending += 1;
      else if (t.status === 'REJECTED') e.rejected += 1;
    });
    return Array.from(map.values()).sort((a, b) => b.total - a.total);
  }, [inPeriod]);

  const kpis = useMemo(() => ({
    employees: byEmployee.length,
    total: inPeriod.length,
    approved: inPeriod.filter(t => t.status === 'APPROVED').length,
    pending: inPeriod.filter(t => t.status === 'PENDING').length,
  }), [byEmployee, inPeriod]);

  if (isLoading) return <div className="flex justify-center py-24"><Loader2 className="animate-spin text-sky-500" size={40} /></div>;

  return (
    <div className="max-w-[1500px] mx-auto pb-24 space-y-6">
      <PresenceSubNav userRole={userRole} />
      <PermissionsSubNav userRole={userRole} />

      <div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Suivi des permissions</h1>
        <p className="text-sm text-gray-500">Employés ayant demandé une sortie sur la période sélectionnée.</p>
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
        <KpiCard icon={Ticket} label="Total tickets (période)" value={String(kpis.total)} tone="sky" />
        <KpiCard icon={CheckCircle2} label="Autorisés" value={String(kpis.approved)} tone="emerald" />
        <KpiCard icon={Clock} label="En attente" value={String(kpis.pending)} tone="amber" />
      </div>

      {/* ══════════════════ LISTE PAR EMPLOYÉ ══════════════════ */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>{['Employé', 'Département', 'Total tickets', 'Autorisés', 'En attente', 'Refusés', ''].map(h => <th key={h} className="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase whitespace-nowrap">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {byEmployee.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-14 text-gray-400">Aucun ticket pour cette période/ce filtre.</td></tr>
              ) : byEmployee.map(e => (
                <tr key={e.employeeId} className="hover:bg-gray-50 dark:hover:bg-gray-700/40">
                  <td className="px-4 py-3">
                    <Link href={bp(`/presences/permissions/suivi/${e.employeeId}`)} className="font-semibold text-gray-800 dark:text-gray-100 hover:text-sky-600 hover:underline">
                      {e.employee?.firstName} {e.employee?.lastName}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{e.employee?.department?.name || '—'}</td>
                  <td className="px-4 py-3 font-semibold text-gray-800 dark:text-gray-100">{e.total}</td>
                  <td className="px-4 py-3 text-emerald-600 font-semibold">{e.approved}</td>
                  <td className="px-4 py-3 text-amber-600">{e.pending}</td>
                  <td className="px-4 py-3 text-red-500">{e.rejected}</td>
                  <td className="px-4 py-3 text-right">
                    <Link href={bp(`/presences/permissions/suivi/${e.employeeId}`)} className="text-sky-600 hover:underline text-xs font-semibold flex items-center gap-0.5 justify-end">
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