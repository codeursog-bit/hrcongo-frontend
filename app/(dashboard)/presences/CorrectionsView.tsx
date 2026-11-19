// 📁 EMPLACEMENT (projet frontend) : app/(dashboard)/presences/CorrectionsView.tsx
'use client';

// ============================================================================
// ============================================================================
// 🔥 KONZA SUITE — Vue Corrections + Workflow Heures Sup
//
// Améliorations UX :
//   • Interface slide-over au lieu d'édition inline (moins compressée)
//   • Badges statut visuels clairs avec icônes
//   • Workflow overtime intégré (Oubli / HS / Approbation patron)
//   • Compteur temps réel pour pointages ouverts
//   • Historique redesigné avec timeline
//   • Toasts de confirmation (plus d'alert() natifs)
//   • Responsive mobile
// ============================================================================

import { AttendanceDialog } from '@/components/attendance/AttendanceDialog';
import React, { useState, useEffect, useCallback } from 'react';
import {
  AlertCircle, Calendar, Edit3, Check, X, CheckCircle, XCircle,
  MapPin, History, Clock, ChevronRight, Timer, UserCheck,
  AlertTriangle, Loader2, RefreshCw, Filter, Search,
  ThumbsUp, ThumbsDown, HelpCircle, Info, Zap, Moon,
  ArrowRight, Eye, Shield
} from 'lucide-react';
import { api } from '@/services/api';
import { PUNCH_METHOD_LABEL, summaryPunchMethod } from '@/lib/punch-method';

// ─── Types ────────────────────────────────────────────────────────────────────
interface OvertimePendingItem {
  id: string;
  employeeId: string;
  date: string;
  checkIn: string;
  pendingOvertimeHours: number;
  overtimeStatus: 'PENDING_EMPLOYEE' | 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED' | 'AUTO_CLOSED' | 'NONE';
  overtimeRequestedAt?: string;
  employee: {
    firstName: string;
    lastName: string;
    photoUrl?: string;
    department?: { name: string };
  };
}

interface CorrectionsViewProps {
  data: any;
  userRole: string;
  userDepartment: string;
  onRefresh: () => void;
  canRecordAttendanceForAll?: boolean; // 🆕 permission "secrétaire" : pointage manuel pour tout le monde
}

// ─── Heures : toujours en heure du Congo, indépendamment du fuseau du navigateur ───
// (avant : toISOString().slice(0,16) affichait l'heure UTC dans un champ « heure locale »,
//  ce qui décalait le pointage d'1 h à chaque enregistrement)
const TZ = 'Africa/Brazzaville';
const CONGO_OFFSET = '+01:00';
const pad2 = (n: number) => String(n).padStart(2, '0');
const toHM = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleTimeString('en-GB', { timeZone: TZ, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }) : '';
const congoDateOf = (iso: string) => new Date(iso).toLocaleDateString('en-CA', { timeZone: TZ });
const toIso = (day: string, hm: string, nextDay = false) => {
  const t = new Date(`${day}T${hm}:00${CONGO_OFFSET}`).getTime() + (nextDay ? 86_400_000 : 0);
  return new Date(t).toISOString();
};
const minutesOf = (hm: string) => { const [h, m] = hm.split(':').map(Number); return h * 60 + m; };
const fmtDuration = (min: number) => `${Math.floor(min / 60)} h ${pad2(min % 60)}`;

const STATUS_LABEL: Record<string, string> = {
  PRESENT: 'Présent', LATE: 'En retard', REMOTE: 'Télétravail', ABSENT_PAID: 'Absent justifié',
  ABSENT_UNPAID: 'Absent non justifié', LEAVE: 'Congé', HOLIDAY: 'Férié', OFF_DAY: 'Repos', UNKNOWN: '—', FUTURE: 'À venir',
};
const FIELD_LABEL: Record<string, string> = { status: 'Statut', checkIn: 'Entrée', checkOut: 'Sortie', totalHours: 'Durée (h)', pause: 'Pause' };
const ACTION_LABEL: Record<string, string> = { MANUAL_CREATE: 'Saisie manuelle', CORRECTION: 'Correction', DEVICE_SYNC: 'Pointeuse' };
const ROLE_LABEL: Record<string, string> = { ADMIN: 'Admin', SUPER_ADMIN: 'Admin', HR_MANAGER: 'RH', MANAGER: 'Manager', EMPLOYEE: 'Secrétaire' };

function fmtTraceValue(field: string, v: string): string {
  if (!v) return '—';
  if (field === 'status') return STATUS_LABEL[v] || v;
  if ((field === 'checkIn' || field === 'checkOut') && /^\d{4}-\d{2}-\d{2}T/.test(v)) return toHM(v);
  if (field === 'pause') return v.split('→').map((x) => (/^\d{4}-\d{2}-\d{2}T/.test(x) ? toHM(x) : x)).join(' → ');
  return v;
}

/** Détail « quoi » d'une ligne d'historique : [{ label, from, to }]. Vide si l'ancien format n'est pas lisible. */
function describeTrace(log: any): { label: string; from: string; to: string }[] {
  const fields = String(log.field || '').split(',').filter(Boolean);
  const olds = String(log.oldValue ?? '').split(',');
  const news = String(log.newValue ?? '').split(',');
  if (!fields.length || olds.length !== fields.length || news.length !== fields.length) return [];
  return fields
    .map((f, i) => ({ label: FIELD_LABEL[f] || f, from: fmtTraceValue(f, olds[i]), to: fmtTraceValue(f, news[i]), same: olds[i] === news[i] }))
    .filter((c) => !c.same)
    .map(({ label, from, to }) => ({ label, from, to }));
}

