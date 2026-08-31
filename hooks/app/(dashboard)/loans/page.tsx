'use client';

// ============================================================================
// 📁 app/(dashboard)/loans/page.tsx
// ✅ v3 — Gestion complète : Prêts (validation PARALLÈLE DRH/DG — le premier
//    présent tranche), Avances (validation RH), Retenues diverses (saisie
//    directe), historique par employé.
// ✅ Réservé ADMIN/SUPER_ADMIN/HR_MANAGER — pas de MANAGER (ils ne gèrent
//    pas les fonds). Le composant lui-même ne fait qu'appliquer ce que le
//    backend impose déjà (403 sinon) ; ici on masque juste les actions non
//    autorisées pour ne pas proposer un bouton qui échouerait.
// ============================================================================

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Loader2, Search, Check, X, Clock, CheckCircle2, XCircle, Ban,
  Banknote, Wallet, Receipt, Plus, Printer, Download, Trash2, Pencil,
  ArrowRight, Info, ShieldCheck, Landmark, Lock, Unlock, LayoutDashboard, Eye,PiggyBank
} from 'lucide-react';
import { motion } from 'framer-motion';
import { api } from '@/services/api';
import { useBasePath } from '@/hooks/useBasePath';
import FinanceSubNav from '@/components/FinanceSubNav';
import LoanRequestPrintable from '@/components/LoanRequestPrintable';
import { printLoanDocument, downloadLoanDocumentPDF } from '@/lib/loan-print';
import { PrintAuthorizationModal } from '@/components/documents/PrintAuthorizationModal';
import LoansOverview from '@/components/loans/LoansOverview';
import DocumentPreviewModal from '@/components/loans/DocumentPreviewModal';
import CashPaymentModal from '@/components/loans/CashPaymentModal';

const DRH_ROLES = ['ADMIN', 'SUPER_ADMIN', 'HR_MANAGER'];
const DG_ROLES  = ['ADMIN', 'SUPER_ADMIN'];
const FULL_ADMIN_ROLES = ['ADMIN', 'SUPER_ADMIN'];

