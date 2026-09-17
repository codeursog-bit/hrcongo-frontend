'use client';

// app/(dashboard)/portefeuille/presences/page.tsx
// Module "consultation" (comme convenu côté back) : pointage, corrections et
// shifts se gèrent depuis l'interface de chaque entreprise, pas ici.

import React, { useEffect, useState, useMemo } from 'react';
import {
  Users2, Building2, Loader2, AlertCircle, UserCheck, UserX, Clock,
} from 'lucide-react';
import { GlobalLoader } from '@/components/ui/GlobalLoader';
import { api } from '@/services/api';

// ─── Types ────────────────────────────────────────────────────────────────────

interface PortfolioCompany { id: string; name: string; }

interface TodayEntry {
  status: string;
  checkIn: string | null;
  checkOut: string | null;
  employee: { firstName: string; lastName: string; position: string; department: { id: string; name: string } | null };
}

interface MonthlyReportItem {
  id: string;
  name: string;
  matricule: string;
  department: string;
  daysPresent: number;
  daysLate: number;
  daysAbsentUnpaid: number;
  daysOnLeave: number;
  totalHours: number;
  status: string;
}

const MONTHS = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
];
const CURRENT_YEAR = new Date().getFullYear();
const YEARS = [CURRENT_YEAR - 1, CURRENT_YEAR, CURRENT_YEAR + 1];

const PRESENT_LIKE = ['PRESENT', 'LATE', 'REMOTE'];

function StatPill({ icon: Icon, label, value, cls }: { icon: any; label: string; value: number | string; cls: string }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-2xl" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${cls}`}><Icon size={17} /></div>
      <div>
        <p className="text-lg font-bold leading-none" style={{ color: 'var(--text)' }}>{value}</p>
        <p className="text-[11px] mt-1" style={{ color: 'var(--text-muted)' }}>{label}</p>
      </div>
    </div>
  );
}

export default function PortfolioAttendancePage() {
  const [companies, setCompanies] = useState<PortfolioCompany[]>([]);
  const [companyId, setCompanyId] = useState('');
  const [loadingCompanies, setLoadingCompanies] = useState(true);

  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(CURRENT_YEAR);

  const [today, setToday] = useState<TodayEntry[]>([]);
  const [report, setReport] = useState<MonthlyReportItem[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get<PortfolioCompany[]>('/auth/my-companies')
      .then(list => {
        setCompanies(list ?? []);
        if (list && list.length > 0) setCompanyId(list[0].id);
      })
      .catch(() => setCompanies([]))
      .finally(() => setLoadingCompanies(false));
  }, []);

  useEffect(() => {
    if (!companyId) { setToday([]); setReport([]); return; }
    setLoadingData(true);
    setError('');
    Promise.all([
      api.get<TodayEntry[]>(`/portfolio/attendance/today?companyId=${companyId}`),
      api.get<MonthlyReportItem[]>(`/portfolio/attendance/report?companyId=${companyId}&month=${month}&year=${year}`),
    ])
      .then(([t, r]) => { setToday(t ?? []); setReport(r ?? []); })
      .catch((e: any) => setError(e.message || 'Erreur lors du chargement'))
      .finally(() => setLoadingData(false));
  }, [companyId, month, year]);

  const todayStats = useMemo(() => {
    const present = today.filter(t => PRESENT_LIKE.includes(t.status)).length;
    const late = today.filter(t => t.status === 'LATE').length;
    const absent = today.filter(t => t.status?.startsWith('ABSENT')).length;
    return { present, late, absent, total: today.length };
  }, [today]);

  if (loadingCompanies) return <GlobalLoader />;

  return (
    <div className="space-y-6 min-h-screen pb-20">
      <div>
        <h1 className="text-3xl font-bold tracking-tight" style={{ color: 'var(--text)' }}>Présences</h1>
        <p className="mt-1 flex items-center gap-2" style={{ color: 'var(--text-muted)' }}>
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          Suivi de présence, entreprise par entreprise
        </p>
      </div>

      {companies.length === 0 ? (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 text-sm font-medium">
          <AlertCircle size={16} />
          Ajoutez au moins une entreprise pour consulter les présences.
        </div>
      ) : (
        <>
          {/* ── FILTRES ── */}
          <div className="flex flex-wrap gap-3">
            <select value={companyId} onChange={e => setCompanyId(e.target.value)} className="px-4 py-2.5 bg-[var(--surface)] border border-[var(--border)] rounded-xl text-sm font-medium min-w-[200px]" style={{ color: 'var(--text)' }}>
              {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <select value={month} onChange={e => setMonth(Number(e.target.value))} className="px-4 py-2.5 bg-[var(--surface)] border border-[var(--border)] rounded-xl text-sm font-medium" style={{ color: 'var(--text)' }}>
              {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
            </select>
            <select value={year} onChange={e => setYear(Number(e.target.value))} className="px-4 py-2.5 bg-[var(--surface)] border border-[var(--border)] rounded-xl text-sm font-medium" style={{ color: 'var(--text)' }}>
              {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            {loadingData && <Loader2 size={18} className="animate-spin text-emerald-500 self-center" />}
          </div>

          {error && (
            <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm font-medium">
              <AlertCircle size={16} className="shrink-0" />{error}
            </div>
          )}

          {/* ── SNAPSHOT DU JOUR ── */}
          <div>
            <p className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: 'var(--text-muted)' }}>Aujourd'hui</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <StatPill icon={Users2} label="Pointages" value={todayStats.total} cls="bg-sky-100 text-sky-600 dark:bg-sky-900/30 dark:text-sky-400" />
              <StatPill icon={UserCheck} label="Présents" value={todayStats.present} cls="bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400" />
              <StatPill icon={Clock} label="En retard" value={todayStats.late} cls="bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400" />
              <StatPill icon={UserX} label="Absents" value={todayStats.absent} cls="bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400" />
            </div>
          </div>

          {/* ── RAPPORT MENSUEL ── */}
          <div>
            <p className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: 'var(--text-muted)' }}>
              Rapport de {MONTHS[month - 1]} {year}
            </p>
            {report.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center rounded-2xl" style={{ border: '2px dashed var(--border)' }}>
                <Building2 size={22} style={{ color: 'var(--text-muted)' }} className="mb-3" />
                <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>Aucune donnée pour cette période</p>
              </div>
            ) : (
              <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                <div className="grid px-4 py-3" style={{ gridTemplateColumns: '1fr 140px 90px 90px 100px 100px', gap: 12, borderBottom: '1px solid var(--border)' }}>
                  {['Employé', 'Département', 'Présent', 'Retard', 'Absent', 'Heures'].map((h, i) => (
                    <p key={i} className="text-[11px] font-bold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>{h}</p>
                  ))}
                </div>
                {report.map(row => (
                  <div key={row.id} className="grid items-center px-4 py-3 transition-colors hover:bg-[var(--surface-2)]"
                    style={{ gridTemplateColumns: '1fr 140px 90px 90px 100px 100px', gap: 12, borderBottom: '1px solid var(--border)' }}>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate" style={{ color: 'var(--text)' }}>{row.name}</p>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{row.matricule}</p>
                    </div>
                    <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{row.department}</p>
                    <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{row.daysPresent}</span>
                    <span className="text-sm font-bold text-amber-600 dark:text-amber-400">{row.daysLate}</span>
                    <span className="text-sm font-bold text-red-500">{row.daysAbsentUnpaid}</span>
                    <span className="text-sm font-medium" style={{ color: 'var(--text)' }}>{row.totalHours?.toFixed(1)}h</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}