// ─── Composant Toast ──────────────────────────────────────────────────────────
function Toast({ message, type, onClose }: { message: string; type: 'success' | 'error' | 'info'; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, [onClose]);

  const colors = {
    success: 'bg-[var(--brand)]',
    error:   'bg-[var(--danger)]',
    info:    'bg-[var(--brand)]',
  };
  const icons = { success: <Check size={16} />, error: <X size={16} />, info: <Info size={16} /> };

  return (
    <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl bg-[var(--brand)] text-[var(--on-brand)] shadow-2xl  ${colors[type]} animate-slide-up`}>
      <span className="p-1 bg-[var(--surface)] rounded-lg">{icons[type]}</span>
      <span className="font-semibold text-sm">{message}</span>
      <button onClick={onClose} className="ml-2 opacity-70 hover:opacity-100" aria-label="Fermer"><X size={14} /></button>
    </div>
  );
}

// ─── Compteur temps réel ──────────────────────────────────────────────────────
function LiveTimer({ checkIn }: { checkIn: string }) {
  const [elapsed, setElapsed] = useState('');

  useEffect(() => {
    const calc = () => {
      const diff = Date.now() - new Date(checkIn).getTime();
      const h = Math.floor(diff / 3_600_000);
      const m = Math.floor((diff % 3_600_000) / 60_000);
      setElapsed(`${h}h${String(m).padStart(2, '0')}`);
    };
    calc();
    const id = setInterval(calc, 60_000);
    return () => clearInterval(id);
  }, [checkIn]);

  return (
    <span className="inline-flex items-center gap-1 text-[var(--warning-text)]  font-mono text-sm font-semibold">
      <Timer size={13} className="" />
      {elapsed}
    </span>
  );
}

// ─── Badge statut overtime ────────────────────────────────────────────────────
function OvertimeBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; class: string; icon: React.ReactNode }> = {
    PENDING_EMPLOYEE: { label: 'En attente employé', class: 'bg-[color-mix(in_srgb,var(--mustard)_14%,var(--surface))] text-[var(--warning-text)]  ', icon: <HelpCircle size={12} /> },
    PENDING_APPROVAL: { label: 'En attente patron',  class: 'bg-[color-mix(in_srgb,var(--mustard)_14%,var(--surface))] text-[var(--warning-text)]  ',   icon: <Clock size={12} /> },
    APPROVED:         { label: 'Approuvé',            class: 'bg-[color-mix(in_srgb,var(--green)_12%,var(--surface))] text-[var(--success-text)]  ', icon: <CheckCircle size={12} /> },
    REJECTED:         { label: 'Refusé',              class: 'bg-[color-mix(in_srgb,var(--danger)_10%,var(--surface))] text-[var(--danger-text)]  ',       icon: <XCircle size={12} /> },
    AUTO_CLOSED:      { label: 'Auto-clôturé',        class: 'bg-[var(--surface-2)] text-[var(--text-muted)]',      icon: <Shield size={12} /> },
  };
  const c = config[status];
  if (!c) return null;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${c.class}`}>
      {c.icon}{c.label}
    </span>
  );
}

// ─── Modal slide-over correction ─────────────────────────────────────────────
type PresenceKind = 'PRESENT' | 'REMOTE' | 'ABSENT_PAID' | 'ABSENT_UNPAID';

