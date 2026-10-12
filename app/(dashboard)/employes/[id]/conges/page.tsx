'use client';

// ============================================================================
// 📁 app/(dashboard)/employes/[id]/conges/page.tsx
// ✅ Fiche congés d'UN employé — cible du lien (chevron) de /conges/provision.
//    Solde du cycle en cours + historique complet (congés ET absences) via
//    GET /leaves/balance/:id et GET /leaves/employee-history/:id.
// ============================================================================

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Loader2, ArrowLeft, CalendarDays, CheckCircle2, Hourglass, Wallet } from 'lucide-react';
import { api } from '@/services/api';
import { useBasePath } from '@/hooks/useBasePath';
import CongeSubNav from '@/components/CongeSubNav';

const TYPE_LABELS: Record<string, string> = { ANNUAL: 'Annuel', ANNUAL_ANTICIPATED: 'Annuel anticipé' };
const STATUS_LABELS: Record<string, string> = { PENDING: 'En attente', APPROVED: 'Approuvé', REJECTED: 'Refusé', CANCELLED: 'Annulé' };
const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-amber-50 text-amber-700 border-amber-100',
  APPROVED: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  REJECTED: 'bg-red-50 text-red-700 border-red-100',
  CANCELLED: 'bg-[var(--surface-2)] text-[var(--text-muted)] border-[var(--border)]',
};

const fmtDate = (v?: string | Date | null) => (v ? new Date(v).toLocaleDateString('fr-FR') : '—');
const fmtDays = (n: any) => `${Number(n ?? 0).toLocaleString('fr-FR', { maximumFractionDigits: 1 })} j`;

export default function EmployeeLeavesPage() {
  const { id: employeeId } = useParams<{ id: string }>();
  const { bp } = useBasePath();

  const [employee, setEmployee] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [balance, setBalance] = useState<any>(null);
  const [userRole, setUserRole] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [year, setYear] = useState<number | ''>('');

  useEffect(() => {
    try { const stored = localStorage.getItem('user'); if (stored) setUserRole(JSON.parse(stored).role || ''); } catch {}
    (async () => {
      try {
        const [hist, bal]: any = await Promise.all([
          api.get(`/leaves/employee-history/${employeeId}`),
          api.get(`/leaves/balance/${employeeId}`).catch(() => null),
        ]);
        setEmployee(hist?.employee || null);
        setHistory(hist?.history || []);
        setBalance(bal);
      } catch (e: any) {
        console.error('Erreur fiche congés employé', e);
        setError(e?.message || 'Impossible de charger la fiche congés.');
      } finally { setIsLoading(false); }
    })();
  }, [employeeId]);

  const availableYears = useMemo(
    () => Array.from(new Set(history.map(h => new Date(h.startDate).getFullYear()))).sort((a, b) => b - a),
    [history],
  );

  const filtered = useMemo(
    () => history.filter(h => year === '' || new Date(h.startDate).getFullYear() === year),
    [history, year],
  );

  if (isLoading) return <div className="flex justify-center py-24"><Loader2 className="animate-spin text-emerald-500" size={40} /></div>;

  return (
    <div className="max-w-[1500px] mx-auto pb-24 space-y-6">
      <CongeSubNav userRole={userRole} />

      <div className="flex items-center gap-3">
        <Link href={bp('/conges/provision')} className="p-2 bg-[var(--surface)] rounded-xl border border-[var(--border)] hover:bg-[var(--surface-2)] transition-colors">
          <ArrowLeft size={18} className="text-[var(--text-muted)]" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-[var(--text)]">
            {employee ? `${employee.firstName} ${employee.lastName}` : 'Fiche congés'}
          </h1>
          <p className="text-sm text-[var(--text-muted)]">
            {employee ? [employee.position, employee.department?.name].filter(Boolean).join(' · ') : ''}
          </p>
        </div>
      </div>

      {error && <div className="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 p-3.5 rounded-xl">{error}</div>}

      {balance && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Kpi icon={CalendarDays} label="Droits (cycle)" value={fmtDays(balance.annualEntitled)} cls="bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-300" />
          <Kpi icon={CheckCircle2} label="Pris" value={fmtDays(balance.annualTaken)} cls="bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-300" />
          <Kpi icon={Wallet} label="Restant" value={fmtDays(balance.annualRemaining)} cls="bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-300" />
          <Kpi icon={Hourglass} label="Fin du cycle" value={fmtDate(balance.cycleEndDate)} cls="bg-[var(--surface-2)] text-[var(--text-muted)]" />
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <select value={year} onChange={e => setYear(e.target.value === '' ? '' : Number(e.target.value))} className="text-xs px-2 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface)]">
          <option value="">Toutes les années</option>
          {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[var(--surface-2)]">
              <tr>{['Nature', 'Type', 'Début', 'Fin', 'Jours', 'Motif', 'Statut'].map(h => <th key={h} className="px-4 py-3 text-left text-xs font-bold text-[var(--text-muted)] uppercase whitespace-nowrap">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {filtered.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-14 text-[var(--text-muted)]">Aucun congé ni absence enregistré.</td></tr>
              ) : filtered.map(h => (
                <tr key={`${h.kind}-${h.id}`} className="hover:bg-[var(--surface-2)]/40">
                  <td className="px-4 py-3 text-[var(--text-muted)] whitespace-nowrap">{h.kind === 'LEAVE' ? 'Congé' : 'Absence'}</td>
                  <td className="px-4 py-3 font-semibold text-[var(--text)] whitespace-nowrap">
                    {TYPE_LABELS[h.type] || h.type}{h.subType ? ` · ${h.subType}` : ''}
                    {h.isCarryover && <span className="ml-2 text-[10px] text-[var(--text-muted)]">(rattrapage)</span>}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">{fmtDate(h.startDate)}</td>
                  <td className="px-4 py-3 whitespace-nowrap">{fmtDate(h.endDate)}</td>
                  <td className="px-4 py-3 font-semibold">{fmtDays(h.daysCount)}</td>
                  <td className="px-4 py-3 text-[var(--text-muted)] max-w-[280px]">{h.reason || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded-full border text-xs font-semibold ${STATUS_COLORS[h.status] || ''}`}>
                      {STATUS_LABELS[h.status] || h.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Kpi({ icon: Icon, label, value, cls }: { icon: any; label: string; value: string; cls: string }) {
  return (
    <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] p-4">
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${cls}`}><Icon size={18} /></div>
      <p className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-1">{label}</p>
      <p className="text-lg font-bold text-[var(--text)]">{value}</p>
    </div>
  );
}