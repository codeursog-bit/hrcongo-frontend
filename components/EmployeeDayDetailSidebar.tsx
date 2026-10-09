'use client';

// ============================================================================
// 📁 components/EmployeeDayDetailSidebar.tsx
// ✅ Affiche le détail complet de la présence/absence d'un employé pour le
//    jour sélectionné — ouverte au clic sur une ligne dans DailyView.
// ============================================================================

import React from 'react';
import {
  Clock, LogIn, LogOut, Timer, Building2, Briefcase, Phone,
  BadgeCheck, CalendarClock, StickyNote, MapPin, Wifi, ChevronDown,
} from 'lucide-react';
import SlideOver from './SlideOver';
import { PUNCH_METHOD_LABEL } from '@/lib/punch-method';

const STATUS_CONFIG: Record<string, { label: string; badge: string }> = {
  PRESENT:       { label: 'Présent',          badge: 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-800' },
  LATE:          { label: 'Retard',            badge: 'bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800' },
  ABSENT_UNPAID: { label: 'Absent (non-payé)', badge: 'bg-red-50 text-red-700 border-red-100 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800' },
  ABSENT_PAID:   { label: 'Absent (justifié)', badge: 'bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800' },
  REMOTE:        { label: 'Télétravail',       badge: 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-800' },
  ON_LEAVE:      { label: 'Congé',             badge: 'bg-[var(--surface-2)] text-[var(--text-muted)]' },
  LEAVE:         { label: 'Congé',             badge: 'bg-[var(--surface-2)] text-[var(--text-muted)]' },
  HOLIDAY:       { label: 'Férié',             badge: 'bg-[var(--surface-2)] text-[var(--text-muted)]' },
};

// 🆕 Trace de la décision de zone enregistrée avec le pointage (voir GeoTrace côté serveur)
export interface GeoTrace {
  basis: 'RADIUS' | 'TOLERANCE' | 'TRUSTED_IP';
  distance: number;
  radius: number;
  accuracy: number | null;
  tolerance: number | null;
  site: string;
  ip: string | null;
  ipKind?: 'ADMIN' | 'LEARNED';
  ipLabel?: string;
  ipPeople?: number;
}

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
  checkInMethod?: string | null;
  checkOutMethod?: string | null;
  checkInSource?: string | null;
  checkOutSource?: string | null;
  checkInGeo?: GeoTrace | null;
  checkOutGeo?: GeoTrace | null;
}

export default function EmployeeDayDetailSidebar({
  open, onClose, detail,
}: { open: boolean; onClose: () => void; detail: EmployeeDayDetail | null }) {
  if (!detail) return <SlideOver open={open} onClose={onClose} title="" >{null}</SlideOver>;

  const cfg = STATUS_CONFIG[detail.status] ?? { label: detail.status, badge: 'bg-[var(--surface-2)] text-[var(--text-muted)]' };
  const initials = `${detail.employee.firstName?.[0] ?? ''}${detail.employee.lastName?.[0] ?? ''}`;
  const fmtTime = (d?: string) => d ? new Date(d).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '—';
  // Méthode de pointage (entrée / sortie) — « — » quand il n'y a pas de pointage
  const methodLine = (time: string | undefined, method?: string | null, source?: string | null) => {
    if (!time) return null;
    return (
      <p className={`text-xs mt-1 font-semibold ${method === 'SECRET_CODE' ? 'text-amber-600' : 'text-[var(--text-muted)]'}`}>
        {method ? (PUNCH_METHOD_LABEL[method] || method) : 'Méthode non enregistrée'}
        {source ? ` · ${source}` : ''}
      </p>
    );
  };
  // 🆕 Sur quoi la zone a été validée : distance, marge GPS ou wifi. Une ligne discrète, détails au clic.
  const fmtDist = (m: number) => (m >= 1000 ? `${(m / 1000).toFixed(1).replace('.', ',')} km` : `${m} m`);
  const geoLine = (time: string | undefined, geo?: GeoTrace | null) => {
    if (!time || !geo) return null;
    const label =
      geo.basis === 'RADIUS' ? `Zone · distance ${fmtDist(geo.distance)}`
      : geo.basis === 'TOLERANCE' ? `Zone · marge GPS (${fmtDist(geo.distance)})`
      : `Zone · wifi ${geo.ipKind === 'LEARNED' ? 'appris' : 'de confiance'}`;
    const rows: Array<[string, string]> = [
      ['Raison',
        geo.basis === 'RADIUS' ? 'Dans le rayon'
        : geo.basis === 'TOLERANCE' ? 'Hors rayon, accepté grâce à la marge'
        : 'GPS hors zone, accepté par le wifi'],
      ['Site', geo.site],
      ['Distance GPS', fmtDist(geo.distance)],
      ['Rayon', fmtDist(geo.radius)],
    ];
    if (geo.accuracy != null) rows.push(['Précision GPS', `± ${geo.accuracy} m`]);
    if (geo.basis === 'TOLERANCE' && geo.tolerance != null) {
      rows.push(['Marge appliquée',
        `${geo.tolerance} m : ${fmtDist(geo.distance)} − ${geo.tolerance} = ${fmtDist(Math.max(0, geo.distance - geo.tolerance))} ≤ ${fmtDist(geo.radius)}`]);
    }
    if (geo.basis === 'TRUSTED_IP') {
      rows.push(['Wifi',
        geo.ipKind === 'LEARNED'
          ? `IP apprise (${geo.ipPeople ?? '?'} personnes différentes)`
          : `IP de confiance${geo.ipLabel ? ` « ${geo.ipLabel} »` : ''}`]);
    }
    if (geo.ip) rows.push(['IP vue', geo.ip]);
    return (
      <details className="mt-1.5 group">
        <summary className="flex items-center gap-1 text-[11px] text-[var(--text-muted)] cursor-pointer select-none list-none [&::-webkit-details-marker]:hidden hover:text-[var(--text)]">
          {geo.basis === 'TRUSTED_IP' ? <Wifi size={11} className="shrink-0" /> : <MapPin size={11} className="shrink-0" />}
          <span>{label}</span>
          <ChevronDown size={10} className="shrink-0 transition-transform group-open:rotate-180" />
        </summary>
        <dl className="mt-1.5 grid grid-cols-[auto_1fr] gap-x-2 gap-y-0.5 text-[11px] text-[var(--text-muted)]">
          {rows.map(([k, v]) => (
            <React.Fragment key={k}>
              <dt className="opacity-70">{k}</dt>
              <dd className={`text-[var(--text)] break-words ${k === 'IP vue' ? 'font-mono' : ''}`}>{v}</dd>
            </React.Fragment>
          ))}
        </dl>
      </details>
    );
  };
  const fmtDate = (d: string) => new Date(d).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <SlideOver
      open={open}
      onClose={onClose}
      title={`${detail.employee.firstName} ${detail.employee.lastName}`}
      subtitle={detail.employee.position || detail.employee.department?.name}
    >
      <div className="flex items-center gap-4 mb-6">
        <div className="w-16 h-16 rounded-2xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-lg font-bold text-emerald-600 overflow-hidden shrink-0">
          {detail.employee.photoUrl ? <img src={detail.employee.photoUrl} className="w-full h-full object-cover" alt={initials} /> : initials}
        </div>
        <div>
          <span className={`inline-block text-xs font-bold px-3 py-1 rounded-lg border ${cfg.badge}`}>{cfg.label}</span>
          <p className="text-xs text-[var(--text-muted)] mt-1.5 capitalize">{fmtDate(detail.date)}</p>
        </div>
      </div>

      <div className="space-y-2.5">
        <div className="flex items-center gap-3 p-3.5 rounded-xl bg-[var(--surface-2)]">
          <BadgeCheck size={16} className="text-[var(--text-muted)] shrink-0" />
          <div>
            <p className="text-[11px] text-[var(--text-muted)] uppercase tracking-wider font-bold">Matricule</p>
            <p className="text-sm font-semibold text-[var(--text)]">{detail.employee.employeeNumber || '—'}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 p-3.5 rounded-xl bg-[var(--surface-2)]">
          <Building2 size={16} className="text-[var(--text-muted)] shrink-0" />
          <div>
            <p className="text-[11px] text-[var(--text-muted)] uppercase tracking-wider font-bold">Département</p>
            <p className="text-sm font-semibold text-[var(--text)]">{detail.employee.department?.name || '—'}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 p-3.5 rounded-xl bg-[var(--surface-2)]">
          <Briefcase size={16} className="text-[var(--text-muted)] shrink-0" />
          <div>
            <p className="text-[11px] text-[var(--text-muted)] uppercase tracking-wider font-bold">Fonction</p>
            <p className="text-sm font-semibold text-[var(--text)]">{detail.employee.position || '—'}</p>
          </div>
        </div>

        {detail.employee.phone && (
          <div className="flex items-center gap-3 p-3.5 rounded-xl bg-[var(--surface-2)]">
            <Phone size={16} className="text-[var(--text-muted)] shrink-0" />
            <div>
              <p className="text-[11px] text-[var(--text-muted)] uppercase tracking-wider font-bold">Téléphone</p>
              <p className="text-sm font-semibold text-[var(--text)]">{detail.employee.phone}</p>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 mt-5">
        <div className="p-3.5 rounded-xl border border-[var(--border)]">
          <div className="flex items-center gap-1.5 text-[var(--text-muted)] mb-1"><LogIn size={13} /><span className="text-[11px] font-bold uppercase tracking-wider">Entrée</span></div>
          <p className="text-lg font-bold font-mono text-[var(--text)]">{fmtTime(detail.checkIn)}</p>
          {methodLine(detail.checkIn, detail.checkInMethod, detail.checkInSource)}
          {geoLine(detail.checkIn, detail.checkInGeo)}
        </div>
        <div className="p-3.5 rounded-xl border border-[var(--border)]">
          <div className="flex items-center gap-1.5 text-[var(--text-muted)] mb-1"><LogOut size={13} /><span className="text-[11px] font-bold uppercase tracking-wider">Sortie</span></div>
          <p className="text-lg font-bold font-mono text-[var(--text)]">{fmtTime(detail.checkOut)}</p>
          {methodLine(detail.checkOut, detail.checkOutMethod, detail.checkOutSource)}
          {geoLine(detail.checkOut, detail.checkOutGeo)}
        </div>
        <div className="p-3.5 rounded-xl border border-[var(--border)]">
          <div className="flex items-center gap-1.5 text-[var(--text-muted)] mb-1"><Timer size={13} /><span className="text-[11px] font-bold uppercase tracking-wider">Durée</span></div>
          <p className="text-lg font-bold text-[var(--text)]">{detail.totalHours ? `${detail.totalHours.toFixed(1)}h` : '—'}</p>
        </div>
        <div className="p-3.5 rounded-xl border border-[var(--border)]">
          <div className="flex items-center gap-1.5 text-[var(--text-muted)] mb-1"><Clock size={13} /><span className="text-[11px] font-bold uppercase tracking-wider">Heures sup.</span></div>
          <p className="text-lg font-bold text-[var(--text)]">{detail.overtime50 ? `${detail.overtime50.toFixed(1)}h` : '—'}</p>
        </div>
      </div>

      {detail.status === 'LATE' && (
        <div className="flex items-start gap-2 mt-5 p-3.5 rounded-xl bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 text-sm">
          <CalendarClock size={16} className="shrink-0 mt-0.5" />
          <p>Cet employé est arrivé après l&apos;heure officielle configurée pour l&apos;entreprise.</p>
        </div>
      )}

      {(detail.status === 'ABSENT_PAID' || detail.status === 'ABSENT_UNPAID') && (
        <div className="flex items-start gap-2 mt-5 p-3.5 rounded-xl bg-[var(--surface-2)] text-[var(--text-muted)] text-sm">
          <StickyNote size={16} className="shrink-0 mt-0.5" />
          <p>Aucun pointage enregistré ce jour. {detail.status === 'ABSENT_PAID' ? 'Absence justifiée / autorisée.' : "Absence non justifiée à ce jour."}</p>
        </div>
      )}
    </SlideOver>
  );
}