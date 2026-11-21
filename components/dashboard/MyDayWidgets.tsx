'use client';
import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, ChevronLeft, ChevronRight, MessageSquare, Plus, Flag, Megaphone, Send } from 'lucide-react';
import { Badge, Button, Card, EmptyState, Input, Skeleton, Textarea } from '@/components/design-system/primitives';
import { Modal, useToast } from '@/components/design-system/feedback';
import { useTasks } from '@/hooks/useTasks';
import { useDayEvents } from '@/hooks/useDayEvents';
import type { Task } from '@/types/contracts/tasks';
import type { DayContext } from './day-types';
import { calendarDays, dayKey, nextCalendarMonth } from './day-calendar';

type TaskFilter = 'today' | 'future' | 'done';
const dueOf = (t: Task) => (t.dueDate ? t.dueDate.slice(0, 10) : '');
const shortDate = (day: string) => new Date(`${day}T12:00:00Z`).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', timeZone: 'Africa/Brazzaville' });
const matchesFilter = (t: Task, f: TaskFilter, today: string) => f === 'done' ? t.status === 'DONE' : t.status !== 'DONE' && (f === 'future' ? !!dueOf(t) && dueOf(t) > today : !dueOf(t) || dueOf(t) <= today);

export function DayTasks() {
  const tasks = useTasks(); const notify = useToast(); const today = dayKey();
  const [title, setTitle] = useState(''); const [dueDate, setDueDate] = useState(today); const [filter, setFilter] = useState<TaskFilter>('today'); const [creating, setCreating] = useState(false);
  const [pending, setPending] = useState<Set<string>>(new Set()); // tâches en cours de mise à jour (seule leur case est figée)
  const [lingering, setLingering] = useState<Set<string>>(new Set()); // tâches modifiées : elles RESTENT à leur place dans l'onglet courant
  const [error, setError] = useState(''); const [dialog, setDialog] = useState<{ task: Task; action: 'comment' | 'block' } | null>(null); const [note, setNote] = useState(''); const [sending, setSending] = useState(false);
  const counts = useMemo(() => ({ today: tasks.tasks.filter(t => matchesFilter(t, 'today', today)).length, future: tasks.tasks.filter(t => matchesFilter(t, 'future', today)).length, done: tasks.tasks.filter(t => matchesFilter(t, 'done', today)).length }), [tasks.tasks, today]);
  const visible = tasks.tasks.filter(t => matchesFilter(t, filter, today) || lingering.has(t.id));
  const changeFilter = (next: TaskFilter) => { setFilter(next); setLingering(new Set()); };
  const mark = (set: React.Dispatch<React.SetStateAction<Set<string>>>, id: string, on: boolean) => set(prev => { const next = new Set(prev); if (on) next.add(id); else next.delete(id); return next; });

  const setStatus = async (t: Task, status: 'TODO' | 'DONE' | 'BLOCKED', message: string) => {
    mark(setPending, t.id, true); mark(setLingering, t.id, true); setError('');
    try { await tasks.update(t.id, status); notify('success', message); }
    catch (e) { mark(setLingering, t.id, false); setError(e instanceof Error ? e.message : 'La modification a été interrompue.'); }
    finally { mark(setPending, t.id, false); }
  };
  const create = async (e: React.FormEvent) => {
    e.preventDefault(); const text = title.trim(); if (!text) return; setCreating(true); setError('');
    const future = dueDate > today;
    try {
      await tasks.createPersonal(text, future ? dueDate : undefined);
      setTitle(''); setDueDate(today); changeFilter(future ? 'future' : 'today');
      notify('success', future ? `Tâche planifiée pour le ${shortDate(dueDate)}` : 'Tâche ajoutée à aujourd’hui');
    } catch (err) { setError(err instanceof Error ? err.message : 'La création a été interrompue.'); }
    finally { setCreating(false); }
  };
  const submitDialog = async (e: React.FormEvent) => {
    e.preventDefault(); if (!dialog) return; setSending(true); setError('');
    try {
      if (dialog.action === 'block') await tasks.update(dialog.task.id, 'BLOCKED', note); else await tasks.comment(dialog.task.id, note);
      notify('success', dialog.action === 'block' ? 'Blocage signalé' : 'Commentaire ajouté'); setDialog(null);
    } catch (err) { setError(err instanceof Error ? err.message : 'La modification a été interrompue.'); }
    finally { setSending(false); }
  };

  return <Card className="myday-tasks" title="Mes tâches" action={<span className="k-caption">Perso et assignées</span>}>
    {!tasks.available ? <p className="k-caption">Bientôt disponible. Vos tâches personnelles et assignées seront réunies ici.</p> : <>
      <form className="myday-task-create" onSubmit={create}>
        <Input label="Nouvelle tâche personnelle" value={title} onChange={e => setTitle(e.target.value)} placeholder="Une chose à faire…" required maxLength={200} />
        <Input label="Pour quand ?" type="date" value={dueDate} min={today} onChange={e => setDueDate(e.target.value || today)} />
        <Button type="submit" loading={creating} aria-label="Ajouter la tâche"><Plus size={18} strokeWidth={1.5} /><span className="myday-task-add-label">Ajouter</span></Button>
      </form>
      <div className="request-tabs" role="group" aria-label="Filtrer mes tâches">{([['today', 'Aujourd’hui'], ['future', 'À venir'], ['done', 'Terminées']] as [TaskFilter, string][]).map(([key, text]) => <button type="button" key={key} aria-pressed={filter === key} onClick={() => changeFilter(key)}>{text}<span className="myday-task-count">{counts[key]}</span></button>)}</div>
      <p className="k-help myday-task-hint">Cochez la case pour terminer une tâche, décochez-la pour la rouvrir. Choisissez une date ci-dessus pour la planifier dans « À venir ».</p>
      {(error || tasks.error) && <p role="alert" className="k-error">{error || tasks.error}</p>}
      <div className="myday-task-viewport">
        {tasks.loading ? <div role="status" aria-label="Chargement des tâches"><Skeleton /><Skeleton /></div> : visible.length ? <ul className="myday-task-list">{visible.map(t => {
          const busyRow = pending.has(t.id); const done = t.status === 'DONE'; const due = dueOf(t);
          return <li key={t.id} className={done ? 'myday-task-done' : ''}>
            <input type="checkbox" title={done ? 'Rouvrir cette tâche' : 'Marquer comme terminée'} aria-label={done ? `Rouvrir : ${t.title}` : `Terminer : ${t.title}`} checked={done} disabled={busyRow} onChange={e => { void setStatus(t, e.target.checked ? 'DONE' : 'TODO', e.target.checked ? 'Tâche terminée' : 'Tâche rouverte'); }} />
            <div>
              <strong>{t.title}</strong>
              <span>{t.scope === 'PERSONAL' ? 'Perso · Privée' : `Assignée par ${t.assignedBy?.name || 'votre responsable'}`}{due && <> · {due > today ? `Prévue le ${shortDate(due)}` : `Échéance ${shortDate(due)}`}</>}{done && ' · Terminée'}</span>
              {t.status === 'BLOCKED' && <><Badge tone="warning">Bloquée</Badge>{t.blockedReason && <p className="k-caption">{t.blockedReason}</p>}</>}
              {(t.comments || []).length > 0 && <details><summary>{(t.comments || []).length} commentaire(s)</summary>{(t.comments || []).map(c => <p key={c.id} className="k-caption">{c.text}</p>)}</details>}
            </div>
            <div className="myday-task-actions">
              <button type="button" className="myday-task-action" disabled={busyRow} onClick={() => { setDialog({ task: t, action: 'comment' }); setNote(''); setError(''); }}><MessageSquare size={14} strokeWidth={1.5} aria-hidden="true" /><span>Commenter</span></button>
              {t.status === 'BLOCKED'
                ? <button type="button" className="myday-task-action" disabled={busyRow} onClick={() => { void setStatus(t, 'TODO', 'Tâche débloquée'); }}><Flag size={14} strokeWidth={1.5} aria-hidden="true" /><span>Débloquer</span></button>
                : !done && <button type="button" className="myday-task-action" disabled={busyRow} onClick={() => { setDialog({ task: t, action: 'block' }); setNote(''); setError(''); }}><Flag size={14} strokeWidth={1.5} aria-hidden="true" /><span>Bloquer</span></button>}
            </div>
          </li>;
        })}</ul> : <EmptyState title={filter === 'done' ? 'Les tâches terminées vous attendront ici' : filter === 'future' ? 'Rien de prévu pour plus tard' : 'Un peu de place pour la suite'}>{filter === 'future' ? 'Ajoutez une tâche avec une date future : elle apparaîtra ici.' : 'Ajoutez une tâche personnelle ou retrouvez ici celles de votre responsable.'}</EmptyState>}
      </div>
    </>}
    <Modal open={!!dialog} onClose={() => { if (!sending) setDialog(null); }} title={dialog?.action === 'block' ? 'Signaler un blocage' : 'Ajouter un commentaire'}><form className="template-stack" onSubmit={submitDialog}><Textarea label={dialog?.action === 'block' ? 'Qu’est-ce qui vous bloque ?' : 'Votre commentaire'} value={note} required onChange={e => setNote(e.target.value)} />{error && <p role="alert" className="k-error">{error}</p>}<Button type="submit" loading={sending}>Envoyer</Button></form></Modal>
  </Card>;
}

