'use client';

// ============================================================================
// 📁 components/EmployeeTicketHistorySidebar.tsx
// ✅ Traçabilité complète par employé : tous ses tickets de permission
//    (peu importe la période), avec statistiques (nb urgences, nb missions,
//    temps moyen dehors, retours à l'heure) — ouvert au clic sur un employé
//    depuis la page de gestion des permissions.
// ============================================================================

import React, { useMemo } from 'react';
import {
  Clock, CheckCircle2, XCircle, Ban, AlertTriangle, TrendingUp,
  Stethoscope, Briefcase, HelpCircle, Timer, CalendarClock,
} from 'lucide-react';
import SlideOver from './SlideOver';

export interface TicketHistoryItem {
  id: string;
  type: 'URGENCE' | 'MISSION' | 'AUTRE' | string;
  missionType?: string | null;
  reason: string;
  destination?: string | null;
  departureTime: string;
  expectedReturnTime: string;
  actualReturnTime?: string | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED' | string;
  createdAt: string;
  rejectionReason?: string | null;
}

export interface EmployeeTicketHistoryData {
  employee: { firstName: string; lastName: string; employeeNumber?: string; department?: string; photoUrl?: string | null };
  tickets: TicketHistoryItem[];
}

const TYPE_ICON: Record<string, any> = { URGENCE: Stethoscope, MISSION: Briefcase, AUTRE: HelpCircle };
const TYPE_LABEL: Record<string, string> = { URGENCE: 'Urgence', MISSION: 'Mission', AUTRE: 'Autre' };

