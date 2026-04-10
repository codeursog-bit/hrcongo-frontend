'use client';

// app/(dashboard)/cabinet/[cabinetId]/entreprise/[companyId]/rapports/page.tsx

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import {
  BarChart3, Loader2, TrendingUp, TrendingDown, Users,
  DollarSign, Calendar, Download, ArrowUpRight,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts';
import { api } from '@/services/api';

const fmt = (n: number) => new Intl.NumberFormat('fr-CG', { maximumFractionDigits: 0 }).format(n);
const CHART_COLORS = ['#0EA5E9','#10B981','#F59E0B','#8B5CF6','#EC4899','#6366F1'];
const MONTHS = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc'];

export default function CabinetRapportsPage() {
  const params    = useParams();
  const companyId = params.companyId as string;

  const now = new Date();
  const [year,     setYear]     = useState(now.getFullYear());
  const [stats,    setStats]    = useState<any>(null);
  const [payrolls, setPayrolls] = useState<any[]>([]);
  const [employees, setEmp]     = useState<any[]>([]);
  const [loading,   setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [emps, pays] = await Promise.all([
          api.get(`/employees?companyId=${companyId}&status=ACTIVE&limit=200`) as Promise<any>,
          api.get(`/payrolls?companyId=${companyId}&year=${year}&limit=500`) as Promise<any>,
        ]);
        const empList  = Array.isArray(emps)  ? emps  : emps?.data  ?? [];
        const payList  = Array.isArray(pays)  ? pays  : pays?.data  ?? [];
        setEmp(empList);
        setPayrolls(payList);

        // Calculs stats
        const totalGross = payList.reduce((s: number, p: any) => s + (p.grossSalary ?? 0), 0);
        const totalNet   = payList.reduce((s: number, p: any) => s + (p.netSalary ?? 0), 0);
        const totalCost  = payList.reduce((s: number, p: any) => s + (p.totalEmployerCost ?? 0), 0);
        const paid       = payList.filter((p: any) => p.status === 'PAID').length;
        const validated  = payList.filter((p: any) => p.status === 'VALIDATED').length;
        const draft      = payList.filter((p: any) => p.status === 'DRAFT').length;
        setStats({ totalGross, totalNet, totalCost, paid, validated, draft, count: payList.length, empCount: empList.length });
      } catch {
        setStats(null);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [companyId, year]);

  // Données graphique masse salariale par mois
  const masseSalariale = MONTHS.map((m, i) => {
    const monthPayrolls = payrolls.filter((p: any) => p.month === i + 1);
    return {
      mois:  m,
      brut:  monthPayrolls.reduce((s: number, p: any) => s + (p.grossSalary ?? 0), 0),
      net:   monthPayrolls.reduce((s: number, p: any) => s + (p.netSalary ?? 0), 0),
      cout:  monthPayrolls.reduce((s: number, p: any) => s + (p.totalEmployerCost ?? 0), 0),
    };
  });

  // Répartition statuts
  const statutData = stats ? [
    { name: 'Payés',    value: stats.paid,      color: '#10B981' },
    { name: 'Validés',  value: stats.validated,  color: '#0EA5E9' },
    { name: 'Brouillon',value: stats.draft,      color: '#F59E0B' },
  ].filter(d => d.value > 0) : [];

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 size={24} className="animate-spin text-gray-600" /></div>;
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <BarChart3 size={20} className="text-cyan-400" /> Rapports
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">Analyse RH et masse salariale</p>
        </div>
        <div className="flex items-center gap-2">
          <select value={year} onChange={e => setYear(Number(e.target.value))}
            className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white outline-none">
            {[year-1, year, year+1].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      {/* KPI cards */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Employés actifs',  value: stats.empCount,        icon: Users,       color: '#6366f1', fmt: (v: number) => `${v}` },
            { label: 'Masse nette',      value: stats.totalNet,        icon: DollarSign,  color: '#10b981', fmt: (v: number) => `${fmt(v)} F` },
            { label: 'Masse brute',      value: stats.totalGross,      icon: TrendingUp,  color: '#0ea5e9', fmt: (v: number) => `${fmt(v)} F` },
            { label: 'Coût total',       value: stats.totalCost,       icon: ArrowUpRight,color: '#f97316', fmt: (v: number) => `${fmt(v)} F` },
          ].map(c => (
            <div key={c.label} className="bg-white/3 border border-white/8 rounded-2xl p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-gray-500">{c.label}</p>
                <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                     style={{ background: `${c.color}22`, border: `1px solid ${c.color}44` }}>
                  <c.icon size={13} style={{ color: c.color }} />
                </div>
              </div>
              <p className="text-xl font-bold text-white">{c.fmt(c.value)}</p>
            </div>
          ))}
        </div>
      )}

      {/* Graphiques */}
      <div className="grid grid-cols-3 gap-4">
        {/* Masse salariale mensuelle */}
        <div className="col-span-2 bg-white/3 border border-white/8 rounded-2xl p-4">
          <h3 className="font-semibold text-white text-sm mb-4">Évolution masse salariale {year}</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={masseSalariale} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="mois" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} axisLine={false} tickLine={false}
                tickFormatter={(v) => `${(v/1000).toFixed(0)}K`} />
              <Tooltip
                contentStyle={{ background: '#0f1a2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12 }}
                labelStyle={{ color: '#e2e8f0' }}
                formatter={(v: any) => [`${fmt(v)} F`, '']}
              />
              <Legend wrapperStyle={{ fontSize: 11, color: '#9ca3af' }} />
              <Bar dataKey="brut"  name="Brut"  fill="#0EA5E9" radius={[3,3,0,0]} />
              <Bar dataKey="net"   name="Net"   fill="#10B981" radius={[3,3,0,0]} />
              <Bar dataKey="cout"  name="Coût total" fill="#F59E0B" radius={[3,3,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Répartition bulletins */}
        <div className="bg-white/3 border border-white/8 rounded-2xl p-4">
          <h3 className="font-semibold text-white text-sm mb-4">Bulletins {year}</h3>
          {statutData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={statutData} cx="50%" cy="50%" outerRadius={70} dataKey="value"
                  label={({ name, value }: any) => `${name}: ${value}`}
                  labelLine={{ stroke: 'rgba(255,255,255,0.2)' }}>
                  {statutData.map((entry: any, i: number) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: '#0f1a2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-40 text-gray-600 text-sm">Aucun bulletin</div>
          )}
          {stats && (
            <div className="mt-2 space-y-1">
              {[
                { label: 'Payés',     value: stats.paid,      color: 'bg-emerald-400' },
                { label: 'Validés',   value: stats.validated,  color: 'bg-blue-400' },
                { label: 'Brouillons',value: stats.draft,      color: 'bg-amber-400' },
              ].map(s => (
                <div key={s.label} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <div className={`w-2 h-2 rounded-full ${s.color}`} />
                    <span className="text-gray-400">{s.label}</span>
                  </div>
                  <span className="text-white font-medium">{s.value}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Derniers bulletins */}
      {payrolls.length > 0 && (
        <div className="bg-white/3 border border-white/8 rounded-2xl overflow-hidden">
          <div className="px-4 py-3 border-b border-white/8">
            <h3 className="font-semibold text-white text-sm">Derniers bulletins ({payrolls.length})</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-white/5">
                  {['Employé','Mois','Brut','Net','Coût total','Statut'].map(h => (
                    <th key={h} className="px-4 py-2.5 text-left text-gray-500 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {payrolls.slice(0,10).map((p: any) => (
                  <tr key={p.id} className="hover:bg-white/3">
                    <td className="px-4 py-2.5 text-white">{p.employee?.firstName} {p.employee?.lastName}</td>
                    <td className="px-4 py-2.5 text-gray-400">{MONTHS[(p.month ?? 1) - 1]} {p.year}</td>
                    <td className="px-4 py-2.5 text-gray-300">{fmt(p.grossSalary ?? 0)} F</td>
                    <td className="px-4 py-2.5 text-emerald-400 font-medium">{fmt(p.netSalary ?? 0)} F</td>
                    <td className="px-4 py-2.5 text-amber-400">{fmt(p.totalEmployerCost ?? 0)} F</td>
                    <td className="px-4 py-2.5">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] ${
                        p.status === 'PAID' ? 'bg-emerald-500/10 text-emerald-400' :
                        p.status === 'VALIDATED' ? 'bg-blue-500/10 text-blue-400' :
                        'bg-amber-500/10 text-amber-400'
                      }`}>{p.status === 'PAID' ? 'Payé' : p.status === 'VALIDATED' ? 'Validé' : 'Brouillon'}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}