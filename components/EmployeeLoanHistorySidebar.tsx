'use client';

// ============================================================================
// 📁 components/EmployeeLoanHistorySidebar.tsx
// ✅ v3 — Fiche dette complète d'un employé. KPI, historique, détail au clic
//    dans un modal qui affiche maintenant aussi la liste des remboursements
//    déjà enregistrés (montant, date) avec un bouton pour SUPPRIMER une
//    saisie erronée (double saisie, erreur de montant...) — le solde se
//    recalcule automatiquement côté serveur.
// ============================================================================

import React, { useEffect, useMemo, useState } from 'react';
import { Banknote, Wallet, Clock, CheckCircle2, XCircle, Ban, X as CloseIcon, Trash2, Loader2 } from 'lucide-react';
import SlideOver from './SlideOver';
import { api } from '@/services/api';

export interface EmployeeLoanHistoryData {
  employee: { firstName: string; lastName: string; employeeNumber?: string; department?: string; photoUrl?: string | null };
  loans: any[];
  advances: any[];
}

const STATUS_BADGE: Record<string, { label: string; cls: string; icon: any }> = {
  PENDING:      { label: 'En attente',   cls: 'bg-amber-50 text-amber-700 border-amber-100', icon: Clock },
  PENDING_DG:   { label: 'En attente',   cls: 'bg-amber-50 text-amber-700 border-amber-100', icon: Clock },
  ACTIVE:       { label: 'Actif',        cls: 'bg-emerald-50 text-emerald-700 border-emerald-100', icon: CheckCircle2 },
  APPROVED:     { label: 'Approuvée',    cls: 'bg-emerald-50 text-emerald-700 border-emerald-100', icon: CheckCircle2 },
  PAID:         { label: 'Soldé',        cls: 'bg-sky-50 text-sky-700 border-sky-100', icon: CheckCircle2 },
  DEDUCTED:     { label: 'Déduite',      cls: 'bg-sky-50 text-sky-700 border-sky-100', icon: CheckCircle2 },
  REJECTED:     { label: 'Refusé',       cls: 'bg-red-50 text-red-700 border-red-100', icon: XCircle },
  CANCELLED:    { label: 'Annulé',       cls: 'bg-gray-50 text-gray-500 border-gray-200', icon: Ban },
};

const MONTHS_FR = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
const fmt = (n: number) => Math.round(n).toLocaleString('fr-FR') + ' FCFA';

type Props = {
  open: boolean;
  onClose: () => void;
  data: EmployeeLoanHistoryData | null;
  /** Réservé admin/RH — jamais transmis pour la vue employé (mon-espace). */
  canManage?: boolean;
  onCashRepayment?: (loanId: string, remainingBalance: number) => void;
  onAdvanceCashRepayment?: (advanceId: string, remainingBalance: number) => void;
  /** Appelé après une suppression de remboursement, pour que la page parente recharge ses données (solde à jour). */
  onDataChanged?: () => void;
};

