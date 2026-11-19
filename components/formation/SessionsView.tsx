'use client';
import { DocumentReader } from '@/components/ui/DocumentReader';

// ============================================================================
// 📁 components/formation/SessionsView.tsx
// Onglet « Sessions » du module Formation (réservé RH).
//   • Liste des sessions + filtres
//   • Besoins détectés par les évaluations (écarts de compétences → formations liées → « Planifier »)
//   • Détail : participants, convocations, émargement jour par jour, feuille imprimable, clôture
// ============================================================================

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Plus, Calendar, MapPin, Users, Loader2, Send, Printer, UserPlus, X, ClipboardCheck,
  Lock, Ban, Pencil, Sparkles, Search, ChevronDown, ChevronUp, AlertCircle, CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/design-system/primitives';
import { Modal, useToast } from '@/components/design-system/feedback';
import { api } from '@/services/api';
import { printLeaveDocument } from '@/lib/leave-print';
import AttendanceSheetPrintable from './AttendanceSheetPrintable';

// ─── Types ────────────────────────────────────────────────────────────────────
type SessionStatus = 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
type AttStatus = 'PRESENT' | 'ABSENT' | 'EXCUSED' | 'LATE';

export interface CourseLite {
  id: string;
  title: string;
  location?: string;
  providerName?: string;
  durationHours?: number;
}

interface SessionRow {
  id: string;
  courseId: string;
  course?: { id: string; title: string; durationHours: number | null };
  label: string | null;
  startDate: string;
  endDate: string;
  startTime: string | null;
  endTime: string | null;
  location: string | null;
  trainerName: string | null;
  capacity: number | null;
  status: SessionStatus;
  notes: string | null;
  convocationSentAt: string | null;
  participantsCount?: number;
}

interface Participant {
  employeeTrainingId: string;
  status: string;
  employee: { id: string; firstName: string; lastName: string; position: string; department: string | null };
  attendance: Record<string, { status: AttStatus; note: string | null }>;
  daysPresent: number;
  attendanceRate: number;
}

interface SessionDetail extends SessionRow {
  days: string[];
  participants: Participant[];
}

interface EmployeeLite {
  id: string;
  firstName: string;
  lastName: string;
  position?: string;
  department?: { name: string };
}

