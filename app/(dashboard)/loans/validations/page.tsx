'use client';

// ============================================================================
// 📁 app/(dashboard)/loans/validations/page.tsx
// ✅ Page "Validations" — toutes les demandes (prêts + avances) de tout le
//    monde, KPI en tête, grille avec boutons Valider/Refuser visibles
//    directement sur chaque carte, et un clic ouvre une modal avec le détail
//    complet + décision + aperçu de fiche masqué par défaut (comme /loans).
// ============================================================================

import { usesStandardData } from '@/lib/document-template';
import React, { useEffect, useMemo, useState } from 'react';
import {
  Loader2, Check, X, Eye, Printer, Download, LayoutGrid, List,
} from 'lucide-react';
import { ListPage } from '@/components/templates';
import { Button, Card, EmptyState, Select, Skeleton } from '@/components/design-system/primitives';
import { useToast } from '@/components/design-system/feedback';
import { RequestStatusBadge, RequestDecisionPanel } from '@/components/requests';
import { requestStatus, requestTabs, type RequestGroup } from '@/lib/request-status';
import { LoanSpaceKpi } from '@/components/loans/LoanSpaceView';
import { LoanValidationChart } from '@/components/loans/LoanValidationCharts';
import '@/components/loans/loan-validations.css';
import { api } from '@/services/api';
import { sanitizeOrcaHtml } from '@/lib/sanitize-html';
import FinanceSubNav from '@/components/FinanceSubNav';
import LoanRequestPrintable from '@/components/LoanRequestPrintable';
import { AdvanceRequestDocument, LoanRequestDocument } from '@/components/documents/RequestDocuments';
import DocumentPreviewModal from '@/components/loans/DocumentPreviewModal';
import { printLoanDocument } from '@/lib/loan-print';
// ✅ LOT B — circuit d'avis (inactif tant que l'admin n'a rien configuré)
import ApprovalPanel from '@/components/approvals/ApprovalPanel';
import { useApprovalDecision } from '@/hooks/useApprovalDecision';
import { useDocSignatures } from '@/hooks/useDocSignatures';
import type { ApprovalStateView } from '@/services/approvals';

const DRH_ROLES = ['ADMIN', 'SUPER_ADMIN', 'HR_MANAGER'];
const TYPE_LABEL: Record<string, string> = { ARGENT: 'Prêt argent', MARCHANDISE: 'Marchandise', AUTRE: 'Autre prêt', AVANCE: 'Avance sur salaire' };
const NATURE_LABEL: Record<string, string> = { SOCIAL: 'Prêt social', SCOLARITE: 'Prêt scolarité', LOGEMENT: 'Prêt logement', EXCEPTIONNEL: 'Prêt exceptionnel', AUTRE: 'Autre' };
const fmt = (n: number) => Math.round(n).toLocaleString('fr-FR') + ' FCFA';

