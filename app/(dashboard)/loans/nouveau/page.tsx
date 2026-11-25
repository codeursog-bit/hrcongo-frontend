'use client';

// ============================================================================
// 📁 app/(dashboard)/loans/nouveau/page.tsx
// ============================================================================

import { useRequestDocumentTemplate } from '@/hooks/useRequestDocumentTemplate';
import { usesStandardData } from '@/lib/document-template';
import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Banknote, Package, HelpCircle, Wallet, Eye, Paperclip,
} from 'lucide-react';
import { RequestForm, RequestSummaryCard, RequestSuccessScreen } from '@/components/requests';
import { Button, Input, Select, Textarea, EmptyState } from '@/components/design-system/primitives';
import { useToast } from '@/components/design-system/feedback';
import '@/components/loans/loan-form.css';
import { api } from '@/services/api';
import { useBasePath } from '@/hooks/useBasePath';
import { useImageUpload } from '@/hooks/useImageUpload';
import FinanceSubNav from '@/components/FinanceSubNav';
import LoanRequestPrintable from '@/components/LoanRequestPrintable';
import { AdvanceRequestDocument, LoanRequestDocument } from '@/components/documents/RequestDocuments';
import DocumentPreviewModal from '@/components/loans/DocumentPreviewModal';
import { KonzaLoader } from '@/components/ui/KonzaLoader';

type ReqType = 'ARGENT' | 'MARCHANDISE' | 'AVANCE' | 'AUTRE';

const TYPE_OPTIONS: Array<{ value: ReqType; label: string; icon: any; hint: string }> = [
  { value: 'ARGENT',      label: 'Prêt en argent',   icon: Banknote,    hint: 'Remboursement mensuel sur plusieurs mois' },
  { value: 'MARCHANDISE', label: 'Prêt marchandise', icon: Package,     hint: 'Achat de marchandise à rembourser' },
  { value: 'AVANCE',      label: 'Avance sur salaire', icon: Wallet,    hint: 'Montant unique, déduit un mois donné' },
  { value: 'AUTRE',       label: 'Autre',            icon: HelpCircle,  hint: 'Cas particulier, à motiver' },
];

const FINANCE_ROLES = ['ADMIN', 'SUPER_ADMIN', 'HR_MANAGER'];

function nextMonthDefault() {
  const d = new Date();
  d.setMonth(d.getMonth() + 1);
  return { month: d.getMonth() + 1, year: d.getFullYear() };
}