interface Need {
  competencyId: string;
  name: string;
  employees: number;
  courses: Array<{ id: string; title: string }>;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const errMsg = (e: any) => e?.message || 'Une erreur est survenue';
const todayYmd = () => new Date().toISOString().slice(0, 10);
const fr = (ymd?: string | null) =>
  ymd ? new Date(`${ymd.slice(0, 10)}T00:00:00.000Z`).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' }) : '—';
const frShort = (ymd: string) =>
  new Date(`${ymd}T00:00:00.000Z`).toLocaleDateString('fr-FR', { weekday: 'short', day: '2-digit', month: '2-digit', timeZone: 'UTC' });
const period = (s: { startDate: string; endDate: string }) =>
  s.startDate === s.endDate ? fr(s.startDate) : `${fr(s.startDate)} → ${fr(s.endDate)}`;

const STATUS_LABEL: Record<SessionStatus, string> = {
  PLANNED: 'Planifiée', IN_PROGRESS: 'En cours', COMPLETED: 'Terminée', CANCELLED: 'Annulée',
};
const STATUS_CLS: Record<SessionStatus, string> = {
  PLANNED: 'bg-sky-500/15 text-sky-500',
  IN_PROGRESS: 'bg-emerald-500/15 text-emerald-500',
  COMPLETED: 'bg-slate-500/15 text-slate-400',
  CANCELLED: 'bg-red-500/15 text-red-500',
};
const ATT_LABEL: Record<AttStatus, string> = {
  PRESENT: 'Présent', ABSENT: 'Absent', EXCUSED: 'Excusé', LATE: 'Retard',
};
const ATT_ACTIVE: Record<AttStatus, string> = {
  PRESENT: 'bg-emerald-500 text-white', ABSENT: 'bg-red-500 text-white',
  EXCUSED: 'bg-amber-500 text-white', LATE: 'bg-sky-500 text-white',
};

const inputCls = 'w-full px-3 py-2 rounded-xl text-sm bg-white/5 border border-white/10 text-white outline-none focus:border-emerald-500';
const labelCls = 'block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5';

function StatusPill({ status }: { status: SessionStatus }) {
  return <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-black ${STATUS_CLS[status]}`}>{STATUS_LABEL[status]}</span>;
}

// ═════════════════════════════════════════════════════════════════════════════
export default function SessionsView({
  courses, onChanged,
}: {
  courses: CourseLite[];
  onChanged?: () => void; // recharger tableau de bord / demandes / mes formations
}) {
  const notify = useToast();

  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [filter, setFilter] = useState<'ACTIVE' | 'COMPLETED' | 'CANCELLED' | 'ALL'>('ACTIVE');
  const [courseFilter, setCourseFilter] = useState('');

  const [formOpen, setFormOpen] = useState<null | { session?: SessionRow; courseId?: string }>(null);
  const [detailId, setDetailId] = useState<string | null>(null);

  // Besoins détectés par les évaluations
  const [needs, setNeeds] = useState<Need[] | null>(null);
  const [needsOpen, setNeedsOpen] = useState(true);

  const loadSessions = useCallback(async () => {
    setLoading(true);
    setLoadError(false);
    try {
      const data = await api.get<SessionRow[]>('/training/sessions');
      setSessions(data ?? []);
    } catch {
      setSessions([]);
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadNeeds = useCallback(async () => {
    try {
      const [team, comps] = await Promise.all([
        api.get<{ topNeeds: Array<{ competencyId: string; name: string; employees: number }> }>('/performance/competencies/team'),
        api.get<Array<{ id: string; courses: Array<{ id: string; title: string }> }>>('/performance/competencies'),
      ]);
      const byId = new Map((comps ?? []).map((c) => [c.id, c.courses ?? []]));
      setNeeds((team?.topNeeds ?? []).map((n) => ({ ...n, courses: byId.get(n.competencyId) ?? [] })));
    } catch {
      setNeeds(null); // module Performance indisponible / pas d'accès : on masque le bloc
    }
  }, []);

  useEffect(() => { loadSessions(); loadNeeds(); }, [loadSessions, loadNeeds]);

  const visible = useMemo(() => {
    return sessions
      .filter((s) => {
        if (courseFilter && s.courseId !== courseFilter) return false;
        if (filter === 'ACTIVE') return s.status === 'PLANNED' || s.status === 'IN_PROGRESS';
        if (filter === 'COMPLETED') return s.status === 'COMPLETED';
        if (filter === 'CANCELLED') return s.status === 'CANCELLED';
        return true;
      })
      .sort((a, b) => (filter === 'ACTIVE' ? a.startDate.localeCompare(b.startDate) : b.startDate.localeCompare(a.startDate)));
  }, [sessions, filter, courseFilter]);

  const refreshAll = () => { loadSessions(); onChanged?.(); };

  return (
    <div className="space-y-5">
      {/* Barre d'outils */}
      <div className="flex flex-wrap items-center gap-2 justify-between">
        <div className="flex flex-wrap items-center gap-2">
          {([['ACTIVE', 'Actives'], ['COMPLETED', 'Terminées'], ['CANCELLED', 'Annulées'], ['ALL', 'Toutes']] as const).map(([k, l]) => (
            <Button key={k} variant="ghost" onClick={() => setFilter(k)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold ${filter === k ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'}`}>
              {l}
            </Button>
          ))}
          <select value={courseFilter} onChange={(e) => setCourseFilter(e.target.value)} className={`${inputCls} !w-auto !py-1.5 text-xs`} aria-label="Filtrer par formation">
            <option value="">Toutes les formations</option>
            {courses.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
          </select>
        </div>
        <Button variant="primary" onClick={() => setFormOpen({})}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-sm font-black">
          <Plus size={15} /> Nouvelle session
        </Button>
      </div>

      {/* Besoins détectés par les évaluations */}
      {needs && needs.length > 0 && (
        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4">
          <Button variant="ghost" onClick={() => setNeedsOpen((o) => !o)} className="w-full flex items-center justify-between gap-2 text-left">
            <span className="flex items-center gap-2 text-sm font-black text-white">
              <Sparkles size={15} className="text-amber-400" /> Besoins détectés par les évaluations
              <span className="text-[11px] font-semibold text-slate-400">({needs.length} compétence{needs.length > 1 ? 's' : ''} sous le niveau requis)</span>
            </span>
            {needsOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </Button>
          {needsOpen && (
            <div className="mt-3 grid grid-cols-1 lg:grid-cols-2 gap-3">
              {needs.map((n) => (
                <div key={n.competencyId} className="rounded-xl bg-white/5 border border-white/10 p-3">
                  <p className="text-sm font-bold text-white">{n.name}</p>
                  <p className="text-[11px] text-slate-400 mb-2">{n.employees} employé{n.employees > 1 ? 's' : ''} en dessous du niveau requis</p>
                  {n.courses.length ? (
                    <div className="flex flex-wrap gap-2">
                      {n.courses.map((c) => (
                        <Button key={c.id} variant="ghost" onClick={() => setFormOpen({ courseId: c.id })}
                          className="px-2.5 py-1 rounded-lg text-[11px] font-bold border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10">
                          Planifier « {c.title} »
                        </Button>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[11px] text-slate-500">Aucune formation liée — à associer dans Performance › Compétences.</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Liste */}
      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="animate-spin text-emerald-500" /></div>
      ) : loadError ? (
        <div className="text-center py-12 text-sm text-slate-400">
          Impossible de charger les sessions. <Button variant="ghost" onClick={loadSessions} className="underline">Réessayer</Button>
        </div>
      ) : visible.length === 0 ? (
        <div className="text-center py-14 rounded-2xl border border-dashed border-white/10">
          <Calendar className="mx-auto mb-2 text-slate-500" size={28} />
          <p className="text-sm text-slate-400">Aucune session {filter === 'ACTIVE' ? 'active' : ''}. Créez-en une pour convoquer des participants.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {visible.map((s) => {
            const count = s.participantsCount ?? 0;
            const pct = s.capacity ? Math.min(100, Math.round((count / s.capacity) * 100)) : null;
            return (
              <Button key={s.id} variant="ghost" onClick={() => setDetailId(s.id)}
                className="text-left rounded-2xl border border-white/10 bg-white/5 hover:border-emerald-500/40 p-4 transition-colors flex flex-col gap-2 items-stretch">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-bold text-white text-sm leading-snug">{s.course?.title ?? 'Formation'}{s.label ? ` — ${s.label}` : ''}</p>
                  <StatusPill status={s.status} />
                </div>
                <p className="text-xs text-slate-400 flex items-center gap-1.5"><Calendar size={12} /> {period(s)}{s.startTime ? ` • ${s.startTime}${s.endTime ? `–${s.endTime}` : ''}` : ''}</p>
                {s.location && <p className="text-xs text-slate-400 flex items-center gap-1.5"><MapPin size={12} /> {s.location}</p>}
                <div className="flex items-center justify-between text-xs text-slate-300">
                  <span className="flex items-center gap-1.5"><Users size={12} /> {count}{s.capacity ? ` / ${s.capacity}` : ''} participant{count > 1 ? 's' : ''}</span>
                  {s.convocationSentAt && <span className="text-emerald-400 flex items-center gap-1"><CheckCircle2 size={11} /> Convoqués</span>}
                </div>
                {pct !== null && <div className="h-1.5 rounded-full bg-white/10 overflow-hidden"><div className="h-full bg-emerald-500" style={{ width: `${pct}%` }} /></div>}
              </Button>
            );
          })}
        </div>
      )}

      {formOpen && (
        <SessionForm
          courses={courses}
          session={formOpen.session}
          presetCourseId={formOpen.courseId}
          onClose={() => setFormOpen(null)}
          onSaved={(id) => { setFormOpen(null); refreshAll(); if (id) setDetailId(id); }}
        />
      )}

      {detailId && (
        <SessionDetailModal
          sessionId={detailId}
          onClose={() => setDetailId(null)}
          onEdit={(s) => { setDetailId(null); setFormOpen({ session: s }); }}
          onChanged={refreshAll}
          notify={notify}
        />
      )}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// Formulaire création / modification
// ═════════════════════════════════════════════════════════════════════════════
function SessionForm({
  courses, session, presetCourseId, onClose, onSaved,
}: {
  courses: CourseLite[];
  session?: SessionRow;
  presetCourseId?: string;
  onClose: () => void;
  onSaved: (id?: string) => void;
}) {
  const notify = useToast();
  const isEdit = !!session;
  const [saving, setSaving] = useState(false);
  const [f, setF] = useState({
    courseId: session?.courseId ?? presetCourseId ?? '',
    label: session?.label ?? '',
    startDate: session?.startDate ?? '',
    endDate: session?.endDate ?? '',
    startTime: session?.startTime ?? '',
    endTime: session?.endTime ?? '',
    location: session?.location ?? '',
    trainerName: session?.trainerName ?? '',
    capacity: session?.capacity ? String(session.capacity) : '',
    notes: session?.notes ?? '',
  });
  const set = (k: keyof typeof f, v: string) => setF((p) => ({ ...p, [k]: v }));

  // Création : préremplir lieu / formateur depuis le cours choisi
  const pickCourse = (id: string) => {
    const c = courses.find((x) => x.id === id);
    setF((p) => ({ ...p, courseId: id, location: p.location || c?.location || '', trainerName: p.trainerName || c?.providerName || '' }));
  };
  useEffect(() => { if (presetCourseId && !isEdit) pickCourse(presetCourseId); /* eslint-disable-next-line */ }, []);

  const submit = async () => {
    if (!f.courseId) return notify('error', 'Choisissez la formation');
    if (!f.startDate) return notify('error', 'Indiquez la date de début');
    if (f.endDate && f.endDate < f.startDate) return notify('error', 'La date de fin est avant la date de début');
    setSaving(true);
    try {
      const body: any = {
        label: f.label, startDate: f.startDate, endDate: f.endDate || f.startDate,
        startTime: f.startTime, endTime: f.endTime, location: f.location,
        trainerName: f.trainerName, capacity: f.capacity ? Number(f.capacity) : null, notes: f.notes,
      };
      if (isEdit) {
        await api.patch(`/training/sessions/${session!.id}`, body);
        notify('success', 'Session modifiée');
        onSaved(session!.id);
      } else {
        const created = await api.post<SessionRow>('/training/sessions', { ...body, courseId: f.courseId });
        notify('success', 'Session créée');
        onSaved(created.id);
      }
    } catch (e: any) {
      notify('error', errMsg(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open title={isEdit ? 'Modifier la session' : 'Nouvelle session de formation'} onClose={onClose}>
      <div className="space-y-4">
        <div>
          <label className={labelCls}>Formation *</label>
          <select value={f.courseId} onChange={(e) => pickCourse(e.target.value)} disabled={isEdit} className={inputCls}>
            <option value="">— Choisir —</option>
            {courses.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div><label className={labelCls}>Libellé (ex. Groupe A)</label><input className={inputCls} value={f.label} onChange={(e) => set('label', e.target.value)} maxLength={120} /></div>
          <div><label className={labelCls}>Capacité (places)</label><input type="number" min={1} className={inputCls} value={f.capacity} onChange={(e) => set('capacity', e.target.value)} /></div>
          <div><label className={labelCls}>Date de début *</label><input type="date" className={inputCls} value={f.startDate} onChange={(e) => set('startDate', e.target.value)} /></div>
          <div><label className={labelCls}>Date de fin</label><input type="date" className={inputCls} value={f.endDate} min={f.startDate} onChange={(e) => set('endDate', e.target.value)} /></div>
          <div><label className={labelCls}>Heure de début</label><input type="time" className={inputCls} value={f.startTime} onChange={(e) => set('startTime', e.target.value)} /></div>
          <div><label className={labelCls}>Heure de fin</label><input type="time" className={inputCls} value={f.endTime} onChange={(e) => set('endTime', e.target.value)} /></div>
          <div><label className={labelCls}>Lieu</label><input className={inputCls} value={f.location} onChange={(e) => set('location', e.target.value)} maxLength={255} /></div>
          <div><label className={labelCls}>Formateur / organisme</label><input className={inputCls} value={f.trainerName} onChange={(e) => set('trainerName', e.target.value)} maxLength={120} /></div>
        </div>
        <div><label className={labelCls}>Notes</label><textarea className={inputCls} rows={2} value={f.notes} onChange={(e) => set('notes', e.target.value)} maxLength={2000} /></div>
        <div className="flex gap-3 pt-1">
          <Button variant="ghost" onClick={onClose} className="flex-1 py-2.5 border border-white/10 rounded-xl text-slate-400 font-bold text-sm">Annuler</Button>
          <Button variant="primary" onClick={submit} loading={saving} className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-black rounded-xl text-sm">
            {isEdit ? 'Enregistrer' : 'Créer la session'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// Détail d'une session
// ═════════════════════════════════════════════════════════════════════════════
function SessionDetailModal({
  sessionId, onClose, onEdit, onChanged, notify,
}: {
  sessionId: string;
  onClose: () => void;
  onEdit: (s: SessionRow) => void;
  onChanged: () => void;
  notify: ReturnType<typeof useToast>;
}) {
  const [d, setD] = useState<SessionDetail | null>(null);
  const [tab, setTab] = useState<'participants' | 'presences'>('participants');
  const [busy, setBusy] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [closeOpen, setCloseOpen] = useState(false);
  const [company, setCompany] = useState<any>(null);

  const load = useCallback(async () => {
    try {
      setD(await api.get<SessionDetail>(`/training/sessions/${sessionId}`));
    } catch (e: any) {
      notify('error', errMsg(e));
      onClose();
    }
  }, [sessionId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { load(); }, [load]);

  const closed = d?.status === 'COMPLETED' || d?.status === 'CANCELLED';

  const run = async (key: string, fn: () => Promise<void>) => {
    setBusy(key);
    try { await fn(); } catch (e: any) { notify('error', errMsg(e)); } finally { setBusy(null); }
  };

  const sendConvocations = () => run('conv', async () => {
    const r = await api.post<{ sent: number; total: number; withoutAccount: Array<{ name: string }> }>(`/training/sessions/${sessionId}/convocations`, {});
    notify('success', `${r.sent} convocation(s) envoyée(s) sur ${r.total}`,
      r.withoutAccount.length ? `Sans compte, à prévenir autrement : ${r.withoutAccount.map((x) => x.name).join(', ')}` : undefined);
    await load(); onChanged();
  });

  const cancelSession = () => {
    if (!window.confirm('Annuler cette session ? Les participants seront prévenus et redeviendront « à placer ».')) return;
    run('cancel', async () => {
      await api.patch(`/training/sessions/${sessionId}`, { status: 'CANCELLED' });
      notify('success', 'Session annulée');
      onChanged(); onClose();
    });
  };

  const removeParticipant = (p: Participant) => {
    if (!window.confirm(`Retirer ${p.employee.firstName} ${p.employee.lastName} de la session ?`)) return;
    run(`rm-${p.employeeTrainingId}`, async () => {
      await api.delete(`/training/sessions/${sessionId}/participants/${p.employeeTrainingId}`);
      await load(); onChanged();
    });
  };

  const openSheet = async () => {
    setSheetOpen(true);
    if (!company) {
      try { const me: any = await api.get('/auth/me'); setCompany(me?.company ?? {}); } catch { setCompany({}); }
    }
  };

  return (
    <>
      <Modal open title={d ? `${d.course?.title ?? 'Formation'}${d.label ? ` — ${d.label}` : ''}` : 'Session'} onClose={onClose}>
        {!d ? (
          <div className="flex justify-center py-12"><Loader2 className="animate-spin text-emerald-500" /></div>
        ) : (
          <div className="space-y-4">
            {/* Résumé */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-300">
              <StatusPill status={d.status} />
              <span className="flex items-center gap-1.5"><Calendar size={12} /> {period(d)}{d.startTime ? ` • ${d.startTime}${d.endTime ? `–${d.endTime}` : ''}` : ''}</span>
              {d.location && <span className="flex items-center gap-1.5"><MapPin size={12} /> {d.location}</span>}
              {d.trainerName && <span>Formateur : {d.trainerName}</span>}
              <span className="flex items-center gap-1.5"><Users size={12} /> {d.participants.length}{d.capacity ? ` / ${d.capacity}` : ''}</span>
              {d.convocationSentAt && <span className="text-emerald-400">Convoqués le {fr(d.convocationSentAt)}</span>}
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-2">
              {!closed && (
                <>
                  <Button variant="ghost" onClick={() => setPickerOpen(true)} className="px-3 py-1.5 rounded-xl text-xs font-bold border border-white/10 flex items-center gap-1.5"><UserPlus size={13} /> Ajouter</Button>
                  <Button variant="ghost" onClick={sendConvocations} loading={busy === 'conv'} disabled={!d.participants.length} className="px-3 py-1.5 rounded-xl text-xs font-bold border border-white/10 flex items-center gap-1.5"><Send size={13} /> {d.convocationSentAt ? 'Renvoyer les convocations' : 'Envoyer les convocations'}</Button>
                  <Button variant="ghost" onClick={() => onEdit(d)} className="px-3 py-1.5 rounded-xl text-xs font-bold border border-white/10 flex items-center gap-1.5"><Pencil size={13} /> Modifier</Button>
                </>
              )}
              <Button variant="ghost" onClick={openSheet} disabled={!d.participants.length} className="px-3 py-1.5 rounded-xl text-xs font-bold border border-white/10 flex items-center gap-1.5"><Printer size={13} /> Feuille d’émargement</Button>
              {!closed && (
                <>
                  <Button variant="primary" onClick={() => setCloseOpen(true)} className="px-3 py-1.5 rounded-xl text-xs font-black bg-emerald-500 text-white flex items-center gap-1.5"><Lock size={13} /> Clôturer</Button>
                  <Button variant="ghost" onClick={cancelSession} loading={busy === 'cancel'} className="px-3 py-1.5 rounded-xl text-xs font-bold text-red-400 border border-red-500/30 flex items-center gap-1.5"><Ban size={13} /> Annuler la session</Button>
                </>
              )}
            </div>

            {/* Onglets */}
            <div className="flex gap-1 border-b border-white/10">
              {([['participants', 'Participants', Users], ['presences', 'Présences', ClipboardCheck]] as const).map(([k, l, Icon]) => (
                <Button key={k} variant="ghost" onClick={() => setTab(k)}
                  className={`px-3 py-2 text-xs font-bold flex items-center gap-1.5 border-b-2 ${tab === k ? 'border-emerald-500 text-white' : 'border-transparent text-slate-400'}`}>
                  <Icon size={13} /> {l}
                </Button>
              ))}
            </div>

            {tab === 'participants' && (
              d.participants.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-8">Aucun participant. Cliquez sur « Ajouter ».</p>
              ) : (
                <div className="space-y-2 max-h-[46vh] overflow-y-auto pr-1">
                  {d.participants.map((p) => (
                    <div key={p.employeeTrainingId} className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
                      <div className="w-9 h-9 rounded-xl bg-slate-700 flex items-center justify-center text-xs font-black text-white shrink-0">{p.employee.firstName[0]}{p.employee.lastName[0]}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-white">{p.employee.firstName} {p.employee.lastName}</p>
                        <p className="text-[11px] text-slate-400 truncate">{p.employee.position}{p.employee.department ? ` • ${p.employee.department}` : ''}</p>
                      </div>
                      {d.days.length > 0 && Object.keys(p.attendance).length > 0 && (
                        <span className={`text-[11px] font-black ${p.attendanceRate >= 80 ? 'text-emerald-400' : 'text-amber-400'}`}>{p.attendanceRate}% présent</span>
                      )}
                      {!closed && (
                        <Button variant="ghost" onClick={() => removeParticipant(p)} loading={busy === `rm-${p.employeeTrainingId}`} aria-label="Retirer" className="p-1.5 rounded-lg text-slate-400 hover:text-red-400"><X size={14} /></Button>
                      )}
                    </div>
                  ))}
                </div>
              )
            )}

            {tab === 'presences' && <AttendanceTab d={d} readOnly={closed} onSaved={async () => { await load(); onChanged(); }} notify={notify} />}
          </div>
        )}
      </Modal>

      {pickerOpen && d && (
        <ParticipantPicker
          sessionId={d.id}
          existingIds={new Set(d.participants.map((p) => p.employee.id))}
          onClose={() => setPickerOpen(false)}
          onDone={async () => { setPickerOpen(false); await load(); onChanged(); }}
          notify={notify}
        />
      )}

      {closeOpen && d && (
        <CloseDialog
          sessionId={d.id}
          onClose={() => setCloseOpen(false)}
          onDone={() => { setCloseOpen(false); onChanged(); onClose(); }}
          notify={notify}
        />
      )}

      {sheetOpen && d && (
        <Modal open title="Feuille d’émargement" onClose={() => setSheetOpen(false)}>
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs text-slate-400">A4 paysage. Pour un PDF, choisissez « Enregistrer au format PDF » dans la fenêtre d’impression.</p>
              <Button variant="primary" onClick={() => setTimeout(() => printLeaveDocument('training-attendance-sheet', 'landscape'), 50)} className="px-4 py-2 bg-emerald-500 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shrink-0"><Printer size={14} /> Imprimer</Button>
            </div>
            <DocumentReader title="Feuille d’émargement" landscape>
              
                <AttendanceSheetPrintable
                  id="training-attendance-sheet"
                  company={company || {}}
                  session={{
                    courseTitle: d.course?.title ?? 'Formation', label: d.label, startDate: d.startDate, endDate: d.endDate,
                    startTime: d.startTime, endTime: d.endTime, location: d.location, trainerName: d.trainerName,
                    durationHours: d.course?.durationHours ?? null,
                  }}
                  days={d.days}
                  participants={d.participants.map((p) => ({ firstName: p.employee.firstName, lastName: p.employee.lastName, position: p.employee.position, department: p.employee.department }))}
                />
              
            </DocumentReader>
          </div>
        </Modal>
      )}
    </>
  );
}

// ─── Onglet Présences ─────────────────────────────────────────────────────────
function AttendanceTab({
  d, readOnly, onSaved, notify,
}: {
  d: SessionDetail;
  readOnly: boolean;
  onSaved: () => Promise<void>;
  notify: ReturnType<typeof useToast>;
}) {
  const initialDay = d.days.includes(todayYmd()) ? todayYmd() : d.days[0];
  const [day, setDay] = useState(initialDay);
  const [marks, setMarks] = useState<Record<string, AttStatus>>({});
  const [saving, setSaving] = useState(false);

  // Recharger les marques quand le jour ou les données changent
  useEffect(() => {
    const m: Record<string, AttStatus> = {};
    for (const p of d.participants) {
      const a = p.attendance[day];
      if (a) m[p.employeeTrainingId] = a.status;
    }
    setMarks(m);
  }, [day, d]);

  if (!d.participants.length) return <p className="text-sm text-slate-400 text-center py-8">Ajoutez d’abord des participants.</p>;

  const save = async () => {
    const records = Object.entries(marks).map(([employeeTrainingId, status]) => ({ employeeTrainingId, status }));
    if (!records.length) return notify('error', 'Aucune présence saisie');
    setSaving(true);
    try {
      await api.put(`/training/sessions/${d.id}/attendance`, { date: day, records });
      notify('success', `Présences du ${frShort(day)} enregistrées`);
      await onSaved();
    } catch (e: any) {
      notify('error', errMsg(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1.5">
        {d.days.map((x) => (
          <Button key={x} variant="ghost" onClick={() => setDay(x)}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold ${day === x ? 'bg-emerald-500 text-white' : 'bg-white/5 text-slate-300'}`}>{frShort(x)}</Button>
        ))}
      </div>
      {!readOnly && (
        <Button variant="ghost" onClick={() => setMarks(Object.fromEntries(d.participants.map((p) => [p.employeeTrainingId, 'PRESENT' as AttStatus])))}
          className="text-[11px] font-bold text-emerald-400 underline">Tout le monde présent</Button>
      )}
      <div className="space-y-2 max-h-[40vh] overflow-y-auto pr-1">
        {d.participants.map((p) => (
          <div key={p.employeeTrainingId} className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-xl bg-white/5 border border-white/10">
            <p className="text-sm font-bold text-white">{p.employee.firstName} {p.employee.lastName}</p>
            <div className="flex gap-1">
              {(Object.keys(ATT_LABEL) as AttStatus[]).map((s) => (
                <Button key={s} variant="ghost" disabled={readOnly} onClick={() => setMarks((m) => ({ ...m, [p.employeeTrainingId]: s }))}
                  className={`px-2 py-1 rounded-lg text-[10px] font-black ${marks[p.employeeTrainingId] === s ? ATT_ACTIVE[s] : 'bg-white/5 text-slate-400'}`}>{ATT_LABEL[s]}</Button>
              ))}
            </div>
          </div>
        ))}
      </div>
      {!readOnly && (
        <Button variant="primary" onClick={save} loading={saving} className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-black rounded-xl text-sm">Enregistrer les présences du {frShort(day)}</Button>
      )}
    </div>
  );
}

// ─── Sélecteur de participants ────────────────────────────────────────────────
function ParticipantPicker({
  sessionId, existingIds, onClose, onDone, notify,
}: {
  sessionId: string;
  existingIds: Set<string>;
  onClose: () => void;
  onDone: () => Promise<void>;
  notify: ReturnType<typeof useToast>;
}) {
  const [list, setList] = useState<EmployeeLite[] | null>(null);
  const [q, setQ] = useState('');
  const [sel, setSel] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get<any[]>('/employees/simple').then((r) => setList(r ?? [])).catch(() => { setList([]); notify('error', 'Impossible de charger les employés'); });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    return (list ?? []).filter((e) => !existingIds.has(e.id) && (!t || `${e.firstName} ${e.lastName} ${e.position ?? ''} ${e.department?.name ?? ''}`.toLowerCase().includes(t)));
  }, [list, q, existingIds]);

  const toggle = (id: string) => setSel((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const submit = async () => {
    setSaving(true);
    try {
      const r = await api.post<{ added: number; skipped: Array<{ name: string; reason: string }> }>(`/training/sessions/${sessionId}/participants`, { employeeIds: Array.from(sel) });
      notify(r.added ? 'success' : 'error', `${r.added} participant(s) ajouté(s)`,
        r.skipped.length ? r.skipped.map((s) => `${s.name} : ${s.reason}`).join(' • ') : undefined);
      await onDone();
    } catch (e: any) {
      notify('error', errMsg(e));
      setSaving(false);
    }
  };

  return (
    <Modal open title="Ajouter des participants" onClose={onClose}>
      <div className="space-y-3">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher un employé, un poste, un service…" className={`${inputCls} pl-9`} />
        </div>
        {list === null ? (
          <div className="flex justify-center py-8"><Loader2 className="animate-spin text-emerald-500" /></div>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-6 flex items-center justify-center gap-2"><AlertCircle size={14} /> Aucun employé disponible</p>
        ) : (
          <>
            <Button variant="ghost" onClick={() => setSel(new Set(filtered.map((e) => e.id)))} className="text-[11px] font-bold text-emerald-400 underline">Tout sélectionner ({filtered.length})</Button>
            <div className="max-h-[42vh] overflow-y-auto space-y-1.5 pr-1">
              {filtered.map((e) => (
                <label key={e.id} className={`flex items-center gap-3 p-2.5 rounded-xl border cursor-pointer ${sel.has(e.id) ? 'border-emerald-500/50 bg-emerald-500/10' : 'border-white/10 bg-white/5'}`}>
                  <input type="checkbox" checked={sel.has(e.id)} onChange={() => toggle(e.id)} />
                  <span className="flex-1 min-w-0">
                    <span className="block text-sm font-bold text-white">{e.firstName} {e.lastName}</span>
                    <span className="block text-[11px] text-slate-400 truncate">{e.position}{e.department ? ` • ${e.department.name}` : ''}</span>
                  </span>
                </label>
              ))}
            </div>
          </>
        )}
        <div className="flex gap-3">
          <Button variant="ghost" onClick={onClose} className="flex-1 py-2.5 border border-white/10 rounded-xl text-slate-400 font-bold text-sm">Annuler</Button>
          <Button variant="primary" onClick={submit} loading={saving} disabled={!sel.size} className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-black rounded-xl text-sm">Ajouter {sel.size || ''}</Button>
        </div>
      </div>
    </Modal>
  );
}

// ─── Clôture ──────────────────────────────────────────────────────────────────
function CloseDialog({
  sessionId, onClose, onDone, notify,
}: {
  sessionId: string;
  onClose: () => void;
  onDone: () => void;
  notify: ReturnType<typeof useToast>;
}) {
  const [pct, setPct] = useState('80');
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<null | { readyForCertification: number; belowThreshold: Array<{ name: string; rate: number }> }>(null);

  const submit = async () => {
    setSaving(true);
    try {
      setResult(await api.post(`/training/sessions/${sessionId}/close`, { minAttendancePct: Number(pct) }));
    } catch (e: any) {
      notify('error', errMsg(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open title="Clôturer la session" onClose={result ? onDone : onClose}>
      {!result ? (
        <div className="space-y-4">
          <p className="text-sm text-slate-300">Les participants présents au moins <b>{pct || 0}%</b> des jours passent en « validation en attente » : vous leur attribuez ensuite la mention et le certificat depuis l’onglet Demandes.</p>
          <div><label className={labelCls}>Présence minimale (%)</label><input type="number" min={0} max={100} value={pct} onChange={(e) => setPct(e.target.value)} className={inputCls} /></div>
          <div className="flex gap-3">
            <Button variant="ghost" onClick={onClose} className="flex-1 py-2.5 border border-white/10 rounded-xl text-slate-400 font-bold text-sm">Annuler</Button>
            <Button variant="primary" onClick={submit} loading={saving} className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-black rounded-xl text-sm">Clôturer</Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-emerald-400 font-bold flex items-center gap-2"><CheckCircle2 size={16} /> {result.readyForCertification} participant(s) prêt(s) pour la certification.</p>
          {result.belowThreshold.length > 0 && (
            <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-3 text-xs text-amber-300">
              <p className="font-bold mb-1">Sous le seuil de présence (non envoyés en validation) :</p>
              {result.belowThreshold.map((b) => <p key={b.name}>{b.name} — {b.rate}%</p>)}
            </div>
          )}
          <Button variant="primary" onClick={onDone} className="w-full py-2.5 bg-emerald-500 text-white font-black rounded-xl text-sm">Terminer</Button>
        </div>
      )}
    </Modal>
  );
}
