'use client';

// ============================================================================
// 📁 components/DepartmentDetailSidebar.tsx
// ✅ Détail complet d'un département au clic depuis WeeklyView : effectif,
//    masse salariale (déjà exposée par GET /departments), et statistiques de
//    présence de la semaine sélectionnée, + liste des employés du département.
// ============================================================================

import React from 'react';
import {
  Users, Wallet, TrendingUp, CheckCircle2, Clock, XCircle,
  Home, CalendarClock,
} from 'lucide-react';
import SlideOver from './SlideOver';

export interface DepartmentDetail {
  name: string;
  description?: string | null;
  color?: string | null;
  employeeCount: number;
  totalGross?: number;
  totalNet?: number;
  avgSalary?: number;
  weekStats: { present: number; late: number; absent: number; remote: number; leave: number; total: number };
  employees: Array<{
    name: string; position?: string; photoUrl?: string | null;
    present: number; late: number; absent: number; remote: number; leave: number; totalHours: number;
  }>;
}

const fmtMoney = (n?: number) => n != null ? `${Math.round(n).toLocaleString('fr-FR')} FCFA` : '—';

export default function DepartmentDetailSidebar({
  open, onClose, detail,
}: { open: boolean; onClose: () => void; detail: DepartmentDetail | null }) {
  if (!detail) return <SlideOver open={open} onClose={onClose} title="">{null}</SlideOver>;

  const rate = detail.weekStats.total > 0 ? Math.round((detail.weekStats.present / detail.weekStats.total) * 100) : 0;

  return (
    <SlideOver
      open={open}
      onClose={onClose}
      title={detail.name}
      subtitle={`${detail.employeeCount} employé${detail.employeeCount > 1 ? 's' : ''}`}
      widthClass="max-w-lg"
    >
      {detail.description && (
        <p className="text-sm text-[var(--text-muted)] mb-5">{detail.description}</p>
      )}

      {/* Taux de présence de la semaine */}
      <div className="p-4 rounded-2xl bg-emerald-500 text-white mb-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold opacity-80 uppercase tracking-wider">Taux de présence — semaine</p>
            <p className="text-3xl font-bold mt-1">{rate}%</p>
          </div>
          <TrendingUp size={32} className="opacity-70" />
        </div>
      </div>

      {/* Statistiques de la semaine */}
      <div className="grid grid-cols-3 gap-2 mb-5">
        {[
          { label: 'Présents', value: detail.weekStats.present, icon: CheckCircle2, color: 'text-emerald-500' },
          { label: 'Retards', value: detail.weekStats.late, icon: Clock, color: 'text-amber-500' },
          { label: 'Absents', value: detail.weekStats.absent, icon: XCircle, color: 'text-red-500' },
          { label: 'Télétravail', value: detail.weekStats.remote, icon: Home, color: 'text-emerald-400' },
          { label: 'Congés', value: detail.weekStats.leave, icon: CalendarClock, color: 'text-[var(--text-muted)]' },
          { label: 'Pointages', value: detail.weekStats.total, icon: Users, color: 'text-[var(--text-muted)]' },
        ].map(s => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="p-3 rounded-xl border border-[var(--border)] text-center">
              <Icon size={16} className={`mx-auto mb-1 ${s.color}`} />
              <p className="text-lg font-bold text-[var(--text)] leading-none">{s.value}</p>
              <p className="text-[10px] text-[var(--text-muted)] mt-1">{s.label}</p>
            </div>
          );
        })}
      </div>

      {/* Masse salariale */}
      {(detail.totalGross != null || detail.avgSalary != null) && (
        <div className="space-y-2 mb-5">
          <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider flex items-center gap-1.5"><Wallet size={13} /> Masse salariale</p>
          <div className="grid grid-cols-2 gap-2">
            <div className="p-3 rounded-xl bg-[var(--surface-2)]">
              <p className="text-[11px] text-[var(--text-muted)]">Brut total</p>
              <p className="text-sm font-bold text-[var(--text)]">{fmtMoney(detail.totalGross)}</p>
            </div>
            <div className="p-3 rounded-xl bg-[var(--surface-2)]">
              <p className="text-[11px] text-[var(--text-muted)]">Net total</p>
              <p className="text-sm font-bold text-[var(--text)]">{fmtMoney(detail.totalNet)}</p>
            </div>
            <div className="p-3 rounded-xl bg-[var(--surface-2)] col-span-2">
              <p className="text-[11px] text-[var(--text-muted)]">Salaire moyen</p>
              <p className="text-sm font-bold text-[var(--text)]">{fmtMoney(detail.avgSalary)}</p>
            </div>
          </div>
        </div>
      )}

      {/* Liste des employés */}
      <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2">Employés du département</p>
      <div className="space-y-2">
        {detail.employees.map((e, i) => {
          const initials = e.name.split(' ').map(p => p[0]).slice(0, 2).join('');
          return (
            <div key={i} className="flex items-center gap-3 p-3 rounded-xl border border-[var(--border)]">
              <div className="w-9 h-9 rounded-lg bg-[var(--surface-2)] flex items-center justify-center text-xs font-bold text-[var(--text-muted)] overflow-hidden shrink-0">
                {e.photoUrl ? <img src={e.photoUrl} className="w-full h-full object-cover" alt={initials} /> : initials}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[var(--text)] truncate">{e.name}</p>
                <p className="text-[11px] text-[var(--text-muted)] truncate">{e.position}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-xs font-bold text-[var(--text-muted)]">{e.totalHours.toFixed(1)}h</p>
                <p className="text-[10px] text-[var(--text-muted)]">{e.present}P · {e.late}R · {e.absent}A</p>
              </div>
            </div>
          );
        })}
      </div>
    </SlideOver>
  );
}