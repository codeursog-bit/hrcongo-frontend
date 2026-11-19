'use client';

// ============================================================================
// 📁 app/(dashboard)/recrutement/entretiens/page.tsx
// AGENDA DES ENTRETIENS — tous les entretiens de l'entreprise, jour par jour.
//   • « À évaluer » en tête : entretiens passés sans grille d'évaluation
//   • Évaluer, reporter, ouvrir la fiche : sans quitter l'agenda
// (remplace l'ancienne page qui ne gérait qu'une seule date par candidat)
// ============================================================================

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { CalendarClock, MapPin, Users } from 'lucide-react';
import { Badge, Button, Card, EmptyState } from '@/components/design-system/primitives';
import { RecruitmentFrame as ModulePageFrame } from '@/components/recruitment/RecruitmentFrame';
import { KonzaLoader } from '@/components/ui/KonzaLoader';
import { api } from '@/services/api';
import {
  Interview, KIND_LABEL, MODE_LABEL, RECO_LABEL, RECO_TONE, RecruitmentHeader, RecruitmentNav,
  errMsg, fmtDateLong, fmtTime,
} from '@/components/recruitment/recruitment-ui';
import { FeedbackModal, InterviewModal } from '@/components/recruitment/RecruitmentModals';

type AgendaItem = Interview & {
  candidate: { id: string; firstName: string; lastName: string; email: string; phone: string | null; jobOffer: { title: string } };
};
interface Agenda { interviews: AgendaItem[]; pendingFeedback: AgendaItem[] }

const RANGES = [
  { id: 7, label: '7 jours' }, { id: 14, label: '14 jours' }, { id: 30, label: '30 jours' },
] as const;

const dayKey = (iso: string) => new Date(iso).toLocaleDateString('fr-CA', { timeZone: 'Africa/Brazzaville' }); // AAAA-MM-JJ

