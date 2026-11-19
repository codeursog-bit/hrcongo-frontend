'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Eye, EyeOff, Fingerprint, BookOpen, CalendarDays } from 'lucide-react';
import { Badge, Button, Card, Skeleton } from '@/components/design-system/primitives';
import { useToast } from '@/components/design-system/feedback';
import { DashboardPage } from '@/components/templates';
import { useDayOverview } from '@/hooks/useDayOverview';
import { useAnnouncements } from '@/hooks/useAnnouncements';
import { useAnniversaries } from '@/hooks/useAnniversaries';
import { DayCalendar, DayEvents, DayTasks } from './MyDayWidgets';
import { dayKey, elapsedClock } from './day-calendar';
import type { DayContext, PersonalStats } from './day-types';
import './myday.css';

const number = (value?: number | string) => value === undefined || value === null || !Number.isFinite(Number(value)) ? '—' : new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 1 }).format(Number(value));
const dateLabel = (value?: string) => value && Number.isFinite(new Date(value).getTime()) ? new Date(value).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', timeZone: 'Africa/Brazzaville' }) : 'date à confirmer';
const timeLabel = (value?: string) => value && Number.isFinite(new Date(value).getTime()) ? new Date(value).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Brazzaville' }) : '—';

export function MyDaySkeleton() { return <div className="myday" role="status" aria-label="Chargement de ma journée"><span className="k-sr-only">Chargement de votre journée…</span><Skeleton className="myday-title-skeleton" /><div className="myday-loading"><Card><Skeleton className="myday-clock-skeleton" /><Skeleton /></Card><Card><Skeleton /><Skeleton className="myday-clock-skeleton" /><Skeleton /></Card><Card><Skeleton className="myday-clock-skeleton" /></Card></div></div>; }

function DayClock({ start, end }: { start?: string; end?: string }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => { if (!start || end) return; const sync = () => setNow(Date.now()); const timer = setInterval(() => { if (!document.hidden) sync(); }, 1000); document.addEventListener('visibilitychange', sync); return () => { clearInterval(timer); document.removeEventListener('visibilitychange', sync); }; }, [start, end]);
  return <div className="myday-clock" role="timer" aria-live="off" aria-label="Durée écoulée depuis le pointage, hors calcul de paie">{elapsedClock(start, end, now)}</div>;
}

