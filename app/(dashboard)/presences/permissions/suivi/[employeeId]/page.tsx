'use client';
import { AttendanceSelect } from '@/components/attendance/AttendanceSelect';
import { AttendanceModuleFrame as ModulePageFrame } from '@/components/attendance/AttendanceModuleFrame';
import { ModulePageSkeleton } from '@/components/requests/ModulePageFrame';

// ============================================================================
// 📁 app/(dashboard)/presences/permissions/suivi/[employeeId]/page.tsx
// ✅ Fiche permissions d'UN employé (côté admin/RH) — cible du lien
//    "Voir la fiche" de /presences/permissions/suivi. Même modèle que
//    /loans/suivi-dettes/[employeeId] : KPI + historique de ses tickets.
// ============================================================================

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, Ticket, CheckCircle2, Clock, XCircle, Ban } from 'lucide-react';
import { api } from '@/services/api';
import { useBasePath } from '@/hooks/useBasePath';
import PresenceModuleSwitcher from '@/components/PresenceModuleSwitcher';
import PermissionsSubNav from '@/components/PermissionsSubNav';
import { KonzaLoader } from '@/components/ui/KonzaLoader';

const TYPE_LABEL: Record<string, string> = { URGENCE: 'Urgence', MISSION: 'Mission', AUTRE: 'Autre' };

const STATUS_CFG: Record<string, { label: string; cls: string; icon: any }> = {
  PENDING: { label: 'En attente', cls: 'bg-[color-mix(in_srgb,var(--mustard)_14%,var(--surface))] text-[var(--warning-text)] border-[var(--border)]', icon: Clock },
  APPROVED: { label: 'Autorisé', cls: 'bg-[color-mix(in_srgb,var(--green)_12%,var(--surface))] text-[var(--success-text)] border-[var(--border)]', icon: CheckCircle2 },
  REJECTED: { label: 'Refusé', cls: 'bg-[color-mix(in_srgb,var(--danger)_10%,var(--surface))] text-[var(--danger-text)] border-[var(--border)]', icon: XCircle },
  CANCELLED: { label: 'Annulé', cls: 'bg-[var(--surface-2)] text-[var(--text-muted)]', icon: Ban },
};

const fmtDateTime = (v?: string | Date | null) =>
  v ? new Date(v).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

