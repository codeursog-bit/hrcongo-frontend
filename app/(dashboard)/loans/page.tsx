'use client';

// ============================================================================
// 📁 app/(dashboard)/loans/page.tsx
// ✅ v2 — remplace l'ancienne page (création directe uniquement). Gestion
//    complète : Prêts (double validation DRH→DG), Avances (validation RH),
//    Retenues diverses (saisie directe), historique par employé.
// ✅ Réservé ADMIN/SUPER_ADMIN/HR_MANAGER — pas de MANAGER (ils ne gèrent
//    pas les fonds). Le composant lui-même ne fait qu'appliquer ce que le
//    backend impose déjà (403 sinon) ; ici on masque juste les actions non
//    autorisées pour ne pas proposer un bouton qui échouerait.
// ============================================================================

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Loader2, Search, Check, X, Clock, CheckCircle2, XCircle, Ban,
  Banknote, Wallet, Receipt, Plus, Printer, Download, Trash2, Pencil,
  ArrowRight, Info, ShieldCheck, Landmark, Lock, Unlock,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { api } from '@/services/api';
import { useBasePath } from '@/hooks/useBasePath';
import FinanceSubNav from '@/components/FinanceSubNav';
import LoanRequestPrintable from '@/components/LoanRequestPrintable';
import EmployeeLoanHistorySidebar, { EmployeeLoanHistoryData } from '@/components/EmployeeLoanHistorySidebar';
import { printLoanDocument, downloadLoanDocumentPDF } from '@/lib/loan-print';
import { PrintAuthorizationModal } from '@/components/documents/PrintAuthorizationModal';
import OrcaLoanDocument from '@/components/documents/orca/OrcaLoanDocument';
import OrcaAdvanceDocument from '@/components/documents/orca/OrcaAdvanceDocument';

const DRH_ROLES = ['ADMIN', 'SUPER_ADMIN', 'HR_MANAGER'];
const DG_ROLES  = ['ADMIN', 'SUPER_ADMIN'];
const FULL_ADMIN_ROLES = ['ADMIN', 'SUPER_ADMIN'];