const STATUS_CONFIG: Record<string, { label: string; badge: string; icon: any }> = {
  PENDING:   { label: 'En attente', badge: 'bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800', icon: Clock },
  APPROVED:  { label: 'Autorisé',   badge: 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-800', icon: CheckCircle2 },
  REJECTED:  { label: 'Refusé',     badge: 'bg-red-50 text-red-700 border-red-100 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800', icon: XCircle },
  CANCELLED: { label: 'Annulé',     badge: 'bg-gray-50 text-gray-500 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700', icon: Ban },
};

const fmtDateTime = (d?: string | null) => d ? new Date(d).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

export default function EmployeeTicketHistorySidebar({
  open, onClose, data,
}: { open: boolean; onClose: () => void; data: EmployeeTicketHistoryData | null }) {

  const stats = useMemo(() => {
    if (!data) return null;
    const tickets = data.tickets;
    const approved = tickets.filter(t => t.status === 'APPROVED');
    const urgences = tickets.filter(t => t.type === 'URGENCE').length;
    const missions = tickets.filter(t => t.type === 'MISSION').length;
    const rejected = tickets.filter(t => t.status === 'REJECTED').length;

    const withReturn = approved.filter(t => t.actualReturnTime);
    const onTime = withReturn.filter(t => new Date(t.actualReturnTime!) <= new Date(t.expectedReturnTime)).length;
    const onTimeRate = withReturn.length > 0 ? Math.round((onTime / withReturn.length) * 100) : null;

    const totalMinutesOut = withReturn.reduce((sum, t) => {
      const diff = new Date(t.actualReturnTime!).getTime() - new Date(t.departureTime).getTime();
      return sum + Math.max(0, diff / 60000);
    }, 0);
    const avgMinutesOut = withReturn.length > 0 ? Math.round(totalMinutesOut / withReturn.length) : null;

    return { total: tickets.length, urgences, missions, rejected, onTimeRate, avgMinutesOut, withReturnCount: withReturn.length };
  }, [data]);

  if (!data) return <SlideOver open={open} onClose={onClose} title="">{null}</SlideOver>;

  const initials = `${data.employee.firstName?.[0] ?? ''}${data.employee.lastName?.[0] ?? ''}`;
  const sorted = [...data.tickets].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <SlideOver
      open={open}
      onClose={onClose}
      title={`${data.employee.firstName} ${data.employee.lastName}`}
      subtitle={`Historique complet des permissions${data.employee.department ? ` · ${data.employee.department}` : ''}`}
      widthClass="max-w-lg"
    >
      <div className="flex items-center gap-4 mb-6">
        <div className="w-14 h-14 rounded-2xl bg-sky-100 dark:bg-sky-900/30 flex items-center justify-center text-base font-bold text-sky-600 overflow-hidden shrink-0">
          {data.employee.photoUrl ? <img src={data.employee.photoUrl} className="w-full h-full object-cover" alt={initials} /> : initials}
        </div>
        <div>
          <p className="text-sm text-gray-500">Matricule</p>
          <p className="font-semibold text-gray-900 dark:text-white">{data.employee.employeeNumber || '—'}</p>
        </div>
      </div>

      {stats && (
        <>
          <div className="grid grid-cols-4 gap-2 mb-4">
            <div className="p-3 rounded-xl border border-gray-100 dark:border-gray-700 text-center">
              <p className="text-lg font-bold text-gray-900 dark:text-white leading-none">{stats.total}</p>
              <p className="text-[10px] text-gray-400 mt-1">Tickets</p>
            </div>
            <div className="p-3 rounded-xl border border-gray-100 dark:border-gray-700 text-center">
              <Stethoscope size={14} className="mx-auto mb-1 text-red-400" />
              <p className="text-lg font-bold text-gray-900 dark:text-white leading-none">{stats.urgences}</p>
              <p className="text-[10px] text-gray-400 mt-1">Urgences</p>
            </div>
            <div className="p-3 rounded-xl border border-gray-100 dark:border-gray-700 text-center">
              <Briefcase size={14} className="mx-auto mb-1 text-violet-400" />
              <p className="text-lg font-bold text-gray-900 dark:text-white leading-none">{stats.missions}</p>
              <p className="text-[10px] text-gray-400 mt-1">Missions</p>
            </div>
            <div className="p-3 rounded-xl border border-gray-100 dark:border-gray-700 text-center">
              <XCircle size={14} className="mx-auto mb-1 text-gray-400" />
              <p className="text-lg font-bold text-gray-900 dark:text-white leading-none">{stats.rejected}</p>
              <p className="text-[10px] text-gray-400 mt-1">Refusés</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 mb-6">
            <div className={`p-3.5 rounded-xl border flex items-center gap-2.5 ${stats.onTimeRate == null ? 'border-gray-100 dark:border-gray-700' : stats.onTimeRate >= 80 ? 'border-emerald-100 bg-emerald-50 dark:bg-emerald-900/20 dark:border-emerald-800' : 'border-orange-100 bg-orange-50 dark:bg-orange-900/20 dark:border-orange-800'}`}>
              {stats.onTimeRate == null ? <TrendingUp size={16} className="text-gray-400" /> : stats.onTimeRate >= 80 ? <CheckCircle2 size={16} className="text-emerald-500" /> : <AlertTriangle size={16} className="text-orange-500" />}
              <div>
                <p className="text-xs font-bold text-gray-800 dark:text-gray-100">{stats.onTimeRate != null ? `${stats.onTimeRate}%` : '—'}</p>
                <p className="text-[10px] text-gray-400">Retours à l&apos;heure</p>
              </div>
            </div>
            <div className="p-3.5 rounded-xl border border-gray-100 dark:border-gray-700 flex items-center gap-2.5">
              <Timer size={16} className="text-gray-400" />
              <div>
                <p className="text-xs font-bold text-gray-800 dark:text-gray-100">{stats.avgMinutesOut != null ? `${Math.round(stats.avgMinutesOut / 60 * 10) / 10}h` : '—'}</p>
                <p className="text-[10px] text-gray-400">Durée moyenne dehors</p>
              </div>
            </div>
          </div>
        </>
      )}

      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Historique ({sorted.length})</p>
      <div className="space-y-2">
        {sorted.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">Aucun ticket enregistré pour cet employé.</p>
        ) : sorted.map(t => {
          const Icon = TYPE_ICON[t.type] ?? HelpCircle;
          const sCfg = STATUS_CONFIG[t.status] ?? STATUS_CONFIG.PENDING;
          const SIcon = sCfg.icon;
          const late = t.actualReturnTime && new Date(t.actualReturnTime) > new Date(t.expectedReturnTime);
          return (
            <div key={t.id} className="p-3.5 rounded-xl border border-gray-100 dark:border-gray-700">
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-2 min-w-0">
                  <Icon size={14} className="text-gray-400 shrink-0" />
                  <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{TYPE_LABEL[t.type] ?? t.type}</p>
                </div>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border shrink-0 flex items-center gap-1 ${sCfg.badge}`}>
                  <SIcon size={10} /> {sCfg.label}
                </span>
              </div>
              <p className="text-xs text-gray-400 mb-1">{fmtDateTime(t.departureTime)} → {t.actualReturnTime ? fmtDateTime(t.actualReturnTime) : `prévu ${new Date(t.expectedReturnTime).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`}</p>
              <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-2">{t.reason}</p>
              {late && (
                <p className="text-[11px] text-orange-500 mt-1 flex items-center gap-1"><AlertTriangle size={11} /> Retour en retard</p>
              )}
              {t.status === 'REJECTED' && t.rejectionReason && (
                <p className="text-[11px] text-red-500 mt-1">Motif : {t.rejectionReason}</p>
              )}
            </div>
          );
        })}
      </div>
    </SlideOver>
  );
}
