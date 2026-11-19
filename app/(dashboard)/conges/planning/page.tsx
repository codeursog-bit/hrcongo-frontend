'use client';
import { DocumentReader } from '@/components/ui/DocumentReader';
import '@/components/leave-history/leave-workspace.css';
import { LeaveModuleFrame as ModulePageFrame } from '@/components/leave-history/LeaveModuleFrame';
import { ModulePageSkeleton } from '@/components/requests/ModulePageFrame';
import { Button } from '@/components/design-system/primitives';

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
import { KonzaLoader } from '@/components/ui/KonzaLoader';

const MONTHS = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];

export default function LeavePlanningPage() {
  const [uiLoadError,setUiLoadError]=useState('');
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
          api.get(`/leaves/planning?month=${cursor.month}&year=${cursor.year}&mode=${mode}`),
          api.get('/auth/me').catch(() => null),
        ]);
        setRows(planning || []);
        setCompany(me?.company ?? null);
      } catch (e) {
        console.error('Erreur chargement du planning congé', e); setUiLoadError('Le chargement a échoué. Réessayez dans un instant.');
        setRows([]);
      } finally {
        setIsLoading(false);
      }
    })();
  }, [cursor, mode]);

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
    <ModulePageFrame kind="list" error={uiLoadError}><div className="max-w-[1500px] mx-auto pb-24 space-y-6">
      <CongeSubNav userRole={userRole} />

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 leave-header">
        <div>
          <p className="text-xs font-semibold tracking-[0.2em] text-[var(--text-muted)] uppercase mb-1">Congés</p>
          <h1 className="text-3xl font-semibold text-[var(--text)]">Planning des départs</h1>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={goPrevMonth} className="p-2.5 rounded-xl border border-[var(--border)] hover:bg-[var(--surface-2)]">
            <ChevronLeft size={18} />
          </Button>
          <span className="px-4 py-2 rounded-xl bg-[var(--surface)] border border-[var(--border)] font-semibold text-sm min-w-[160px] text-center">
            {monthLabel}
          </span>
          <Button variant="ghost" onClick={goNextMonth} className="p-2.5 rounded-xl border border-[var(--border)] hover:bg-[var(--surface-2)]">
            <ChevronRight size={18} />
          </Button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex gap-1 bg-[var(--surface-2)] p-1 rounded-xl w-fit">
          <Button variant="ghost" onClick={() => setMode('departures')} className={`px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-all ${mode === 'departures' ? 'bg-[var(--surface)] text-[var(--text)] shadow-sm' : 'text-[var(--text-muted)]'}`}>
            <Plane size={14} /> Programme des départs
          </Button>
          <Button variant="ghost" onClick={() => setMode('payable')} className={`px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-all ${mode === 'payable' ? 'bg-[var(--surface)] text-[var(--text)] shadow-sm' : 'text-[var(--text-muted)]'}`}>
            <Wallet size={14} /> Congé à payer
          </Button>
        </div>

        <div className="flex gap-2">
          <Button variant="ghost" onClick={() => setTimeout(() => printLeaveDocument(REPORT_ID, 'landscape'), 50)} className="px-4 py-2.5 border border-[var(--border)] text-sm font-semibold rounded-xl text-[var(--text-muted)] flex items-center gap-2 hover:bg-[var(--surface-2)]">
            <Printer size={16} /> Imprimer
          </Button>
          <Button variant="ghost" onClick={handleDownloadPdf} disabled={isExportingPdf} className="px-4 py-2.5 border border-[var(--border)] text-sm font-semibold rounded-xl text-[var(--text-muted)] flex items-center gap-2 hover:bg-[var(--surface-2)] disabled:opacity-40">
            {isExportingPdf ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />} PDF
          </Button>
          {company?.documentTemplate === 'ORCA' && (
            <Button variant="ghost"
              onClick={() => window.open(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/leaves/planning/document.xlsx?month=${cursor.month}&year=${cursor.year}`, '_blank')}
              className="flex items-center gap-2 px-4 py-2.5 bg-[color-mix(in_srgb,var(--brand)_12%,var(--surface))]  border border-[var(--border)]  text-[var(--action)]  rounded-xl text-sm font-semibold hover:bg-[color-mix(in_srgb,var(--brand)_12%,var(--surface))] "
              title="Télécharger le fichier Excel original rempli (2 onglets : départs + à payer)"
            >
              <Download size={15} /> Excel (.xlsx)
            </Button>
          )}
        </div>
      </div>

      {isLoading ? (
        <ModulePageSkeleton />
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] p-5 flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-[color-mix(in_srgb,var(--brand)_12%,var(--surface))]  text-[var(--action)] flex items-center justify-center"><Users size={20} /></div>
              <div><p className="text-2xl font-semibold text-[var(--text)]">{stats.count}</p><p className="text-xs text-[var(--text-muted)]">Employés en congé ce mois</p></div>
            </div>
            <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] p-5 flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-[color-mix(in_srgb,var(--mustard)_14%,var(--surface))]  text-[var(--warning-text)] flex items-center justify-center"><Plane size={20} /></div>
              <div><p className="text-2xl font-semibold text-[var(--text)]">{stats.totalDays}</p><p className="text-xs text-[var(--text-muted)]">Jours ouvrables cumulés</p></div>
            </div>
            <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] p-5 flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-[color-mix(in_srgb,var(--brand)_12%,var(--surface))]  text-[var(--action)] flex items-center justify-center"><Wallet size={20} /></div>
              <div><p className="text-2xl font-semibold text-[var(--text)]">{Math.round(stats.totalIndemnity).toLocaleString('fr-FR')}</p><p className="text-xs text-[var(--text-muted)]">FCFA d&apos;indemnités estimées</p></div>
            </div>
          </div>

          {/* 🆕 Graphiques RH — tendance annuelle + répartition par département */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 bg-[var(--surface)] rounded-2xl border border-[var(--border)] p-5">
              <p className="text-sm font-semibold text-[var(--text)] mb-4">Jours de congé posés par mois — {cursor.year}</p>
              {yearlyTrend.every(m => m.totalDays === 0) ? (
                <p className="text-sm text-[var(--text-muted)] py-8 text-center">Aucun congé posé sur {cursor.year}.</p>
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
                            className={`w-full rounded-t-md transition-all ${isCurrent ? 'bg-[var(--brand)]' : 'bg-[color-mix(in_srgb,var(--brand)_12%,var(--surface))]  group-hover:bg-[var(--brand)] '}`}
                            style={{ height: `${Math.max(heightPct, m.totalDays > 0 ? 4 : 0)}%` }}
                          />
                        </div>
                        <span className={`text-[10px] font-semibold ${isCurrent ? 'text-[var(--action)]' : 'text-[var(--text-muted)]'}`}>{MONTHS[m.month - 1].slice(0, 3)}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] p-5">
              <p className="text-sm font-semibold text-[var(--text)] mb-4">Répartition par département — {monthLabel}</p>
              {deptBreakdown.length === 0 ? (
                <p className="text-sm text-[var(--text-muted)] py-8 text-center">Aucun département ce mois-ci.</p>
              ) : (
                <div className="space-y-3">
                  {deptBreakdown.map(d => {
                    const max = deptBreakdown[0].days || 1;
                    return (
                      <div key={d.name}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="font-medium text-[var(--text-muted)] truncate">{d.name}</span>
                          <span className="text-[var(--text-muted)] shrink-0 ml-2">{d.days}j</span>
                        </div>
                        <div className="h-2 bg-[var(--border)] rounded-full overflow-hidden">
                          <div className="h-full bg-[color-mix(in_srgb,var(--mustard)_14%,var(--surface))]  rounded-full" style={{ width: `${(d.days / max) * 100}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <DocumentReader landscape title="Suivi des congés">
              <LeavePlanningPrintable id={REPORT_ID} company={company || {}} monthLabel={monthLabel} rows={rows} mode={mode} />
          </DocumentReader>
        </>
      )}
    </div></ModulePageFrame>
  );
}