const LOAN_STATUS_CFG: Record<string, { label: string; cls: string; icon: any }> = {
  PENDING:    { label: 'En attente',  cls: 'bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-900/20 dark:text-amber-300', icon: Clock },
  PENDING_DG: { label: 'En attente',  cls: 'bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-900/20 dark:text-amber-300', icon: Clock }, // legacy, plus produit
  ACTIVE:     { label: 'Actif',       cls: 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-300', icon: CheckCircle2 },
  PAID:       { label: 'Soldé',       cls: 'bg-sky-50 text-sky-700 border-sky-100 dark:bg-sky-900/20 dark:text-sky-300', icon: CheckCircle2 },
  REJECTED:   { label: 'Refusé',      cls: 'bg-red-50 text-red-700 border-red-100 dark:bg-red-900/20 dark:text-red-300', icon: XCircle },
  CANCELLED:  { label: 'Annulé',      cls: 'bg-gray-50 text-gray-500 border-gray-200 dark:bg-gray-800 dark:text-gray-400', icon: Ban },
};

const ADVANCE_STATUS_CFG: Record<string, { label: string; cls: string; icon: any }> = {
  PENDING:   { label: 'En attente', cls: 'bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-900/20 dark:text-amber-300', icon: Clock },
  APPROVED:  { label: 'Approuvée',  cls: 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-300', icon: CheckCircle2 },
  PAID:      { label: 'Remboursée (espèces)', cls: 'bg-sky-50 text-sky-700 border-sky-100 dark:bg-sky-900/20 dark:text-sky-300', icon: CheckCircle2 },
  DEDUCTED:  { label: 'Déduite',    cls: 'bg-sky-50 text-sky-700 border-sky-100 dark:bg-sky-900/20 dark:text-sky-300', icon: CheckCircle2 },
  REJECTED:  { label: 'Refusée',    cls: 'bg-red-50 text-red-700 border-red-100 dark:bg-red-900/20 dark:text-red-300', icon: XCircle },
  CANCELLED: { label: 'Annulée',    cls: 'bg-gray-50 text-gray-500 border-gray-200 dark:bg-gray-800 dark:text-gray-400', icon: Ban },
};

export default function LoansManagementPage() {
  const { bp } = useBasePath();
  const router = useRouter();
  const [userRole, setUserRole] = useState('');
  const [company, setCompany] = useState<any>(null);
  const [tab, setTab] = useState<'overview' | 'loans' | 'advances' | 'deductions'>('overview');
  const [loanStatusFilter, setLoanStatusFilter] = useState('');
  const [loanTypeFilter, setLoanTypeFilter] = useState('');
  const [loanDeptFilter, setLoanDeptFilter] = useState('');
  const [loanNameSearch, setLoanNameSearch] = useState('');
  const [advanceStatusFilter, setAdvanceStatusFilter] = useState('');
  const [advanceDeptFilter, setAdvanceDeptFilter] = useState('');
  const [advanceNameSearch, setAdvanceNameSearch] = useState('');
  const [showPreviewModal, setShowPreviewModal] = useState(false);

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
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [printAuthModal, setPrintAuthModal] = useState<'loan' | 'advance' | null>(null);
  const [isTogglingPrintAuth, setIsTogglingPrintAuth] = useState(false);
  const [docData, setDocData] = useState<any>(null);
  const [orcaHtml, setOrcaHtml] = useState<string | null>(null);

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
    if (!id) { setDocData(null); setOrcaHtml(null); return; }
    (async () => {
      try {
        const path = tab === 'loans' ? `/loans/${id}/document-data` : `/loans/advances/${id}/document-data`;
        const data = await api.get(path);
        setDocData(data);
        if ((data as Record<string, any>)?.company?.documentTemplate === 'ORCA') {
          const htmlPath = tab === 'loans' ? `/loans/${id}/document/orca-html` : `/loans/advances/${id}/document/orca-html`;
          const res: any = await api.get(htmlPath);
          setOrcaHtml(res?.html ?? null);
        } else {
          setOrcaHtml(null);
        }
      } catch (e) {
        console.error('Erreur chargement document-data', e);
        setDocData(null); setOrcaHtml(null);
      }
    })();
  }, [tab, selectedLoanId, selectedAdvanceId]);

  // Ouvre la fiche complète de l'employé (prêts + avances + remboursements,
  // modification/suppression) — remplace l'ancien sidebar en lecture seule.
  const openEmployeeHistory = (emp: any, employeeId?: string) => {
    const id = employeeId || emp?.id;
    if (id) router.push(bp(`/loans/suivi-dettes/${id}`));
  };

  // ── Actions prêts ──────────────────────────────────────────────────────────

  // Décision PARALLÈLE : DRH et DG reçoivent en même temps, le premier
  // présent (n'importe quel rôle habilité) valide ou refuse en un seul geste.
  const handleLoanDecision = async (decision: 'OUI' | 'NON') => {
    if (!selectedLoan) return;
    if (decision === 'NON' && !rejectionReason.trim()) { setRejectMode(true); return; }
    setIsProcessing(true);
    try {
      await api.patch(`/loans/${selectedLoan.id}/decision`, { decision, rejectionReason: decision === 'NON' ? rejectionReason : undefined, recoverViaPayroll });
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

  const [payModal, setPayModal] = useState<{ kind: 'loan' | 'advance'; id: string; remaining: number } | null>(null);
  const handleCashRepayment = (loanId: string, remainingBalance: number) => {
    setPayModal({ kind: 'loan', id: loanId, remaining: remainingBalance });
  };
  const handleAdvanceCashRepayment = (advanceId: string, remainingBalance: number) => {
    setPayModal({ kind: 'advance', id: advanceId, remaining: remainingBalance });
  };
  const confirmCashRepayment = async (amount: number) => {
    if (!payModal) return;
    try {
      const path = payModal.kind === 'loan' ? `/loans/${payModal.id}/cash-repayment` : `/loans/advances/${payModal.id}/cash-repayment`;
      await api.post(path, { amount });
      setPayModal(null);
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

  // Dette précédente de l'employé (autres prêts/avances validés, hors celui affiché) — pour que la fiche montre bien ce qu'il doit au total.
  const previousLoanAmount = printSource ? (
    loans.filter(l => l.employeeId === printSource.employeeId && l.id !== (tab === 'loans' ? printSource.id : null) && ['ACTIVE', 'PAID'].includes(l.status)).reduce((s, l) => s + Number(l.amount), 0)
    + advances.filter(a => a.employeeId === printSource.employeeId && a.id !== (tab === 'advances' ? printSource.id : null) && ['APPROVED', 'DEDUCTED', 'PAID'].includes(a.status)).reduce((s, a) => s + Number(a.amount), 0)
  ) : 0;

  const printData = printSource ? {
    reference: printReference,
    company: { legalName: company?.legalName, tradeName: company?.tradeName, logo: company?.logo, rccmNumber: company?.rccmNumber, taxNumber: company?.taxNumber, address: company?.address, phone: company?.phone, cachetUrl: company?.cachetUrl, documentFooterText: company?.documentFooterText },
    employee: { firstName: printSource.employee?.firstName || '', lastName: printSource.employee?.lastName || '', position: printSource.employee?.position, departmentName: printSource.employee?.department?.name },
    docType: tab === 'loans' ? (selectedLoan?.type || 'ARGENT') : 'AVANCE',
    reason: printSource.reason,
    amount: printSource.amount,
    requestedAt: printSource.createdAt,
    monthlyRepayment: selectedLoan?.monthlyRepayment,
    durationMonths: selectedLoan ? Math.ceil(Number(selectedLoan.amount) / Number(selectedLoan.monthlyRepayment)) : undefined,
    previousLoanAmount,
    status: printSource.status,
    drhDecision: selectedLoan?.drhDecision, dgDecision: selectedLoan?.dgDecision,
    chefDecision: tab === 'advances' ? (selectedAdvance?.status === 'APPROVED' || selectedAdvance?.status === 'DEDUCTED' || selectedAdvance?.status === 'PAID' ? 'OUI' : selectedAdvance?.status === 'REJECTED' ? 'NON' : null) : undefined,
  } : null;

  const handleDownloadPdf = async () => {
    setIsExportingPdf(true);
    try { await downloadLoanDocumentPDF(PRINT_ID, `${tab === 'loans' ? 'pret' : 'avance'}-${printReference}.pdf`); }
    finally { setIsExportingPdf(false); }
  };

  // Client Orca : ouvre le PDF de la fiche (convertie côté serveur depuis LEUR Excel) dans un nouvel onglet pour imprimer directement depuis l'app.
  const [isPreparingPrint, setIsPreparingPrint] = useState(false);
  const handlePrintOrcaPdf = async () => {
    if (!printSource) return;
    setIsPreparingPrint(true);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const path = tab === 'loans' ? `/loans/${printSource.id}/document/orca-pdf` : `/loans/advances/${printSource.id}/document/orca-pdf`;
      const res = await fetch(`${API_URL}${path}`, { credentials: 'include' });
      if (!res.ok) { const body = await res.json().catch(() => null); throw new Error(body?.message || "Impression indisponible pour le moment"); }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');
    } catch (e: any) { alert(e?.message || "Erreur lors de la préparation de l'impression"); }
    finally { setIsPreparingPrint(false); }
  };

  const matchesName = (emp: any, query: string) => {
    if (!query.trim()) return true;
    const full = `${emp?.firstName ?? ''} ${emp?.lastName ?? ''}`.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    return full.includes(query.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase());
  };

  const loanDepartments = useMemo(() => Array.from(new Set(loans.map(l => l.employee?.department?.name).filter(Boolean))).sort(), [loans]);
  const filteredLoans = useMemo(() => loans.filter(l =>
    (!loanStatusFilter || l.status === loanStatusFilter) &&
    (!loanTypeFilter || l.type === loanTypeFilter) &&
    (!loanDeptFilter || l.employee?.department?.name === loanDeptFilter) &&
    matchesName(l.employee, loanNameSearch),
  ), [loans, loanStatusFilter, loanTypeFilter, loanDeptFilter, loanNameSearch]);

  const advanceDepartments = useMemo(() => Array.from(new Set(advances.map(a => a.employee?.department?.name).filter(Boolean))).sort(), [advances]);
  const filteredAdvances = useMemo(() => advances.filter(a =>
    (!advanceStatusFilter || a.status === advanceStatusFilter) &&
    (!advanceDeptFilter || a.employee?.department?.name === advanceDeptFilter) &&
    matchesName(a.employee, advanceNameSearch),
  ), [advances, advanceStatusFilter, advanceDeptFilter, advanceNameSearch]);

  // Client Orca : télécharge la fiche en écrivant directement dans LEUR fichier Excel (pas un rendu recréé).
  const [isExportingXlsx, setIsExportingXlsx] = useState(false);
  const handleDownloadOrcaXlsx = async () => {
    if (!printSource) return;
    setIsExportingXlsx(true);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const path = tab === 'loans' ? `/loans/${printSource.id}/document/orca-xlsx` : `/loans/advances/${printSource.id}/document/orca-xlsx`;
      const res = await fetch(`${API_URL}${path}`, { credentials: 'include' });
      if (!res.ok) throw new Error('Échec du téléchargement de la fiche');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `${tab === 'loans' ? 'pret' : 'avance'}-${printReference}.xlsx`;
      document.body.appendChild(a); a.click(); a.remove();
      window.URL.revokeObjectURL(url);
    } catch (e: any) { alert(e?.message || 'Erreur lors du téléchargement'); }
    finally { setIsExportingXlsx(false); }
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

      <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl w-fit overflow-x-auto">
        <button onClick={() => setTab('overview')} className={`px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-all whitespace-nowrap ${tab === 'overview' ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500'}`}>
          <LayoutDashboard size={14} /> Vue d'ensemble
        </button>
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

      {/* ══════════════════ VUE D'ENSEMBLE ══════════════════ */}
      {tab === 'overview' && (
        <LoansOverview
          loans={loans}
          advances={advances}
          onSelectEmployee={(emp) => openEmployeeHistory(emp)}
          onGoToRequest={(kind, id) => {
            if (kind === 'loan') { setTab('loans'); setSelectedLoanId(id); }
            else { setTab('advances'); setSelectedAdvanceId(id); }
          }}
        />
      )}

      {/* ══════════════════ PRÊTS ══════════════════ */}
      {tab === 'loans' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-4 space-y-3 max-h-[75vh] overflow-y-auto pr-1">
            <div className="relative sticky top-0 bg-gray-50 dark:bg-gray-900 z-10 pb-1">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input value={loanNameSearch} onChange={e => setLoanNameSearch(e.target.value)} placeholder="Rechercher un employé…" className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 text-sm" />
            </div>
            <div className="flex flex-wrap gap-2 sticky top-11 bg-gray-50 dark:bg-gray-900 z-10 pb-1">
              <select value={loanStatusFilter} onChange={e => setLoanStatusFilter(e.target.value)} className="text-xs px-2 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800">
                <option value="">Tous les statuts</option>
                {['PENDING', 'ACTIVE', 'PAID', 'REJECTED', 'CANCELLED'].map(s => <option key={s} value={s}>{LOAN_STATUS_CFG[s]?.label ?? s}</option>)}
              </select>
              <select value={loanTypeFilter} onChange={e => setLoanTypeFilter(e.target.value)} className="text-xs px-2 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800">
                <option value="">Tous les types</option>
                <option value="ARGENT">Prêt argent</option>
                <option value="MARCHANDISE">Marchandise</option>
                <option value="AUTRE">Autre</option>
              </select>
              {loanDepartments.length > 0 && (
                <select value={loanDeptFilter} onChange={e => setLoanDeptFilter(e.target.value)} className="text-xs px-2 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800">
                  <option value="">Tous les départements</option>
                  {loanDepartments.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              )}
            </div>
            {filteredLoans.length === 0 ? (
              <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 text-sm text-gray-400">Aucun prêt pour ce filtre.</div>
            ) : filteredLoans.map(l => {
              const cfg = LOAN_STATUS_CFG[l.status] ?? LOAN_STATUS_CFG.PENDING;
              const Icon = cfg.icon;
              const initials = `${l.employee?.firstName?.[0] ?? ''}${l.employee?.lastName?.[0] ?? ''}`;
              const active = l.id === selectedLoanId;
              return (
                <div key={l.id} onClick={() => { setSelectedLoanId(l.id); setRejectMode(false); setRejectionReason(''); }} className={`p-4 rounded-2xl border cursor-pointer flex gap-3 items-start transition-all ${active ? 'border-sky-400 bg-sky-50 dark:bg-sky-900/20' : 'border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-200'}`}>
                  <button onClick={(e) => { e.stopPropagation(); openEmployeeHistory(l.employee, l.employeeId); }} className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-xs font-bold text-gray-500 overflow-hidden shrink-0 hover:ring-2 hover:ring-sky-400">
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
                <div className="p-6 bg-gradient-to-br from-sky-50 to-white dark:from-gray-900 dark:to-gray-800 border-b border-gray-100 dark:border-gray-700 flex items-start justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-sky-100 dark:bg-sky-900/30 flex items-center justify-center text-base font-bold text-sky-600 overflow-hidden shrink-0">
                      {selectedLoan.employee?.photoUrl ? <img src={selectedLoan.employee.photoUrl} className="w-full h-full object-cover" alt="" /> : `${selectedLoan.employee?.firstName?.[0] ?? ''}${selectedLoan.employee?.lastName?.[0] ?? ''}`}
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900 dark:text-white">{selectedLoan.employee?.firstName} {selectedLoan.employee?.lastName}</h2>
                      <p className="text-sm text-gray-400">{selectedLoan.employee?.position}{selectedLoan.employee?.department ? ` · ${selectedLoan.employee.department.name}` : ''}</p>
                    </div>
                  </div>
                  <span className={`text-xs font-semibold px-3 py-1.5 rounded-lg border shrink-0 flex items-center gap-1 ${(LOAN_STATUS_CFG[selectedLoan.status] ?? LOAN_STATUS_CFG.PENDING).cls}`}>
                    {(LOAN_STATUS_CFG[selectedLoan.status] ?? LOAN_STATUS_CFG.PENDING).label}
                  </span>
                </div>

                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <DetailTile icon={Banknote} label="Montant" value={`${Number(selectedLoan.amount).toLocaleString('fr-FR')} FCFA`} tone="slate" />
                      <DetailTile icon={Wallet} label="Mensualité" value={`${Number(selectedLoan.monthlyRepayment).toLocaleString('fr-FR')} FCFA`} tone="sky" />
                      <DetailTile icon={PiggyBank} label="Solde restant" value={`${Number(selectedLoan.remainingBalance).toLocaleString('fr-FR')} FCFA`} tone={Number(selectedLoan.remainingBalance) === 0 ? 'emerald' : 'amber'} />
                      <DetailTile icon={Receipt} label="Type" value={selectedLoan.type} tone="violet" />
                    </div>

                    {selectedLoan.reason && <div className="text-sm"><p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Motif</p><p className="text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700/40 p-3 rounded-xl">{selectedLoan.reason}</p></div>}

                    {selectedLoan.status === 'REJECTED' && selectedLoan.rejectionReason && (
                      <div className="text-sm flex items-start gap-2 text-red-600 bg-red-50 dark:bg-red-900/20 p-3 rounded-xl"><Info size={14} className="shrink-0 mt-0.5" /> {selectedLoan.rejectionReason}</div>
                    )}

                    {/* Décision — PARALLÈLE : visible par DRH et DG en même temps, le premier présent tranche */}
                    {selectedLoan.status === 'PENDING' && DRH_ROLES.includes(userRole) && (
                      <div className="space-y-2 pt-2 border-t border-gray-100 dark:border-gray-700">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                          {DG_ROLES.includes(userRole) ? <Landmark size={12} /> : <ShieldCheck size={12} />} Décision
                        </p>
                        {!rejectMode ? (
                          <>
                            <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                              <input type="checkbox" checked={recoverViaPayroll} onChange={e => setRecoverViaPayroll(e.target.checked)} />
                              Récupérer automatiquement sur la paie
                            </label>
                            <div className="flex gap-2">
                              <button onClick={() => handleLoanDecision('OUI')} disabled={isProcessing} className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white text-sm font-bold rounded-xl flex items-center justify-center gap-2"><Check size={16} /> Valider (OUI)</button>
                              <button onClick={() => setRejectMode(true)} className="flex-1 py-2.5 border border-gray-200 dark:border-gray-600 hover:bg-red-50 hover:text-red-600 text-gray-600 dark:text-gray-300 text-sm font-bold rounded-xl flex items-center justify-center gap-2"><X size={16} /> Refuser</button>
                            </div>
                          </>
                        ) : (
                          <RejectForm reason={rejectionReason} setReason={setRejectionReason} onConfirm={() => handleLoanDecision('NON')} onCancel={() => setRejectMode(false)} isProcessing={isProcessing} />
                        )}
                      </div>
                    )}

                    {selectedLoan.status === 'ACTIVE' && DRH_ROLES.includes(userRole) && (
                      <button onClick={() => handleCashRepayment(selectedLoan.id, Number(selectedLoan.remainingBalance))} className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-bold rounded-xl flex items-center justify-center gap-2 shadow-sm shadow-emerald-500/30">
                        <Wallet size={16} /> Confirmer un remboursement
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
                      {/* Impression 100% côté navigateur (aucune dépendance serveur) — marche pour Orca (rendu HTML fidèle) comme pour les autres (LoanRequestPrintable), puisque PRINT_ID contient déjà le bon rendu. */}
                      <button onClick={() => setTimeout(() => printLoanDocument(PRINT_ID), 50)} className="flex-1 py-2.5 border border-gray-200 dark:border-gray-700 text-sm font-semibold rounded-xl text-gray-600 dark:text-gray-300 flex items-center justify-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-700"><Printer size={16} /> Imprimer</button>
                      {docData?.company?.documentTemplate === 'ORCA' ? (
                        <button onClick={handleDownloadOrcaXlsx} disabled={isExportingXlsx} className="flex-1 py-2.5 border border-gray-200 dark:border-gray-700 text-sm font-semibold rounded-xl text-gray-600 dark:text-gray-300 flex items-center justify-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40">{isExportingXlsx ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />} Fiche Excel</button>
                      ) : (
                        <button onClick={handleDownloadPdf} disabled={isExportingPdf} className="flex-1 py-2.5 border border-gray-200 dark:border-gray-700 text-sm font-semibold rounded-xl text-gray-600 dark:text-gray-300 flex items-center justify-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40">{isExportingPdf ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />} PDF</button>
                      )}
                    </div>
                  </div>

                  <button onClick={() => setShowPreviewModal(true)} className="w-full py-2.5 border border-dashed border-gray-300 dark:border-gray-600 text-sm font-semibold rounded-xl text-gray-500 dark:text-gray-400 flex items-center justify-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-700">
                    <Eye size={16} /> Aperçu de la fiche
                  </button>

                  {/* Rendu réel hors-écran (pas display:none) : nécessaire pour la capture d'impression navigateur */}
                  <div className="fixed -left-[9999px] top-0 pointer-events-none" aria-hidden="true">
                    {docData?.company?.documentTemplate === 'ORCA' ? (
                      orcaHtml && <div id={PRINT_ID} dangerouslySetInnerHTML={{ __html: orcaHtml }} />
                    ) : (
                      printData && <LoanRequestPrintable id={PRINT_ID} data={printData as any} />
                    )}
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
          <div className="lg:col-span-4 space-y-3 max-h-[75vh] overflow-y-auto pr-1">
            <div className="relative sticky top-0 bg-gray-50 dark:bg-gray-900 z-10 pb-1">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input value={advanceNameSearch} onChange={e => setAdvanceNameSearch(e.target.value)} placeholder="Rechercher un employé…" className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 text-sm" />
            </div>
            <div className="flex flex-wrap gap-2 sticky top-11 bg-gray-50 dark:bg-gray-900 z-10 pb-1">
              <select value={advanceStatusFilter} onChange={e => setAdvanceStatusFilter(e.target.value)} className="text-xs px-2 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800">
                <option value="">Tous les statuts</option>
                {['PENDING', 'APPROVED', 'DEDUCTED', 'PAID', 'REJECTED', 'CANCELLED'].map(s => <option key={s} value={s}>{ADVANCE_STATUS_CFG[s]?.label ?? s}</option>)}
              </select>
              {advanceDepartments.length > 0 && (
                <select value={advanceDeptFilter} onChange={e => setAdvanceDeptFilter(e.target.value)} className="text-xs px-2 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800">
                  <option value="">Tous les départements</option>
                  {advanceDepartments.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              )}
            </div>
            {filteredAdvances.length === 0 ? (
              <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 text-sm text-gray-400">Aucune avance pour ce filtre.</div>
            ) : filteredAdvances.map(a => {
              const cfg = ADVANCE_STATUS_CFG[a.status] ?? ADVANCE_STATUS_CFG.PENDING;
              const Icon = cfg.icon;
              const initials = `${a.employee?.firstName?.[0] ?? ''}${a.employee?.lastName?.[0] ?? ''}`;
              const active = a.id === selectedAdvanceId;
              return (
                <div key={a.id} onClick={() => { setSelectedAdvanceId(a.id); setRejectMode(false); setRejectionReason(''); }} className={`p-4 rounded-2xl border cursor-pointer flex gap-3 items-start transition-all ${active ? 'border-sky-400 bg-sky-50 dark:bg-sky-900/20' : 'border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-200'}`}>
                  <button onClick={(e) => { e.stopPropagation(); openEmployeeHistory(a.employee, a.employeeId); }} className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-xs font-bold text-gray-500 overflow-hidden shrink-0 hover:ring-2 hover:ring-sky-400">
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
                <div className="p-6 bg-gradient-to-br from-sky-50 to-white dark:from-gray-900 dark:to-gray-800 border-b border-gray-100 dark:border-gray-700 flex items-start justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-sky-100 dark:bg-sky-900/30 flex items-center justify-center text-base font-bold text-sky-600 overflow-hidden shrink-0">
                      {selectedAdvance.employee?.photoUrl ? <img src={selectedAdvance.employee.photoUrl} className="w-full h-full object-cover" alt="" /> : `${selectedAdvance.employee?.firstName?.[0] ?? ''}${selectedAdvance.employee?.lastName?.[0] ?? ''}`}
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900 dark:text-white">{selectedAdvance.employee?.firstName} {selectedAdvance.employee?.lastName}</h2>
                      <p className="text-sm text-gray-400">{selectedAdvance.employee?.position}</p>
                    </div>
                  </div>
                  <span className={`text-xs font-semibold px-3 py-1.5 rounded-lg border shrink-0 ${(ADVANCE_STATUS_CFG[selectedAdvance.status] ?? ADVANCE_STATUS_CFG.PENDING).cls}`}>{(ADVANCE_STATUS_CFG[selectedAdvance.status] ?? ADVANCE_STATUS_CFG.PENDING).label}</span>
                </div>

                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <DetailTile icon={Banknote} label="Montant" value={`${Number(selectedAdvance.amount).toLocaleString('fr-FR')} FCFA`} tone="slate" />
                      <DetailTile icon={Wallet} label="Déduction prévue" value={`${selectedAdvance.deductMonth}/${selectedAdvance.deductYear}`} tone="sky" />
                    </div>
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
                      <div className="space-y-2">
                        <button onClick={() => handleAdvanceCashRepayment(selectedAdvance.id, Number(selectedAdvance.remainingBalance ?? selectedAdvance.amount))} className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-bold rounded-xl flex items-center justify-center gap-2 shadow-sm shadow-emerald-500/30">
                          <Wallet size={16} /> Confirmer un remboursement
                        </button>
                        <button onClick={() => handleMarkAdvancePaidCash(selectedAdvance.id)} className="w-full py-2 text-xs font-semibold text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                          Solder tout en espèces d'un coup
                        </button>
                      </div>
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
                      {/* Impression 100% côté navigateur (aucune dépendance serveur) — marche pour Orca (rendu HTML fidèle) comme pour les autres (LoanRequestPrintable), puisque PRINT_ID contient déjà le bon rendu. */}
                      <button onClick={() => setTimeout(() => printLoanDocument(PRINT_ID), 50)} className="flex-1 py-2.5 border border-gray-200 dark:border-gray-700 text-sm font-semibold rounded-xl text-gray-600 dark:text-gray-300 flex items-center justify-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-700"><Printer size={16} /> Imprimer</button>
                      {docData?.company?.documentTemplate === 'ORCA' ? (
                        <button onClick={handleDownloadOrcaXlsx} disabled={isExportingXlsx} className="flex-1 py-2.5 border border-gray-200 dark:border-gray-700 text-sm font-semibold rounded-xl text-gray-600 dark:text-gray-300 flex items-center justify-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40">{isExportingXlsx ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />} Fiche Excel</button>
                      ) : (
                        <button onClick={handleDownloadPdf} disabled={isExportingPdf} className="flex-1 py-2.5 border border-gray-200 dark:border-gray-700 text-sm font-semibold rounded-xl text-gray-600 dark:text-gray-300 flex items-center justify-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40">{isExportingPdf ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />} PDF</button>
                      )}
                    </div>
                  </div>

                  <button onClick={() => setShowPreviewModal(true)} className="w-full py-2.5 border border-dashed border-gray-300 dark:border-gray-600 text-sm font-semibold rounded-xl text-gray-500 dark:text-gray-400 flex items-center justify-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-700">
                    <Eye size={16} /> Aperçu de la fiche
                  </button>

                  <div className="fixed -left-[9999px] top-0 pointer-events-none" aria-hidden="true">
                    {docData?.company?.documentTemplate === 'ORCA' ? (
                      orcaHtml && <div id={PRINT_ID} dangerouslySetInnerHTML={{ __html: orcaHtml }} />
                    ) : (
                      printData && <LoanRequestPrintable id={PRINT_ID} data={printData as any} />
                    )}
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

      <DocumentPreviewModal open={showPreviewModal} onClose={() => setShowPreviewModal(false)}>
        {tab === 'loans' && selectedLoan && docData && (
          docData.company?.documentTemplate === 'ORCA' ? (
            orcaHtml && <div dangerouslySetInnerHTML={{ __html: orcaHtml }} />
          ) : (
            printData && <LoanRequestPrintable id="loan-doc-preview" data={printData as any} />
          )
        )}
        {tab === 'advances' && selectedAdvance && docData && (
          docData.company?.documentTemplate === 'ORCA' ? (
            orcaHtml && <div dangerouslySetInnerHTML={{ __html: orcaHtml }} />
          ) : (
            printData && <LoanRequestPrintable id="advance-doc-preview" data={printData as any} />
          )
        )}
      </DocumentPreviewModal>

      <CashPaymentModal
        open={!!payModal}
        onClose={() => setPayModal(null)}
        remaining={payModal?.remaining ?? 0}
        onConfirm={confirmCashRepayment}
      />

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
      <p className="font-bold">{value}</p>
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