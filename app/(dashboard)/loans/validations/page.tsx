'use client';

// ============================================================================
// 📁 app/(dashboard)/loans/validations/page.tsx
// ✅ Page "Validations" — toutes les demandes (prêts + avances) de tout le
//    monde, KPI en tête, grille avec boutons Valider/Refuser visibles
//    directement sur chaque carte, et un clic ouvre une modal avec le détail
//    complet + décision + aperçu de fiche masqué par défaut (comme /loans).
// ============================================================================

import React, { useEffect, useMemo, useState } from 'react';
import {
  Loader2, Check, X, Clock, CheckCircle2, XCircle, Ban, Filter, Users2,
  Eye, Printer, Download, ShieldCheck, Landmark,
} from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
} from 'recharts';
import { api } from '@/services/api';
import FinanceSubNav from '@/components/FinanceSubNav';
import LoanRequestPrintable from '@/components/LoanRequestPrintable';
import OrcaLoanDocument from '@/components/documents/orca/OrcaLoanDocument';
import OrcaAdvanceDocument from '@/components/documents/orca/OrcaAdvanceDocument';
import DocumentPreviewModal from '@/components/loans/DocumentPreviewModal';

const DRH_ROLES = ['ADMIN', 'SUPER_ADMIN', 'HR_MANAGER'];
const TYPE_LABEL: Record<string, string> = { ARGENT: 'Prêt argent', MARCHANDISE: 'Marchandise', AUTRE: 'Autre prêt', AVANCE: 'Avance sur salaire' };
const fmt = (n: number) => Math.round(n).toLocaleString('fr-FR') + ' FCFA';

const STATUS_CFG: Record<string, { label: string; cls: string; icon: any }> = {
  PENDING:    { label: 'En attente', cls: 'bg-amber-50 text-amber-700 border-amber-100', icon: Clock },
  PENDING_DG: { label: 'En attente', cls: 'bg-amber-50 text-amber-700 border-amber-100', icon: Clock },
  ACTIVE:     { label: 'Validé',     cls: 'bg-emerald-50 text-emerald-700 border-emerald-100', icon: CheckCircle2 },
  APPROVED:   { label: 'Validé',     cls: 'bg-emerald-50 text-emerald-700 border-emerald-100', icon: CheckCircle2 },
  PAID:       { label: 'Soldé',      cls: 'bg-sky-50 text-sky-700 border-sky-100', icon: CheckCircle2 },
  DEDUCTED:   { label: 'Déduite',    cls: 'bg-sky-50 text-sky-700 border-sky-100', icon: CheckCircle2 },
  REJECTED:   { label: 'Refusé',     cls: 'bg-red-50 text-red-700 border-red-100', icon: XCircle },
  CANCELLED:  { label: 'Annulé',     cls: 'bg-gray-50 text-gray-500 border-gray-200', icon: Ban },
};

