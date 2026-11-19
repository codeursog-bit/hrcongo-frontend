'use client';
import React, { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, MessageSquare, Plus, Flag } from 'lucide-react';
import { Badge, Button, Card, EmptyState, Input, Skeleton, Textarea } from '@/components/design-system/primitives';
import { Modal, useToast } from '@/components/design-system/feedback';
import { useTasks } from '@/hooks/useTasks';
import { useDayEvents } from '@/hooks/useDayEvents';
import type { Task } from '@/types/contracts/tasks';
import type { DayContext } from './day-types';
import { calendarDays, dayKey, nextCalendarMonth } from './day-calendar';

export function DayTasks() {
  const tasks = useTasks(); const notify = useToast();
  const [title, setTitle] = useState(''); const [filter, setFilter] = useState('today'); const [busy, setBusy] = useState(false);
  const [error, setError] = useState(''); const [dialog, setDialog] = useState<{ task: Task; action: 'comment' | 'block' } | null>(null); const [note, setNote] = useState('');
  const today = dayKey(); const visible = tasks.tasks.filter(t => filter === 'done' ? t.status === 'DONE' : t.status !== 'DONE' && (filter === 'future' ? !!t.dueDate && t.dueDate.slice(0, 10) > today : !t.dueDate || t.dueDate.slice(0, 10) <= today));
  const run = async (action: () => Promise<void>, message: string) => { setBusy(true); setError(''); try { await action(); notify('success', message); return true; } catch (e) { setError(e instanceof Error ? e.message : 'La modification a été interrompue.'); return false; } finally { setBusy(false); } };
  return <Card className="myday-tasks" title="Mes tâches" action={<span className="k-caption">Perso et assignées</span>}>
    {!tasks.available ? <p className="k-caption">Bientôt disponible. Vos tâches personnelles et assignées seront réunies ici.</p> : <>
      <form className="myday-task-create" onSubmit={async e => { e.preventDefault(); if (await run(() => tasks.createPersonal(title), 'Tâche personnelle créée')) setTitle(''); }}><Input label="Nouvelle tâche personnelle" value={title} onChange={e => setTitle(e.target.value)} placeholder="Une chose à faire aujourd’hui…" required maxLength={200} /><Button type="submit" loading={busy} aria-label="Ajouter une tâche personnelle"><Plus size={18} strokeWidth={1.5} /></Button></form>
      <div className="request-tabs" role="group" aria-label="Filtrer mes tâches">{[['today', 'Aujourd’hui'], ['future', 'À venir'], ['done', 'Terminées']].map(([key, text]) => <button type="button" key={key} aria-pressed={filter === key} onClick={() => setFilter(key)}>{text}</button>)}</div>
      {(error || tasks.error) && <p role="alert" className="k-error">{error || tasks.error}</p>}
      {tasks.loading ? <div role="status" aria-label="Chargement des tâches"><Skeleton /><Skeleton /></div> : visible.length ? <ul className="myday-task-list">{visible.map(t => <li key={t.id} className={t.status === 'DONE' ? 'myday-task-done' : ''}><input type="checkbox" aria-label={`Terminer : ${t.title}`} checked={t.status === 'DONE'} disabled={busy} onChange={e => { void run(() => tasks.update(t.id, e.target.checked ? 'DONE' : 'TODO'), e.target.checked ? 'Tâche terminée' : 'Tâche rouverte'); }} /><div><strong>{t.title}</strong><span>{t.scope === 'PERSONAL' ? 'Perso · Privée' : `Assignée par ${t.assignedBy?.name || 'votre responsable'}`}</span>{t.status === 'BLOCKED' && <><Badge tone="warning">Bloquée</Badge><p className="k-caption">{t.blockedReason}</p></>}{t.dueDate && <time dateTime={t.dueDate}>Échéance : {t.dueDate.slice(0, 10)}</time>}{(t.comments || []).length > 0 && <details><summary>{(t.comments || []).length} commentaire(s)</summary>{(t.comments || []).map(c => <p key={c.id} className="k-caption">{c.text}</p>)}</details>}</div><div className="myday-task-actions"><Button variant="ghost" aria-label={`Commenter : ${t.title}`} disabled={busy} onClick={() => { setDialog({ task: t, action: 'comment' }); setNote(''); }}><MessageSquare size={16} strokeWidth={1.5} /></Button>{t.status !== 'DONE' && <Button variant="ghost" aria-label={`Signaler un blocage : ${t.title}`} disabled={busy} onClick={() => { setDialog({ task: t, action: 'block' }); setNote(''); }}><Flag size={16} strokeWidth={1.5} /></Button>}</div></li>)}</ul> : <EmptyState title={filter === 'done' ? 'Les tâches terminées vous attendront ici' : 'Un peu de place pour la suite'}>Ajoutez une tâche personnelle ou retrouvez ici celles de votre responsable.</EmptyState>}
    </>}
    <Modal open={!!dialog} onClose={() => { if (!busy) setDialog(null); }} title={dialog?.action === 'block' ? 'Signaler un blocage' : 'Ajouter un commentaire'}><form className="template-stack" onSubmit={async e => { e.preventDefault(); if (!dialog) return; if (await run(() => dialog.action === 'block' ? tasks.update(dialog.task.id, 'BLOCKED', note) : tasks.comment(dialog.task.id, note), dialog.action === 'block' ? 'Blocage signalé' : 'Commentaire ajouté')) setDialog(null); }}><Textarea label={dialog?.action === 'block' ? 'Qu’est-ce qui vous bloque ?' : 'Votre commentaire'} value={note} required onChange={e => setNote(e.target.value)} />{error && <p role="alert" className="k-error">{error}</p>}<Button type="submit" loading={busy}>Envoyer</Button></form></Modal>
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

export function DayEvents() {
  const events = useDayEvents(); const notify = useToast(); const [busy, setBusy] = useState(false);
  return <Card className="myday-events" title="Dans l’équipe">{!events.available ? <p className="k-caption">Anniversaires et messages de bienvenue : bientôt disponibles.</p> : events.loading ? <Skeleton className="myday-event-loading" /> : events.error ? <p role="alert" className="k-error">{events.error}</p> : events.events.length ? events.events.map(event => <BirthdayEvent key={event.id} event={event} busy={busy} react={async emoji => { setBusy(true); try { await events.react(event.id, emoji); } catch { notify('error', 'Votre réaction n’a pas pu être ajoutée.'); } finally { setBusy(false); } }} />) : <p className="k-caption">Les prochains moments à partager apparaîtront ici.</p>}</Card>;
}
function BirthdayEvent({ event, busy, react }: { event: ReturnType<typeof useDayEvents>['events'][number]; busy: boolean; react: (emoji: string) => void }) {
  const [celebrate, setCelebrate] = useState(false);
  useEffect(() => {
    if (event.type !== 'BIRTHDAY' || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const key = `konza:celebrated:${event.companyId}:${event.subject?.id || event.id}:${event.expiresAt.slice(0, 10)}`;
    let timer: ReturnType<typeof setTimeout> | undefined;
    // Delaying until the frame prevents StrictMode's effect probe from marking
    // the celebration as seen before its real mount.
    const frame = requestAnimationFrame(() => { try { if (localStorage.getItem(key)) return; localStorage.setItem(key, '1'); setCelebrate(true); timer = setTimeout(() => setCelebrate(false), 900); } catch { /* unavailable storage: no repeated confetti */ } });
    return () => { cancelAnimationFrame(frame); clearTimeout(timer); };
  }, [event.type, event.companyId, event.subject?.id, event.id, event.expiresAt]);
  return <article className="myday-event">{celebrate && <div className="myday-confetti" aria-hidden="true">{Array.from({ length: 12 }, (_, i) => <i key={i} style={{ left: `${i * 8}%`, animationDelay: `${i % 3 * 60}ms` }} />)}</div>}<div className="myday-event-title">{event.subject?.photoUrl ? <img src={event.subject.photoUrl} alt="" width={44} height={44} /> : <span className="myday-person-mark" aria-hidden="true">{(event.subject?.name || '').slice(0, 1) || 'K'}</span>}<div><h3>{event.title || event.subject?.name || 'Un moment à partager'}</h3>{event.body && <p>{event.body}</p>}</div></div><div className="myday-reactions">{event.reactions.map(r => <Button key={r.emoji} variant="secondary" aria-pressed={r.mine} aria-label={`Réagir ${r.emoji} · ${r.count} réaction(s)`} disabled={busy} onClick={() => react(r.emoji)}>{r.emoji}<span>{r.count || ''}</span></Button>)}</div></article>;
}