export default function ValidationsPage() {
  const toast = useToast();
  const [loadError, setLoadError] = useState('');
  const [loans, setLoans] = useState<any[]>([]);
  const [advances, setAdvances] = useState<any[]>([]);
  const [company, setCompany] = useState<any>(null);
  const [userRole, setUserRole] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const [statusFilter, setStatusFilter] = useState<RequestGroup>('all');
  const [typeFilter, setTypeFilter] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const [selected, setSelected] = useState<{ kind: 'loan' | 'advance'; item: any } | null>(null);
  const [docData, setDocData] = useState<any>(null);
  const [orcaHtml, setOrcaHtml] = useState<string | null>(null);
  const [rejectMode, setRejectMode] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [recoverViaPayroll, setRecoverViaPayroll] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [isExportingXlsx, setIsExportingXlsx] = useState(false);
  const [isPreparingPrint, setIsPreparingPrint] = useState(false);

  // ✅ LOT B — décision via l'orchestrateur (identique à avant si aucun circuit n'est configuré)
  const { decide, dialog: approvalDialog } = useApprovalDecision();
  const [approvalState, setApprovalState] = useState<ApprovalStateView | null>(null);
  const [panelKey, setPanelKey] = useState(0);
  const awaitingOpinions =
    !!approvalState?.pending &&
    ['WAITING_OPINIONS', 'NEEDS_CONFIRMATION'].includes(approvalState.pending.state);

  const load = async () => {
    try {
      setLoadError('');
      const [l, a, me]: any = await Promise.all([
        api.get('/loans'), api.get('/loans/advances'), api.get('/auth/me').catch(() => null),
      ]);
      setLoans(l || []); setAdvances(a || []); setCompany(me?.company ?? null);
    } catch (e) { console.error('Erreur chargement validations', e); setLoadError('Les demandes n’ont pas pu être chargées. Réessayez dans un instant.'); }
    finally { setIsLoading(false); }
  };

  useEffect(() => {
    try { const stored = localStorage.getItem('user'); if (stored) setUserRole(JSON.parse(stored).role || ''); } catch {}
    load();
  }, []);

  useEffect(() => { setApprovalState(null); }, [selected?.item?.id]);
  // ✅ LOT D — signatures personnelles des avis, pour les documents imprimables
  const docSignatures = useDocSignatures(selected?.kind, selected?.item?.id);

  useEffect(() => {
    if (!selected) { setDocData(null); setOrcaHtml(null); return; }
    (async () => {
      try {
        const path = selected.kind === 'loan' ? `/loans/${selected.item.id}/document-data` : `/loans/advances/${selected.item.id}/document-data`;
        const data = await api.get(path);
        setDocData(data);
        if ((data as any)?.company?.documentTemplate === 'ORCA') {
          const htmlPath = selected.kind === 'loan' ? `/loans/${selected.item.id}/document/orca-html` : `/loans/advances/${selected.item.id}/document/orca-html`;
          const res: any = await api.get(htmlPath);
          setOrcaHtml(sanitizeOrcaHtml(res?.html));
        } else {
          setOrcaHtml(null);
        }
      } catch { setDocData(null); setOrcaHtml(null); }
    })();
  }, [selected]);

  // ── Liste unifiée ──────────────────────────────────────────────────────
  const allRequests = useMemo(() => {
    const l = loans.map(x => ({ ...x, kind: 'loan' as const, requestType: x.type ?? 'ARGENT' }));
    const a = advances.map(x => ({ ...x, kind: 'advance' as const, requestType: 'AVANCE' }));
    return [...l, ...a].sort((x, y) => new Date(y.createdAt).getTime() - new Date(x.createdAt).getTime());
  }, [loans, advances]);

  const bucket = (status: string) => {
    if (['PENDING', 'PENDING_DG'].includes(status)) return 'PENDING';
    if (['REJECTED', 'CANCELLED'].includes(status)) return 'REJECTED';
    return 'VALIDATED';
  };

  const kpis = useMemo(() => ({
    total: allRequests.length,
    pending: allRequests.filter(r => bucket(r.status) === 'PENDING').length,
    validated: allRequests.filter(r => bucket(r.status) === 'VALIDATED').length,
    rejected: allRequests.filter(r => bucket(r.status) === 'REJECTED').length,
  }), [allRequests]);

  const departments = useMemo(() => Array.from(new Set(allRequests.map(r => r.employee?.department?.name).filter(Boolean))).sort(), [allRequests]);

  const filtered = useMemo(() => allRequests.filter(r =>
    (statusFilter === 'all' || requestStatus(r.status).group === statusFilter) &&
    (!typeFilter || r.requestType === typeFilter) &&
    (!deptFilter || r.employee?.department?.name === deptFilter),
  ), [allRequests, statusFilter, typeFilter, deptFilter]);

  // ── Stats : départements et types avec le plus de demandes ──────────────
  const byDept = useMemo(() => {
    const map: Record<string, number> = {};
    allRequests.forEach(r => { const n = r.employee?.department?.name || 'Sans département'; map[n] = (map[n] ?? 0) + 1; });
    return Object.entries(map).map(([departement, nombre]) => ({ departement, nombre })).sort((a, b) => b.nombre - a.nombre).slice(0, 6);
  }, [allRequests]);

  const byType = useMemo(() => {
    const map: Record<string, number> = {};
    allRequests.forEach(r => { map[r.requestType] = (map[r.requestType] ?? 0) + 1; });
    return Object.entries(map).map(([type, nombre]) => ({ type: TYPE_LABEL[type] ?? type, nombre })).sort((a, b) => b.nombre - a.nombre);
  }, [allRequests]);

  // ── Décision ─────────────────────────────────────────────────────────────
  const handleDecision = async (decision: 'OUI' | 'NON' | 'APPROVED' | 'REJECTED') => {
    if (!selected) return;
    const isReject = decision === 'NON' || decision === 'REJECTED';
    if (isReject && !rejectionReason.trim()) { setRejectMode(true); return; }
    setIsProcessing(true);
    try {
      // ✅ LOT B — orchestrateur : sans circuit actif, décision immédiate (comportement d'avant).
      const out = await decide(selected.kind, selected.item.id, {
        decision: isReject ? 'REJECT' : 'APPROVE',
        rejectionReason: isReject ? rejectionReason : undefined,
        recoverViaPayroll,
      });
      if (out.outcome === 'CANCELLED') return;
      await load();
      if (out.outcome === 'WAITING') {
        toast('info', 'Décision enregistrée, avis encore attendus');
        // On garde la fiche ouverte pour montrer « validée, en attente d'avis ».
        setRejectMode(false); setRejectionReason(''); setPanelKey(k => k + 1);
        return;
      }
      setSelected(null); setRejectMode(false); setRejectionReason('');
      toast('success', isReject ? 'Demande refusée' : 'Demande approuvée');
    } catch (e: any) { alert(e?.message || 'Erreur'); } finally { setIsProcessing(false); }
  };

  const quickDecide = (r: any, decision: 'OUI' | 'NON' | 'APPROVED' | 'REJECTED', e: React.MouseEvent) => {
    e.stopPropagation();
    // ⚠️ Ne jamais décider directement ici : on doit d'abord demander au RH
    // si le remboursement se fera en espèces ou par déduction automatique
    // sur la paie. On ouvre donc systématiquement la modale de décision
    // (qui pose la question via la case "Récupérer automatiquement sur la
    // paie") au lieu d'envoyer recoverViaPayroll:true en dur.
    setSelected({ kind: r.kind, item: r });
    if (decision === 'NON' || decision === 'REJECTED') setRejectMode(true);
  };

  // ── Impression / aperçu ────────────────────────────────────────────────
  const reference = selected ? `${selected.kind === 'loan' ? 'PR' : 'AV'}-${selected.item.id.slice(0, 8).toUpperCase()}` : '';
  const printData = selected ? {
    reference,
    company: { legalName: company?.legalName, tradeName: company?.tradeName, logo: company?.logo, rccmNumber: company?.rccmNumber, taxNumber: company?.taxNumber, address: company?.address, phone: company?.phone, cachetUrl: company?.cachetUrl, documentFooterText: company?.documentFooterText },
    employee: { firstName: selected.item.employee?.firstName || '', lastName: selected.item.employee?.lastName || '', position: selected.item.employee?.position, departmentName: selected.item.employee?.department?.name },
    docType: selected.kind === 'loan' ? (selected.item.type || 'ARGENT') : 'AVANCE',
    amount: selected.item.amount, monthlyRepayment: selected.item.monthlyRepayment, status: selected.item.status,
    startDate: selected.item.startDate, endDate: selected.item.endDate, createdAt: selected.item.createdAt,
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

  const handleDownloadOrcaXlsx = async () => {
    if (!selected) return;
    setIsExportingXlsx(true);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const path = selected.kind === 'loan' ? `/loans/${selected.item.id}/document/orca-xlsx` : `/loans/advances/${selected.item.id}/document/orca-xlsx`;
      const res = await fetch(`${API_URL}${path}`, { credentials: 'include' });
      if (!res.ok) throw new Error('Échec du téléchargement');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = `${reference}.xlsx`;
      document.body.appendChild(a); a.click(); a.remove(); window.URL.revokeObjectURL(url);
    } catch (e: any) { alert(e?.message || 'Erreur'); } finally { setIsExportingXlsx(false); }
  };

  const handlePrintOrcaPdf = async () => {
    if (!selected) return;
    setIsPreparingPrint(true);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const path = selected.kind === 'loan' ? `/loans/${selected.item.id}/document/orca-pdf` : `/loans/advances/${selected.item.id}/document/orca-pdf`;
      const res = await fetch(`${API_URL}${path}`, { credentials: 'include' });
      if (!res.ok) { const body = await res.json().catch(() => null); throw new Error(body?.message || 'Impression indisponible'); }
      const blob = await res.blob();
      window.open(window.URL.createObjectURL(blob), '_blank');
    } catch (e: any) { alert(e?.message || 'Erreur'); } finally { setIsPreparingPrint(false); }
  };

  useEffect(() => {
    if (!selected || showPreviewModal || approvalDialog) return;
    const dialog = document.querySelector<HTMLElement>('[data-loan-decision]');
    const previous = document.activeElement as HTMLElement | null;
    dialog?.focus();
    const keydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isProcessing) { event.preventDefault(); setSelected(null); setRejectMode(false); setRejectionReason(''); }
      if (event.key !== 'Tab' || !dialog) return;
      const items = Array.from(dialog.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), textarea:not(:disabled), select:not(:disabled), a[href], [tabindex="0"]')).filter(el => el.getClientRects().length && !el.closest('[aria-hidden="true"]'));
      const first = items[0], last = items[items.length - 1];
      if (!first) { event.preventDefault(); return; }
      if (event.shiftKey && (document.activeElement === first || document.activeElement === dialog)) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', keydown);
    return () => { document.removeEventListener('keydown', keydown); previous?.focus(); };
  }, [selected?.item?.id, showPreviewModal, !!approvalDialog, isProcessing]);
  if (isLoading) return <div className="loan-validations template-page" role="status" aria-label="Chargement des demandes à traiter"><Skeleton style={{height:36,width:240}} /><div className="validation-kpis">{[0,1,2,3].map(i => <Card key={i}><Skeleton /><Skeleton style={{height:32,marginTop:16}} /></Card>)}</div><div className="validation-charts">{[0,1].map(i => <Card key={i}><Skeleton style={{height:240}} /></Card>)}</div></div>;
  return <div className="loan-validations"><ListPage title="Demandes à traiter" description="Prêts et avances : consulter les avis, approuver ou refuser." navigation={<FinanceSubNav userRole={userRole} />} error={loadError}
    summary={<div className="validation-kpis"><LoanSpaceKpi label="Total" value={kpis.total} isCount /><LoanSpaceKpi label="En attente" value={kpis.pending} isCount tone="warning" /><LoanSpaceKpi label="Approuvées / soldées" value={kpis.validated} isCount tone="success" /><LoanSpaceKpi label="Refusées / annulées" value={kpis.rejected} isCount /></div>}>
    <div className="validation-charts"><LoanValidationChart title="Départements avec le plus de demandes" data={byDept.map(d => ({label:d.departement,value:d.nombre}))} /><LoanValidationChart title="Types de demande les plus fréquents" color="green" data={byType.map(d => ({label:d.type,value:d.nombre}))} /></div>
    <div className="request-tabs" role="group" aria-label="Filtrer par statut">{requestTabs.map(t => <button type="button" key={t.id} aria-pressed={statusFilter === t.id} onClick={() => setStatusFilter(t.id)}>{t.label}</button>)}</div>
    <div className="validation-filter-bar"><Select label="Type de demande" value={typeFilter} onChange={e => setTypeFilter(e.target.value)}><option value="">Tous les types</option>{Object.entries(TYPE_LABEL).map(([value,label]) => <option key={value} value={value}>{label}</option>)}</Select>{departments.length > 0 && <Select label="Département" value={deptFilter} onChange={e => setDeptFilter(e.target.value)}><option value="">Tous les départements</option>{departments.map(d => <option key={d} value={d}>{d}</option>)}</Select>}<div className="validation-views" role="group" aria-label="Affichage des demandes"><Button variant="secondary" aria-label="Vue grille" aria-pressed={viewMode === 'grid'} onClick={() => setViewMode('grid')}><LayoutGrid size={18} strokeWidth={1.5} /></Button><Button variant="secondary" aria-label="Vue liste" aria-pressed={viewMode === 'list'} onClick={() => setViewMode('list')}><List size={18} strokeWidth={1.5} /></Button></div></div>
    {!filtered.length ? <Card><EmptyState title="Aucune demande à afficher pour ces filtres">Choisissez un autre statut ou un autre type pour retrouver les demandes.</EmptyState></Card> : <ul className={'validation-list ' + (viewMode === 'grid' ? 'validation-list-grid' : '')}>{filtered.map(r => <li key={r.kind + '-' + r.id} className="validation-request"><Card><button type="button" className="validation-request-open" onClick={() => setSelected({kind:r.kind,item:r})}><div className="validation-request-heading"><div><h2>{[r.employee?.firstName,r.employee?.lastName].filter(Boolean).join(' ') || 'Employé'}</h2><p>{r.employee?.department?.name || '—'}</p></div><RequestStatusBadge status={r.status} /></div><p>{TYPE_LABEL[r.requestType] ?? r.requestType}</p><strong>{fmt(Number(r.amount))}</strong><p><time>{new Date(r.createdAt).toLocaleDateString('fr-FR')}</time> · Ouvrir la demande</p></button>{bucket(r.status) === 'PENDING' && DRH_ROLES.includes(userRole) && <div className="validation-actions"><Button disabled={isProcessing} onClick={e => quickDecide(r,r.kind === 'loan' ? 'OUI' : 'APPROVED',e)}><Check size={16} strokeWidth={1.5} /> Approuver</Button><Button variant="secondary" onClick={e => quickDecide(r,r.kind === 'loan' ? 'NON' : 'REJECTED',e)}><X size={16} strokeWidth={1.5} /> Refuser</Button></div>}</Card></li>)}</ul>}
  </ListPage>
      {selected && (
        <div className="validation-dialog-overlay" onClick={() => { setSelected(null); setRejectMode(false); setRejectionReason(''); }}>
          <div data-loan-decision role="dialog" aria-modal="true" aria-labelledby="validation-dialog-title" tabIndex={-1} onClick={e => e.stopPropagation()} className="validation-dialog">
            <div className="validation-dialog-heading">
              <p id="validation-dialog-title" className="font-bold text-[var(--text)]">{selected.item.employee?.firstName} {selected.item.employee?.lastName}</p>
              <Button variant="secondary" aria-label="Fermer la demande" onClick={() => setSelected(null)} className="text-[var(--text-secondary)] hover:text-[var(--text)]"><X size={20} /></Button>
            </div>

            <div className="validation-details">
              <Row label="Type" value={TYPE_LABEL[selected.kind === 'loan' ? (selected.item.type ?? 'ARGENT') : 'AVANCE']} />
              {selected.kind === 'loan' && selected.item.nature && <Row label="Nature" value={NATURE_LABEL[selected.item.nature] || selected.item.nature} />}
              <Row label="Montant" value={fmt(Number(selected.item.amount))} />
              {selected.kind === 'loan' && <Row label="Mensualité" value={fmt(Number(selected.item.monthlyRepayment))} />}
              <Row label="Département" value={selected.item.employee?.department?.name || '—'} />
              <Row label="Statut" value={<RequestStatusBadge status={selected.item.status} />} />
              <Row label="Mode de remboursement" value={selected.item.recoverViaPayroll ? 'Sur la paie' : 'Espèces'} />
              <Row label="Demandée le" value={new Date(selected.item.createdAt).toLocaleDateString('fr-FR')} />
              {selected.item.reason && <Row label="Motif" value={selected.item.reason} />}
              {selected.item.rejectionReason && <Row label="Motif du refus" value={selected.item.rejectionReason} />}
            </div>

            {/* ✅ LOT B — avis + historique (masqué si aucun circuit actif et rien à montrer) */}
            <RequestDecisionPanel><div className="validation-approval"><ApprovalPanel
              kind={selected.kind}
              requestId={selected.item.id}
              refreshKey={panelKey}
              onState={setApprovalState}
              onChanged={() => { load(); }}
            /></div>
            {bucket(selected.item.status) !== 'PENDING' && <p className="k-help">Cette demande a déjà été traitée.</p>}

            {bucket(selected.item.status) === 'PENDING' && DRH_ROLES.includes(userRole) && (
              <div className="space-y-2 pt-3 border-t border-[var(--border)] mb-3">
                {!rejectMode ? (
                  <>
                    <div>
                      <p className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">Remboursement</p>
                      <div className="grid grid-cols-2 gap-2">
                        <Button variant="secondary"
                          type="button"
                          aria-pressed={recoverViaPayroll} onClick={() => setRecoverViaPayroll(true)}
                          className="validation-choice"
                        >
                          Sur la paie
                        </Button>
                        <Button variant="secondary"
                          type="button"
                          aria-pressed={!recoverViaPayroll} onClick={() => setRecoverViaPayroll(false)}
                          className="validation-choice"
                        >
                          En espèces
                        </Button>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {!awaitingOpinions && <Button onClick={() => handleDecision(selected.kind === 'loan' ? 'OUI' : 'APPROVED')} disabled={isProcessing} className=""><Check strokeWidth={1.5} size={16} /> Approuver</Button>}
                      <Button variant="secondary" onClick={() => setRejectMode(true)} className="flex-1 py-2.5 border border-[var(--border)] bg-[var(--surface-2)] text-[var(--danger-text)] text-[var(--text-secondary)] text-sm font-bold rounded-xl flex items-center justify-center gap-2"><X size={16} /> Refuser</Button>
                    </div>
                  </>
                ) : (
                  <div className="space-y-2">
                    <textarea aria-label="Motif du refus (obligatoire)" value={rejectionReason} onChange={e => setRejectionReason(e.target.value)} placeholder="Motif du refus (obligatoire)" rows={2} className="k-input" />
                    <div className="flex gap-2">
                      <Button variant="secondary" onClick={() => handleDecision(selected.kind === 'loan' ? 'NON' : 'REJECTED')} disabled={isProcessing} className="">Refuser</Button>
                      <Button variant="secondary" onClick={() => { setRejectMode(false); setRejectionReason(''); }} className="flex-1 py-2 border border-[var(--border)] text-sm font-semibold rounded-xl text-[var(--text-secondary)]">Annuler</Button>
                    </div>
                  </div>
                )}
              </div>
            )}

            </RequestDecisionPanel>
            <Button variant="secondary" onClick={() => setShowPreviewModal(true)} className="w-full py-2 border border-dashed border-[var(--border)] text-xs font-semibold rounded-xl text-[var(--text-secondary)] flex items-center justify-center gap-2 hover:bg-[var(--surface-2)] mb-2">
              <Eye strokeWidth={1.5} size={14} /> Aperçu de la fiche
            </Button>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => setTimeout(() => printLoanDocument('val-print-target'), 50)} className="flex-1 py-2 border border-[var(--border)] text-xs font-semibold rounded-xl text-[var(--text-secondary)] flex items-center justify-center gap-1.5 hover:bg-[var(--surface-2)]"><Printer strokeWidth={1.5} size={13} /> Imprimer</Button>
              {docData?.company?.documentTemplate === 'ORCA' && (
                <Button variant="secondary" onClick={handleDownloadOrcaXlsx} disabled={isExportingXlsx} className="flex-1 py-2 border border-[var(--border)] text-xs font-semibold rounded-xl text-[var(--text-secondary)] flex items-center justify-center gap-1.5 hover:bg-[var(--surface-2)] disabled:opacity-40">{isExportingXlsx ? <Loader2 strokeWidth={1.5} size={13} className="animate-spin" /> : <Download strokeWidth={1.5} size={13} />} Fiche Excel</Button>
              )}
            </div>

            {/* Rendu réel hors-écran : nécessaire pour la capture d'impression navigateur */}
            <div className="fixed -left-[9999px] top-0 pointer-events-none" aria-hidden="true">
              {selected && docData && (
                docData.company?.documentTemplate === 'ORCA' ? (
                  orcaHtml && <div id="val-print-target" dangerouslySetInnerHTML={{ __html: orcaHtml }} />
                ) : isStandard ? (
                  selected.kind === 'loan'
                    ? standardLoanData && <LoanRequestDocument template={docData?.company?.documentTemplate} id="val-print-target" data={standardLoanData as any} />
                    : standardAdvanceData && <AdvanceRequestDocument template={docData?.company?.documentTemplate} id="val-print-target" data={standardAdvanceData as any} />
                ) : (
                  printData && <LoanRequestPrintable id="val-print-target" data={printData as any} />
                )
              )}
            </div>
          </div>
        </div>
      )}


  <div className="validation-orchestrator validation-approval">{approvalDialog}</div>
      <DocumentPreviewModal open={showPreviewModal} onClose={() => setShowPreviewModal(false)}>
        {selected && docData && (
          docData.company?.documentTemplate === 'ORCA' ? (
            orcaHtml && <div dangerouslySetInnerHTML={{ __html: orcaHtml }} />
          ) : isStandard ? (
            selected.kind === 'loan'
              ? standardLoanData && <LoanRequestDocument template={docData?.company?.documentTemplate} id="val-doc-preview" data={standardLoanData as any} />
              : standardAdvanceData && <AdvanceRequestDocument template={docData?.company?.documentTemplate} id="val-doc-preview" data={standardAdvanceData as any} />
          ) : (
            printData && <LoanRequestPrintable id="val-doc-preview" data={printData as any} />
          )
        )}
      </DocumentPreviewModal>
  </div>;
}
function Row({label,value}: {label:string;value:React.ReactNode}) { return <div><span>{label}</span><span>{value}</span></div>; }
