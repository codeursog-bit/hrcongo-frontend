'use client';

// ============================================================================
// 📁 app/(dashboard)/recrutement/tableau-de-bord/page.tsx
// TABLEAU DE BORD RECRUTEUR — « qu'est-ce que je dois faire aujourd'hui ? »
//   • À faire : entretiens du jour, évaluations en retard, offres sans réponse,
//     candidats bloqués, nouvelles candidatures sans réponse, prêts à embaucher…
//   • Pilotage : entonnoir, délai d'embauche, sources, motifs de refus
// ============================================================================

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CheckCircle2, Briefcase, Users, CalendarClock, Timer, UserCheck, Percent } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Badge, Button, Card } from '@/components/design-system/primitives';
import { RecruitmentFrame as ModulePageFrame } from '@/components/recruitment/RecruitmentFrame';
import { KonzaLoader } from '@/components/ui/KonzaLoader';
import { api } from '@/services/api';
import {
  KIND_LABEL, RecruitmentHeader, RecruitmentNav, STATUS_LABEL, errMsg, fmtDateLong, fmtTime, reasonLabel,
} from '@/components/recruitment/recruitment-ui';

interface Itv { id: string; scheduledAt: string; durationMin: number; kind: string; mode: string; candidateId: string; name: string; jobTitle: string }
interface Person { id: string; name: string; jobTitle: string; days?: number; status?: string }
interface Dashboard {
  kpis: { openJobs: number; activeCandidates: number; interviewsThisWeek: number; avgTimeToHireDays: number | null; hiredLast180: number; offerAcceptanceRate: number | null };
  funnel: Array<{ stage: string; count: number }>;
  bySource: Array<{ source: string; candidates: number; hired: number }>;
  rejectionReasons: Array<{ code: string; count: number }>;
  todo: {
    interviewsToday: Itv[]; interviewsWeek: Itv[]; feedbackPending: Itv[]; stalled: Person[];
    offersAwaiting: Person[]; readyToHire: Person[]; unansweredNew: Person[];
    jobsAttention: Array<{ id: string; title: string; reason: string }>;
  };
  pendingRequisitions: number;
}

function Stat({ icon: Icon, label, value, hint }: { icon: LucideIcon; label: string; value: string; hint?: string }) {
  return (
    <Card className="recruitment-stat"><Icon className="recruitment-stat-icon" size={18} strokeWidth={1.5} aria-hidden="true" /><p className="recruitment-stat-label">{label}</p><p className="recruitment-stat-value">{value}</p>{hint && <p className="recruitment-stat-hint">{hint}</p>}</Card>
  );
}

function TodoCard({ title, count, tone = 'warning', children }: { title: string; count: number; tone?: 'warning' | 'danger' | 'info' | 'success'; children: React.ReactNode }) {
  return (
    <Card>
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-[var(--text)]">{title}</h3>
        <Badge tone={tone}>{count}</Badge>
      </div>
      <ul className="space-y-2">{children}</ul>
    </Card>
  );
}

function Row({ href, primary, secondary, right }: { href: string; primary: string; secondary?: string; right?: React.ReactNode }) {
  return (
    <li>
      <Link href={href} className="flex items-center justify-between gap-3 rounded-xl px-2 py-2 hover:bg-[var(--surface-2)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--focus)]">
        <span className="min-w-0">
          <span className="block truncate text-sm font-medium text-[var(--text)]">{primary}</span>
          {secondary && <span className="block truncate text-xs text-[var(--text-secondary)]">{secondary}</span>}
        </span>
        {right && <span className="shrink-0 text-xs text-[var(--text-secondary)]">{right}</span>}
      </Link>
    </li>
  );
}

const fiche = (id: string, tab?: string) => `/recrutement/candidat/${id}${tab ? `?tab=${tab}` : ''}`;
const sinceLabel = (d?: number) => (d === undefined ? '' : d === 0 ? 'aujourd’hui' : `${d} j`);

