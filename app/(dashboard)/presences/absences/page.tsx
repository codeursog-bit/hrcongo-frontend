'use client';

// ============================================================================
// 📁 app/(dashboard)/presences/absences/page.tsx
// ✅ Gestion RH/Manager des demandes d'autorisation d'absence
// ✅ Vue maître-détail (liste + panneau de détail) — plus rapide à traiter
//    qu'une grille de cartes + modale : on clique une demande, on voit tout
//    le dossier (y compris l'aperçu imprimable) et on valide/refuse sans
//    changer d'écran.
// ============================================================================

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Loader2, Search, Check, X, Clock, CheckCircle2, XCircle, Ban,
  Calendar, ArrowRight, Printer, UserCircle, Plus, Stethoscope,
  FileText, Sparkles, Wallet, Paperclip, Info, Lock, Unlock, FileDown,
  LayoutDashboard, ListChecks,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { api } from '@/services/api';
import { useBasePath } from '@/hooks/useBasePath';
import AbsenceRequestPrintable from '@/components/AbsenceRequestPrintable';
import { printAbsenceRequest } from '@/lib/absence-print';
import PresenceModuleSwitcher from '@/components/PresenceModuleSwitcher';
import AbsenceSubNav from '@/components/AbsenceSubNav';
import AbsencesOverview from '@/components/absences/AbsencesOverview';
import { PrintAuthorizationModal } from '@/components/documents/PrintAuthorizationModal';
import OrcaLeaveAbsenceDocument from '@/components/documents/orca/OrcaLeaveAbsenceDocument';

type Status = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';