export default function NouvellePretAvancePage() {
  const router = useRouter();
  const toast = useToast();
  const [step, setStep] = useState(0);
  const { bp } = useBasePath();

  const [userRole, setUserRole] = useState('');
  const [employee, setEmployee] = useState<any>(null);
  const [company, setCompany] = useState<any>(null);

  const [employeesList, setEmployeesList] = useState<any[]>([]);
  const [employeeSearch, setEmployeeSearch] = useState('');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [onBehalf, setOnBehalf] = useState(false);
  // Mode de remboursement, demandé uniquement quand un RH/Admin crée
  // directement pour un employé (le prêt part alors ACTIVE tout de suite,
  // sans passer par un circuit de validation où ce choix serait reposé).
  const [recoverViaPayroll, setRecoverViaPayroll] = useState(true);

  const [type, setType] = useState<ReqType>('ARGENT');
  const [amount, setAmount] = useState('');
  const [durationMonthsInput, setDurationMonthsInput] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [reason, setReason] = useState('');
  const deductDefault = nextMonthDefault();
  const [deductMonth, setDeductMonth] = useState(deductDefault.month);
  const [deductYear, setDeductYear] = useState(deductDefault.year);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ✅ Modèle STANDARD — champs propres au papier client, absents du modèle
  // par défaut : "Nature du prêt" (Social/Scolarité/...) et une pièce
  // jointe réelle (au lieu des cases "j'ai un devis" non vérifiables).
  // N'a de sens que pour un prêt (argent/marchandise/autre) — l'avance n'a
  // pas cette notion sur le papier.
  const isStandard = usesStandardData(company?.documentTemplate);
  const [nature, setNature] = useState('');
  const { uploadedUrl: attachmentUrl, uploading: uploadingAttachment, handleFileSelect: handleAttachmentSelect } = useImageUpload({ folder: 'loans' });

  // Dette déjà en cours de l'employé (autres prêts/avances non soldés), pour
  // que la personne qui remplit sache où elle en est avant même d'envoyer sa
  // demande. Chargée différemment selon le profil : un employé voit toujours
  // SA PROPRE dette via /loans/me + /loans/advances/me (accessible sans droit
  // finance) ; un RH/Admin qui sélectionne un AUTRE employé (onBehalf) passe
  // par /loans + /loans/advances (réservé finance) filtré côté client.
  const [myLoans, setMyLoans] = useState<any[]>([]);
  const [myAdvances, setMyAdvances] = useState<any[]>([]);
  const [othersLoans, setOthersLoans] = useState<any[]>([]);
  const [othersAdvances, setOthersAdvances] = useState<any[]>([]);
  const [isLoadingDebt, setIsLoadingDebt] = useState(false);

  const isFinance = FINANCE_ROLES.includes(userRole);
  const isAdvance = type === 'AVANCE';
  const requestTemplate = useRequestDocumentTemplate(isAdvance ? 'ADVANCE' : 'LOAN', company);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('user');
      if (stored) setUserRole(JSON.parse(stored).role || '');
    } catch {}
    (async () => {
      try { setEmployee(await api.get('/employees/me')); } catch {}
      try { const me: any = await api.get('/auth/me'); setCompany(me?.company ?? null); } catch {}
      // Ma propre dette (utile aussi bien pour l'employé que pour un RH/Admin
      // qui fait une demande "pour lui-même") — endpoints /me, pas besoin de droit finance.
      try { setMyLoans((await api.get('/loans/me')) || []); } catch {}
      try { setMyAdvances((await api.get('/loans/advances/me')) || []); } catch {}
    })();
  }, []);

  useEffect(() => {
    if (!onBehalf) return;
    (async () => {
      try { setEmployeesList((await api.get('/employees/simple')) || []); } catch {}
      // Liste complète (réservée finance) — filtrée côté client par employé
      // sélectionné pour afficher sa dette existante.
      setIsLoadingDebt(true);
      try { setOthersLoans((await api.get('/loans')) || []); } catch {}
      try { setOthersAdvances((await api.get('/loans/advances')) || []); } catch {}
      setIsLoadingDebt(false);
    })();
  }, [onBehalf]);

  const filteredEmployees = useMemo(() => {
    if (!employeeSearch.trim()) return employeesList.slice(0, 30);
    const q = employeeSearch.toLowerCase();
    return employeesList.filter(e => `${e.firstName} ${e.lastName}`.toLowerCase().includes(q)).slice(0, 30);
  }, [employeesList, employeeSearch]);

  const targetEmployee = onBehalf ? employeesList.find(e => e.id === selectedEmployeeId) : employee;

  // Dette actuellement en cours de l'employé ciblé — uniquement ce qui reste
  // réellement dû (remainingBalance), sur les prêts ACTIFS et avances
  // APPROUVÉES (une dette soldée ne compte plus pour rien).
  const existingDebt = useMemo(() => {
    if (onBehalf) {
      if (!selectedEmployeeId) return 0;
      return othersLoans.filter(l => l.employeeId === selectedEmployeeId && l.status === 'ACTIVE').reduce((s, l) => s + Number(l.remainingBalance), 0)
        + othersAdvances.filter(a => a.employeeId === selectedEmployeeId && a.status === 'APPROVED').reduce((s, a) => s + Number(a.remainingBalance ?? a.amount), 0);
    }
    return myLoans.filter(l => l.status === 'ACTIVE').reduce((s, l) => s + Number(l.remainingBalance), 0)
      + myAdvances.filter(a => a.status === 'APPROVED').reduce((s, a) => s + Number(a.remainingBalance ?? a.amount), 0);
  }, [onBehalf, selectedEmployeeId, othersLoans, othersAdvances, myLoans, myAdvances]);

  const hasKnownEmployee = onBehalf ? !!selectedEmployeeId : !!employee;
  const projectedTotal = existingDebt + (Number(amount) || 0);

  const durationMonths = durationMonthsInput ? Number(durationMonthsInput) : undefined;
  const monthlyRepayment = amount && durationMonths ? Math.ceil(Number(amount) / durationMonths) : undefined;
  const endDate = useMemo(() => {
    if (!durationMonths) return startDate;
    // ✅ Le champ date peut être momentanément vide/invalide pendant que
    // l'utilisateur efface la valeur par défaut pour taper la sienne —
    // new Date('') est une "Invalid Date" et .toISOString() plante dessus.
    // On attend une saisie valide avant de calculer la date de fin.
    const d = new Date(startDate);
    if (isNaN(d.getTime())) return '';
    d.setMonth(d.getMonth() + durationMonths);
    return d.toISOString().slice(0, 10);
  }, [startDate, durationMonths]);

  // Date de la demande d'une avance (réutilise `startDate`, vide/invalide → mois courant côté serveur)
  const requestDateObj = new Date(startDate);
  const requestDateValid = !!startDate && !isNaN(requestDateObj.getTime());

  const canSubmit = !!amount && Number(amount) > 0 && reason.trim().length >= 3
    && (isAdvance || (!!durationMonthsInput && Number(durationMonthsInput) > 0))
    && (!onBehalf || !!selectedEmployeeId) && !isSubmitting;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setIsSubmitting(true);
    setError(null);
    try {
      if (isAdvance) {
        await api.post('/loans/advances', {
          employeeId: onBehalf ? selectedEmployeeId : undefined,
          amount: Number(amount),
          deductMonth, deductYear,
          // Période de la demande (choisie par l'utilisateur) : date de
          // référence de l'avance dans le profil/relevé/suivi de l'employé.
          ...(requestDateValid && { month: requestDateObj.getMonth() + 1, year: requestDateObj.getFullYear() }),
          reason: reason.trim(),
          ...(isFinance && onBehalf && { recoverViaPayroll }),
        });
      } else {
        await api.post('/loans', {
          employeeId: onBehalf ? selectedEmployeeId : undefined,
          type,
          amount: Number(amount),
          monthlyRepayment: Number(monthlyRepayment),
          startDate,
          endDate,
          reason: reason.trim(),
          ...(isStandard && nature && { nature }),
          ...(isStandard && attachmentUrl && { attachmentUrl }),
          ...(isFinance && onBehalf && { recoverViaPayroll }),
        });
      }
      setIsDone(true);
      toast('success', 'Demande envoyée');
    } catch (e: any) {
      setError(e?.message || "Erreur lors de l'envoi de la demande");
    } finally {
      setIsSubmitting(false);
    }
  };

  const previewData = {
    reference: 'XX-XXXXXXXX',
    company: { legalName: company?.legalName, tradeName: company?.tradeName, logo: company?.logo, rccmNumber: company?.rccmNumber, taxNumber: company?.taxNumber, address: company?.address, phone: company?.phone },
    employee: { firstName: targetEmployee?.firstName || '', lastName: targetEmployee?.lastName || '', position: targetEmployee?.position, phone: targetEmployee?.phone, departmentName: targetEmployee?.department?.name },
    docType: type,
    reason: reason || 'Motif…',
    amount: amount || 0,
    requestedAt: startDate && !isNaN(new Date(startDate).getTime()) ? new Date(startDate) : new Date(),
    monthlyRepayment: monthlyRepayment || undefined,
    durationMonths,
    previousLoanAmount: hasKnownEmployee ? existingDebt : undefined,
    status: 'PENDING',
  };

  const standardPreviewData = {
    reference: 'XX-XXXXXXXX',
    company: { legalName: company?.legalName, tradeName: company?.tradeName, logo: company?.logo, address: company?.address, city: company?.city, country: company?.country, phone: company?.phone, email: company?.email, cachetUrl: company?.cachetUrl, documentFooterText: company?.documentFooterText },
    employee: { firstName: targetEmployee?.firstName || '', lastName: targetEmployee?.lastName || '', employeeNumber: targetEmployee?.employeeNumber, position: targetEmployee?.position, phone: targetEmployee?.phone },
    nature: nature || undefined,
    amount: amount || 0,
    durationMonths,
    recoverViaPayroll,
    reason: reason || '',
    attachmentUrl: attachmentUrl || undefined,
    requestedAt: startDate && !isNaN(new Date(startDate).getTime()) ? new Date(startDate) : new Date(),
  };

  const standardAdvancePreviewData = {
    reference: 'XX-XXXXXXXX',
    company: { legalName: company?.legalName, tradeName: company?.tradeName, logo: company?.logo, address: company?.address, city: company?.city, country: company?.country, phone: company?.phone, email: company?.email, cachetUrl: company?.cachetUrl, documentFooterText: company?.documentFooterText },
    employee: { firstName: targetEmployee?.firstName || '', lastName: targetEmployee?.lastName || '', employeeNumber: targetEmployee?.employeeNumber, position: targetEmployee?.position, phone: targetEmployee?.phone },
    amount: amount || 0,
    month: deductMonth,
    year: deductYear,
    recoverViaPayroll,
    reason: reason || '',
    requestedAt: startDate && !isNaN(new Date(startDate).getTime()) ? new Date(startDate) : new Date(),
    status: 'PENDING',
  };

  const entries = [
    { label: 'Bénéficiaire', value: targetEmployee ? [targetEmployee.firstName, targetEmployee.lastName].filter(Boolean).join(' ') : onBehalf ? 'Sélectionner un employé' : 'Moi-même' },
    { label: 'Type', value: TYPE_OPTIONS.find(option => option.value === type)?.label },
    { label: 'Montant demandé', value: amount ? Number(amount).toLocaleString('fr-FR') + ' FCFA' : undefined },
    ...(!isAdvance ? [
      { label: 'Durée', value: durationMonthsInput ? durationMonthsInput + ' mois' : undefined },
      { label: 'Date de départ', value: startDate || undefined },
    ] : [
      { label: 'Date de la demande', value: startDate || undefined },
      { label: 'Déduction', value: deductMonth + ' / ' + deductYear },
    ]),
    { label: 'Motif', value: reason || undefined },
    ...(isFinance && onBehalf ? [{ label: 'Remboursement', value: recoverViaPayroll ? 'Déduit sur la paie' : 'En espèces' }] : []),
    ...(isStandard && !isAdvance ? [{ label: 'Nature', value: nature || 'Non précisée' }, { label: 'Pièce jointe', value: attachmentUrl ? 'Jointe' : 'Non jointe' }] : []),
  ];
  const nextDisabled = step === 0 ? reason.trim().length < 3 || (onBehalf && !selectedEmployeeId)
    : step === 1 ? !amount || Number(amount) <= 0 || (!isAdvance && (!durationMonthsInput || Number(durationMonthsInput) <= 0)) : false;
  if (isDone) return <div className="loan-request loan-request-success"><RequestSuccessScreen confirmation={isFinance && onBehalf ? "La demande a suivi le traitement direct prévu pour votre rôle." : undefined} handler="Votre administration" next={isFinance && onBehalf ? 'La demande a été enregistrée pour l’employé sélectionné. Retrouvez son suivi dans le module Prêts et avances.' : 'Vous pourrez suivre la décision et les avis depuis Mon espace.'} onView={() => router.push(bp('/loans/mon-espace'))} onAnother={() => { setIsDone(false); setAmount(''); setDurationMonthsInput(''); setReason(''); setStep(0); }} /></div>;
  return <div className="loan-request"><RequestForm title="Nouvelle demande" description="Prêt en argent, marchandise ou avance sur salaire." navigation={<FinanceSubNav userRole={userRole} />} noValidate step={step} onStepChange={setStep} onNext={() => setStep(value => Math.min(3, value + 1))} onSubmit={handleSubmit} onCancel={() => router.push(bp('/loans'))} submitting={isSubmitting} submitDisabled={!canSubmit} nextDisabled={nextDisabled} error={error || undefined}
    summary={<RequestSummaryCard entries={entries}>{hasKnownEmployee && <div className="loan-request-note" style={{ marginTop:24 }}><p>{onBehalf ? 'Dette actuelle de cet employé' : 'Ma dette actuelle'}</p>{isLoadingDebt && onBehalf ? <KonzaLoader variant="inline" /> : existingDebt > 0 ? <p><strong>{existingDebt.toLocaleString('fr-FR')} FCFA</strong> déjà dus (prêts/avances en cours)</p> : <p>Aucune dette en cours</p>}</div>}</RequestSummaryCard>}>
    <div className="loan-request-fields">
    {step === 0 && <>
      <h2>Quel est votre besoin ?</h2>
      {isFinance && <div className="loan-request-fields"><div className="k-row"><span>Pour qui ?</span><Button variant="secondary" aria-pressed={onBehalf} onClick={() => { setOnBehalf(!onBehalf); setSelectedEmployeeId(''); }}>{onBehalf ? 'Pour un employé' : 'Pour moi-même'}</Button></div>{onBehalf && <><Input label="Rechercher un employé" value={employeeSearch} onChange={e => setEmployeeSearch(e.target.value)} placeholder="Nom ou prénom" /><div className="loan-request-employee-list">{filteredEmployees.length ? filteredEmployees.map(e => <button type="button" key={e.id} className="loan-request-choice" aria-pressed={selectedEmployeeId === e.id} onClick={() => setSelectedEmployeeId(e.id)}>{e.firstName} {e.lastName}</button>) : <EmptyState title="Aucun employé ne correspond à cette recherche">Essayez un autre nom ou attendez le chargement de la liste.</EmptyState>}</div></>}{onBehalf && selectedEmployeeId && <><p className="k-help">Comment sera-t-il remboursé ?</p><div className="loan-request-grid"><button type="button" className="loan-request-choice" aria-pressed={recoverViaPayroll} onClick={() => setRecoverViaPayroll(true)}><span><strong>Déduit sur la paie</strong><small>La paie retire automatiquement chaque mois.</small></span></button><button type="button" className="loan-request-choice" aria-pressed={!recoverViaPayroll} onClick={() => setRecoverViaPayroll(false)}><span><strong>En espèces</strong><small>La paie ne touche pas à ce prêt.</small></span></button></div>{recoverViaPayroll && <p className="k-help">S’il reste un solde après la paie, un remboursement en espèces restera possible en complément.</p>}</>}</div>}
      <div className="loan-request-types" role="group" aria-label="Type de demande">{TYPE_OPTIONS.map(opt => { const Icon = opt.icon; return <button type="button" key={opt.value} className="loan-request-choice" aria-pressed={type === opt.value} onClick={() => setType(opt.value)}><Icon size={20} strokeWidth={1.5} aria-hidden="true" /><span><strong>{opt.label}</strong><small>{opt.hint}</small></span></button>; })}</div>
      <Textarea label="Motif" hint="Précisez votre besoin en au moins 3 caractères." value={reason} onChange={e => setReason(e.target.value)} rows={3} />
    </>}
    {step === 1 && <>
      <h2>Quel montant, à quelle date ?</h2>
      <Input label="Montant demandé (FCFA)" type="number" min="1" value={amount} onChange={e => setAmount(e.target.value)} />
      {hasKnownEmployee && Number(amount) > 0 && existingDebt > 0 && <p className="loan-request-note">+ {existingDebt.toLocaleString('fr-FR')} FCFA déjà dus = <strong>{projectedTotal.toLocaleString('fr-FR')} FCFA</strong> au total après cette demande</p>}
      {!isAdvance ? <><div className="loan-request-grid"><Input label="Durée (en mois)" type="number" min="1" value={durationMonthsInput} onChange={e => setDurationMonthsInput(e.target.value)} /><Input label="Date de départ" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} /></div>{monthlyRepayment && <p className="loan-request-estimate">Mensualité estimée : {monthlyRepayment.toLocaleString('fr-FR')} FCFA/mois {endDate && '(jusqu’au ' + new Date(endDate).toLocaleDateString('fr-FR') + ')'}</p>}</> : <><Input label="Date de la demande" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} hint="L’avance apparaît dans le profil et le relevé de l’employé à partir de ce mois." /><div className="loan-request-grid"><Select label="Mois de déduction" value={deductMonth} onChange={e => setDeductMonth(Number(e.target.value))}>{['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'].map((n,i) => <option key={n} value={i+1}>{n}</option>)}</Select><Input label="Année" type="number" value={deductYear} onChange={e => setDeductYear(Number(e.target.value))} /></div></>}
    </>}
    {step === 2 && <>
      <h2>Les détails de votre demande</h2>
      {isStandard && !isAdvance ? <><Select label="Nature du prêt" value={nature} onChange={e => setNature(e.target.value)}><option value="">— Non précisé —</option><option value="SOCIAL">Prêt social</option><option value="SCOLARITE">Prêt scolarité</option><option value="LOGEMENT">Prêt logement</option><option value="EXCEPTIONNEL">Prêt exceptionnel</option><option value="AUTRE">Autre</option></Select><p className="k-help">Pièce jointe (devis, justificatif de scolarité, certificat médical…)</p><label className="loan-request-upload"><Paperclip size={18} strokeWidth={1.5} />{uploadingAttachment ? 'Envoi en cours…' : attachmentUrl ? 'Pièce jointe ✓' : 'Joindre un document'}<input type="file" accept="image/*,.pdf" className="sr-only" onChange={e => e.target.files?.[0] && handleAttachmentSelect(e.target.files[0])} /></label></> : <p className="loan-request-note">Aucune pièce complémentaire n’est demandée dans ce formulaire. Vous pouvez passer à la relecture.</p>}
    </>}
    {step === 3 && <>
      <h2>Relisez avant d’envoyer</h2>
      <dl className="loan-request-check">{entries.map(entry => <div key={entry.label}><dt>{entry.label}</dt><dd>{entry.value ?? 'Non renseigné'}</dd></div>)}</dl>
      {!isAdvance && monthlyRepayment && <p className="loan-request-estimate">Mensualité estimée : {monthlyRepayment.toLocaleString('fr-FR')} FCFA/mois.</p>}
      <Button variant="secondary" onClick={() => setShowPreviewModal(true)}><Eye size={18} strokeWidth={1.5} /> Aperçu de la fiche</Button>
      <p className="k-help">{isFinance && onBehalf ? 'Cette création pour un employé suit le traitement direct déjà prévu pour votre rôle.' : 'Votre administration recevra cette demande pour validation.'}</p>
    </>}
    </div>
  </RequestForm>
      <DocumentPreviewModal open={showPreviewModal} onClose={() => setShowPreviewModal(false)}>
        {usesStandardData(requestTemplate) ? (
          isAdvance
            ? <AdvanceRequestDocument template={requestTemplate} id="preview-loan" data={standardAdvancePreviewData as any} />
            : <LoanRequestDocument template={requestTemplate} id="preview-loan" data={standardPreviewData as any} />
        ) : (
          <LoanRequestPrintable id="preview-loan" data={previewData as any} />
        )}
      </DocumentPreviewModal>
  </div>;
}
