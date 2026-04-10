'use client';

// app/(dashboard)/cabinet/[cabinetId]/entreprise/[companyId]/presences/page.tsx
// Vue présences d'une PME — lecture + rapport pour paie

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import {
  Fingerprint, Loader2, ChevronLeft, ChevronRight,
  CheckCircle2, XCircle, Clock, AlertCircle, Download,
} from 'lucide-react';
import { api } from '@/services/api';

const MONTHS = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  PRESENT:        { label: 'Présent',    color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  ABSENT_UNPAID:  { label: 'Absent',     color: 'text-red-400',     bg: 'bg-red-500/10'     },
  LATE:           { label: 'Retard',     color: 'text-amber-400',   bg: 'bg-amber-500/10'   },
  LEAVE:          { label: 'Congé',      color: 'text-blue-400',    bg: 'bg-blue-500/10'    },
  HOLIDAY:        { label: 'Férié',      color: 'text-purple-400',  bg: 'bg-purple-500/10'  },
  OFF_DAY:        { label: 'Repos',      color: 'text-gray-500',    bg: 'bg-gray-500/10'    },
  REMOTE:         { label: 'Télétravail',color: 'text-cyan-400',    bg: 'bg-cyan-500/10'    },
};

const fmt = (n: number) => n.toFixed(2);

export default function CabinetPresencesPage() {
  const params    = useParams();
  const cabinetId = params.cabinetId as string;
  const companyId = params.companyId as string;

  const now = new Date();
  const [month,   setMonth]   = useState(now.getMonth() + 1);
  const [year,    setYear]    = useState(now.getFullYear());
  const [report,  setReport]  = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [view,    setView]    = useState<'summary' | 'detail'>('summary');
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const data: any = await api.get(
          `/attendance/report?companyId=${companyId}&month=${month}&year=${year}`
        );
        setReport(Array.isArray(data) ? data : []);
      } catch {
        setReport([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [companyId, month, year]);

  const downloadResume = async () => {
    try {
      window.open(`/api/attendance/export/excel?companyId=${companyId}&month=${month}&year=${year}`, '_blank');
    } catch {}
  };

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Fingerprint size={20} className="text-cyan-400" />
            Présences
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">Rapport mensuel des présences de la PME</p>
        </div>
        <button onClick={downloadResume}
          className="flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm text-gray-300 hover:text-white transition-colors">
          <Download size={14} /> Exporter Excel
        </button>
      </div>

      {/* Sélecteur mois */}
      <div className="flex items-center gap-2">
        <button onClick={() => { if (month === 1) { setMonth(12); setYear(y => y-1); } else setMonth(m => m-1); }}
          className="p-2 hover:bg-white/5 rounded-lg text-gray-500 hover:text-white transition-colors">
          <ChevronLeft size={16} />
        </button>
        <span className="text-white font-semibold min-w-32 text-center">
          {MONTHS[month-1]} {year}
        </span>
        <button onClick={() => { if (month === 12) { setMonth(1); setYear(y => y+1); } else setMonth(m => m+1); }}
          className="p-2 hover:bg-white/5 rounded-lg text-gray-500 hover:text-white transition-colors">
          <ChevronRight size={16} />
        </button>
        <div className="ml-4 flex gap-1 bg-white/3 border border-white/8 rounded-lg p-1">
          {(['summary','detail'] as const).map(v => (
            <button key={v} onClick={() => setView(v)}
              className={`px-3 py-1 rounded-md text-xs transition-colors ${view === v ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-white'}`}>
              {v === 'summary' ? 'Résumé' : 'Détail'}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-12"><Loader2 size={24} className="animate-spin text-gray-600" /></div>
      ) : report.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <Fingerprint size={32} className="mx-auto mb-3 text-gray-700" />
          <p>Aucune donnée de présence pour {MONTHS[month-1]} {year}</p>
        </div>
      ) : (
        <div className="bg-white/3 border border-white/8 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/8">
                  <th className="px-4 py-3 text-left text-xs text-gray-500">Employé</th>
                  <th className="px-4 py-3 text-center text-xs text-gray-500">Présents</th>
                  <th className="px-4 py-3 text-center text-xs text-gray-500">Absents</th>
                  <th className="px-4 py-3 text-center text-xs text-gray-500">Retards</th>
                  <th className="px-4 py-3 text-center text-xs text-gray-500">Congés</th>
                  <th className="px-4 py-3 text-center text-xs text-gray-500">H.Sup×10</th>
                  <th className="px-4 py-3 text-center text-xs text-gray-500">H.Sup×25</th>
                  <th className="px-4 py-3 text-center text-xs text-gray-500">H.Sup×50</th>
                  <th className="px-4 py-3 text-center text-xs text-gray-500">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {report.map((row: any) => (
                  <React.Fragment key={row.employeeId}>
                    <tr className="hover:bg-white/3 cursor-pointer transition-colors"
                        onClick={() => setExpanded(expanded === row.employeeId ? null : row.employeeId)}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 bg-white/5 border border-white/8 rounded-lg flex items-center justify-center shrink-0">
                            <span className="text-[9px] font-bold text-gray-400">
                              {row.name?.slice(0,2)?.toUpperCase() || '??'}
                            </span>
                          </div>
                          <div>
                            <p className="text-white text-xs font-medium">{row.name}</p>
                            <p className="text-gray-600 text-[10px]">{row.department}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center text-emerald-400 font-medium">{row.daysPresent ?? 0}</td>
                      <td className="px-4 py-3 text-center text-red-400">{row.daysAbsentUnpaid ?? 0}</td>
                      <td className="px-4 py-3 text-center text-amber-400">{row.daysLate ?? 0}</td>
                      <td className="px-4 py-3 text-center text-blue-400">{row.daysOnLeave ?? 0}</td>
                      <td className="px-4 py-3 text-center text-gray-400 text-xs">{fmt(row.overtime10 ?? 0)}h</td>
                      <td className="px-4 py-3 text-center text-gray-400 text-xs">{fmt(row.overtime25 ?? 0)}h</td>
                      <td className="px-4 py-3 text-center text-gray-400 text-xs">{fmt(row.overtime50 ?? 0)}h</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                          row.status === 'perfect' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
                        }`}>
                          {row.status === 'perfect' ? 'OK' : 'À vérifier'}
                        </span>
                      </td>
                    </tr>
                    {view === 'detail' && expanded === row.employeeId && row.details && (
                      <tr>
                        <td colSpan={9} className="bg-white/2 px-4 py-3">
                          <div className="grid grid-cols-7 gap-1.5 max-h-48 overflow-y-auto">
                            {row.details.map((d: any, i: number) => {
                              const sc = statusConfig[d.status] ?? { label: d.status, color: 'text-gray-400', bg: 'bg-gray-500/10' };
                              return (
                                <div key={i} className={`rounded-lg p-2 text-center ${sc.bg}`}>
                                  <p className="text-[9px] text-gray-500">{d.date?.slice(5)}</p>
                                  <p className={`text-[9px] font-medium ${sc.color}`}>{sc.label}</p>
                                  {d.total && d.total !== '0.00' && <p className="text-[9px] text-gray-600">{d.total}h</p>}
                                </div>
                              );
                            })}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}