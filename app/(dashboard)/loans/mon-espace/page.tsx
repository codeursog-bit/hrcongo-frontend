'use client';

// ============================================================================
// 📁 app/(dashboard)/loans/mon-espace/page.tsx
// ✅ Historique complet (prêts + avances) de l'employé connecté — maître-détail
//    avec pagination, cohérent avec les autres modules (absences, permissions).
// ============================================================================

import { usesStandardData } from '@/lib/document-template';
import { debtRefDate } from '@/lib/debt-dates';
import React, { useEffect, useMemo, useState } from 'react';
import { useDocSignatures } from '@/hooks/useDocSignatures';
import {
  Plus, Loader2, Printer, Download, X, Lock, Eye,
} from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { RequestListPage, RequestStatusBadge, RequestTimeline } from '@/components/requests';
import { ListPage } from '@/components/templates';
import { Card, Button, EmptyState } from '@/components/design-system/primitives';
import { useToast } from '@/components/design-system/feedback';
import { LoanSpaceSkeleton, LoanSpaceKpi, LoanDebtChart } from '@/components/loans/LoanSpaceView';
import { requestStatus } from '@/lib/request-status';
import AmendmentTrace, { RequestedHint } from '@/components/loans/AmendmentTrace';
import { api } from '@/services/api';
import { sanitizeOrcaHtml } from '@/lib/sanitize-html';
import { useBasePath } from '@/hooks/useBasePath';
import FinanceSubNav from '@/components/FinanceSubNav';
import LoanRequestPrintable from '@/components/LoanRequestPrintable';
import { AdvanceRequestDocument, LoanRequestDocument } from '@/components/documents/RequestDocuments';
import { printLoanDocument, downloadLoanDocumentPDF } from '@/lib/loan-print';
import DocumentPreviewModal from '@/components/loans/DocumentPreviewModal';
import ContactAdminButton from '@/components/chat/ContactAdminButton';

const NATURE_LABEL: Record<string, string> = { SOCIAL: 'Prêt social', SCOLARITE: 'Prêt scolarité', LOGEMENT: 'Prêt logement', EXCEPTIONNEL: 'Prêt exceptionnel', AUTRE: 'Autre' };
const PAGE_SIZE = 10;

type Item = { kind: 'loan' | 'advance'; id: string; data: any };

