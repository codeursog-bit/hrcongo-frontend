'use client';

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
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts';
import { api } from '@/services/api';
import { useBasePath } from '@/hooks/useBasePath';
import PresenceSubNav from '@/components/PresenceSubNav';
import PermissionsSubNav from '@/components/PermissionsSubNav';
import PermissionTicketPrintable from '@/components/PermissionTicketPrintable';
import DocumentPreviewModal from '@/components/loans/DocumentPreviewModal';
import { printTicket, downloadTicketPDF } from '@/lib/ticket-print';

type Status = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';

const STATUS_CONFIG: Record<Status, { label: string; badge: string; icon: any }> = {
  PENDING:   { label: 'En attente', badge: 'bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800', icon: Clock },
  APPROVED:  { label: 'Autorisé',   badge: 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-800', icon: CheckCircle2 },
  REJECTED:  { label: 'Refusé',     badge: 'bg-red-50 text-red-700 border-red-100 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800', icon: XCircle },
  CANCELLED: { label: 'Annulé',     badge: 'bg-gray-50 text-gray-500 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700', icon: Ban },
};

const TYPE_CONFIG: Record<string, { label: string; icon: any }> = {
  URGENCE: { label: 'Urgence', icon: Stethoscope },
  MISSION: { label: 'Mission', icon: Briefcase },
  AUTRE:   { label: 'Autre',   icon: HelpCircle },
};

const PAGE_SIZE = 10;

export default function MonEspacePermissionsPage() {
  const { bp } = useBasePath();
  const [tickets, setTickets] = useState<any[]>([]);
  const [employee, setEmployee] = useState<any>(null);
  const [company, setCompany] = useState<any>(null);
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
      } catch (e) { console.error('Erreur chargement de mes tickets', e); }
      finally { setIsLoading(false); }
    })();
  }, []);

  const totalPages = Math.max(1, Math.ceil(tickets.length / PAGE_SIZE));
  const paginated = tickets.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
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
      const updated: any = await api.patch(`/permission-tickets/${id}/return`, {});
      setTickets(prev => prev.map(t => t.id === id ? { ...t, actualReturnTime: updated.actualReturnTime } : t));
    } catch (e: any) { alert(e?.message || "Erreur lors de l'enregistrement du retour"); }
    finally { setBusy(null); }
  };

  const TICKET_ID = 'my-permission-ticket-print';
  const ticketRef = selected ? `TK-${selected.id.slice(0, 8).toUpperCase()}` : '';

  const printData = selected ? {
    reference: ticketRef,
    company: { legalName: company?.legalName, tradeName: company?.tradeName, logo: company?.logo, rccmNumber: company?.rccmNumber, taxNumber: company?.taxNumber, address: company?.address, phone: company?.phone },
    employee: { firstName: employee?.firstName || '', lastName: employee?.lastName || '', employeeNumber: employee?.employeeNumber, department: employee?.department?.name },
    type: selected.type, missionType: selected.missionType, reason: selected.reason, destination: selected.destination,
    departureTime: selected.departureTime, expectedReturnTime: selected.expectedReturnTime, actualReturnTime: selected.actualReturnTime,
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

  if (isLoading) return <div className="flex justify-center py-24"><Loader2 className="animate-spin text-sky-500" size={40} /></div>;

  return (
    <div className="max-w-[1500px] mx-auto pb-24 space-y-6">
      <PresenceSubNav userRole={userRole} />
      <PermissionsSubNav userRole={userRole} />

      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-bold tracking-[0.2em] text-gray-400 uppercase mb-1">Mon espace</p>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Mes tickets de permission</h1>
        </div>
        <Link href={bp('/presences/permissions/nouveau')} className="px-4 py-2.5 bg-sky-500 hover:bg-sky-600 text-white rounded-xl font-bold text-sm flex items-center gap-2 shadow-lg shadow-sky-500/30">
          <Plus size={18} /> Nouveau ticket
        </Link>
      </div>

      <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl w-fit">
        <button onClick={() => setMySpaceTab('validations')} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${mySpaceTab === 'validations' ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500'}`}>Mes validations</button>
        <button onClick={() => setMySpaceTab('suivi')} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${mySpaceTab === 'suivi' ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500'}`}>Suivi de mes permissions</button>
      </div>

      {mySpaceTab === 'validations' && (
      <>
      {tickets.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <MyKpiCard icon={Ticket} label="Total de mes demandes" value={myRequestKpis.total} tone="slate" />
          <MyKpiCard icon={CheckCircle2} label="Autorisées" value={myRequestKpis.approved} tone="emerald" />
          <MyKpiCard icon={Clock} label="En attente" value={myRequestKpis.pending} tone="amber" />
          <MyKpiCard icon={XCircle} label="Refusées" value={myRequestKpis.rejected} tone="sky" />
        </div>
      )}

      {tickets.length === 0 ? (
        <div className="text-center py-24 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700">
          <Clock size={32} className="text-gray-300 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Aucun ticket pour l&apos;instant</h3>
          <p className="text-gray-400 text-sm">Toutes vos sorties (urgence ou mission) seront tracées ici.</p>
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
                <button key={t.id} onClick={() => setSelectedId(t.id)} className={`w-full text-left p-4 rounded-2xl border transition-all ${active ? 'border-sky-400 bg-sky-50 dark:bg-sky-900/20 shadow-sm' : 'border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-200'}`}>
                  <div className="flex items-center gap-2">
                    <Icon size={14} className="text-gray-400" />
                    <p className="font-semibold text-sm text-gray-900 dark:text-white">{tCfg.label}</p>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-gray-400 mt-1">
                    <span className="font-mono">{new Date(t.departureTime).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>
                    <ArrowRight size={11} />
                    <span className="font-mono">{new Date(t.expectedReturnTime).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <span className={`inline-block mt-2 text-[10px] font-semibold px-2 py-0.5 rounded-md border ${sCfg.badge}`}>{sCfg.label}</span>
                </button>
              );
            })}

            {tickets.length > PAGE_SIZE && (
              <div className="flex items-center justify-between pt-1">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-2 rounded-lg text-xs font-semibold border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 disabled:opacity-30">Précédent</button>
                <span className="text-xs text-gray-400">Page {page} / {totalPages} · {tickets.length} ticket{tickets.length > 1 ? 's' : ''}</span>
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-3 py-2 rounded-lg text-xs font-semibold border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 disabled:opacity-30">Suivant</button>
              </div>
            )}
          </div>

          <div className="lg:col-span-8">
            {!selected ? (
              <div className="h-full min-h-[300px] flex items-center justify-center bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 text-gray-400 text-sm">
                Sélectionnez un ticket dans la liste
              </div>
            ) : (
              <motion.div key={selected.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">{(TYPE_CONFIG[selected.type] ?? TYPE_CONFIG.AUTRE).label}</h2>
                    <p className="text-sm text-gray-400">Créé le {new Date(selected.createdAt).toLocaleDateString('fr-FR')}</p>
                  </div>
                  <span className={`text-xs font-semibold px-3 py-1.5 rounded-lg border shrink-0 ${(STATUS_CONFIG[selected.status as Status] ?? STATUS_CONFIG.PENDING).badge}`}>
                    {(STATUS_CONFIG[selected.status as Status] ?? STATUS_CONFIG.PENDING).label}
                  </span>
                </div>

                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-sm bg-gray-50 dark:bg-gray-700/50 px-3.5 py-2.5 rounded-xl">
                      <Clock size={14} className="text-gray-400" />
                      <span className="font-mono text-xs">{new Date(selected.departureTime).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>
                      <ArrowRight size={12} className="text-gray-300" />
                      <span className="font-mono text-xs">{new Date(selected.expectedReturnTime).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>
                    </div>

                    <div className="text-sm">
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Motif</p>
                      <p className="text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700/40 p-3.5 rounded-xl">{selected.reason}</p>
                    </div>

                    {selected.status === 'REJECTED' && selected.rejectionReason && (
                      <div className="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 p-3.5 rounded-xl">Motif du refus : {selected.rejectionReason}</div>
                    )}

                    <div className="flex gap-2 pt-1 flex-wrap">
                      {selected.status === 'PENDING' && (
                        <button onClick={() => handleCancel(selected.id)} disabled={busy === selected.id} className="flex-1 py-2.5 border border-gray-200 dark:border-gray-600 hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-red-200 hover:text-red-600 text-gray-600 dark:text-gray-300 text-sm font-semibold rounded-xl flex items-center justify-center gap-2 disabled:opacity-40">
                          {busy === selected.id ? <Loader2 size={16} className="animate-spin" /> : <X size={16} />} Annuler
                        </button>
                      )}
                      {selected.status === 'APPROVED' && !selected.actualReturnTime && (
                        <button onClick={() => handleMarkReturn(selected.id)} disabled={busy === selected.id} className="flex-1 py-2.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-semibold rounded-xl flex items-center justify-center gap-2 disabled:opacity-50">
                          {busy === selected.id ? <Loader2 size={16} className="animate-spin" /> : <LogOut size={16} />} Je suis de retour
                        </button>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => setTimeout(() => printTicket(TICKET_ID), 50)} className="flex-1 py-2.5 border border-gray-200 dark:border-gray-700 text-sm font-semibold rounded-xl text-gray-600 dark:text-gray-300 flex items-center justify-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-700">
                        <Printer size={16} /> Imprimer
                      </button>
                      <button onClick={handleDownloadPdf} disabled={isExportingPdf} className="flex-1 py-2.5 border border-gray-200 dark:border-gray-700 text-sm font-semibold rounded-xl text-gray-600 dark:text-gray-300 flex items-center justify-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40">
                        {isExportingPdf ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />} PDF
                      </button>
                    </div>
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
      </>
      )}

      {mySpaceTab === 'suivi' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <MyKpiCard icon={Ticket} label="Total de mes demandes" value={myRequestKpis.total} tone="slate" />
            <MyKpiCard icon={CheckCircle2} label="Autorisées" value={myRequestKpis.approved} tone="emerald" />
            <MyKpiCard icon={Clock} label="En attente" value={myRequestKpis.pending} tone="amber" />
            <MyKpiCard icon={XCircle} label="Refusées" value={myRequestKpis.rejected} tone="sky" />
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5">
            <p className="text-sm font-bold text-gray-700 dark:text-gray-200 mb-4">Évolution de mes sorties (12 derniers mois)</p>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="mois" fontSize={12} />
                <YAxis fontSize={12} allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="Demandés" stroke="#0ea5e9" strokeWidth={2.5} dot={false} />
                <Line type="monotone" dataKey="Autorisés" stroke="#10b981" strokeWidth={2.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
            <div className="p-4 border-b border-gray-100 dark:border-gray-700">
              <p className="text-sm font-bold text-gray-700 dark:text-gray-200">Historique complet</p>
            </div>
            <div className="divide-y divide-gray-100 dark:divide-gray-700">
              {tickets.length === 0 ? (
                <p className="text-center py-12 text-gray-400 text-sm">Aucun ticket pour l&apos;instant.</p>
              ) : tickets.map(t => {
                const tCfg = TYPE_CONFIG[t.type] ?? TYPE_CONFIG.AUTRE;
                const sCfg = STATUS_CONFIG[t.status as Status] ?? STATUS_CONFIG.PENDING;
                const Icon = tCfg.icon;
                return (
                  <div key={t.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Icon size={14} className="text-gray-400" />
                      <div>
                        <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                          {new Date(t.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })} · {tCfg.label}
                        </p>
                        {t.reason && <p className="text-xs text-gray-400 mt-0.5">{t.reason}</p>}
                      </div>
                    </div>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border shrink-0 ${sCfg.badge}`}>{sCfg.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <DocumentPreviewModal open={showPreviewModal} onClose={() => setShowPreviewModal(false)}>
        {printData && <PermissionTicketPrintable id="my-perm-doc-preview" data={printData as any} />}
      </DocumentPreviewModal>
    </div>
  );
}

function MyKpiCard({ icon: Icon, label, value, tone }: { icon: any; label: string; value: number; tone: 'slate' | 'emerald' | 'amber' | 'sky' }) {
  const cls: Record<string, string> = {
    slate: 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-gray-100 dark:border-gray-700',
    emerald: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 border-emerald-100 dark:border-emerald-900',
    amber: 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 border-amber-100 dark:border-amber-900',
    sky: 'bg-sky-50 dark:bg-sky-900/20 text-sky-700 dark:text-sky-300 border-sky-100 dark:border-sky-900',
  };
  return (
    <div className={`rounded-2xl border p-4 ${cls[tone]}`}>
      <Icon size={16} className="opacity-60 mb-2" />
      <p className="text-[11px] font-semibold uppercase tracking-wide opacity-70 mb-1">{label}</p>
      <p className="text-lg font-bold">{value}</p>
    </div>
  );
}