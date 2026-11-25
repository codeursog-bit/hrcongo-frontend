'use client';
import { useRequestDocumentTemplate } from '@/hooks/useRequestDocumentTemplate';
import { AttendanceDialog } from '@/components/attendance/AttendanceDialog';
import { AttendanceSelect } from '@/components/attendance/AttendanceSelect';
import { AttendanceModuleFrame as ModulePageFrame } from '@/components/attendance/AttendanceModuleFrame';
import { useModulePageVisuals } from '@/components/requests/ModulePageFrame';
import { ModulePageSkeleton } from '@/components/requests/ModulePageFrame';
import { Button, Card } from '@/components/design-system/primitives';

// ============================================================================
// 📁 app/(dashboard)/presences/permissions/validations/page.tsx
// ✅ Page "Validations" — tous les tickets de permission, KPI en tête, grille
//    avec boutons Autoriser/Refuser visibles, clic → modal détail + décision
//    + aperçu masqué par défaut. Même modèle que /loans/validations.
// ============================================================================

import React, { useEffect, useMemo, useState } from 'react';
import {
  Check, X, Clock, CheckCircle2, XCircle, Ban, Filter, Users2,
  Eye, Printer, Stethoscope, Briefcase, HelpCircle, LayoutGrid, List, Info, MapPin, PencilLine, Hourglass,
} from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
} from 'recharts';
import { api } from '@/services/api';
import PresenceModuleSwitcher from '@/components/PresenceModuleSwitcher';
import PermissionsSubNav from '@/components/PermissionsSubNav';
import { ExitPermissionDocument } from '@/components/documents/RequestDocuments';
import DocumentPreviewModal from '@/components/loans/DocumentPreviewModal';
import { printTicket } from '@/lib/ticket-print';
import { KonzaLoader } from '@/components/ui/KonzaLoader';
import PermissionTimeline from '@/components/permissions/PermissionTimeline';
import PermissionReturnSummary from '@/components/permissions/PermissionReturnSummary';
import ReturnValidationPanel from '@/components/permissions/ReturnValidationPanel';
import EditTimesModal from '@/components/permissions/EditTimesModal';
import { effectiveDeparture, returnState, isReturnPending, fmtTime, personName } from '@/lib/permission-return';

const APPROVER_ROLES = ['ADMIN', 'SUPER_ADMIN', 'HR_MANAGER'];
const TYPE_LABEL: Record<string, string> = { URGENCE: 'Urgence', MISSION: 'Mission', AUTRE: 'Autre' };
const TYPE_ICON: Record<string, any> = { URGENCE: Stethoscope, MISSION: Briefcase, AUTRE: HelpCircle };

const STATUS_CFG: Record<string, { label: string; cls: string; icon: any }> = {
  PENDING: { label: 'En attente', cls: 'bg-[color-mix(in_srgb,var(--mustard)_14%,var(--surface))] text-[var(--warning-text)] border-[var(--border)]', icon: Clock },
  APPROVED: { label: 'Autorisé', cls: 'bg-[color-mix(in_srgb,var(--green)_12%,var(--surface))] text-[var(--success-text)] border-[var(--border)]', icon: CheckCircle2 },
  REJECTED: { label: 'Refusé', cls: 'bg-[color-mix(in_srgb,var(--danger)_10%,var(--surface))] text-[var(--danger-text)] border-[var(--border)]', icon: XCircle },
  CANCELLED: { label: 'Annulé', cls: 'bg-[var(--surface-2)] text-[var(--text-muted)]', icon: Ban },
};

