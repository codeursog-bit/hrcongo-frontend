'use client';

// ============================================================================
// 📁 app/(dashboard)/presences/absences/mon-espace/page.tsx
// ✅ Espace employé — historique de mes demandes d'absence
// ✅ v2 : vue maître-détail (liste paginée + panneau de détail précis),
//    cohérente avec la page de gestion RH.
// ============================================================================

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Plus, Loader2, Clock, CheckCircle2, XCircle, Ban,
  Calendar, ArrowRight, Printer, X, Paperclip, Info, Wallet,
  Stethoscope, FileText, Sparkles, Lock,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { api } from '@/services/api';
import { useBasePath } from '@/hooks/useBasePath';
import AbsenceRequestPrintable from '@/components/AbsenceRequestPrintable';
import { printAbsenceRequest } from '@/lib/absence-print';
import PresenceSubNav from '@/components/PresenceSubNav';

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

const PAGE_SIZE = 10;

export default function MonEspaceAbsencesPage() {
  const { bp } = useBasePath();
  const [requests, setRequests] = useState<any[]>([]);
  const [employee, setEmployee] = useState<any>(null);
  const [company, setCompany]   = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [userRole, setUserRole] = useState('');

  const load = async () => {
    try {
      const [reqs, emp, me]: any = await Promise.all([
        api.get('/absence-requests/me'),
        api.get('/employees/me').catch(() => null),
        api.get('/auth/me').catch(() => null),
      ]);
      setRequests(reqs || []);
      setEmployee(emp);
      setCompany(me?.company ?? null);
      setSelectedId(reqs?.[0]?.id ?? null);
    } catch (e) {
      console.error('Erreur chargement de mes demandes', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
    try {
      const stored = localStorage.getItem('user');
      if (stored) setUserRole(JSON.parse(stored).role || '');
    } catch {}
  }, []);

  const totalPages = Math.max(1, Math.ceil(requests.length / PAGE_SIZE));
  const paginated   = useMemo(() => requests.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), [requests, page]);
  const selected    = requests.find(r => r.id === selectedId) || null;

  const handleCancel = async (id: string) => {
    setCancelling(id);
    try {
      await api.patch(`/absence-requests/${id}/cancel`, {});
      setRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'CANCELLED' } : r));
    } catch (e: any) {
      alert(e?.message || "Erreur lors de l'annulation");
    } finally {
      setCancelling(null);
    }
  };

  const printData = selected ? {
    reference: `DEA-${selected.id.slice(0, 8).toUpperCase()}`,
    company: {
      legalName: company?.legalName, tradeName: company?.tradeName, logo: company?.logo,
      rccmNumber: company?.rccmNumber, taxNumber: company?.taxNumber, address: company?.address, phone: company?.phone,
    },
    employee: {
      firstName: employee?.firstName || '', lastName: employee?.lastName || '',
      position: employee?.position, departmentName: employee?.department?.name,
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
    <div className="max-w-[1500px] mx-auto pb-24 space-y-6">
      <PresenceSubNav userRole={userRole} />

      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-bold tracking-[0.2em] text-gray-400 uppercase mb-1">Mon espace</p>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Mes demandes d&apos;absence</h1>
        </div>
        <Link href={bp('/presences/absences/nouveau')} className="px-4 py-2.5 bg-sky-500 hover:bg-sky-600 text-white rounded-xl font-bold text-sm flex items-center gap-2 shadow-lg shadow-sky-500/30">
          <Plus size={18} /> Nouvelle demande
        </Link>
      </div>

      {requests.length === 0 ? (
        <div className="text-center py-24 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700">
          <Calendar size={32} className="text-gray-300 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Aucune demande pour l&apos;instant</h3>
          <p className="text-gray-400 text-sm">Vos demandes d&apos;autorisation d&apos;absence apparaîtront ici.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* ── LISTE (MAÎTRE) ── */}
          <div className="lg:col-span-4 space-y-3">
            {paginated.map(r => {
              const tCfg = TYPE_CONFIG[r.type] ?? TYPE_CONFIG.EXCEPTIONNELLE;
              const sCfg = STATUS_CONFIG[r.status as Status] ?? STATUS_CONFIG.PENDING;
              const active = r.id === selectedId;
              return (
                <button
                  key={r.id}
                  onClick={() => setSelectedId(r.id)}
                  className={`w-full text-left p-4 rounded-2xl border transition-all ${
                    active ? 'border-sky-400 bg-sky-50 dark:bg-sky-900/20 shadow-sm' : 'border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-200'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold text-sm text-gray-900 dark:text-white">{tCfg.label}</p>
                    <span className={`w-2 h-2 rounded-full shrink-0 ${tCfg.dot}`} />
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-gray-400 mt-1">
                    <span className="font-mono">{new Date(r.startDate).toLocaleDateString('fr-FR')}</span>
                    <ArrowRight size={11} />
                    <span className="font-mono">{new Date(r.endDate).toLocaleDateString('fr-FR')}</span>
                  </div>
                  <span className={`inline-block mt-2 text-[10px] font-semibold px-2 py-0.5 rounded-md border ${sCfg.badge}`}>{sCfg.label}</span>
                </button>
              );
            })}

            {requests.length > PAGE_SIZE && (
              <div className="flex items-center justify-between pt-1">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-2 rounded-lg text-xs font-semibold border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 disabled:opacity-30"
                >
                  Précédent
                </button>
                <span className="text-xs text-gray-400">Page {page} / {totalPages} · {requests.length} demande{requests.length > 1 ? 's' : ''}</span>
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
              <div className="h-full min-h-[300px] flex items-center justify-center bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 text-gray-400 text-sm">
                Sélectionnez une demande dans la liste
              </div>
            ) : (
              <motion.div key={selected.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">{(TYPE_CONFIG[selected.type] ?? TYPE_CONFIG.EXCEPTIONNELLE).label}</h2>
                    <p className="text-sm text-gray-400">Demandée le {new Date(selected.requestedAt || selected.createdAt).toLocaleDateString('fr-FR')}</p>
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
                        <Paperclip size={14} /> Voir mon justificatif
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

                    {selected.status !== 'PENDING' && selected.reviewedAt && (
                      <p className="text-xs text-gray-400">
                        Traitée le {new Date(selected.reviewedAt).toLocaleDateString('fr-FR')}
                      </p>
                    )}

                    <div className="flex gap-2 pt-2">
                      {selected.status === 'APPROVED' && !selected.printAuthorized ? (
                        <div className="flex-1 py-2.5 border border-dashed border-gray-200 dark:border-gray-700 text-xs font-semibold rounded-xl text-gray-400 flex items-center justify-center gap-2">
                          <Lock size={14} /> Impression non autorisée par le RH
                        </div>
                      ) : (
                        <button
                          onClick={() => setTimeout(() => printAbsenceRequest(), 50)}
                          className="flex-1 py-2.5 border border-gray-200 dark:border-gray-700 text-sm font-semibold rounded-xl text-gray-600 dark:text-gray-300 flex items-center justify-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-700"
                        >
                          <Printer size={16} /> Imprimer
                        </button>
                      )}
                      {selected.status === 'PENDING' && (
                        <button
                          onClick={() => handleCancel(selected.id)}
                          disabled={cancelling === selected.id}
                          className="flex-1 py-2.5 border border-gray-200 dark:border-gray-600 hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-red-200 hover:text-red-600 text-gray-600 dark:text-gray-300 text-sm font-semibold rounded-xl flex items-center justify-center gap-2 disabled:opacity-40"
                        >
                          {cancelling === selected.id ? <Loader2 size={16} className="animate-spin" /> : <X size={16} />} Annuler
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Aperçu imprimable */}
                  <div className="bg-gray-100 dark:bg-gray-900 rounded-2xl p-3 overflow-hidden border border-gray-200 dark:border-gray-700">
                    <div className="scale-[0.42] origin-top-left -mb-[58%]" style={{ width: '238%' }}>
                      {printData && <AbsenceRequestPrintable data={printData as any} />}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}