export default function EmployeeLoanHistorySidebar({ open, onClose, data, canManage = false, onCashRepayment, onAdvanceCashRepayment, onDataChanged }: Props) {
  const [detailItem, setDetailItem] = useState<{ kind: 'loan' | 'advance'; item: any } | null>(null);
  const [repaymentLogs, setRepaymentLogs] = useState<any[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  const [deletingLogId, setDeletingLogId] = useState<string | null>(null);

  useEffect(() => {
    if (!detailItem) { setRepaymentLogs([]); return; }
    setIsLoadingLogs(true);
    const path = detailItem.kind === 'loan' ? `/loans/${detailItem.item.id}/history` : `/loans/advances/${detailItem.item.id}/history`;
    api.get(path).then((logs: any) => setRepaymentLogs(logs || [])).catch(() => setRepaymentLogs([])).finally(() => setIsLoadingLogs(false));
  }, [detailItem]);

  const handleDeleteLog = async (logId: string) => {
    if (!detailItem) return;
    if (!confirm('Supprimer ce remboursement ? Le montant sera automatiquement remis sur le solde restant.')) return;
    setDeletingLogId(logId);
    try {
      const path = detailItem.kind === 'loan' ? `/loans/${detailItem.item.id}/cash-repayment/${logId}` : `/loans/advances/${detailItem.item.id}/cash-repayment/${logId}`;
      await api.delete(path);
      setRepaymentLogs(logs => logs.filter(l => l.id !== logId));
      onDataChanged?.();
    } catch (e: any) { alert(e?.message || 'Erreur lors de la suppression'); }
    finally { setDeletingLogId(null); }
  };

  const kpis = useMemo(() => {
    if (!data) return null;
    const dueLoans = data.loans.filter(l => ['ACTIVE', 'PAID'].includes(l.status));
    const dueAdvances = data.advances.filter(a => ['APPROVED', 'DEDUCTED', 'PAID'].includes(a.status));

    const totalDue = dueLoans.reduce((s, l) => s + Number(l.amount), 0) + dueAdvances.reduce((s, a) => s + Number(a.amount), 0);
    const paidLoans = dueLoans.reduce((s, l) => s + (Number(l.amount) - Number(l.remainingBalance)), 0);
    const paidAdvances = data.advances.filter(a => ['DEDUCTED', 'PAID'].includes(a.status)).reduce((s, a) => s + Number(a.amount), 0)
      + data.advances.filter(a => a.status === 'APPROVED').reduce((s, a) => s + (Number(a.amount) - Number(a.remainingBalance ?? a.amount)), 0);
    const totalPaid = paidLoans + paidAdvances;
    const remainingLoans = data.loans.filter(l => l.status === 'ACTIVE').reduce((s, l) => s + Number(l.remainingBalance), 0);
    const remainingAdvances = data.advances.filter(a => a.status === 'APPROVED').reduce((s, a) => s + Number(a.remainingBalance ?? a.amount), 0);
    const totalRemaining = remainingLoans + remainingAdvances;
    const monthlyLoad = data.loans.filter(l => l.status === 'ACTIVE').reduce((s, l) => s + Number(l.monthlyRepayment), 0);

    return { totalDue, totalPaid, totalRemaining, monthlyLoad };
  }, [data]);

  if (!data) return <SlideOver open={open} onClose={onClose} title="">{null}</SlideOver>;

  const initials = `${data.employee.firstName?.[0] ?? ''}${data.employee.lastName?.[0] ?? ''}`;

  return (
    <>
      <SlideOver open={open} onClose={onClose} title={`${data.employee.firstName} ${data.employee.lastName}`} subtitle="Fiche prêts & avances" widthClass="max-w-lg">
        <div className="flex items-center gap-4 mb-5">
          <div className="w-14 h-14 rounded-2xl bg-sky-100 dark:bg-sky-900/30 flex items-center justify-center text-base font-bold text-sky-600 overflow-hidden shrink-0">
            {data.employee.photoUrl ? <img src={data.employee.photoUrl} className="w-full h-full object-cover" alt={initials} /> : initials}
          </div>
          <div>
            <p className="text-sm text-gray-500">Matricule</p>
            <p className="font-semibold text-gray-900 dark:text-white">{data.employee.employeeNumber || '—'}</p>
          </div>
        </div>

        {/* ══════════════════ KPI ══════════════════ */}
        {kpis && (
          <div className="grid grid-cols-2 gap-3 mb-6">
            <KpiTile label="Montant dû (total)" value={fmt(kpis.totalDue)} tone="slate" />
            <KpiTile label="Déjà remboursé" value={fmt(kpis.totalPaid)} tone="emerald" />
            <KpiTile label="Reste à rembourser" value={fmt(kpis.totalRemaining)} tone="amber" />
            <KpiTile label="Mensualité en cours" value={fmt(kpis.monthlyLoad)} tone="sky" />
          </div>
        )}

        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5"><Banknote size={13} /> Prêts ({data.loans.length})</p>
        <div className="space-y-2 mb-6">
          {data.loans.length === 0 ? <p className="text-sm text-gray-400 py-2">Aucun prêt.</p> : data.loans.map(l => {
            const cfg = STATUS_BADGE[l.status] ?? STATUS_BADGE.PENDING;
            const Icon = cfg.icon;
            return (
              <div key={l.id} className="p-3 rounded-xl border border-gray-100 dark:border-gray-700 hover:border-sky-200 dark:hover:border-sky-800 transition-colors">
                <button onClick={() => setDetailItem({ kind: 'loan', item: l })} className="w-full text-left">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{Number(l.amount).toLocaleString('fr-FR')} FCFA <span className="text-xs text-gray-400 font-normal">({l.type})</span></p>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border flex items-center gap-1 ${cfg.cls}`}><Icon size={10} /> {cfg.label}</span>
                  </div>
                  <p className="text-xs text-gray-400">{new Date(l.createdAt).toLocaleDateString('fr-FR')} · reste {Number(l.remainingBalance).toLocaleString('fr-FR')} FCFA</p>
                </button>
                {canManage && l.status === 'ACTIVE' && onCashRepayment && (
                  <button onClick={() => onCashRepayment(l.id, Number(l.remainingBalance))} className="mt-2 w-full text-xs font-semibold py-1.5 rounded-lg border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">
                    💵 Enregistrer un remboursement en espèces
                  </button>
                )}
              </div>
            );
          })}
        </div>

        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5"><Wallet size={13} /> Avances ({data.advances.length})</p>
        <div className="space-y-2">
          {data.advances.length === 0 ? <p className="text-sm text-gray-400 py-2">Aucune avance.</p> : data.advances.map(a => {
            const cfg = STATUS_BADGE[a.status] ?? STATUS_BADGE.PENDING;
            const Icon = cfg.icon;
            return (
              <div key={a.id} className="p-3 rounded-xl border border-gray-100 dark:border-gray-700 hover:border-sky-200 dark:hover:border-sky-800 transition-colors">
                <button onClick={() => setDetailItem({ kind: 'advance', item: a })} className="w-full text-left">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{Number(a.amount).toLocaleString('fr-FR')} FCFA</p>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border flex items-center gap-1 ${cfg.cls}`}><Icon size={10} /> {cfg.label}</span>
                  </div>
                  <p className="text-xs text-gray-400">{new Date(a.createdAt).toLocaleDateString('fr-FR')} · déduction {a.deductMonth}/{a.deductYear}</p>
                </button>
                {canManage && a.status === 'APPROVED' && onAdvanceCashRepayment && (
                  <button onClick={() => onAdvanceCashRepayment(a.id, Number(a.remainingBalance ?? a.amount))} className="mt-2 w-full text-xs font-semibold py-1.5 rounded-lg border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">
                    💵 Enregistrer un remboursement en espèces
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </SlideOver>

      {/* ══════════════════ MODAL DÉTAIL (au clic sur une ligne) ══════════════════ */}
      {detailItem && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => setDetailItem(null)}>
          <div onClick={e => e.stopPropagation()} className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-sm w-full p-5 animate-in fade-in zoom-in-95 duration-150 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <p className="font-bold text-gray-900 dark:text-white">{detailItem.kind === 'loan' ? 'Détail du prêt' : "Détail de l'avance"}</p>
              <button onClick={() => setDetailItem(null)} className="text-gray-400 hover:text-gray-600"><CloseIcon size={18} /></button>
            </div>
            <div className="space-y-2.5 text-sm mb-4">
              <DetailRow label="Montant" value={fmt(Number(detailItem.item.amount))} />
              {detailItem.kind === 'loan' && <DetailRow label="Mensualité" value={fmt(Number(detailItem.item.monthlyRepayment))} />}
              <DetailRow label="Reste à rembourser" value={fmt(Number(detailItem.item.remainingBalance ?? detailItem.item.amount))} />
              <DetailRow label="Statut" value={(STATUS_BADGE[detailItem.item.status] ?? STATUS_BADGE.PENDING).label} />
              <DetailRow label="Créée le" value={new Date(detailItem.item.createdAt).toLocaleDateString('fr-FR')} />
              {detailItem.kind === 'loan' && detailItem.item.decidedByRole && <DetailRow label="Décidé par" value={detailItem.item.decidedByRole === 'DG' ? 'Direction Générale' : 'DRH'} />}
              {detailItem.item.reason && <DetailRow label="Motif" value={detailItem.item.reason} />}
              {detailItem.item.rejectionReason && <DetailRow label="Motif du refus" value={detailItem.item.rejectionReason} />}
            </div>

            {/* ── Historique des remboursements — supprimable ── */}
            <div className="pt-3 border-t border-gray-100 dark:border-gray-700">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Remboursements enregistrés</p>
              {isLoadingLogs ? (
                <div className="flex justify-center py-4"><Loader2 size={16} className="animate-spin text-gray-400" /></div>
              ) : repaymentLogs.length === 0 ? (
                <p className="text-xs text-gray-400 py-1">Aucun remboursement en espèces enregistré pour l&apos;instant.</p>
              ) : (
                <div className="space-y-1.5">
                  {repaymentLogs.map(log => (
                    <div key={log.id} className="flex items-center justify-between gap-2 text-sm bg-gray-50 dark:bg-gray-900 rounded-lg px-3 py-2">
                      <div>
                        <span className="font-semibold text-gray-800 dark:text-gray-100">{fmt(Number(log.amount))}</span>
                        <span className="text-xs text-gray-400 ml-2">{MONTHS_FR[log.month - 1]} {log.year}</span>
                      </div>
                      {canManage && (
                        <button onClick={() => handleDeleteLog(log.id)} disabled={deletingLogId === log.id} className="text-gray-400 hover:text-red-600 disabled:opacity-40 shrink-0" title="Supprimer ce remboursement">
                          {deletingLogId === log.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function KpiTile({ label, value, tone }: { label: string; value: string; tone: 'slate' | 'emerald' | 'amber' | 'sky' }) {
  const cls: Record<string, string> = {
    slate: 'bg-gray-50 dark:bg-gray-900 text-gray-700 dark:text-gray-200',
    emerald: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300',
    amber: 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300',
    sky: 'bg-sky-50 dark:bg-sky-900/20 text-sky-700 dark:text-sky-300',
  };
  return (
    <div className={`rounded-xl p-3 ${cls[tone]}`}>
      <p className="text-[10px] font-semibold uppercase tracking-wide opacity-70 mb-1">{label}</p>
      <p className="text-sm font-bold">{value}</p>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-gray-400">{label}</span>
      <span className="font-semibold text-gray-800 dark:text-gray-100 text-right">{value}</span>
    </div>
  );
}