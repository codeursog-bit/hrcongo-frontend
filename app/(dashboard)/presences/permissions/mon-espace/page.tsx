'use client';
import { useRequestDocumentTemplate } from '@/hooks/useRequestDocumentTemplate';
import { RequestStatusTabs, RequestStatusBadge, RequestEmptyState } from '@/components/requests';
import { requestStatus, type RequestGroup } from '@/lib/request-status';
import { AttendanceModuleFrame as ModulePageFrame } from '@/components/attendance/AttendanceModuleFrame';
import { useModulePageVisuals } from '@/components/requests/ModulePageFrame';
import { ModulePageSkeleton } from '@/components/requests/ModulePageFrame';
import { Button } from '@/components/design-system/primitives';

// ============================================================================
// 📁 app/(dashboard)/presences/permissions/mon-espace/page.tsx
// ✅ Historique complet de MES tickets de permission (traçabilité) + création,
//    impression, annulation, marquage du retour.
// ============================================================================

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Plus, Loader2, Clock, CheckCircle2, XCircle, Ban, ArrowRight,
  Printer, Download, X, LogOut, Stethoscope, Briefcase, HelpCircle, Eye, Ticket,
} from 'lucide-react';
import { motion } from 'framer-motion';
import {
  ResponsiveContainer, AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts';
import { api } from '@/services/api';
import { useBasePath } from '@/hooks/useBasePath';
import PresenceModuleSwitcher from '@/components/PresenceModuleSwitcher';
import PermissionsSubNav from '@/components/PermissionsSubNav';
import { ExitPermissionDocument } from '@/components/documents/RequestDocuments';
import DocumentPreviewModal from '@/components/loans/DocumentPreviewModal';
import { printTicket, downloadTicketPDF } from '@/lib/ticket-print';
import { KonzaLoader } from '@/components/ui/KonzaLoader';
import ContactAdminButton from '@/components/chat/ContactAdminButton';
import PermissionTimeline from '@/components/permissions/PermissionTimeline';
import PermissionReturnSummary from '@/components/permissions/PermissionReturnSummary';
import { effectiveDeparture, returnState, fmtTime, personName } from '@/lib/permission-return';

type Status = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';

const STATUS_CONFIG: Record<Status, { label: string; badge: string; icon: any }> = {
  PENDING:   { label: 'En attente', badge: 'bg-[color-mix(in_srgb,var(--mustard)_14%,var(--surface))] text-[var(--warning-text)] border-[var(--border)]   ', icon: Clock },
  APPROVED:  { label: 'Autorisé',   badge: 'bg-[color-mix(in_srgb,var(--green)_12%,var(--surface))] text-[var(--success-text)] border-[var(--border)]   ', icon: CheckCircle2 },
  REJECTED:  { label: 'Refusé',     badge: 'bg-[color-mix(in_srgb,var(--danger)_10%,var(--surface))] text-[var(--danger-text)] border-[var(--border)]   ', icon: XCircle },
  CANCELLED: { label: 'Annulé',     badge: 'bg-[var(--surface-2)] text-[var(--text-muted)]', icon: Ban },
};

const TYPE_CONFIG: Record<string, { label: string; icon: any }> = {
  URGENCE: { label: 'Urgence', icon: Stethoscope },
  MISSION: { label: 'Mission', icon: Briefcase },
  AUTRE:   { label: 'Autre',   icon: HelpCircle },
};

const PAGE_SIZE = 10;

export default function MonEspacePermissionsPage() {
 const {refonte:uiRefonte,motion:uiMotion}=useModulePageVisuals();
 const [uiStatus,setUiStatus]=useState<RequestGroup>('all');
 const [uiLoadError,setUiLoadError]=useState('');
  const { bp } = useBasePath();
  const [tickets, setTickets] = useState<any[]>([]);
  const [employee, setEmployee] = useState<any>(null);
  const [company, setCompany] = useState<any>(null);
  const requestTemplate = useRequestDocumentTemplate('EXIT_PERMISSION', company);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState('');
  const [page, setPage] = useState(1);
  const [busy, setBusy] = useState<string | null>(null);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [mySpaceTab, setMySpaceTab] = useState<'validations' | 'suivi'>('validations');
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('user');
      if (stored) setUserRole(JSON.parse(stored).role || '');
    } catch {}
    (async () => {
      try {
        const [tix, emp, me]: any = await Promise.all([
          api.get('/permission-tickets/me'),
          api.get('/employees/me').catch(() => null),
          api.get('/auth/me').catch(() => null),
        ]);
        setTickets(tix || []);
        setEmployee(emp);
        setCompany(me?.company ?? null);
        setSelectedId(tix?.[0]?.id ?? null);
      } catch (e) { console.error('Erreur chargement de mes tickets', e); setUiLoadError('Le chargement a échoué. Réessayez dans un instant.'); }
      finally { setIsLoading(false); }
    })();
  }, []);

  const uiTickets=tickets.filter(ticket=>uiStatus==='all'||requestStatus(ticket.status).group===uiStatus);
  const totalPages = Math.max(1, Math.ceil(uiTickets.length / PAGE_SIZE));
  const paginated = uiTickets.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const selected = tickets.find(t => t.id === selectedId) || null;

  const handleCancel = async (id: string) => {
    setBusy(id);
    try {
      await api.patch(`/permission-tickets/${id}/cancel`, {});
      setTickets(prev => prev.map(t => t.id === id ? { ...t, status: 'CANCELLED' } : t));
    } catch (e: any) { alert(e?.message || "Erreur lors de l'annulation"); }
    finally { setBusy(null); }
  };

  const handleMarkReturn = async (id: string) => {
    setBusy(id);
    try {
      // L'employé DÉCLARE son retour : l'heure est notée, la validation revient à l'admin / RH
      const updated: any = await api.patch(`/permission-tickets/${id}/return`, {});
      setTickets(prev => prev.map(t => t.id === id ? { ...t, ...updated } : t));
    } catch (e: any) { alert(e?.message || "Erreur lors de l'enregistrement du retour"); }
    finally { setBusy(null); }
  };

  const TICKET_ID = 'my-permission-ticket-print';
  const ticketRef = selected ? `TK-${selected.id.slice(0, 8).toUpperCase()}` : '';

  const printData = selected ? {
    reference: ticketRef,
    company: { id: company?.id, city: company?.city, documentFooterText: company?.documentFooterText, legalName: company?.legalName, tradeName: company?.tradeName, logo: company?.logo, rccmNumber: company?.rccmNumber, taxNumber: company?.taxNumber, address: company?.address, phone: company?.phone },
    employee: { firstName: employee?.firstName || '', lastName: employee?.lastName || '', employeeNumber: employee?.employeeNumber, department: employee?.department?.name },
    type: selected.type, missionType: selected.missionType, reason: selected.reason, destination: selected.destination,
    departureTime: effectiveDeparture(selected), expectedReturnTime: selected.expectedReturnTime, actualReturnTime: selected.actualReturnTime,
    returnConfirmedByName: selected.returnConfirmedByUser ? personName(selected.returnConfirmedByUser) : undefined,
    status: selected.status, reviewedByName: selected.reviewedByUser?.email, reviewedAt: selected.reviewedAt, rejectionReason: selected.rejectionReason,
  } : null;

  const handleDownloadPdf = async () => {
    setIsExportingPdf(true);
    try { await downloadTicketPDF(TICKET_ID, `mon-ticket-${ticketRef}.pdf`); }
    finally { setIsExportingPdf(false); }
  };

  // ── KPI "Mes validations" ────────────────────────────────────────────────
  const myRequestKpis = useMemo(() => ({
    total: tickets.length,
    approved: tickets.filter(t => t.status === 'APPROVED').length,
    pending: tickets.filter(t => t.status === 'PENDING').length,
    rejected: tickets.filter(t => t.status === 'REJECTED').length,
  }), [tickets]);

  // ── Courbe "Suivi" : 12 derniers mois ────────────────────────────────────
  const MONTHS_FR = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
  const trendData = useMemo(() => {
    const months: { label: string; year: number; month: number }[] = [];
    const ref = new Date();
    for (let i = 11; i >= 0; i--) {
      const d = new Date(ref.getFullYear(), ref.getMonth() - i, 1);
      months.push({ label: `${MONTHS_FR[d.getMonth()]} ${String(d.getFullYear()).slice(2)}`, year: d.getFullYear(), month: d.getMonth() + 1 });
    }
    return months.map(m => {
      const inMonth = tickets.filter(t => { const d = new Date(t.createdAt); return d.getFullYear() === m.year && d.getMonth() + 1 === m.month; });
      return { mois: m.label, Demandés: inMonth.length, Autorisés: inMonth.filter(t => t.status === 'APPROVED').length };
    });
  }, [tickets]);

  if (isLoading) return <ModulePageSkeleton label="Chargement des permissions" />;

  return (
    <ModulePageFrame kind="list" error={uiLoadError}><div className="max-w-[1500px] mx-auto pb-24 space-y-6">
      <PresenceModuleSwitcher />
      <PermissionsSubNav userRole={userRole} />

      <div className="flex items-center justify-between attendance-page-header">
        <div className="attendance-page-heading">
          <p className="text-xs font-semibold tracking-[0.2em] text-[var(--text-muted)]  mb-1">Mon espace</p>
          <h1 className="text-2xl font-semibold text-[var(--text)]">Mes tickets de permission</h1>
        </div>
        <Link href={bp('/presences/permissions/nouveau')} className="px-4 py-2.5 bg-[var(--brand)] hover:bg-[var(--brand)] text-[var(--on-brand)] rounded-xl font-semibold text-sm flex items-center gap-2 shadow-lg ">
          <Plus size={18} /> Nouveau ticket
        </Link>
      </div>

      <div className="flex gap-1 bg-[var(--surface-2)] p-1 rounded-xl w-fit">
        <Button variant="ghost" onClick={() => setMySpaceTab('validations')} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${mySpaceTab === 'validations' ? 'bg-[var(--surface)] text-[var(--text)] shadow-sm' : 'text-[var(--text-muted)]'}`}>Mes validations</Button>
        <Button variant="ghost" onClick={() => setMySpaceTab('suivi')} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${mySpaceTab === 'suivi' ? 'bg-[var(--surface)] text-[var(--text)] shadow-sm' : 'text-[var(--text-muted)]'}`}>Suivi de mes permissions</Button>
      </div>

      {mySpaceTab === 'validations' && (
      <>
      {tickets.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 attendance-metrics">
          <MyKpiCard icon={Ticket} label="Total de mes demandes" value={myRequestKpis.total} tone="slate" />
          <MyKpiCard icon={CheckCircle2} label="Autorisées" value={myRequestKpis.approved} tone="emerald" />
          <MyKpiCard icon={Clock} label="En attente" value={myRequestKpis.pending} tone="amber" />
          <MyKpiCard icon={XCircle} label="Refusées" value={myRequestKpis.rejected} tone="sky" />
        </div>
      )}

      <RequestStatusTabs value={uiStatus} onChange={value=>{setUiStatus(value);setPage(1);setSelectedId(null);}} />
      {uiTickets.length === 0 ? (
        <div className="text-center py-24 bg-[var(--surface)] rounded-2xl border border-[var(--border)]">
          <Clock size={32} className="text-[var(--text-muted)] mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-[var(--text)] mb-1">Aucun ticket pour l&apos;instant</h3>
          <p className="text-[var(--text-muted)] text-sm">Toutes vos sorties (urgence ou mission) seront tracées ici.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-4 space-y-3">
            {paginated.map(t => {
              const tCfg = TYPE_CONFIG[t.type] ?? TYPE_CONFIG.AUTRE;
              const sCfg = STATUS_CONFIG[t.status as Status] ?? STATUS_CONFIG.PENDING;
              const Icon = tCfg.icon;
              const active = t.id === selectedId;
              return (
                <Button variant="ghost" key={t.id} onClick={() => setSelectedId(t.id)} className={`w-full text-left p-4 rounded-2xl border transition-colors ${active ? 'border-[var(--border)] bg-[color-mix(in_srgb,var(--green)_12%,var(--surface))]  shadow-sm' : 'border-[var(--border)] bg-[var(--surface)] hover:border-[var(--text-muted)]'}`}>
                  <div className="flex items-center gap-2">
                    <Icon size={14} className="text-[var(--text-muted)]" />
                    <p className="font-semibold text-sm text-[var(--text)]">{tCfg.label}</p>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] mt-1">
                    <span className="font-mono">{new Date(t.departureTime).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>
                    <ArrowRight size={11} />
                    <span className="font-mono">{new Date(t.expectedReturnTime).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <RequestStatusBadge status={t.status} />
                  {t.status === 'APPROVED' && returnState(t) === 'PENDING_VALIDATION' && (
                    <span className="inline-block mt-2 ml-1.5 text-[10px] font-semibold px-2 py-0.5 rounded-md border bg-[color-mix(in_srgb,var(--mustard)_14%,var(--surface))] text-[var(--warning-text)] border-[var(--border)]   ">Retour à valider</span>
                  )}
                </Button>
              );
            })}

            {uiTickets.length > PAGE_SIZE && (
              <div className="flex items-center justify-between pt-1">
                <Button variant="ghost" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-2 rounded-lg text-xs font-semibold border border-[var(--border)] text-[var(--text-muted)] disabled:opacity-30">Précédent</Button>
                <span className="text-xs text-[var(--text-muted)]">Page {page} / {totalPages} · {uiTickets.length} ticket{uiTickets.length > 1 ? 's' : ''}</span>
                <Button variant="ghost" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-3 py-2 rounded-lg text-xs font-semibold border border-[var(--border)] text-[var(--text-muted)] disabled:opacity-30">Suivant</Button>
              </div>
            )}
          </div>

          <div className="lg:col-span-8">
            {!selected ? (
              <div className="h-full min-h-[300px] flex items-center justify-center bg-[var(--surface)] rounded-2xl border border-[var(--border)] text-[var(--text-muted)] text-sm">
                Sélectionnez un ticket dans la liste
              </div>
            ) : (
              <motion.div key={selected.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] overflow-hidden">
                <div className="p-6 border-b border-[var(--border)] flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-semibold text-[var(--text)]">{(TYPE_CONFIG[selected.type] ?? TYPE_CONFIG.AUTRE).label}</h2>
                    <p className="text-sm text-[var(--text-muted)]">Créé le {new Date(selected.createdAt).toLocaleDateString('fr-FR')}</p>
                  </div>
                  <span className={`text-xs font-semibold px-3 py-1.5 rounded-lg border shrink-0 ${(STATUS_CONFIG[selected.status as Status] ?? STATUS_CONFIG.PENDING).badge}`}>
                    {(STATUS_CONFIG[selected.status as Status] ?? STATUS_CONFIG.PENDING).label}
                  </span>
                </div>

                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-sm bg-[var(--surface-2)] px-3.5 py-2.5 rounded-xl">
                      <Clock size={14} className="text-[var(--text-muted)]" />
                      <span className="font-mono text-xs">{new Date(effectiveDeparture(selected)).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>
                      <ArrowRight size={12} className="text-[var(--text-muted)]" />
                      <span className="font-mono text-xs">{new Date(selected.expectedReturnTime).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>
                      <span className="text-[10px] text-[var(--text-muted)]">(retour prévu)</span>
                    </div>

                    {/* 🔙 État du retour : déclaré → validé par l'admin / RH */}
                    <PermissionReturnSummary ticket={selected} audience="employee" />

                    <div className="text-sm">
                      <p className="text-xs font-semibold text-[var(--text-muted)]   mb-1.5">Motif</p>
                      <p className="text-[var(--text-muted)] bg-[var(--surface-2)] p-3.5 rounded-xl">{selected.reason}</p>
                    </div>

                    {selected.status === 'REJECTED' && selected.rejectionReason && (
                      <div className="text-sm text-[var(--danger-text)] bg-[color-mix(in_srgb,var(--danger)_10%,var(--surface))]  p-3.5 rounded-xl">Motif du refus : {selected.rejectionReason}</div>
                    )}

                    {/* 💬 En attente / refusée : l'employé peut contacter l'administration pour s'expliquer */}
                    <ContactAdminButton
                      status={selected.status}
                      decidedByUserId={selected.reviewedBy}
                      requestLabel={`ma demande de permission (${(TYPE_CONFIG[selected.type] ?? TYPE_CONFIG.AUTRE).label.toLowerCase()}) du ${new Date(selected.departureTime).toLocaleDateString('fr-FR')}`}
                    />

                    <div className="flex gap-2 pt-1 flex-wrap">
                      {selected.status === 'PENDING' && (
                        <Button variant="ghost" onClick={() => handleCancel(selected.id)} disabled={busy === selected.id} className="flex-1 py-2.5 border border-[var(--border)] hover:bg-[color-mix(in_srgb,var(--danger)_10%,var(--surface))] dark:hover:bg-[color-mix(in_srgb,var(--danger)_10%,var(--surface))] hover:border-[var(--border)] hover:text-[var(--danger-text)] text-[var(--text-muted)] text-sm font-semibold rounded-xl flex items-center justify-center gap-2 disabled:opacity-40">
                          {busy === selected.id ? <Loader2 size={16} className="animate-spin" /> : <X size={16} />} Annuler
                        </Button>
                      )}
                      {selected.status === 'APPROVED' && returnState(selected) === 'NOT_RETURNED' && (
                        <Button variant="ghost" onClick={() => handleMarkReturn(selected.id)} disabled={busy === selected.id} className="flex-1 py-2.5 bg-[var(--text)] text-[var(--bg)] text-sm font-semibold rounded-xl flex items-center justify-center gap-2 disabled:opacity-50">
                          {busy === selected.id ? <Loader2 size={16} className="animate-spin" /> : <LogOut size={16} />} Je suis de retour
                        </Button>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button variant="ghost" onClick={() => setTimeout(() => printTicket(TICKET_ID), 50)} className="flex-1 py-2.5 border border-[var(--border)] text-sm font-semibold rounded-xl text-[var(--text-muted)] flex items-center justify-center gap-2 hover:bg-[var(--surface-2)]">
                        <Printer size={16} /> Imprimer
                      </Button>
                      <Button variant="ghost" onClick={handleDownloadPdf} disabled={isExportingPdf} className="flex-1 py-2.5 border border-[var(--border)] text-sm font-semibold rounded-xl text-[var(--text-muted)] flex items-center justify-center gap-2 hover:bg-[var(--surface-2)] disabled:opacity-40">
                        {isExportingPdf ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />} PDF
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Button variant="ghost" onClick={() => setShowPreviewModal(true)} className="w-full py-2.5 border border-dashed border-[var(--border)] text-sm font-semibold rounded-xl text-[var(--text-muted)] flex items-center justify-center gap-2 hover:bg-[var(--surface-2)]">
                      <Eye size={16} /> Aperçu du ticket
                    </Button>
                  </div>
                </div>

                <div className="px-6 pb-6">
                  <div className="border-t border-[var(--border)] pt-5">
                    <PermissionTimeline ticketId={selected.id} refreshKey={`${selected.status}|${returnState(selected)}|${selected.actualReturnTime ?? ''}|${selected.actualDepartureTime ?? ''}`} />
                  </div>
                </div>

                  {/* Rendu réel hors-écran : nécessaire pour la capture d'impression navigateur */}
                  <div className="fixed -left-[9999px] top-0 pointer-events-none" aria-hidden="true">
                    {printData && <ExitPermissionDocument template={requestTemplate} id={TICKET_ID} data={printData as any} />}
                  </div>
              </motion.div>
            )}
          </div>
        </div>
      )}
      </>
      )}

      {mySpaceTab === 'suivi' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 attendance-metrics">
            <MyKpiCard icon={Ticket} label="Total de mes demandes" value={myRequestKpis.total} tone="slate" />
            <MyKpiCard icon={CheckCircle2} label="Autorisées" value={myRequestKpis.approved} tone="emerald" />
            <MyKpiCard icon={Clock} label="En attente" value={myRequestKpis.pending} tone="amber" />
            <MyKpiCard icon={XCircle} label="Refusées" value={myRequestKpis.rejected} tone="sky" />
          </div>

          <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] p-5">
            <p className="text-sm font-semibold text-[var(--text)] mb-4">Évolution de mes sorties (12 derniers mois)</p>
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="mois" fontSize={12} />
                <YAxis fontSize={12} allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Area type="monotone" dataKey="Demandés" stroke="var(--loan-chart-1)" strokeWidth={2.5} dot={false}  fill="var(--loan-gradient-1)" fillOpacity={1} isAnimationActive={uiMotion} animationDuration={700}/>
                <Area type="monotone" dataKey="Autorisés" stroke="var(--loan-chart-2)" strokeWidth={2.5} dot={false}  fill="var(--loan-gradient-2)" fillOpacity={1} isAnimationActive={uiMotion} animationDuration={700}/>
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] overflow-hidden">
            <div className="p-4 border-b border-[var(--border)]">
              <p className="text-sm font-semibold text-[var(--text)]">Historique complet</p>
            </div>
            <div className="divide-y divide-[var(--border)]">
              {tickets.length === 0 ? (
                <p className="text-center py-12 text-[var(--text-muted)] text-sm">Aucun ticket pour l&apos;instant.</p>
              ) : tickets.map(t => {
                const tCfg = TYPE_CONFIG[t.type] ?? TYPE_CONFIG.AUTRE;
                const sCfg = STATUS_CONFIG[t.status as Status] ?? STATUS_CONFIG.PENDING;
                const Icon = tCfg.icon;
                return (
                  <div key={t.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Icon size={14} className="text-[var(--text-muted)]" />
                      <div>
                        <p className="text-sm font-semibold text-[var(--text)]">
                          {new Date(t.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })} · {tCfg.label}
                        </p>
                        {t.reason && <p className="text-xs text-[var(--text-muted)] mt-0.5">{t.reason}</p>}
                        {t.status === 'APPROVED' && returnState(t) === 'CONFIRMED' && (
                          <p className="text-xs text-[var(--success-text)]  mt-0.5">Sorti de {fmtTime(effectiveDeparture(t))} à {fmtTime(t.actualReturnTime)}</p>
                        )}
                        {t.status === 'APPROVED' && returnState(t) === 'PENDING_VALIDATION' && (
                          <p className="text-xs text-[var(--warning-text)]  mt-0.5">Retour déclaré à {fmtTime(t.returnDeclaredAt)} — en attente de validation</p>
                        )}
                      </div>
                    </div>
                    <RequestStatusBadge status={t.status} />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <DocumentPreviewModal open={showPreviewModal} onClose={() => setShowPreviewModal(false)}>
        {printData && <ExitPermissionDocument template={requestTemplate} id="my-perm-doc-preview" data={printData as any} />}
      </DocumentPreviewModal>
    </div></ModulePageFrame>
  );
}

function MyKpiCard({ icon: Icon, label, value, tone }: { icon: any; label: string; value: number; tone: 'slate' | 'emerald' | 'amber' | 'sky' }) {
  const cls: Record<string, string> = {
    slate: 'bg-[var(--surface)] text-[var(--text)] border-[var(--border)]',
    emerald: 'bg-[color-mix(in_srgb,var(--green)_12%,var(--surface))]  text-[var(--success-text)]  border-[var(--border)] ',
    amber: 'bg-[color-mix(in_srgb,var(--mustard)_14%,var(--surface))]  text-[var(--warning-text)]  border-[var(--border)] ',
    sky: 'bg-[color-mix(in_srgb,var(--green)_12%,var(--surface))]  text-[var(--success-text)]  border-[var(--border)] ',
  };
  return (
    <div className={`rounded-2xl border p-4 ${cls[tone]}`}>
      <Icon size={16} className="opacity-60 mb-2" />
      <p className="text-[11px] font-semibold uppercase tracking-wide opacity-70 mb-1">{label}</p>
      <p className="text-lg font-semibold">{value}</p>
    </div>
  );
}