'use client';

// ============================================================================
// 📁 app/(dashboard)/loans/mon-espace/page.tsx
// ✅ Historique complet (prêts + avances) de l'employé connecté — maître-détail
//    avec pagination, cohérent avec les autres modules (absences, permissions).
// ============================================================================

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Plus, Loader2, Clock, CheckCircle2, XCircle, Ban, ArrowRight,
  Printer, Download, X, Banknote, Package, HelpCircle, Wallet, Lock, Eye,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { api } from '@/services/api';
import { useBasePath } from '@/hooks/useBasePath';
import FinanceSubNav from '@/components/FinanceSubNav';
import LoanRequestPrintable from '@/components/LoanRequestPrintable';
import OrcaLoanDocument from '@/components/documents/orca/OrcaLoanDocument';
import OrcaAdvanceDocument from '@/components/documents/orca/OrcaAdvanceDocument';
import { printLoanDocument, downloadLoanDocumentPDF } from '@/lib/loan-print';
import DocumentPreviewModal from '@/components/loans/DocumentPreviewModal';

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
  PAID:      { label: 'Payée (espèces)', cls: 'bg-sky-50 text-sky-700 border-sky-100 dark:bg-sky-900/20 dark:text-sky-300', icon: CheckCircle2 },
  DEDUCTED:  { label: 'Déduite',    cls: 'bg-sky-50 text-sky-700 border-sky-100 dark:bg-sky-900/20 dark:text-sky-300', icon: CheckCircle2 },
  REJECTED:  { label: 'Refusée',    cls: 'bg-red-50 text-red-700 border-red-100 dark:bg-red-900/20 dark:text-red-300', icon: XCircle },
  CANCELLED: { label: 'Annulée',    cls: 'bg-gray-50 text-gray-500 border-gray-200 dark:bg-gray-800 dark:text-gray-400', icon: Ban },
};

const TYPE_ICON: Record<string, any> = { ARGENT: Banknote, MARCHANDISE: Package, AUTRE: HelpCircle };
const PAGE_SIZE = 10;

type Item = { kind: 'loan' | 'advance'; id: string; data: any };

