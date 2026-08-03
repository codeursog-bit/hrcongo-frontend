'use client';

// ============================================================================
// 📁 app/(dashboard)/presences/permissions/validations/page.tsx
// ✅ Page "Validations" — tous les tickets de permission, KPI en tête, grille
//    avec boutons Autoriser/Refuser visibles, clic → modal détail + décision
//    + aperçu masqué par défaut. Même modèle que /loans/validations.
// ============================================================================

import React, { useEffect, useMemo, useState } from 'react';
import {
  Loader2, Check, X, Clock, CheckCircle2, XCircle, Ban, Filter, Users2,
  Eye, Printer, Stethoscope, Briefcase, HelpCircle, LayoutGrid, List, Info, MapPin,
} from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
} from 'recharts';
import { api } from '@/services/api';
import PresenceModuleSwitcher from '@/components/PresenceModuleSwitcher';
import PermissionsSubNav from '@/components/PermissionsSubNav';
import PermissionTicketPrintable from '@/components/PermissionTicketPrintable';
import DocumentPreviewModal from '@/components/loans/DocumentPreviewModal';
import { printTicket } from '@/lib/ticket-print';

const APPROVER_ROLES = ['ADMIN', 'SUPER_ADMIN', 'HR_MANAGER'];
const TYPE_LABEL: Record<string, string> = { URGENCE: 'Urgence', MISSION: 'Mission', AUTRE: 'Autre' };
const TYPE_ICON: Record<string, any> = { URGENCE: Stethoscope, MISSION: Briefcase, AUTRE: HelpCircle };

const STATUS_CFG: Record<string, { label: string; cls: string; icon: any }> = {
  PENDING: { label: 'En attente', cls: 'bg-amber-50 text-amber-700 border-amber-100', icon: Clock },
  APPROVED: { label: 'Autorisé', cls: 'bg-emerald-50 text-emerald-700 border-emerald-100', icon: CheckCircle2 },
  REJECTED: { label: 'Refusé', cls: 'bg-red-50 text-red-700 border-red-100', icon: XCircle },
  CANCELLED: { label: 'Annulé', cls: 'bg-gray-50 text-gray-500 border-gray-200', icon: Ban },
};