export function DayCalendar({ context, holidays, holidaysAvailable }: { context: DayContext; holidays: { date: string; label: string }[]; holidaysAvailable: boolean }) {
  const [month, setMonth] = useState(() => dayKey().slice(0, 7)); const today = dayKey();
  const label = new Date(`${month}-01T12:00:00Z`).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric', timeZone: 'Africa/Brazzaville' });
  return <Card className="myday-calendar" title="Mon calendrier"><div className="myday-month"><Button variant="ghost" aria-label="Mois précédent" onClick={() => setMonth(nextCalendarMonth(month, -1))}><ChevronLeft size={17} strokeWidth={1.5} /></Button><strong>{label}</strong><Button variant="ghost" aria-label="Mois suivant" onClick={() => setMonth(nextCalendarMonth(month, 1))}><ChevronRight size={17} strokeWidth={1.5} /></Button></div><div className="myday-calendar-grid" role="list" aria-label={label}>{['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((d, i) => <span aria-hidden="true" key={`weekday-${i}`} className="myday-weekday">{d}</span>)}{calendarDays(month).map((day, i) => {
    if (!day) return <span key={`blank-${i}`} aria-hidden="true" />;
    const holiday = holidays.find(h => h.date === day); const leave = context.leaves?.find(l => l.status === 'APPROVED' && day >= l.startDate.slice(0, 10) && day <= l.endDate.slice(0, 10));
    return <span key={day} role="listitem" aria-current={day === today ? 'date' : undefined} aria-label={`${day}${holiday ? ` · ${holiday.label}` : ''}${leave ? ' · Congé approuvé' : ''}`} className={`${holiday ? 'myday-holiday' : ''} ${leave ? 'myday-leave' : ''}`}><time dateTime={day}>{Number(day.slice(-2))}</time></span>;
  })}</div><div className="myday-calendar-key"><span>Congé approuvé</span><span>Jour férié</span></div>{!holidaysAvailable && <p className="k-help">Les jours fériés de votre entreprise seront bientôt disponibles.</p>}</Card>;
}