export default function ValidationsPage() {
  const [loans, setLoans] = useState<any[]>([]);
  const [advances, setAdvances] = useState<any[]>([]);
  const [company, setCompany] = useState<any>(null);
  const [userRole, setUserRole] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const [statusFilter, setStatusFilter] = useState<'' | 'PENDING' | 'VALIDATED' | 'REJECTED'>('');
  const [typeFilter, setTypeFilter] = useState('');
  const [deptFilter, setDeptFilter] = useState('');

  const [selected, setSelected] = useState<{ kind: 'loan' | 'advance'; item: any } | null>(null);
  const [docData, setDocData] = useState<any>(null);
  const [rejectMode, setRejectMode] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [recoverViaPayroll, setRecoverViaPayroll] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [isExportingXlsx, setIsExportingXlsx] = useState(false);
  const [isPreparingPrint, setIsPreparingPrint] = useState(false);

  const load = async () => {
    try {
      const [l, a, me]: any = await Promise.all([
        api.get('/loans'), api.get('/loans/advances'), api.get('/auth/me').catch(() => null),
      ]);
      setLoans(l || []); setAdvances(a || []); setCompany(me?.company ?? null);
    } catch (e) { console.error('Erreur chargement validations', e); }
    finally { setIsLoading(false); }
  };

  useEffect(() => {
    try { const stored = localStorage.getItem('user'); if (stored) setUserRole(JSON.parse(stored).role || ''); } catch {}
    load();
  }, []);

  useEffect(() => {
    if (!selected) { setDocData(null); return; }
    (async () => {
      try {
        const path = selected.kind === 'loan' ? `/loans/${selected.item.id}/document-data` : `/loans/advances/${selected.item.id}/document-data`;
        setDocData(await api.get(path));
      } catch { setDocData(null); }
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
    (!statusFilter || bucket(r.status) === statusFilter) &&
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
      if (selected.kind === 'loan') {
        await api.patch(`/loans/${selected.item.id}/decision`, { decision, rejectionReason: isReject ? rejectionReason : undefined, recoverViaPayroll });
      } else {
        await api.patch(`/loans/advances/${selected.item.id}/decision`, { decision, rejectionReason: isReject ? rejectionReason : undefined, recoverViaPayroll });
      }
      await load();
      setSelected(null); setRejectMode(false); setRejectionReason('');
    } catch (e: any) { alert(e?.message || 'Erreur'); } finally { setIsProcessing(false); }
  };

  const quickDecide = async (r: any, decision: 'OUI' | 'NON' | 'APPROVED' | 'REJECTED', e: React.MouseEvent) => {
    e.stopPropagation();
    if (decision === 'NON' || decision === 'REJECTED') { setSelected({ kind: r.kind, item: r }); setRejectMode(true); return; }
    setIsProcessing(true);
    try {
      const path = r.kind === 'loan' ? `/loans/${r.id}/decision` : `/loans/advances/${r.id}/decision`;
      await api.patch(path, { decision, recoverViaPayroll: true });
      await load();
    } catch (err: any) { alert(err?.message || 'Erreur'); } finally { setIsProcessing(false); }
  };

  // ── Impression / aperçu ────────────────────────────────────────────────
  const reference = selected ? `${selected.kind === 'loan' ? 'PR' : 'AV'}-${selected.item.id.slice(0, 8).toUpperCase()}` : '';
  const printData = selected ? {
    reference,
    company: { legalName: company?.legalName, tradeName: company?.tradeName, logo: company?.logo, rccmNumber: company?.rccmNumber, taxNumber: company?.taxNumber, address: company?.address, phone: company?.phone },
    employee: { firstName: selected.item.employee?.firstName || '', lastName: selected.item.employee?.lastName || '', position: selected.item.employee?.position, departmentName: selected.item.employee?.department?.name },
    docType: selected.kind === 'loan' ? (selected.item.type || 'ARGENT') : 'AVANCE',
    amount: selected.item.amount, monthlyRepayment: selected.item.monthlyRepayment, status: selected.item.status,
    startDate: selected.item.startDate, endDate: selected.item.endDate, createdAt: selected.item.createdAt,
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

  if (isLoading) return <div className="flex justify-center py-24"><Loader2 className="animate-spin text-sky-500" size={40} /></div>;

  return (
    <div className="max-w-[1500px] mx-auto pb-24 space-y-6">
      <FinanceSubNav userRole={userRole} />
      <div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Validations</h1>
        <p className="text-sm text-gray-500">Toutes les demandes de prêts et avances, à valider ou refuser.</p>
      </div>

      {/* ══════════════════ KPI ══════════════════ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4">
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Total</p>
          <p className="text-xl font-bold text-gray-900 dark:text-white">{kpis.total}</p>
        </div>
        <div className="bg-amber-50 dark:bg-amber-900/20 rounded-2xl border border-amber-100 dark:border-amber-900 p-4">
          <p className="text-[11px] font-semibold text-amber-600 uppercase tracking-wide mb-1">En attente</p>
          <p className="text-xl font-bold text-amber-700 dark:text-amber-300">{kpis.pending}</p>
        </div>
        <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl border border-emerald-100 dark:border-emerald-900 p-4">
          <p className="text-[11px] font-semibold text-emerald-600 uppercase tracking-wide mb-1">Validées</p>
          <p className="text-xl font-bold text-emerald-700 dark:text-emerald-300">{kpis.validated}</p>
        </div>
        <div className="bg-red-50 dark:bg-red-900/20 rounded-2xl border border-red-100 dark:border-red-900 p-4">
          <p className="text-[11px] font-semibold text-red-600 uppercase tracking-wide mb-1">Refusées</p>
          <p className="text-xl font-bold text-red-700 dark:text-red-300">{kpis.rejected}</p>
        </div>
      </div>

      {/* ══════════════════ STATS ══════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5">
          <p className="text-sm font-bold text-gray-700 dark:text-gray-200 mb-4">Départements avec le plus de demandes</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={byDept} layout="vertical" margin={{ left: 24 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} horizontal={false} />
              <XAxis type="number" fontSize={12} allowDecimals={false} />
              <YAxis type="category" dataKey="departement" fontSize={12} width={110} />
              <Tooltip />
              <Bar dataKey="nombre" fill="#0ea5e9" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5">
          <p className="text-sm font-bold text-gray-700 dark:text-gray-200 mb-4">Types de demande les plus fréquents</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={byType} layout="vertical" margin={{ left: 24 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} horizontal={false} />
              <XAxis type="number" fontSize={12} allowDecimals={false} />
              <YAxis type="category" dataKey="type" fontSize={12} width={110} />
              <Tooltip />
              <Bar dataKey="nombre" fill="#8b5cf6" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ══════════════════ FILTRES ══════════════════ */}
      <div className="flex flex-wrap gap-2">
        <FilterSelect icon={Filter} value={statusFilter} onChange={(v: any) => setStatusFilter(v)} placeholder="Tous les statuts" options={[['PENDING', 'En attente'], ['VALIDATED', 'Validées'], ['REJECTED', 'Refusées']]} />
        <FilterSelect icon={Filter} value={typeFilter} onChange={setTypeFilter} placeholder="Tous les types" options={Object.entries(TYPE_LABEL)} />
        {departments.length > 0 && <FilterSelect icon={Users2} value={deptFilter} onChange={setDeptFilter} placeholder="Tous les départements" options={departments.map(d => [d, d] as [string, string])} />}
      </div>

      {/* ══════════════════ GRILLE DES DEMANDES ══════════════════ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.length === 0 ? (
          <div className="col-span-full text-center py-16 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 text-sm text-gray-400">Aucune demande pour ce filtre.</div>
        ) : filtered.map(r => {
          const cfg = STATUS_CFG[r.status] ?? STATUS_CFG.PENDING;
          const Icon = cfg.icon;
          const isPending = bucket(r.status) === 'PENDING';
          return (
            <button key={`${r.kind}-${r.id}`} onClick={() => setSelected({ kind: r.kind, item: r })} className="text-left bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4 hover:shadow-md hover:border-sky-200 dark:hover:border-sky-800 transition-all">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white text-sm">{r.employee?.firstName} {r.employee?.lastName}</p>
                  <p className="text-xs text-gray-400">{r.employee?.department?.name || '—'}</p>
                </div>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border flex items-center gap-1 shrink-0 ${cfg.cls}`}><Icon size={10} /> {cfg.label}</span>
              </div>
              <p className="text-xs text-gray-500 mb-1">{TYPE_LABEL[r.requestType] ?? r.requestType}</p>
              <p className="font-bold text-gray-900 dark:text-white mb-3">{fmt(Number(r.amount))}</p>
              {isPending && DRH_ROLES.includes(userRole) ? (
                <div className="flex gap-2">
                  <button onClick={(e) => quickDecide(r, r.kind === 'loan' ? 'OUI' : 'APPROVED', e)} disabled={isProcessing} className="flex-1 py-1.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-1"><Check size={13} /> Valider</button>
                  <button onClick={(e) => quickDecide(r, r.kind === 'loan' ? 'NON' : 'REJECTED', e)} className="flex-1 py-1.5 border border-gray-200 dark:border-gray-600 hover:bg-red-50 hover:text-red-600 text-gray-600 dark:text-gray-300 text-xs font-bold rounded-lg flex items-center justify-center gap-1"><X size={13} /> Refuser</button>
                </div>
              ) : (
                <p className="text-[11px] text-gray-400">{new Date(r.createdAt).toLocaleDateString('fr-FR')}</p>
              )}
            </button>
          );
        })}
      </div>

      {/* ══════════════════ MODAL DÉTAIL + DÉCISION ══════════════════ */}
      {selected && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => { setSelected(null); setRejectMode(false); setRejectionReason(''); }}>
          <div onClick={e => e.stopPropagation()} className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="font-bold text-gray-900 dark:text-white">{selected.item.employee?.firstName} {selected.item.employee?.lastName}</p>
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>

            <div className="space-y-2 text-sm mb-4">
              <Row label="Type" value={TYPE_LABEL[selected.kind === 'loan' ? (selected.item.type ?? 'ARGENT') : 'AVANCE']} />
              <Row label="Montant" value={fmt(Number(selected.item.amount))} />
              {selected.kind === 'loan' && <Row label="Mensualité" value={fmt(Number(selected.item.monthlyRepayment))} />}
              <Row label="Département" value={selected.item.employee?.department?.name || '—'} />
              <Row label="Statut" value={(STATUS_CFG[selected.item.status] ?? STATUS_CFG.PENDING).label} />
              <Row label="Demandée le" value={new Date(selected.item.createdAt).toLocaleDateString('fr-FR')} />
              {selected.item.reason && <Row label="Motif" value={selected.item.reason} />}
              {selected.item.rejectionReason && <Row label="Motif du refus" value={selected.item.rejectionReason} />}
            </div>

            {bucket(selected.item.status) === 'PENDING' && DRH_ROLES.includes(userRole) && (
              <div className="space-y-2 pt-3 border-t border-gray-100 dark:border-gray-700 mb-3">
                {!rejectMode ? (
                  <>
                    <label className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300">
                      <input type="checkbox" checked={recoverViaPayroll} onChange={e => setRecoverViaPayroll(e.target.checked)} /> Récupérer automatiquement sur la paie
                    </label>
                    <div className="flex gap-2">
                      <button onClick={() => handleDecision(selected.kind === 'loan' ? 'OUI' : 'APPROVED')} disabled={isProcessing} className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white text-sm font-bold rounded-xl flex items-center justify-center gap-2"><Check size={16} /> Valider</button>
                      <button onClick={() => setRejectMode(true)} className="flex-1 py-2.5 border border-gray-200 dark:border-gray-600 hover:bg-red-50 hover:text-red-600 text-gray-600 dark:text-gray-300 text-sm font-bold rounded-xl flex items-center justify-center gap-2"><X size={16} /> Refuser</button>
                    </div>
                  </>
                ) : (
                  <div className="space-y-2">
                    <textarea value={rejectionReason} onChange={e => setRejectionReason(e.target.value)} placeholder="Motif du refus (obligatoire)" rows={2} className="w-full text-sm p-2 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-900" />
                    <div className="flex gap-2">
                      <button onClick={() => handleDecision(selected.kind === 'loan' ? 'NON' : 'REJECTED')} disabled={isProcessing} className="flex-1 py-2 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white text-sm font-bold rounded-xl">Confirmer le refus</button>
                      <button onClick={() => { setRejectMode(false); setRejectionReason(''); }} className="flex-1 py-2 border border-gray-200 dark:border-gray-600 text-sm font-semibold rounded-xl text-gray-500">Annuler</button>
                    </div>
                  </div>
                )}
              </div>
            )}

            <button onClick={() => setShowPreviewModal(true)} className="w-full py-2 border border-dashed border-gray-300 dark:border-gray-600 text-xs font-semibold rounded-xl text-gray-500 dark:text-gray-400 flex items-center justify-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-700 mb-2">
              <Eye size={14} /> Aperçu de la fiche
            </button>
            <div className="flex gap-2">
              {docData?.company?.documentTemplate === 'ORCA' ? (
                <>
                  <button onClick={handlePrintOrcaPdf} disabled={isPreparingPrint} className="flex-1 py-2 border border-gray-200 dark:border-gray-700 text-xs font-semibold rounded-xl text-gray-600 dark:text-gray-300 flex items-center justify-center gap-1.5 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40">{isPreparingPrint ? <Loader2 size={13} className="animate-spin" /> : <Printer size={13} />} Imprimer</button>
                  <button onClick={handleDownloadOrcaXlsx} disabled={isExportingXlsx} className="flex-1 py-2 border border-gray-200 dark:border-gray-700 text-xs font-semibold rounded-xl text-gray-600 dark:text-gray-300 flex items-center justify-center gap-1.5 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40">{isExportingXlsx ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />} Fiche Excel</button>
                </>
              ) : (
                <p className="text-[11px] text-gray-400 text-center w-full">Impression standard disponible via l'onglet Gestion.</p>
              )}
            </div>
          </div>
        </div>
      )}

      <DocumentPreviewModal open={showPreviewModal} onClose={() => setShowPreviewModal(false)}>
        {selected && docData && (
          docData.company?.documentTemplate === 'ORCA' ? (
            selected.kind === 'loan' ? (
              <OrcaLoanDocument id="val-doc-preview" reference={reference} loanType={docData.loanType} employee={docData.employee} amount={docData.amount} monthlyRepayment={docData.monthlyRepayment} startDate={docData.startDate} endDate={selected.item.endDate} status={docData.status} drhDecision={docData.drhDecision} dgDecision={docData.dgDecision} company={docData.company} />
            ) : (
              <OrcaAdvanceDocument id="val-doc-preview" reference={reference} employee={docData.employee} amount={docData.amount} reason={selected.item.reason} requestDate={selected.item.createdAt} status={docData.status} company={docData.company} />
            )
          ) : (
            printData && <LoanRequestPrintable id="val-doc-preview" data={printData as any} />
          )
        )}
      </DocumentPreviewModal>
    </div>
  );
}

function FilterSelect({ icon: IconEl, value, onChange, placeholder, options }: { icon: any; value: string; onChange: (v: string) => void; placeholder: string; options: [string, string][] }) {
  return (
    <div className="relative">
      <IconEl size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
      <select value={value} onChange={e => onChange(e.target.value)} className="pl-7 pr-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 text-xs">
        <option value="">{placeholder}</option>
        {options.map(([val, label]) => <option key={val} value={val}>{label}</option>)}
      </select>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-gray-400">{label}</span>
      <span className="font-semibold text-gray-800 dark:text-gray-100 text-right">{value}</span>
    </div>
  );
}