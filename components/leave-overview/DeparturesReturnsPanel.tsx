'use client';

// ============================================================================
// 📁 components/leave-overview/DeparturesReturnsPanel.tsx
// ✅ Vue d'ensemble RH des congés : départs de la période, retours attendus,
//    retards, récapitulatif chiffré, et « marquer comme revenu » directement
//    depuis la liste (PATCH /leaves/:id/confirm-return, comme la fiche congé).
// ============================================================================

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ChevronLeft, ChevronRight, Loader2, PlaneTakeoff, PlaneLanding, AlertTriangle,
  UserCheck, Users, Check, X, CalendarRange,
} from 'lucide-react';
import { api } from '@/services/api';
import { useBasePath } from '@/hooks/useBasePath';

interface Row {
  id: string;
  employeeId: string;
  employee: { firstName: string; lastName: string; position?: string; department?: { name: string } };
  type: string;
  startDate: string;
  endDate: string;
  expectedReturnDate: string;
  daysCount: number;
  started: boolean;
  returnConfirmed: boolean;
  actualReturnDate?: string | null;
  forfeitedDays: number;
  overdue: boolean;
  isCarryover: boolean;
}
interface Data {
  period: { from: string; to: string };
  counts: {
    departures: number; departuresDone: number; departuresToCome: number;
    returnsExpected: number; returnsConfirmed: number; returnsPending: number;
    overdue: number; onLeaveNow: number;
  };
  departures: Row[];
  returns: Row[];
  overdue: Row[];
}

const MONTHS = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
const fmt = (d: string) => new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const dayOf = (s: string) => { const d = new Date(s); return new Date(d.getFullYear(), d.getMonth(), d.getDate()); };

