'use client';

// app/(dashboard)/cabinet/[cabinetId]/entreprise/[companyId]/resume-presences/page.tsx
// Résumé présences avec variables heures sup — données prêtes pour saisie paie

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  BarChart3, Loader2, ChevronLeft, ChevronRight,
  Download, ArrowRight, AlertCircle,
} from 'lucide-react';
import { api } from '@/services/api';

const MONTHS = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
const fmt2   = (n: number) => n.toFixed(2);

export default function ResumePresencesPage() {
  const params    = useParams();
  const router    = useRouter();
  const cabinetId = params.cabinetId as string;
  const companyId = params.companyId as string;

  const now = new Date();
  const [month,   setMonth]   = useState(now.getMonth() + 1);
  const [year,    setYear]    = useState(now.getFullYear());
  const [report,  setReport]  = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const data: any = await api.get(
          `/attendance/report?companyId=${companyId}&month=${month}&year=${year}`
        );
        setReport(Array.isArray(data) ? data : []);
      } catch { setReport([]); }
      finally { setLoading(false); }
    };
    load();
  }, [companyId, month, year]);

  const prevMonth = () => { if (month === 1) { setMonth(12); setYear(y => y - 1); } else setMonth(m => m - 1); };
  const nextMonth = () => { if (month === 12) { setMonth(1); setYear(y => y + 1); } else setMonth(m => m + 1); };

  // Totaux globaux
  const totals = report.reduce((acc, r) => ({
    present:  acc.present  + (r.daysPresent      ?? 0),
    absent:   acc.absent   + (r.daysAbsentUnpaid ?? 0),
    leave:    acc.leave    + (r.daysOnLeave       ?? 0),
    ot10:     acc.ot10     + (r.overtime10         ?? 0),
    ot25:     acc.ot25     + (r.overtime25         ?? 0),
    ot50:     acc.ot50     + (r.overtime50         ?? 0),
    ot100:    acc.ot100    + (r.overtime100        ?? 0),
  }), { present: 0, absent: 0, leave: 0, ot10: 0, ot25: 0, ot50: 0, ot100: 0 });

  const hasAnomalies = report.some(r => r.status === 'warning');

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <BarChart3 size={20} className="text-cyan-400" />
            Résumé présences — variables paie
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">
            Données à reporter dans la saisie des variables
          </p>
        </div>
        <button
          onClick={() => router.push(`/cabinet/${cabinetId}/entreprise/${companyId}/paie`)}
          className="flex items-center gap-2 px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-black font-semibold rounded-xl text-sm transition-colors"
        >
          Aller à la saisie paie <ArrowRight size={14} />
        </button>
      </div>

      {/* Sélecteur mois */}
      <div className="flex items-center gap-2">
        <button onClick={prevMonth} className="p-2 hover:bg-white/5 rounded-lg text-gray-500 hover:text-white transition-colors">
          <ChevronLeft size={16} />
        </button>
        <span className="text-white font-semibold min-w-40 text-center text-lg">
          {MONTHS[month - 1]} {year}
        </span>
        <button onClick={nextMonth} className="p-2 hover:bg-white/5 rounded-lg text-gray-500 hover:text-white transition-colors">
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Alerte anomalies */}
      {hasAnomalies && (
        <div className="flex items-start gap-3 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
          <AlertCircle size={16} className="text-amber-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-amber-400 font-medium text-sm">Anomalies détectées</p>
            <p className="text-amber-400/70 text-xs mt-0.5">
              Certains employés ont des absences non justifiées. Vérifiez avant de générer la paie.
            </p>
          </div>
        </div>
      )}

      {/* Totaux globaux */}
      {report.length > 0 && (
        <div className="grid grid-cols-4 lg:grid-cols-7 gap-3">
          {[
            { label: 'Jours présents', value: totals.present, color: '#22c55e' },
            { label: 'Absences',       value: totals.absent,  color: '#ef4444' },
            { label: 'Congés',         value: totals.leave,   color: '#3b82f6' },
            { label: 'H.Sup ×10%',    value: fmt2(totals.ot10),  color: '#a3e635', suffix: 'h' },
            { label: 'H.Sup ×25%',    value: fmt2(totals.ot25),  color: '#facc15', suffix: 'h' },
            { label: 'H.Sup ×50%',    value: fmt2(totals.ot50),  color: '#fb923c', suffix: 'h' },
            { label: 'H.Sup ×100%',   value: fmt2(totals.ot100), color: '#f87171', suffix: 'h' },
          ].map(c => (
            <div key={c.label} className="bg-white/3 border border-white/8 rounded-xl p-3 text-center">
              <p className="text-lg font-bold" style={{ color: c.color }}>
                {c.value}{(c as any).suffix ?? ''}
              </p>
              <p className="text-[10px] text-gray-500 mt-0.5 leading-tight">{c.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Tableau par employé */}
      {loading ? (
        <div className="flex justify-center py-12"><Loader2 size={24} className="animate-spin text-gray-600" /></div>
      ) : report.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <BarChart3 size={32} className="mx-auto mb-3 text-gray-700" />
          <p>Aucune donnée pour {MONTHS[month - 1]} {year}</p>
        </div>
      ) : (
        <div className="bg-white/3 border border-white/8 rounded-2xl overflow-hidden">
          <div className="px-5 py-3 border-b border-white/8 flex items-center justify-between">
            <h3 className="font-semibold text-white text-sm">
              {report.length} employé{report.length > 1 ? 's' : ''} — {MONTHS[month - 1]} {year}
            </h3>
            <span className="text-xs text-gray-500">Variables à reporter dans la paie</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="px-4 py-3 text-left text-xs text-gray-500 font-medium sticky left-0 bg-[#0a1628]">Employé</th>
                  <th className="px-4 py-3 text-center text-xs text-gray-500 font-medium">Présents</th>
                  <th className="px-4 py-3 text-center text-xs text-gray-500 font-medium">Absents</th>
                  <th className="px-4 py-3 text-center text-xs text-gray-500 font-medium">Congés</th>
                  <th className="px-4 py-3 text-center text-xs text-emerald-600 font-medium">H.Sup ×10%</th>
                  <th className="px-4 py-3 text-center text-xs text-yellow-600 font-medium">H.Sup ×25%</th>
                  <th className="px-4 py-3 text-center text-xs text-orange-600 font-medium">H.Sup ×50%</th>
                  <th className="px-4 py-3 text-center text-xs text-red-600 font-medium">H.Sup ×100%</th>
                  <th className="px-4 py-3 text-center text-xs text-gray-500 font-medium">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {report.map((row: any) => (
                  <tr key={row.employeeId}
                      className={`hover:bg-white/3 transition-colors ${row.status === 'warning' ? 'bg-amber-500/3' : ''}`}>
                    <td className="px-4 py-3 sticky left-0 bg-[#020617]">
                      <div>
                        <p className="text-white text-sm font-medium">{row.name}</p>
                        <p className="text-[10px] text-gray-600">{row.department}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-emerald-400 font-semibold">{row.daysPresent ?? 0}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`font-semibold ${(row.daysAbsentUnpaid ?? 0) > 0 ? 'text-red-400' : 'text-gray-600'}`}>
                        {row.daysAbsentUnpaid ?? 0}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-blue-400">{row.daysOnLeave ?? 0}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-xs font-mono ${(row.overtime10 ?? 0) > 0 ? 'text-emerald-300 font-semibold' : 'text-gray-700'}`}>
                        {fmt2(row.overtime10 ?? 0)}h
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-xs font-mono ${(row.overtime25 ?? 0) > 0 ? 'text-yellow-300 font-semibold' : 'text-gray-700'}`}>
                        {fmt2(row.overtime25 ?? 0)}h
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-xs font-mono ${(row.overtime50 ?? 0) > 0 ? 'text-orange-300 font-semibold' : 'text-gray-700'}`}>
                        {fmt2(row.overtime50 ?? 0)}h
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-xs font-mono ${(row.overtime100 ?? 0) > 0 ? 'text-red-300 font-semibold' : 'text-gray-700'}`}>
                        {fmt2(row.overtime100 ?? 0)}h
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                        row.status === 'perfect'
                          ? 'bg-emerald-500/10 text-emerald-400'
                          : 'bg-amber-500/10 text-amber-400'
                      }`}>
                        {row.status === 'perfect' ? '✓ OK' : '⚠ À vérifier'}
                      </span>
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