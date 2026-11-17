'use client';
import { ModulePageFrame, ModulePageSkeleton } from '@/components/requests/ModulePageFrame';
import { Button } from '@/components/design-system/primitives';
import '@/components/employees/employees.css';
import '@/components/employees/employee-finishing.css';
import { EmployeeOnboardingStart as EmployeePageStart } from '@/components/employees/create/EmployeeJourney';
import { FancySelect } from '@/components/ui/FancySelect';
import { EmptyState } from '@/components/design-system/primitives';


// ============================================================================
// 📁 app/(dashboard)/employes/[id]/conges/page.tsx
// ✅ Fiche congés d'UN employé — cible du lien (chevron) de /conges/provision.
//    Solde du cycle en cours + historique complet (congés ET absences) via
//    GET /leaves/balance/:id et GET /leaves/employee-history/:id.
// ============================================================================

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, CalendarDays, CheckCircle2, Hourglass, Wallet } from 'lucide-react';
import { api } from '@/services/api';
import { useBasePath } from '@/hooks/useBasePath';
import CongeSubNav from '@/components/CongeSubNav';
import { KonzaLoader } from '@/components/ui/KonzaLoader';

const TYPE_LABELS: Record<string, string> = { ANNUAL: 'Annuel', ANNUAL_ANTICIPATED: 'Annuel anticipé' };
const STATUS_LABELS: Record<string, string> = { PENDING: 'En attente', APPROVED: 'Approuvé', REJECTED: 'Refusé', CANCELLED: 'Annulé' };
const STATUS_COLORS: Record<string, string> = {
 PENDING: 'k-tone-warning',
 APPROVED: 'k-tone-success',
 REJECTED: 'k-tone-danger',
 CANCELLED: 'k-tone-neutral',
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

  if (isLoading) return <ModulePageSkeleton label="Chargement des employés" />;

  return (
    <ModulePageFrame kind="detail"><div className="employee-module-page employee-leaves-page"><EmployeePageStart/><div className="employee-leaves-shell">
      <CongeSubNav userRole={userRole} />

      <header className="employee-leaves-heading">
        <Link href={bp('/conges/provision')} aria-label="Retour aux provisions de congés" className="p-2 bg-[var(--surface)] rounded-xl border border-[var(--border)] hover:bg-[var(--surface-2)] transition-colors">
          <ArrowLeft size={18} className="text-[var(--text-secondary)]" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-[var(--text)]">
            {employee ? `${employee.firstName} ${employee.lastName}` : 'Fiche congés'}
          </h1>
          <p className="text-sm text-[var(--text-secondary)]">
            {employee ? [employee.position, employee.department?.name].filter(Boolean).join(' · ') : ''}
          </p>
        </div>
      </header>

      {error && <div role="alert" className="text-sm text-[var(--danger-text)] bg-[var(--employee-danger-soft)]  p-3.5 rounded-xl">{error}</div>}

      {balance && (
        <div className="employee-leaves-balance">
          <Kpi icon={CalendarDays} label="Droits (cycle)" value={fmtDays(balance.annualEntitled)} cls="bg-[var(--surface-2)] text-[var(--text-secondary)]  " />
          <Kpi icon={CheckCircle2} label="Pris" value={fmtDays(balance.annualTaken)} cls="bg-[var(--surface-2)] text-[var(--text-secondary)]  " />
          <Kpi icon={Wallet} label="Restant" value={fmtDays(balance.annualRemaining)} cls="bg-[var(--surface-2)] text-[var(--text-secondary)]  " />
          <Kpi icon={Hourglass} label="Fin du cycle" value={fmtDate(balance.cycleEndDate)} cls="bg-[var(--surface-2)] text-[var(--text-secondary)]" />
        </div>
      )}

      <div className="employee-leaves-toolbar"><div><h2>Congés et absences</h2><p>Historique de cet employé, toutes natures confondues.</p></div>
        <FancySelect label="Année de l’historique" value={String(year)} onChange={value => setYear(value === '' ? '' : Number(value))} options={[{value:'',label:'Toutes les années'},...availableYears.map(y=>({value:String(y),label:String(y)}))]} />
      </div>

      <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="employee-leaves-table w-full text-sm">
            <thead className="bg-[var(--surface-2)]">
              <tr>{['Nature', 'Type', 'Début', 'Fin', 'Jours', 'Motif', 'Statut'].map(h => <th key={h} className="px-4 py-3 text-left text-xs font-bold text-[var(--text-secondary)] uppercase whitespace-nowrap">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {filtered.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-14 text-[var(--text-secondary)]"><EmptyState icon={CalendarDays} title="Aucun congé ni absence sur cette période">Les demandes enregistrées pour cet employé apparaîtront ici. Vous pouvez choisir une autre année.</EmptyState></td></tr>
              ) : filtered.map(h => (
                <tr key={`${h.kind}-${h.id}`} className="hover:bg-[var(--surface-2)]/40">
                  <td className="px-4 py-3 text-[var(--text-secondary)] whitespace-nowrap">{h.kind === 'LEAVE' ? 'Congé' : 'Absence'}</td>
                  <td className="px-4 py-3 font-semibold text-[var(--text)] whitespace-nowrap">
                    {TYPE_LABELS[h.type] || h.type}{h.subType ? ` · ${h.subType}` : ''}
                    {h.isCarryover && <span className="ml-2 text-[10px] text-[var(--text-secondary)]">(rattrapage)</span>}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">{fmtDate(h.startDate)}</td>
                  <td className="px-4 py-3 whitespace-nowrap">{fmtDate(h.endDate)}</td>
                  <td className="px-4 py-3 font-semibold">{fmtDays(h.daysCount)}</td>
                  <td className="px-4 py-3 text-[var(--text-secondary)] max-w-[280px]">{h.reason || '—'}</td>
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
    </div></div></ModulePageFrame>
  );
}

function Kpi({ icon: Icon, label, value, cls }: { icon: any; label: string; value: string; cls: string }) {
  return (
    <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] p-4">
      <Icon size={18} strokeWidth={1.5} className="employee-leaves-kpi-icon" aria-hidden="true"/>
      <p className="text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-wide mb-1">{label}</p>
      <p className="text-lg font-bold text-[var(--text)]">{value}</p>
    </div>
  );
}
