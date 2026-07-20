'use client';

// ============================================================================
// 📁 components/EmployeeLoanHistorySidebar.tsx
// ✅ Historique complet (prêts + avances, tous statuts) d'un employé — ouvert
//    au clic sur son nom/photo depuis la page de gestion /loans.
// ============================================================================

import React from 'react';
import { Banknote, Wallet, Clock, CheckCircle2, XCircle, Ban } from 'lucide-react';
import SlideOver from './SlideOver';

export interface EmployeeLoanHistoryData {
  employee: { firstName: string; lastName: string; employeeNumber?: string; department?: string; photoUrl?: string | null };
  loans: any[];
  advances: any[];
}

const STATUS_BADGE: Record<string, { label: string; cls: string; icon: any }> = {
  PENDING:      { label: 'En attente',   cls: 'bg-amber-50 text-amber-700 border-amber-100', icon: Clock },
  PENDING_DG:   { label: 'Attente DG',   cls: 'bg-amber-50 text-amber-700 border-amber-100', icon: Clock },
  ACTIVE:       { label: 'Actif',        cls: 'bg-emerald-50 text-emerald-700 border-emerald-100', icon: CheckCircle2 },
  APPROVED:     { label: 'Approuvée',    cls: 'bg-emerald-50 text-emerald-700 border-emerald-100', icon: CheckCircle2 },
  PAID:         { label: 'Soldé',        cls: 'bg-sky-50 text-sky-700 border-sky-100', icon: CheckCircle2 },
  DEDUCTED:     { label: 'Déduite',      cls: 'bg-sky-50 text-sky-700 border-sky-100', icon: CheckCircle2 },
  REJECTED:     { label: 'Refusé',       cls: 'bg-red-50 text-red-700 border-red-100', icon: XCircle },
  CANCELLED:    { label: 'Annulé',       cls: 'bg-gray-50 text-gray-500 border-gray-200', icon: Ban },
};

export default function EmployeeLoanHistorySidebar({ open, onClose, data }: { open: boolean; onClose: () => void; data: EmployeeLoanHistoryData | null }) {
  if (!data) return <SlideOver open={open} onClose={onClose} title="">{null}</SlideOver>;

  const initials = `${data.employee.firstName?.[0] ?? ''}${data.employee.lastName?.[0] ?? ''}`;
  const totalActiveLoans = data.loans.filter(l => l.status === 'ACTIVE').reduce((s, l) => s + Number(l.remainingBalance || 0), 0);

  return (
    <SlideOver open={open} onClose={onClose} title={`${data.employee.firstName} ${data.employee.lastName}`} subtitle="Historique prêts & avances" widthClass="max-w-lg">
      <div className="flex items-center gap-4 mb-6">
        <div className="w-14 h-14 rounded-2xl bg-sky-100 dark:bg-sky-900/30 flex items-center justify-center text-base font-bold text-sky-600 overflow-hidden shrink-0">
          {data.employee.photoUrl ? <img src={data.employee.photoUrl} className="w-full h-full object-cover" alt={initials} /> : initials}
        </div>
        <div>
          <p className="text-sm text-gray-500">Matricule</p>
          <p className="font-semibold text-gray-900 dark:text-white">{data.employee.employeeNumber || '—'}</p>
        </div>
      </div>

      {totalActiveLoans > 0 && (
        <div className="p-4 rounded-2xl bg-gradient-to-br from-orange-500 to-red-500 text-white mb-5">
          <p className="text-xs font-semibold opacity-80 uppercase tracking-wider">Solde de prêt(s) restant</p>
          <p className="text-2xl font-bold mt-1">{Math.round(totalActiveLoans).toLocaleString('fr-FR')} FCFA</p>
        </div>
      )}

      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5"><Banknote size={13} /> Prêts ({data.loans.length})</p>
      <div className="space-y-2 mb-6">
        {data.loans.length === 0 ? <p className="text-sm text-gray-400 py-2">Aucun prêt.</p> : data.loans.map(l => {
          const cfg = STATUS_BADGE[l.status] ?? STATUS_BADGE.PENDING;
          const Icon = cfg.icon;
          return (
            <div key={l.id} className="p-3 rounded-xl border border-gray-100 dark:border-gray-700">
              <div className="flex items-center justify-between mb-1">
                <p className="text-sm font-semibold text-gray-900 dark:text-white">{Number(l.amount).toLocaleString('fr-FR')} FCFA <span className="text-xs text-gray-400 font-normal">({l.type})</span></p>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border flex items-center gap-1 ${cfg.cls}`}><Icon size={10} /> {cfg.label}</span>
              </div>
              <p className="text-xs text-gray-400">{new Date(l.createdAt).toLocaleDateString('fr-FR')} · reste {Number(l.remainingBalance).toLocaleString('fr-FR')} FCFA</p>
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
            <div key={a.id} className="p-3 rounded-xl border border-gray-100 dark:border-gray-700">
              <div className="flex items-center justify-between mb-1">
                <p className="text-sm font-semibold text-gray-900 dark:text-white">{Number(a.amount).toLocaleString('fr-FR')} FCFA</p>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border flex items-center gap-1 ${cfg.cls}`}><Icon size={10} /> {cfg.label}</span>
              </div>
              <p className="text-xs text-gray-400">{new Date(a.createdAt).toLocaleDateString('fr-FR')} · déduction {a.deductMonth}/{a.deductYear}</p>
            </div>
          );
        })}
      </div>
    </SlideOver>
  );
}