const LOAN_STATUS_CFG: Record<string, { label: string; cls: string; icon: any }> = {
  PENDING:    { label: 'Attente DRH', cls: 'bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-900/20 dark:text-amber-300', icon: Clock },
  PENDING_DG: { label: 'Attente DG',  cls: 'bg-orange-50 text-orange-700 border-orange-100 dark:bg-orange-900/20 dark:text-orange-300', icon: Clock },
  ACTIVE:     { label: 'Actif',       cls: 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-300', icon: CheckCircle2 },
  PAID:       { label: 'Soldé',       cls: 'bg-sky-50 text-sky-700 border-sky-100 dark:bg-sky-900/20 dark:text-sky-300', icon: CheckCircle2 },
  REJECTED:   { label: 'Refusé',      cls: 'bg-red-50 text-red-700 border-red-100 dark:bg-red-900/20 dark:text-red-300', icon: XCircle },
  CANCELLED:  { label: 'Annulé',      cls: 'bg-gray-50 text-gray-500 border-gray-200 dark:bg-gray-800 dark:text-gray-400', icon: Ban },
};

const ADVANCE_STATUS_CFG: Record<string, { label: string; cls: string; icon: any }> = {
  PENDING:   { label: 'En attente', cls: 'bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-900/20 dark:text-amber-300', icon: Clock },
  APPROVED:  { label: 'Approuvée',  cls: 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-300', icon: CheckCircle2 },
  PAID:      { label: 'Payée (espèces)', cls: 'bg-sky-50 text-sky-700 border-sky-100 dark:bg-sky-900/20 dark:text-sky-300', icon: CheckCircle2 },
  DEDUCTED:  { label: 'Déduite',    cls: 'bg-sky-50 text-sky-700 border-sky-100 dark:bg-sky-900/20 dark:text-sky-300', icon: CheckCircle2 },
  REJECTED:  { label: 'Refusée',    cls: 'bg-red-50 text-red-700 border-red-100 dark:bg-red-900/20 dark:text-red-300', icon: XCircle },
  CANCELLED: { label: 'Annulée',    cls: 'bg-gray-50 text-gray-500 border-gray-200 dark:bg-gray-800 dark:text-gray-400', icon: Ban },
};

export default function LoansManagementPage() {
  const { bp } = useBasePath();
  const [userRole, setUserRole] = useState('');
  const [company, setCompany] = useState<any>(null);
  const [tab, setTab] = useState<'loans' | 'advances' | 'deductions'>('loans');

  const [loans, setLoans] = useState<any[]>([]);
  const [advances, setAdvances] = useState<any[]>([]);
  const [deductions, setDeductions] = useState<any[]>([]);
  const [employeesList, setEmployeesList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [selectedLoanId, setSelectedLoanId] = useState<string | null>(null);
  const [selectedAdvanceId, setSelectedAdvanceId] = useState<string | null>(null);
  const [rejectMode, setRejectMode] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [recoverViaPayroll, setRecoverViaPayroll] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [historyEmployee, setHistoryEmployee] = useState<EmployeeLoanHistoryData | null>(null);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [printAuthModal, setPrintAuthModal] = useState<'loan' | 'advance' | null>(null);
  const [isTogglingPrintAuth, setIsTogglingPrintAuth] = useState(false);
  const [docData, setDocData] = useState<any>(null);

  // Formulaire retenue diverse
  const [newDeduction, setNewDeduction] = useState({ employeeId: '', label: '', amount: '', month: new Date().getMonth() + 1, year: new Date().getFullYear() });
  const [isAddingDeduction, setIsAddingDeduction] = useState(false);

  const load = async () => {
    try {
      const [l, a, d, emps, me]: any = await Promise.all([
        api.get('/loans'),
        api.get('/loans/advances'),
        api.get('/company-deductions'),
        api.get('/employees/simple').catch(() => []),
        api.get('/auth/me').catch(() => null),
      ]);
      setLoans(l || []);
      setAdvances(a || []);
      setDeductions(d || []);
      setEmployeesList(emps || []);
      setCompany(me?.company ?? null);
      setSelectedLoanId((l || []).find((x: any) => x.status === 'PENDING' || x.status === 'PENDING_DG')?.id ?? l?.[0]?.id ?? null);
      setSelectedAdvanceId((a || []).find((x: any) => x.status === 'PENDING')?.id ?? a?.[0]?.id ?? null);
    } catch (e) {
      console.error('Erreur chargement prêts/avances', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    try {
      const stored = localStorage.getItem('user');
      if (stored) setUserRole(JSON.parse(stored).role || '');
    } catch {}
    load();
  }, []);

  const selectedLoan = loans.find(l => l.id === selectedLoanId) || null;
  const selectedAdvance = advances.find(a => a.id === selectedAdvanceId) || null;

  useEffect(() => {
    const id = tab === 'loans' ? selectedLoanId : selectedAdvanceId;
    if (!id) { setDocData(null); return; }
    (async () => {
      try {
        const path = tab === 'loans' ? `/loans/${id}/document-data` : `/loans/advances/${id}/document-data`;
        setDocData(await api.get(path));
      } catch (e) {
        console.error('Erreur chargement document-data', e);
        setDocData(null);
      }
    })();
  }, [tab, selectedLoanId, selectedAdvanceId]);

  const openEmployeeHistory = (emp: any) => {
    setHistoryEmployee({
      employee: { firstName: emp.firstName, lastName: emp.lastName, employeeNumber: emp.employeeNumber, department: emp.department?.name, photoUrl: emp.photoUrl },
      loans: loans.filter(l => l.employee?.employeeNumber === emp.employeeNumber && l.employee?.firstName === emp.firstName && l.employee?.lastName === emp.lastName),
      advances: advances.filter(a => a.employee?.employeeNumber === emp.employeeNumber && a.employee?.firstName === emp.firstName && a.employee?.lastName === emp.lastName),
    });
  };

  // ── Actions prêts ──────────────────────────────────────────────────────────

  const handleDrhDecision = async (decision: 'OUI' | 'NON') => {
    if (!selectedLoan) return;
    if (decision === 'NON' && !rejectionReason.trim()) { setRejectMode(true); return; }
    setIsProcessing(true);
    try {
      await api.patch(`/loans/${selectedLoan.id}/decision/drh`, { decision, rejectionReason: decision === 'NON' ? rejectionReason : undefined });
      await load();
      setRejectMode(false); setRejectionReason('');
    } catch (e: any) { alert(e?.message || 'Erreur'); } finally { setIsProcessing(false); }
  };

  const handleDgDecision = async (decision: 'OUI' | 'NON') => {
    if (!selectedLoan) return;
    if (decision === 'NON' && !rejectionReason.trim()) { setRejectMode(true); return; }
    setIsProcessing(true);
    try {
      await api.patch(`/loans/${selectedLoan.id}/decision/dg`, { decision, rejectionReason: decision === 'NON' ? rejectionReason : undefined, recoverViaPayroll });
      await load();
      setRejectMode(false); setRejectionReason('');
    } catch (e: any) { alert(e?.message || 'Erreur'); } finally { setIsProcessing(false); }
  };

  const handleDeleteLoan = async (id: string) => {
    if (!confirm('Supprimer ce prêt ?')) return;
    try { await api.delete(`/loans/${id}`); await load(); } catch (e: any) { alert(e?.message || 'Erreur'); }
  };

  const handleCancelLoan = async (id: string) => {
    if (!confirm('Annuler ce prêt ?')) return;
    try { await api.patch(`/loans/${id}/cancel`, {}); await load(); } catch (e: any) { alert(e?.message || 'Erreur'); }
  };

  const handleCashRepayment = async (loanId: string) => {
    const now = new Date();
    try {
      await api.post(`/loans/${loanId}/cash-repayment`, { month: now.getMonth() + 1, year: now.getFullYear() });
      await load();
    } catch (e: any) { alert(e?.message || 'Erreur'); }
  };

  // ── Actions avances ────────────────────────────────────────────────────────

  const handleAdvanceDecision = async (decision: 'APPROVED' | 'REJECTED') => {
    if (!selectedAdvance) return;
    if (decision === 'REJECTED' && !rejectionReason.trim()) { setRejectMode(true); return; }
    setIsProcessing(true);
    try {
      await api.patch(`/loans/advances/${selectedAdvance.id}/decision`, { decision, rejectionReason: decision === 'REJECTED' ? rejectionReason : undefined, recoverViaPayroll });
      await load();
      setRejectMode(false); setRejectionReason('');
    } catch (e: any) { alert(e?.message || 'Erreur'); } finally { setIsProcessing(false); }
  };

  const handleMarkAdvancePaidCash = async (id: string) => {
    try { await api.patch(`/loans/advances/${id}/mark-paid-cash`, {}); await load(); } catch (e: any) { alert(e?.message || 'Erreur'); }
  };

  const handleDeleteAdvance = async (id: string) => {
    if (!confirm('Supprimer cette avance ?')) return;
    try { await api.delete(`/loans/advances/${id}`); await load(); } catch (e: any) { alert(e?.message || 'Erreur'); }
  };

  // ── Autorisation d'impression ───────────────────────────────────────────────

  const handleSetPrintAuthorization = async (authorized: boolean) => {
    if (!printAuthModal) return;
    setIsTogglingPrintAuth(true);
    try {
      if (printAuthModal === 'loan' && selectedLoan) {
        await api.patch(`/loans/${selectedLoan.id}/print-authorization`, { authorized });
      } else if (printAuthModal === 'advance' && selectedAdvance) {
        await api.patch(`/loans/advances/${selectedAdvance.id}/print-authorization`, { authorized });
      }
      await load();
    } catch (e: any) {
      alert(e?.message || "Erreur lors de la mise à jour de l'autorisation d'impression");
    } finally {
      setIsTogglingPrintAuth(false);
    }
  };

  // ── Actions retenues ───────────────────────────────────────────────────────

  const handleAddDeduction = async () => {
    if (!newDeduction.employeeId || !newDeduction.label || !newDeduction.amount) return;
    setIsAddingDeduction(true);
    try {
      await api.post('/company-deductions', { ...newDeduction, amount: Number(newDeduction.amount) });
      setNewDeduction({ employeeId: '', label: '', amount: '', month: new Date().getMonth() + 1, year: new Date().getFullYear() });
      await load();
    } catch (e: any) { alert(e?.message || 'Erreur'); } finally { setIsAddingDeduction(false); }
  };

  const handleDeleteDeduction = async (id: string) => {
    if (!confirm('Supprimer cette retenue ?')) return;
    try { await api.delete(`/company-deductions/${id}`); await load(); } catch (e: any) { alert(e?.message || 'Erreur'); }
  };

  // ── Impression ─────────────────────────────────────────────────────────────

  const PRINT_ID = 'loan-doc-print';
  const printSource = tab === 'loans' ? selectedLoan : selectedAdvance;
  const printReference = printSource ? `${tab === 'loans' ? 'PR' : 'AV'}-${printSource.id.slice(0, 8).toUpperCase()}` : '';

  const printData = printSource ? {
    reference: printReference,
    company: { legalName: company?.legalName, tradeName: company?.tradeName, logo: company?.logo, rccmNumber: company?.rccmNumber, taxNumber: company?.taxNumber, address: company?.address, phone: company?.phone },
    employee: { firstName: printSource.employee?.firstName || '', lastName: printSource.employee?.lastName || '', position: printSource.employee?.position, departmentName: printSource.employee?.department?.name },
    docType: tab === 'loans' ? (selectedLoan?.type || 'ARGENT') : 'AVANCE',
    reason: printSource.reason,
    amount: printSource.amount,
    requestedAt: printSource.createdAt,
    monthlyRepayment: selectedLoan?.monthlyRepayment,
    durationMonths: selectedLoan ? Math.ceil(Number(selectedLoan.amount) / Number(selectedLoan.monthlyRepayment)) : undefined,
    status: printSource.status,
    drhDecision: selectedLoan?.drhDecision, dgDecision: selectedLoan?.dgDecision,
    chefDecision: tab === 'advances' ? (selectedAdvance?.status === 'APPROVED' || selectedAdvance?.status === 'DEDUCTED' || selectedAdvance?.status === 'PAID' ? 'OUI' : selectedAdvance?.status === 'REJECTED' ? 'NON' : null) : undefined,
  } : null;

  const handleDownloadPdf = async () => {
    setIsExportingPdf(true);
    try { await downloadLoanDocumentPDF(PRINT_ID, `${tab === 'loans' ? 'pret' : 'avance'}-${printReference}.pdf`); }
    finally { setIsExportingPdf(false); }
  };

  if (isLoading) return <div className="flex justify-center py-24"><Loader2 className="animate-spin text-sky-500" size={40} /></div>;

  return (
    <div className="max-w-[1600px] mx-auto pb-24 space-y-6">
      <FinanceSubNav userRole={userRole} />

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold tracking-[0.2em] text-gray-400 uppercase mb-1">Finances</p>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Prêts, avances & retenues</h1>
        </div>
        <Link href={bp('/loans/nouveau')} className="px-4 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-semibold text-sm flex items-center gap-2 shadow-lg shadow-sky-500/30 w-fit">
          <Plus size={18} /> Nouvelle demande
        </Link>
      </div>

      <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl w-fit">
        <button onClick={() => setTab('loans')} className={`px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-all ${tab === 'loans' ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500'}`}>
          <Banknote size={14} /> Prêts
          {loans.filter(l => ['PENDING', 'PENDING_DG'].includes(l.status)).length > 0 && <span className="bg-orange-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">{loans.filter(l => ['PENDING', 'PENDING_DG'].includes(l.status)).length}</span>}
        </button>
        <button onClick={() => setTab('advances')} className={`px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-all ${tab === 'advances' ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500'}`}>
          <Wallet size={14} /> Avances
          {advances.filter(a => a.status === 'PENDING').length > 0 && <span className="bg-orange-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">{advances.filter(a => a.status === 'PENDING').length}</span>}
        </button>
        <button onClick={() => setTab('deductions')} className={`px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-all ${tab === 'deductions' ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500'}`}>
          <Receipt size={14} /> Retenues diverses
        </button>
      </div>

      {/* ══════════════════ PRÊTS ══════════════════ */}
      {tab === 'loans' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-4 space-y-2 max-h-[75vh] overflow-y-auto pr-1">
            {loans.length === 0 ? (
              <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 text-sm text-gray-400">Aucun prêt.</div>
            ) : loans.map(l => {
              const cfg = LOAN_STATUS_CFG[l.status] ?? LOAN_STATUS_CFG.PENDING;
              const Icon = cfg.icon;
              const initials = `${l.employee?.firstName?.[0] ?? ''}${l.employee?.lastName?.[0] ?? ''}`;
              const active = l.id === selectedLoanId;
              return (
                <div key={l.id} onClick={() => { setSelectedLoanId(l.id); setRejectMode(false); setRejectionReason(''); }} className={`p-4 rounded-2xl border cursor-pointer flex gap-3 items-start transition-all ${active ? 'border-sky-400 bg-sky-50 dark:bg-sky-900/20' : 'border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-200'}`}>
                  <button onClick={(e) => { e.stopPropagation(); openEmployeeHistory(l.employee); }} className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-xs font-bold text-gray-500 overflow-hidden shrink-0 hover:ring-2 hover:ring-sky-400">
                    {l.employee?.photoUrl ? <img src={l.employee.photoUrl} className="w-full h-full object-cover" alt="" /> : initials}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-gray-900 dark:text-white truncate">{l.employee?.firstName} {l.employee?.lastName}</p>
                    <p className="text-xs text-gray-400">{Number(l.amount).toLocaleString('fr-FR')} FCFA · {l.type}</p>
                    <span className={`inline-flex items-center gap-1 mt-1.5 text-[10px] font-semibold px-2 py-0.5 rounded-md border ${cfg.cls}`}><Icon size={10} /> {cfg.label}</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="lg:col-span-8">
            {!selectedLoan ? (
              <div className="h-full min-h-[300px] flex items-center justify-center bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 text-gray-400 text-sm">Sélectionnez un prêt</div>
            ) : (
              <motion.div key={selectedLoan.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">{selectedLoan.employee?.firstName} {selectedLoan.employee?.lastName}</h2>
                    <p className="text-sm text-gray-400">{selectedLoan.employee?.position}{selectedLoan.employee?.department ? ` · ${selectedLoan.employee.department.name}` : ''}</p>
                  </div>
                  <span className={`text-xs font-semibold px-3 py-1.5 rounded-lg border shrink-0 flex items-center gap-1 ${(LOAN_STATUS_CFG[selectedLoan.status] ?? LOAN_STATUS_CFG.PENDING).cls}`}>
                    {(LOAN_STATUS_CFG[selectedLoan.status] ?? LOAN_STATUS_CFG.PENDING).label}
                  </span>
                </div>

                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-700/40"><p className="text-[11px] text-gray-400">Montant</p><p className="font-bold text-gray-900 dark:text-white">{Number(selectedLoan.amount).toLocaleString('fr-FR')} FCFA</p></div>
                      <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-700/40"><p className="text-[11px] text-gray-400">Mensualité</p><p className="font-bold text-gray-900 dark:text-white">{Number(selectedLoan.monthlyRepayment).toLocaleString('fr-FR')} FCFA</p></div>
                      <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-700/40"><p className="text-[11px] text-gray-400">Solde restant</p><p className="font-bold text-gray-900 dark:text-white">{Number(selectedLoan.remainingBalance).toLocaleString('fr-FR')} FCFA</p></div>
                      <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-700/40"><p className="text-[11px] text-gray-400">Type</p><p className="font-bold text-gray-900 dark:text-white">{selectedLoan.type}</p></div>
                    </div>

                    {selectedLoan.reason && <div className="text-sm"><p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Motif</p><p className="text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700/40 p-3 rounded-xl">{selectedLoan.reason}</p></div>}

                    {selectedLoan.status === 'REJECTED' && selectedLoan.rejectionReason && (
                      <div className="text-sm flex items-start gap-2 text-red-600 bg-red-50 dark:bg-red-900/20 p-3 rounded-xl"><Info size={14} className="shrink-0 mt-0.5" /> {selectedLoan.rejectionReason}</div>
                    )}

                    {/* Décision DRH */}
                    {selectedLoan.status === 'PENDING' && DRH_ROLES.includes(userRole) && (
                      <div className="space-y-2 pt-2 border-t border-gray-100 dark:border-gray-700">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5"><ShieldCheck size={12} /> Décision DRH</p>
                        {!rejectMode ? (
                          <div className="flex gap-2">
                            <button onClick={() => handleDrhDecision('OUI')} disabled={isProcessing} className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white text-sm font-bold rounded-xl flex items-center justify-center gap-2"><Check size={16} /> Valider (OUI)</button>
                            <button onClick={() => setRejectMode(true)} className="flex-1 py-2.5 border border-gray-200 dark:border-gray-600 hover:bg-red-50 hover:text-red-600 text-gray-600 dark:text-gray-300 text-sm font-bold rounded-xl flex items-center justify-center gap-2"><X size={16} /> Refuser</button>
                          </div>
                        ) : (
                          <RejectForm reason={rejectionReason} setReason={setRejectionReason} onConfirm={() => handleDrhDecision('NON')} onCancel={() => setRejectMode(false)} isProcessing={isProcessing} />
                        )}
                      </div>
                    )}

                    {/* Décision DG */}
                    {selectedLoan.status === 'PENDING_DG' && DG_ROLES.includes(userRole) && (
                      <div className="space-y-2 pt-2 border-t border-gray-100 dark:border-gray-700">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5"><Landmark size={12} /> Décision Direction Générale</p>
                        {!rejectMode ? (
                          <>
                            <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                              <input type="checkbox" checked={recoverViaPayroll} onChange={e => setRecoverViaPayroll(e.target.checked)} />
                              Récupérer automatiquement sur la paie
                            </label>
                            <div className="flex gap-2">
                              <button onClick={() => handleDgDecision('OUI')} disabled={isProcessing} className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white text-sm font-bold rounded-xl flex items-center justify-center gap-2"><Check size={16} /> Valider (OUI)</button>
                              <button onClick={() => setRejectMode(true)} className="flex-1 py-2.5 border border-gray-200 dark:border-gray-600 hover:bg-red-50 hover:text-red-600 text-gray-600 dark:text-gray-300 text-sm font-bold rounded-xl flex items-center justify-center gap-2"><X size={16} /> Refuser</button>
                            </div>
                          </>
                        ) : (
                          <RejectForm reason={rejectionReason} setReason={setRejectionReason} onConfirm={() => handleDgDecision('NON')} onCancel={() => setRejectMode(false)} isProcessing={isProcessing} />
                        )}
                      </div>
                    )}

                    {selectedLoan.status === 'ACTIVE' && DRH_ROLES.includes(userRole) && (
                      <button onClick={() => handleCashRepayment(selectedLoan.id)} className="w-full py-2.5 border border-gray-200 dark:border-gray-700 text-sm font-semibold rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">
                        Marquer le remboursement de ce mois comme payé en espèces
                      </button>
                    )}

                    {['ACTIVE', 'PAID'].includes(selectedLoan.status) && DRH_ROLES.includes(userRole) && (
                      <div className="pt-2 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 text-sm">
                          {selectedLoan.printAuthorized ? <Unlock size={14} className="text-emerald-500" /> : <Lock size={14} className="text-gray-400" />}
                          <span className="text-gray-600 dark:text-gray-300">
                            {selectedLoan.printAuthorized ? "Impression autorisée pour l'employé" : 'Impression non autorisée'}
                          </span>
                        </div>
                        <button
                          onClick={() => setPrintAuthModal('loan')}
                          disabled={isTogglingPrintAuth}
                          className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40"
                        >
                          {selectedLoan.printAuthorized ? 'Modifier' : 'Autoriser'}
                        </button>
                      </div>
                    )}

                    <div className="flex gap-2 pt-2">
                      {(FULL_ADMIN_ROLES.includes(userRole) ? true : selectedLoan.status === 'PENDING') && (
                        <button onClick={() => handleDeleteLoan(selectedLoan.id)} className="flex-1 py-2 border border-gray-200 dark:border-gray-700 text-xs font-semibold rounded-xl text-red-500 hover:bg-red-50 flex items-center justify-center gap-1.5"><Trash2 size={13} /> Supprimer</button>
                      )}
                      {['ACTIVE', 'PENDING_DG'].includes(selectedLoan.status) && DRH_ROLES.includes(userRole) && (
                        <button onClick={() => handleCancelLoan(selectedLoan.id)} className="flex-1 py-2 border border-gray-200 dark:border-gray-700 text-xs font-semibold rounded-xl text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700">Annuler</button>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <button onClick={() => setTimeout(() => printLoanDocument(PRINT_ID), 50)} className="flex-1 py-2.5 border border-gray-200 dark:border-gray-700 text-sm font-semibold rounded-xl text-gray-600 dark:text-gray-300 flex items-center justify-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-700"><Printer size={16} /> Imprimer</button>
                      <button onClick={handleDownloadPdf} disabled={isExportingPdf} className="flex-1 py-2.5 border border-gray-200 dark:border-gray-700 text-sm font-semibold rounded-xl text-gray-600 dark:text-gray-300 flex items-center justify-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40">{isExportingPdf ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />} PDF</button>
                    </div>
                  </div>

                  <div className="bg-gray-100 dark:bg-gray-900 rounded-2xl p-3 overflow-hidden border border-gray-200 dark:border-gray-700">
                    <div className="scale-[0.42] origin-top-left -mb-[58%]" style={{ width: '238%' }}>
                      {docData?.company?.documentTemplate === 'ORCA' ? (
                        <OrcaLoanDocument
                          id={PRINT_ID}
                          reference={printReference}
                          loanType={docData.loanType}
                          employee={docData.employee}
                          amount={docData.amount}
                          monthlyRepayment={docData.monthlyRepayment}
                          startDate={docData.startDate}
                          endDate={selectedLoan.endDate}
                          status={docData.status}
                          drhDecision={docData.drhDecision}
                          dgDecision={docData.dgDecision}
                          company={docData.company}
                        />
                      ) : (
                        printData && <LoanRequestPrintable id={PRINT_ID} data={printData as any} />
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════ AVANCES ══════════════════ */}
      {tab === 'advances' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-4 space-y-2 max-h-[75vh] overflow-y-auto pr-1">
            {advances.length === 0 ? (
              <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 text-sm text-gray-400">Aucune avance.</div>
            ) : advances.map(a => {
              const cfg = ADVANCE_STATUS_CFG[a.status] ?? ADVANCE_STATUS_CFG.PENDING;
              const Icon = cfg.icon;
              const initials = `${a.employee?.firstName?.[0] ?? ''}${a.employee?.lastName?.[0] ?? ''}`;
              const active = a.id === selectedAdvanceId;
              return (
                <div key={a.id} onClick={() => { setSelectedAdvanceId(a.id); setRejectMode(false); setRejectionReason(''); }} className={`p-4 rounded-2xl border cursor-pointer flex gap-3 items-start transition-all ${active ? 'border-sky-400 bg-sky-50 dark:bg-sky-900/20' : 'border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-200'}`}>
                  <button onClick={(e) => { e.stopPropagation(); openEmployeeHistory(a.employee); }} className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-xs font-bold text-gray-500 overflow-hidden shrink-0 hover:ring-2 hover:ring-sky-400">
                    {a.employee?.photoUrl ? <img src={a.employee.photoUrl} className="w-full h-full object-cover" alt="" /> : initials}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-gray-900 dark:text-white truncate">{a.employee?.firstName} {a.employee?.lastName}</p>
                    <p className="text-xs text-gray-400">{Number(a.amount).toLocaleString('fr-FR')} FCFA · déd. {a.deductMonth}/{a.deductYear}</p>
                    <span className={`inline-flex items-center gap-1 mt-1.5 text-[10px] font-semibold px-2 py-0.5 rounded-md border ${cfg.cls}`}><Icon size={10} /> {cfg.label}</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="lg:col-span-8">
            {!selectedAdvance ? (
              <div className="h-full min-h-[300px] flex items-center justify-center bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 text-gray-400 text-sm">Sélectionnez une avance</div>
            ) : (
              <motion.div key={selectedAdvance.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">{selectedAdvance.employee?.firstName} {selectedAdvance.employee?.lastName}</h2>
                    <p className="text-sm text-gray-400">{selectedAdvance.employee?.position}</p>
                  </div>
                  <span className={`text-xs font-semibold px-3 py-1.5 rounded-lg border shrink-0 ${(ADVANCE_STATUS_CFG[selectedAdvance.status] ?? ADVANCE_STATUS_CFG.PENDING).cls}`}>{(ADVANCE_STATUS_CFG[selectedAdvance.status] ?? ADVANCE_STATUS_CFG.PENDING).label}</span>
                </div>

                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-700/40"><p className="text-[11px] text-gray-400">Montant</p><p className="font-bold text-gray-900 dark:text-white">{Number(selectedAdvance.amount).toLocaleString('fr-FR')} FCFA</p></div>
                    <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-700/40"><p className="text-[11px] text-gray-400">Déduction prévue</p><p className="font-bold text-gray-900 dark:text-white">{selectedAdvance.deductMonth}/{selectedAdvance.deductYear}</p></div>
                    {selectedAdvance.reason && <div className="text-sm"><p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Motif</p><p className="text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700/40 p-3 rounded-xl">{selectedAdvance.reason}</p></div>}

                    {selectedAdvance.status === 'PENDING' && DRH_ROLES.includes(userRole) && (
                      <div className="space-y-2 pt-2 border-t border-gray-100 dark:border-gray-700">
                        {!rejectMode ? (
                          <>
                            <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                              <input type="checkbox" checked={recoverViaPayroll} onChange={e => setRecoverViaPayroll(e.target.checked)} />
                              Récupérer automatiquement sur la paie
                            </label>
                            <div className="flex gap-2">
                              <button onClick={() => handleAdvanceDecision('APPROVED')} disabled={isProcessing} className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white text-sm font-bold rounded-xl flex items-center justify-center gap-2"><Check size={16} /> Approuver</button>
                              <button onClick={() => setRejectMode(true)} className="flex-1 py-2.5 border border-gray-200 dark:border-gray-600 hover:bg-red-50 hover:text-red-600 text-gray-600 dark:text-gray-300 text-sm font-bold rounded-xl flex items-center justify-center gap-2"><X size={16} /> Refuser</button>
                            </div>
                          </>
                        ) : (
                          <RejectForm reason={rejectionReason} setReason={setRejectionReason} onConfirm={() => handleAdvanceDecision('REJECTED')} onCancel={() => setRejectMode(false)} isProcessing={isProcessing} />
                        )}
                      </div>
                    )}

                    {selectedAdvance.status === 'APPROVED' && DRH_ROLES.includes(userRole) && (
                      <button onClick={() => handleMarkAdvancePaidCash(selectedAdvance.id)} className="w-full py-2.5 border border-gray-200 dark:border-gray-700 text-sm font-semibold rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">
                        Marquer comme payée en espèces (ne sera pas déduite)
                      </button>
                    )}

                    {['APPROVED', 'PAID', 'DEDUCTED'].includes(selectedAdvance.status) && DRH_ROLES.includes(userRole) && (
                      <div className="pt-2 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 text-sm">
                          {selectedAdvance.printAuthorized ? <Unlock size={14} className="text-emerald-500" /> : <Lock size={14} className="text-gray-400" />}
                          <span className="text-gray-600 dark:text-gray-300">
                            {selectedAdvance.printAuthorized ? "Impression autorisée pour l'employé" : 'Impression non autorisée'}
                          </span>
                        </div>
                        <button
                          onClick={() => setPrintAuthModal('advance')}
                          disabled={isTogglingPrintAuth}
                          className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40"
                        >
                          {selectedAdvance.printAuthorized ? 'Modifier' : 'Autoriser'}
                        </button>
                      </div>
                    )}

                    {(FULL_ADMIN_ROLES.includes(userRole) ? true : selectedAdvance.status === 'PENDING') && (
                      <button onClick={() => handleDeleteAdvance(selectedAdvance.id)} className="w-full py-2 border border-gray-200 dark:border-gray-700 text-xs font-semibold rounded-xl text-red-500 hover:bg-red-50 flex items-center justify-center gap-1.5"><Trash2 size={13} /> Supprimer</button>
                    )}

                    <div className="flex gap-2">
                      <button onClick={() => setTimeout(() => printLoanDocument(PRINT_ID), 50)} className="flex-1 py-2.5 border border-gray-200 dark:border-gray-700 text-sm font-semibold rounded-xl text-gray-600 dark:text-gray-300 flex items-center justify-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-700"><Printer size={16} /> Imprimer</button>
                      <button onClick={handleDownloadPdf} disabled={isExportingPdf} className="flex-1 py-2.5 border border-gray-200 dark:border-gray-700 text-sm font-semibold rounded-xl text-gray-600 dark:text-gray-300 flex items-center justify-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40">{isExportingPdf ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />} PDF</button>
                    </div>
                  </div>

                  <div className="bg-gray-100 dark:bg-gray-900 rounded-2xl p-3 overflow-hidden border border-gray-200 dark:border-gray-700">
                    <div className="scale-[0.42] origin-top-left -mb-[58%]" style={{ width: '238%' }}>
                      {docData?.company?.documentTemplate === 'ORCA' ? (
                        <OrcaAdvanceDocument
                          id={PRINT_ID}
                          reference={printReference}
                          employee={docData.employee}
                          amount={docData.amount}
                          reason={selectedAdvance.reason}
                          requestDate={selectedAdvance.createdAt}
                          status={docData.status}
                          company={docData.company}
                        />
                      ) : (
                        printData && <LoanRequestPrintable id={PRINT_ID} data={printData as any} />
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════ RETENUES DIVERSES ══════════════════ */}
      {tab === 'deductions' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Nouvelle retenue</p>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
              <select value={newDeduction.employeeId} onChange={e => setNewDeduction({ ...newDeduction, employeeId: e.target.value })} className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-900 text-sm md:col-span-2">
                <option value="">Employé…</option>
                {employeesList.map(e => <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>)}
              </select>
              <input value={newDeduction.label} onChange={e => setNewDeduction({ ...newDeduction, label: e.target.value })} placeholder="Libellé (ex: Pharmacie)" className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-900 text-sm" />
              <input type="number" value={newDeduction.amount} onChange={e => setNewDeduction({ ...newDeduction, amount: e.target.value })} placeholder="Montant" className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-900 text-sm" />
              <button onClick={handleAddDeduction} disabled={isAddingDeduction} className="px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-1.5 disabled:opacity-50">
                {isAddingDeduction ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />} Ajouter
              </button>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>{['Employé', 'Libellé', 'Montant', 'Période', 'Statut', ''].map(h => <th key={h} className="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase">{h}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {deductions.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-10 text-gray-400">Aucune retenue.</td></tr>
                ) : deductions.map(d => (
                  <tr key={d.id}>
                    <td className="px-4 py-3">{d.employee?.firstName} {d.employee?.lastName}</td>
                    <td className="px-4 py-3">{d.label}</td>
                    <td className="px-4 py-3 font-semibold">{Number(d.amount).toLocaleString('fr-FR')} FCFA</td>
                    <td className="px-4 py-3 font-mono text-xs">{d.month}/{d.year}</td>
                    <td className="px-4 py-3"><span className="text-xs px-2 py-0.5 rounded-md border bg-gray-50 dark:bg-gray-700">{d.status}</span></td>
                    <td className="px-4 py-3 text-right">
                      {d.status === 'PENDING' && (
                        <button onClick={() => handleDeleteDeduction(d.id)} className="text-red-500 hover:underline text-xs font-semibold">Supprimer</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <EmployeeLoanHistorySidebar open={!!historyEmployee} onClose={() => setHistoryEmployee(null)} data={historyEmployee} />

      <PrintAuthorizationModal
        isOpen={!!printAuthModal}
        onClose={() => setPrintAuthModal(null)}
        onConfirm={handleSetPrintAuthorization}
        employeeName={
          printAuthModal === 'loan'
            ? `${selectedLoan?.employee?.firstName || ''} ${selectedLoan?.employee?.lastName || ''}`.trim()
            : `${selectedAdvance?.employee?.firstName || ''} ${selectedAdvance?.employee?.lastName || ''}`.trim()
        }
      />
    </div>
  );
}

function RejectForm({ reason, setReason, onConfirm, onCancel, isProcessing }: { reason: string; setReason: (v: string) => void; onConfirm: () => void; onCancel: () => void; isProcessing: boolean }) {
  return (
    <div className="space-y-2">
      <textarea value={reason} onChange={e => setReason(e.target.value)} placeholder="Motif du refus…" rows={2} className="w-full px-3 py-2.5 rounded-xl border border-red-200 dark:border-red-800 text-sm resize-none" autoFocus />
      <div className="flex gap-2">
        <button onClick={onConfirm} disabled={isProcessing || !reason.trim()} className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 disabled:opacity-40 text-white text-sm font-bold rounded-xl flex items-center justify-center gap-2">
          {isProcessing ? <Loader2 size={16} className="animate-spin" /> : <X size={16} />} Confirmer le refus
        </button>
        <button onClick={onCancel} className="px-4 py-2.5 border border-gray-200 dark:border-gray-600 text-sm font-semibold rounded-xl text-gray-500">Annuler</button>
      </div>
    </div>
  );
}