export default function MonEspacePretsAvancesPage() {
  const { bp } = useBasePath();
  const router = useRouter();
  const toast = useToast();
  const reduceMotion = useReducedMotion();
  const [loadError, setLoadError] = useState('');
  const [userRole, setUserRole] = useState('');
  const [employee, setEmployee] = useState<any>(null);
  const [company, setCompany] = useState<any>(null);
  const [loans, setLoans] = useState<any[]>([]);
  const [advances, setAdvances] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [mySpaceTab, setMySpaceTab] = useState<'validations' | 'suivi'>('validations');
  const [historyByLoan, setHistoryByLoan] = useState<Record<string, any[]>>({});

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

        const relevant = (l || []).filter((x: any) => ['ACTIVE', 'PAID'].includes(x.status));
        const histories = await Promise.all(relevant.map((x: any) => api.get(`/loans/${x.id}/history`).catch(() => [])));
        const map: Record<string, any[]> = {};
        relevant.forEach((x: any, i: number) => { map[x.id] = histories[i] || []; });
        setHistoryByLoan(map);
      } catch (e) { console.error('Erreur chargement de mes prêts/avances', e); setLoadError('Vos demandes n’ont pas pu être chargées. Réessayez dans un instant.'); }
      finally { setIsLoading(false); }
    })();
  }, []);

  const items: Item[] = useMemo(() => {
    const l = loans.map(x => ({ kind: 'loan' as const, id: x.id, data: x }));
    const a = advances.map(x => ({ kind: 'advance' as const, id: x.id, data: x }));
    return [...l, ...a].sort((x, y) => new Date(y.data.createdAt).getTime() - new Date(x.data.createdAt).getTime());
  }, [loans, advances]);

  const selected = items.find(i => i.id === selectedId) || null;
  const [docData, setDocData] = useState<any>(null);
  const [orcaHtml, setOrcaHtml] = useState<string | null>(null);
  // ✅ LOT D — signatures personnelles des avis, pour les documents imprimables
  const docSignatures = useDocSignatures(selected?.kind, selected?.id);

  useEffect(() => {
    if (!selected) { setDocData(null); setOrcaHtml(null); return; }
    (async () => {
      try {
        const path = selected.kind === 'loan'
          ? `/loans/${selected.id}/document-data`
          : `/loans/advances/${selected.id}/document-data`;
        const data = await api.get(path);
        setDocData(data);
        if ((data as any)?.company?.documentTemplate === 'ORCA') {
          const htmlPath = selected.kind === 'loan' ? `/loans/${selected.id}/document/orca-html` : `/loans/advances/${selected.id}/document/orca-html`;
          const res: any = await api.get(htmlPath);
          setOrcaHtml(sanitizeOrcaHtml(res?.html));
        } else {
          setOrcaHtml(null);
        }
      } catch (e) {
        console.error('Erreur chargement document-data', e);
        setDocData(null); setOrcaHtml(null);
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
      toast('success', 'Demande annulée');
    } catch (e: any) { alert(e?.message || "Erreur lors de l'annulation"); }
    finally { setBusy(null); }
  };

  const PRINT_ID = 'my-loan-print';
  const reference = selected ? `${selected.kind === 'loan' ? 'PR' : 'AV'}-${selected.id.slice(0, 8).toUpperCase()}` : '';

  const printData = selected ? {
    reference,
    company: { legalName: company?.legalName, tradeName: company?.tradeName, logo: company?.logo, rccmNumber: company?.rccmNumber, taxNumber: company?.taxNumber, address: company?.address, phone: company?.phone, cachetUrl: company?.cachetUrl, documentFooterText: company?.documentFooterText },
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
    signatures: docSignatures,
  } : null;

  const isStandard = usesStandardData(docData?.company?.documentTemplate);
  const standardLoanData = docData && selected?.kind === 'loan' ? {
    reference,
    company: docData.company,
    employee: docData.employee,
    nature: docData.nature,
    amount: docData.amount,
    durationMonths: docData.monthlyRepayment ? Math.ceil(Number(docData.amount) / Number(docData.monthlyRepayment)) : undefined,
    recoverViaPayroll: docData.recoverViaPayroll,
    reason: docData.reason,
    requestedAt: docData.createdAt,
    drhDecision: docData.drhDecision,
    dgDecision: docData.dgDecision,
    status: docData.status,
    monthlyRepayment: docData.monthlyRepayment,
    attachmentUrl: docData.attachmentUrl,
    signatures: docSignatures,
  } : null;
  const standardAdvanceData = docData && selected?.kind === 'advance' ? {
    reference,
    company: docData.company,
    employee: docData.employee,
    amount: docData.amount,
    month: docData.deductMonth,
    year: docData.deductYear,
    recoverViaPayroll: docData.recoverViaPayroll,
    reason: docData.reason,
    requestedAt: docData.createdAt,
    status: docData.status,
    signatures: docSignatures,
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

  // ── KPI "Validations" : nombre de demandes, validées, en attente, montant total demandé ──
  const myRequestKpis = useMemo(() => {
    const notCounted = ['REJECTED', 'CANCELLED'];
    const total = items.length;
    const validated = items.filter(i => ['ACTIVE', 'PAID', 'APPROVED', 'DEDUCTED'].includes(i.data.status)).length;
    const pending = items.filter(i => ['PENDING', 'PENDING_DG'].includes(i.data.status)).length;
    const totalAmount = items.filter(i => !notCounted.includes(i.data.status)).reduce((s, i) => s + Number(i.data.amount), 0);
    return { total, validated, pending, totalAmount };
  }, [items]);

  // ── Courbe "Suivi" : emprunté vs remboursé, 12 derniers mois ─────────────
  const MONTHS_FR = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
  const trendData = useMemo(() => {
    const months: { key: string; label: string; year: number; month: number }[] = [];
    // Fenêtre de 12 mois qui se termine au mois le plus récent (aujourd'hui ou
    // dernier mouvement programmé/remboursé) — plus figée sur la date du jour.
    const now0 = new Date();
    let latest = now0.getFullYear() * 12 + now0.getMonth();
    items.forEach(i => { const d = debtRefDate(i.data, i.kind); latest = Math.max(latest, d.getFullYear() * 12 + d.getMonth()); });
    Object.values(historyByLoan).flat().forEach((log: any) => { latest = Math.max(latest, log.year * 12 + (log.month - 1)); });
    for (let i = 11; i >= 0; i--) {
      const idx = latest - i;
      const d = new Date(Math.floor(idx / 12), idx % 12, 1);
      months.push({ key: `${d.getFullYear()}-${d.getMonth() + 1}`, label: `${MONTHS_FR[d.getMonth()]} ${String(d.getFullYear()).slice(2)}`, year: d.getFullYear(), month: d.getMonth() + 1 });
    }
    const allLogs = Object.values(historyByLoan).flat();
    return months.map(m => {
      const emprunte = items.filter(i => { const d = debtRefDate(i.data, i.kind); return d.getFullYear() === m.year && d.getMonth() + 1 === m.month; }).reduce((s, i) => s + Number(i.data.amount), 0);
      const rembourse = allLogs.filter((log: any) => log.year === m.year && log.month === m.month).reduce((s: number, log: any) => s + Number(log.amount), 0);
      return { mois: m.label, Emprunté: Math.round(emprunte), Remboursé: Math.round(rembourse) };
    });
  }, [items, historyByLoan]);

  if (isLoading) return <LoanSpaceSkeleton />;
  const navigation = <div className="template-stack"><FinanceSubNav userRole={userRole} /><div className="loan-space-mode" role="group" aria-label="Vue de mon espace"><button type="button" aria-pressed={mySpaceTab === 'validations'} onClick={() => setMySpaceTab('validations')}>Mes demandes</button><button type="button" aria-pressed={mySpaceTab === 'suivi'} onClick={() => setMySpaceTab('suivi')}>Suivi de mes dettes</button></div></div>;
  const create = () => router.push(bp('/loans/nouveau'));
  return <div className="loan-space">
    {mySpaceTab === 'validations' ? <RequestListPage title="Mes demandes de prêts et avances" description="Retrouvez vos demandes, leurs décisions et leur suivi." navigation={navigation} onCreate={create} pageSize={PAGE_SIZE} error={loadError}
      summary={<div className="loan-space-kpis"><LoanSpaceKpi label="Total de mes demandes" value={myRequestKpis.total} isCount /><LoanSpaceKpi label="Validées" value={myRequestKpis.validated} isCount tone="success" /><LoanSpaceKpi label="En attente" value={myRequestKpis.pending} isCount tone="warning" /><LoanSpaceKpi label="Montant total demandé" value={myRequestKpis.totalAmount} /></div>}
      items={items.map(item => ({ id: item.id, title: item.kind === 'loan' ? 'Prêt ' + (item.data.type || '').toLowerCase() : 'Avance sur salaire', summary: Number(item.data.amount).toLocaleString('fr-FR') + ' FCFA', date: debtRefDate(item.data, item.kind).toLocaleDateString('fr-FR'), status: item.data.status, href: '#demande-selectionnee', onView: () => { setSelectedId(item.id); requestAnimationFrame(() => document.getElementById('demande-selectionnee')?.focus()); } }))}>
      <div id="demande-selectionnee" tabIndex={-1} className="template-stack">
        {!selected ? <Card><EmptyState title="Ouvrez une demande pour la consulter">Son montant, sa décision et les actions disponibles apparaîtront ici.</EmptyState></Card> : <>
              <motion.div key={selected.id} initial={reduceMotion ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="loan-space-detail">
                <div className="loan-space-detail-header">
                  <div>
                    <h2 className="text-lg font-bold text-[var(--text)]">{selected.kind === 'loan' ? `Prêt ${(selected.data.type || '').toLowerCase()}` : 'Avance sur salaire'}</h2>
                    <p className="text-sm text-[var(--text-secondary)]">Demandé le {new Date(selected.data.createdAt).toLocaleDateString('fr-FR')}</p>
                  </div>
                  <RequestStatusBadge status={selected.data.status} />
                </div>

                <div className="loan-space-detail-body template-stack">
                  <div className="template-stack">
                    <div className="loan-space-info"><p className="text-[11px] text-[var(--text-secondary)]">Montant</p><p className="font-bold text-[var(--text)]">{Number(selected.data.amount).toLocaleString('fr-FR')} FCFA</p><div className="loan-space-hint"><RequestedHint item={selected.data} /></div></div>
                    <div className="loan-space-amendment"><AmendmentTrace item={selected.data} audience="employee" /></div>
                    {selected.kind === 'loan' && (
                      <div className="loan-space-info"><p className="text-[11px] text-[var(--text-secondary)]">Solde restant</p><p className="font-bold text-[var(--text)]">{Number(selected.data.remainingBalance).toLocaleString('fr-FR')} FCFA</p></div>
                    )}
                    {selected.kind === 'loan' && selected.data.nature && (
                      <div className="loan-space-info"><p className="text-[11px] text-[var(--text-secondary)]">Nature</p><p className="font-bold text-[var(--text)]">{NATURE_LABEL[selected.data.nature] || selected.data.nature}</p></div>
                    )}
                    <div className="loan-space-info"><p className="text-[11px] text-[var(--text-secondary)]">Mode de remboursement</p><p className="font-bold text-[var(--text)]">{selected.data.recoverViaPayroll ? 'Sur la paie' : 'Espèces'}</p></div>
                    {selected.data.reason && <div className="text-sm"><p className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">Motif</p><p className="text-[var(--text-secondary)] bg-[var(--surface-2)] p-3 rounded-xl">{selected.data.reason}</p></div>}
                    {selected.data.status === 'REJECTED' && selected.data.rejectionReason && (
                      <div className="text-sm text-[var(--danger-text)] bg-[var(--surface-2)] bg-[var(--surface-2)] p-3 rounded-xl">Motif du refus : {selected.data.rejectionReason}</div>
                    )}

                    {/* 💬 En attente / refusé : l'employé peut contacter l'administration pour s'expliquer.
                        Qui a refusé : prêt → drhDecidedBy (approvedBy n'est rempli que pour un accord) ; avance → rejectedBy. */}
                    <ContactAdminButton
                      className="loan-space-contact"
                      status={selected.data.status}
                      decidedByUserId={selected.kind === 'loan' ? (selected.data.drhDecidedBy ?? selected.data.dgDecidedBy) : selected.data.rejectedBy}
                      requestLabel={selected.kind === 'loan'
                        ? `ma demande de prêt de ${Number(selected.data.amount).toLocaleString('fr-FR')} FCFA`
                        : `ma demande d'avance sur salaire de ${Number(selected.data.amount).toLocaleString('fr-FR')} FCFA`}
                    />

                    <div className="flex gap-2 pt-1 flex-wrap">
                      {['PENDING', 'PENDING_DG'].includes(selected.data.status) && (
                        <Button variant="secondary" onClick={() => handleCancel(selected)} disabled={busy === selected.id} className="flex-1 py-2.5 border border-[var(--border)] bg-[var(--surface-2)] text-[var(--danger-text)] text-[var(--text-secondary)] text-sm font-semibold rounded-xl flex items-center justify-center gap-2 disabled:opacity-40">
                          {busy === selected.id ? <Loader2 strokeWidth={1.5} size={16} className="animate-spin" /> : <X size={16} />} Annuler la demande
                        </Button>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {selected.data.printAuthorized ? (
                        <>
                          {/* Impression 100% côté navigateur, aucune dépendance serveur — marche pour Orca comme pour les autres */}
                          <Button variant="secondary" onClick={() => setTimeout(() => printLoanDocument(PRINT_ID), 50)} className="flex-1 py-2.5 border border-[var(--border)] text-sm font-semibold rounded-xl text-[var(--text-secondary)] flex items-center justify-center gap-2 hover:bg-[var(--surface-2)]"><Printer strokeWidth={1.5} size={16} /> Imprimer</Button>
                          {docData?.company?.documentTemplate === 'ORCA' ? (
                            <Button variant="secondary" onClick={handleDownloadOrcaXlsx} disabled={isExportingXlsx} className="flex-1 py-2.5 border border-[var(--border)] text-sm font-semibold rounded-xl text-[var(--text-secondary)] flex items-center justify-center gap-2 hover:bg-[var(--surface-2)] disabled:opacity-40">{isExportingXlsx ? <Loader2 strokeWidth={1.5} size={16} className="animate-spin" /> : <Download strokeWidth={1.5} size={16} />} Fiche Excel</Button>
                          ) : (
                            <Button variant="secondary" onClick={handleDownloadPdf} disabled={isExportingPdf} className="flex-1 py-2.5 border border-[var(--border)] text-sm font-semibold rounded-xl text-[var(--text-secondary)] flex items-center justify-center gap-2 hover:bg-[var(--surface-2)] disabled:opacity-40">{isExportingPdf ? <Loader2 strokeWidth={1.5} size={16} className="animate-spin" /> : <Download strokeWidth={1.5} size={16} />} PDF</Button>
                          )}
                        </>
                      ) : (
                        <div className="flex-1 py-2.5 border border-dashed border-[var(--border)] text-xs font-semibold rounded-xl text-[var(--text-secondary)] flex items-center justify-center gap-2">
                          <Lock strokeWidth={1.5} size={14} /> Impression non autorisée par le RH
                        </div>
                      )}
                    </div>

                    {selected.data.printAuthorized && (
                      <Button variant="secondary" onClick={() => setShowPreviewModal(true)} className="w-full py-2.5 border border-dashed border-[var(--border)] text-sm font-semibold rounded-xl text-[var(--text-secondary)] flex items-center justify-center gap-2 hover:bg-[var(--surface-2)]">
                        <Eye strokeWidth={1.5} size={16} /> Aperçu de la fiche
                      </Button>
                    )}
                  </div>

                  {/* Rendu réel hors-écran : nécessaire pour la capture d'impression navigateur */}
                  <div className="fixed -left-[9999px] top-0 pointer-events-none" aria-hidden="true">
                    {docData?.company?.documentTemplate === 'ORCA' ? (
                      orcaHtml && <div id={PRINT_ID} dangerouslySetInnerHTML={{ __html: orcaHtml }} />
                    ) : isStandard ? (
                      selected.kind === 'loan'
                        ? standardLoanData && <LoanRequestDocument template={docData?.company?.documentTemplate} id={PRINT_ID} data={standardLoanData as any} />
                        : standardAdvanceData && <AdvanceRequestDocument template={docData?.company?.documentTemplate} id={PRINT_ID} data={standardAdvanceData as any} />
                    ) : (
                      printData && <LoanRequestPrintable id={PRINT_ID} data={printData as any} />
                    )}
                  </div>
                </div>
              </motion.div>
          <RequestTimeline events={[
            { id: 'sent', title: 'Envoyée', date: new Date(selected.data.createdAt).toLocaleDateString('fr-FR'), complete: true },
            ...docSignatures.map((opinion, index) => ({ id: 'opinion-' + index, title: 'Avis · ' + opinion.label, author: opinion.authorName, date: new Date(opinion.date).toLocaleDateString('fr-FR'), description: opinion.opinion === 'FAVORABLE' ? 'Favorable' : 'Défavorable', complete: true })),
            { id: 'decision', title: requestStatus(selected.data.status).label, description: ['PENDING', 'PENDING_DG'].includes(selected.data.status) ? 'Votre demande attend une décision de l’administration.' : selected.data.rejectionReason || undefined, complete: !['PENDING', 'PENDING_DG'].includes(selected.data.status) },
          ]} />
        </>}
      </div>
    </RequestListPage> : <ListPage title="Suivi de mes dettes" description="Montants et mouvements de vos prêts et avances." navigation={navigation} error={loadError} action={<Button onClick={create}><Plus size={17} strokeWidth={1.5} /> Nouvelle demande</Button>}>
      <div className="loan-space-kpis"><LoanSpaceKpi label="Montant dû (total)" value={myKpis.totalDue} /><LoanSpaceKpi label="Déjà remboursé" value={myKpis.totalPaid} tone="success" /><LoanSpaceKpi label="Reste à rembourser" value={myKpis.totalRemaining} tone="warning" /><LoanSpaceKpi label="Mensualité en cours" value={myKpis.monthlyLoad} /></div>
      <LoanDebtChart data={trendData} />
      <Card title="Historique complet">{!items.length ? <EmptyState title="Vos remboursements apparaîtront ici">Vous n’avez pas encore de prêt ou d’avance dans cet espace.</EmptyState> : <ul className="request-list">{items.map(item => <li key={item.id} className="request-card"><div><h3>{debtRefDate(item.data, item.kind).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })} · {item.kind === 'loan' ? 'Prêt ' + (item.data.type || '').toLowerCase() : 'Avance sur salaire'} · {Number(item.data.amount).toLocaleString('fr-FR')} FCFA</h3>{item.data.reason && <p>{item.data.reason}</p>}</div><RequestStatusBadge status={item.data.status} /></li>)}</ul>}</Card>
    </ListPage>}
      <DocumentPreviewModal open={showPreviewModal} onClose={() => setShowPreviewModal(false)}>
        {selected && docData && (
          docData.company?.documentTemplate === 'ORCA' ? (
            orcaHtml && <div dangerouslySetInnerHTML={{ __html: orcaHtml }} />
          ) : isStandard ? (
            selected.kind === 'loan'
              ? standardLoanData && <LoanRequestDocument template={docData?.company?.documentTemplate} id="my-doc-preview" data={standardLoanData as any} />
              : standardAdvanceData && <AdvanceRequestDocument template={docData?.company?.documentTemplate} id="my-doc-preview" data={standardAdvanceData as any} />
          ) : (
            printData && <LoanRequestPrintable id="my-doc-preview" data={printData as any} />
          )
        )}
      </DocumentPreviewModal>
  </div>;
}