const STATUS_CONFIG: Record<Status, { label: string; badge: string; icon: any }> = {
  PENDING:   { label: 'En attente', badge: 'bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800', icon: Clock },
  APPROVED:  { label: 'Approuvée',  badge: 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-800', icon: CheckCircle2 },
  REJECTED:  { label: 'Refusée',    badge: 'bg-red-50 text-red-700 border-red-100 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800', icon: XCircle },
  CANCELLED: { label: 'Annulée',    badge: 'bg-gray-50 text-gray-500 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700', icon: Ban },
};

const TYPE_CONFIG: Record<string, { label: string; icon: any; dot: string }> = {
  MALADIE:         { label: 'Maladie',         icon: Stethoscope, dot: 'bg-red-400' },
  CONVENTIONNELLE: { label: 'Conventionnelle', icon: FileText,    dot: 'bg-violet-400' },
  EXCEPTIONNELLE:  { label: 'Exceptionnelle',  icon: Sparkles,    dot: 'bg-amber-400' },
};

export default function AbsenceManagementPage() {
  const { bp } = useBasePath();
  const [tab, setTab] = useState<'overview' | 'demandes'>('overview');
  const [requests, setRequests] = useState<any[]>([]);
  const [company, setCompany]   = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter]       = useState<'PENDING' | 'ALL'>('PENDING');
  const [search, setSearch]       = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [rejectMode, setRejectMode] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [userRole, setUserRole] = useState('');
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;
  const [showPrintAuthModal, setShowPrintAuthModal] = useState(false);
  const [isTogglingPrintAuth, setIsTogglingPrintAuth] = useState(false);
  const [docData, setDocData] = useState<any>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('user');
      if (stored) setUserRole(JSON.parse(stored).role || '');
    } catch {}

    (async () => {
      try {
        const [reqs, me]: any = await Promise.all([
          api.get('/absence-requests'),
          api.get('/auth/me').catch(() => null),
        ]);
        setRequests(reqs || []);
        setCompany(me?.company ?? null);
        const firstPending = (reqs || []).find((r: any) => r.status === 'PENDING');
        setSelectedId(firstPending?.id ?? reqs?.[0]?.id ?? null);
      } catch (e) {
        console.error("Erreur chargement demandes d'absence", e);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const canApprove = ['ADMIN', 'SUPER_ADMIN', 'HR_MANAGER'].includes(userRole);

  useEffect(() => {
    if (!selectedId) { setDocData(null); return; }
    (async () => {
      try {
        setDocData(await api.get(`/absence-requests/${selectedId}/document-data`));
      } catch (e) {
        console.error('Erreur chargement document-data', e);
        setDocData(null);
      }
    })();
  }, [selectedId]);

  const filtered = useMemo(() => {
    let list = filter === 'PENDING' ? requests.filter(r => r.status === 'PENDING') : requests;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(r =>
        `${r.employee?.firstName} ${r.employee?.lastName}`.toLowerCase().includes(q) ||
        (TYPE_CONFIG[r.type]?.label ?? '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [requests, filter, search]);

  useEffect(() => { setPage(1); }, [filter, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated   = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const pendingCount = requests.filter(r => r.status === 'PENDING').length;
  const selected = requests.find(r => r.id === selectedId) || null;

  const handleDecision = async (status: 'APPROVED' | 'REJECTED') => {
    if (!selected) return;
    if (status === 'REJECTED' && !rejectionReason.trim()) { setRejectMode(true); return; }

    setIsProcessing(true);
    try {
      await api.patch(`/absence-requests/${selected.id}/status`, {
        status,
        rejectionReason: status === 'REJECTED' ? rejectionReason : undefined,
      });
      setRequests(prev => prev.map(r => r.id === selected.id ? { ...r, status, rejectionReason } : r));
      setRejectMode(false);
      setRejectionReason('');
    } catch (e: any) {
      alert(e?.message || 'Erreur lors de la mise à jour');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSetPrintAuthorization = async (authorized: boolean) => {
    if (!selected) return;
    setIsTogglingPrintAuth(true);
    try {
      await api.patch(`/absence-requests/${selected.id}/print-authorization`, { authorized });
      setRequests(prev => prev.map(r => r.id === selected.id ? { ...r, printAuthorized: authorized } : r));
    } catch (e: any) {
      alert(e?.message || "Erreur lors de la mise à jour de l'autorisation d'impression");
    } finally {
      setIsTogglingPrintAuth(false);
    }
  };

  const handleSelectEmployeeFromOverview = (emp: any) => {
    const req = requests.find(r =>
      r.employee?.employeeNumber === emp?.employeeNumber &&
      r.employee?.firstName === emp?.firstName &&
      r.employee?.lastName === emp?.lastName
    );
    setTab('demandes');
    setFilter('ALL');
    if (req) setSelectedId(req.id);
  };

  const printData = selected ? {
    reference: `DEA-${selected.id.slice(0, 8).toUpperCase()}`,
    company: {
      legalName: company?.legalName, tradeName: company?.tradeName, logo: company?.logo,
      rccmNumber: company?.rccmNumber, taxNumber: company?.taxNumber, address: company?.address, phone: company?.phone,
    },
    employee: {
      firstName: selected.employee?.firstName || '', lastName: selected.employee?.lastName || '',
      position: selected.employee?.position, departmentName: selected.employee?.department?.name,
    },
    type: selected.type, reason: selected.reason, isPaid: selected.isPaid,
    startDate: selected.startDate, endDate: selected.endDate, workingDays: selected.workingDays,
    hasAttachment: !!selected.attachmentUrl, status: selected.status,
    requestedAt: selected.requestedAt || selected.createdAt,
    reviewedByName: selected.reviewedByUser?.email,
    reviewedAt: selected.reviewedAt,
    rejectionReason: selected.rejectionReason,
  } : null;

  if (isLoading) {
    return <div className="flex justify-center py-24"><Loader2 className="animate-spin text-sky-500" size={40} /></div>;
  }

  return (
    <div className="max-w-[1600px] mx-auto pb-24 space-y-6">
      <PresenceModuleSwitcher />
      <AbsenceSubNav userRole={userRole} />

      {/* ── HEADER ── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold tracking-[0.2em] text-gray-400 uppercase mb-1">Ressources Humaines</p>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Demandes d&apos;absence</h1>
          <p className="text-gray-400 text-sm mt-1">Maladie · Conventionnelle · Exceptionnelle</p>
        </div>
        <div className="flex gap-3">
          <Link href={bp('/presences/absences/mon-espace')} className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 font-semibold text-sm hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center gap-2 text-gray-600 dark:text-gray-300">
            <UserCircle size={18} /> Mon espace
          </Link>
          <Link href={bp('/presences/absences/nouveau')} className="px-4 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-semibold text-sm flex items-center gap-2 shadow-lg shadow-sky-500/30">
            <Plus size={18} /> Nouvelle demande
          </Link>
        </div>
      </div>

      <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl w-fit">
        <button onClick={() => setTab('overview')} className={`px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-all ${tab === 'overview' ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500'}`}>
          <LayoutDashboard size={14} /> Vue d&apos;ensemble
        </button>
        <button onClick={() => setTab('demandes')} className={`px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-all ${tab === 'demandes' ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500'}`}>
          <ListChecks size={14} /> Demandes
          {pendingCount > 0 && <span className="bg-orange-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">{pendingCount}</span>}
        </button>
      </div>

      {tab === 'overview' && (
        <AbsencesOverview
          requests={requests}
          onSelectEmployee={handleSelectEmployeeFromOverview}
          onGoToRequest={(id) => { setTab('demandes'); setFilter('ALL'); if (id) setSelectedId(id); }}
        />
      )}

      {tab === 'demandes' && (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* ── LISTE (MAÎTRE) ── */}
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
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher un employé…"
              className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 text-sm"
            />
          </div>

          <div className="space-y-2 max-h-[70vh] overflow-y-auto pr-1">
            {filtered.length === 0 ? (
              <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700">
                <CheckCircle2 size={28} className="text-emerald-400 mx-auto mb-2" />
                <p className="text-sm text-gray-400">Rien à afficher ici.</p>
              </div>
            ) : paginated.map(r => {
              const tCfg = TYPE_CONFIG[r.type] ?? TYPE_CONFIG.EXCEPTIONNELLE;
              const sCfg = STATUS_CONFIG[r.status as Status] ?? STATUS_CONFIG.PENDING;
              const initials = `${r.employee?.firstName?.[0] ?? ''}${r.employee?.lastName?.[0] ?? ''}`;
              const active = r.id === selectedId;
              return (
                <button
                  key={r.id}
                  onClick={() => { setSelectedId(r.id); setRejectMode(false); setRejectionReason(''); }}
                  className={`w-full text-left p-4 rounded-2xl border transition-all flex gap-3 items-start ${
                    active ? 'border-sky-400 bg-sky-50 dark:bg-sky-900/20 shadow-sm' : 'border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-200'
                  }`}
                >
                  <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center font-bold text-gray-500 dark:text-gray-300 text-xs shrink-0 overflow-hidden">
                    {r.employee?.photoUrl ? <img src={r.employee.photoUrl} className="w-full h-full object-cover" alt={initials} /> : initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-semibold text-sm text-gray-900 dark:text-white truncate">{r.employee?.firstName} {r.employee?.lastName}</p>
                      <span className={`w-2 h-2 rounded-full shrink-0 ${tCfg.dot}`} />
                    </div>
                    <p className="text-xs text-gray-400 truncate">{tCfg.label} · {Number(r.workingDays)} j</p>
                    <div className="flex items-center gap-1 mt-1.5">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${sCfg.badge}`}>{sCfg.label}</span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {filtered.length > PAGE_SIZE && (
            <div className="flex items-center justify-between pt-1">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-2 rounded-lg text-xs font-semibold border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 disabled:opacity-30"
              >
                Précédent
              </button>
              <span className="text-xs text-gray-400">Page {page} / {totalPages} · {filtered.length} demande{filtered.length > 1 ? 's' : ''}</span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-2 rounded-lg text-xs font-semibold border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 disabled:opacity-30"
              >
                Suivant
              </button>
            </div>
          )}
        </div>

        {/* ── DÉTAIL ── */}
        <div className="lg:col-span-8">
          {!selected ? (
            <div className="h-full min-h-[400px] flex items-center justify-center bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 text-gray-400 text-sm">
              Sélectionnez une demande dans la liste
            </div>
          ) : (
            <motion.div key={selected.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
              <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">{selected.employee?.firstName} {selected.employee?.lastName}</h2>
                  <p className="text-sm text-gray-400">{selected.employee?.position}{selected.employee?.department ? ` · ${selected.employee.department.name}` : ''}</p>
                </div>
                <span className={`text-xs font-semibold px-3 py-1.5 rounded-lg border shrink-0 ${(STATUS_CONFIG[selected.status as Status] ?? STATUS_CONFIG.PENDING).badge}`}>
                  {(STATUS_CONFIG[selected.status as Status] ?? STATUS_CONFIG.PENDING).label}
                </span>
              </div>

              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-sm bg-gray-50 dark:bg-gray-700/50 px-3.5 py-2.5 rounded-xl">
                    <Calendar size={14} className="text-gray-400" />
                    <span className="font-mono text-xs">{new Date(selected.startDate).toLocaleDateString('fr-FR')}</span>
                    <ArrowRight size={12} className="text-gray-300" />
                    <span className="font-mono text-xs">{new Date(selected.endDate).toLocaleDateString('fr-FR')}</span>
                    <span className="ml-auto font-bold text-xs text-gray-500">{Number(selected.workingDays)}j ouvrables</span>
                  </div>

                  <div className="flex items-center gap-2 text-sm px-3.5 py-2.5 rounded-xl border border-gray-100 dark:border-gray-700">
                    <Wallet size={14} className="text-gray-400" />
                    {selected.isPaid ? 'Absence payée demandée' : 'Absence non-payée demandée'}
                  </div>

                  {selected.attachmentUrl && (
                    <a href={selected.attachmentUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm px-3.5 py-2.5 rounded-xl border border-gray-100 dark:border-gray-700 text-sky-600 hover:underline">
                      <Paperclip size={14} /> Voir le justificatif joint
                    </a>
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
                            <Check size={16} /> Valider
                          </button>
                          <button onClick={() => setRejectMode(true)} disabled={isProcessing} className="flex-1 py-3 border border-gray-200 dark:border-gray-600 hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-red-200 hover:text-red-600 text-gray-600 dark:text-gray-300 text-sm font-bold rounded-xl flex items-center justify-center gap-2">
                            <X size={16} /> Refuser
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <textarea
                            value={rejectionReason}
                            onChange={e => setRejectionReason(e.target.value)}
                            placeholder="Motif du refus…"
                            rows={2}
                            className="w-full px-3 py-2.5 rounded-xl border border-red-200 dark:border-red-800 text-sm resize-none"
                            autoFocus
                          />
                          <div className="flex gap-2">
                            <button onClick={() => handleDecision('REJECTED')} disabled={isProcessing || !rejectionReason.trim()} className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 disabled:opacity-40 text-white text-sm font-bold rounded-xl flex items-center justify-center gap-2">
                              {isProcessing ? <Loader2 size={16} className="animate-spin" /> : <X size={16} />} Confirmer le refus
                            </button>
                            <button onClick={() => { setRejectMode(false); setRejectionReason(''); }} className="px-4 py-2.5 border border-gray-200 dark:border-gray-600 text-sm font-semibold rounded-xl text-gray-500">
                              Annuler
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {selected.status === 'APPROVED' && canApprove && (
                    <div className="pt-1 pb-1 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 text-sm">
                        {selected.printAuthorized ? <Unlock size={14} className="text-emerald-500" /> : <Lock size={14} className="text-gray-400" />}
                        <span className="text-gray-600 dark:text-gray-300">
                          {selected.printAuthorized ? "Impression autorisée pour l'employé" : 'Impression non autorisée'}
                        </span>
                      </div>
                      <button
                        onClick={() => setShowPrintAuthModal(true)}
                        disabled={isTogglingPrintAuth}
                        className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40"
                      >
                        {selected.printAuthorized ? 'Modifier' : 'Autoriser'}
                      </button>
                    </div>
                  )}

                  <button
                    onClick={() => setTimeout(() => printAbsenceRequest(), 50)}
                    className="w-full py-2.5 border border-gray-200 dark:border-gray-700 text-sm font-semibold rounded-xl text-gray-600 dark:text-gray-300 flex items-center justify-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <Printer size={16} /> Imprimer le formulaire
                  </button>

                  {docData?.company?.documentTemplate === 'ORCA' && (
                    <button
                      onClick={() => window.open(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/absence-requests/${selected.id}/document.docx`, '_blank')}
                      className="w-full py-2.5 border border-sky-200 dark:border-sky-800 bg-sky-50 dark:bg-sky-900/20 text-sm font-semibold rounded-xl text-sky-700 dark:text-sky-300 flex items-center justify-center gap-2 hover:bg-sky-100 dark:hover:bg-sky-900/40"
                      title="Télécharger le fichier Word original rempli"
                    >
                      <FileDown size={16} /> Télécharger .docx
                    </button>
                  )}
                </div>

                {/* Aperçu imprimable */}
                <div className="bg-gray-100 dark:bg-gray-900 rounded-2xl p-3 overflow-hidden border border-gray-200 dark:border-gray-700">
                  <div className="scale-[0.42] origin-top-left -mb-[58%]" style={{ width: '238%' }}>
                    {docData?.company?.documentTemplate === 'ORCA' ? (
                      <OrcaLeaveAbsenceDocument
                        id="absence-print-root"
                        variant="ABSENCE"
                        reference={`DEA-${selected.id.slice(0, 8).toUpperCase()}`}
                        employee={docData.employee}
                        responsableName={docData.responsableName}
                        type={docData.type}
                        isPaid={docData.isPaid}
                        startDate={docData.startDate}
                        endDate={docData.endDate}
                        daysCount={docData.workingDays}
                        reason={docData.reason}
                        status={docData.status}
                        company={docData.company}
                      />
                    ) : (
                      printData && <AbsenceRequestPrintable data={printData as any} />
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
      )}

      <PrintAuthorizationModal
        isOpen={showPrintAuthModal}
        onClose={() => setShowPrintAuthModal(false)}
        onConfirm={handleSetPrintAuthorization}
        employeeName={`${selected?.employee?.firstName || ''} ${selected?.employee?.lastName || ''}`.trim()}
      />
    </div>
  );
}