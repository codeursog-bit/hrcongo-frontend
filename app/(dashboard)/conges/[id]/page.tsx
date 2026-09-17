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
  Pencil, Trash2, AlertTriangle,
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
  CANCELLED: { label: 'Annulé',     badge: 'bg-[var(--surface-2)] text-[var(--text-muted)] border-[var(--border)]', icon: Ban },
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
  const [currentUserName, setCurrentUserName] = useState('');
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
  // ✅ Modifier / Supprimer — réservé RH/Admin (même rôles que canApprove),
  // pour un congé/planification quelle que soit son origine (demande
  // employé, admin depuis "Nouvelle demande", ou planification RH).
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({ type: 'ANNUAL' as 'ANNUAL' | 'ANNUAL_ANTICIPATED', startDate: '', endDate: '' });
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [editError, setEditError] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

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
      if (stored) {
        const u = JSON.parse(stored);
        setUserRole(u.role || '');
        // 🆕 CORRECTIF (demande explicite) : pour un congé sans approbateur
        // enregistré (migré, ou tout cas où approvedByUser est absent), la
        // lettre doit quand même porter un vrai nom — celui de l'admin/RH
        // actuellement connecté, qui est de fait celui qui gère/imprime ce
        // dossier aujourd'hui. Jamais un texte générique impersonnel.
        if (u.firstName || u.lastName) {
          setCurrentUserName(`${u.firstName ?? ''} ${u.lastName ?? ''}`.trim());
        }
      }
    } catch {}
    if (id) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // ✅ CORRECTIF (bug trouvé) : "jours restants" (base, 26j) et "jours
  // supplémentaires" (ancienneté) sont DEUX nombres distincts sur la
  // lettre — exactement comme le modèle Orca d'origine ("11 jours
  // restants, ainsi que les 6 jours de congé supplémentaires..."). Avant,
  // "extraDaysGranted" recevait tout le reliquat combiné (base + ancienneté
  // confondus), et la lettre affichait "remainingDays" depuis
  // leave.balance.annualRemaining — un solde courant sans rapport, jamais
  // la vraie base restante de CE congé précis. Les deux sont maintenant
  // calculés séparément : la base (26j) est consommée en premier, puis
  // l'ancienneté seulement si la demande dépasse 26j.
  const entitledSeniorityDays = leave?.balance ? Number(leave.balance.seniorityDays || 0) : 0;
  const plannedDays = leave ? Number(leave.daysCount) : 0;
  const baseRemaining = Math.max(0, 26 - plannedDays);
  const seniorityRemaining = Math.max(0, entitledSeniorityDays - Math.max(0, plannedDays - 26));
  // ✅ Un congé de rattrapage (carriedFromLeaveId) ne ferme jamais de cycle
  // et n'a jamais d'ancienneté/motif de report à saisir — ces notions ne
  // s'appliquent qu'au congé ANNUAL classique qui clôt le cycle.
  const isCarryover = !!leave?.carriedFromLeaveId;

  // ✅ CORRECTIF (demande explicite) : le motif de réduction est déjà saisi
  // à la CRÉATION de la demande (voir /conges/nouveau — popup obligatoire
  // si daysCount < solde dû) et stocké dans leave.reason. On ne doit
  // JAMAIS le redemander une 2e fois à l'approbation — on préremplit
  // resumptionNote avec ce texte (l'approbateur peut toujours l'affiner
  // avant validation, mais part du motif déjà donné par le RH/employé).
  useEffect(() => {
    if (!leave || leave.status !== 'PENDING' || leave.type !== 'ANNUAL' || isCarryover) return;
    if (seniorityRemaining > 0) {
      setExtraDaysGranted(String(Math.round(seniorityRemaining * 2) / 2));
    }
    if ((baseRemaining > 0 || seniorityRemaining > 0) && leave.reason?.trim()) {
      setResumptionNote(leave.reason.trim());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leave?.id]);

  const canApprove = APPROVER_ROLES.includes(userRole);

  const handleDecision = async (status: 'APPROVED' | 'REJECTED') => {
    if (!leave) return;
    if (status === 'REJECTED' && !rejectionReason.trim()) { setRejectMode(true); return; }
    if (status === 'APPROVED' && leave.type === 'ANNUAL' && !isCarryover && (baseRemaining > 0 || Number(extraDaysGranted) > 0) && !resumptionNote.trim()) {
      alert('Merci de préciser le motif de report (il apparaîtra sur la lettre officielle).');
      return;
    }

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

  // ✅ Modifier — dates/type EN PLACE, jamais de duplication (voir
  // updateLeavePlanning côté back) : la même ligne est mise à jour, le
  // solde n'est ajusté que sur l'écart.
  const openEditModal = () => {
    if (!leave) return;
    setEditError('');
    setEditForm({
      type: leave.type === 'ANNUAL_ANTICIPATED' ? 'ANNUAL_ANTICIPATED' : 'ANNUAL',
      startDate: new Date(leave.startDate).toISOString().slice(0, 10),
      endDate: new Date(leave.endDate).toISOString().slice(0, 10),
    });
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!leave) return;
    setIsSavingEdit(true);
    setEditError('');
    try {
      await api.patch(`/leaves/${leave.id}`, {
        type: editForm.type,
        startDate: editForm.startDate,
        endDate: editForm.endDate,
      });
      setShowEditModal(false);
      await load();
    } catch (e: any) {
      setEditError(e?.message || 'Erreur lors de la modification du congé');
    } finally {
      setIsSavingEdit(false);
    }
  };

  // ✅ Supprimer définitivement — restaure le solde puis retire la ligne
  // (voir deleteLeave côté back) ; distinct d'Annuler, qui garde une trace.
  const handleDelete = async () => {
    if (!leave) return;
    setIsDeleting(true);
    setDeleteError('');
    try {
      await api.delete(`/leaves/${leave.id}`);
      router.push(bp('/conges'));
    } catch (e: any) {
      setDeleteError(e?.message || 'Erreur lors de la suppression du congé');
      setIsDeleting(false);
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

  const [showEarlyReturnForm, setShowEarlyReturnForm] = useState(false);
  const [actualReturnDate, setActualReturnDate] = useState('');

  const handleConfirmReturn = async (earlyDate?: string) => {
    if (!leave) return;
    setIsConfirmingReturn(true);
    try {
      await api.patch(`/leaves/${leave.id}/confirm-return`, {
        actualReturnDate: earlyDate || undefined,
      });
      setShowEarlyReturnForm(false);
      await load();
    } catch (e: any) {
      alert(e?.message || "Erreur lors de la confirmation du retour");
    } finally {
      setIsConfirmingReturn(false);
    }
  };

  if (isLoading) return <div className="flex justify-center py-24"><Loader2 className="animate-spin text-emerald-500" size={40} /></div>;
  if (!leave) return <div className="text-center py-24 text-[var(--text-muted)]">Demande introuvable.</div>;

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
    reviewedByName: leave.approvedByUser
      ? `${leave.approvedByUser.firstName} ${leave.approvedByUser.lastName}`
      : (leave.rejectedByUser
          ? `${leave.rejectedByUser.firstName} ${leave.rejectedByUser.lastName}`
          : (currentUserName || undefined)),
    reviewedAt: leave.approvedAt || leave.rejectedAt,
    rejectionReason: leave.rejectionReason,
  };

  const letterData = {
    company: leave.company || {},
    employee: { firstName: leave.employee?.firstName || '', lastName: leave.employee?.lastName || '', position: leave.employee?.position, hireDate: leave.employee?.hireDate, gender: leave.employee?.gender },
    leaveYear: new Date(leave.startDate).getFullYear(),
    startDate: leave.startDate, endDate: leave.endDate, daysCount: leave.daysCount,
    // ✅ CORRECTIF : le paragraphe "jours restants... seront reportés" n'a
    // de sens que pour un congé ANNUAL — c'est lui qui déclenche le
    // paiement de l'indemnité, donc lui seul peut avoir une part
    // "reportée à plus tard, pour telle raison". Un congé ANNUAL_ANTICIPATED
    // ne déclenche JAMAIS de paiement à sa propre date (voir plannedPayrollMonth,
    // toujours null pour ce type) — l'employé prend juste une partie de son
    // solde par avance, le reste n'est ni "reporté" ni lié à un motif, il est
    // simplement toujours disponible dans le même cycle. Avant ce correctif,
    // remainingDays/extraDaysGranted étaient calculés sans distinction de
    // type — un congé anticipé partiel affichait donc à tort un paragraphe
    // de report, sans motif réel derrière (jamais demandé au RH pour ce cas).
    remainingDays: leave.type === 'ANNUAL' && baseRemaining > 0 ? baseRemaining : undefined,
    extraDaysGranted: leave.type === 'ANNUAL' ? leave.extraDaysGranted : undefined,
    resumptionNote: leave.type === 'ANNUAL' ? leave.resumptionNote : undefined,
    // ✅ CORRECTIF (demande explicite) : jours d'ancienneté déjà INCLUS
    // dans ce congé (pris maintenant, pas reportés) — distinct
    // d'extraDaysGranted qui lui concerne des jours reportés à plus tard.
    seniorityDaysIncluded:
      leave.type === 'ANNUAL' && plannedDays > 26
        ? Math.min(entitledSeniorityDays, plannedDays - 26)
        : undefined,
    // ✅ Congé anticipé : info neutre, jamais de motif — le solde déjà
    // déduit (leave.balance.annualRemaining) reste simplement disponible
    // pour un prochain congé dans le même cycle.
    availableBalanceAfter:
      leave.type === 'ANNUAL_ANTICIPATED' && leave.balance
        ? Number(leave.balance.annualRemaining)
        : undefined,
    signatoryName: leave.approvedByUser
      ? `${leave.approvedByUser.firstName} ${leave.approvedByUser.lastName}`
      : (currentUserName || undefined),
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
        <button onClick={() => router.push(bp('/conges'))} className="p-2 rounded-xl border border-[var(--border)] hover:bg-[var(--surface-2)]">
          <ArrowLeft size={18} />
        </button>
        <div>
          <p className="text-xs font-bold tracking-[0.2em] text-[var(--text-muted)] uppercase mb-1">Demande de congé</p>
          <h1 className="text-2xl font-bold text-[var(--text)]">{leave.employee?.firstName} {leave.employee?.lastName}</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        <div className="xl:col-span-2 space-y-4">
          <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] p-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-[var(--text-muted)]">{leave.employee?.position}{leave.employee?.department ? ` · ${leave.employee.department.name}` : ''}</span>
              <div className="flex items-center gap-2 shrink-0">
                {isCarryover && (
                  <span className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400">
                    Rattrapage — non payé
                  </span>
                )}
                <span className={`text-xs font-semibold px-3 py-1.5 rounded-lg border shrink-0 ${(STATUS_CONFIG[leave.status as Status] ?? STATUS_CONFIG.PENDING).badge}`}>
                  {(STATUS_CONFIG[leave.status as Status] ?? STATUS_CONFIG.PENDING).label}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 text-sm bg-[var(--surface-2)] px-3.5 py-2.5 rounded-xl">
              <Calendar size={14} className="text-[var(--text-muted)]" />
              <span className="font-mono text-xs">{new Date(leave.startDate).toLocaleDateString('fr-FR')}</span>
              <ArrowRight size={12} className="text-[var(--text-muted)]" />
              <span className="font-mono text-xs">{new Date(leave.endDate).toLocaleDateString('fr-FR')}</span>
              <span className="ml-auto font-bold text-xs text-[var(--text-muted)]">{Math.round(Number(leave.daysCount))}j</span>
            </div>

            {isCarryover ? (
              <div className="flex items-start gap-2 text-sm px-3.5 py-2.5 rounded-xl border border-emerald-100 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-900/10">
                <Info size={14} className="text-emerald-500 mt-0.5 shrink-0" />
                <span className="text-emerald-700 dark:text-emerald-300">
                  Repos de rattrapage — jours non pris suite au retour anticipé du congé
                  {leave.carriedFromLeave ? ` du ${new Date(leave.carriedFromLeave.startDate).toLocaleDateString('fr-FR')} au ${new Date(leave.carriedFromLeave.endDate).toLocaleDateString('fr-FR')}` : ''}
                  {leave.carriedFromLeave?.actualReturnDate ? ` (retour le ${new Date(leave.carriedFromLeave.actualReturnDate).toLocaleDateString('fr-FR')})` : ''}.
                  Jamais payé, sans impact sur le solde ni le cycle en cours.
                </span>
              </div>
            ) : leave.balance && (
              <div className="flex items-center gap-2 text-sm px-3.5 py-2.5 rounded-xl border border-[var(--border)]">
                <Wallet size={14} className="text-[var(--text-muted)]" />
                Solde {new Date(leave.startDate).getFullYear()} : {Math.round(Number(leave.balance.annualRemaining))}j restants sur {Math.round(Number(leave.balance.annualEntitled))}j
                {Number(leave.balance.seniorityDays) > 0 && <span className="text-[var(--text-muted)]"> (dont {Math.round(Number(leave.balance.seniorityDays))}j ancienneté)</span>}
              </div>
            )}

            {leave.reason && (
              <div className="text-sm">
                <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1.5">Motif</p>
                <p className="text-[var(--text-muted)] bg-[var(--surface-2)] p-3.5 rounded-xl">{leave.reason}</p>
              </div>
            )}

            {leave.status === 'REJECTED' && leave.rejectionReason && (
              <div className="text-sm flex items-start gap-2 text-red-600 bg-red-50 dark:bg-red-900/20 p-3.5 rounded-xl">
                <Info size={14} className="shrink-0 mt-0.5" /> {leave.rejectionReason}
              </div>
            )}

            {leave.status === 'PENDING' && canApprove && (
              <div className="pt-1 space-y-3 border-t border-[var(--border)]">
                {!rejectMode ? (
                  <>
                    {leave.type === 'ANNUAL' && !isCarryover && (
                      <div className="space-y-2 pt-3">
                        <div>
                          <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1 block">Jours d&apos;ancienneté reportés (optionnel)</label>
                          <input type="number" min="0" step="0.5" value={extraDaysGranted} onChange={e => setExtraDaysGranted(e.target.value)} placeholder="Ex : 6 — laisser vide si non applicable" className="w-full px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-sm" />
                          {(baseRemaining > 0 || seniorityRemaining > 0) && (
                            <p className="text-xs text-amber-600 mt-1">
                              Congé partiel détecté : {plannedDays}j planifiés — il restera {baseRemaining}j de congé de base
                              {seniorityRemaining > 0 ? ` et ${seniorityRemaining}j d'ancienneté (pré-rempli)` : ''} à reporter.
                            </p>
                          )}
                        </div>
                        {(baseRemaining > 0 || Number(extraDaysGranted) > 0) && (
                          <div>
                            <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1 block">Motif de report (pour la lettre) *</label>
                            {leave.reason?.trim() && resumptionNote === leave.reason.trim() && (
                              <p className="text-xs text-emerald-600 dark:text-emerald-400 mb-1">Repris du motif indiqué à la demande — modifiable si besoin.</p>
                            )}
                            <textarea value={resumptionNote} onChange={e => setResumptionNote(e.target.value)} rows={2} placeholder="Ex : seront récupérés après la période de forte activité du service..." className="w-full px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-sm resize-none" />
                          </div>
                        )}
                      </div>
                    )}
                    <div className="flex gap-2 pt-2">
                      <button onClick={() => handleDecision('APPROVED')} disabled={isProcessing} className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white text-sm font-bold rounded-xl flex items-center justify-center gap-2">
                        <Check size={16} /> Approuver
                      </button>
                      <button onClick={() => setRejectMode(true)} disabled={isProcessing} className="flex-1 py-3 border border-[var(--border)] hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-red-200 hover:text-red-600 text-[var(--text-muted)] text-sm font-bold rounded-xl flex items-center justify-center gap-2">
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
                      <button onClick={() => { setRejectMode(false); setRejectionReason(''); }} className="px-4 py-2.5 border border-[var(--border)] text-sm font-semibold rounded-xl text-[var(--text-muted)]">Annuler</button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {['PENDING', 'APPROVED'].includes(leave.status) && (
              <button onClick={handleCancel} disabled={isProcessing} className="w-full py-2.5 border border-[var(--border)] text-sm font-semibold rounded-xl text-[var(--text-muted)] hover:bg-[var(--surface-2)] disabled:opacity-40">
                Annuler cette demande
              </button>
            )}

            {/* ✅ Modifier / Supprimer — réservé RH/Admin, quelle que soit
                l'origine du congé (demande employé, admin, ou planification). */}
            {canApprove && (
              <div className="flex gap-2">
                {['PENDING', 'APPROVED'].includes(leave.status) && (
                  <button onClick={openEditModal} className="flex-1 py-2.5 border border-[var(--border)] text-sm font-semibold rounded-xl text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 flex items-center justify-center gap-2">
                    <Pencil size={14} /> Modifier
                  </button>
                )}
                <button onClick={() => { setDeleteError(''); setShowDeleteConfirm(true); }} className="flex-1 py-2.5 border border-[var(--border)] text-sm font-semibold rounded-xl text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center justify-center gap-2">
                  <Trash2 size={14} /> Supprimer
                </button>
              </div>
            )}

            {leave.status === 'APPROVED' && canApprove && (
              <div className="pt-3 border-t border-[var(--border)]">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-sm">
                    {leave.printAuthorized ? <Unlock size={14} className="text-emerald-500" /> : <Lock size={14} className="text-[var(--text-muted)]" />}
                    <span className="text-[var(--text-muted)]">
                      {leave.printAuthorized ? "Impression autorisée pour l'employé" : "Impression non autorisée"}
                    </span>
                  </div>
                  <button
                    onClick={() => setShowPrintAuthModal(true)}
                    disabled={isTogglingPrintAuth}
                    className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-[var(--border)] text-[var(--text-muted)] hover:bg-[var(--surface-2)] disabled:opacity-40"
                  >
                    {leave.printAuthorized ? 'Modifier' : 'Autoriser'}
                  </button>
                </div>
              </div>
            )}

            {leave.status === 'APPROVED' && canApprove && new Date(leave.startDate) <= new Date() && (
              <div className="pt-3 border-t border-[var(--border)]">
                {leave.returnConfirmed ? (
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 size={14} /> Retour confirmé
                      {leave.actualReturnDate && (
                        <span className="text-[var(--text-muted)] font-normal">
                          — le {new Date(leave.actualReturnDate).toLocaleDateString('fr-FR')}
                        </span>
                      )}
                    </div>
                    {Number(leave.forfeitedDays) > 0 && (
                      <div className="text-xs text-amber-600 dark:text-amber-400 pl-6">
                        Retour anticipé : {Number(leave.forfeitedDays)}j de ce congé n'ont pas été pris (non reversés au solde suivant)
                      </div>
                    )}
                  </div>
                ) : showEarlyReturnForm ? (
                  <div className="space-y-2">
                    <div className="text-sm text-[var(--text-muted)]">Date réelle de reprise du travail</div>
                    <div className="flex items-center gap-2">
                      <input
                        type="date"
                        value={actualReturnDate}
                        min={leave.startDate?.slice(0, 10)}
                        onChange={(e) => setActualReturnDate(e.target.value)}
                        className="text-sm px-2.5 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface-2)] text-[var(--text)]"
                      />
                      <button
                        onClick={() => actualReturnDate && handleConfirmReturn(actualReturnDate)}
                        disabled={isConfirmingReturn || !actualReturnDate}
                        className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 disabled:opacity-40 flex items-center gap-1.5"
                      >
                        {isConfirmingReturn ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />} Confirmer
                      </button>
                      <button
                        onClick={() => setShowEarlyReturnForm(false)}
                        className="text-xs px-2.5 py-1.5 rounded-lg text-[var(--text-muted)] hover:bg-[var(--surface-2)]"
                      >
                        Annuler
                      </button>
                    </div>
                    {new Date(leave.endDate) > new Date() && (
                      <div className="text-xs text-[var(--text-muted)]">
                        Si la date choisie est avant le {new Date(leave.endDate).toLocaleDateString('fr-FR')} (retour prévu), les jours restants seront comptés comme non pris.
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400">
                      <Clock size={14} /> Retour à confirmer
                    </div>
                    <div className="flex items-center gap-2">
                      {new Date(leave.endDate) > new Date() && (
                        <button
                          onClick={() => { setActualReturnDate(new Date().toISOString().slice(0, 10)); setShowEarlyReturnForm(true); }}
                          className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-[var(--border)] text-[var(--text-muted)] hover:bg-[var(--surface-2)]"
                        >
                          Retour anticipé
                        </button>
                      )}
                      <button
                        onClick={() => handleConfirmReturn()}
                        disabled={isConfirmingReturn}
                        className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 disabled:opacity-40 flex items-center gap-1.5"
                      >
                        {isConfirmingReturn ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />} Confirmer le retour
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Sélecteur de document */}
          <div className="flex gap-1 bg-[var(--surface-2)] p-1 rounded-xl">
            <button onClick={() => setActiveDoc('form')} className={`flex-1 px-3 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${activeDoc === 'form' ? 'bg-[var(--surface)] text-[var(--text)] shadow-sm' : 'text-[var(--text-muted)]'}`}>
              <FileText size={13} /> Formulaire
            </button>
            <button onClick={() => setActiveDoc('letter')} disabled={leave.status !== 'APPROVED'} className={`flex-1 px-3 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all disabled:opacity-40 disabled:cursor-not-allowed ${activeDoc === 'letter' ? 'bg-[var(--surface)] text-[var(--text)] shadow-sm' : 'text-[var(--text-muted)]'}`}>
              <ScrollText size={13} /> Lettre d&apos;autorisation
            </button>
          </div>
          {leave.status !== 'APPROVED' && (
            <p className="text-[11px] text-[var(--text-muted)] -mt-2 px-1">La lettre officielle n&apos;est disponible qu&apos;une fois la demande approuvée.</p>
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
                  className="flex-1 py-2.5 border border-[var(--border)] text-sm font-semibold rounded-xl text-[var(--text-muted)] flex items-center justify-center gap-2 hover:bg-[var(--surface-2)] disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Printer size={16} /> Imprimer
                </button>
                <button
                  onClick={handleDownloadPdf}
                  disabled={isExportingPdf || !canPrint}
                  title={!canPrint ? "Impression non autorisée par le RH" : undefined}
                  className="flex-1 py-2.5 border border-[var(--border)] text-sm font-semibold rounded-xl text-[var(--text-muted)] flex items-center justify-center gap-2 hover:bg-[var(--surface-2)] disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {isExportingPdf ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />} PDF
                </button>
                {isOrca && (
                  <button
                    onClick={() => canPrint && window.open(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/leaves/${leave.id}/document.docx`, '_blank')}
                    disabled={!canPrint}
                    title={!canPrint ? "Impression non autorisée par le RH" : "Télécharger le fichier Word original rempli"}
                    className="flex-1 py-2.5 border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20 text-sm font-semibold rounded-xl text-emerald-700 dark:text-emerald-300 flex items-center justify-center gap-2 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 disabled:opacity-40 disabled:cursor-not-allowed"
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
          <div className="bg-[var(--surface-2)] rounded-2xl p-4 overflow-auto max-h-[85vh] border border-[var(--border)]">
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

      {showEditModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--surface)] rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-[var(--text)]">Modifier ce congé</h2>
              <button onClick={() => setShowEditModal(false)} className="text-[var(--text-muted)] hover:text-[var(--text)]">
                <X size={20} />
              </button>
            </div>
            <p className="text-xs text-[var(--text-muted)]">
              {isCarryover
                ? "Modifie les dates de ce rattrapage — reste toujours non payé et sans impact sur le solde/cycle en cours, plafonné au reliquat disponible."
                : "Modifie directement cette demande — les dates/le type sont ajustés sur la même ligne, sans jamais en créer une nouvelle ni impacter le calendrier en double."}
            </p>
            <div className="space-y-3">
              {!isCarryover && (
                <div>
                  <label className="text-xs font-semibold text-[var(--text-muted)]">Type</label>
                  <select
                    value={editForm.type}
                    onChange={e => setEditForm(f => ({ ...f, type: e.target.value as any }))}
                    className="mt-1 w-full text-sm border border-[var(--border)] bg-[var(--surface)] rounded-lg px-3 py-2"
                  >
                    <option value="ANNUAL">Annuel</option>
                    <option value="ANNUAL_ANTICIPATED">Annuel anticipé</option>
                  </select>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-[var(--text-muted)]">Date de départ</label>
                  <input
                    type="date"
                    value={editForm.startDate}
                    onChange={e => setEditForm(f => ({ ...f, startDate: e.target.value }))}
                    className="mt-1 w-full text-sm border border-[var(--border)] bg-[var(--surface)] rounded-lg px-3 py-2"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[var(--text-muted)]">Date de retour</label>
                  <input
                    type="date"
                    value={editForm.endDate}
                    onChange={e => setEditForm(f => ({ ...f, endDate: e.target.value }))}
                    className="mt-1 w-full text-sm border border-[var(--border)] bg-[var(--surface)] rounded-lg px-3 py-2"
                  />
                </div>
              </div>
            </div>
            {editError && <div className="text-xs text-red-500">{editError}</div>}
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setShowEditModal(false)} className="px-4 py-2 text-sm font-semibold rounded-lg text-[var(--text-muted)] hover:bg-[var(--surface-2)]">
                Annuler
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={isSavingEdit}
                className="px-4 py-2 text-sm font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-2 disabled:opacity-40"
              >
                {isSavingEdit ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--surface)] rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900/30 text-red-600 flex items-center justify-center shrink-0">
                <AlertTriangle size={20} />
              </div>
              <h2 className="text-lg font-bold text-[var(--text)]">Supprimer ce congé ?</h2>
            </div>
            <p className="text-sm text-[var(--text-muted)]">
              Cette demande sera définitivement supprimée et le solde de congé restauré si elle avait déjà été approuvée. Cette action est irréversible.
            </p>
            {deleteError && <div className="text-xs text-red-500">{deleteError}</div>}
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setShowDeleteConfirm(false)} className="px-4 py-2 text-sm font-semibold rounded-lg text-[var(--text-muted)] hover:bg-[var(--surface-2)]">
                Annuler
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="px-4 py-2 text-sm font-bold rounded-lg bg-red-600 hover:bg-red-700 text-white flex items-center gap-2 disabled:opacity-40"
              >
                {isDeleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />} Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}