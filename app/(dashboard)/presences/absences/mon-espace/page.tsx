'use client';
import { useRequestDocumentTemplate } from '@/hooks/useRequestDocumentTemplate';
import { DocumentReader } from '@/components/ui/DocumentReader';
import { RequestStatusTabs, RequestStatusBadge } from '@/components/requests';
import { requestStatus, type RequestGroup } from '@/lib/request-status';
import { AttendanceModuleFrame as ModulePageFrame } from '@/components/attendance/AttendanceModuleFrame';
import { ModulePageSkeleton } from '@/components/requests/ModulePageFrame';
import { Button } from '@/components/design-system/primitives';

// ============================================================================
// 📁 app/(dashboard)/presences/absences/mon-espace/page.tsx
// ✅ Espace employé — historique de mes demandes d'absence
// ✅ v2 : vue maître-détail (liste paginée + panneau de détail précis),
//    cohérente avec la page de gestion RH.
// ============================================================================

import { usesStandardData } from '@/lib/document-template';
import React, { useEffect, useMemo, useState } from 'react';
import { useDocSignatures } from '@/hooks/useDocSignatures';
import Link from 'next/link';
import {
  Plus, Loader2, Clock, CheckCircle2, XCircle, Ban,
  Calendar, ArrowRight, Printer, X, Paperclip, Info, Wallet,
  Stethoscope, FileText, Sparkles, Lock, Download,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { api } from '@/services/api';
import { useBasePath } from '@/hooks/useBasePath';
import AbsenceRequestPrintable from '@/components/AbsenceRequestPrintable';
import { AbsenceRequestDocument } from '@/components/documents/RequestDocuments';
import { printAbsenceRequest, downloadAbsenceRequestPDF } from '@/lib/absence-print';
import PresenceModuleSwitcher from '@/components/PresenceModuleSwitcher';
import AbsenceSubNav from '@/components/AbsenceSubNav';
import AbsenceCeilingBalance from '@/components/absences/AbsenceCeilingBalance';
import { KonzaLoader } from '@/components/ui/KonzaLoader';
import ContactAdminButton from '@/components/chat/ContactAdminButton';

type Status = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';

const STATUS_CONFIG: Record<Status, { label: string; badge: string; icon: any }> = {
  PENDING:   { label: 'En attente', badge: 'bg-[color-mix(in_srgb,var(--mustard)_14%,var(--surface))] text-[var(--warning-text)] border-[var(--border)]   ', icon: Clock },
  APPROVED:  { label: 'Approuvée',  badge: 'bg-[color-mix(in_srgb,var(--green)_12%,var(--surface))] text-[var(--success-text)] border-[var(--border)]   ', icon: CheckCircle2 },
  REJECTED:  { label: 'Refusée',    badge: 'bg-[color-mix(in_srgb,var(--danger)_10%,var(--surface))] text-[var(--danger-text)] border-[var(--border)]   ', icon: XCircle },
  CANCELLED: { label: 'Annulée',    badge: 'bg-[var(--surface-2)] text-[var(--text-muted)]', icon: Ban },
};

const TYPE_CONFIG: Record<string, { label: string; icon: any; dot: string }> = {
  MALADIE:         { label: 'Maladie',         icon: Stethoscope, dot: 'bg-[var(--danger)]' },
  CONVENTIONNELLE: { label: 'Conventionnelle', icon: FileText,    dot: 'bg-[var(--mustard)]' },
  EXCEPTIONNELLE:  { label: 'Exceptionnelle',  icon: Sparkles,    dot: 'bg-[var(--mustard)]' },
};

const PAGE_SIZE = 10;

export default function MonEspaceAbsencesPage() {
 const [uiStatus,setUiStatus]=useState<RequestGroup>('all');
 const [uiLoadError,setUiLoadError]=useState('');
  const { bp } = useBasePath();
  const [requests, setRequests] = useState<any[]>([]);
  const [employee, setEmployee] = useState<any>(null);
  const [company, setCompany]   = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState<string | null>(null);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
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
      console.error('Erreur chargement de mes demandes', e); setUiLoadError('Le chargement a échoué. Réessayez dans un instant.');
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

  const uiRequests=useMemo(()=>requests.filter(request=>uiStatus==='all'||requestStatus(request.status).group===uiStatus),[requests,uiStatus]);
  const totalPages = Math.max(1, Math.ceil(uiRequests.length / PAGE_SIZE));
  const paginated   = useMemo(() => uiRequests.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), [uiRequests, page]);
  const selected    = requests.find(r => r.id === selectedId) || null;
  // ✅ LOT D — signatures personnelles des avis, pour les documents imprimables
  const docSignatures = useDocSignatures('absence', selectedId);

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
      cachetUrl: company?.cachetUrl, documentFooterText: company?.documentFooterText,
    },
    employee: {
      firstName: employee?.firstName || '', lastName: employee?.lastName || '',
      position: employee?.position, departmentName: employee?.department?.name,
    },
    type: selected.type, subType: selected.subType, reason: selected.reason, isPaid: selected.isPaid,
    startDate: selected.startDate, endDate: selected.endDate, returnDate: selected.returnDate, workingDays: selected.workingDays,
    hasAttachment: !!selected.attachmentUrl, status: selected.status,
    requestedAt: selected.requestedAt || selected.createdAt,
    reviewedByName: selected.reviewedByUser?.email,
    reviewedAt: selected.reviewedAt,
    rejectionReason: selected.rejectionReason,
    signatures: docSignatures,
  } : null;

  const isStandard = usesStandardData(company?.documentTemplate);
  const requestTemplate = useRequestDocumentTemplate('ABSENCE', company);
  const standardDocument = usesStandardData(requestTemplate);
  const [motifCatalog, setMotifCatalog] = useState<any[]>([]);
  useEffect(() => {
    if (!standardDocument) return;
    (async () => { try { setMotifCatalog(await api.get('/absence-requests/motifs') || []); } catch {} })();
  }, [standardDocument]);

  const standardAbsenceData = selected && standardDocument ? {
    reference: `DEA-${selected.id.slice(0, 8).toUpperCase()}`,
    company: { legalName: company?.legalName, tradeName: company?.tradeName, logo: company?.logo, address: company?.address, city: company?.city, country: company?.country, phone: company?.phone, email: company?.email, cachetUrl: company?.cachetUrl, documentFooterText: company?.documentFooterText },
    employee: { firstName: employee?.firstName || '', lastName: employee?.lastName || '', employeeNumber: employee?.employeeNumber, position: employee?.position },
    catalog: motifCatalog,
    // Le motif choisi n'est pas stocké comme référence — on retrouve la
    // ligne cochée en comparant au texte enregistré (= libellé exact de la
    // convention au moment de la demande), même logique que le backend.
    motifKey: motifCatalog.find((m: any) => m.label === selected.reason)?.key,
    otherReason: requestTemplate === 'CUSTOM' && !motifCatalog.some(m => m.label === selected.reason) ? selected.reason : undefined,
    startDate: selected.startDate,
    endDate: selected.endDate,
    returnDate: selected.returnDate,
    workingDays: selected.workingDays,
    status: selected.status,
    requestedAt: selected.requestedAt || selected.createdAt,
    signatures: docSignatures,
  } : null;

  if (isLoading) {
    return <ModulePageSkeleton label="Chargement des absences" />;
  }

  return (
    <ModulePageFrame kind="list" error={uiLoadError}><div className="max-w-[1500px] mx-auto pb-24 space-y-6">
      <PresenceModuleSwitcher />
      <AbsenceSubNav userRole={userRole} />

      <div className="flex items-center justify-between attendance-page-header">
        <div className="attendance-page-heading">
          <p className="text-xs font-semibold tracking-[0.2em] text-[var(--text-muted)]  mb-1">Mon espace</p>
          <h1 className="text-2xl font-semibold text-[var(--text)]">Mes demandes d&apos;absence</h1>
        </div>
        <Link href={bp('/presences/absences/nouveau')} className="px-4 py-2.5 bg-[var(--brand)] hover:bg-[var(--brand)] text-[var(--on-brand)] rounded-xl font-semibold text-sm flex items-center gap-2 ">
          <Plus size={18} /> Nouvelle demande
        </Link>
      </div>

      {/* 🆕 Solde du plafond annuel (par année civile, sans cumul) */}
      {isStandard && <AbsenceCeilingBalance selectable className="max-w-xl" />}

      <RequestStatusTabs value={uiStatus} onChange={value=>{setUiStatus(value);setPage(1);setSelectedId(null);}} />
      {uiRequests.length === 0 ? (
        <div className="text-center py-24 bg-[var(--surface)] rounded-2xl border border-[var(--border)]">
          <Calendar size={32} className="text-[var(--text-muted)] mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-[var(--text)] mb-1">Aucune demande pour l&apos;instant</h3>
          <p className="text-[var(--text-muted)] text-sm">Vos demandes d&apos;autorisation d&apos;absence apparaîtront ici.</p>
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
                <Button variant="ghost"
                  key={r.id}
                  onClick={() => setSelectedId(r.id)}
                  className={`w-full text-left p-4 rounded-2xl border transition-colors ${
                    active ? 'border-[var(--border)] bg-[color-mix(in_srgb,var(--green)_12%,var(--surface))]  shadow-sm' : 'border-[var(--border)] bg-[var(--surface)] hover:border-[var(--text-muted)]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold text-sm text-[var(--text)]">{tCfg.label}</p>
                    <span className={`w-2 h-2 rounded-full shrink-0 ${tCfg.dot}`} />
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] mt-1">
                    <span className="font-mono">{new Date(r.startDate).toLocaleDateString('fr-FR')}</span>
                    <ArrowRight size={11} />
                    <span className="font-mono">{new Date(r.endDate).toLocaleDateString('fr-FR')}</span>
                  </div>
                  <RequestStatusBadge status={r.status} />
                </Button>
              );
            })}

            {uiRequests.length > PAGE_SIZE && (
              <div className="flex items-center justify-between pt-1">
                <Button variant="ghost"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-2 rounded-lg text-xs font-semibold border border-[var(--border)] text-[var(--text-muted)] disabled:opacity-30"
                >
                  Précédent
                </Button>
                <span className="text-xs text-[var(--text-muted)]">Page {page} / {totalPages} · {uiRequests.length} demande{uiRequests.length > 1 ? 's' : ''}</span>
                <Button variant="ghost"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-2 rounded-lg text-xs font-semibold border border-[var(--border)] text-[var(--text-muted)] disabled:opacity-30"
                >
                  Suivant
                </Button>
              </div>
            )}
          </div>

          {/* ── DÉTAIL ── */}
          <div className="lg:col-span-8">
            {!selected ? (
              <div className="h-full min-h-[300px] flex items-center justify-center bg-[var(--surface)] rounded-2xl border border-[var(--border)] text-[var(--text-muted)] text-sm">
                Sélectionnez une demande dans la liste
              </div>
            ) : (
              <motion.div key={selected.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] overflow-hidden">
                <div className="p-6 border-b border-[var(--border)] flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-semibold text-[var(--text)]">{(TYPE_CONFIG[selected.type] ?? TYPE_CONFIG.EXCEPTIONNELLE).label}</h2>
                    <p className="text-sm text-[var(--text-muted)]">Demandée le {new Date(selected.requestedAt || selected.createdAt).toLocaleDateString('fr-FR')}</p>
                  </div>
                  <span className={`text-xs font-semibold px-3 py-1.5 rounded-lg border shrink-0 ${(STATUS_CONFIG[selected.status as Status] ?? STATUS_CONFIG.PENDING).badge}`}>
                    {(STATUS_CONFIG[selected.status as Status] ?? STATUS_CONFIG.PENDING).label}
                  </span>
                </div>

                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-sm bg-[var(--surface-2)] px-3.5 py-2.5 rounded-xl">
                      <Calendar size={14} className="text-[var(--text-muted)]" />
                      <span className="font-mono text-xs">{new Date(selected.startDate).toLocaleDateString('fr-FR')}</span>
                      <ArrowRight size={12} className="text-[var(--text-muted)]" />
                      <span className="font-mono text-xs">{new Date(selected.endDate).toLocaleDateString('fr-FR')}</span>
                      <span className="ml-auto font-semibold text-xs text-[var(--text-muted)]">{Number(selected.workingDays)}j ouvrables</span>
                    </div>

                    {selected.returnDate && (
                      <p className="text-xs text-[var(--text-muted)] px-1">
                        Dernier jour d&apos;absence : <span className="font-semibold text-[var(--text)]">{new Date(selected.endDate).toLocaleDateString('fr-FR')}</span>
                        {' · '}Reprise le <span className="font-semibold text-[var(--text)]">{new Date(`${selected.returnDate}T12:00:00`).toLocaleDateString('fr-FR', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })}</span>
                      </p>
                    )}

                    <div className="flex items-center gap-2 text-sm px-3.5 py-2.5 rounded-xl border border-[var(--border)]">
                      <Wallet size={14} className="text-[var(--text-muted)]" />
                      {selected.subType === 'AUTRE' && selected.status === 'PENDING'
                        ? 'Motif « Autre » — paiement à définir par la RH'
                        : selected.subType === 'AUTRE'
                          ? (selected.isPaid ? 'Absence payée (décision RH)' : 'Absence non payée (décision RH)')
                          : selected.isPaid ? 'Absence payée demandée' : 'Absence non-payée demandée'}
                    </div>

                    {selected.attachmentUrl && (
                      <a href={selected.attachmentUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm px-3.5 py-2.5 rounded-xl border border-[var(--border)] text-[var(--success-text)] hover:underline">
                        <Paperclip size={14} /> Voir mon justificatif
                      </a>
                    )}

                    <div className="text-sm">
                      <p className="text-xs font-semibold text-[var(--text-muted)]   mb-1.5">Motif</p>
                      <p className="text-[var(--text-muted)] bg-[var(--surface-2)] p-3.5 rounded-xl">{selected.reason}</p>
                    </div>

                    {selected.status === 'REJECTED' && selected.rejectionReason && (
                      <div className="text-sm flex items-start gap-2 text-[var(--danger-text)] bg-[color-mix(in_srgb,var(--danger)_10%,var(--surface))]  p-3.5 rounded-xl">
                        <Info size={14} className="shrink-0 mt-0.5" /> {selected.rejectionReason}
                      </div>
                    )}

                    {selected.status !== 'PENDING' && selected.reviewedAt && (
                      <p className="text-xs text-[var(--text-muted)]">
                        Traitée le {new Date(selected.reviewedAt).toLocaleDateString('fr-FR')}
                      </p>
                    )}

                    {/* 💬 En attente / refusée : l'employé peut contacter l'administration pour s'expliquer */}
                    <ContactAdminButton
                      status={selected.status}
                      decidedByUserId={selected.reviewedBy}
                      requestLabel={`ma demande d'absence (${(TYPE_CONFIG[selected.type] ?? TYPE_CONFIG.EXCEPTIONNELLE).label.toLowerCase()}) du ${new Date(selected.startDate).toLocaleDateString('fr-FR')} au ${new Date(selected.endDate).toLocaleDateString('fr-FR')}`}
                    />

                    <div className="flex gap-2 pt-2">
                      {selected.status === 'APPROVED' && !selected.printAuthorized ? (
                        <div className="flex-1 py-2.5 border border-dashed border-[var(--border)] text-xs font-semibold rounded-xl text-[var(--text-muted)] flex items-center justify-center gap-2">
                          <Lock size={14} /> Impression non autorisée par le RH
                        </div>
                      ) : (
                        <>
                          <Button variant="ghost"
                            onClick={() => setTimeout(() => printAbsenceRequest(), 50)}
                            className="flex-1 py-2.5 border border-[var(--border)] text-sm font-semibold rounded-xl text-[var(--text-muted)] flex items-center justify-center gap-2 hover:bg-[var(--surface-2)]"
                          >
                            <Printer size={16} /> Imprimer
                          </Button>
                          <Button variant="ghost"
                            onClick={async () => {
                              setIsExportingPdf(true);
                              try { await downloadAbsenceRequestPDF(`absence-${selected.id.slice(0, 8)}.pdf`); }
                              finally { setIsExportingPdf(false); }
                            }}
                            disabled={isExportingPdf}
                            className="flex-1 py-2.5 border border-[var(--border)] text-sm font-semibold rounded-xl text-[var(--text-muted)] flex items-center justify-center gap-2 hover:bg-[var(--surface-2)] disabled:opacity-40"
                          >
                            {isExportingPdf ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />} PDF
                          </Button>
                        </>
                      )}
                      {selected.status === 'PENDING' && (
                        <Button variant="ghost"
                          onClick={() => handleCancel(selected.id)}
                          disabled={cancelling === selected.id}
                          className="flex-1 py-2.5 border border-[var(--border)] hover:bg-[color-mix(in_srgb,var(--danger)_10%,var(--surface))] dark:hover:bg-[color-mix(in_srgb,var(--danger)_10%,var(--surface))] hover:border-[var(--border)] hover:text-[var(--danger-text)] text-[var(--text-muted)] text-sm font-semibold rounded-xl flex items-center justify-center gap-2 disabled:opacity-40"
                        >
                          {cancelling === selected.id ? <Loader2 size={16} className="animate-spin" /> : <X size={16} />} Annuler
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Aperçu imprimable */}
                  <DocumentReader title="Demande d’absence">
                    <div className="loan-document-protected scale-[0.42] origin-top-left -mb-[58%]" style={{ width: '238%' }}>
                      {standardDocument ? (
                        standardAbsenceData && <AbsenceRequestDocument template={requestTemplate} data={standardAbsenceData as any} />
                      ) : (
                        printData && <AbsenceRequestPrintable data={printData as any} />
                      )}
                    </div>
                  </DocumentReader>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      )}
    </div></ModulePageFrame>
  );
}
