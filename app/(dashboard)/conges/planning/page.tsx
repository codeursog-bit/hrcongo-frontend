'use client';

// ============================================================================
// 📁 app/(dashboard)/conges/planning/page.tsx
// ✅ Nouvelle page — planning mensuel des départs en congé, reproduit le
//    modèle tableur montré (Programme des départs / Planning à payer),
//    imprimable et téléchargeable en PDF, en-tête entreprise dynamique.
// ============================================================================

import React, { useEffect, useMemo, useState } from 'react';
import {
  Loader2, ChevronLeft, ChevronRight, Printer, Download, Users,
  Wallet, Plane,
} from 'lucide-react';
import { api } from '@/services/api';
import CongeSubNav from '@/components/CongeSubNav';
import LeavePlanningPrintable from '@/components/LeavePlanningPrintable';
import { printLeaveDocument, downloadLeaveDocumentPDF } from '@/lib/leave-print';

const MONTHS = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];

export default function LeavePlanningPage() {
  const [userRole, setUserRole] = useState('');
  const [company, setCompany] = useState<any>(null);
  const [rows, setRows] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [mode, setMode] = useState<'departures' | 'payable'>('departures');
  const [cursor, setCursor] = useState(() => {
    const d = new Date();
    return { month: d.getMonth() + 1, year: d.getFullYear() };
  });
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [yearlyTrend, setYearlyTrend] = useState<{ month: number; count: number; totalDays: number }[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('user');
      if (stored) setUserRole(JSON.parse(stored).role || '');
    } catch {}
  }, []);

  useEffect(() => {
    (async () => {
      setIsLoading(true);
      try {
        const [planning, me]: any = await Promise.all([
          api.get(`/leaves/planning?month=${cursor.month}&year=${cursor.year}`),
          api.get('/auth/me').catch(() => null),
        ]);
        setRows(planning || []);
        setCompany(me?.company ?? null);
      } catch (e) {
        console.error('Erreur chargement du planning congé', e);
        setRows([]);
      } finally {
        setIsLoading(false);
      }
    })();
  }, [cursor]);

  useEffect(() => {
    (async () => {
      try {
        const trend = await api.get<any>(`/leaves/yearly-trend?year=${cursor.year}`);
        setYearlyTrend(trend || []);
      } catch (e) {
        console.error('Erreur chargement tendance annuelle', e);
      }
    })();
  }, [cursor.year]);

  const monthLabel = `${MONTHS[cursor.month - 1]} ${cursor.year}`;
  const REPORT_ID = 'leave-planning-print';

  const stats = useMemo(() => {
    const rawTotalDays = rows.reduce((s, r) => s + Number(r.daysCount || 0), 0);
    const totalDays = Math.round(rawTotalDays * 10) / 10;
    const totalIndemnity = rows.reduce((s, r) => s + Number(r.indemnityAmount || 0), 0);
    return { count: rows.length, totalDays, totalIndemnity };
  }, [rows]);

  const deptBreakdown = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of rows) {
      const name = r.employee?.department?.name || 'Sans département';
      map.set(name, (map.get(name) || 0) + Number(r.daysCount || 0));
    }
    return Array.from(map.entries())
      .map(([name, days]) => ({ name, days: Math.round(days * 10) / 10 }))
      .sort((a, b) => b.days - a.days);
  }, [rows]);

  const goPrevMonth = () => setCursor(c => c.month === 1 ? { month: 12, year: c.year - 1 } : { month: c.month - 1, year: c.year });
  const goNextMonth = () => setCursor(c => c.month === 12 ? { month: 1, year: c.year + 1 } : { month: c.month + 1, year: c.year });

  const handleDownloadPdf = async () => {
    setIsExportingPdf(true);
    try {
      await downloadLeaveDocumentPDF(REPORT_ID, `planning-conge-${mode === 'departures' ? 'departs' : 'a-payer'}-${cursor.year}-${cursor.month}.pdf`, 'landscape');
    } finally {
      setIsExportingPdf(false);
    }
  };

  return (
    <div className="max-w-[1500px] mx-auto pb-24 space-y-6">
      <CongeSubNav userRole={userRole} />

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold tracking-[0.2em] text-gray-400 uppercase mb-1">Congés</p>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Planning des départs</h1>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={goPrevMonth} className="p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">
            <ChevronLeft size={18} />
          </button>
          <span className="px-4 py-2 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 font-semibold text-sm min-w-[160px] text-center">
            {monthLabel}
          </span>
          <button onClick={goNextMonth} className="p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl w-fit">
          <button onClick={() => setMode('departures')} className={`px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-all ${mode === 'departures' ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500'}`}>
            <Plane size={14} /> Programme des départs
          </button>
          <button onClick={() => setMode('payable')} className={`px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-all ${mode === 'payable' ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500'}`}>
            <Wallet size={14} /> Congé à payer
          </button>
        </div>

        <div className="flex gap-2">
          <button onClick={() => setTimeout(() => printLeaveDocument(REPORT_ID, 'landscape'), 50)} className="px-4 py-2.5 border border-gray-200 dark:border-gray-700 text-sm font-semibold rounded-xl text-gray-600 dark:text-gray-300 flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-700">
            <Printer size={16} /> Imprimer
          </button>
          <button onClick={handleDownloadPdf} disabled={isExportingPdf} className="px-4 py-2.5 border border-gray-200 dark:border-gray-700 text-sm font-semibold rounded-xl text-gray-600 dark:text-gray-300 flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40">
            {isExportingPdf ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />} PDF
          </button>
          {company?.documentTemplate === 'ORCA' && (
            <button
              onClick={() => window.open(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/leaves/planning/document.xlsx?month=${cursor.month}&year=${cursor.year}`, '_blank')}
              className="flex items-center gap-2 px-4 py-2.5 bg-sky-50 dark:bg-sky-900/20 border border-sky-200 dark:border-sky-800 text-sky-700 dark:text-sky-300 rounded-xl text-sm font-bold hover:bg-sky-100 dark:hover:bg-sky-900/40"
              title="Télécharger le fichier Excel original rempli (2 onglets : départs + à payer)"
            >
              <Download size={15} /> Excel (.xlsx)
            </button>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-24"><Loader2 className="animate-spin text-sky-500" size={40} /></div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-sky-100 dark:bg-sky-900/30 text-sky-600 flex items-center justify-center"><Users size={20} /></div>
              <div><p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.count}</p><p className="text-xs text-gray-400">Employés en congé ce mois</p></div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-violet-100 dark:bg-violet-900/30 text-violet-600 flex items-center justify-center"><Plane size={20} /></div>
              <div><p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalDays}</p><p className="text-xs text-gray-400">Jours ouvrables cumulés</p></div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 flex items-center justify-center"><Wallet size={20} /></div>
              <div><p className="text-2xl font-bold text-gray-900 dark:text-white">{Math.round(stats.totalIndemnity).toLocaleString('fr-FR')}</p><p className="text-xs text-gray-400">FCFA d&apos;indemnités estimées</p></div>
            </div>
          </div>

          {/* 🆕 Graphiques RH — tendance annuelle + répartition par département */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5">
              <p className="text-sm font-bold text-gray-700 dark:text-gray-200 mb-4">Jours de congé posés par mois — {cursor.year}</p>
              {yearlyTrend.every(m => m.totalDays === 0) ? (
                <p className="text-sm text-gray-400 py-8 text-center">Aucun congé posé sur {cursor.year}.</p>
              ) : (
                <div className="flex items-end gap-1.5 h-40">
                  {yearlyTrend.map(m => {
                    const max = Math.max(...yearlyTrend.map(x => x.totalDays), 1);
                    const heightPct = (m.totalDays / max) * 100;
                    const isCurrent = m.month === cursor.month;
                    return (
                      <div key={m.month} className="flex-1 flex flex-col items-center gap-1.5 group">
                        <div className="w-full flex items-end h-32 relative">
                          <div
                            title={`${m.totalDays}j — ${m.count} congé(s)`}
                            className={`w-full rounded-t-md transition-all ${isCurrent ? 'bg-sky-500' : 'bg-sky-200 dark:bg-sky-800 group-hover:bg-sky-300 dark:group-hover:bg-sky-700'}`}
                            style={{ height: `${Math.max(heightPct, m.totalDays > 0 ? 4 : 0)}%` }}
                          />
                        </div>
                        <span className={`text-[10px] font-semibold ${isCurrent ? 'text-sky-600' : 'text-gray-400'}`}>{MONTHS[m.month - 1].slice(0, 3)}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5">
              <p className="text-sm font-bold text-gray-700 dark:text-gray-200 mb-4">Répartition par département — {monthLabel}</p>
              {deptBreakdown.length === 0 ? (
                <p className="text-sm text-gray-400 py-8 text-center">Aucun département ce mois-ci.</p>
              ) : (
                <div className="space-y-3">
                  {deptBreakdown.map(d => {
                    const max = deptBreakdown[0].days || 1;
                    return (
                      <div key={d.name}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="font-medium text-gray-600 dark:text-gray-300 truncate">{d.name}</span>
                          <span className="text-gray-400 shrink-0 ml-2">{d.days}j</span>
                        </div>
                        <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div className="h-full bg-violet-400 dark:bg-violet-600 rounded-full" style={{ width: `${(d.days / max) * 100}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="bg-gray-100 dark:bg-gray-900 rounded-2xl p-4 overflow-auto border border-gray-200 dark:border-gray-700">
            <div className="scale-[0.75] origin-top-left" style={{ width: '133%' }}>
              <LeavePlanningPrintable id={REPORT_ID} company={company || {}} monthLabel={monthLabel} rows={rows} mode={mode} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}