'use client';

// ============================================================================
// 📁 app/(dashboard)/conges/[id]/page.tsx
// ✅ Page de détail d'une demande de congé (nouvelle — n'existait pas avant).
//    Accessible depuis un lien "Voir détail" ajouté sur /conges et
//    /conges/mon-espace (patch, voir INTEGRATION.md). Ne remplace PAS la
//    liste/grille existante — vient en complément.
// ============================================================================

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Loader2, ArrowLeft, Check, X, Clock, CheckCircle2, XCircle, Ban,
  Calendar, ArrowRight, Printer, Download, Wallet, Info, FileText, ScrollText, Lock, Unlock, FileDown,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { api } from '@/services/api';
import { useBasePath } from '@/hooks/useBasePath';
import CongeSubNav from '@/components/CongeSubNav';
import LeaveRequestFormPrintable from '@/components/LeaveRequestFormPrintable';
import LeaveAuthorizationLetterPrintable from '@/components/LeaveAuthorizationLetterPrintable';
import { printLeaveDocument, downloadLeaveDocumentPDF } from '@/lib/leave-print';
import { PrintAuthorizationModal } from '@/components/documents/PrintAuthorizationModal';
import OrcaLeaveAbsenceDocument from '@/components/documents/orca/OrcaLeaveAbsenceDocument';

type Status = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';

