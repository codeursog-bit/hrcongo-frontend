'use client';

// app/pme/[companyId]/paie/page.tsx
// Vue paie PME — identique à la page paie entreprise SAUF sans boutons "Générer"
// Montre : stats masse salariale, liste bulletins, statuts — lecture seule

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { DollarSign, FileText, TrendingUp, Users, Info, ChevronDown, Loader2, Download } from 'lucide-react';
import { api } from '@/services/api';

const MONTHS = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
const fmt    = (n: number) => new Intl.NumberFormat('fr-CG', { maximumFractionDigits: 0 }).format(n);

const STATUS_CFG: Record<string, { label: string; color: string; bg: string }> = {
  DRAFT:     { label: 'En cours',  color: 'text-amber-400',   bg: 'bg-amber-500/10'   },
  VALIDATED: { label: 'Validé',    color: 'text-blue-400',    bg: 'bg-blue-500/10'    },
  PAID:      { label: 'Payé',      color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
};

export default function PmePaiePage() {
  const params    = useParams();
  const companyId = params.companyId as string;

  const now = new Date();
  const [month,    setMonth]    = useState(now.getMonth() + 1);
  const [year,     setYear]     = useState(now.getFullYear());
  const [payrolls, setPayrolls] = useState<any[]>([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        // PME user a son companyId → pas besoin de ?companyId=
        const res: any = await api.get(`/payrolls?month=${month}&year=${year}&limit=200`);
        setPayrolls(Array.isArray(res) ? res : res?.data ?? []);
      } catch { setPayrolls([]); }
      finally  { setLoading(false); }
    };
    load();
  }, [month, year]);

  const totalGross = payrolls.reduce((s, p) => s + (p.grossSalary ?? 0), 0);
  const totalNet   = payrolls.reduce((s, p) => s + (p.netSalary   ?? 0), 0);
  const totalCost  = payrolls.reduce((s, p) => s + (p.totalEmployerCost ?? 0), 0);

  const exportAll = async () => {
    if (payrolls.length === 0) return;
    try {
      const ids  = payrolls.map(p => p.id);
      const blob: any = await api.post('/payrolls/export/batch-pdf', { payrollIds: ids });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = `bulletins-${MONTHS[month - 1]}-${year}.pdf`;
      a.click();
    } catch {}
  };

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <DollarSign size={22} className="text-emerald-400" /> Paie
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">Bulletins générés par votre cabinet</p>
        </div>
        {/* Info band — remplace les boutons de génération */}
        <div className="flex items-center gap-2 px-4 py-2.5 bg-blue-500/8 border border-blue-500/20 rounded-xl">
          <Info size={14} className="text-blue-400 shrink-0" />
          <span className="text-blue-300 text-sm">Paie gérée par votre cabinet</span>
        </div>
      </div>

      {/* Sélecteur mois/année */}
      <div className="flex items-center gap-2">
        <div className="relative">
          <select value={month} onChange={e => setMonth(Number(e.target.value))}
            className="appearance-none bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white pr-8 outline-none focus:border-white/30">
            {MONTHS.map((m, i) => <option key={m} value={i+1}>{m}</option>)}
          </select>
          <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
        </div>
        <div className="relative">
          <select value={year} onChange={e => setYear(Number(e.target.value))}
            className="appearance-none bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white pr-8 outline-none">
            {[year-1, year, year+1].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
        </div>
        {payrolls.length > 0 && (
          <button onClick={exportAll}
            className="flex items-center gap-1.5 px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm text-gray-300 hover:text-white transition-colors ml-2">
            <Download size={13} /> Exporter PDF
          </button>
        )}
      </div>

      {/* Stats */}
      {!loading && payrolls.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Bulletins',    value: `${payrolls.length}`,      icon: FileText,    color: '#6366f1' },
            { label: 'Masse nette',  value: `${fmt(totalNet)} F`,      icon: DollarSign,  color: '#22c55e' },
            { label: 'Masse brute',  value: `${fmt(totalGross)} F`,    icon: TrendingUp,  color: '#0ea5e9' },
            { label: 'Coût total',   value: `${fmt(totalCost)} F`,     icon: Users,       color: '#f97316' },
          ].map(c => (
            <div key={c.label} className="bg-white/3 border border-white/8 rounded-2xl p-4 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                   style={{ background: `${c.color}22`, border: `1px solid ${c.color}44` }}>
                <c.icon size={16} style={{ color: c.color }} />
              </div>
              <div>
                <p className="text-white font-bold text-sm">{c.value}</p>
                <p className="text-xs text-gray-500">{c.label}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Liste bulletins */}
      <div className="bg-white/3 border border-white/8 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-white/8">
          <h2 className="font-semibold text-white text-sm">
            {MONTHS[month-1]} {year} · {payrolls.length} bulletin{payrolls.length > 1 ? 's' : ''}
          </h2>
        </div>

        {loading ? (
          <div className="flex justify-center py-10"><Loader2 size={22} className="animate-spin text-gray-600" /></div>
        ) : payrolls.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <FileText size={28} className="mx-auto mb-2 text-gray-700" />
            <p>Aucun bulletin pour {MONTHS[month-1]} {year}</p>
            <p className="text-xs text-gray-600 mt-1">Votre cabinet n'a pas encore généré la paie ce mois-ci</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5">
                  {['Employé','Poste','Brut','Net','Coût','Statut'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs text-gray-500 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {payrolls.map((p: any) => {
                  const sc = STATUS_CFG[p.status] ?? STATUS_CFG['DRAFT'];
                  return (
                    <tr key={p.id} className="hover:bg-white/3 transition-colors">
                      <td className="px-4 py-3">
                        <p className="text-white font-medium">{p.employee?.firstName} {p.employee?.lastName}</p>
                        <p className="text-xs text-gray-500">{p.employee?.employeeNumber}</p>
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-xs">{p.employee?.position}</td>
                      <td className="px-4 py-3 text-gray-300 text-sm">{fmt(p.grossSalary ?? 0)} F</td>
                      <td className="px-4 py-3 text-emerald-400 font-semibold text-sm">{fmt(p.netSalary ?? 0)} F</td>
                      <td className="px-4 py-3 text-amber-400 text-sm">{fmt(p.totalEmployerCost ?? 0)} F</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${sc.bg} ${sc.color}`}>{sc.label}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}