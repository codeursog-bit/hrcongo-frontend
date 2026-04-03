'use client';

/**
 * Page bulletins — vue cabinet
 * Route : /cabinet/[cabinetId]/entreprise/[companyId]/bulletins
 *
 * Après saisie des variables et génération, le cabinet consulte
 * les bulletins, les valide et les exporte (PDF, Sage).
 */

import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import {
  Download, CheckCircle2, Clock, ArrowLeft,
  FileText, Loader2, Eye, ChevronRight,
} from 'lucide-react';
import { api } from '@/services/api';

const MONTHS = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
const fmt = (n: number) => new Intl.NumberFormat('fr-CG', { maximumFractionDigits: 0 }).format(n);

interface Payroll {
  id: string;
  employee: { id: string; firstName: string; lastName: string; position: string };
  grossSalary: number;
  netSalary: number;
  totalEmployerCost: number;
  cnssEmployer: number;
  tusTotal: number;
  status: 'DRAFT' | 'VALIDATED' | 'PAID';
  month: number;
  year: number;
}

const statusConfig = {
  DRAFT:     { label: 'Brouillon', color: 'text-gray-400',   bg: 'bg-gray-500/10 border-gray-500/20' },
  VALIDATED: { label: 'Validé',    color: 'text-blue-400',   bg: 'bg-blue-500/10 border-blue-500/20' },
  PAID:      { label: 'Payé',      color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
};

export default function BulletinsPage() {
  const params      = useParams();
  const searchParams = useSearchParams();
  const router      = useRouter();
  const cabinetId   = params.cabinetId as string;
  const companyId   = params.companyId as string;

  const month = Number(searchParams.get('month') ?? new Date().getMonth() + 1);
  const year  = Number(searchParams.get('year')  ?? new Date().getFullYear());

  const [payrolls, setPayrolls]   = useState<Payroll[]>([]);
  const [loading, setLoading]     = useState(true);
  const [selected, setSelected]   = useState<string[]>([]);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    api.get(`/payrolls?companyId=${companyId}&month=${month}&year=${year}&limit=200`)
      .then((r: any) => setPayrolls(r.data ?? r))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [companyId, month, year]);

  const toggleSelect = (id: string) =>
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const selectAll = () =>
    setSelected(selected.length === payrolls.length ? [] : payrolls.map(p => p.id));

  const validateAll = async () => {
    for (const id of (selected.length ? selected : payrolls.map(p => p.id))) {
      await api.patch(`/payrolls/${id}`, { status: 'VALIDATED' }).catch(() => null);
    }
    setPayrolls(prev => prev.map(p =>
      (!selected.length || selected.includes(p.id)) ? { ...p, status: 'VALIDATED' } : p,
    ));
  };

  const exportPDF = async () => {
    setExporting(true);
    try {
      const ids = selected.length ? selected : payrolls.map(p => p.id);
      const blob: any = await api.post('/payrolls/export/batch-pdf', { payrollIds: ids });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `bulletins-${MONTHS[month - 1]}-${year}.pdf`;
      a.click();
    } catch (e: any) {
      alert(`Erreur export : ${e.message}`);
    } finally {
      setExporting(false);
    }
  };

  const exportSage = async () => {
    setExporting(true);
    try {
      const ids = selected.length ? selected : payrolls.map(p => p.id);
      const blob: any = await api.post('/payrolls/export/sage', { payrollIds: ids, companyId });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sage-paie-${month}-${year}.csv`;
      a.click();
    } catch (e: any) {
      alert(`Erreur export Sage : ${e.message}`);
    } finally {
      setExporting(false);
    }
  };

  const totals = payrolls.reduce((acc, p) => ({
    brut:   acc.brut   + p.grossSalary,
    net:    acc.net    + p.netSalary,
    cnss:   acc.cnss   + p.cnssEmployer,
    tus:    acc.tus    + p.tusTotal,
    cout:   acc.cout   + p.totalEmployerCost,
  }), { brut: 0, net: 0, cnss: 0, tus: 0, cout: 0 });

  if (loading) return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center">
      <Loader2 size={28} className="animate-spin text-purple-400" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#020617] text-white">

      {/* Header */}
      <div className="border-b border-white/10 bg-black/20 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push(`/cabinet/${cabinetId}/entreprise/${companyId}/paie`)}
              className="text-gray-500 hover:text-white transition-colors">
              <ArrowLeft size={16} />
            </button>
            <div>
              <h1 className="text-lg font-bold">Bulletins — {MONTHS[month - 1]} {year}</h1>
              <p className="text-gray-500 text-xs">{payrolls.length} bulletins générés</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button onClick={validateAll}
              className="flex items-center gap-2 px-3 py-2 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 rounded-xl text-sm text-blue-400 transition-colors">
              <CheckCircle2 size={14} />
              {selected.length ? `Valider (${selected.length})` : 'Valider tout'}
            </button>
            <button onClick={exportPDF} disabled={exporting}
              className="flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm text-gray-300 hover:text-white transition-colors disabled:opacity-50">
              {exporting ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
              PDF
            </button>
            <button onClick={exportSage} disabled={exporting}
              className="flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm text-gray-300 hover:text-white transition-colors disabled:opacity-50">
              {exporting ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
              Export Sage
            </button>
          </div>
        </div>

        {/* Récap */}
        <div className="grid grid-cols-5 gap-4 mt-4 pt-3 border-t border-white/5">
          {[
            { label: 'Masse brute',     value: totals.brut,  color: 'text-white' },
            { label: 'Net à payer',     value: totals.net,   color: 'text-emerald-400' },
            { label: 'CNSS patronale',  value: totals.cnss,  color: 'text-purple-400' },
            { label: 'TUS',             value: totals.tus,   color: 'text-purple-400' },
            { label: 'Coût employeur',  value: totals.cout,  color: 'text-amber-400' },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-white/3 border border-white/5 rounded-xl p-3">
              <p className="text-gray-500 text-[10px] uppercase tracking-wider">{label}</p>
              <p className={`font-bold text-sm mt-0.5 ${color}`}>{fmt(value)} <span className="text-[10px] font-normal text-gray-600">FCFA</span></p>
            </div>
          ))}
        </div>
      </div>

      {/* Tableau */}
      <div className="p-6">
        <div className="bg-white/3 border border-white/10 rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10">
                <th className="px-4 py-3 text-left">
                  <input type="checkbox"
                    checked={selected.length === payrolls.length && payrolls.length > 0}
                    onChange={selectAll} className="rounded" />
                </th>
                <th className="px-4 py-3 text-left text-xs text-gray-500 font-medium uppercase">Employé</th>
                <th className="px-4 py-3 text-right text-xs text-gray-500 font-medium uppercase">Brut</th>
                <th className="px-4 py-3 text-right text-xs text-gray-500 font-medium uppercase">Net</th>
                <th className="px-4 py-3 text-right text-xs text-gray-500 font-medium uppercase">Coût emp.</th>
                <th className="px-4 py-3 text-center text-xs text-gray-500 font-medium uppercase">Statut</th>
                <th className="px-4 py-3 text-center text-xs text-gray-500 font-medium uppercase">Bulletin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {payrolls.map(p => {
                const sc = statusConfig[p.status];
                return (
                  <tr key={p.id} className="hover:bg-white/3 transition-colors">
                    <td className="px-4 py-3">
                      <input type="checkbox"
                        checked={selected.includes(p.id)}
                        onChange={() => toggleSelect(p.id)}
                        className="rounded" />
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-white font-medium">{p.employee.firstName} {p.employee.lastName}</p>
                      <p className="text-gray-500 text-xs">{p.employee.position}</p>
                    </td>
                    <td className="px-4 py-3 text-right text-gray-300">{fmt(p.grossSalary)}</td>
                    <td className="px-4 py-3 text-right font-semibold text-emerald-400">{fmt(p.netSalary)}</td>
                    <td className="px-4 py-3 text-right text-purple-400">{fmt(p.totalEmployerCost)}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2.5 py-1 rounded-full border text-xs font-medium ${sc.bg} ${sc.color}`}>
                        {sc.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => router.push(`/cabinet/${cabinetId}/entreprise/${companyId}/bulletins/${p.id}`)}
                        className="p-1.5 hover:bg-white/10 rounded-lg text-gray-500 hover:text-white transition-colors">
                        <Eye size={14} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}