export default function InterviewsAgendaPage() {
  const [data, setData] = useState<Agenda | null>(null);
  const [error, setError] = useState('');
  const [range, setRange] = useState<7 | 14 | 30>(14);
  const [feedback, setFeedback] = useState<AgendaItem | null>(null);
  const [reschedule, setReschedule] = useState<AgendaItem | null>(null);

  const load = useCallback(async () => {
    try {
      const from = new Date(); from.setHours(0, 0, 0, 0);
      const to = new Date(from.getTime() + range * 86_400_000);
      setData(await api.get<Agenda>(`/recruitment/interviews/agenda?from=${from.toISOString()}&to=${to.toISOString()}`));
      setError('');
    } catch (e) {
      setError(errMsg(e));
      setData({ interviews: [], pendingFeedback: [] });
    }
  }, [range]);
  useEffect(() => { void load(); }, [load]);

  const groups = useMemo(() => {
    const map = new Map<string, AgendaItem[]>();
    for (const i of data?.interviews ?? []) {
      const k = dayKey(i.scheduledAt);
      map.set(k, [...(map.get(k) ?? []), i]);
    }
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [data]);

  const done = () => { setFeedback(null); setReschedule(null); void load(); };

  const Row = ({ i, late = false }: { i: AgendaItem; late?: boolean }) => (
    <li className="recruitment-agenda-row">
      <div className="flex min-w-0 gap-4">
        <div className="w-16 shrink-0 text-center">
          <p className="text-lg font-semibold tabular-nums text-[var(--text)]">{fmtTime(i.scheduledAt)}</p>
          <p className="text-xs text-[var(--text-secondary)]">{i.durationMin} min</p>
        </div>
        <div className="min-w-0">
          <Link href={`/recrutement/candidat/${i.candidate.id}?tab=interviews`} className="block truncate font-medium text-[var(--text)] hover:underline">
            {i.candidate.firstName} {i.candidate.lastName}
          </Link>
          <p className="truncate text-sm text-[var(--text-secondary)]">{KIND_LABEL[i.kind] ?? 'Entretien'} · {i.candidate.jobOffer.title}</p>
          <p className="mt-1 flex flex-wrap items-center gap-x-3 text-xs text-[var(--text-secondary)]">
            <span>{MODE_LABEL[i.mode] ?? i.mode}</span>
            {i.location && <span className="inline-flex items-center gap-1"><MapPin size={12} strokeWidth={1.5} />{i.location}</span>}
            {i.interviewers && <span className="inline-flex items-center gap-1"><Users size={12} strokeWidth={1.5} />{i.interviewers}</span>}
          </p>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {i.status === 'DONE' ? (
          <>
            <Badge tone="success">Évalué{i.overallScore !== null ? ` · ${i.overallScore}/100` : ''}</Badge>
            {i.recommendation && <Badge tone={RECO_TONE[i.recommendation] ?? 'neutral'}>{RECO_LABEL[i.recommendation]}</Badge>}
          </>
        ) : (
          <>
            <Button variant={late ? 'primary' : 'secondary'} onClick={() => setFeedback(i)}>Évaluer</Button>
            <Button variant="ghost" onClick={() => setReschedule(i)}>Reporter</Button>
          </>
        )}
      </div>
    </li>
  );

  return (
    <ModulePageFrame kind="list" error={error || undefined}>
      <div className="mx-auto max-w-[1100px] space-y-6 pb-20">
        <RecruitmentHeader title="Entretiens" subtitle="Votre agenda de recrutement, jour par jour."
          actions={
            <div className="flex gap-2" role="tablist" aria-label="Période">
              {RANGES.map((r) => (
                <button key={r.id} role="tab" aria-selected={range === r.id} onClick={() => setRange(r.id)}
                  className={`min-h-10 rounded-xl border px-4 text-sm font-medium transition-colors ${range === r.id ? 'border-[var(--brand)] bg-[var(--brand)] text-[var(--on-brand)]' : 'border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text)]'}`}>
                  {r.label}
                </button>
              ))}
            </div>
          }
        />
        <RecruitmentNav />

        {data === null ? <KonzaLoader variant="section" /> : (
          <>
            {data.pendingFeedback.length > 0 && (
              <Card title={`À évaluer (${data.pendingFeedback.length})`}>
                <p className="mb-2 text-sm text-[var(--text-secondary)]">Ces entretiens ont eu lieu : notez le candidat pendant que vos impressions sont fraîches.</p>
                <ul className="divide-y divide-[var(--border)]">
                  {data.pendingFeedback.map((i) => (
                    <div key={i.id}>
                      <p className="pt-3 text-xs font-medium uppercase tracking-wide text-[var(--text-secondary)]">{fmtDateLong(i.scheduledAt)}</p>
                      <Row i={i} late />
                    </div>
                  ))}
                </ul>
              </Card>
            )}

            {groups.length === 0 ? (
              <EmptyState title="Aucun entretien prévu" icon={CalendarClock}
                action={<Link href="/recrutement/pipeline" className="k-button k-button-primary">Ouvrir le pipeline</Link>}>
                Planifiez un entretien depuis le pipeline ou la fiche d’un candidat : il apparaîtra ici.
              </EmptyState>
            ) : groups.map(([day, items]) => (
              <Card className="recruitment-agenda-group" key={day} title={fmtDateLong(items[0].scheduledAt)}>
                <ul className="divide-y divide-[var(--border)]">{items.map((i) => <Row key={i.id} i={i} />)}</ul>
              </Card>
            ))}
          </>
        )}
      </div>

      {feedback && <FeedbackModal interview={feedback} candidateName={`${feedback.candidate.firstName} ${feedback.candidate.lastName}`} onClose={() => setFeedback(null)} onDone={done} />}
      {reschedule && <InterviewModal candidate={reschedule.candidate} interview={reschedule} onClose={() => setReschedule(null)} onDone={done} />}
    </ModulePageFrame>
  );
}