export default function RecruitmentDashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<Dashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try { setData(await api.get<Dashboard>('/recruitment/dashboard')); setError(''); }
    catch (e) { setError(errMsg(e)); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);

  if (loading) return <ModulePageFrame kind="dashboard"><KonzaLoader variant="section" /></ModulePageFrame>;
  if (!data) {
    return (
      <ModulePageFrame kind="dashboard" error={error || 'Impossible de charger le tableau de bord'}>
        <div className="mx-auto max-w-[1400px] space-y-6"><RecruitmentNav /></div>
      </ModulePageFrame>
    );
  }

  const { kpis, todo, funnel } = data;
  const cards: React.ReactNode[] = [];

  if (data.pendingRequisitions > 0) cards.push(
    <TodoCard key="req" title="Demandes de recrutement à valider" count={data.pendingRequisitions} tone="warning">
      <li><Link href="/recrutement/demandes" className="text-sm text-[var(--brand-strong)] underline">Voir les {data.pendingRequisitions} demande(s) en attente</Link></li>
    </TodoCard>);
  if (todo.interviewsToday.length) cards.push(
    <TodoCard key="today" title="Entretiens aujourd’hui" count={todo.interviewsToday.length} tone="info">
      {todo.interviewsToday.map((i) => <Row key={i.id} href={fiche(i.candidateId, 'interviews')} primary={`${fmtTime(i.scheduledAt)} — ${i.name}`} secondary={`${KIND_LABEL[i.kind] ?? 'Entretien'} · ${i.jobTitle}`} />)}
    </TodoCard>);
  if (todo.feedbackPending.length) cards.push(
    <TodoCard key="fb" title="Évaluations à saisir" count={todo.feedbackPending.length} tone="danger">
      {todo.feedbackPending.slice(0, 6).map((i) => <Row key={i.id} href={fiche(i.candidateId, 'interviews')} primary={i.name} secondary={`${KIND_LABEL[i.kind] ?? 'Entretien'} du ${fmtDateLong(i.scheduledAt)}`} />)}
    </TodoCard>);
  if (todo.readyToHire.length) cards.push(
    <TodoCard key="hire" title="Offre acceptée — à embaucher" count={todo.readyToHire.length} tone="success">
      {todo.readyToHire.map((p) => <Row key={p.id} href={fiche(p.id, 'offer')} primary={p.name} secondary={p.jobTitle} />)}
    </TodoCard>);
  if (todo.offersAwaiting.length) cards.push(
    <TodoCard key="offers" title="Offres sans réponse" count={todo.offersAwaiting.length} tone="warning">
      {todo.offersAwaiting.slice(0, 6).map((p) => <Row key={p.id} href={fiche(p.id, 'offer')} primary={p.name} secondary={p.jobTitle} right={`envoyée il y a ${p.days} j`} />)}
    </TodoCard>);
  if (todo.unansweredNew.length) cards.push(
    <TodoCard key="new" title="Candidatures sans réponse (3 j et +)" count={todo.unansweredNew.length} tone="warning">
      {todo.unansweredNew.slice(0, 6).map((p) => <Row key={p.id} href={fiche(p.id)} primary={p.name} secondary={p.jobTitle} right={`reçue il y a ${p.days} j`} />)}
    </TodoCard>);
  if (todo.stalled.length) cards.push(
    <TodoCard key="stalled" title="Dossiers à relancer (5 j et +)" count={todo.stalled.length} tone="warning">
      {todo.stalled.slice(0, 6).map((p) => <Row key={p.id} href={fiche(p.id)} primary={p.name} secondary={`${STATUS_LABEL[p.status ?? ''] ?? ''} · ${p.jobTitle}`} right={sinceLabel(p.days)} />)}
    </TodoCard>);
  if (todo.jobsAttention.length) cards.push(
    <TodoCard key="jobs" title="Offres à surveiller" count={todo.jobsAttention.length} tone="info">
      {todo.jobsAttention.map((j, idx) => <Row key={`${j.id}-${idx}`} href={`/recrutement/pipeline?job=${j.id}`} primary={j.title} secondary={j.reason} />)}
    </TodoCard>);

  const maxFunnel = Math.max(1, ...funnel.map((f) => f.count));
  const maxSource = Math.max(1, ...data.bySource.map((s) => s.candidates));
  const maxReason = Math.max(1, ...data.rejectionReasons.map((r) => r.count));

  return (
    <ModulePageFrame kind="dashboard" error={error || undefined}>
      <div className="mx-auto max-w-[1400px] space-y-8 pb-20">
        <RecruitmentHeader
          title="Tableau de bord"
          subtitle="Ce qui demande votre attention, et où en est votre recrutement."
          actions={<Button onClick={() => router.push('/recrutement/pipeline')}>Ouvrir le pipeline</Button>}
        />
        <RecruitmentNav />

        <section aria-label="Indicateurs" className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
          <Stat icon={Briefcase} label="Offres ouvertes" value={String(kpis.openJobs)} />
          <Stat icon={Users} label="Candidats en cours" value={String(kpis.activeCandidates)} />
          <Stat icon={CalendarClock} label="Entretiens (7 jours)" value={String(kpis.interviewsThisWeek)} />
          <Stat icon={Timer} label="Délai moyen d’embauche" value={kpis.avgTimeToHireDays === null ? '—' : `${kpis.avgTimeToHireDays} j`} hint={kpis.avgTimeToHireDays === null ? 'Disponible après la 1re embauche' : undefined} />
          <Stat icon={UserCheck} label="Embauches (6 mois)" value={String(kpis.hiredLast180)} />
          <Stat icon={Percent} label="Offres acceptées" value={kpis.offerAcceptanceRate === null ? '—' : `${kpis.offerAcceptanceRate}%`} />
        </section>

        <div className="recruitment-attention-layout"><section aria-label="À faire">
          <h2 className="mb-4 text-lg font-semibold text-[var(--text)]">À faire maintenant</h2>
          {cards.length === 0 ? (
            <Card>
              <p className="flex items-center gap-2 text-sm text-[var(--text)]"><CheckCircle2 size={18} strokeWidth={1.5} className="text-[var(--success-text)]" /> Rien d’urgent : tous vos dossiers sont à jour.</p>
            </Card>
          ) : <div className="recruitment-todos">{cards}</div>}
        </section>

        {todo.interviewsWeek.length > 0 && (
          <section aria-label="Entretiens de la semaine">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-[var(--text)]">Entretiens des 7 prochains jours</h2>
              <Link href="/recrutement/entretiens" className="text-sm text-[var(--brand-strong)] underline">Voir tout l’agenda</Link>
            </div>
            <Card>
              <ul className="divide-y divide-[var(--border)]">
                {todo.interviewsWeek.map((i) => (
                  <li key={i.id}>
                    <Link href={fiche(i.candidateId, 'interviews')} className="flex flex-wrap items-center justify-between gap-2 py-3 hover:opacity-80">
                      <span className="text-sm text-[var(--text)]"><strong>{fmtDateLong(i.scheduledAt)}</strong> à {fmtTime(i.scheduledAt)} — {i.name}</span>
                      <span className="text-xs text-[var(--text-secondary)]">{KIND_LABEL[i.kind] ?? 'Entretien'} · {i.jobTitle}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </Card>
          </section>
        )}

        </div><section aria-label="Pilotage" className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <Card title="Entonnoir (6 derniers mois)">
            <div className="space-y-4">
              {funnel.map((f, idx) => {
                const prev = idx > 0 ? funnel[idx - 1].count : null;
                const pct = prev ? Math.round((f.count / prev) * 100) : null;
                return (
                  <div key={f.stage}>
                    <div className="mb-1 flex justify-between text-sm"><span className="text-[var(--text)]">{f.stage}</span><span className="tabular-nums text-[var(--text-secondary)]">{f.count}{pct !== null ? ` · ${pct}%` : ''}</span></div>
                    <div className="h-2 overflow-hidden rounded-full bg-[var(--surface-2)]"><div className="h-full rounded-full bg-[var(--brand)]" style={{ width: `${(f.count / maxFunnel) * 100}%` }} /></div>
                  </div>
                );
              })}
              <p className="text-xs text-[var(--text-secondary)]">Le pourcentage compare chaque étape à la précédente.</p>
            </div>
          </Card>

          <Card title="D’où viennent vos candidats">
            {data.bySource.length === 0 ? <p className="text-sm text-[var(--text-secondary)]">Pas encore de données.</p> : (
              <div className="space-y-3">
                {data.bySource.slice(0, 8).map((s) => (
                  <div key={s.source}>
                    <div className="mb-1 flex justify-between text-sm"><span className="truncate text-[var(--text)]">{s.source}</span><span className="tabular-nums text-[var(--text-secondary)]">{s.candidates} · {s.hired} embauché{s.hired > 1 ? 's' : ''}</span></div>
                    <div className="h-2 overflow-hidden rounded-full bg-[var(--surface-2)]"><div className="h-full rounded-full bg-[var(--green,#2f9e6a)]" style={{ width: `${(s.candidates / maxSource) * 100}%` }} /></div>
                  </div>
                ))}
                {data.bySource.some((s) => s.source === 'Non renseignée') && <p className="text-xs text-[var(--text-secondary)]">Renseignez la source dans la fiche du candidat pour affiner ces chiffres.</p>}
              </div>
            )}
          </Card>

          <Card title="Pourquoi les candidats sont refusés">
            {data.rejectionReasons.length === 0 ? <p className="text-sm text-[var(--text-secondary)]">Aucun refus avec motif pour l’instant.</p> : (
              <div className="space-y-3">
                {data.rejectionReasons.slice(0, 8).map((r) => (
                  <div key={r.code}>
                    <div className="mb-1 flex justify-between text-sm"><span className="truncate text-[var(--text)]">{reasonLabel(r.code)}</span><span className="tabular-nums text-[var(--text-secondary)]">{r.count}</span></div>
                    <div className="h-2 overflow-hidden rounded-full bg-[var(--surface-2)]"><div className="h-full rounded-full bg-[color-mix(in_srgb,var(--danger)_10%,var(--surface))]" style={{ width: `${(r.count / maxReason) * 100}%` }} /></div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </section>
      </div>
    </ModulePageFrame>
  );
}