export default function DeparturesReturnsPanel() {
  const { bp } = useBasePath();
  const now = new Date();
  const [mode, setMode] = useState<'MONTH' | 'RANGE'>('MONTH');
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [from, setFrom] = useState(iso(new Date(now.getFullYear(), now.getMonth(), 1)));
  const [to, setTo] = useState(iso(new Date(now.getFullYear(), now.getMonth() + 1, 0)));
  const [data, setData] = useState<Data | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  // Retour en cours de saisie : id du congé + date de reprise réelle
  const [returning, setReturning] = useState<{ row: Row; date: string } | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const qs = mode === 'MONTH' ? `month=${month}&year=${year}` : `from=${from}&to=${to}`;
      setData(await api.get<Data>(`/leaves/departures-returns?${qs}`));
    } catch (e: any) {
      setError(e?.message || 'Le chargement a échoué.');
    } finally { setLoading(false); }
  }, [mode, month, year, from, to]);
  useEffect(() => { load(); }, [load]);

  const shiftMonth = (delta: number) => {
    const d = new Date(year, month - 1 + delta, 1);
    setMonth(d.getMonth() + 1); setYear(d.getFullYear());
  };

  const match = (r: Row) => {
    const q = search.trim().toLowerCase();
    return !q || `${r.employee.firstName} ${r.employee.lastName}`.toLowerCase().includes(q);
  };

  const openReturn = (row: Row) => setReturning({ row, date: iso(new Date()) });

  const confirmReturn = async () => {
    if (!returning) return;
    const { row, date } = returning;
    setSaving(true);
    try {
      // Reprise AVANT la fin prévue → retour anticipé (jours non pris calculés par le serveur).
      const early = dayOf(date) <= dayOf(row.endDate) && dayOf(date) < dayOf(row.expectedReturnDate);
      await api.patch(`/leaves/${row.id}/confirm-return`, { actualReturnDate: early ? date : undefined });
      setReturning(null);
      await load();
    } catch (e: any) {
      alert(e?.message || 'Erreur lors de la confirmation du retour');
    } finally { setSaving(false); }
  };

  const Name = ({ r }: { r: Row }) => (
    <Link href={bp(`/conges/${r.id}`)} className="hover:underline">
      <p className="font-semibold text-[var(--text)] text-sm">{r.employee.firstName} {r.employee.lastName}</p>
      <p className="text-xs text-[var(--text-muted)]">{r.employee.department?.name || r.employee.position || '—'}</p>
    </Link>
  );

  const ReturnAction = ({ r }: { r: Row }) => {
    if (r.returnConfirmed) {
      return (
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600">
          <Check size={13} /> Revenu{r.actualReturnDate ? ` le ${fmt(r.actualReturnDate)}` : ''}
          {r.forfeitedDays > 0 && <span className="text-amber-600 ml-1">· {r.forfeitedDays} j non pris</span>}
        </span>
      );
    }
    return (
      <button onClick={() => openReturn(r)}
        className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5">
        <UserCheck size={13} /> Marquer revenu
      </button>
    );
  };

  const c = data?.counts;
  const Stat = ({ label, value, sub, tone }: { label: string; value: number; sub?: string; tone?: 'red' | 'emerald' | 'amber' }) => (
    <div className={`rounded-2xl border p-4 bg-[var(--surface)] ${tone === 'red' && value > 0 ? 'border-red-300 dark:border-red-800' : 'border-[var(--border)]'}`}>
      <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide">{label}</p>
      <p className={`text-3xl font-bold mt-1 ${tone === 'red' && value > 0 ? 'text-red-500' : 'text-[var(--text)]'}`}>{value}</p>
      {sub && <p className="text-xs text-[var(--text-muted)] mt-0.5">{sub}</p>}
    </div>
  );

  return (
    <div className="space-y-5">
      {/* ── Filtres de période ── */}
      <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] p-4 flex flex-wrap items-center gap-3">
        <div className="flex gap-1 bg-[var(--surface-2)] p-1 rounded-lg">
          {(['MONTH', 'RANGE'] as const).map((m) => (
            <button key={m} onClick={() => setMode(m)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold ${mode === m ? 'bg-[var(--surface)] text-[var(--text)] shadow-sm' : 'text-[var(--text-muted)]'}`}>
              {m === 'MONTH' ? 'Par mois' : 'Période libre'}
            </button>
          ))}
        </div>
        {mode === 'MONTH' ? (
          <div className="flex items-center gap-2">
            <button onClick={() => shiftMonth(-1)} className="p-2 rounded-lg border border-[var(--border)] hover:bg-[var(--surface-2)]"><ChevronLeft size={15} /></button>
            <select value={month} onChange={(e) => setMonth(+e.target.value)} className="px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-sm">
              {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
            </select>
            <input type="number" value={year} onChange={(e) => setYear(+e.target.value || year)} className="w-24 px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-sm" />
            <button onClick={() => shiftMonth(1)} className="p-2 rounded-lg border border-[var(--border)] hover:bg-[var(--surface-2)]"><ChevronRight size={15} /></button>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
            <CalendarRange size={15} />
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-sm" />
            <span>→</span>
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-sm" />
          </div>
        )}
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher un employé…"
          className="ml-auto px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-sm w-56" />
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}
      {loading && !data && <div className="flex justify-center py-16"><Loader2 className="animate-spin text-emerald-500" /></div>}

      {data && c && (
        <>
          {/* ── Récapitulatif ── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Stat label="Départs" value={c.departures} sub={`${c.departuresDone} partis · ${c.departuresToCome} à venir`} />
            <Stat label="Retours attendus" value={c.returnsExpected} sub={`${c.returnsConfirmed} confirmés · ${c.returnsPending} à confirmer`} />
            <Stat label="Retours en retard" value={c.overdue} sub="à confirmer (toutes périodes)" tone="red" />
            <Stat label="En congé aujourd’hui" value={c.onLeaveNow} />
          </div>

          {/* ── Retards ── */}
          {data.overdue.filter(match).length > 0 && (
            <div className="rounded-2xl border border-red-300 dark:border-red-800 bg-red-50/60 dark:bg-red-900/10 p-4">
              <p className="font-bold text-sm text-red-700 dark:text-red-300 flex items-center gap-2 mb-3">
                <AlertTriangle size={16} /> Retour attendu dépassé — à confirmer
              </p>
              <div className="space-y-2">
                {data.overdue.filter(match).map((r) => (
                  <div key={r.id} className="flex flex-wrap items-center gap-3 justify-between bg-[var(--surface)] rounded-xl px-4 py-2.5 border border-[var(--border)]">
                    <Name r={r} />
                    <p className="text-xs text-[var(--text-muted)]">Reprise prévue le {fmt(r.expectedReturnDate)}</p>
                    <ReturnAction r={r} />
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="grid lg:grid-cols-2 gap-5">
            {/* ── Départs ── */}
            <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] overflow-hidden">
              <p className="px-4 py-3 border-b border-[var(--border)] font-bold text-sm flex items-center gap-2"><PlaneTakeoff size={16} className="text-emerald-500" /> Départs de la période ({data.departures.filter(match).length})</p>
              {data.departures.filter(match).length === 0
                ? <p className="p-6 text-sm text-[var(--text-muted)] text-center">Aucun départ sur cette période.</p>
                : data.departures.filter(match).map((r) => (
                  <div key={r.id} className="px-4 py-3 border-b last:border-0 border-[var(--border)] flex items-center justify-between gap-3">
                    <Name r={r} />
                    <div className="text-right text-xs text-[var(--text-muted)]">
                      <p>{fmt(r.startDate)} → {fmt(r.endDate)}</p>
                      <p>{r.daysCount} j · <span className={r.started ? 'text-emerald-600 font-semibold' : 'text-amber-600 font-semibold'}>{r.started ? 'Parti' : 'À venir'}</span></p>
                    </div>
                  </div>
                ))}
            </div>

            {/* ── Retours ── */}
            <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] overflow-hidden">
              <p className="px-4 py-3 border-b border-[var(--border)] font-bold text-sm flex items-center gap-2"><PlaneLanding size={16} className="text-emerald-500" /> Retours attendus ({data.returns.filter(match).length})</p>
              {data.returns.filter(match).length === 0
                ? <p className="p-6 text-sm text-[var(--text-muted)] text-center">Aucun retour attendu sur cette période.</p>
                : data.returns.filter(match).map((r) => (
                  <div key={r.id} className="px-4 py-3 border-b last:border-0 border-[var(--border)] flex items-center justify-between gap-3">
                    <Name r={r} />
                    <div className="text-right space-y-1">
                      <p className="text-xs text-[var(--text-muted)]">Reprise le {fmt(r.expectedReturnDate)}</p>
                      <ReturnAction r={r} />
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </>
      )}

      {/* ── Confirmation de retour ── */}
      {returning && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => !saving && setReturning(null)}>
          <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] p-6 w-full max-w-md space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-start">
              <div>
                <p className="font-bold text-[var(--text)]">Marquer comme revenu</p>
                <p className="text-sm text-[var(--text-muted)]">{returning.row.employee.firstName} {returning.row.employee.lastName} · congé du {fmt(returning.row.startDate)} au {fmt(returning.row.endDate)}</p>
              </div>
              <button onClick={() => setReturning(null)} className="text-[var(--text-muted)]"><X size={18} /></button>
            </div>
            <label className="block text-sm">
              <span className="text-[var(--text-muted)] text-xs">Date de reprise</span>
              <input type="date" value={returning.date} min={iso(dayOf(returning.row.startDate))}
                onChange={(e) => setReturning({ ...returning, date: e.target.value })}
                className="mt-1 w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-sm" />
            </label>
            {dayOf(returning.date) <= dayOf(returning.row.endDate) && dayOf(returning.date) < dayOf(returning.row.expectedReturnDate) && (
              <p className="text-xs text-amber-600 flex gap-1.5"><AlertTriangle size={14} className="shrink-0 mt-0.5" /> Reprise avant la fin prévue : les jours non pris seront comptés comme perdus (retour anticipé).</p>
            )}
            <div className="flex justify-end gap-2">
              <button onClick={() => setReturning(null)} disabled={saving} className="px-4 py-2 rounded-lg border border-[var(--border)] text-sm">Annuler</button>
              <button onClick={confirmReturn} disabled={saving || !returning.date}
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold flex items-center gap-2 disabled:opacity-50">
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} Confirmer le retour
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}