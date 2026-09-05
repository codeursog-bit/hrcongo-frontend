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
  ArrowRight, Info, ShieldCheck, Landmark, Lock, Unlock, LayoutDashboard, Eye,PiggyBank, Users,
  CreditCard, Calendar, SlidersHorizontal
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

const LOAN_STATUS_CFG: Record<string, { label: string; cls: string; dot: string; icon: any }> = {
  PENDING:    { label: 'En attente',  cls: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300', dot: 'bg-amber-500', icon: Clock },
  PENDING_DG: { label: 'En attente',  cls: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300', dot: 'bg-amber-500', icon: Clock }, // legacy, plus produit
  ACTIVE:     { label: 'Actif',       cls: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300', dot: 'bg-emerald-500', icon: CheckCircle2 },
  PAID:       { label: 'Soldé',       cls: 'bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-300', dot: 'bg-sky-500', icon: CheckCircle2 },
  REJECTED:   { label: 'Refusé',      cls: 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-300', dot: 'bg-red-500', icon: XCircle },
  CANCELLED:  { label: 'Annulé',      cls: 'bg-gray-100 text-gray-500 dark:bg-gray-700/50 dark:text-gray-400', dot: 'bg-gray-400', icon: Ban },
};

const ADVANCE_STATUS_CFG: Record<string, { label: string; cls: string; dot: string; icon: any }> = {
  PENDING:   { label: 'En attente', cls: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300', dot: 'bg-amber-500', icon: Clock },
  APPROVED:  { label: 'Approuvée',  cls: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300', dot: 'bg-emerald-500', icon: CheckCircle2 },
  PAID:      { label: 'Remboursée (espèces)', cls: 'bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-300', dot: 'bg-sky-500', icon: CheckCircle2 },
  DEDUCTED:  { label: 'Déduite',    cls: 'bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-300', dot: 'bg-sky-500', icon: CheckCircle2 },
  REJECTED:  { label: 'Refusée',    cls: 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-300', dot: 'bg-red-500', icon: XCircle },
  CANCELLED: { label: 'Annulée',    cls: 'bg-gray-100 text-gray-500 dark:bg-gray-700/50 dark:text-gray-400', dot: 'bg-gray-400', icon: Ban },
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
  const [newDeduction, setNewDeduction] = useState({ employeeId: '', label: '', amount: '', monthlyDeduction: '', month: new Date().getMonth() + 1, year: new Date().getFullYear(), recoverViaPayroll: true });
  const [isAddingDeduction, setIsAddingDeduction] = useState(false);
  const [payingCashId, setPayingCashId] = useState<string | null>(null);

  // Filtres de la vue "Retenues diverses"
  const [dedSearch, setDedSearch] = useState('');
  const [dedView, setDedView] = useState<'mensuelle' | 'annuelle'>('mensuelle');
  const [dedMonth, setDedMonth] = useState(new Date().getMonth() + 1);
  const [dedYear, setDedYear] = useState(new Date().getFullYear());

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
      // ✅ Pas de présélection automatique — la modal ne doit s'ouvrir que sur
      // un clic explicite de l'utilisateur sur une ligne. (selectedLoanId/
      // selectedAdvanceId restent tels quels : null au premier chargement,
      // ou inchangés après une action pour garder la modal ouverte sur le
      // même prêt/avance avec les données fraîchement rechargées.)
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
      await api.post('/company-deductions', {
        ...newDeduction,
        amount: Number(newDeduction.amount),
        monthlyDeduction: newDeduction.monthlyDeduction ? Number(newDeduction.monthlyDeduction) : undefined,
      });
      setNewDeduction({ employeeId: '', label: '', amount: '', monthlyDeduction: '', month: new Date().getMonth() + 1, year: new Date().getFullYear(), recoverViaPayroll: true });
      await load();
    } catch (e: any) { alert(e?.message || 'Erreur'); } finally { setIsAddingDeduction(false); }
  };

  // Règlement en espèces à montant LIBRE — plus le "tout ou rien" d'avant.
  // Chaque retenue garde son propre champ de saisie (dedCashAmounts), soumis
  // via handleCashRepaymentDeduction.
  const [dedCashAmounts, setDedCashAmounts] = useState<Record<string, string>>({});
  const handleCashRepaymentDeduction = async (id: string) => {
    const amount = Number(dedCashAmounts[id]);
    if (!amount || amount <= 0) return;
    setPayingCashId(id);
    try {
      await api.patch(`/company-deductions/${id}/cash-repayment`, { amount });
      setDedCashAmounts(prev => ({ ...prev, [id]: '' }));
      await load();
    } catch (e: any) { alert(e?.message || 'Erreur'); } finally { setPayingCashId(null); }
  };

  const handleDeleteDeduction = async (id: string) => {
    if (!confirm('Supprimer cette retenue ?')) return;
    try { await api.delete(`/company-deductions/${id}`); await load(); } catch (e: any) { alert(e?.message || 'Erreur'); }
  };

  // ── Impression ─────────────────────────────────────────────────────────────

  const PRINT_ID = 'loan-doc-print';
  const printSource = tab === 'loans' ? selectedLoan : selectedAdvance;
  const printReference = printSource ? `${tab === 'loans' ? 'PR' : 'AV'}-${printSource.id.slice(0, 8).toUpperCase()}` : '';

  // Dette précédente de l'employé (autres prêts/avances, hors celui affiché) — pour que
  // la fiche montre bien ce qu'il doit ENCORE au total. On ne compte que le solde restant
  // (remainingBalance), pas le montant d'origine — sinon un prêt déjà partiellement ou
  // entièrement remboursé continuerait à s'afficher comme si de rien n'était. Les dettes
  // soldées (statut PAID) ne doivent plus rien : on les exclut complètement.
  const previousLoanAmount = printSource ? (
    loans.filter(l => l.employeeId === printSource.employeeId && l.id !== (tab === 'loans' ? printSource.id : null) && l.status === 'ACTIVE').reduce((s, l) => s + Number(l.remainingBalance), 0)
    + advances.filter(a => a.employeeId === printSource.employeeId && a.id !== (tab === 'advances' ? printSource.id : null) && a.status === 'APPROVED').reduce((s, a) => s + Number(a.remainingBalance ?? a.amount), 0)
  ) : 0;

  const printData = printSource ? {
    reference: printReference,
    company: { legalName: company?.legalName, tradeName: company?.tradeName, logo: company?.logo, rccmNumber: company?.rccmNumber, taxNumber: company?.taxNumber, address: company?.address, phone: company?.phone, cachetUrl: company?.cachetUrl, documentFooterText: company?.documentFooterText },
    employee: { firstName: printSource.employee?.firstName || '', lastName: printSource.employee?.lastName || '', position: printSource.employee?.position, departmentName: printSource.employee?.department?.name },
    docType: tab === 'loans' ? (selectedLoan?.type || 'ARGENT') : 'AVANCE',
    reason: printSource.reason,
    amount: printSource.amount,
    requestedAt: tab === 'loans' ? (printSource.startDate ?? printSource.createdAt) : printSource.createdAt,
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

  // ── Retenues diverses : vue mensuelle (liste du mois/année sélectionné) ────
  const filteredDeductions = useMemo(() => deductions.filter((d: any) =>
    d.month === dedMonth && d.year === dedYear && matchesName(d.employee, dedSearch),
  ), [deductions, dedMonth, dedYear, dedSearch]);

  // ── Retenues diverses : vue annuelle (total par employé, réparti par mois) ─
  const MONTH_LABELS = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
  const annualDeductions = useMemo(() => {
    const yearDeductions = deductions.filter((d: any) => d.year === dedYear && matchesName(d.employee, dedSearch) && d.status !== 'CANCELLED');
    const byEmployee = new Map<string, { employee: any; perMonth: number[]; total: number; paid: number }>();
    for (const d of yearDeductions) {
      const key = d.employeeId;
      if (!byEmployee.has(key)) byEmployee.set(key, { employee: d.employee, perMonth: Array(12).fill(0), total: 0, paid: 0 });
      const row = byEmployee.get(key)!;
      row.perMonth[d.month - 1] += Number(d.amount);
      row.total += Number(d.amount);
      row.paid += Number(d.amount) - Number(d.remainingBalance);
    }
    return Array.from(byEmployee.values()).sort((a, b) => b.total - a.total);
  }, [deductions, dedYear, dedSearch]);
  const annualTotal = useMemo(() => annualDeductions.reduce((s, r) => s + r.total, 0), [annualDeductions]);
  const annualPaid = useMemo(() => annualDeductions.reduce((s, r) => s + r.paid, 0), [annualDeductions]);

  // ── Synthèse globale (toutes périodes confondues) — affichée en haut de
  // l'onglet Retenues diverses, peu importe la vue (mensuelle/annuelle).
  const dedGlobalStats = useMemo(() => {
    const active = deductions.filter((d: any) => d.status !== 'CANCELLED');
    const total = active.reduce((s: number, d: any) => s + Number(d.amount), 0);
    const remaining = active.reduce((s: number, d: any) => s + Number(d.remainingBalance), 0);
    const employeeIds = new Set(active.map((d: any) => d.employeeId));
    return { total, remaining, employeeCount: employeeIds.size };
  }, [deductions]);

  const dedAvailableYears = useMemo(() => {
    const years = new Set(deductions.map((d: any) => d.year));
    years.add(new Date().getFullYear());
    return Array.from(years).sort((a: any, b: any) => b - a);
  }, [deductions]);

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
        <div className="space-y-4">
          {/* Filtres — libellés explicites, compréhensibles sans avoir à deviner */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4">
            <div className="flex flex-wrap items-end gap-3">
              <div className="flex-1 min-w-[220px]">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1 block">Rechercher un employé</label>
                <div className="relative">
                  <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input value={loanNameSearch} onChange={e => setLoanNameSearch(e.target.value)} placeholder="Nom de l'employé…" className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-900 text-sm" />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1 block">Statut</label>
                <select value={loanStatusFilter} onChange={e => setLoanStatusFilter(e.target.value)} className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-900 text-sm">
                  <option value="">Tous les statuts</option>
                  {['PENDING', 'ACTIVE', 'PAID', 'REJECTED', 'CANCELLED'].map(s => <option key={s} value={s}>{LOAN_STATUS_CFG[s]?.label ?? s}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1 block">Type</label>
                <select value={loanTypeFilter} onChange={e => setLoanTypeFilter(e.target.value)} className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-900 text-sm">
                  <option value="">Tous les types</option>
                  <option value="ARGENT">Prêt argent</option>
                  <option value="MARCHANDISE">Marchandise</option>
                  <option value="AUTRE">Autre</option>
                </select>
              </div>
              {loanDepartments.length > 0 && (
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1 block">Département</label>
                  <select value={loanDeptFilter} onChange={e => setLoanDeptFilter(e.target.value)} className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-900 text-sm">
                    <option value="">Tous les départements</option>
                    {loanDepartments.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Liste pleine largeur — un clic sur la ligne ouvre la fiche détaillée */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>{['Employé', 'Type', 'Montant', 'Mensualité', 'Solde restant', 'Statut', ''].map(h => <th key={h} className="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase">{h}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {filteredLoans.length === 0 ? (
                  <tr><td colSpan={7} className="text-center py-14 text-gray-400 text-sm">Aucun prêt pour ce filtre.</td></tr>
                ) : filteredLoans.map(l => {
                  const cfg = LOAN_STATUS_CFG[l.status] ?? LOAN_STATUS_CFG.PENDING;
                  const Icon = cfg.icon;
                  const initials = `${l.employee?.firstName?.[0] ?? ''}${l.employee?.lastName?.[0] ?? ''}`;
                  return (
                    <tr key={l.id} onClick={() => { setSelectedLoanId(l.id); setRejectMode(false); setRejectionReason(''); }} className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <button onClick={(e) => { e.stopPropagation(); openEmployeeHistory(l.employee, l.employeeId); }} className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-xs font-bold text-gray-500 overflow-hidden shrink-0 hover:ring-2 hover:ring-sky-400">
                            {l.employee?.photoUrl ? <img src={l.employee.photoUrl} className="w-full h-full object-cover" alt="" /> : initials}
                          </button>
                          <div className="min-w-0">
                            <p className="font-semibold text-gray-900 dark:text-white truncate">{l.employee?.firstName} {l.employee?.lastName}</p>
                            <p className="text-xs text-gray-400 truncate">{l.employee?.department?.name || '—'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{l.type === 'ARGENT' ? 'Prêt argent' : l.type === 'MARCHANDISE' ? 'Marchandise' : 'Autre'}</td>
                      <td className="px-4 py-3 font-semibold">{Number(l.amount).toLocaleString('fr-FR')} FCFA</td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{Number(l.monthlyRepayment).toLocaleString('fr-FR')} FCFA</td>
                      <td className={`px-4 py-3 font-semibold ${Number(l.remainingBalance) > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>{Number(l.remainingBalance).toLocaleString('fr-FR')} FCFA</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${cfg.cls}`}><span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} /> {cfg.label}</span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {l.status === 'ACTIVE' && DRH_ROLES.includes(userRole) && (
                          <button onClick={(e) => { e.stopPropagation(); handleCashRepayment(l.id, Number(l.remainingBalance)); }} className="inline-flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 hover:bg-emerald-500 hover:text-white dark:bg-emerald-500/10 dark:text-emerald-300 dark:hover:bg-emerald-500 dark:hover:text-white transition-colors whitespace-nowrap">
                            <Wallet size={11} /> Rembourser
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* ══════════ MODAL — fiche détaillée d'un prêt ══════════ */}
          {selectedLoan && (
            <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-md" onClick={() => setSelectedLoanId(null)}>
              <motion.div
                onClick={e => e.stopPropagation()}
                initial={{ opacity: 0, y: 16, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ type: 'spring', damping: 24, stiffness: 300 }}
                className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl ring-1 ring-black/5 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              >
                <div className="p-6 bg-gradient-to-br from-sky-50 to-white dark:from-gray-900 dark:to-gray-800 border-b border-gray-100 dark:border-gray-700 flex items-start justify-between gap-4 sticky top-0 z-10">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-sky-400 to-sky-600 flex items-center justify-center text-lg font-bold text-white overflow-hidden shrink-0 shadow-lg shadow-sky-500/30 ring-4 ring-white dark:ring-gray-800">
                      {selectedLoan.employee?.photoUrl ? <img src={selectedLoan.employee.photoUrl} className="w-full h-full object-cover" alt="" /> : `${selectedLoan.employee?.firstName?.[0] ?? ''}${selectedLoan.employee?.lastName?.[0] ?? ''}`}
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900 dark:text-white">{selectedLoan.employee?.firstName} {selectedLoan.employee?.lastName}</h2>
                      <p className="text-sm text-gray-400">{selectedLoan.employee?.position}{selectedLoan.employee?.department ? ` · ${selectedLoan.employee.department.name}` : ''}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 ${(LOAN_STATUS_CFG[selectedLoan.status] ?? LOAN_STATUS_CFG.PENDING).cls}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${(LOAN_STATUS_CFG[selectedLoan.status] ?? LOAN_STATUS_CFG.PENDING).dot}`} />
                      {(LOAN_STATUS_CFG[selectedLoan.status] ?? LOAN_STATUS_CFG.PENDING).label}
                    </span>
                    <button onClick={() => setSelectedLoanId(null)} className="w-9 h-9 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 dark:hover:text-gray-200 transition-colors"><X size={18} /></button>
                  </div>
                </div>

                <div className="p-6 space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <DetailTile icon={Banknote} label="Montant" value={`${Number(selectedLoan.amount).toLocaleString('fr-FR')} FCFA`} tone="slate" />
                    <DetailTile icon={Wallet} label="Mensualité" value={`${Number(selectedLoan.monthlyRepayment).toLocaleString('fr-FR')} FCFA`} tone="sky" />
                    <DetailTile icon={PiggyBank} label="Solde restant" value={`${Number(selectedLoan.remainingBalance).toLocaleString('fr-FR')} FCFA`} tone={Number(selectedLoan.remainingBalance) === 0 ? 'emerald' : 'amber'} />
                    <DetailTile icon={Receipt} label="Type" value={selectedLoan.type} tone="violet" />
                  </div>

                  {/* Progression du remboursement — repère visuel rapide */}
                  {Number(selectedLoan.amount) > 0 && (
                    <div>
                      <div className="flex items-center justify-between text-xs text-gray-400 mb-1.5">
                        <span>Progression du remboursement</span>
                        <span className="font-semibold text-gray-600 dark:text-gray-300">
                          {Math.round(((Number(selectedLoan.amount) - Number(selectedLoan.remainingBalance)) / Number(selectedLoan.amount)) * 100)}%
                        </span>
                      </div>
                      <div className="h-2.5 rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full transition-all"
                          style={{ width: `${Math.min(100, Math.round(((Number(selectedLoan.amount) - Number(selectedLoan.remainingBalance)) / Number(selectedLoan.amount)) * 100))}%` }}
                        />
                      </div>
                    </div>
                  )}

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
                          <div>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Remboursement</p>
                            <div className="grid grid-cols-2 gap-2">
                              <button
                                type="button"
                                onClick={() => setRecoverViaPayroll(true)}
                                className={`px-3 py-2 rounded-xl border-2 text-xs font-bold transition-all ${recoverViaPayroll ? 'border-sky-500 bg-sky-50 dark:bg-sky-900/20 text-sky-700 dark:text-sky-300' : 'border-gray-200 dark:border-gray-600 text-gray-500'}`}
                              >
                                Sur la paie
                              </button>
                              <button
                                type="button"
                                onClick={() => setRecoverViaPayroll(false)}
                                className={`px-3 py-2 rounded-xl border-2 text-xs font-bold transition-all ${!recoverViaPayroll ? 'border-sky-500 bg-sky-50 dark:bg-sky-900/20 text-sky-700 dark:text-sky-300' : 'border-gray-200 dark:border-gray-600 text-gray-500'}`}
                              >
                                En espèces
                              </button>
                            </div>
                          </div>
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
            </div>
          )}
        </div>
      )}

      {/* ══════════════════ AVANCES ══════════════════ */}
      {tab === 'advances' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4">
            <div className="flex flex-wrap items-end gap-3">
              <div className="flex-1 min-w-[220px]">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1 block">Rechercher un employé</label>
                <div className="relative">
                  <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input value={advanceNameSearch} onChange={e => setAdvanceNameSearch(e.target.value)} placeholder="Nom de l'employé…" className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-900 text-sm" />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1 block">Statut</label>
                <select value={advanceStatusFilter} onChange={e => setAdvanceStatusFilter(e.target.value)} className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-900 text-sm">
                  <option value="">Tous les statuts</option>
                  {['PENDING', 'APPROVED', 'DEDUCTED', 'PAID', 'REJECTED', 'CANCELLED'].map(s => <option key={s} value={s}>{ADVANCE_STATUS_CFG[s]?.label ?? s}</option>)}
                </select>
              </div>
              {advanceDepartments.length > 0 && (
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1 block">Département</label>
                  <select value={advanceDeptFilter} onChange={e => setAdvanceDeptFilter(e.target.value)} className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-900 text-sm">
                    <option value="">Tous les départements</option>
                    {advanceDepartments.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>{['Employé', 'Montant', 'Déduction prévue', 'Statut', ''].map(h => <th key={h} className="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase">{h}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {filteredAdvances.length === 0 ? (
                  <tr><td colSpan={5} className="text-center py-14 text-gray-400 text-sm">
                    <Wallet size={22} className="mx-auto mb-2 text-gray-300" />
                    Aucune avance pour ce filtre.
                  </td></tr>
                ) : filteredAdvances.map(a => {
                  const cfg = ADVANCE_STATUS_CFG[a.status] ?? ADVANCE_STATUS_CFG.PENDING;
                  const Icon = cfg.icon;
                  const initials = `${a.employee?.firstName?.[0] ?? ''}${a.employee?.lastName?.[0] ?? ''}`;
                  return (
                    <tr key={a.id} onClick={() => { setSelectedAdvanceId(a.id); setRejectMode(false); setRejectionReason(''); }} className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <button onClick={(e) => { e.stopPropagation(); openEmployeeHistory(a.employee, a.employeeId); }} className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-xs font-bold text-gray-500 overflow-hidden shrink-0 hover:ring-2 hover:ring-sky-400">
                            {a.employee?.photoUrl ? <img src={a.employee.photoUrl} className="w-full h-full object-cover" alt="" /> : initials}
                          </button>
                          <div className="min-w-0">
                            <p className="font-semibold text-gray-900 dark:text-white truncate">{a.employee?.firstName} {a.employee?.lastName}</p>
                            <p className="text-xs text-gray-400 truncate">{a.employee?.department?.name || '—'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-semibold">{Number(a.amount).toLocaleString('fr-FR')} FCFA</td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{MONTH_LABELS[a.deductMonth - 1]} {a.deductYear}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${cfg.cls}`}><span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} /> {cfg.label}</span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {a.status === 'APPROVED' && DRH_ROLES.includes(userRole) && (
                          <button onClick={(e) => { e.stopPropagation(); handleAdvanceCashRepayment(a.id, Number(a.remainingBalance ?? a.amount)); }} className="inline-flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 hover:bg-emerald-500 hover:text-white dark:bg-emerald-500/10 dark:text-emerald-300 dark:hover:bg-emerald-500 dark:hover:text-white transition-colors whitespace-nowrap">
                            <Wallet size={11} /> Rembourser
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* ══════════ MODAL — fiche détaillée d'une avance ══════════ */}
          {selectedAdvance && (
            <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-md" onClick={() => setSelectedAdvanceId(null)}>
              <motion.div
                onClick={e => e.stopPropagation()}
                initial={{ opacity: 0, y: 16, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ type: 'spring', damping: 24, stiffness: 300 }}
                className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl ring-1 ring-black/5 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              >
                <div className="p-6 bg-gradient-to-br from-sky-50 to-white dark:from-gray-900 dark:to-gray-800 border-b border-gray-100 dark:border-gray-700 flex items-start justify-between gap-4 sticky top-0 z-10">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-sky-400 to-sky-600 flex items-center justify-center text-lg font-bold text-white overflow-hidden shrink-0 shadow-lg shadow-sky-500/30 ring-4 ring-white dark:ring-gray-800">
                      {selectedAdvance.employee?.photoUrl ? <img src={selectedAdvance.employee.photoUrl} className="w-full h-full object-cover" alt="" /> : `${selectedAdvance.employee?.firstName?.[0] ?? ''}${selectedAdvance.employee?.lastName?.[0] ?? ''}`}
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900 dark:text-white">{selectedAdvance.employee?.firstName} {selectedAdvance.employee?.lastName}</h2>
                      <p className="text-sm text-gray-400">{selectedAdvance.employee?.position}{selectedAdvance.employee?.department ? ` · ${selectedAdvance.employee.department.name}` : ''}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 ${(ADVANCE_STATUS_CFG[selectedAdvance.status] ?? ADVANCE_STATUS_CFG.PENDING).cls}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${(ADVANCE_STATUS_CFG[selectedAdvance.status] ?? ADVANCE_STATUS_CFG.PENDING).dot}`} />
                      {(ADVANCE_STATUS_CFG[selectedAdvance.status] ?? ADVANCE_STATUS_CFG.PENDING).label}
                    </span>
                    <button onClick={() => setSelectedAdvanceId(null)} className="w-9 h-9 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 dark:hover:text-gray-200 transition-colors"><X size={18} /></button>
                  </div>
                </div>

                <div className="p-6 space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <DetailTile icon={Banknote} label="Montant" value={`${Number(selectedAdvance.amount).toLocaleString('fr-FR')} FCFA`} tone="slate" />
                    <DetailTile icon={Wallet} label="Déduction prévue" value={`${MONTH_LABELS[selectedAdvance.deductMonth - 1]} ${selectedAdvance.deductYear}`} tone="sky" />
                  </div>

                  {Number(selectedAdvance.amount) > 0 && ['APPROVED', 'PAID', 'DEDUCTED'].includes(selectedAdvance.status) && (
                    <div>
                      <div className="flex items-center justify-between text-xs text-gray-400 mb-1.5">
                        <span>Progression du remboursement</span>
                        <span className="font-semibold text-gray-600 dark:text-gray-300">
                          {Math.round(((Number(selectedAdvance.amount) - Number(selectedAdvance.remainingBalance ?? 0)) / Number(selectedAdvance.amount)) * 100)}%
                        </span>
                      </div>
                      <div className="h-2.5 rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full transition-all"
                          style={{ width: `${Math.min(100, Math.round(((Number(selectedAdvance.amount) - Number(selectedAdvance.remainingBalance ?? 0)) / Number(selectedAdvance.amount)) * 100))}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {selectedAdvance.reason && <div className="text-sm"><p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Motif</p><p className="text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700/40 p-3 rounded-xl">{selectedAdvance.reason}</p></div>}

                  {selectedAdvance.status === 'PENDING' && DRH_ROLES.includes(userRole) && (
                    <div className="space-y-2 pt-2 border-t border-gray-100 dark:border-gray-700">
                      {!rejectMode ? (
                        <>
                          <div>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Remboursement</p>
                            <div className="grid grid-cols-2 gap-2">
                              <button
                                type="button"
                                onClick={() => setRecoverViaPayroll(true)}
                                className={`px-3 py-2 rounded-xl border-2 text-xs font-bold transition-all ${recoverViaPayroll ? 'border-sky-500 bg-sky-50 dark:bg-sky-900/20 text-sky-700 dark:text-sky-300' : 'border-gray-200 dark:border-gray-600 text-gray-500'}`}
                              >
                                Sur la paie
                              </button>
                              <button
                                type="button"
                                onClick={() => setRecoverViaPayroll(false)}
                                className={`px-3 py-2 rounded-xl border-2 text-xs font-bold transition-all ${!recoverViaPayroll ? 'border-sky-500 bg-sky-50 dark:bg-sky-900/20 text-sky-700 dark:text-sky-300' : 'border-gray-200 dark:border-gray-600 text-gray-500'}`}
                              >
                                En espèces
                              </button>
                            </div>
                          </div>
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
                    <button onClick={() => setTimeout(() => printLoanDocument(PRINT_ID), 50)} className="flex-1 py-2.5 border border-gray-200 dark:border-gray-700 text-sm font-semibold rounded-xl text-gray-600 dark:text-gray-300 flex items-center justify-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-700"><Printer size={16} /> Imprimer</button>
                    {docData?.company?.documentTemplate === 'ORCA' ? (
                      <button onClick={handleDownloadOrcaXlsx} disabled={isExportingXlsx} className="flex-1 py-2.5 border border-gray-200 dark:border-gray-700 text-sm font-semibold rounded-xl text-gray-600 dark:text-gray-300 flex items-center justify-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40">{isExportingXlsx ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />} Fiche Excel</button>
                    ) : (
                      <button onClick={handleDownloadPdf} disabled={isExportingPdf} className="flex-1 py-2.5 border border-gray-200 dark:border-gray-700 text-sm font-semibold rounded-xl text-gray-600 dark:text-gray-300 flex items-center justify-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40">{isExportingPdf ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />} PDF</button>
                    )}
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
            </div>
          )}
        </div>
      )}

      {/* ══════════════════ RETENUES DIVERSES ══════════════════ */}
      {tab === 'deductions' && (
        <div className="space-y-4">
          {/* Synthèse globale — toujours en haut, quelle que soit la vue */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-sky-50 dark:bg-sky-900/30 text-sky-600 flex items-center justify-center shrink-0"><Receipt size={18} /></div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total retenues</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white">{dedGlobalStats.total.toLocaleString('fr-FR')} FCFA</p>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-900/30 text-amber-600 flex items-center justify-center shrink-0"><Wallet size={18} /></div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Solde global restant</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white">{dedGlobalStats.remaining.toLocaleString('fr-FR')} FCFA</p>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-violet-50 dark:bg-violet-900/30 text-violet-600 flex items-center justify-center shrink-0"><Users size={18} /></div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Employés concernés</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white">{dedGlobalStats.employeeCount}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-sky-50 dark:bg-sky-900/30 text-sky-600 flex items-center justify-center shrink-0"><Plus size={18} /></div>
              <div>
                <p className="font-bold text-sm text-gray-900 dark:text-white">Nouvelle retenue</p>
                <p className="text-xs text-gray-400">Pharmacie, cantine, casse matériel, ou tout autre motif</p>
              </div>
            </div>

            <div className="p-5 grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Colonne gauche : qui / quoi / combien / quand */}
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">Employé</label>
                  <select value={newDeduction.employeeId} onChange={e => setNewDeduction({ ...newDeduction, employeeId: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-900 text-sm">
                    <option value="">Sélectionner un employé…</option>
                    {employeesList.map(e => <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">Libellé</label>
                    <input value={newDeduction.label} onChange={e => setNewDeduction({ ...newDeduction, label: e.target.value })} placeholder="Ex : Pharmacie" className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-900 text-sm" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">Montant total</label>
                    <div className="relative">
                      <input type="number" value={newDeduction.amount} onChange={e => setNewDeduction({ ...newDeduction, amount: e.target.value })} placeholder="0" className="w-full pl-3 pr-14 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-900 text-sm" />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-semibold pointer-events-none">FCFA</span>
                    </div>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5"><Calendar size={12} /> Période de référence</label>
                  <div className="grid grid-cols-2 gap-3">
                    <select value={newDeduction.month} onChange={e => setNewDeduction({ ...newDeduction, month: Number(e.target.value) })} className="px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-900 text-sm">
                      {MONTH_LABELS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
                    </select>
                    <select value={newDeduction.year} onChange={e => setNewDeduction({ ...newDeduction, year: Number(e.target.value) })} className="px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-900 text-sm">
                      {dedAvailableYears.map((y: any) => <option key={y} value={y}>{y}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              {/* Colonne droite : comment ça se règle */}
              <div className="space-y-4 lg:border-l lg:border-gray-100 dark:lg:border-gray-700 lg:pl-6">
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">Mode de prélèvement</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setNewDeduction({ ...newDeduction, recoverViaPayroll: true })}
                      className={`px-3 py-3 rounded-xl border-2 text-xs font-bold transition-all flex flex-col items-center gap-1.5 ${newDeduction.recoverViaPayroll ? 'border-sky-500 bg-sky-50 dark:bg-sky-900/20 text-sky-700 dark:text-sky-300' : 'border-gray-200 dark:border-gray-600 text-gray-500'}`}
                    >
                      <CreditCard size={18} /> Sur la paie
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewDeduction({ ...newDeduction, recoverViaPayroll: false })}
                      className={`px-3 py-3 rounded-xl border-2 text-xs font-bold transition-all flex flex-col items-center gap-1.5 ${!newDeduction.recoverViaPayroll ? 'border-sky-500 bg-sky-50 dark:bg-sky-900/20 text-sky-700 dark:text-sky-300' : 'border-gray-200 dark:border-gray-600 text-gray-500'}`}
                    >
                      <Banknote size={18} /> En espèces
                    </button>
                  </div>
                </div>

                {newDeduction.recoverViaPayroll ? (
                  <div>
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">Montant retiré par mois</label>
                    <div className="relative mb-2">
                      <input
                        type="number"
                        value={newDeduction.monthlyDeduction}
                        onChange={e => setNewDeduction({ ...newDeduction, monthlyDeduction: e.target.value })}
                        placeholder="Laisser vide = tout en une fois"
                        className="w-full pl-3 pr-14 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-900 text-sm"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-semibold pointer-events-none">FCFA</span>
                    </div>
                    <div className="flex items-start gap-2 text-xs text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-900/20 border border-sky-100 dark:border-sky-900/40 rounded-xl p-3">
                      <Info size={14} className="shrink-0 mt-0.5" />
                      <span>Si renseigné, la paie ne retire que ce montant à chaque génération, jusqu'à ce que le solde soit épuisé — utile pour ne pas trop taper sur un petit salaire.</span>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-2 text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/40 border border-gray-100 dark:border-gray-700 rounded-xl p-3">
                    <Info size={14} className="shrink-0 mt-0.5" />
                    <span>Cette retenue ne sera jamais prélevée automatiquement sur la paie — vous l'enregistrerez manuellement au fur et à mesure des règlements en espèces.</span>
                  </div>
                )}

                <button onClick={handleAddDeduction} disabled={isAddingDeduction || !newDeduction.employeeId || !newDeduction.label || !newDeduction.amount} className="w-full py-3 bg-sky-500 hover:bg-sky-600 disabled:opacity-40 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2">
                  {isAddingDeduction ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />} Ajouter la retenue
                </button>
              </div>
            </div>
          </div>

          {/* Filtres — recherche + vue, avec libellés clairs pour que ce soit
              compréhensible sans avoir à deviner ce que fait chaque contrôle. */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4">
            <div className="flex flex-wrap items-end gap-3">
              <div className="flex-1 min-w-[220px]">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1 block">Rechercher un employé</label>
                <div className="relative">
                  <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input value={dedSearch} onChange={e => setDedSearch(e.target.value)} placeholder="Nom de l'employé…" className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-900 text-sm" />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1 block">Vue</label>
                <div className="flex rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                  <button onClick={() => setDedView('mensuelle')} className={`px-3 py-2 text-xs font-bold transition-colors ${dedView === 'mensuelle' ? 'bg-sky-500 text-white' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>Mensuelle</button>
                  <button onClick={() => setDedView('annuelle')} className={`px-3 py-2 text-xs font-bold transition-colors ${dedView === 'annuelle' ? 'bg-sky-500 text-white' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>Annuelle</button>
                </div>
              </div>
              {dedView === 'mensuelle' && (
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1 block">Mois</label>
                  <select value={dedMonth} onChange={e => setDedMonth(Number(e.target.value))} className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-900 text-sm">
                    {MONTH_LABELS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
                  </select>
                </div>
              )}
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1 block">Année</label>
                <select value={dedYear} onChange={e => setDedYear(Number(e.target.value))} className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-900 text-sm">
                  {dedAvailableYears.map((y: any) => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
            </div>
          </div>

          {dedView === 'mensuelle' ? (
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>{['Employé', 'Libellé', 'Solde restant', 'Mode', 'Statut', ''].map(h => <th key={h} className="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase">{h}</th>)}</tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {filteredDeductions.length === 0 ? (
                    <tr><td colSpan={6} className="text-center py-14 text-gray-400 text-sm">
                      <Receipt size={22} className="mx-auto mb-2 text-gray-300" />
                      Aucune retenue créée en {MONTH_LABELS[dedMonth - 1]} {dedYear}.
                    </td></tr>
                  ) : filteredDeductions.map((d: any) => {
                    const pct = Number(d.amount) > 0 ? Math.round(((Number(d.amount) - Number(d.remainingBalance)) / Number(d.amount)) * 100) : 0;
                    const initials = `${d.employee?.firstName?.[0] ?? ''}${d.employee?.lastName?.[0] ?? ''}`;
                    return (
                      <tr key={d.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-xs font-bold text-gray-500 overflow-hidden shrink-0">
                              {d.employee?.photoUrl ? <img src={d.employee.photoUrl} className="w-full h-full object-cover" alt="" /> : initials}
                            </div>
                            <p className="font-semibold text-gray-900 dark:text-white truncate">{d.employee?.firstName} {d.employee?.lastName}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-gray-700 dark:text-gray-200">{d.label}</p>
                          <p className="text-xs text-gray-400">
                            {Number(d.amount).toLocaleString('fr-FR')} FCFA total
                            {d.recoverViaPayroll && d.monthlyDeduction != null && ` · ${Number(d.monthlyDeduction).toLocaleString('fr-FR')} FCFA/mois`}
                          </p>
                        </td>
                        <td className="px-4 py-3 min-w-[140px]">
                          <p className={`font-semibold ${Number(d.remainingBalance) > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>{Number(d.remainingBalance).toLocaleString('fr-FR')} FCFA</p>
                          <div className="h-1.5 w-24 rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden mt-1">
                            <div className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full" style={{ width: `${Math.min(100, pct)}%` }} />
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2 py-1 rounded-md border ${d.recoverViaPayroll ? 'bg-sky-50 text-sky-700 border-sky-100 dark:bg-sky-900/20 dark:text-sky-300' : 'bg-violet-50 text-violet-700 border-violet-100 dark:bg-violet-900/20 dark:text-violet-300'}`}>
                            {d.recoverViaPayroll ? <CreditCard size={11} /> : <Banknote size={11} />} {d.recoverViaPayroll ? 'Sur la paie' : 'Espèces'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2 py-1 rounded-md border ${d.status === 'PENDING' ? 'bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-900/20 dark:text-amber-300' : d.status === 'CANCELLED' ? 'bg-gray-50 text-gray-500 border-gray-200 dark:bg-gray-800 dark:text-gray-400' : 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-300'}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${d.status === 'PENDING' ? 'bg-amber-500' : d.status === 'CANCELLED' ? 'bg-gray-400' : 'bg-emerald-500'}`} />
                            {d.status === 'PENDING' ? 'En attente' : d.status === 'CANCELLED' ? 'Annulée' : 'Soldée'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          {d.status === 'PENDING' && (
                            <div className="flex items-center justify-end gap-2">
                              <input
                                type="number"
                                value={dedCashAmounts[d.id] ?? ''}
                                onChange={e => setDedCashAmounts(prev => ({ ...prev, [d.id]: e.target.value }))}
                                placeholder="Montant"
                                className="w-24 px-2 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-900 text-xs"
                              />
                              <button onClick={() => handleCashRepaymentDeduction(d.id)} disabled={payingCashId === d.id || !dedCashAmounts[d.id]} className="text-emerald-600 hover:underline text-xs font-semibold disabled:opacity-40 disabled:no-underline whitespace-nowrap">
                                {payingCashId === d.id ? 'En cours…' : 'Régler'}
                              </button>
                              {Number(d.remainingBalance) === Number(d.amount) && (
                                <button onClick={() => handleDeleteDeduction(d.id)} className="text-red-500 hover:underline text-xs font-semibold">Supprimer</button>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase sticky left-0 bg-gray-50 dark:bg-gray-900">Employé</th>
                    {MONTH_LABELS.map((m, i) => (
                      <th key={m} className={`px-3 py-3 text-right text-xs font-bold uppercase ${i + 1 === new Date().getMonth() + 1 && dedYear === new Date().getFullYear() ? 'text-sky-600 bg-sky-50 dark:bg-sky-900/20 dark:text-sky-300' : 'text-gray-400'}`}>{m}</th>
                    ))}
                    <th className="px-4 py-3 text-right text-xs font-bold text-gray-400 uppercase">Total {dedYear}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {annualDeductions.length === 0 ? (
                    <tr><td colSpan={14} className="text-center py-14 text-gray-400 text-sm">
                      <Receipt size={22} className="mx-auto mb-2 text-gray-300" />
                      Aucune retenue pour {dedYear}.
                    </td></tr>
                  ) : annualDeductions.map(row => {
                    const initials = `${row.employee?.firstName?.[0] ?? ''}${row.employee?.lastName?.[0] ?? ''}`;
                    const remaining = row.total - row.paid;
                    return (
                      <tr key={row.employee?.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors">
                        <td className="px-4 py-3 sticky left-0 bg-white dark:bg-gray-800">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-[10px] font-bold text-gray-500 overflow-hidden shrink-0">
                              {row.employee?.photoUrl ? <img src={row.employee.photoUrl} className="w-full h-full object-cover" alt="" /> : initials}
                            </div>
                            <p className="font-semibold text-gray-900 dark:text-white whitespace-nowrap">{row.employee?.firstName} {row.employee?.lastName}</p>
                          </div>
                        </td>
                        {row.perMonth.map((v, i) => (
                          <td key={i} className={`px-3 py-3 text-right text-xs ${v > 0 ? 'text-gray-700 dark:text-gray-200 font-semibold bg-amber-50/50 dark:bg-amber-900/10' : 'text-gray-300 dark:text-gray-600'}`}>
                            {v > 0 ? v.toLocaleString('fr-FR') : '—'}
                          </td>
                        ))}
                        <td className="px-4 py-3 text-right">
                          <p className="font-bold text-gray-900 dark:text-white">{row.total.toLocaleString('fr-FR')} FCFA</p>
                          {remaining > 0 ? (
                            <p className="text-xs text-amber-600 font-semibold">{remaining.toLocaleString('fr-FR')} restants</p>
                          ) : (
                            <p className="text-xs text-emerald-600 font-semibold">Soldé</p>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
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