const STATUS_CONFIG: Record<Status, { label: string; badge: string; icon: any }> = {
  PENDING:   { label: 'En attente', badge: 'bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800', icon: Clock },
  APPROVED:  { label: 'Approuvé',   badge: 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-800', icon: CheckCircle2 },
  REJECTED:  { label: 'Refusé',     badge: 'bg-red-50 text-red-700 border-red-100 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800', icon: XCircle },
  CANCELLED: { label: 'Annulé',     badge: 'bg-gray-50 text-gray-500 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700', icon: Ban },
};

// ✅ Pour l'instant seuls RH/Admin valident — pas de délégation "chef de service"
const APPROVER_ROLES = ['ADMIN', 'SUPER_ADMIN', 'HR_MANAGER'];

export default function LeaveDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { bp } = useBasePath();
  const id = params?.id as string;

  const [leave, setLeave] = useState<any>(null);
  const [docData, setDocData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userRole, setUserRole] = useState('');
  const [rejectMode, setRejectMode] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [extraDaysGranted, setExtraDaysGranted] = useState('');
  const [resumptionNote, setResumptionNote] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeDoc, setActiveDoc] = useState<'form' | 'letter'>('form');
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [showPrintAuthModal, setShowPrintAuthModal] = useState(false);
  const [isTogglingPrintAuth, setIsTogglingPrintAuth] = useState(false);
  const [isConfirmingReturn, setIsConfirmingReturn] = useState(false);

  const load = async () => {
    try {
      const data: any = await api.get(`/leaves/${id}`);
      setLeave(data);
      if (data.status === 'APPROVED') setActiveDoc('letter');
      try {
        setDocData(await api.get(`/leaves/${id}/document-data`));
      } catch (e) {
        console.error('Erreur chargement document-data', e);
      }
    } catch (e) {
      console.error('Erreur chargement du congé', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    try {
      const stored = localStorage.getItem('user');
      if (stored) setUserRole(JSON.parse(stored).role || '');
    } catch {}
    if (id) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const canApprove = APPROVER_ROLES.includes(userRole);

  const handleDecision = async (status: 'APPROVED' | 'REJECTED') => {
    if (!leave) return;
    if (status === 'REJECTED' && !rejectionReason.trim()) { setRejectMode(true); return; }

    setIsProcessing(true);
    try {
      await api.patch(`/leaves/${leave.id}/status`, {
        status,
        rejectionReason: status === 'REJECTED' ? rejectionReason : undefined,
        extraDaysGranted: status === 'APPROVED' && extraDaysGranted ? Number(extraDaysGranted) : undefined,
        resumptionNote: status === 'APPROVED' && resumptionNote ? resumptionNote : undefined,
      });
      await load();
      setRejectMode(false);
      setRejectionReason('');
    } catch (e: any) {
      alert(e?.message || 'Erreur lors de la mise à jour');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancel = async () => {
    if (!leave || !confirm('Annuler cette demande de congé ?')) return;
    setIsProcessing(true);
    try {
      await api.patch(`/leaves/${leave.id}/cancel`, {});
      await load();
    } catch (e: any) {
      alert(e?.message || "Erreur lors de l'annulation");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSetPrintAuthorization = async (authorized: boolean) => {
    if (!leave) return;
    setIsTogglingPrintAuth(true);
    try {
      await api.patch(`/leaves/${leave.id}/print-authorization`, { authorized });
      await load();
    } catch (e: any) {
      alert(e?.message || "Erreur lors de la mise à jour de l'autorisation d'impression");
    } finally {
      setIsTogglingPrintAuth(false);
    }
  };

  const handleConfirmReturn = async () => {
    if (!leave) return;
    setIsConfirmingReturn(true);
    try {
      await api.patch(`/leaves/${leave.id}/confirm-return`, {});
      await load();
    } catch (e: any) {
      alert(e?.message || "Erreur lors de la confirmation du retour");
    } finally {
      setIsConfirmingReturn(false);
    }
  };

  if (isLoading) return <div className="flex justify-center py-24"><Loader2 className="animate-spin text-sky-500" size={40} /></div>;
  if (!leave) return <div className="text-center py-24 text-gray-400">Demande introuvable.</div>;

  const FORM_ID = 'leave-form-print-root';
  const LETTER_ID = 'leave-letter-print';
  const reference = `CGE-${leave.id.slice(0, 8).toUpperCase()}`;
  const isOrca = docData?.company?.documentTemplate === 'ORCA';

  const formData = {
    reference,
    company: leave.company || {},
    employee: { firstName: leave.employee?.firstName || '', lastName: leave.employee?.lastName || '', position: leave.employee?.position, departmentName: leave.employee?.department?.name },
    type: leave.type, reason: leave.reason, isPaid: leave.type !== 'UNPAID',
    startDate: leave.startDate, endDate: leave.endDate, daysCount: leave.daysCount,
    hasAttachment: !!leave.attachmentUrl, status: leave.status,
    requestedAt: leave.requestedAt || leave.createdAt,
    reviewedByName: leave.approvedByUser ? `${leave.approvedByUser.firstName} ${leave.approvedByUser.lastName}` : (leave.rejectedByUser ? `${leave.rejectedByUser.firstName} ${leave.rejectedByUser.lastName}` : undefined),
    reviewedAt: leave.approvedAt || leave.rejectedAt,
    rejectionReason: leave.rejectionReason,
  };

  const remainingDays = leave.balance ? Number(leave.balance.annualRemaining) : undefined;

  const letterData = {
    company: leave.company || {},
    employee: { firstName: leave.employee?.firstName || '', lastName: leave.employee?.lastName || '', position: leave.employee?.position, hireDate: leave.employee?.hireDate, gender: leave.employee?.gender },
    leaveYear: new Date(leave.startDate).getFullYear(),
    startDate: leave.startDate, endDate: leave.endDate, daysCount: leave.daysCount,
    remainingDays: remainingDays,
    extraDaysGranted: leave.extraDaysGranted,
    resumptionNote: leave.resumptionNote,
    signatoryName: leave.approvedByUser ? `${leave.approvedByUser.firstName} ${leave.approvedByUser.lastName}` : undefined,
    approvedAt: leave.approvedAt,
  };

  const activeId = activeDoc === 'form' ? FORM_ID : LETTER_ID;

  const renderFormDocument = (elementId: string) =>
    isOrca && docData ? (
      <OrcaLeaveAbsenceDocument
        id={elementId}
        variant="CONGE"
        reference={reference}
        employee={docData.employee}
        responsableName={docData.responsableName}
        type={docData.type}
        isPaid={leave.type !== 'UNPAID'}
        startDate={docData.startDate}
        endDate={docData.endDate}
        daysCount={docData.daysCount}
        reason={docData.reason}
        status={docData.status}
        company={docData.company}
      />
    ) : (
      <LeaveRequestFormPrintable data={formData as any} />
    );

  const handleDownloadPdf = async () => {
    setIsExportingPdf(true);
    try {
      await downloadLeaveDocumentPDF(activeId, `${activeDoc === 'form' ? 'demande' : 'lettre'}-conge-${reference}.pdf`);
    } finally {
      setIsExportingPdf(false);
    }
  };

  return (
    <div className="max-w-[1400px] mx-auto pb-24 space-y-6">
      <CongeSubNav userRole={userRole} />

      <div className="flex items-center gap-3">
        <button onClick={() => router.push(bp('/conges'))} className="p-2 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">
          <ArrowLeft size={18} />
        </button>
        <div>
          <p className="text-xs font-bold tracking-[0.2em] text-gray-400 uppercase mb-1">Demande de congé</p>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{leave.employee?.firstName} {leave.employee?.lastName}</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        <div className="xl:col-span-2 space-y-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">{leave.employee?.position}{leave.employee?.department ? ` · ${leave.employee.department.name}` : ''}</span>
              <span className={`text-xs font-semibold px-3 py-1.5 rounded-lg border shrink-0 ${(STATUS_CONFIG[leave.status as Status] ?? STATUS_CONFIG.PENDING).badge}`}>
                {(STATUS_CONFIG[leave.status as Status] ?? STATUS_CONFIG.PENDING).label}
              </span>
            </div>

            <div className="flex items-center gap-2 text-sm bg-gray-50 dark:bg-gray-700/50 px-3.5 py-2.5 rounded-xl">
              <Calendar size={14} className="text-gray-400" />
              <span className="font-mono text-xs">{new Date(leave.startDate).toLocaleDateString('fr-FR')}</span>
              <ArrowRight size={12} className="text-gray-300" />
              <span className="font-mono text-xs">{new Date(leave.endDate).toLocaleDateString('fr-FR')}</span>
              <span className="ml-auto font-bold text-xs text-gray-500">{Number(leave.daysCount)}j</span>
            </div>

            {leave.balance && (
              <div className="flex items-center gap-2 text-sm px-3.5 py-2.5 rounded-xl border border-gray-100 dark:border-gray-700">
                <Wallet size={14} className="text-gray-400" />
                Solde {new Date(leave.startDate).getFullYear()} : {Number(leave.balance.annualRemaining).toFixed(1)}j restants sur {Number(leave.balance.annualEntitled).toFixed(1)}j
                {Number(leave.balance.seniorityDays) > 0 && <span className="text-gray-400"> (dont {Number(leave.balance.seniorityDays)}j ancienneté)</span>}
              </div>
            )}

            {leave.reason && (
              <div className="text-sm">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Motif</p>
                <p className="text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700/40 p-3.5 rounded-xl">{leave.reason}</p>
              </div>
            )}

            {leave.status === 'REJECTED' && leave.rejectionReason && (
              <div className="text-sm flex items-start gap-2 text-red-600 bg-red-50 dark:bg-red-900/20 p-3.5 rounded-xl">
                <Info size={14} className="shrink-0 mt-0.5" /> {leave.rejectionReason}
              </div>
            )}

            {leave.status === 'PENDING' && canApprove && (
              <div className="pt-1 space-y-3 border-t border-gray-100 dark:border-gray-700">
                {!rejectMode ? (
                  <>
                    {leave.type === 'ANNUAL' && (
                      <div className="space-y-2 pt-3">
                        <div>
                          <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1 block">Jours supplémentaires (optionnel)</label>
                          <input type="number" min="0" step="0.5" value={extraDaysGranted} onChange={e => setExtraDaysGranted(e.target.value)} placeholder="Ex : 6 — laisser vide si non applicable" className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-900 text-sm" />
                        </div>
                        {extraDaysGranted && (
                          <div>
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1 block">Note sur la reprise (pour la lettre)</label>
                            <textarea value={resumptionNote} onChange={e => setResumptionNote(e.target.value)} rows={2} placeholder="Ex : seront récupérés après..." className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-900 text-sm resize-none" />
                          </div>
                        )}
                      </div>
                    )}
                    <div className="flex gap-2 pt-2">
                      <button onClick={() => handleDecision('APPROVED')} disabled={isProcessing} className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white text-sm font-bold rounded-xl flex items-center justify-center gap-2">
                        <Check size={16} /> Approuver
                      </button>
                      <button onClick={() => setRejectMode(true)} disabled={isProcessing} className="flex-1 py-3 border border-gray-200 dark:border-gray-600 hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-red-200 hover:text-red-600 text-gray-600 dark:text-gray-300 text-sm font-bold rounded-xl flex items-center justify-center gap-2">
                        <X size={16} /> Refuser
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="space-y-2 pt-3">
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

            {['PENDING', 'APPROVED'].includes(leave.status) && (
              <button onClick={handleCancel} disabled={isProcessing} className="w-full py-2.5 border border-gray-200 dark:border-gray-700 text-sm font-semibold rounded-xl text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40">
                Annuler cette demande
              </button>
            )}

            {leave.status === 'APPROVED' && canApprove && (
              <div className="pt-3 border-t border-gray-100 dark:border-gray-700">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-sm">
                    {leave.printAuthorized ? <Unlock size={14} className="text-emerald-500" /> : <Lock size={14} className="text-gray-400" />}
                    <span className="text-gray-600 dark:text-gray-300">
                      {leave.printAuthorized ? "Impression autorisée pour l'employé" : "Impression non autorisée"}
                    </span>
                  </div>
                  <button
                    onClick={() => setShowPrintAuthModal(true)}
                    disabled={isTogglingPrintAuth}
                    className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40"
                  >
                    {leave.printAuthorized ? 'Modifier' : 'Autoriser'}
                  </button>
                </div>
              </div>
            )}

            {leave.status === 'APPROVED' && canApprove && new Date(leave.endDate) < new Date() && (
              <div className="pt-3 border-t border-gray-100 dark:border-gray-700">
                {leave.returnConfirmed ? (
                  <div className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 size={14} /> Retour confirmé
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400">
                      <Clock size={14} /> Retour à confirmer
                    </div>
                    <button
                      onClick={handleConfirmReturn}
                      disabled={isConfirmingReturn}
                      className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 disabled:opacity-40 flex items-center gap-1.5"
                    >
                      {isConfirmingReturn ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />} Confirmer le retour
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Sélecteur de document */}
          <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
            <button onClick={() => setActiveDoc('form')} className={`flex-1 px-3 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${activeDoc === 'form' ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500'}`}>
              <FileText size={13} /> Formulaire
            </button>
            <button onClick={() => setActiveDoc('letter')} disabled={leave.status !== 'APPROVED'} className={`flex-1 px-3 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all disabled:opacity-40 disabled:cursor-not-allowed ${activeDoc === 'letter' ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500'}`}>
              <ScrollText size={13} /> Lettre d&apos;autorisation
            </button>
          </div>
          {leave.status !== 'APPROVED' && (
            <p className="text-[11px] text-gray-400 -mt-2 px-1">La lettre officielle n&apos;est disponible qu&apos;une fois la demande approuvée.</p>
          )}

          {(() => {
            // RH/Admin/Manager peuvent toujours imprimer (archivage, remise en main propre).
            // L'employé ne peut imprimer que si le RH l'a explicitement autorisé sur cette demande APPROUVÉE.
            const canPrint = canApprove || (leave.status === 'APPROVED' && !!leave.printAuthorized);
            return (
              <div className="flex gap-2">
                <button
                  onClick={() => canPrint && setTimeout(() => printLeaveDocument(activeId), 50)}
                  disabled={!canPrint}
                  title={!canPrint ? "Impression non autorisée par le RH" : undefined}
                  className="flex-1 py-2.5 border border-gray-200 dark:border-gray-700 text-sm font-semibold rounded-xl text-gray-600 dark:text-gray-300 flex items-center justify-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Printer size={16} /> Imprimer
                </button>
                <button
                  onClick={handleDownloadPdf}
                  disabled={isExportingPdf || !canPrint}
                  title={!canPrint ? "Impression non autorisée par le RH" : undefined}
                  className="flex-1 py-2.5 border border-gray-200 dark:border-gray-700 text-sm font-semibold rounded-xl text-gray-600 dark:text-gray-300 flex items-center justify-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {isExportingPdf ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />} PDF
                </button>
                {isOrca && (
                  <button
                    onClick={() => canPrint && window.open(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/leaves/${leave.id}/document.docx`, '_blank')}
                    disabled={!canPrint}
                    title={!canPrint ? "Impression non autorisée par le RH" : "Télécharger le fichier Word original rempli"}
                    className="flex-1 py-2.5 border border-sky-200 dark:border-sky-800 bg-sky-50 dark:bg-sky-900/20 text-sm font-semibold rounded-xl text-sky-700 dark:text-sky-300 flex items-center justify-center gap-2 hover:bg-sky-100 dark:hover:bg-sky-900/40 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <FileDown size={16} /> .docx
                  </button>
                )}
              </div>
            );
          })()}
        </div>

        {/* Aperçu */}
        <div className="xl:col-span-3">
          <div className="bg-gray-100 dark:bg-gray-900 rounded-2xl p-4 overflow-auto max-h-[85vh] border border-gray-200 dark:border-gray-700">
            <div className="scale-[0.62] origin-top -mb-[38%] shadow-2xl">
              {activeDoc === 'form'
                ? renderFormDocument(FORM_ID)
                : <LeaveAuthorizationLetterPrintable id={LETTER_ID} data={letterData as any} />}
            </div>
          </div>
        </div>
      </div>

      {/* Racine cachée pour le formulaire (id fixe requis par le composant) */}
      {activeDoc !== 'form' && (
        <div style={{ position: 'fixed', top: -99999, left: -99999 }}>
          {renderFormDocument(FORM_ID)}
        </div>
      )}

      <PrintAuthorizationModal
        isOpen={showPrintAuthModal}
        onClose={() => setShowPrintAuthModal(false)}
        onConfirm={handleSetPrintAuthorization}
        employeeName={`${leave.employee?.firstName || ''} ${leave.employee?.lastName || ''}`.trim()}
      />
    </div>
  );
}