export default function PermissionsValidationsPage() {
 const {refonte:uiRefonte,motion:uiMotion}=useModulePageVisuals();
 const [uiLoadError,setUiLoadError]=useState('');
  const [tickets, setTickets] = useState<any[]>([]);
  const [company, setCompany] = useState<any>(null);
  const requestTemplate = useRequestDocumentTemplate('EXIT_PERMISSION', company);
  const [userRole, setUserRole] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const [selected, setSelected] = useState<any>(null);
  const [rejectMode, setRejectMode] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showEditTimes, setShowEditTimes] = useState(false);

  // Retour validé / refusé / heures corrigées : on fusionne la réponse dans la liste ET dans le ticket ouvert
  const handleTicketUpdated = (updated: any) => {
    setTickets(prev => prev.map(t => t.id === updated.id ? { ...t, ...updated } : t));
    setSelected((prev: any) => prev && prev.id === updated.id ? { ...prev, ...updated } : prev);
  };

  const load = async () => {
    try {
      const [tix, me]: any = await Promise.all([api.get('/permission-tickets'), api.get('/auth/me').catch(() => null)]);
      setTickets(tix || []); setCompany(me?.company ?? null);
    } catch (e) { console.error('Erreur chargement validations permissions', e); setUiLoadError('Le chargement a échoué. Réessayez dans un instant.'); }
    finally { setIsLoading(false); }
  };

  useEffect(() => {
    try { const stored = localStorage.getItem('user'); if (stored) setUserRole(JSON.parse(stored).role || ''); } catch {}
    load();
  }, []);

  const departments = useMemo(() => Array.from(new Set(tickets.map(t => t.employee?.department?.name).filter(Boolean))).sort(), [tickets]);

  const pendingReturns = useMemo(() => tickets.filter(t => t.status === 'APPROVED' && isReturnPending(t)).length, [tickets]);

  const filtered = useMemo(() => tickets.filter(t =>
    (!statusFilter || (statusFilter === 'RETURN_PENDING' ? (t.status === 'APPROVED' && isReturnPending(t)) : t.status === statusFilter)) &&
    (!typeFilter || t.type === typeFilter) &&
    (!deptFilter || t.employee?.department?.name === deptFilter),
  ), [tickets, statusFilter, typeFilter, deptFilter]);

  const kpis = useMemo(() => ({
    total: tickets.length,
    pending: tickets.filter(t => t.status === 'PENDING').length,
    approved: tickets.filter(t => t.status === 'APPROVED').length,
    rejected: tickets.filter(t => t.status === 'REJECTED').length,
  }), [tickets]);

  const byDept = useMemo(() => {
    const map: Record<string, number> = {};
    tickets.forEach(t => { const n = t.employee?.department?.name || 'Sans département'; map[n] = (map[n] ?? 0) + 1; });
    return Object.entries(map).map(([departement, nombre]) => ({ departement, nombre })).sort((a, b) => b.nombre - a.nombre).slice(0, 6);
  }, [tickets]);

  const byType = useMemo(() => {
    const map: Record<string, number> = {};
    tickets.forEach(t => { map[t.type] = (map[t.type] ?? 0) + 1; });
    return Object.entries(map).map(([type, nombre]) => ({ type: TYPE_LABEL[type] ?? type, nombre })).sort((a, b) => b.nombre - a.nombre);
  }, [tickets]);

  const handleDecision = async (status: 'APPROVED' | 'REJECTED') => {
    if (!selected) return;
    if (status === 'REJECTED' && !rejectionReason.trim()) { setRejectMode(true); return; }
    setIsProcessing(true);
    try {
      await api.patch(`/permission-tickets/${selected.id}/status`, { status, rejectionReason: status === 'REJECTED' ? rejectionReason : undefined });
      await load();
      setSelected(null); setRejectMode(false); setRejectionReason('');
    } catch (e: any) { alert(e?.message || 'Erreur'); } finally { setIsProcessing(false); }
  };

  const quickDecide = async (t: any, status: 'APPROVED' | 'REJECTED', e: React.MouseEvent) => {
    e.stopPropagation();
    if (status === 'REJECTED') { setSelected(t); setRejectMode(true); return; }
    setIsProcessing(true);
    try {
      await api.patch(`/permission-tickets/${t.id}/status`, { status });
      await load();
    } catch (err: any) { alert(err?.message || 'Erreur'); } finally { setIsProcessing(false); }
  };

  const ticketRef = selected ? `TK-${selected.id.slice(0, 8).toUpperCase()}` : '';
  const printData = selected ? {
    reference: ticketRef,
    company: { id: company?.id, city: company?.city, documentFooterText: company?.documentFooterText, legalName: company?.legalName, tradeName: company?.tradeName, logo: company?.logo, rccmNumber: company?.rccmNumber, taxNumber: company?.taxNumber, address: company?.address, phone: company?.phone },
    employee: { firstName: selected.employee?.firstName || '', lastName: selected.employee?.lastName || '', employeeNumber: selected.employee?.employeeNumber, department: selected.employee?.department?.name, position: selected.employee?.position },
    type: selected.type, missionType: selected.missionType, reason: selected.reason, destination: selected.destination,
    departureTime: effectiveDeparture(selected), expectedReturnTime: selected.expectedReturnTime, actualReturnTime: selected.actualReturnTime,
    returnConfirmedByName: selected.returnConfirmedByUser ? personName(selected.returnConfirmedByUser) : undefined,
    status: selected.status, reviewedByName: selected.reviewedByUser?.email, reviewedAt: selected.reviewedAt, rejectionReason: selected.rejectionReason,
  } : null;

  if (isLoading) return <ModulePageSkeleton label="Chargement des permissions" />;

  return (
    <ModulePageFrame kind="list" error={uiLoadError}><div className="max-w-[1500px] mx-auto pb-24 space-y-6">
      <PresenceModuleSwitcher />
      <PermissionsSubNav userRole={userRole} />

      <div className="attendance-page-heading">
        <h1 className="text-xl font-semibold text-[var(--text)]">Validations</h1>
        <p className="text-sm text-[var(--text-muted)]">Tous les tickets de permission, à autoriser ou refuser.</p>
      </div>

      {/* ══════════════════ KPI ══════════════════ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 attendance-metrics">
        <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] p-4">
          <p className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-1">Total</p>
          <p className="text-xl font-semibold text-[var(--text)]">{kpis.total}</p>
        </div>
        <div className="bg-[color-mix(in_srgb,var(--mustard)_14%,var(--surface))]  rounded-2xl border border-[var(--border)]  p-4">
          <p className="text-[11px] font-semibold text-[var(--warning-text)]  tracking-wide mb-1">En attente</p>
          <p className="text-xl font-semibold text-[var(--warning-text)] ">{kpis.pending}</p>
        </div>
        <div className="bg-[color-mix(in_srgb,var(--green)_12%,var(--surface))]  rounded-2xl border border-[var(--border)]  p-4">
          <p className="text-[11px] font-semibold text-[var(--success-text)]  tracking-wide mb-1">Autorisés</p>
          <p className="text-xl font-semibold text-[var(--success-text)] ">{kpis.approved}</p>
        </div>
        <div className="bg-[color-mix(in_srgb,var(--danger)_10%,var(--surface))]  rounded-2xl border border-[var(--border)]  p-4">
          <p className="text-[11px] font-semibold text-[var(--danger-text)]  tracking-wide mb-1">Refusés</p>
          <p className="text-xl font-semibold text-[var(--danger-text)] ">{kpis.rejected}</p>
        </div>
      </div>

      {pendingReturns > 0 && APPROVER_ROLES.includes(userRole) && (
        <Button variant="ghost" onClick={() => setStatusFilter('RETURN_PENDING')} className="w-full text-left flex items-center gap-3 p-4 rounded-2xl border border-[var(--border)]  bg-[color-mix(in_srgb,var(--mustard)_14%,var(--surface))]  hover:shadow-sm transition-colors">
          <Hourglass size={18} className="text-[var(--warning-text)] shrink-0" />
          <div>
            <p className="text-sm font-semibold text-[var(--warning-text)] ">{pendingReturns} retour{pendingReturns > 1 ? 's' : ''} de permission à valider</p>
            <p className="text-xs text-[var(--warning-text)] ">Des employés ont déclaré être de retour — cliquez pour les afficher.</p>
          </div>
        </Button>
      )}

      {/* ══════════════════ STATS ══════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] p-5">
          <p className="text-sm font-semibold text-[var(--text)] mb-4">Départements avec le plus de tickets</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={byDept} layout="vertical" margin={{ left: 24 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} horizontal={false} />
              <XAxis type="number" fontSize={12} allowDecimals={false} />
              <YAxis type="category" dataKey="departement" fontSize={12} width={110} />
              <Tooltip />
              <Bar dataKey="nombre" fill="var(--loan-chart-1)" radius={uiRefonte ? [10,10,10,10] : [0, 6, 6, 0]} maxBarSize={uiRefonte ? 16 : undefined} background={uiRefonte ? {fill:"var(--surface-2)",radius:10} : undefined} isAnimationActive={uiRefonte ? uiMotion : undefined} animationDuration={uiRefonte ? 700 : undefined} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] p-5">
          <p className="text-sm font-semibold text-[var(--text)] mb-4">Types de ticket les plus fréquents</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={byType} layout="vertical" margin={{ left: 24 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} horizontal={false} />
              <XAxis type="number" fontSize={12} allowDecimals={false} />
              <YAxis type="category" dataKey="type" fontSize={12} width={110} />
              <Tooltip />
              <Bar dataKey="nombre" fill="var(--loan-chart-3)" radius={uiRefonte ? [10,10,10,10] : [0, 6, 6, 0]} maxBarSize={uiRefonte ? 16 : undefined} background={uiRefonte ? {fill:"var(--surface-2)",radius:10} : undefined} isAnimationActive={uiRefonte ? uiMotion : undefined} animationDuration={uiRefonte ? 700 : undefined} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ══════════════════ FILTRES + BASCULE VUE ══════════════════ */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-2">
          <FilterSelect icon={Filter} value={statusFilter} onChange={setStatusFilter} placeholder="Tous les statuts" options={[['PENDING', 'En attente'], ['RETURN_PENDING', 'Retour à valider'], ['APPROVED', 'Autorisés'], ['REJECTED', 'Refusés'], ['CANCELLED', 'Annulés']]} />
          <FilterSelect icon={Filter} value={typeFilter} onChange={setTypeFilter} placeholder="Tous les types" options={Object.entries(TYPE_LABEL)} />
          {departments.length > 0 && <FilterSelect icon={Users2} value={deptFilter} onChange={setDeptFilter} placeholder="Tous les départements" options={departments.map(d => [d, d] as [string, string])} />}
        </div>
        <div className="flex gap-1 bg-[var(--surface-2)] p-1 rounded-lg shrink-0">
          <Button variant="ghost" onClick={() => setViewMode('grid')} className={`p-1.5 rounded-md ${viewMode === 'grid' ? 'bg-[var(--surface)] shadow-sm text-[var(--text)]' : 'text-[var(--text-muted)]'}`} title="Vue grille"><LayoutGrid size={16} /></Button>
          <Button variant="ghost" onClick={() => setViewMode('list')} className={`p-1.5 rounded-md ${viewMode === 'list' ? 'bg-[var(--surface)] shadow-sm text-[var(--text)]' : 'text-[var(--text-muted)]'}`} title="Vue liste"><List size={16} /></Button>
        </div>
      </div>

      {/* ══════════════════ GRILLE ══════════════════ */}
      {viewMode === 'grid' && (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.length === 0 ? (
          <div className="col-span-full text-center py-16 bg-[var(--surface)] rounded-2xl border border-[var(--border)] text-sm text-[var(--text-muted)]">Aucun ticket pour ce filtre.</div>
        ) : filtered.map(t => {
          const cfg = STATUS_CFG[t.status] ?? STATUS_CFG.PENDING;
          const Icon = cfg.icon;
          const isPending = t.status === 'PENDING';
          return (
            <Card key={t.id} onClick={() => setSelected(t)} className="cursor-pointer !p-4 transition-transform duration-200 ">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <Button variant="ghost" onClick={(e) => { e.stopPropagation(); setSelected(t); }} aria-label={`Voir le ticket de permission de ${t.employee?.firstName ?? ''} ${t.employee?.lastName ?? ''}`} className="!p-0 !text-left !font-semibold !text-sm !text-[var(--text)] hover:!underline">{t.employee?.firstName} {t.employee?.lastName}</Button>
                  <p className="text-xs text-[var(--text-muted)]">{t.employee?.department?.name || '—'}</p>
                </div>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border flex items-center gap-1 shrink-0 ${cfg.cls}`}><Icon size={10} /> {cfg.label}</span>
              </div>
              {t.status === 'APPROVED' && isReturnPending(t) && (
                <p className="text-[11px] font-semibold text-[var(--warning-text)] flex items-center gap-1 mb-2"><Hourglass size={11} /> Retour à valider · déclaré à {fmtTime(t.returnDeclaredAt)}</p>
              )}
              <p className="text-xs text-[var(--text-muted)] mb-3">{TYPE_LABEL[t.type] ?? t.type} · {new Date(t.departureTime).toLocaleDateString('fr-FR')}</p>
              {isPending && APPROVER_ROLES.includes(userRole) ? (
                <div className="flex gap-2">
                  <Button variant="primary" onClick={(e) => quickDecide(t, 'APPROVED', e)} disabled={isProcessing} className="flex-1 py-1.5 bg-[var(--brand)] hover:bg-[var(--brand)] disabled:opacity-40 text-[var(--on-brand)] text-xs font-semibold rounded-lg flex items-center justify-center gap-1"><Check size={13} /> Autoriser</Button>
                  <Button variant="ghost" onClick={(e) => quickDecide(t, 'REJECTED', e)} className="flex-1 py-1.5 border border-[var(--border)] hover:bg-[color-mix(in_srgb,var(--danger)_10%,var(--surface))] hover:text-[var(--danger-text)] text-[var(--text-muted)] text-xs font-semibold rounded-lg flex items-center justify-center gap-1"><X size={13} /> Refuser</Button>
                </div>
              ) : (
                <p className="text-[11px] text-[var(--text-muted)]">{new Date(t.createdAt).toLocaleDateString('fr-FR')}</p>
              )}
            </Card>
          );
        })}
      </div>
      )}

      {/* ══════════════════ LISTE ══════════════════ */}
      {viewMode === 'list' && (
      <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] overflow-hidden divide-y divide-[var(--border)]">
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-sm text-[var(--text-muted)]">Aucun ticket pour ce filtre.</div>
        ) : filtered.map(t => {
          const cfg = STATUS_CFG[t.status] ?? STATUS_CFG.PENDING;
          const Icon = cfg.icon;
          const isPending = t.status === 'PENDING';
          return (
            <Card key={t.id} onClick={() => setSelected(t)} className="w-full cursor-pointer !p-4 flex flex-col sm:flex-row sm:items-center gap-3 transition-transform duration-200 ">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <Button variant="ghost" onClick={(e) => { e.stopPropagation(); setSelected(t); }} aria-label={`Voir le ticket de permission de ${t.employee?.firstName ?? ''} ${t.employee?.lastName ?? ''}`} className="!p-0 !text-left !font-semibold !text-sm !text-[var(--text)] hover:!underline">{t.employee?.firstName} {t.employee?.lastName}</Button>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border flex items-center gap-1 shrink-0 ${cfg.cls}`}><Icon size={10} /> {cfg.label}</span>
                  {t.status === 'APPROVED' && isReturnPending(t) && <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md border bg-[color-mix(in_srgb,var(--mustard)_14%,var(--surface))] text-[var(--warning-text)] border-[var(--border)] flex items-center gap-1 shrink-0"><Hourglass size={10} /> Retour à valider</span>}
                </div>
                <p className="text-xs text-[var(--text-muted)]">{t.employee?.department?.name || '—'} · {TYPE_LABEL[t.type] ?? t.type} · {new Date(t.departureTime).toLocaleDateString('fr-FR')}</p>
              </div>
              {isPending && APPROVER_ROLES.includes(userRole) && (
                <div className="flex gap-2 shrink-0">
                  <Button variant="primary" onClick={(e) => quickDecide(t, 'APPROVED', e)} disabled={isProcessing} className="px-3 py-1.5 bg-[var(--brand)] hover:bg-[var(--brand)] disabled:opacity-40 text-[var(--on-brand)] text-xs font-semibold rounded-lg flex items-center justify-center gap-1"><Check size={13} /> Autoriser</Button>
                  <Button variant="ghost" onClick={(e) => quickDecide(t, 'REJECTED', e)} className="px-3 py-1.5 border border-[var(--border)] hover:bg-[color-mix(in_srgb,var(--danger)_10%,var(--surface))] hover:text-[var(--danger-text)] text-[var(--text-muted)] text-xs font-semibold rounded-lg flex items-center justify-center gap-1"><X size={13} /> Refuser</Button>
                </div>
              )}
            </Card>
          );
        })}
      </div>
      )}

      {/* ══════════════════ MODAL DÉTAIL + DÉCISION ══════════════════ */}
      {selected && (
        <AttendanceDialog title="Examiner la permission" onClose={() => { setSelected(null); setRejectMode(false); setRejectionReason(''); }}>
          <div onClick={e => e.stopPropagation()} className="bg-[var(--surface)] rounded-2xl shadow-2xl max-w-md w-full p-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <p className="font-semibold text-[var(--text)]">{selected.employee?.firstName} {selected.employee?.lastName}</p>
              <Button variant="ghost" onClick={() => setSelected(null)} className="text-[var(--text-muted)] hover:text-[var(--text)]" aria-label="Fermer"><X size={20} /></Button>
            </div>

            <div className="space-y-2 text-sm mb-4">
              <Row label="Type" value={TYPE_LABEL[selected.type] ?? selected.type} />
              <Row label="Département" value={selected.employee?.department?.name || '—'} />
              <Row label={selected.actualDepartureTime ? 'Sortie (corrigée)' : 'Sortie'} value={new Date(effectiveDeparture(selected)).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })} />
              <Row label="Retour prévu" value={new Date(selected.expectedReturnTime).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })} />
              {selected.destination && <Row label="Destination" value={selected.destination} />}
              <Row label="Statut" value={(STATUS_CFG[selected.status] ?? STATUS_CFG.PENDING).label} />
              {selected.reason && <Row label="Motif" value={selected.reason} />}
              {selected.rejectionReason && <Row label="Motif du refus" value={selected.rejectionReason} />}
            </div>

            {selected.status === 'PENDING' && APPROVER_ROLES.includes(userRole) && (
              <div className="space-y-2 pt-3 border-t border-[var(--border)] mb-3">
                {!rejectMode ? (
                  <div className="flex gap-2">
                    <Button variant="primary" onClick={() => handleDecision('APPROVED')} disabled={isProcessing} className="flex-1 py-2.5 bg-[var(--brand)] hover:bg-[var(--brand)] disabled:opacity-50 text-[var(--on-brand)] text-sm font-semibold rounded-xl flex items-center justify-center gap-2"><Check size={16} /> Autoriser</Button>
                    <Button variant="ghost" onClick={() => setRejectMode(true)} className="flex-1 py-2.5 border border-[var(--border)] hover:bg-[color-mix(in_srgb,var(--danger)_10%,var(--surface))] hover:text-[var(--danger-text)] text-[var(--text-muted)] text-sm font-semibold rounded-xl flex items-center justify-center gap-2"><X size={16} /> Refuser</Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <textarea value={rejectionReason} onChange={e => setRejectionReason(e.target.value)} placeholder="Motif du refus (obligatoire)" rows={2} className="w-full text-sm p-2 rounded-lg border border-[var(--border)] bg-[var(--surface)]" />
                    <div className="flex gap-2">
                      <Button variant="ghost" onClick={() => handleDecision('REJECTED')} disabled={isProcessing} className="flex-1 py-2 bg-[var(--danger)] hover:bg-[var(--danger)] disabled:opacity-50 text-[var(--on-brand)] text-sm font-semibold rounded-xl">Confirmer le refus</Button>
                      <Button variant="ghost" onClick={() => { setRejectMode(false); setRejectionReason(''); }} className="flex-1 py-2 border border-[var(--border)] text-sm font-semibold rounded-xl text-[var(--text-muted)]">Annuler</Button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 🔙 Retour : déclaré par l'employé → validé par Admin / RH */}
            <div className="space-y-3 mb-3">
              <PermissionReturnSummary ticket={selected} audience="admin" />
              {selected.status === 'APPROVED' && isReturnPending(selected) && APPROVER_ROLES.includes(userRole) && (
                <ReturnValidationPanel key={`${selected.id}-${selected.returnDeclaredAt}`} ticket={selected} onUpdated={handleTicketUpdated} />
              )}
              {selected.status === 'APPROVED' && APPROVER_ROLES.includes(userRole) && (
                <Button variant="ghost" onClick={() => setShowEditTimes(true)} className="w-full py-2 border border-[var(--border)] text-xs font-semibold rounded-xl text-[var(--text-muted)] flex items-center justify-center gap-1.5 hover:bg-[var(--surface-2)]">
                  <PencilLine size={13} /> Modifier les heures de sortie / retour
                </Button>
              )}
            </div>

            <div className="pt-3 border-t border-[var(--border)] mb-3">
              <PermissionTimeline ticketId={selected.id} refreshKey={`${selected.status}|${returnState(selected)}|${selected.actualReturnTime ?? ''}|${selected.actualDepartureTime ?? ''}`} />
            </div>

            <Button variant="ghost" onClick={() => setShowPreviewModal(true)} className="w-full py-2 border border-dashed border-[var(--border)] text-xs font-semibold rounded-xl text-[var(--text-muted)] flex items-center justify-center gap-2 hover:bg-[var(--surface-2)] mb-2">
              <Eye size={14} /> Aperçu du ticket
            </Button>
            <Button variant="ghost" onClick={() => setTimeout(() => printTicket('perm-val-print-target'), 50)} className="w-full py-2 border border-[var(--border)] text-xs font-semibold rounded-xl text-[var(--text-muted)] flex items-center justify-center gap-1.5 hover:bg-[var(--surface-2)]">
              <Printer size={13} /> Imprimer
            </Button>

            {/* Rendu réel hors-écran : nécessaire pour la capture d'impression navigateur */}
            <div className="fixed -left-[9999px] top-0 pointer-events-none" aria-hidden="true">
              {printData && <ExitPermissionDocument template={requestTemplate} id="perm-val-print-target" data={printData as any} />}
            </div>
          </div>
        </AttendanceDialog>
      )}

      <EditTimesModal open={showEditTimes} onClose={() => setShowEditTimes(false)} ticket={selected} onUpdated={handleTicketUpdated} />

      <DocumentPreviewModal open={showPreviewModal} onClose={() => setShowPreviewModal(false)}>
        {printData && <ExitPermissionDocument template={requestTemplate} id="perm-val-doc-preview" data={printData as any} />}
      </DocumentPreviewModal>
    </div></ModulePageFrame>
  );
}

function FilterSelect({ icon: IconEl, value, onChange, placeholder, options }: { icon: any; value: string; onChange: (v: string) => void; placeholder: string; options: [string, string][] }) {
  return (
    <div className="relative">
      <IconEl size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" />
      <AttendanceSelect value={value} onChange={e => onChange(e.target.value)} className="pl-7 pr-3 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-xs">
        <option value="">{placeholder}</option>
        {options.map(([val, label]) => <option key={val} value={val}>{label}</option>)}
      </AttendanceSelect>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-[var(--text-muted)]">{label}</span>
      <span className="font-semibold text-[var(--text)] text-right">{value}</span>
    </div>
  );
}