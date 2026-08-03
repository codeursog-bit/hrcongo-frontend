'use client';

// ============================================================================
// 📁 app/(dashboard)/presences/permissions/page.tsx
// ✅ Gestion RH/Manager/Admin des tickets de permission de sortie
// ✅ Vue maître-détail (comme /presences/absences) + clic sur un employé =
//    historique COMPLET et traçable de tous ses tickets (toutes périodes).
// ============================================================================

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Loader2, Search, Check, X, Clock, CheckCircle2, XCircle, Ban,
  ArrowRight, Printer, Download, Plus, Stethoscope, Briefcase,
  HelpCircle, MapPin, History, LogOut, Info, LayoutDashboard, Ticket, Eye,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { api } from '@/services/api';
import { useBasePath } from '@/hooks/useBasePath';
import PresenceModuleSwitcher from '@/components/PresenceModuleSwitcher';
import PermissionsSubNav from '@/components/PermissionsSubNav';
import PermissionTicketPrintable from '@/components/PermissionTicketPrintable';
import EmployeeTicketHistorySidebar, { EmployeeTicketHistoryData } from '@/components/EmployeeTicketHistorySidebar';
import PermissionsOverview from '@/components/permissions/PermissionsOverview';
import DocumentPreviewModal from '@/components/loans/DocumentPreviewModal';
import { printTicket, downloadTicketPDF } from '@/lib/ticket-print';

type Status = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';