function CorrectionModal({
  attendance,
  onSave,
  onClose,
  companySettings,
}: {
  attendance: any;
  onSave: (att: any, data: { status: string; checkIn?: string; checkOut?: string; reason: string }) => Promise<void>;
  onClose: () => void;
  companySettings: any;
}) {
  const day = String(attendance.date).slice(0, 10);
  const startHour = Number(companySettings.officialStartHour ?? 8);
  const defaultIn = `${pad2(startHour)}:00`;
  const defaultOut = `${pad2(Math.min(23, startHour + Math.round(Number(companySettings.workHoursPerDay ?? 8))))}:00`;

  const [kind, setKind] = useState<PresenceKind>(
    attendance.status === 'REMOTE' ? 'REMOTE' : attendance.status === 'ABSENT_PAID' ? 'ABSENT_PAID' : 'PRESENT',
  );
  const [timeIn, setTimeIn] = useState(attendance.checkIn ? toHM(attendance.checkIn) : defaultIn);
  const [timeOut, setTimeOut] = useState(attendance.checkOut ? toHM(attendance.checkOut) : defaultOut);
  const [nextDay, setNextDay] = useState(
    !!(attendance.checkIn && attendance.checkOut && congoDateOf(attendance.checkOut) > congoDateOf(attendance.checkIn)),
  );
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);

  const withHours = kind === 'PRESENT' || kind === 'REMOTE';
  const exitNotAfterEntry = withHours && !!timeIn && !!timeOut && minutesOf(timeOut) <= minutesOf(timeIn);
  const effNextDay = nextDay && exitNotAfterEntry;
  const hoursError =
    !withHours ? null
    : !timeIn || !timeOut ? 'Renseignez l’heure d’entrée et l’heure de sortie.'
    : exitNotAfterEntry && !nextDay ? 'La sortie doit être après l’entrée (ou cochez « sortie le lendemain »).'
    : null;
  const durationMin = withHours && !hoursError ? minutesOf(timeOut) - minutesOf(timeIn) + (effNextDay ? 1440 : 0) : 0;
  const lateHint =
    kind === 'PRESENT' && timeIn &&
    minutesOf(timeIn) > startHour * 60 + Number(companySettings.lateToleranceMinutes ?? 0);
  const reasonOk = reason.trim().length >= 3;
  const canSave = reasonOk && !hoursError && !saving;

  const handleSave = async () => {
    if (!canSave) return;
    setSaving(true);
    try {
      await onSave(attendance, {
        status: kind,
        checkIn: withHours ? toIso(day, timeIn) : undefined,
        checkOut: withHours ? toIso(day, timeOut, effNextDay) : undefined,
        reason: reason.trim(),
      });
    } finally {
      setSaving(false);
    }
  };

  const kinds: { value: PresenceKind; label: string; hint: string }[] = [
    { value: 'PRESENT', label: ' Présent', hint: 'avec heures' },
    { value: 'REMOTE', label: ' Télétravail', hint: 'avec heures' },
    { value: 'ABSENT_PAID', label: ' Absent justifié', hint: 'payé' },
    { value: 'ABSENT_UNPAID', label: ' Absent', hint: 'non payé' },
  ];

  const current = attendance.checkIn
    ? `${toHM(attendance.checkIn)} → ${attendance.checkOut ? toHM(attendance.checkOut) : 'en cours'}`
    : STATUS_LABEL[attendance.status] || '—';

  const timeCls = 'w-full px-3 py-3 border-2 border-[var(--border)] rounded-xl bg-[var(--surface)] text-lg font-mono font-semibold text-center focus:border-[var(--border)] focus:ring-2 focus:ring-[var(--focus)] transition-colors';

  return (
    <AttendanceDialog title="Correction" onClose={onClose} busy={saving}>

      <div className="relative w-full sm:max-w-md bg-[var(--surface)] rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden">
        <div className="flex justify-center pt-3 pb-1 sm:hidden"><div className="w-10 h-1 bg-[var(--border)] rounded-full" /></div>

        <div className="px-6 py-4 border-b border-[var(--border)] flex items-start justify-between">
          <div className="min-w-0">
            <h3 className="text-lg font-semibold text-[var(--text)]">{attendance.checkIn ? 'Modifier le pointage' : 'Corriger le pointage'}</h3>
            <p className="text-sm text-[var(--text-muted)] mt-0.5 truncate">
              {attendance.employee.firstName} {attendance.employee.lastName} &bull;{' '}
              {new Date(`${day}T12:00:00Z`).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
            <p className="text-xs text-[var(--text-muted)] mt-1">Actuellement : <span className="font-semibold text-[var(--text)]">{current}</span></p>
          </div>
          <button onClick={onClose} aria-label="Fermer" className="p-2 rounded-xl hover:bg-[var(--surface-2)] transition-colors"><X size={20} className="text-[var(--text-muted)]" /></button>
        </div>

        <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Situation du jour">
            {kinds.map((k) => (
              <button
                key={k.value} type="button" role="radio" aria-checked={kind === k.value} onClick={() => setKind(k.value)}
                className={`px-3 py-3 rounded-xl border-2 text-left transition-colors ${kind === k.value
                  ? 'border-[var(--border)] bg-[color-mix(in_srgb,var(--green)_12%,var(--surface))]  text-[var(--success-text)] '
                  : 'border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--text-muted)]'}`}
              >
                <span className="block text-sm font-semibold">{k.label}</span>
                <span className="block text-[11px] opacity-70">{k.hint}</span>
              </button>
            ))}
          </div>

          {withHours && (
            <div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="corr-in" className="block text-xs font-semibold text-[var(--text-muted)] mb-1.5">Entrée <span className="text-[var(--danger-text)]">*</span></label>
                  <input id="corr-in" type="time" value={timeIn} onChange={(e) => setTimeIn(e.target.value)} className={timeCls} />
                </div>
                <div>
                  <label htmlFor="corr-out" className="block text-xs font-semibold text-[var(--text-muted)] mb-1.5">Sortie <span className="text-[var(--danger-text)]">*</span></label>
                  <input id="corr-out" type="time" value={timeOut} onChange={(e) => setTimeOut(e.target.value)} className={timeCls} />
                </div>
              </div>
              {exitNotAfterEntry && (
                <label className="flex items-center gap-2 mt-3 text-xs font-semibold text-[var(--text)]">
                  <input type="checkbox" checked={nextDay} onChange={(e) => setNextDay(e.target.checked)} className="accent-emerald-500" />
                  La sortie a eu lieu le lendemain (équipe de nuit)
                </label>
              )}
              {hoursError ? (
                <p className="text-xs text-[var(--danger-text)] mt-2 flex items-center gap-1"><AlertCircle size={12} /> {hoursError}</p>
              ) : (
                <p className="text-xs text-[var(--text-muted)] mt-2">
                  Durée : <b className="text-[var(--text)]">{fmtDuration(durationMin)}</b>
                  {lateHint && <span className="text-[var(--warning-text)]"> · sera enregistré « En retard »</span>}
                  <span> · retard et heures sup calculés automatiquement</span>
                </p>
              )}
            </div>
          )}

          <div>
            <label htmlFor="corr-reason" className="block text-sm font-semibold text-[var(--text-muted)] mb-2">Pourquoi ? <span className="text-[var(--danger-text)]">*</span></label>
            <div className="grid grid-cols-2 gap-2 mb-2">
              {['Oubli de pointage confirmé', 'Certificat médical reçu', 'Mission externe validée', 'Erreur système corrigée'].map((r) => (
                <button key={r} type="button" onClick={() => setReason(r)}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold border-2 transition-colors text-left ${reason === r
                    ? 'border-[var(--border)] bg-[color-mix(in_srgb,var(--green)_12%,var(--surface))]  text-[var(--success-text)] '
                    : 'border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--text-muted)]'}`}>
                  {r}
                </button>
              ))}
            </div>
            <textarea id="corr-reason" placeholder="Ou saisissez un motif…" value={reason} onChange={(e) => setReason(e.target.value)} rows={2}
              className="w-full px-4 py-3 border-2 border-[var(--border)] rounded-xl bg-[var(--surface)] text-sm resize-none focus:border-[var(--border)] focus:ring-2 focus:ring-[var(--focus)] transition-colors placeholder-[var(--text-muted)]" />
            <p className="text-[11px] text-[var(--text-muted)] mt-1">Enregistré avec votre nom, la date et l’heure de la modification.</p>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-[var(--border)] flex gap-3">
          <button onClick={onClose} className="flex-1 px-4 py-3 bg-[var(--surface-2)] hover:bg-[var(--border)] text-[var(--text-muted)] rounded-xl text-sm font-semibold transition-colors">Annuler</button>
          <button onClick={handleSave} disabled={!canSave}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-[var(--brand)] hover:bg-[var(--brand)] disabled:opacity-50 disabled:cursor-not-allowed text-[var(--on-brand)] rounded-xl text-sm font-semibold transition-colors">
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
            Enregistrer
          </button>
        </div>
      </div>
    </AttendanceDialog>
  );
}

// ─── Modal approbation/refus heures sup (pour managers) ──────────────────────
function OvertimeApprovalModal({
  item,
  onApprove,
  onReject,
  onClose,
}: {
  item: OvertimePendingItem;
  onApprove: (id: string) => Promise<void>;
  onReject: (id: string, reason: string) => Promise<void>;
  onClose: () => void;
}) {
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleApprove = async () => {
    setLoading(true);
    await onApprove(item.id);
    setLoading(false);
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) return;
    setLoading(true);
    await onReject(item.id, rejectReason);
    setLoading(false);
  };

  return (
    <AttendanceDialog title="Heures supplementaires" onClose={onClose} busy={loading}>


      <div className="relative w-full sm:max-w-md bg-[var(--surface)] rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden">
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1 bg-[var(--border)] rounded-full" />
        </div>

        <div className="px-6 pt-5 pb-4 border-b border-[var(--border)]">
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2.5 bg-[color-mix(in_srgb,var(--mustard)_14%,var(--surface))]  rounded-xl">
              <Zap size={20} className="text-[var(--warning-text)] " />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-[var(--text)]">Heures supplémentaires</h3>
              <p className="text-sm text-[var(--text-muted)]">Demande de validation</p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-4">
          {/* Infos employé */}
          <div className="flex items-center gap-3 p-4 bg-[var(--surface-2)] rounded-2xl">
            <div className="w-12 h-12 rounded-xl bg-[var(--brand)] flex items-center justify-center text-[var(--on-brand)] font-semibold text-lg">
              {item.employee.firstName[0]}{item.employee.lastName[0]}
            </div>
            <div>
              <p className="font-semibold text-[var(--text)]">
                {item.employee.firstName} {item.employee.lastName}
              </p>
              <p className="text-xs text-[var(--text-muted)]">{item.employee.department?.name}</p>
            </div>
          </div>

          {/* Détail heures */}
          <div className="grid grid-cols-2 gap-3 attendance-metrics">
            <div className="p-3 bg-[color-mix(in_srgb,var(--green)_12%,var(--surface))]  rounded-xl text-center">
              <p className="text-2xl font-semibold text-[var(--success-text)] ">
                {item.pendingOvertimeHours.toFixed(1)}h
              </p>
              <p className="text-xs text-[var(--success-text)]  font-semibold">Heures sup déclarées</p>
            </div>
            <div className="p-3 bg-[var(--surface-2)] rounded-xl text-center">
              <p className="text-sm font-semibold text-[var(--text-muted)]">
                {new Date(item.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}
              </p>
              <p className="text-xs text-[var(--text-muted)] mt-1">
                Entrée : {new Date(item.checkIn).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>

          {showRejectForm ? (
            <div className="space-y-3">
              <label className="block text-sm font-semibold text-[var(--text-muted)]">
                Motif du refus <span className="text-[var(--danger-text)]">*</span>
              </label>
              <div className="grid grid-cols-1 gap-1.5">
                {['Heures non autorisées à l\'avance', 'Travail non confirmé', 'Erreur de déclaration'].map(r => (
                  <button key={r} onClick={() => setRejectReason(r)}
                    className={`px-3 py-2 rounded-xl text-xs font-semibold border-2 text-left transition-colors ${
                      rejectReason === r ? 'border-[var(--border)] bg-[color-mix(in_srgb,var(--danger)_10%,var(--surface))]  text-[var(--danger-text)] ' : 'border-[var(--border)] text-[var(--text-muted)]'
                    }`}
                  >{r}</button>
                ))}
              </div>
              <textarea
                placeholder="Ou précisez un motif..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={2}
                className="w-full px-4 py-3 border-2 border-[var(--border)] rounded-xl bg-[var(--surface)] text-sm resize-none focus:border-[var(--border)]"
              />
              <div className="flex gap-2">
                <button onClick={() => setShowRejectForm(false)}
                  className="flex-1 px-4 py-2.5 bg-[var(--surface-2)] rounded-xl text-sm font-semibold text-[var(--text-muted)]">
                  Retour
                </button>
                <button onClick={handleReject} disabled={!rejectReason.trim() || loading}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-[var(--danger)] hover:bg-[var(--danger)] disabled:opacity-50 text-[var(--on-brand)] rounded-xl text-sm font-semibold transition-colors">
                  {loading ? <Loader2 size={14} className="animate-spin" /> : <ThumbsDown size={14} />}
                  Confirmer le refus
                </button>
              </div>
            </div>
          ) : (
            <div className="flex gap-3">
              <button onClick={() => setShowRejectForm(true)}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 border-2 border-[var(--border)]  bg-[color-mix(in_srgb,var(--danger)_10%,var(--surface))]  hover:bg-[color-mix(in_srgb,var(--danger)_10%,var(--surface))] text-[var(--danger-text)]  rounded-xl text-sm font-semibold transition-colors">
                <ThumbsDown size={16} /> Refuser
              </button>
              <button onClick={handleApprove} disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-[var(--brand)] hover:bg-[var(--brand)] disabled:opacity-50 text-[var(--on-brand)] rounded-xl text-sm font-semibold transition-colors">
                {loading ? <Loader2 size={16} className="animate-spin" /> : <ThumbsUp size={16} />}
                Approuver
              </button>
            </div>
          )}
        </div>
      </div>
    </AttendanceDialog>
  );
}

// ─── Composant principal ──────────────────────────────────────────────────────
export default function CorrectionsView({
  data,
  userRole,
  userDepartment,
  onRefresh,
  canRecordAttendanceForAll = false,
}: CorrectionsViewProps) {
  const [editingAtt, setEditingAtt]           = useState<any | null>(null);
  const [selectedOvertime, setSelectedOvertime] = useState<OvertimePendingItem | null>(null);
  const [showHistory, setShowHistory]         = useState(false);
  const [historyLogs, setHistoryLogs]         = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory]   = useState(false);
  const [pendingOvertimes, setPendingOvertimes] = useState<OvertimePendingItem[]>([]);
  const [activeTab, setActiveTab]             = useState<'absences' | 'pointages' | 'overtime'>('absences');
  // 🔒 HS désactivées pour l'entreprise : aucune HS (onglet, compteurs, liste) n'est affichée
  const [overtimeEnabled, setOvertimeEnabled]   = useState(true);
  const [searchTerm, setSearchTerm]           = useState('');
  const [toast, setToast]                     = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [savingId, setSavingId]               = useState<string | null>(null);
  // 🆕 liste « Pointages » (modifier un pointage complet) + historique par pointage
  const [onlyIncomplete, setOnlyIncomplete]     = useState(false);
  const [visibleCount, setVisibleCount]         = useState(60);
  const [expandedId, setExpandedId]             = useState<string | null>(null);
  const [traces, setTraces]                     = useState<Record<string, any[] | 'loading' | 'error'>>({});

  const [companySettings, setCompanySettings] = useState({
    officialStartHour: 8,
    lateToleranceMinutes: 0,
    workDays: [1, 2, 3, 4, 5],
    workHoursPerDay: 8,
  });

  // ⚠️ isAdmin ne doit PAS inclure la permission "secrétaire" : il gère
  //    l'onglet "Heures sup" (approbation/rejet), qui touche à la paie et
  //    reste réservé aux rôles de gestion. Le bouton "Corriger" une absence
  //    n'est de toute façon pas gaté par isAdmin (voir plus bas).
  const isAdmin = ['ADMIN', 'HR_MANAGER', 'SUPER_ADMIN', 'MANAGER'].includes(userRole);

  const showToast = (message: string, type: 'success' | 'error' | 'info') => {
    setToast({ message, type });
  };

  useEffect(() => {
    const init = async () => {
      let otEnabled = true;
      try {
        const res: any = await api.get('/payroll-settings');
        setCompanySettings({
          officialStartHour: res.officialStartHour || 8,
          lateToleranceMinutes: res.lateToleranceMinutes || 0,
          workDays: res.workDays || [1, 2, 3, 4, 5],
          workHoursPerDay: Number(res.workHoursPerDay) || 8,
        });
        otEnabled = res.overtimeEnabled !== false;
        setOvertimeEnabled(otEnabled);
      } catch (e) {
        console.error('Erreur settings:', e);
      }
      // 🔒 HS désactivées : on ne charge même pas les HS en attente
      if (otEnabled) fetchPendingOvertimes();
    };
    init();
  }, []);

  useEffect(() => {
    if (showHistory) fetchHistory();
  }, [showHistory]);

  const fetchPendingOvertimes = async () => {
    try {
      // Récupérer les pointages avec overtimeStatus en attente
      const res: any = await api.get('/attendance/today');
      if (Array.isArray(res)) {
        const pending = res.filter((a: any) =>
          ['PENDING_EMPLOYEE', 'PENDING_APPROVAL'].includes(a.overtimeStatus)
        );
        setPendingOvertimes(pending);
      }
    } catch (e) {
      console.error('Erreur pending overtimes:', e);
    }
  };

  const fetchHistory = async () => {
    setLoadingHistory(true);
    try {
      const res: any = await api.get('/attendance/logs');
      setHistoryLogs(res.logs || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleSaveCorrection = async (
    attendance: any,
    d: { status: string; checkIn?: string; checkOut?: string; reason: string },
  ) => {
    setSavingId(attendance.id);
    try {
      let overtimeRecalculated: boolean | null = null;
      if (attendance.isVirtual) {
        await api.post('/attendance/create-manual', {
          employeeId: attendance.employeeId,
          date: attendance.date,
          status: d.status,
          checkIn: d.checkIn ?? null,
          checkOut: d.checkOut ?? null,
          notes: d.reason,
        });
      } else {
        const res: any = await api.put(`/attendance/correct/${attendance.id}`, {
          status: d.status,
          checkIn: d.checkIn,
          checkOut: d.checkOut,
          reason: d.reason,
        });
        overtimeRecalculated = res?.overtimeRecalculated ?? null;
      }

      setEditingAtt(null);
      setTraces((t) => { const n = { ...t }; delete n[attendance.id]; return n; });
      onRefresh();
      if (showHistory) fetchHistory();
      if (overtimeRecalculated === false) {
        showToast(' Enregistré. Les heures sup sont déjà en validation : elles n’ont pas été recalculées.', 'info');
      } else {
        showToast(' Pointage enregistré', 'success');
      }
    } catch (err: any) {
      showToast(` ${err?.message || err?.response?.data?.message || 'Erreur lors de la correction'}`, 'error');
    } finally {
      setSavingId(null);
    }
  };

  // 🆕 Historique d'UN pointage : qui, quoi, quand, pourquoi
  const toggleTrace = async (attId: string) => {
    if (expandedId === attId) { setExpandedId(null); return; }
    setExpandedId(attId);
    if (traces[attId] && traces[attId] !== 'error') return;
    setTraces((t) => ({ ...t, [attId]: 'loading' }));
    try {
      const res: any = await api.get(`/attendance/logs?attendanceId=${attId}`);
      setTraces((t) => ({ ...t, [attId]: res?.logs || [] }));
    } catch {
      setTraces((t) => ({ ...t, [attId]: 'error' }));
    }
  };

  const handleApproveOvertime = async (attendanceId: string) => {
    try {
      await api.post(`/attendance/approve-overtime/${attendanceId}`, {});
      setSelectedOvertime(null);
      fetchPendingOvertimes();
      onRefresh();
      showToast(' Heures supplémentaires validées', 'success');
    } catch (err: any) {
      showToast(` ${err?.response?.data?.message || 'Erreur'}`, 'error');
    }
  };

  const handleRejectOvertime = async (attendanceId: string, reason: string) => {
    try {
      await api.post(`/attendance/reject-overtime/${attendanceId}`, { reason });
      setSelectedOvertime(null);
      fetchPendingOvertimes();
      onRefresh();
      showToast('Heures supplémentaires refusées', 'info');
    } catch (err: any) {
      showToast(` ${err?.response?.data?.message || 'Erreur'}`, 'error');
    }
  };

  // ─── Calcul des absences à corriger ────────────────────────────────────────
  const getAbsencesToCorrect = useCallback(() => {
    if (!data?.dayStatuses || !data?.employees || !data?.attendances) return [];

    const now = new Date();
    const results: any[] = [];

    data.employees.forEach((emp: any, empIndex: number) => {
      if (userRole === 'MANAGER' && userDepartment && !canRecordAttendanceForAll && emp.department?.name !== userDepartment) return;

      const empDayStatuses = data.dayStatuses[empIndex] || [];

      empDayStatuses.forEach((dayStatus: any) => {
        if (dayStatus.status !== 'ABSENT_UNPAID') return;

        const attDate = new Date(dayStatus.date);
        const dayOfWeek = attDate.getDay();
        if (!companySettings.workDays.includes(dayOfWeek)) return;

        const threshold = new Date(attDate);
        threshold.setHours(companySettings.officialStartHour, companySettings.lateToleranceMinutes, 0, 0);
        if (now < threshold) return;

        let att = data.attendances.find(
          (a: any) => a.employeeId === emp.id && a.date.split('T')[0] === dayStatus.date
        );

        if (!att) {
          att = {
            id: `virtual-${emp.id}-${dayStatus.date}`,
            employeeId: emp.id,
            date: dayStatus.date,
            status: 'ABSENT_UNPAID',
            checkIn: null,
            checkOut: null,
            isVirtual: true,
          };
        }

        results.push({ ...att, employee: emp });
      });
    });

    return results;
  }, [data, userRole, userDepartment, companySettings, canRecordAttendanceForAll]);

  const absences = getAbsencesToCorrect();
  const filteredAbsences = searchTerm
    ? absences.filter((a: any) =>
        `${a.employee.firstName} ${a.employee.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : absences;

  // 🆕 Pointages enregistrés du mois (complets ou non) : modifiables par l'admin, le RH et le secrétaire
  const today = new Date().toLocaleDateString('en-CA', { timeZone: TZ });
  const allPointages: any[] = (data?.attendances || [])
    .filter((a: any) => a.checkIn || a.checkOut)
    .filter((a: any) => !onlyIncomplete || !a.checkOut || !a.checkIn)
    .filter((a: any) =>
      searchTerm
        ? `${a.employee?.firstName} ${a.employee?.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())
        : true,
    )
    .sort((a: any, b: any) => String(b.date).localeCompare(String(a.date)));
  const pointages = allPointages.slice(0, visibleCount);

  const filteredOvertimes = searchTerm
    ? pendingOvertimes.filter((o) =>
        `${o.employee.firstName} ${o.employee.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : pendingOvertimes;

  return (
    <div className="space-y-5">
      {/* ── Toast ─────────────────────────────────────────────────────────── */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* ── Modals ────────────────────────────────────────────────────────── */}
      {editingAtt && (
        <CorrectionModal
          attendance={editingAtt}
          onSave={handleSaveCorrection}
          onClose={() => setEditingAtt(null)}
          companySettings={companySettings}
        />
      )}
      {selectedOvertime && (
        <OvertimeApprovalModal
          item={selectedOvertime}
          onApprove={handleApproveOvertime}
          onReject={handleRejectOvertime}
          onClose={() => setSelectedOvertime(null)}
        />
      )}

      {/* ── Header stats ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 attendance-metrics">
        {[
          { label: 'Absences à traiter', value: absences.length, icon: <AlertCircle size={18} />, color: ' ', bg: 'bg-[color-mix(in_srgb,var(--danger)_10%,var(--surface))] ', text: 'text-[var(--danger-text)] ' },
          ...(overtimeEnabled ? [{ label: 'HS en attente', value: pendingOvertimes.filter(o => o.overtimeStatus === 'PENDING_APPROVAL').length, icon: <Clock size={18} />, color: ' ', bg: 'bg-[color-mix(in_srgb,var(--mustard)_14%,var(--surface))] ', text: 'text-[var(--warning-text)] ' },
          { label: 'Réponse employé', value: pendingOvertimes.filter(o => o.overtimeStatus === 'PENDING_EMPLOYEE').length, icon: <HelpCircle size={18} />, color: ' ', bg: 'bg-[color-mix(in_srgb,var(--mustard)_14%,var(--surface))] ', text: 'text-[var(--warning-text)] ' }] : []),
          { label: 'Corrections totales', value: historyLogs.length, icon: <History size={18} />, color: ' ', bg: 'bg-[color-mix(in_srgb,var(--green)_12%,var(--surface))] ', text: 'text-[var(--success-text)] ' },
        ].map((stat) => (
          <div key={stat.label} className={`${stat.bg} border border-current/10 rounded-2xl p-4`}>
            <div className={`${stat.text} flex items-center gap-2 mb-2`}>
              {stat.icon}
              <span className="text-xs font-semibold  tracking-wide opacity-80">{stat.label}</span>
            </div>
            <p className={`text-3xl font-semibold ${stat.text}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* ── Barre de contrôles ────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Tabs */}
        <div className="flex bg-[var(--surface-2)] rounded-xl p-1 gap-1">
          <button
            onClick={() => setActiveTab('absences')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
              activeTab === 'absences'
                ? 'bg-[var(--surface)] text-[var(--text)] shadow-sm'
                : 'text-[var(--text-muted)] hover:text-[var(--text)]'
            }`}
          >
            <AlertCircle size={14} />
            Absences
            {absences.length > 0 && (
              <span className="px-1.5 py-0.5 bg-[var(--danger)] text-[var(--on-brand)] rounded-full text-xs">{absences.length}</span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('pointages')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
              activeTab === 'pointages'
                ? 'bg-[var(--surface)] text-[var(--text)] shadow-sm'
                : 'text-[var(--text-muted)] hover:text-[var(--text)]'
            }`}
          >
            <Clock size={14} />
            Pointages
          </button>
          {isAdmin && overtimeEnabled && (
            <button
              onClick={() => setActiveTab('overtime')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                activeTab === 'overtime'
                  ? 'bg-[var(--surface)] text-[var(--text)] shadow-sm'
                  : 'text-[var(--text-muted)] hover:text-[var(--text)]'
              }`}
            >
              <Zap size={14} />
              Heures sup
              {pendingOvertimes.length > 0 && (
                <span className="px-1.5 py-0.5 bg-[var(--mustard)] text-[var(--on-brand)] rounded-full text-xs">{pendingOvertimes.length}</span>
              )}
            </button>
          )}
        </div>

        {/* Search */}
        <div className="flex-1 min-w-48 relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" />
          <input
            type="text"
            placeholder="Rechercher un employé..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-[var(--surface)] border border-[var(--border)] rounded-xl text-sm focus:ring-2 focus:ring-[var(--focus)] focus:border-[var(--border)] transition-colors"
          />
        </div>

        {/* Historique */}
        <button
          onClick={() => setShowHistory(!showHistory)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
            showHistory
              ? 'bg-[var(--brand)] text-[var(--on-brand)] shadow-lg '
              : 'bg-[var(--surface)] border border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--border)]'
          }`}
        >
          <History size={16} />
          <span className="hidden sm:inline">Historique</span>
        </button>

        {/* Refresh */}
        <button
          onClick={() => { onRefresh(); fetchPendingOvertimes(); }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-[var(--surface)] border border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--border)] transition-colors"
        >
          <RefreshCw size={16} />
          <span className="hidden sm:inline">Actualiser</span>
        </button>
      </div>

      {/* ── Historique timeline ───────────────────────────────────────────── */}
      {showHistory && (
        <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] overflow-hidden">
          <div className="px-5 py-4 border-b border-[var(--border)] flex items-center justify-between">
            <h4 className="font-semibold text-[var(--text)] flex items-center gap-2">
              <History size={18} className="text-[var(--success-text)]" />
              Historique des modifications
            </h4>
            {loadingHistory && <Loader2 size={16} className="animate-spin text-[var(--success-text)]" />}
          </div>

          <div className="divide-y divide-[var(--border)] max-h-80 overflow-y-auto">
            {historyLogs.length === 0 ? (
              <div className="p-8 text-center text-[var(--text-muted)] text-sm">
                Aucune modification enregistrée ce mois
              </div>
            ) : (
              historyLogs.map((log: any, idx: number) => (
                <div key={idx} className="px-5 py-4 hover:bg-[var(--surface-2)] transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[color-mix(in_srgb,var(--green)_12%,var(--surface))]  flex items-center justify-center text-xs font-semibold text-[var(--success-text)] flex-shrink-0">
                      {log.modifiedBy?.firstName?.[0]}{log.modifiedBy?.lastName?.[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="font-semibold text-sm text-[var(--text)]">
                          {log.employee?.firstName} {log.employee?.lastName}
                        </span>
                        <ArrowRight size={12} className="text-[var(--text-muted)]" />
                        <span className="font-semibold text-sm text-[var(--success-text)] ">{log.newValue}</span>
                        <span className="ml-auto text-xs text-[var(--text-muted)]">
                          {new Date(log.createdAt).toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-xs text-[var(--text-muted)]">
                        Par <span className="font-semibold">{log.modifiedBy?.firstName} {log.modifiedBy?.lastName}</span>
                        {log.reason && <> · <span className="italic">{log.reason}</span></>}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ── Contenu principal ─────────────────────────────────────────────── */}
      {activeTab === 'absences' && (
        <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] overflow-hidden">
          <div className="overflow-x-auto attendance-table-scroll" tabIndex={0} role="region" aria-label="Tableau défilant horizontalement">
            <table className="w-full attendance-table">
              <thead className="bg-[var(--surface-2)]/80 border-b border-[var(--border)]">
                <tr>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-[var(--text-muted)]  ">Employé</th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-[var(--text-muted)]  ">Date</th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-[var(--text-muted)]   hidden sm:table-cell">Statut</th>
                  <th className="px-5 py-3.5 text-right text-xs font-semibold text-[var(--text-muted)]  ">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {filteredAbsences.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-5 py-16 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="p-5 bg-[color-mix(in_srgb,var(--green)_12%,var(--surface))]  rounded-full">
                          <CheckCircle size={36} className="text-[var(--success-text)]" />
                        </div>
                        <p className="text-lg font-semibold text-[var(--text)]">Aucune correction nécessaire</p>
                        <p className="text-sm text-[var(--text-muted)]">Tous les pointages sont conformes </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredAbsences.map((att: any) => (
                    <tr key={att.id} className="hover:bg-[var(--surface-2)] transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          {att.employee.photoUrl ? (
                            <img src={att.employee.photoUrl} alt="" className="w-10 h-10 rounded-xl object-cover" />
                          ) : (
                            <div className="w-10 h-10 rounded-xl bg-[var(--brand)] flex items-center justify-center text-sm font-semibold text-[var(--on-brand)]">
                              {att.employee.firstName[0]}{att.employee.lastName[0]}
                            </div>
                          )}
                          <div>
                            <p className="font-semibold text-sm text-[var(--text)]">
                              {att.employee.firstName} {att.employee.lastName}
                            </p>
                            <p className="text-xs text-[var(--text-muted)]">{att.employee.department?.name}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-sm font-semibold text-[var(--text)]">
                            {new Date(att.date).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })}
                          </span>
                          <span className="text-xs text-[var(--text-muted)]">
                            {new Date(att.date).toLocaleDateString('fr-FR', { year: 'numeric' })}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-4 hidden sm:table-cell">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[color-mix(in_srgb,var(--danger)_10%,var(--surface))]  text-[var(--danger-text)]  rounded-xl text-xs font-semibold">
                          <XCircle size={12} /> Absent non justifié
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <button
                          onClick={() => setEditingAtt(att)}
                          disabled={savingId === att.id}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--brand)] hover:bg-[var(--brand)] disabled:opacity-50 text-[var(--on-brand)] rounded-xl text-xs font-semibold transition-colors  active:translate-y-0"
                        >
                          {savingId === att.id ? <Loader2 size={13} className="animate-spin" /> : <Edit3 size={13} />}
                          Corriger
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── 🆕 Tab Pointages : modifier un pointage complet + voir qui a fait quoi ─ */}
      {activeTab === 'pointages' && (
        <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] overflow-hidden">
          <div className="px-5 py-3 border-b border-[var(--border)] flex flex-wrap items-center gap-3">
            <p className="text-sm text-[var(--text-muted)] flex-1 min-w-48">
              <b className="text-[var(--text)]">{allPointages.length}</b> pointage(s) ce mois. Cliquez sur « Modifier » pour changer l’entrée, la sortie ou le statut.
            </p>
            <label className="flex items-center gap-2 text-xs font-semibold text-[var(--text)]">
              <input type="checkbox" checked={onlyIncomplete} onChange={(e) => { setOnlyIncomplete(e.target.checked); setVisibleCount(60); }} className="accent-emerald-500" />
              Sortie manquante seulement
            </label>
          </div>
          <div className="overflow-x-auto attendance-table-scroll" tabIndex={0} role="region" aria-label="Tableau défilant horizontalement">
            <table className="w-full text-left attendance-table">
              <thead className="bg-[var(--surface-2)]">
                <tr>
                  <th className="px-5 py-3 text-xs font-semibold text-[var(--text-muted)]  ">Employé</th>
                  <th className="px-5 py-3 text-xs font-semibold text-[var(--text-muted)]  ">Date</th>
                  <th className="px-5 py-3 text-xs font-semibold text-[var(--text-muted)]  ">Entrée → Sortie</th>
                  <th className="px-5 py-3 text-xs font-semibold text-[var(--text-muted)]   hidden md:table-cell">Origine</th>
                  <th className="px-5 py-3 text-right text-xs font-semibold text-[var(--text-muted)]  ">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {pointages.length === 0 && (
                  <tr><td colSpan={5} className="px-5 py-14 text-center text-sm text-[var(--text-muted)]">Aucun pointage à afficher.</td></tr>
                )}
                {pointages.map((a: any) => {
                  const day = String(a.date).slice(0, 10);
                  const missingOut = !!a.checkIn && !a.checkOut;
                  const modified = typeof a.notes === 'string' && a.notes.includes('[Modifié');
                  const method = summaryPunchMethod(a.checkInMethod, a.checkOutMethod);
                  const trace = traces[a.id];
                  return (
                    <React.Fragment key={a.id}>
                      <tr className="hover:bg-[var(--surface-2)] transition-colors">
                        <td className="px-5 py-3.5">
                          <p className="font-semibold text-sm text-[var(--text)]">{a.employee?.firstName} {a.employee?.lastName}</p>
                          <p className="text-xs text-[var(--text-muted)]">{STATUS_LABEL[a.status] || a.status}</p>
                        </td>
                        <td className="px-5 py-3.5 text-sm text-[var(--text)] capitalize">
                          {new Date(`${day}T12:00:00Z`).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })}
                        </td>
                        <td className="px-5 py-3.5 text-sm font-mono text-[var(--text)]">
                          {toHM(a.checkIn) || '—'} → {a.checkOut ? toHM(a.checkOut) : (
                            <span className={`font-sans text-xs font-semibold ${missingOut && day < today ? 'text-[var(--warning-text)]' : 'text-[var(--text-muted)]'}`}>
                              {day < today ? 'sortie manquante' : 'en cours'}
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-3.5 hidden md:table-cell">
                          <div className="flex flex-wrap items-center gap-1.5">
                            {method && <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[var(--surface-2)] text-[var(--text-muted)]">{PUNCH_METHOD_LABEL[method] || method}</span>}
                            {modified && <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[color-mix(in_srgb,var(--mustard)_14%,var(--surface))] text-[var(--warning-text)]">Modifié</span>}
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-right whitespace-nowrap">
                          <button onClick={() => toggleTrace(a.id)} className="inline-flex items-center gap-1.5 px-3 py-2 mr-2 rounded-xl text-xs font-semibold border border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--border)] transition-colors" aria-expanded={expandedId === a.id}>
                            <History size={13} /> Historique
                          </button>
                          <button onClick={() => setEditingAtt(a)} disabled={savingId === a.id} className="inline-flex items-center gap-1.5 px-4 py-2 bg-[var(--brand)] hover:bg-[var(--brand)] disabled:opacity-50 text-[var(--on-brand)] rounded-xl text-xs font-semibold transition-colors">
                            {savingId === a.id ? <Loader2 size={13} className="animate-spin" /> : <Edit3 size={13} />} Modifier
                          </button>
                        </td>
                      </tr>
                      {expandedId === a.id && (
                        <tr className="bg-[var(--surface-2)]">
                          <td colSpan={5} className="px-5 py-4">
                            {trace === 'loading' || trace === undefined ? (
                              <p className="text-xs text-[var(--text-muted)] flex items-center gap-2"><Loader2 size={13} className="animate-spin" /> Chargement…</p>
                            ) : trace === 'error' ? (
                              <p className="text-xs text-[var(--danger-text)]">Impossible de charger l’historique.</p>
                            ) : trace.length === 0 ? (
                              <p className="text-xs text-[var(--text-muted)]">Aucune modification : ce pointage est tel qu’enregistré à l’origine ({method ? PUNCH_METHOD_LABEL[method] || method : 'pointage'}).</p>
                            ) : (
                              <ol className="space-y-3">
                                {trace.map((log: any) => {
                                  const changes = describeTrace(log);
                                  const who = log.modifiedBy ? `${log.modifiedBy.firstName} ${log.modifiedBy.lastName}` : 'Utilisateur inconnu';
                                  const role = ROLE_LABEL[log.actorRole || log.modifiedBy?.role] || '';
                                  return (
                                    <li key={log.id} className="text-xs border-l-2 border-[var(--border)] pl-3">
                                      <p className="text-[var(--text)]">
                                        <b>{who}</b>{role && <span className="text-[var(--text-muted)]"> ({role})</span>} ·{' '}
                                        <span className="font-semibold">{ACTION_LABEL[log.action] || 'Modification'}</span> ·{' '}
                                        <span className="text-[var(--text-muted)]">
                                          {new Date(log.createdAt).toLocaleString('fr-FR', { timeZone: TZ, day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                      </p>
                                      {changes.length > 0 ? (
                                        <ul className="mt-1 space-y-0.5">
                                          {changes.map((c) => (
                                            <li key={c.label} className="text-[var(--text-muted)]">{c.label} : <span className="line-through">{c.from}</span> → <b className="text-[var(--text)]">{c.to}</b></li>
                                          ))}
                                        </ul>
                                      ) : (
                                        <p className="mt-1 text-[var(--text-muted)]">{log.field} : {log.oldValue || '—'} → {log.newValue}</p>
                                      )}
                                      <p className="mt-1 text-[var(--text)]">Motif : <span className="italic">{log.reason || '—'}</span></p>
                                    </li>
                                  );
                                })}
                              </ol>
                            )}
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
          {allPointages.length > visibleCount && (
            <div className="p-4 text-center border-t border-[var(--border)]">
              <button onClick={() => setVisibleCount((n) => n + 60)} className="px-4 py-2 rounded-xl text-xs font-semibold border border-[var(--border)] text-[var(--text)] hover:border-[var(--border)] transition-colors">
                Afficher plus ({allPointages.length - visibleCount} restants)
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Tab Heures sup ────────────────────────────────────────────────── */}
      {activeTab === 'overtime' && isAdmin && overtimeEnabled && (
        <div className="space-y-3">
          {filteredOvertimes.length === 0 ? (
            <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] p-16 text-center">
              <div className="flex flex-col items-center gap-3">
                <div className="p-5 bg-[color-mix(in_srgb,var(--green)_12%,var(--surface))]  rounded-full">
                  <CheckCircle size={36} className="text-[var(--success-text)]" />
                </div>
                <p className="text-lg font-semibold text-[var(--text)]">Aucune demande en attente</p>
                <p className="text-sm text-[var(--text-muted)]">Toutes les heures supplémentaires sont traitées</p>
              </div>
            </div>
          ) : (
            filteredOvertimes.map((item) => (
              <div key={item.id}
                className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5 hover:shadow-lg hover:border-[var(--border)] dark:hover:border-[var(--border)] transition-colors"
              >
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-[var(--mustard)] flex items-center justify-center text-[var(--on-brand)] font-semibold text-base">
                      {item.employee.firstName[0]}{item.employee.lastName[0]}
                    </div>
                    <div>
                      <p className="font-semibold text-[var(--text)]">
                        {item.employee.firstName} {item.employee.lastName}
                      </p>
                      <p className="text-xs text-[var(--text-muted)]">{item.employee.department?.name}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="text-center px-3 py-1.5 bg-[color-mix(in_srgb,var(--mustard)_14%,var(--surface))]  rounded-xl">
                      <p className="text-xl font-semibold text-[var(--warning-text)] ">{item.pendingOvertimeHours.toFixed(1)}h</p>
                      <p className="text-xs text-[var(--warning-text)] ">heures sup</p>
                    </div>

                    <div className="text-center">
                      <p className="text-xs text-[var(--text-muted)] mb-0.5">Entrée</p>
                      <LiveTimer checkIn={item.checkIn} />
                    </div>

                    <OvertimeBadge status={item.overtimeStatus} />

                    {item.overtimeStatus === 'PENDING_APPROVAL' && (
                      <button
                        onClick={() => setSelectedOvertime(item)}
                        className="flex items-center gap-2 px-4 py-2.5 bg-[var(--mustard)] hover:bg-[var(--mustard)] text-[var(--on-brand)] rounded-xl text-sm font-semibold transition-colors "
                      >
                        <Eye size={15} />
                        Traiter
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ── Légende ───────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 attendance-metrics">
        {[
          { icon: <Check size={16} className="bg-[var(--brand)] text-[var(--on-brand)]" />, bg: 'bg-[var(--brand)]', title: 'Oubli pointage', desc: 'Présent → Payé', tag: 'PRESENT' },
          { icon: <Shield size={16} className="bg-[var(--brand)] text-[var(--on-brand)]" />, bg: 'bg-[var(--mustard)]', title: 'Justifié', desc: 'Maladie, urgence → Payé', tag: 'ABSENT_PAID' },
          { icon: <MapPin size={16} className="bg-[var(--brand)] text-[var(--on-brand)]" />, bg: 'bg-[var(--brand)]', title: 'Télétravail', desc: 'Distance → Payé', tag: 'REMOTE' },
          { icon: <XCircle size={16} className="bg-[var(--brand)] text-[var(--on-brand)]" />, bg: 'bg-[var(--danger)]', title: 'Non justifié', desc: 'Sans correction → Déduit', tag: 'ABSENT_UNPAID' },
        ].map((item) => (
          <div key={item.tag} className="flex items-start gap-3 p-4 bg-[var(--surface)] rounded-2xl border border-[var(--border)] hover:shadow-md transition-colors">
            <div className={`p-2 ${item.bg} rounded-xl flex-shrink-0`}>{item.icon}</div>
            <div>
              <p className="text-sm font-semibold text-[var(--text)]">{item.title}</p>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">{item.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* CSS inline pour l'animation du toast */}
      <style>{`
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .animate-slide-up { animation: slide-up 0.25s ease-out; }
      `}</style>
    </div>
  );
}