export default function PermissionsValidationsPage() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [company, setCompany] = useState<any>(null);
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

  const load = async () => {
    try {
      const [tix, me]: any = await Promise.all([api.get('/permission-tickets'), api.get('/auth/me').catch(() => null)]);
      setTickets(tix || []); setCompany(me?.company ?? null);
    } catch (e) { console.error('Erreur chargement validations permissions', e); }
    finally { setIsLoading(false); }
  };

  useEffect(() => {
    try { const stored = localStorage.getItem('user'); if (stored) setUserRole(JSON.parse(stored).role || ''); } catch {}
    load();
  }, []);

  const departments = useMemo(() => Array.from(new Set(tickets.map(t => t.employee?.department?.name).filter(Boolean))).sort(), [tickets]);

  const filtered = useMemo(() => tickets.filter(t =>
    (!statusFilter || t.status === statusFilter) &&
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
    company: { legalName: company?.legalName, tradeName: company?.tradeName, logo: company?.logo, rccmNumber: company?.rccmNumber, taxNumber: company?.taxNumber, address: company?.address, phone: company?.phone },
    employee: { firstName: selected.employee?.firstName || '', lastName: selected.employee?.lastName || '', employeeNumber: selected.employee?.employeeNumber, department: selected.employee?.department?.name, position: selected.employee?.position },
    type: selected.type, missionType: selected.missionType, reason: selected.reason, destination: selected.destination,
    departureTime: selected.departureTime, expectedReturnTime: selected.expectedReturnTime, actualReturnTime: selected.actualReturnTime,
    status: selected.status, reviewedByName: selected.reviewedByUser?.email, reviewedAt: selected.reviewedAt, rejectionReason: selected.rejectionReason,
  } : null;

  if (isLoading) return <div className="flex justify-center py-24"><Loader2 className="animate-spin text-sky-500" size={40} /></div>;

  return (
    <div className="max-w-[1500px] mx-auto pb-24 space-y-6">
      <PresenceModuleSwitcher />
      <PermissionsSubNav userRole={userRole} />

      <div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Validations</h1>
        <p className="text-sm text-gray-500">Tous les tickets de permission, à autoriser ou refuser.</p>
      </div>

      {/* ══════════════════ KPI ══════════════════ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4">
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Total</p>
          <p className="text-xl font-bold text-gray-900 dark:text-white">{kpis.total}</p>
        </div>
        <div className="bg-amber-50 dark:bg-amber-900/20 rounded-2xl border border-amber-100 dark:border-amber-900 p-4">
          <p className="text-[11px] font-semibold text-amber-600 uppercase tracking-wide mb-1">En attente</p>
          <p className="text-xl font-bold text-amber-700 dark:text-amber-300">{kpis.pending}</p>
        </div>
        <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl border border-emerald-100 dark:border-emerald-900 p-4">
          <p className="text-[11px] font-semibold text-emerald-600 uppercase tracking-wide mb-1">Autorisés</p>
          <p className="text-xl font-bold text-emerald-700 dark:text-emerald-300">{kpis.approved}</p>
        </div>
        <div className="bg-red-50 dark:bg-red-900/20 rounded-2xl border border-red-100 dark:border-red-900 p-4">
          <p className="text-[11px] font-semibold text-red-600 uppercase tracking-wide mb-1">Refusés</p>
          <p className="text-xl font-bold text-red-700 dark:text-red-300">{kpis.rejected}</p>
        </div>
      </div>

      {/* ══════════════════ STATS ══════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5">
          <p className="text-sm font-bold text-gray-700 dark:text-gray-200 mb-4">Départements avec le plus de tickets</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={byDept} layout="vertical" margin={{ left: 24 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} horizontal={false} />
              <XAxis type="number" fontSize={12} allowDecimals={false} />
              <YAxis type="category" dataKey="departement" fontSize={12} width={110} />
              <Tooltip />
              <Bar dataKey="nombre" fill="#0ea5e9" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5">
          <p className="text-sm font-bold text-gray-700 dark:text-gray-200 mb-4">Types de ticket les plus fréquents</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={byType} layout="vertical" margin={{ left: 24 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} horizontal={false} />
              <XAxis type="number" fontSize={12} allowDecimals={false} />
              <YAxis type="category" dataKey="type" fontSize={12} width={110} />
              <Tooltip />
              <Bar dataKey="nombre" fill="#8b5cf6" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ══════════════════ FILTRES + BASCULE VUE ══════════════════ */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-2">
          <FilterSelect icon={Filter} value={statusFilter} onChange={setStatusFilter} placeholder="Tous les statuts" options={[['PENDING', 'En attente'], ['APPROVED', 'Autorisés'], ['REJECTED', 'Refusés'], ['CANCELLED', 'Annulés']]} />
          <FilterSelect icon={Filter} value={typeFilter} onChange={setTypeFilter} placeholder="Tous les types" options={Object.entries(TYPE_LABEL)} />
          {departments.length > 0 && <FilterSelect icon={Users2} value={deptFilter} onChange={setDeptFilter} placeholder="Tous les départements" options={departments.map(d => [d, d] as [string, string])} />}
        </div>
        <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg shrink-0">
          <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded-md ${viewMode === 'grid' ? 'bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white' : 'text-gray-400'}`} title="Vue grille"><LayoutGrid size={16} /></button>
          <button onClick={() => setViewMode('list')} className={`p-1.5 rounded-md ${viewMode === 'list' ? 'bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white' : 'text-gray-400'}`} title="Vue liste"><List size={16} /></button>
        </div>
      </div>

      {/* ══════════════════ GRILLE ══════════════════ */}
      {viewMode === 'grid' && (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.length === 0 ? (
          <div className="col-span-full text-center py-16 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 text-sm text-gray-400">Aucun ticket pour ce filtre.</div>
        ) : filtered.map(t => {
          const cfg = STATUS_CFG[t.status] ?? STATUS_CFG.PENDING;
          const Icon = cfg.icon;
          const isPending = t.status === 'PENDING';
          return (
            <button key={t.id} onClick={() => setSelected(t)} className="text-left bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4 hover:shadow-md hover:border-sky-200 dark:hover:border-sky-800 transition-all">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white text-sm">{t.employee?.firstName} {t.employee?.lastName}</p>
                  <p className="text-xs text-gray-400">{t.employee?.department?.name || '—'}</p>
                </div>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border flex items-center gap-1 shrink-0 ${cfg.cls}`}><Icon size={10} /> {cfg.label}</span>
              </div>
              <p className="text-xs text-gray-500 mb-3">{TYPE_LABEL[t.type] ?? t.type} · {new Date(t.departureTime).toLocaleDateString('fr-FR')}</p>
              {isPending && APPROVER_ROLES.includes(userRole) ? (
                <div className="flex gap-2">
                  <button onClick={(e) => quickDecide(t, 'APPROVED', e)} disabled={isProcessing} className="flex-1 py-1.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-1"><Check size={13} /> Autoriser</button>
                  <button onClick={(e) => quickDecide(t, 'REJECTED', e)} className="flex-1 py-1.5 border border-gray-200 dark:border-gray-600 hover:bg-red-50 hover:text-red-600 text-gray-600 dark:text-gray-300 text-xs font-bold rounded-lg flex items-center justify-center gap-1"><X size={13} /> Refuser</button>
                </div>
              ) : (
                <p className="text-[11px] text-gray-400">{new Date(t.createdAt).toLocaleDateString('fr-FR')}</p>
              )}
            </button>
          );
        })}
      </div>
      )}

      {/* ══════════════════ LISTE ══════════════════ */}
      {viewMode === 'list' && (
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden divide-y divide-gray-100 dark:divide-gray-700">
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-sm text-gray-400">Aucun ticket pour ce filtre.</div>
        ) : filtered.map(t => {
          const cfg = STATUS_CFG[t.status] ?? STATUS_CFG.PENDING;
          const Icon = cfg.icon;
          const isPending = t.status === 'PENDING';
          return (
            <button key={t.id} onClick={() => setSelected(t)} className="w-full text-left flex flex-col sm:flex-row sm:items-center gap-3 p-4 hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold text-gray-900 dark:text-white text-sm">{t.employee?.firstName} {t.employee?.lastName}</p>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border flex items-center gap-1 shrink-0 ${cfg.cls}`}><Icon size={10} /> {cfg.label}</span>
                </div>
                <p className="text-xs text-gray-400">{t.employee?.department?.name || '—'} · {TYPE_LABEL[t.type] ?? t.type} · {new Date(t.departureTime).toLocaleDateString('fr-FR')}</p>
              </div>
              {isPending && APPROVER_ROLES.includes(userRole) && (
                <div className="flex gap-2 shrink-0">
                  <button onClick={(e) => quickDecide(t, 'APPROVED', e)} disabled={isProcessing} className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-1"><Check size={13} /> Autoriser</button>
                  <button onClick={(e) => quickDecide(t, 'REJECTED', e)} className="px-3 py-1.5 border border-gray-200 dark:border-gray-600 hover:bg-red-50 hover:text-red-600 text-gray-600 dark:text-gray-300 text-xs font-bold rounded-lg flex items-center justify-center gap-1"><X size={13} /> Refuser</button>
                </div>
              )}
            </button>
          );
        })}
      </div>
      )}

      {/* ══════════════════ MODAL DÉTAIL + DÉCISION ══════════════════ */}
      {selected && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => { setSelected(null); setRejectMode(false); setRejectionReason(''); }}>
          <div onClick={e => e.stopPropagation()} className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="font-bold text-gray-900 dark:text-white">{selected.employee?.firstName} {selected.employee?.lastName}</p>
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>

            <div className="space-y-2 text-sm mb-4">
              <Row label="Type" value={TYPE_LABEL[selected.type] ?? selected.type} />
              <Row label="Département" value={selected.employee?.department?.name || '—'} />
              <Row label="Sortie" value={new Date(selected.departureTime).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })} />
              <Row label="Retour prévu" value={new Date(selected.expectedReturnTime).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })} />
              {selected.destination && <Row label="Destination" value={selected.destination} />}
              <Row label="Statut" value={(STATUS_CFG[selected.status] ?? STATUS_CFG.PENDING).label} />
              {selected.reason && <Row label="Motif" value={selected.reason} />}
              {selected.rejectionReason && <Row label="Motif du refus" value={selected.rejectionReason} />}
            </div>

            {selected.status === 'PENDING' && APPROVER_ROLES.includes(userRole) && (
              <div className="space-y-2 pt-3 border-t border-gray-100 dark:border-gray-700 mb-3">
                {!rejectMode ? (
                  <div className="flex gap-2">
                    <button onClick={() => handleDecision('APPROVED')} disabled={isProcessing} className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white text-sm font-bold rounded-xl flex items-center justify-center gap-2"><Check size={16} /> Autoriser</button>
                    <button onClick={() => setRejectMode(true)} className="flex-1 py-2.5 border border-gray-200 dark:border-gray-600 hover:bg-red-50 hover:text-red-600 text-gray-600 dark:text-gray-300 text-sm font-bold rounded-xl flex items-center justify-center gap-2"><X size={16} /> Refuser</button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <textarea value={rejectionReason} onChange={e => setRejectionReason(e.target.value)} placeholder="Motif du refus (obligatoire)" rows={2} className="w-full text-sm p-2 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-900" />
                    <div className="flex gap-2">
                      <button onClick={() => handleDecision('REJECTED')} disabled={isProcessing} className="flex-1 py-2 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white text-sm font-bold rounded-xl">Confirmer le refus</button>
                      <button onClick={() => { setRejectMode(false); setRejectionReason(''); }} className="flex-1 py-2 border border-gray-200 dark:border-gray-600 text-sm font-semibold rounded-xl text-gray-500">Annuler</button>
                    </div>
                  </div>
                )}
              </div>
            )}

            <button onClick={() => setShowPreviewModal(true)} className="w-full py-2 border border-dashed border-gray-300 dark:border-gray-600 text-xs font-semibold rounded-xl text-gray-500 dark:text-gray-400 flex items-center justify-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-700 mb-2">
              <Eye size={14} /> Aperçu du ticket
            </button>
            <button onClick={() => setTimeout(() => printTicket('perm-val-print-target'), 50)} className="w-full py-2 border border-gray-200 dark:border-gray-700 text-xs font-semibold rounded-xl text-gray-600 dark:text-gray-300 flex items-center justify-center gap-1.5 hover:bg-gray-50 dark:hover:bg-gray-700">
              <Printer size={13} /> Imprimer
            </button>

            {/* Rendu réel hors-écran : nécessaire pour la capture d'impression navigateur */}
            <div className="fixed -left-[9999px] top-0 pointer-events-none" aria-hidden="true">
              {printData && <PermissionTicketPrintable id="perm-val-print-target" data={printData as any} />}
            </div>
          </div>
        </div>
      )}

      <DocumentPreviewModal open={showPreviewModal} onClose={() => setShowPreviewModal(false)}>
        {printData && <PermissionTicketPrintable id="perm-val-doc-preview" data={printData as any} />}
      </DocumentPreviewModal>
    </div>
  );
}

function FilterSelect({ icon: IconEl, value, onChange, placeholder, options }: { icon: any; value: string; onChange: (v: string) => void; placeholder: string; options: [string, string][] }) {
  return (
    <div className="relative">
      <IconEl size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
      <select value={value} onChange={e => onChange(e.target.value)} className="pl-7 pr-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 text-xs">
        <option value="">{placeholder}</option>
        {options.map(([val, label]) => <option key={val} value={val}>{label}</option>)}
      </select>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-gray-400">{label}</span>
      <span className="font-semibold text-gray-800 dark:text-gray-100 text-right">{value}</span>
    </div>
  );
}