export default function EmployeePermissionsDetailPage() {
 const [uiLoadError,setUiLoadError]=useState('');
  const { employeeId } = useParams<{ employeeId: string }>();
  const { bp } = useBasePath();

  const [tickets, setTickets] = useState<any[]>([]);
  const [userRole, setUserRole] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [year, setYear] = useState<number | ''>('');

  useEffect(() => {
    try { const stored = localStorage.getItem('user'); if (stored) setUserRole(JSON.parse(stored).role || ''); } catch {}
    (async () => {
      try {
        const all: any[] = (await api.get('/permission-tickets')) || [];
        setTickets(all.filter(t => t.employeeId === employeeId));
      } catch (e) { console.error('Erreur fiche permissions employé', e); setUiLoadError('Le chargement a échoué. Réessayez dans un instant.'); }
      finally { setIsLoading(false); }
    })();
  }, [employeeId]);

  const employee = tickets[0]?.employee || null;

  const availableYears = useMemo(
    () => Array.from(new Set(tickets.map(t => new Date(t.createdAt).getFullYear()))).sort((a, b) => b - a),
    [tickets],
  );

  const filtered = useMemo(
    () => tickets
      .filter(t => year === '' || new Date(t.createdAt).getFullYear() === year)
      .sort((a, b) => new Date(b.departureTime ?? b.createdAt).getTime() - new Date(a.departureTime ?? a.createdAt).getTime()),
    [tickets, year],
  );

  const kpis = useMemo(() => ({
    total: filtered.length,
    approved: filtered.filter(t => t.status === 'APPROVED').length,
    pending: filtered.filter(t => t.status === 'PENDING').length,
    rejected: filtered.filter(t => t.status === 'REJECTED').length,
  }), [filtered]);

  if (isLoading) return <ModulePageSkeleton label="Chargement des permissions" />;

  return (
    <ModulePageFrame kind="detail" error={uiLoadError}><div className="max-w-[1500px] mx-auto pb-24 space-y-6">
      <PresenceModuleSwitcher />
      <PermissionsSubNav userRole={userRole} />

      <div className="flex items-center gap-3 attendance-page-header">
        <Link href={bp('/presences/permissions/suivi')} className="p-2 bg-[var(--surface)] rounded-xl border border-[var(--border)] hover:bg-[var(--surface-2)] transition-colors">
          <ArrowLeft size={18} className="text-[var(--text-muted)]" />
        </Link>
        <div className="attendance-page-heading">
          <h1 className="text-xl font-semibold text-[var(--text)]">
            {employee ? `${employee.firstName} ${employee.lastName}` : 'Fiche permissions'}
          </h1>
          <p className="text-sm text-[var(--text-muted)]">
            {employee
              ? [employee.position, employee.department?.name, employee.employeeNumber].filter(Boolean).join(' · ')
              : 'Aucun ticket trouvé pour cet employé.'}
          </p>
        </div>
      </div>

      {tickets.length > 0 && (
        <>
          <div className="flex flex-wrap gap-2 attendance-filters">
            <AttendanceSelect value={year} onChange={e => setYear(e.target.value === '' ? '' : Number(e.target.value))} className="text-xs px-2 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface)]">
              <option value="">Toutes les années</option>
              {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
            </AttendanceSelect>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 attendance-metrics">
            <Kpi icon={Ticket} label="Total tickets" value={kpis.total} cls="bg-[color-mix(in_srgb,var(--green)_12%,var(--surface))] text-[var(--success-text)]  " />
            <Kpi icon={CheckCircle2} label="Autorisés" value={kpis.approved} cls="bg-[color-mix(in_srgb,var(--green)_12%,var(--surface))] text-[var(--success-text)]  " />
            <Kpi icon={Clock} label="En attente" value={kpis.pending} cls="bg-[color-mix(in_srgb,var(--mustard)_14%,var(--surface))] text-[var(--warning-text)]  " />
            <Kpi icon={XCircle} label="Refusés" value={kpis.rejected} cls="bg-[color-mix(in_srgb,var(--danger)_10%,var(--surface))] text-[var(--danger-text)]  " />
          </div>

          <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] overflow-hidden">
            <div className="overflow-x-auto attendance-table-scroll" tabIndex={0} role="region" aria-label="Tableau défilant horizontalement">
              <table className="w-full text-sm attendance-table">
                <thead className="bg-[var(--surface-2)]">
                  <tr>{['Type', 'Motif', 'Sortie', 'Retour prévu', 'Retour réel', 'Statut'].map(h => <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-muted)]  whitespace-nowrap">{h}</th>)}</tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {filtered.length === 0 ? (
                    <tr><td colSpan={6} className="text-center py-14 text-[var(--text-muted)]">Aucun ticket pour cette année.</td></tr>
                  ) : filtered.map(t => {
                    const cfg = STATUS_CFG[t.status] ?? STATUS_CFG.PENDING;
                    const Icon = cfg.icon;
                    return (
                      <tr key={t.id} className="hover:bg-[var(--surface-2)]/40">
                        <td className="px-4 py-3 font-semibold text-[var(--text)] whitespace-nowrap">{TYPE_LABEL[t.type] ?? t.type}</td>
                        <td className="px-4 py-3 text-[var(--text-muted)] max-w-[320px]">
                          {t.reason || '—'}
                          {t.status === 'REJECTED' && t.rejectionReason && <p className="text-xs text-[var(--danger-text)] mt-0.5">Refus : {t.rejectionReason}</p>}
                        </td>
                        <td className="px-4 py-3 font-mono text-xs whitespace-nowrap">{fmtDateTime(t.actualDepartureTime || t.departureTime)}</td>
                        <td className="px-4 py-3 font-mono text-xs whitespace-nowrap">{fmtDateTime(t.expectedReturnTime)}</td>
                        <td className="px-4 py-3 font-mono text-xs whitespace-nowrap">{t.actualReturnTime ? fmtDateTime(t.actualReturnTime) : t.status === 'APPROVED' && t.returnStatus === 'PENDING_VALIDATION' ? <span className="text-[var(--warning-text)]">À valider</span> : '—'}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-semibold ${cfg.cls}`}>
                            <Icon size={12} /> {cfg.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div></ModulePageFrame>
  );
}

function Kpi({ icon: Icon, label, value, cls }: { icon: any; label: string; value: number; cls: string }) {
  return (
    <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] p-4">
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${cls}`}><Icon size={18} /></div>
      <p className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-1">{label}</p>
      <p className="text-lg font-semibold text-[var(--text)]">{value}</p>
    </div>
  );
}