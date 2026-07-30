'use client';

// app/pme/[companyId]/bulletins/page.tsx
// Version standalone — ne dépend pas de [cabinetId]
// La PME consulte et télécharge ses bulletins générés par le cabinet

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { FileText, Loader2, Download, ChevronDown } from 'lucide-react';
import { api } from '@/services/api';

const MONTHS = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
const fmt    = (n: number) => new Intl.NumberFormat('fr-CG', { maximumFractionDigits: 0 }).format(n);

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  DRAFT:     { label: 'En cours',  color: 'text-amber-400'   },
  VALIDATED: { label: 'Validé',    color: 'text-blue-400'    },
  PAID:      { label: 'Payé',      color: 'text-emerald-400' },
};

export default function PmeBulletinsPage() {
  const params    = useParams();
  const companyId = params.companyId as string;

  const now = new Date();
  const [month,    setMonth]    = useState(now.getMonth() + 1);
  const [year,     setYear]     = useState(now.getFullYear());
  const [payrolls, setPayrolls] = useState<any[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [selected, setSelected] = useState<string[]>([]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res: any = await api.get(`/payrolls?month=${month}&year=${year}&limit=200`);
        setPayrolls(Array.isArray(res) ? res : res?.data ?? []);
      } catch { setPayrolls([]); } finally { setLoading(false); }
    };
    load();
  }, [month, year]);

  const exportPdf = async (ids: string[]) => {
    try {
      const blob: any = await api.post('/payrolls/export/batch-pdf', { payrollIds: ids });
      const url = URL.createObjectURL(blob);
      const a   = document.createElement('a');
      a.href = url; a.download = `bulletins-${MONTHS[month - 1]}-${year}.pdf`; a.click();
    } catch {}
  };

  const totalNet   = payrolls.reduce((s, p) => s + (p.netSalary   ?? 0), 0);
  const totalGross = payrolls.reduce((s, p) => s + (p.grossSalary ?? 0), 0);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Bulletins de salaire</h1>
          <p className="text-gray-500 text-sm mt-0.5">Générés par votre cabinet — lecture et téléchargement</p>
        </div>
        {selected.length > 0 && (
          <button onClick={() => exportPdf(selected)}
            className="flex items-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm text-gray-300 transition-colors">
            <Download size={14} /> Télécharger ({selected.length})
          </button>
        )}
      </div>

      {/* Sélecteur mois */}
      <div className="flex gap-2">
        <div className="relative">
          <select value={month} onChange={e => setMonth(Number(e.target.value))}
            className="appearance-none bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white pr-8 outline-none">
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
      </div>

      {/* Stats */}
      {!loading && payrolls.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Employés',    value: `${payrolls.length}`,          color: '#6366f1' },
            { label: 'Masse nette', value: `${fmt(totalNet)} F CFA`,      color: '#22c55e' },
            { label: 'Masse brute', value: `${fmt(totalGross)} F CFA`,    color: '#0ea5e9' },
          ].map(c => (
            <div key={c.label} className="bg-white/3 border border-white/8 rounded-2xl p-4">
              <p className="text-white font-bold text-lg">{c.value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{c.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Liste */}
      <div className="bg-white/3 border border-white/8 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-white/8 flex items-center justify-between">
          <h2 className="font-semibold text-white text-sm">
            {MONTHS[month-1]} {year} · {payrolls.length} bulletin{payrolls.length > 1 ? 's' : ''}
          </h2>
          {payrolls.length > 0 && (
            <button onClick={() => exportPdf(payrolls.map(p => p.id))}
              className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white px-3 py-1.5 bg-white/5 rounded-lg border border-white/8 transition-colors">
              <Download size={12} /> Tout exporter
            </button>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center py-10"><Loader2 size={24} className="animate-spin text-gray-600" /></div>
        ) : payrolls.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <FileText size={28} className="mx-auto mb-2 text-gray-700" />
            <p>Aucun bulletin pour {MONTHS[month-1]} {year}</p>
            <p className="text-xs text-gray-600 mt-1">Votre cabinet n'a pas encore généré la paie ce mois-ci</p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {payrolls.map((payroll: any) => {
              const sc  = STATUS_CONFIG[payroll.status] ?? STATUS_CONFIG['DRAFT'];
              const chk = selected.includes(payroll.id);
              return (
                <div key={payroll.id} className="px-5 py-3.5 flex items-center gap-3 hover:bg-white/3 transition-colors">
                  <input type="checkbox" checked={chk}
                    onChange={() => setSelected(p => chk ? p.filter(x => x !== payroll.id) : [...p, payroll.id])}
                    className="rounded" />
                  <div className="w-8 h-8 bg-white/5 border border-white/8 rounded-lg flex items-center justify-center shrink-0">
                    <span className="text-[10px] font-bold text-gray-400">
                      {(payroll.employee?.lastName || '?').slice(0,2).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white">
                      {payroll.employee?.firstName} {payroll.employee?.lastName}
                    </p>
                    <p className="text-xs text-gray-500">{payroll.employee?.position}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold text-white">{fmt(payroll.netSalary ?? 0)} F</p>
                    <p className="text-xs text-gray-500">Brut: {fmt(payroll.grossSalary ?? 0)} F</p>
                  </div>
                  <span className={`text-xs shrink-0 ${sc.color}`}>{sc.label}</span>
                  <button onClick={() => exportPdf([payroll.id])}
                    className="p-1.5 hover:bg-white/5 rounded-lg text-gray-600 hover:text-white transition-colors shrink-0">
                    <Download size={14} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}