export function MyDay({ userName, stats, context, leaveEligible, error, viewerRole = '' }: { userName: string; stats: PersonalStats; context: DayContext; leaveEligible: boolean; error?: string; viewerRole?: string }) {
  const overview = useDayOverview(); const announcements = useAnnouncements(); const anniversaries = useAnniversaries(); const notify = useToast();
  const [showSalary, setShowSalary] = useState(false);
  const hasEmployee = !!context.employee?.id; const completed = !!stats.checkIn && !!stats.checkOut;
  const location = context.attendance?.isRemote === true ? 'Hors site' : context.attendance?.isRemote === false ? 'Au bureau' : context.attendance?.checkInSiteName || 'Lieu non précisé';
  const nextHoliday = overview.data.holidays.filter(h => h.date >= dayKey()).sort((a, b) => a.date.localeCompare(b.date))[0];
  const departure = stats.leaveEx?.nextDeparture;
  return <div className="myday"><DashboardPage title={`Ma journée${userName ? ` · ${userName}` : ''}`} description={new Date(`${dayKey()}T12:00:00Z`).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'Africa/Brazzaville' })} action={<Link className="myday-text-link" href="/mon-profil">Mon compte<ArrowRight size={15} strokeWidth={1.5} /></Link>}>
    {error && <Card className="myday-full"><div role="alert"><h2>Votre résumé personnel est temporairement indisponible.</h2><p className="k-caption">Vos autres espaces restent accessibles.</p><Button onClick={() => window.location.reload()}>Réessayer</Button></div></Card>}
    <Card className="myday-punch" title="Mon pointage" action={<Fingerprint size={20} strokeWidth={1.5} aria-hidden="true" />}>
      <Badge tone={stats.checkIn ? 'success' : 'neutral'}>{completed ? 'Journée terminée' : stats.checkIn ? 'Journée en cours' : hasEmployee ? 'Non pointé' : 'Fiche non disponible'}</Badge>
      <DayClock start={stats.checkIn} end={stats.checkOut} />
      <p className="myday-muted">{stats.checkIn ? location : 'Votre journée commence par un pointage.'}</p>
      <dl className="myday-punch-times"><div><dt>Arrivée</dt><dd>{timeLabel(stats.checkIn)}</dd></div><div><dt>Départ</dt><dd>{timeLabel(stats.checkOut)}</dd></div></dl>
      <Link className="k-button k-button-primary myday-main-link" href="/presences/pointage">{completed ? 'Voir mon pointage' : stats.checkIn ? 'Gérer mon pointage' : 'Pointer maintenant'}<ArrowRight size={16} strokeWidth={1.5} /></Link><p className="myday-fine">Le pointage GPS/QR reste dans votre pointeuse habituelle.</p>
    </Card>
    <DayTasks /><DayCalendar context={context} holidays={overview.data.holidays} holidaysAvailable={overview.available && !overview.error} />
    <DayEvents />
    <Card className="myday-announcements" title="Les nouvelles de l’entreprise">{!announcements.available ? <p className="k-caption">Les annonces seront bientôt réunies ici.</p> : announcements.loading ? <Skeleton className="myday-event-loading" /> : announcements.error ? <p role="alert" className="k-error">{announcements.error}</p> : announcements.announcements.length ? <ul>{announcements.announcements.map(a => <li key={a.id}><h3>{a.title}</h3><p>{a.body}</p><time dateTime={a.createdAt}>{dateLabel(a.createdAt)}</time></li>)}</ul> : <p className="k-caption">Vous êtes à jour. Les prochaines annonces apparaîtront ici.</p>}</Card>
    <Card className="myday-colleagues" title="Aujourd’hui dans l’équipe">{overview.loading ? <Skeleton /> : overview.error ? <p role="alert" className="k-error">{overview.error}</p> : !overview.available ? <p className="k-caption">Les absents du jour seront bientôt disponibles.</p> : overview.data.absentColleagues.length ? <ul>{overview.data.absentColleagues.map(e => <li key={e.id}><span className="myday-person-mark" aria-hidden="true">{e.name.slice(0, 1)}</span><div><strong>{e.name}</strong><p>{e.label}</p></div></li>)}</ul> : <p className="k-caption">Aucune absence à afficher aujourd’hui.</p>}<div className="myday-holiday-next"><CalendarDays size={18} strokeWidth={1.5} aria-hidden="true" /><div><p>Prochain jour férié</p><strong>{nextHoliday ? `${nextHoliday.label} · ${dateLabel(nextHoliday.date)}` : overview.available ? 'Aucune date communiquée' : 'Bientôt disponible'}</strong></div></div></Card>
    <Card className="myday-personal" title="Mon résumé personnel">
      {!hasEmployee && <p className="k-caption">Votre fiche employé n’est pas disponible. Contactez votre administration pour la rattacher à votre compte.</p>}
      <dl className="myday-stats">{leaveEligible && <><div><dt>Congés en attente</dt><dd>{number(stats.pendingLeaves)}</dd></div><div><dt>Solde de congés</dt><dd>{stats.remainingLeaves ?? '—'} j</dd></div></>}<div><dt>Présence ce mois</dt><dd>{number(stats.presenceRateMonth)} %</dd></div><div><dt>Dernier salaire · {stats.lastSalaryMonth || 'Période à confirmer'}</dt><dd className="myday-salary">{showSalary ? stats.lastSalary || 'Non disponible' : '••••••'}<Button variant="ghost" aria-label={showSalary ? 'Masquer mon salaire' : 'Afficher mon salaire'} aria-pressed={showSalary} onClick={() => setShowSalary(v => !v)}>{showSalary ? <EyeOff size={16} strokeWidth={1.5} /> : <Eye size={16} strokeWidth={1.5} />}</Button></dd></div><div><dt>Prêts et avances déjà remboursés</dt><dd>{number(stats.totalPaid)} FCFA</dd></div><div><dt>Reste à rembourser</dt><dd>{number(stats.totalDebt)} FCFA</dd></div></dl>
      {leaveEligible && stats.leaveEx && <details className="myday-leave-details"><summary>Comprendre mon solde de congés</summary><dl className="myday-stats"><div><dt>Jours de base acquis</dt><dd>{number(stats.leaveEx.base?.acquired)} / {number(stats.leaveEx.base?.max)} j</dd></div><div><dt>Déjà pris</dt><dd>{number(stats.leaveEx.totals?.taken)} j</dd></div><div><dt>Ancienneté</dt><dd>{number(stats.leaveEx.seniority?.days)} j</dd></div></dl>{departure && <p className="k-caption">{departure.kind === 'IN_PROGRESS' ? `Congé en cours jusqu’au ${dateLabel(departure.endDate)}.` : departure.kind === 'PLANNED' ? `Prochain congé ${departure.status === 'APPROVED' ? 'validé' : 'demandé'} : ${dateLabel(departure.startDate)}.` : departure.kind === 'PROBABLE' ? `Départ probable : ${departure.reason === 'AVAILABLE_NOW' ? 'dès maintenant' : dateLabel(departure.startDate)}.` : departure.kind === 'NOT_YET' ? `Premier congé possible dès le ${dateLabel(departure.startDate)}.` : ''}</p>}</details>}
    </Card>
    <Card className="myday-schedule" title="Mes horaires">{!overview.available ? <p className="k-caption">Votre planning sera bientôt disponible dans cet espace.</p> : overview.error ? <p className="k-error">{overview.error}</p> : overview.loading ? <Skeleton /> : overview.data.schedule.length ? <dl className="myday-stats">{overview.data.schedule.map(s => <div key={`${s.label}-${s.start}`}><dt>{s.label}</dt><dd>{s.start} – {s.end}</dd></div>)}</dl> : <p className="k-caption">Aucun horaire communiqué pour aujourd’hui.</p>}</Card>
    {anniversaries.available && (anniversaries.loading || anniversaries.error || anniversaries.notifications.length > 0) && <Card className="myday-anniversary" title="Un message pour vous">{anniversaries.loading ? <Skeleton /> : anniversaries.error ? <p role="alert" className="k-error">{anniversaries.error}</p> : anniversaries.notifications.map(n => <article key={n.id}><p>{n.message}</p>{['ADMIN', 'HR_MANAGER'].includes(viewerRole) && n.subjectId !== context.employee?.id && <Link className="myday-text-link" href="/messages">Lui écrire<ArrowRight size={14} strokeWidth={1.5} /></Link>}<Button variant="ghost" disabled={n.read} onClick={async () => { try { await anniversaries.markRead(n.id); notify('success', 'Message marqué comme lu'); } catch { notify('error', 'Le message n’a pas pu être marqué comme lu.'); } }}>{n.read ? 'Lu' : 'Marquer comme lu'}</Button></article>)}</Card>}
    <Card className="myday-resources" title="Mes accès utiles" action={<BookOpen size={18} strokeWidth={1.5} aria-hidden="true" />}><div className="myday-resource-links">{[...(leaveEligible ? [['Demander un congé', '/conges/nouveau'], ['Mon solde de congés', '/conges/mon-espace']] : []), ['Demander une absence', '/presences/absences/nouveau'], ['Mes bulletins', '/ma-paie'], ['Mes formations', '/formation'], ['Mon compte', '/mon-profil']].map(([text, href]) => <Link href={href} key={href}>{text}<ArrowRight size={14} strokeWidth={1.5} /></Link>)}</div></Card>
  </DashboardPage></div>;
}