type FeedEvent = ReturnType<typeof useDayEvents>['events'][number] & { canComment?: boolean; sentCount?: number; comments?: { id: string; author: string; text: string; createdAt: string }[] };
const CONFETTI_COLORS = ['#f97316', '#ec4899', '#8b5cf6', '#06b6d4', '#22c55e', '#eab308'];

export function DayEvents() {
  const events = useDayEvents(); const notify = useToast();
  return <Card className="myday-events" title="Dans l’équipe">{!events.available ? <p className="k-caption">Anniversaires et messages de bienvenue : bientôt disponibles.</p> : events.loading ? <Skeleton className="myday-event-loading" /> : events.error ? <p role="alert" className="k-error">{events.error}</p> : events.events.length ? events.events.map(event => <EventCard key={event.id} event={event as FeedEvent}
    react={async emoji => { try { await events.react(event.id, emoji); } catch { notify('error', 'Votre réaction n’a pas pu être enregistrée.'); } }}
    comment={async text => { try { await events.comment(event.id, text); return true; } catch (e) { notify('error', e instanceof Error ? e.message : 'Le message n’a pas pu être envoyé.'); return false; } }} />) : <p className="k-caption">Les prochains moments à partager apparaîtront ici.</p>}</Card>;
}

function EventCard({ event, react, comment }: { event: FeedEvent; react: (emoji: string) => void; comment: (text: string) => Promise<boolean> }) {
  const [celebrate, setCelebrate] = useState(false); const [detail, setDetail] = useState(false); const [inbox, setInbox] = useState(false);
  const [message, setMessage] = useState(''); const [sending, setSending] = useState(false);
  useEffect(() => {
    if (event.type !== 'BIRTHDAY' || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const key = `konza:celebrated:${event.companyId}:${event.subject?.id || event.id}:${event.expiresAt.slice(0, 10)}`;
    let timer: ReturnType<typeof setTimeout> | undefined;
    // Delaying until the frame prevents StrictMode's effect probe from marking
    // the celebration as seen before its real mount.
    const frame = requestAnimationFrame(() => { try { if (localStorage.getItem(key)) return; localStorage.setItem(key, '1'); setCelebrate(true); timer = setTimeout(() => setCelebrate(false), 900); } catch { /* unavailable storage: no repeated confetti */ } });
    return () => { cancelAnimationFrame(frame); clearTimeout(timer); };
  }, [event.type, event.companyId, event.subject?.id, event.id, event.expiresAt]);

  const person = !!event.subject; const isMe = person && event.canComment === false;
  const firstName = (event.subject?.name || '').split(' ')[0] || 'cette personne';
  const total = event.reactions.reduce((n, r) => n + r.count, 0);
  const voters = event.reactions.filter(r => r.count > 0);
  const sent = event.sentCount || 0; const received = event.comments || [];
  const headline = event.type === 'BIRTHDAY' ? `Aujourd’hui ${event.subject?.name || firstName} fête son anniversaire !` : event.type === 'WELCOME' ? `Bienvenue à ${event.subject?.name || firstName} !` : (event.title || 'Un moment à partager');
  const sub = isMe ? (event.type === 'BIRTHDAY' ? 'C’est votre jour : toute l’équipe pense à vous. 🎉' : 'Bienvenue dans l’équipe ! 🎉') : event.type === 'BIRTHDAY' ? 'Une petite réaction pour lui souhaiter une belle journée.' : event.type === 'WELCOME' ? 'Faites-lui bon accueil.' : '';

  const submit = async (e: React.FormEvent) => { e.preventDefault(); const text = message.trim(); if (!text || sending) return; setSending(true); if (await comment(text)) setMessage(''); setSending(false); };

  return <article className={`myday-event myday-event-post${person ? '' : ' myday-event-announcement'}`}>
    {celebrate && <div className="myday-confetti" aria-hidden="true">{Array.from({ length: 12 }, (_, i) => <i key={i} style={{ left: `${i * 8}%`, animationDelay: `${i % 3 * 60}ms` }} />)}</div>}
    {person ? <>
      <div className="myday-event-head"><h3>{headline}</h3>{sub && <p>{sub}</p>}</div>
      <div className="myday-event-photo">
        <div className="myday-confetti-ring" aria-hidden="true">{Array.from({ length: 16 }, (_, i) => <i key={i} style={{ '--a': `${i * 22.5}deg`, '--r': `${i % 2 ? 76 : 64}px`, '--t': `${(i * 47) % 90}deg`, '--c': CONFETTI_COLORS[i % CONFETTI_COLORS.length] } as React.CSSProperties} />)}</div>
        {event.subject?.photoUrl ? <img src={event.subject.photoUrl} alt="" width={104} height={104} /> : <span className="myday-person-mark myday-person-mark-lg" aria-hidden="true">{(event.subject?.name || '').slice(0, 1) || 'K'}</span>}
      </div>
    </> : <div className="myday-event-head myday-event-head-post"><Megaphone size={18} strokeWidth={1.5} aria-hidden="true" /><div><h3>{headline}</h3>{event.body && <p>{event.body}</p>}</div></div>}

    <div className="myday-reactions" role="group" aria-label="Réagir (une seule réaction par personne)">{event.reactions.map(r => <button type="button" key={r.emoji} className="myday-reaction" aria-pressed={r.mine} aria-label={`Réagir ${r.emoji} · ${r.count} réaction(s)`} onClick={() => react(r.emoji)}><span>{r.emoji}</span>{r.count > 0 && <b>{r.count}</b>}</button>)}</div>
    <div className="myday-event-meta">
      <span>{total > 0 ? `${total} réaction${total > 1 ? 's' : ''}` : 'Soyez le premier à réagir'}</span>
      {total > 0 && <button type="button" className="myday-link-button" aria-expanded={detail} onClick={() => setDetail(v => !v)}>{detail ? 'Masquer le détail' : 'Voir le détail'}</button>}
    </div>
    {detail && <ul className="myday-reaction-detail">{voters.map(r => <li key={r.emoji}><span>{r.emoji}</span>{((r as unknown as { userNames?: string[] }).userNames || []).join(', ') || `${r.count} personne(s)`}</li>)}</ul>}

    {person && event.canComment && <form className="myday-event-message" onSubmit={submit}>
      <input value={message} onChange={e => setMessage(e.target.value)} maxLength={1000} placeholder={sent >= 3 ? 'Messages déjà envoyés' : `Un mot pour ${firstName}… (privé)`} aria-label={`Message privé pour ${firstName}`} disabled={sending || sent >= 3} />
      <button type="submit" aria-label="Envoyer le message" disabled={!message.trim() || sending || sent >= 3}><Send size={15} strokeWidth={1.5} aria-hidden="true" /></button>
      {sent > 0 && <p className="k-help">Message envoyé. Seul(e) {firstName} pourra le lire.</p>}
    </form>}
    {person && isMe && received.length > 0 && <div className="myday-event-inbox"><button type="button" className="myday-link-button" aria-expanded={inbox} onClick={() => setInbox(v => !v)}>{inbox ? 'Masquer mes messages' : `Lire mes messages (${received.length})`}</button>{inbox && <ul>{received.map(c => <li key={c.id}><strong>{c.author}</strong><p>{c.text}</p></li>)}</ul>}</div>}
  </article>;
}

export type WeekDay = { date: string; label: string; start?: string; end?: string; kind: 'shift' | 'company' | 'off'; today: boolean };

export function DaySchedule({ available, loading, error, week, schedule, holidays, leaves }: { available: boolean; loading: boolean; error: string; week?: WeekDay[]; schedule: { label: string; start: string; end: string }[]; holidays: { date: string; label: string }[]; leaves?: DayContext['leaves'] }) {
  const dayName = (date: string) => new Date(`${date}T12:00:00Z`).toLocaleDateString('fr-FR', { weekday: 'short', timeZone: 'Africa/Brazzaville' }).replace('.', '');
  const dayNum = (date: string) => new Date(`${date}T12:00:00Z`).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', timeZone: 'Africa/Brazzaville' });
  const today = dayKey();
  // Ancien serveur (sans `week`) : on montre au moins l'horaire d'aujourd'hui.
  const days: WeekDay[] | undefined = week?.length ? week : schedule.length ? [{ date: today, label: schedule[0].label, start: schedule[0].start, end: schedule[0].end, kind: 'shift', today: true }] : undefined;
  return <Card className="myday-schedule" title="Mes horaires" action={<Link className="myday-text-link" href="/presences">Mes présences<ArrowRight size={14} strokeWidth={1.5} aria-hidden="true" /></Link>}>
    {!available ? <p className="k-caption">Votre planning sera bientôt disponible dans cet espace.</p> : error ? <p className="k-error">{error}</p> : loading ? <Skeleton /> : days?.length ? <>
      <p className="k-help myday-week-hint">Votre semaine en cours. L’historique de vos pointages est dans « Mes présences ».</p>
      <ul className="myday-week" aria-label="Mes horaires de la semaine">{days.map(d => {
        const holiday = holidays.find(h => h.date === d.date);
        const leave = leaves?.find(l => l.status === 'APPROVED' && d.date >= l.startDate.slice(0, 10) && d.date <= l.endDate.slice(0, 10));
        const state = leave ? 'leave' : holiday ? 'holiday' : d.kind === 'off' ? 'off' : 'work';
        return <li key={d.date} className={`myday-week-day myday-week-${state}${d.today ? ' myday-week-today' : ''}`} aria-current={d.today ? 'date' : undefined}>
          <div className="myday-week-date"><span>{dayName(d.date)}</span><b>{dayNum(d.date)}</b></div>
          {state === 'leave' ? <p className="myday-week-main">Congé</p> : state === 'holiday' ? <><p className="myday-week-main">Jour férié</p><p className="myday-week-sub">{holiday?.label}</p></> : state === 'off' ? <p className="myday-week-main">Repos</p> : <><p className="myday-week-main">{d.start} – {d.end}</p><p className="myday-week-sub">{d.label}</p></>}
        </li>;
      })}</ul>
    </> : <p className="k-caption">Aucun horaire communiqué pour cette semaine.</p>}
  </Card>;
}