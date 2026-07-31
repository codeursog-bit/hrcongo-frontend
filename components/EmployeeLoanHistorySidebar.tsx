'use client';

// ============================================================================
// 📁 components/EmployeeLoanHistorySidebar.tsx
// ✅ v2 — Fiche dette complète d'un employé, ouverte au clic sur son nom
//    depuis la page de gestion /loans. KPI (dû / payé / reste à payer /
//    mensualité en cours), historique complet, détail au clic dans un petit
//    modal, et — si `canManage` — bouton paiement espèces par ligne (réservé
//    admin/RH, jamais visible à l'employé lui-même).
// ============================================================================

import React, { useMemo, useState } from 'react';
import { Banknote, Wallet, Clock, CheckCircle2, XCircle, Ban, X as CloseIcon } from 'lucide-react';
import SlideOver from './SlideOver';

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

const fmt = (n: number) => Math.round(n).toLocaleString('fr-FR') + ' FCFA';

type Props = {
  open: boolean;
  onClose: () => void;
  data: EmployeeLoanHistoryData | null;
  /** Réservé admin/RH — jamais transmis pour la vue employé (mon-espace). */
  canManage?: boolean;
  onCashRepayment?: (loanId: string, remainingBalance: number) => void;
};

export default function EmployeeLoanHistorySidebar({ open, onClose, data, canManage = false, onCashRepayment }: Props) {
  const [detailItem, setDetailItem] = useState<{ kind: 'loan' | 'advance'; item: any } | null>(null);

  const kpis = useMemo(() => {
    if (!data) return null;
    const dueLoans = data.loans.filter(l => ['ACTIVE', 'PAID'].includes(l.status));
    const dueAdvances = data.advances.filter(a => ['APPROVED', 'DEDUCTED', 'PAID'].includes(a.status));

    const totalDue = dueLoans.reduce((s, l) => s + Number(l.amount), 0) + dueAdvances.reduce((s, a) => s + Number(a.amount), 0);
    const paidLoans = dueLoans.reduce((s, l) => s + (Number(l.amount) - Number(l.remainingBalance)), 0);
    const paidAdvances = data.advances.filter(a => ['DEDUCTED', 'PAID'].includes(a.status)).reduce((s, a) => s + Number(a.amount), 0);
    const totalPaid = paidLoans + paidAdvances;
    const remainingLoans = data.loans.filter(l => l.status === 'ACTIVE').reduce((s, l) => s + Number(l.remainingBalance), 0);
    const remainingAdvances = data.advances.filter(a => a.status === 'APPROVED').reduce((s, a) => s + Number(a.amount), 0);
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
            <KpiTile label="Déjà payé" value={fmt(kpis.totalPaid)} tone="emerald" />
            <KpiTile label="Reste à payer" value={fmt(kpis.totalRemaining)} tone="amber" />
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
                    💵 Enregistrer un paiement en espèces
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
              <button key={a.id} onClick={() => setDetailItem({ kind: 'advance', item: a })} className="w-full text-left p-3 rounded-xl border border-gray-100 dark:border-gray-700 hover:border-sky-200 dark:hover:border-sky-800 transition-colors">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{Number(a.amount).toLocaleString('fr-FR')} FCFA</p>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border flex items-center gap-1 ${cfg.cls}`}><Icon size={10} /> {cfg.label}</span>
                </div>
                <p className="text-xs text-gray-400">{new Date(a.createdAt).toLocaleDateString('fr-FR')} · déduction {a.deductMonth}/{a.deductYear}</p>
              </button>
            );
          })}
        </div>
      </SlideOver>

      {/* ══════════════════ MODAL DÉTAIL (au clic sur une ligne) ══════════════════ */}
      {detailItem && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => setDetailItem(null)}>
          <div onClick={e => e.stopPropagation()} className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-sm w-full p-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between mb-4">
              <p className="font-bold text-gray-900 dark:text-white">{detailItem.kind === 'loan' ? 'Détail du prêt' : "Détail de l'avance"}</p>
              <button onClick={() => setDetailItem(null)} className="text-gray-400 hover:text-gray-600"><CloseIcon size={18} /></button>
            </div>
            <div className="space-y-2.5 text-sm">
              <DetailRow label="Montant" value={fmt(Number(detailItem.item.amount))} />
              {detailItem.kind === 'loan' && <DetailRow label="Mensualité" value={fmt(Number(detailItem.item.monthlyRepayment))} />}
              {detailItem.kind === 'loan' && <DetailRow label="Reste à payer" value={fmt(Number(detailItem.item.remainingBalance))} />}
              <DetailRow label="Statut" value={(STATUS_BADGE[detailItem.item.status] ?? STATUS_BADGE.PENDING).label} />
              <DetailRow label="Créée le" value={new Date(detailItem.item.createdAt).toLocaleDateString('fr-FR')} />
              {detailItem.kind === 'loan' && detailItem.item.decidedByRole && <DetailRow label="Décidé par" value={detailItem.item.decidedByRole === 'DG' ? 'Direction Générale' : 'DRH'} />}
              {detailItem.item.reason && <DetailRow label="Motif" value={detailItem.item.reason} />}
              {detailItem.item.rejectionReason && <DetailRow label="Motif du refus" value={detailItem.item.rejectionReason} />}
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