export default function MonEspacePretsAvancesPage() {
  const { bp } = useBasePath();
  const [userRole, setUserRole] = useState('');
  const [employee, setEmployee] = useState<any>(null);
  const [company, setCompany] = useState<any>(null);
  const [loans, setLoans] = useState<any[]>([]);
  const [advances, setAdvances] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [busy, setBusy] = useState<string | null>(null);
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('user');
      if (stored) setUserRole(JSON.parse(stored).role || '');
    } catch {}
    (async () => {
      try {
        const [l, a, emp, me]: any = await Promise.all([
          api.get('/loans/me'),
          api.get('/loans/advances/me'),
          api.get('/employees/me').catch(() => null),
          api.get('/auth/me').catch(() => null),
        ]);
        setLoans(l || []);
        setAdvances(a || []);
        setEmployee(emp);
        setCompany(me?.company ?? null);
      } catch (e) { console.error('Erreur chargement de mes prêts/avances', e); }
      finally { setIsLoading(false); }
    })();
  }, []);

  const items: Item[] = useMemo(() => {
    const l = loans.map(x => ({ kind: 'loan' as const, id: x.id, data: x }));
    const a = advances.map(x => ({ kind: 'advance' as const, id: x.id, data: x }));
    return [...l, ...a].sort((x, y) => new Date(y.data.createdAt).getTime() - new Date(x.data.createdAt).getTime());
  }, [loans, advances]);

  const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
  const paginated = items.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const selected = items.find(i => i.id === selectedId) || null;
  const [docData, setDocData] = useState<any>(null);

  useEffect(() => {
    if (!selected) { setDocData(null); return; }
    (async () => {
      try {
        const path = selected.kind === 'loan'
          ? `/loans/${selected.id}/document-data`
          : `/loans/advances/${selected.id}/document-data`;
        setDocData(await api.get(path));
      } catch (e) {
        console.error('Erreur chargement document-data', e);
        setDocData(null);
      }
    })();
  }, [selectedId]);

  const handleCancel = async (item: Item) => {
    if (!confirm('Annuler cette demande ?')) return;
    setBusy(item.id);
    try {
      if (item.kind === 'loan') await api.patch(`/loans/${item.id}/cancel`, {});
      else await api.patch(`/loans/advances/${item.id}/cancel`, {});
      const refresh = item.kind === 'loan' ? await api.get('/loans/me') : await api.get('/loans/advances/me');
      if (item.kind === 'loan') setLoans(refresh as any); else setAdvances(refresh as any);
    } catch (e: any) { alert(e?.message || "Erreur lors de l'annulation"); }
    finally { setBusy(null); }
  };

  const PRINT_ID = 'my-loan-print';
  const reference = selected ? `${selected.kind === 'loan' ? 'PR' : 'AV'}-${selected.id.slice(0, 8).toUpperCase()}` : '';

  const printData = selected ? {
    reference,
    company: { legalName: company?.legalName, tradeName: company?.tradeName, logo: company?.logo, rccmNumber: company?.rccmNumber, taxNumber: company?.taxNumber, address: company?.address, phone: company?.phone },
    employee: { firstName: employee?.firstName || '', lastName: employee?.lastName || '', position: employee?.position, phone: employee?.phone, departmentName: employee?.department?.name },
    docType: selected.kind === 'loan' ? selected.data.type : 'AVANCE',
    reason: selected.data.reason,
    amount: selected.data.amount,
    requestedAt: selected.data.createdAt,
    monthlyRepayment: selected.kind === 'loan' ? selected.data.monthlyRepayment : undefined,
    durationMonths: selected.kind === 'loan' ? Math.ceil(Number(selected.data.amount) / Number(selected.data.monthlyRepayment)) : undefined,
    status: selected.data.status,
    drhDecision: selected.kind === 'loan' ? selected.data.drhDecision : undefined,
    dgDecision: selected.kind === 'loan' ? selected.data.dgDecision : undefined,
    chefDecision: selected.kind === 'advance' ? (['APPROVED', 'DEDUCTED', 'PAID'].includes(selected.data.status) ? 'OUI' : selected.data.status === 'REJECTED' ? 'NON' : null) : undefined,
  } : null;

  const handleDownloadPdf = async () => {
    setIsExportingPdf(true);
    try { await downloadLoanDocumentPDF(PRINT_ID, `${selected?.kind === 'loan' ? 'pret' : 'avance'}-${reference}.pdf`); }
    finally { setIsExportingPdf(false); }
  };

  const [isExportingXlsx, setIsExportingXlsx] = useState(false);
  const handleDownloadOrcaXlsx = async () => {
    if (!selected) return;
    setIsExportingXlsx(true);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const path = selected.kind === 'loan' ? `/loans/${selected.id}/document/orca-xlsx` : `/loans/advances/${selected.id}/document/orca-xlsx`;
      const res = await fetch(`${API_URL}${path}`, { credentials: 'include' });
      if (!res.ok) throw new Error('Échec du téléchargement de la fiche');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `${selected.kind === 'loan' ? 'pret' : 'avance'}-${reference}.xlsx`;
      document.body.appendChild(a); a.click(); a.remove();
      window.URL.revokeObjectURL(url);
    } catch (e: any) { alert(e?.message || 'Erreur lors du téléchargement'); }
    finally { setIsExportingXlsx(false); }
  };

  const [isPreparingPrint, setIsPreparingPrint] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const handlePrintOrcaPdf = async () => {
    if (!selected) return;
    setIsPreparingPrint(true);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const path = selected.kind === 'loan' ? `/loans/${selected.id}/document/orca-pdf` : `/loans/advances/${selected.id}/document/orca-pdf`;
      const res = await fetch(`${API_URL}${path}`, { credentials: 'include' });
      if (!res.ok) { const body = await res.json().catch(() => null); throw new Error(body?.message || 'Impression indisponible pour le moment'); }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');
    } catch (e: any) { alert(e?.message || "Erreur lors de la préparation de l'impression"); }
    finally { setIsPreparingPrint(false); }
  };

  // ── KPI de ma fiche dette (même logique que la fiche vue par le RH) ────────
  const myKpis = useMemo(() => {
    const dueLoans = loans.filter(l => ['ACTIVE', 'PAID'].includes(l.status));
    const dueAdvances = advances.filter(a => ['APPROVED', 'DEDUCTED', 'PAID'].includes(a.status));
    const totalDue = dueLoans.reduce((s, l) => s + Number(l.amount), 0) + dueAdvances.reduce((s, a) => s + Number(a.amount), 0);
    const paidLoans = dueLoans.reduce((s, l) => s + (Number(l.amount) - Number(l.remainingBalance)), 0);
    const paidAdvances = advances.filter(a => ['DEDUCTED', 'PAID'].includes(a.status)).reduce((s, a) => s + Number(a.amount), 0);
    const totalRemaining = loans.filter(l => l.status === 'ACTIVE').reduce((s, l) => s + Number(l.remainingBalance), 0)
      + advances.filter(a => a.status === 'APPROVED').reduce((s, a) => s + Number(a.amount), 0);
    const monthlyLoad = loans.filter(l => l.status === 'ACTIVE').reduce((s, l) => s + Number(l.monthlyRepayment), 0);
    return { totalDue, totalPaid: paidLoans + paidAdvances, totalRemaining, monthlyLoad };
  }, [loans, advances]);

  if (isLoading) return <div className="flex justify-center py-24"><Loader2 className="animate-spin text-sky-500" size={40} /></div>;

  return (
    <div className="max-w-[1500px] mx-auto pb-24 space-y-6">
      <FinanceSubNav userRole={userRole} />

      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-bold tracking-[0.2em] text-gray-400 uppercase mb-1">Mon espace</p>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Mes prêts & avances</h1>
        </div>
        <Link href={bp('/loans/nouveau')} className="px-4 py-2.5 bg-sky-500 hover:bg-sky-600 text-white rounded-xl font-bold text-sm flex items-center gap-2 shadow-lg shadow-sky-500/30">
          <Plus size={18} /> Nouvelle demande
        </Link>
      </div>

      {items.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <MyKpiCard label="Montant dû (total)" value={myKpis.totalDue} tone="slate" />
          <MyKpiCard label="Déjà payé" value={myKpis.totalPaid} tone="emerald" />
          <MyKpiCard label="Reste à payer" value={myKpis.totalRemaining} tone="amber" />
          <MyKpiCard label="Mensualité en cours" value={myKpis.monthlyLoad} tone="sky" />
        </div>
      )}

      {items.length === 0 ? (
        <div className="text-center py-24 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700">
          <Wallet size={32} className="text-gray-300 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Aucune demande pour l&apos;instant</h3>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-4 space-y-3">
            {paginated.map(item => {
              const isLoan = item.kind === 'loan';
              const cfg = isLoan ? (LOAN_STATUS_CFG[item.data.status] ?? LOAN_STATUS_CFG.PENDING) : (ADVANCE_STATUS_CFG[item.data.status] ?? ADVANCE_STATUS_CFG.PENDING);
              const Icon = isLoan ? (TYPE_ICON[item.data.type] || Banknote) : Wallet;
              const StatusIcon = cfg.icon;
              const active = item.id === selectedId;
              return (
                <button key={item.id} onClick={() => setSelectedId(item.id)} className={`w-full text-left p-4 rounded-2xl border transition-all ${active ? 'border-sky-400 bg-sky-50 dark:bg-sky-900/20 shadow-sm' : 'border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-200'}`}>
                  <div className="flex items-center gap-2">
                    <Icon size={14} className="text-gray-400" />
                    <p className="font-semibold text-sm text-gray-900 dark:text-white">{isLoan ? `Prêt ${item.data.type.toLowerCase()}` : 'Avance sur salaire'}</p>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">{Number(item.data.amount).toLocaleString('fr-FR')} FCFA · {new Date(item.data.createdAt).toLocaleDateString('fr-FR')}</p>
                  <span className={`inline-flex items-center gap-1 mt-2 text-[10px] font-semibold px-2 py-0.5 rounded-md border ${cfg.cls}`}><StatusIcon size={10} /> {cfg.label}</span>
                </button>
              );
            })}

            {items.length > PAGE_SIZE && (
              <div className="flex items-center justify-between pt-1">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-2 rounded-lg text-xs font-semibold border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 disabled:opacity-30">Précédent</button>
                <span className="text-xs text-gray-400">Page {page} / {totalPages}</span>
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-3 py-2 rounded-lg text-xs font-semibold border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 disabled:opacity-30">Suivant</button>
              </div>
            )}
          </div>

          <div className="lg:col-span-8">
            {!selected ? (
              <div className="h-full min-h-[300px] flex items-center justify-center bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 text-gray-400 text-sm">Sélectionnez une demande</div>
            ) : (
              <motion.div key={selected.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">{selected.kind === 'loan' ? `Prêt ${selected.data.type.toLowerCase()}` : 'Avance sur salaire'}</h2>
                    <p className="text-sm text-gray-400">Demandé le {new Date(selected.data.createdAt).toLocaleDateString('fr-FR')}</p>
                  </div>
                  <span className={`text-xs font-semibold px-3 py-1.5 rounded-lg border shrink-0 ${(selected.kind === 'loan' ? (LOAN_STATUS_CFG[selected.data.status] ?? LOAN_STATUS_CFG.PENDING) : (ADVANCE_STATUS_CFG[selected.data.status] ?? ADVANCE_STATUS_CFG.PENDING)).cls}`}>
                    {(selected.kind === 'loan' ? (LOAN_STATUS_CFG[selected.data.status] ?? LOAN_STATUS_CFG.PENDING) : (ADVANCE_STATUS_CFG[selected.data.status] ?? ADVANCE_STATUS_CFG.PENDING)).label}
                  </span>
                </div>

                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-700/40"><p className="text-[11px] text-gray-400">Montant</p><p className="font-bold text-gray-900 dark:text-white">{Number(selected.data.amount).toLocaleString('fr-FR')} FCFA</p></div>
                    {selected.kind === 'loan' && (
                      <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-700/40"><p className="text-[11px] text-gray-400">Solde restant</p><p className="font-bold text-gray-900 dark:text-white">{Number(selected.data.remainingBalance).toLocaleString('fr-FR')} FCFA</p></div>
                    )}
                    {selected.data.reason && <div className="text-sm"><p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Motif</p><p className="text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700/40 p-3 rounded-xl">{selected.data.reason}</p></div>}
                    {selected.data.status === 'REJECTED' && selected.data.rejectionReason && (
                      <div className="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 p-3 rounded-xl">Motif du refus : {selected.data.rejectionReason}</div>
                    )}

                    <div className="flex gap-2 pt-1 flex-wrap">
                      {['PENDING', 'PENDING_DG'].includes(selected.data.status) && (
                        <button onClick={() => handleCancel(selected)} disabled={busy === selected.id} className="flex-1 py-2.5 border border-gray-200 dark:border-gray-600 hover:bg-red-50 hover:text-red-600 text-gray-600 dark:text-gray-300 text-sm font-semibold rounded-xl flex items-center justify-center gap-2 disabled:opacity-40">
                          {busy === selected.id ? <Loader2 size={16} className="animate-spin" /> : <X size={16} />} Annuler
                        </button>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {selected.data.printAuthorized ? (
                        <>
                          {docData?.company?.documentTemplate === 'ORCA' ? (
                            <>
                              <button onClick={handlePrintOrcaPdf} disabled={isPreparingPrint} className="flex-1 py-2.5 border border-gray-200 dark:border-gray-700 text-sm font-semibold rounded-xl text-gray-600 dark:text-gray-300 flex items-center justify-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40">{isPreparingPrint ? <Loader2 size={16} className="animate-spin" /> : <Printer size={16} />} Imprimer</button>
                              <button onClick={handleDownloadOrcaXlsx} disabled={isExportingXlsx} className="flex-1 py-2.5 border border-gray-200 dark:border-gray-700 text-sm font-semibold rounded-xl text-gray-600 dark:text-gray-300 flex items-center justify-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40">{isExportingXlsx ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />} Fiche Excel</button>
                            </>
                          ) : (
                            <>
                              <button onClick={() => setTimeout(() => printLoanDocument(PRINT_ID), 50)} className="flex-1 py-2.5 border border-gray-200 dark:border-gray-700 text-sm font-semibold rounded-xl text-gray-600 dark:text-gray-300 flex items-center justify-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-700"><Printer size={16} /> Imprimer</button>
                              <button onClick={handleDownloadPdf} disabled={isExportingPdf} className="flex-1 py-2.5 border border-gray-200 dark:border-gray-700 text-sm font-semibold rounded-xl text-gray-600 dark:text-gray-300 flex items-center justify-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40">{isExportingPdf ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />} PDF</button>
                            </>
                          )}
                        </>
                      ) : (
                        <div className="flex-1 py-2.5 border border-dashed border-gray-200 dark:border-gray-700 text-xs font-semibold rounded-xl text-gray-400 flex items-center justify-center gap-2">
                          <Lock size={14} /> Impression non autorisée par le RH
                        </div>
                      )}
                    </div>

                    {selected.data.printAuthorized && (
                      <button onClick={() => setShowPreviewModal(true)} className="w-full py-2.5 border border-dashed border-gray-300 dark:border-gray-600 text-sm font-semibold rounded-xl text-gray-500 dark:text-gray-400 flex items-center justify-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-700">
                        <Eye size={16} /> Aperçu de la fiche
                      </button>
                    )}
                  </div>

                  {/* Rendu réel hors-écran : nécessaire pour la capture html2canvas (Imprimer/PDF) des clients non-Orca */}
                  <div className="fixed -left-[9999px] top-0 pointer-events-none" aria-hidden="true">
                    {docData?.company?.documentTemplate === 'ORCA' ? (
                      selected.kind === 'loan' ? (
                        <OrcaLoanDocument
                          id={PRINT_ID}
                          reference={reference}
                          loanType={docData.loanType}
                          employee={docData.employee}
                          amount={docData.amount}
                          monthlyRepayment={docData.monthlyRepayment}
                          startDate={docData.startDate}
                          endDate={selected.data.endDate}
                          status={docData.status}
                          drhDecision={docData.drhDecision}
                          dgDecision={docData.dgDecision}
                          company={docData.company}
                        />
                      ) : (
                        <OrcaAdvanceDocument
                          id={PRINT_ID}
                          reference={reference}
                          employee={docData.employee}
                          amount={docData.amount}
                          reason={selected.data.reason}
                          requestDate={selected.data.createdAt}
                          status={docData.status}
                          company={docData.company}
                        />
                      )
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

      <DocumentPreviewModal open={showPreviewModal} onClose={() => setShowPreviewModal(false)}>
        {selected && docData && (
          docData.company?.documentTemplate === 'ORCA' ? (
            selected.kind === 'loan' ? (
              <OrcaLoanDocument
                id="my-doc-preview"
                reference={reference}
                loanType={docData.loanType}
                employee={docData.employee}
                amount={docData.amount}
                monthlyRepayment={docData.monthlyRepayment}
                startDate={docData.startDate}
                endDate={selected.data.endDate}
                status={docData.status}
                drhDecision={docData.drhDecision}
                dgDecision={docData.dgDecision}
                company={docData.company}
              />
            ) : (
              <OrcaAdvanceDocument
                id="my-doc-preview"
                reference={reference}
                employee={docData.employee}
                amount={docData.amount}
                reason={selected.data.reason}
                requestDate={selected.data.createdAt}
                status={docData.status}
                company={docData.company}
              />
            )
          ) : (
            printData && <LoanRequestPrintable id="my-doc-preview" data={printData as any} />
          )
        )}
      </DocumentPreviewModal>
    </div>
  );
}

function MyKpiCard({ label, value, tone }: { label: string; value: number; tone: 'slate' | 'emerald' | 'amber' | 'sky' }) {
  const cls: Record<string, string> = {
    slate: 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-gray-100 dark:border-gray-700',
    emerald: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 border-emerald-100 dark:border-emerald-900',
    amber: 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 border-amber-100 dark:border-amber-900',
    sky: 'bg-sky-50 dark:bg-sky-900/20 text-sky-700 dark:text-sky-300 border-sky-100 dark:border-sky-900',
  };
  return (
    <div className={`rounded-2xl border p-4 ${cls[tone]}`}>
      <p className="text-[11px] font-semibold uppercase tracking-wide opacity-70 mb-1">{label}</p>
      <p className="text-lg font-bold">{Math.round(value).toLocaleString('fr-FR')} FCFA</p>
    </div>
  );
}