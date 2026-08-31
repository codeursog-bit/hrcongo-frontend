'use client';

// ============================================================================
// 📁 components/EmployeeDayDetailSidebar.tsx
// ✅ Affiche le détail complet de la présence/absence d'un employé pour le
//    jour sélectionné — ouverte au clic sur une ligne dans DailyView.
// ============================================================================

import React from 'react';
import {
  Clock, LogIn, LogOut, Timer, Building2, Briefcase, Phone,
  BadgeCheck, CalendarClock, StickyNote,
} from 'lucide-react';
import SlideOver from './SlideOver';

const STATUS_CONFIG: Record<string, { label: string; badge: string }> = {
  PRESENT:       { label: 'Présent',          badge: 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-800' },
  LATE:          { label: 'Retard',            badge: 'bg-orange-50 text-orange-700 border-orange-100 dark:bg-orange-900/20 dark:text-orange-300 dark:border-orange-800' },
  ABSENT_UNPAID: { label: 'Absent (non-payé)', badge: 'bg-red-50 text-red-700 border-red-100 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800' },
  ABSENT_PAID:   { label: 'Absent (justifié)', badge: 'bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800' },
  REMOTE:        { label: 'Télétravail',       badge: 'bg-violet-50 text-violet-700 border-violet-100 dark:bg-violet-900/20 dark:text-violet-300 dark:border-violet-800' },
  ON_LEAVE:      { label: 'Congé',             badge: 'bg-sky-50 text-sky-700 border-sky-100 dark:bg-sky-900/20 dark:text-sky-300 dark:border-sky-800' },
  LEAVE:         { label: 'Congé',             badge: 'bg-sky-50 text-sky-700 border-sky-100 dark:bg-sky-900/20 dark:text-sky-300 dark:border-sky-800' },
  HOLIDAY:       { label: 'Férié',             badge: 'bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800' },
};

export interface EmployeeDayDetail {
  employee: {
    firstName: string; lastName: string; photoUrl?: string | null;
    employeeNumber?: string; position?: string; phone?: string;
    department?: { name?: string } | null;
  };
  date: string;
  status: string;
  checkIn?: string;
  checkOut?: string;
  totalHours?: number;
  overtime50?: number;
}

export default function EmployeeDayDetailSidebar({
  open, onClose, detail,
}: { open: boolean; onClose: () => void; detail: EmployeeDayDetail | null }) {
  if (!detail) return <SlideOver open={open} onClose={onClose} title="" >{null}</SlideOver>;

  const cfg = STATUS_CONFIG[detail.status] ?? { label: detail.status, badge: 'bg-gray-50 text-gray-600 border-gray-200' };
  const initials = `${detail.employee.firstName?.[0] ?? ''}${detail.employee.lastName?.[0] ?? ''}`;
  const fmtTime = (d?: string) => d ? new Date(d).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '—';
  const fmtDate = (d: string) => new Date(d).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <SlideOver
      open={open}
      onClose={onClose}
      title={`${detail.employee.firstName} ${detail.employee.lastName}`}
      subtitle={detail.employee.position || detail.employee.department?.name}
    >
      <div className="flex items-center gap-4 mb-6">
        <div className="w-16 h-16 rounded-2xl bg-sky-100 dark:bg-sky-900/30 flex items-center justify-center text-lg font-bold text-sky-600 overflow-hidden shrink-0">
          {detail.employee.photoUrl ? <img src={detail.employee.photoUrl} className="w-full h-full object-cover" alt={initials} /> : initials}
        </div>
        <div>
          <span className={`inline-block text-xs font-bold px-3 py-1 rounded-lg border ${cfg.badge}`}>{cfg.label}</span>
          <p className="text-xs text-gray-400 mt-1.5 capitalize">{fmtDate(detail.date)}</p>
        </div>
      </div>

      <div className="space-y-2.5">
        <div className="flex items-center gap-3 p-3.5 rounded-xl bg-gray-50 dark:bg-gray-700/40">
          <BadgeCheck size={16} className="text-gray-400 shrink-0" />
          <div>
            <p className="text-[11px] text-gray-400 uppercase tracking-wider font-bold">Matricule</p>
            <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">{detail.employee.employeeNumber || '—'}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 p-3.5 rounded-xl bg-gray-50 dark:bg-gray-700/40">
          <Building2 size={16} className="text-gray-400 shrink-0" />
          <div>
            <p className="text-[11px] text-gray-400 uppercase tracking-wider font-bold">Département</p>
            <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">{detail.employee.department?.name || '—'}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 p-3.5 rounded-xl bg-gray-50 dark:bg-gray-700/40">
          <Briefcase size={16} className="text-gray-400 shrink-0" />
          <div>
            <p className="text-[11px] text-gray-400 uppercase tracking-wider font-bold">Fonction</p>
            <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">{detail.employee.position || '—'}</p>
          </div>
        </div>

        {detail.employee.phone && (
          <div className="flex items-center gap-3 p-3.5 rounded-xl bg-gray-50 dark:bg-gray-700/40">
            <Phone size={16} className="text-gray-400 shrink-0" />
            <div>
              <p className="text-[11px] text-gray-400 uppercase tracking-wider font-bold">Téléphone</p>
              <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">{detail.employee.phone}</p>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 mt-5">
        <div className="p-3.5 rounded-xl border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-1.5 text-gray-400 mb-1"><LogIn size={13} /><span className="text-[11px] font-bold uppercase tracking-wider">Entrée</span></div>
          <p className="text-lg font-bold font-mono text-gray-900 dark:text-white">{fmtTime(detail.checkIn)}</p>
        </div>
        <div className="p-3.5 rounded-xl border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-1.5 text-gray-400 mb-1"><LogOut size={13} /><span className="text-[11px] font-bold uppercase tracking-wider">Sortie</span></div>
          <p className="text-lg font-bold font-mono text-gray-900 dark:text-white">{fmtTime(detail.checkOut)}</p>
        </div>
        <div className="p-3.5 rounded-xl border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-1.5 text-gray-400 mb-1"><Timer size={13} /><span className="text-[11px] font-bold uppercase tracking-wider">Durée</span></div>
          <p className="text-lg font-bold text-gray-900 dark:text-white">{detail.totalHours ? `${detail.totalHours.toFixed(1)}h` : '—'}</p>
        </div>
        <div className="p-3.5 rounded-xl border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-1.5 text-gray-400 mb-1"><Clock size={13} /><span className="text-[11px] font-bold uppercase tracking-wider">Heures sup.</span></div>
          <p className="text-lg font-bold text-gray-900 dark:text-white">{detail.overtime50 ? `${detail.overtime50.toFixed(1)}h` : '—'}</p>
        </div>
      </div>

      {detail.status === 'LATE' && (
        <div className="flex items-start gap-2 mt-5 p-3.5 rounded-xl bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300 text-sm">
          <CalendarClock size={16} className="shrink-0 mt-0.5" />
          <p>Cet employé est arrivé après l&apos;heure officielle configurée pour l&apos;entreprise.</p>
        </div>
      )}

      {(detail.status === 'ABSENT_PAID' || detail.status === 'ABSENT_UNPAID') && (
        <div className="flex items-start gap-2 mt-5 p-3.5 rounded-xl bg-gray-50 dark:bg-gray-700/40 text-gray-500 text-sm">
          <StickyNote size={16} className="shrink-0 mt-0.5" />
          <p>Aucun pointage enregistré ce jour. {detail.status === 'ABSENT_PAID' ? 'Absence justifiée / autorisée.' : "Absence non justifiée à ce jour."}</p>
        </div>
      )}
    </SlideOver>
  );
}