const STATUS_CONFIG: Record<Status, { label: string; badge: string; icon: any }> = {
  PENDING:   { label: 'En attente', badge: 'bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800', icon: Clock },
  APPROVED:  { label: 'Autorisé',   badge: 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-800', icon: CheckCircle2 },
  REJECTED:  { label: 'Refusé',     badge: 'bg-red-50 text-red-700 border-red-100 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800', icon: XCircle },
  CANCELLED: { label: 'Annulé',     badge: 'bg-gray-50 text-gray-500 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700', icon: Ban },
};

const TYPE_CONFIG: Record<string, { label: string; icon: any; dot: string }> = {
  URGENCE: { label: 'Urgence', icon: Stethoscope, dot: 'bg-red-400' },
  MISSION: { label: 'Mission', icon: Briefcase,   dot: 'bg-violet-400' },
  AUTRE:   { label: 'Autre',   icon: HelpCircle,  dot: 'bg-gray-400' },
};

export default function PermissionsManagementPage() {
  const { bp } = useBasePath();
  const [tab, setTab] = useState<'overview' | 'tickets'>('overview');
  const [tickets, setTickets] = useState<any[]>([]);
  const [company, setCompany] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'PENDING' | 'ALL'>('PENDING');
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [rejectMode, setRejectMode] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [userRole, setUserRole] = useState('');
  const [historyEmployee, setHistoryEmployee] = useState<EmployeeTicketHistoryData | null>(null);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('user');
      if (stored) setUserRole(JSON.parse(stored).role || '');
    } catch {}

    (async () => {
      try {
        const [tix, me]: any = await Promise.all([
          api.get('/permission-tickets'),
          api.get('/auth/me').catch(() => null),
        ]);
        setTickets(tix || []);
        setCompany(me?.company ?? null);
        const firstPending = (tix || []).find((t: any) => t.status === 'PENDING');
        setSelectedId(firstPending?.id ?? tix?.[0]?.id ?? null);
      } catch (e) {
        console.error('Erreur chargement tickets de permission', e);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const canApprove = ['ADMIN', 'SUPER_ADMIN', 'HR_MANAGER'].includes(userRole);

  const filtered = useMemo(() => {
    let list = filter === 'PENDING' ? tickets.filter(t => t.status === 'PENDING') : tickets;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(t => `${t.employee?.firstName} ${t.employee?.lastName}`.toLowerCase().includes(q));
    }
    return list;
  }, [tickets, filter, search]);

  const pendingCount = tickets.filter(t => t.status === 'PENDING').length;
  const selected = tickets.find(t => t.id === selectedId) || null;

  const handleDecision = async (status: 'APPROVED' | 'REJECTED') => {
    if (!selected) return;
    if (status === 'REJECTED' && !rejectionReason.trim()) { setRejectMode(true); return; }
    setIsProcessing(true);
    try {
      await api.patch(`/permission-tickets/${selected.id}/status`, { status, rejectionReason: status === 'REJECTED' ? rejectionReason : undefined });
      setTickets(prev => prev.map(t => t.id === selected.id ? { ...t, status, rejectionReason } : t));
      setRejectMode(false);
      setRejectionReason('');
    } catch (e: any) {
      alert(e?.message || 'Erreur lors de la mise à jour');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleMarkReturn = async () => {
    if (!selected) return;
    setIsProcessing(true);
    try {
      const updated: any = await api.patch(`/permission-tickets/${selected.id}/return`, {});
      setTickets(prev => prev.map(t => t.id === selected.id ? { ...t, actualReturnTime: updated.actualReturnTime } : t));
    } catch (e: any) {
      alert(e?.message || "Erreur lors de l'enregistrement du retour");
    } finally {
      setIsProcessing(false);
    }
  };

  const openEmployeeHistory = (emp: any) => {
    const employeeTickets = tickets.filter(t => t.employee?.employeeNumber === emp.employeeNumber && t.employee?.firstName === emp.firstName && t.employee?.lastName === emp.lastName);
    setHistoryEmployee({
      employee: { firstName: emp.firstName, lastName: emp.lastName, employeeNumber: emp.employeeNumber, department: emp.department?.name, photoUrl: emp.photoUrl },
      tickets: employeeTickets,
    });
  };

  const TICKET_ID = 'permission-ticket-print';
  const ticketRef = selected ? `TK-${selected.id.slice(0, 8).toUpperCase()}` : '';

  const printData = selected ? {
    reference: ticketRef,
    company: { legalName: company?.legalName, tradeName: company?.tradeName, logo: company?.logo, rccmNumber: company?.rccmNumber, taxNumber: company?.taxNumber, address: company?.address, phone: company?.phone },
    employee: { firstName: selected.employee?.firstName || '', lastName: selected.employee?.lastName || '', employeeNumber: selected.employee?.employeeNumber, department: selected.employee?.department?.name, position: selected.employee?.position },
    type: selected.type, missionType: selected.missionType, reason: selected.reason, destination: selected.destination,
    departureTime: selected.departureTime, expectedReturnTime: selected.expectedReturnTime, actualReturnTime: selected.actualReturnTime,
    status: selected.status, reviewedByName: selected.reviewedByUser?.email, reviewedAt: selected.reviewedAt, rejectionReason: selected.rejectionReason,
  } : null;

  const handleDownloadPdf = async () => {
    setIsExportingPdf(true);
    try { await downloadTicketPDF(TICKET_ID, `ticket-permission-${ticketRef}.pdf`); }
    finally { setIsExportingPdf(false); }
  };

  if (isLoading) return <div className="flex justify-center py-24"><Loader2 className="animate-spin text-sky-500" size={40} /></div>;

  return (
    <div className="max-w-[1600px] mx-auto pb-24 space-y-6">
      <PresenceModuleSwitcher />
      <PermissionsSubNav userRole={userRole} />

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold tracking-[0.2em] text-gray-400 uppercase mb-1">Ressources Humaines</p>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Tickets de permission</h1>
          <p className="text-gray-400 text-sm mt-1">Urgences · Missions d&apos;entreprise à l&apos;extérieur</p>
        </div>
        <Link href={bp('/presences/permissions/nouveau')} className="px-4 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-semibold text-sm flex items-center gap-2 shadow-lg shadow-sky-500/30 w-fit">
          <Plus size={18} /> Nouveau ticket
        </Link>
      </div>

      <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl w-fit">
        <button onClick={() => setTab('overview')} className={`px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-all ${tab === 'overview' ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500'}`}>
          <LayoutDashboard size={14} /> Vue d&apos;ensemble
        </button>
        <button onClick={() => setTab('tickets')} className={`px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-all ${tab === 'tickets' ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500'}`}>
          <Ticket size={14} /> Tickets
          {pendingCount > 0 && <span className="bg-orange-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">{pendingCount}</span>}
        </button>
      </div>

      {tab === 'overview' && (
        <PermissionsOverview
          tickets={tickets}
          onSelectEmployee={(emp) => openEmployeeHistory(emp)}
          onGoToTicket={(id) => { setTab('tickets'); setFilter('ALL'); setSelectedId(id); }}
        />
      )}

      {tab === 'tickets' && (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* ── LISTE ── */}
        <div className="lg:col-span-4 space-y-4">
          <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl w-fit">
            <button onClick={() => setFilter('PENDING')} className={`px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-all ${filter === 'PENDING' ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500'}`}>
              À traiter
              {pendingCount > 0 && <span className="bg-orange-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">{pendingCount}</span>}
            </button>
            <button onClick={() => setFilter('ALL')} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${filter === 'ALL' ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500'}`}>
              Toutes
            </button>
          </div>

          <div className="relative">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher un employé…" className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 text-sm" />
          </div>

          <div className="space-y-2 max-h-[70vh] overflow-y-auto pr-1">
            {filtered.length === 0 ? (
              <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700">
                <CheckCircle2 size={28} className="text-emerald-400 mx-auto mb-2" />
                <p className="text-sm text-gray-400">Rien à afficher ici.</p>
              </div>
            ) : filtered.map(t => {
              const tCfg = TYPE_CONFIG[t.type] ?? TYPE_CONFIG.AUTRE;
              const sCfg = STATUS_CONFIG[t.status as Status] ?? STATUS_CONFIG.PENDING;
              const initials = `${t.employee?.firstName?.[0] ?? ''}${t.employee?.lastName?.[0] ?? ''}`;
              const active = t.id === selectedId;
              return (
                <div
                  key={t.id}
                  onClick={() => { setSelectedId(t.id); setRejectMode(false); setRejectionReason(''); }}
                  className={`w-full text-left p-4 rounded-2xl border cursor-pointer transition-all flex gap-3 items-start ${active ? 'border-sky-400 bg-sky-50 dark:bg-sky-900/20 shadow-sm' : 'border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-200'}`}
                >
                  <button
                    onClick={(e) => { e.stopPropagation(); openEmployeeHistory(t.employee); }}
                    title="Voir l'historique complet de cet employé"
                    className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center font-bold text-gray-500 dark:text-gray-300 text-xs shrink-0 overflow-hidden hover:ring-2 hover:ring-sky-400 transition-all"
                  >
                    {t.employee?.photoUrl ? <img src={t.employee.photoUrl} className="w-full h-full object-cover" alt={initials} /> : initials}
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <button onClick={(e) => { e.stopPropagation(); openEmployeeHistory(t.employee); }} className="font-semibold text-sm text-gray-900 dark:text-white truncate hover:underline text-left">
                        {t.employee?.firstName} {t.employee?.lastName}
                      </button>
                      <span className={`w-2 h-2 rounded-full shrink-0 ${tCfg.dot}`} />
                    </div>
                    <p className="text-xs text-gray-400 truncate">{tCfg.label} · {new Date(t.departureTime).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</p>
                    <span className={`inline-block mt-1.5 text-[10px] font-semibold px-2 py-0.5 rounded-md border ${sCfg.badge}`}>{sCfg.label}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── DÉTAIL ── */}
        <div className="lg:col-span-8">
          {!selected ? (
            <div className="h-full min-h-[400px] flex items-center justify-center bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 text-gray-400 text-sm">
              Sélectionnez un ticket dans la liste
            </div>
          ) : (
            <motion.div key={selected.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
              <div className="p-6 bg-gradient-to-br from-sky-50 to-white dark:from-gray-900 dark:to-gray-800 border-b border-gray-100 dark:border-gray-700 flex items-start justify-between gap-4">
                <div className="flex items-center gap-4">
                  <button onClick={() => openEmployeeHistory(selected.employee)} className="w-14 h-14 rounded-2xl bg-sky-100 dark:bg-sky-900/30 flex items-center justify-center text-base font-bold text-sky-600 overflow-hidden shrink-0">
                    {selected.employee?.photoUrl ? <img src={selected.employee.photoUrl} className="w-full h-full object-cover" alt="" /> : `${selected.employee?.firstName?.[0] ?? ''}${selected.employee?.lastName?.[0] ?? ''}`}
                  </button>
                  <div>
                    <button onClick={() => openEmployeeHistory(selected.employee)} className="text-xl font-bold text-gray-900 dark:text-white hover:underline flex items-center gap-2">
                      {selected.employee?.firstName} {selected.employee?.lastName}
                      <History size={15} className="text-gray-300" />
                    </button>
                    <p className="text-sm text-gray-400">{selected.employee?.position}{selected.employee?.department ? ` · ${selected.employee.department.name}` : ''}</p>
                  </div>
                </div>
                <span className={`text-xs font-semibold px-3 py-1.5 rounded-lg border shrink-0 ${(STATUS_CONFIG[selected.status as Status] ?? STATUS_CONFIG.PENDING).badge}`}>
                  {(STATUS_CONFIG[selected.status as Status] ?? STATUS_CONFIG.PENDING).label}
                </span>
              </div>

              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <DetailTile icon={(TYPE_CONFIG[selected.type] ?? TYPE_CONFIG.AUTRE).icon} label="Type" value={(TYPE_CONFIG[selected.type] ?? TYPE_CONFIG.AUTRE).label} tone="violet" />
                    <DetailTile icon={Clock} label="Sortie" value={new Date(selected.departureTime).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })} tone="sky" />
                    <DetailTile icon={ArrowRight} label="Retour prévu" value={new Date(selected.expectedReturnTime).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })} tone="amber" />
                    <DetailTile icon={LogOut} label="Retour effectif" value={selected.actualReturnTime ? new Date(selected.actualReturnTime).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '—'} tone={selected.actualReturnTime ? 'emerald' : 'slate'} />
                  </div>

                  {selected.destination && (
                    <div className="flex items-center gap-2 text-sm px-3.5 py-2.5 rounded-xl border border-gray-100 dark:border-gray-700">
                      <MapPin size={14} className="text-gray-400" /> {selected.destination}
                    </div>
                  )}

                  <div className="text-sm">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Motif</p>
                    <p className="text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700/40 p-3.5 rounded-xl">{selected.reason}</p>
                  </div>

                  {selected.status === 'REJECTED' && selected.rejectionReason && (
                    <div className="text-sm flex items-start gap-2 text-red-600 bg-red-50 dark:bg-red-900/20 p-3.5 rounded-xl">
                      <Info size={14} className="shrink-0 mt-0.5" /> {selected.rejectionReason}
                    </div>
                  )}

                  {selected.status === 'PENDING' && canApprove && (
                    <div className="pt-2 space-y-3">
                      {!rejectMode ? (
                        <div className="flex gap-2">
                          <button onClick={() => handleDecision('APPROVED')} disabled={isProcessing} className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white text-sm font-bold rounded-xl flex items-center justify-center gap-2">
                            <Check size={16} /> Autoriser
                          </button>
                          <button onClick={() => setRejectMode(true)} disabled={isProcessing} className="flex-1 py-3 border border-gray-200 dark:border-gray-600 hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-red-200 hover:text-red-600 text-gray-600 dark:text-gray-300 text-sm font-bold rounded-xl flex items-center justify-center gap-2">
                            <X size={16} /> Refuser
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <textarea value={rejectionReason} onChange={e => setRejectionReason(e.target.value)} placeholder="Motif du refus…" rows={2} className="w-full px-3 py-2.5 rounded-xl border border-red-200 dark:border-red-800 text-sm resize-none" autoFocus />
                          <div className="flex gap-2">
                            <button onClick={() => handleDecision('REJECTED')} disabled={isProcessing || !rejectionReason.trim()} className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 disabled:opacity-40 text-white text-sm font-bold rounded-xl flex items-center justify-center gap-2">
                              {isProcessing ? <Loader2 size={16} className="animate-spin" /> : <X size={16} />} Confirmer le refus
                            </button>
                            <button onClick={() => { setRejectMode(false); setRejectionReason(''); }} className="px-4 py-2.5 border border-gray-200 dark:border-gray-600 text-sm font-semibold rounded-xl text-gray-500">Annuler</button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {selected.status === 'APPROVED' && !selected.actualReturnTime && (
                    <button onClick={handleMarkReturn} disabled={isProcessing} className="w-full py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-bold rounded-xl flex items-center justify-center gap-2 disabled:opacity-50">
                      {isProcessing ? <Loader2 size={16} className="animate-spin" /> : <LogOut size={16} />} Marquer le retour
                    </button>
                  )}

                  <div className="flex gap-2">
                    <button onClick={() => setTimeout(() => printTicket(TICKET_ID), 50)} className="flex-1 py-2.5 border border-gray-200 dark:border-gray-700 text-sm font-semibold rounded-xl text-gray-600 dark:text-gray-300 flex items-center justify-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-700">
                      <Printer size={16} /> Imprimer
                    </button>
                    <button onClick={handleDownloadPdf} disabled={isExportingPdf} className="flex-1 py-2.5 border border-gray-200 dark:border-gray-700 text-sm font-semibold rounded-xl text-gray-600 dark:text-gray-300 flex items-center justify-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40">
                      {isExportingPdf ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />} PDF
                    </button>
                  </div>
                  <button onClick={() => setShowPreviewModal(true)} className="w-full py-2.5 border border-dashed border-gray-300 dark:border-gray-600 text-sm font-semibold rounded-xl text-gray-500 dark:text-gray-400 flex items-center justify-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-700">
                    <Eye size={16} /> Aperçu du ticket
                  </button>
                </div>

                {/* Rendu réel hors-écran : nécessaire pour la capture d'impression navigateur */}
                <div className="fixed -left-[9999px] top-0 pointer-events-none" aria-hidden="true">
                  {printData && <PermissionTicketPrintable id={TICKET_ID} data={printData as any} />}
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
      )}

      <DocumentPreviewModal open={showPreviewModal} onClose={() => setShowPreviewModal(false)}>
        {printData && <PermissionTicketPrintable id="permission-doc-preview" data={printData as any} />}
      </DocumentPreviewModal>

      <EmployeeTicketHistorySidebar open={!!historyEmployee} onClose={() => setHistoryEmployee(null)} data={historyEmployee} />
    </div>
  );
}

function DetailTile({ icon: Icon, label, value, tone }: { icon: any; label: string; value: string; tone: 'slate' | 'sky' | 'emerald' | 'amber' | 'violet' }) {
  const cls: Record<string, string> = {
    slate: 'bg-gray-50 dark:bg-gray-900 text-gray-700 dark:text-gray-200',
    sky: 'bg-sky-50 dark:bg-sky-900/20 text-sky-700 dark:text-sky-300',
    emerald: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300',
    amber: 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300',
    violet: 'bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300',
  };
  return (
    <div className={`p-3 rounded-xl ${cls[tone]}`}>
      <Icon size={14} className="opacity-60 mb-1.5" />
      <p className="text-[11px] font-semibold uppercase tracking-wide opacity-70">{label}</p>
      <p className="font-bold text-sm">{value}</p>
    </div>
  );
}