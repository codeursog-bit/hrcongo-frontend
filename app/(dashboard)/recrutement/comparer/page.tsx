'use client';

// ============================================================================
// 📁 app/(dashboard)/recrutement/comparer/page.tsx
// COMPARER 2 À 4 CANDIDATS côte à côte — pour la réunion de décision.
//   Scores (CV, test, entretiens), recommandations des intervieweurs, offre,
//   ancienneté. Le meilleur score de chaque ligne est mis en valeur. Imprimable.
// Ouverte depuis le pipeline : /recrutement/comparer?ids=id1,id2,id3
// ============================================================================

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Printer, Star } from 'lucide-react';
import { Badge, Button, Card, EmptyState } from '@/components/design-system/primitives';
import { RecruitmentFrame as ModulePageFrame } from '@/components/recruitment/RecruitmentFrame';
import { KonzaLoader } from '@/components/ui/KonzaLoader';
import { api } from '@/services/api';
import {
  Avatar, Interview, RECO_LABEL, RECO_TONE, RecruitmentHeader, Stars, StatusBadge, errMsg, fmtDate, fmtMoney,
} from '@/components/recruitment/recruitment-ui';

interface FicheLite {
  candidate: {
    id: string; firstName: string; lastName: string; status: string; source: string | null; rating: number | null;
    cvScore: number | null; testScore: number | null; totalScore: number | null; offerSalary: number | string | null;
    createdAt: string; email: string;
  };
  job: { title: string; salaryCurrency: string | null };
  daysInStage: number;
  interviews: Interview[];
}

const num = (v: number | null | undefined) => (v && v > 0 ? Math.round(v) : null);

export default function ComparePage() {
  const router = useRouter();
  const [fiches, setFiches] = useState<FicheLite[] | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const ids = (new URLSearchParams(window.location.search).get('ids') ?? '').split(',').filter(Boolean).slice(0, 4);
    if (ids.length < 2) { setFiches([]); return; }
    Promise.all(ids.map((id) => api.get<FicheLite>(`/recruitment/candidates/${id}/fiche`)))
      .then(setFiches)
      .catch((e) => { setError(errMsg(e)); setFiches([]); });
  }, []);

  if (fiches === null) return <ModulePageFrame kind="detail"><KonzaLoader variant="section" /></ModulePageFrame>;
  if (fiches.length < 2) {
    return (
      <ModulePageFrame kind="detail" error={error || undefined}>
        <EmptyState title="Sélectionnez 2 à 4 candidats" action={<Button onClick={() => router.push('/recrutement/pipeline')}>Retour au pipeline</Button>}>
          Cochez les candidats à comparer dans le pipeline, puis cliquez sur « Comparer ».
        </EmptyState>
      </ModulePageFrame>
    );
  }

  const evaluated = (f: FicheLite) => f.interviews.filter((i) => i.status === 'DONE' && i.overallScore !== null);
  const interviewAvg = (f: FicheLite) => {
    const e = evaluated(f);
    return e.length ? Math.round(e.reduce((s, i) => s + (i.overallScore ?? 0), 0) / e.length) : null;
  };

  // Lignes numériques : on met en valeur la meilleure valeur
  const numericRows: Array<{ label: string; get: (f: FicheLite) => number | null; suffix?: string }> = [
    { label: 'Score global', get: (f) => num(f.candidate.totalScore), suffix: '/100' },
    { label: 'Analyse du CV', get: (f) => num(f.candidate.cvScore), suffix: '/100' },
    { label: 'Test en ligne', get: (f) => num(f.candidate.testScore), suffix: '/100' },
    { label: 'Entretiens (moyenne)', get: interviewAvg, suffix: '/100' },
    { label: 'Appréciation', get: (f) => f.candidate.rating, suffix: '/5' },
  ];

  const cell = 'px-4 py-3 align-top text-sm text-[var(--text)]';
  const head = 'px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-[var(--text-secondary)] whitespace-nowrap';

  return (
    <ModulePageFrame kind="detail" error={error || undefined}>
      <div className="mx-auto max-w-[1400px] space-y-6 pb-20">
        <div className="print:hidden">
          <Link href="/recrutement/pipeline" className="mb-4 inline-flex items-center gap-1.5 text-sm text-[var(--text-secondary)] hover:text-[var(--text)]">
            <ArrowLeft size={15} strokeWidth={1.5} /> Retour au pipeline
          </Link>
        </div>
        <RecruitmentHeader
          title="Comparaison de candidats"
          subtitle={`${fiches.length} candidats côte à côte — le meilleur résultat de chaque ligne est en vert.`}
          actions={<span className="print:hidden"><Button variant="secondary" onClick={() => window.print()}><Printer size={16} strokeWidth={1.5} /> Imprimer</Button></span>}
        />

        <Card className="!p-0">
          <div className="recruitment-table-scroll recruitment-comparison" role="region" tabIndex={0} aria-label="Comparaison — défilement horizontal">
            <table className="w-full min-w-[640px] border-collapse">
              <thead>
                <tr className="border-b border-[var(--border)]">
                  <th className={head} scope="col"><span className="sr-only">Critère</span></th>
                  {fiches.map((f) => (
                    <th key={f.candidate.id} scope="col" className="px-4 py-4 text-left align-top">
                      <Link href={`/recrutement/candidat/${f.candidate.id}`} className="flex items-center gap-3 hover:opacity-80">
                        <Avatar first={f.candidate.firstName} last={f.candidate.lastName} size={40} />
                        <span>
                          <span className="block text-sm font-semibold text-[var(--text)]">{f.candidate.firstName} {f.candidate.lastName}</span>
                          <span className="block text-xs font-normal text-[var(--text-secondary)]">{f.job.title}</span>
                        </span>
                      </Link>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                <tr>
                  <th scope="row" className={head}>Étape</th>
                  {fiches.map((f) => <td key={f.candidate.id} className={cell}><StatusBadge status={f.candidate.status} /></td>)}
                </tr>

                {numericRows.map((row) => {
                  const values = fiches.map((f) => row.get(f));
                  const best = Math.max(...values.map((v) => v ?? -1));
                  return (
                    <tr key={row.label}>
                      <th scope="row" className={head}>{row.label}</th>
                      {fiches.map((f, idx) => {
                        const v = values[idx];
                        const isBest = v !== null && v === best && values.filter((x) => x === best).length < fiches.length;
                        return (
                          <td key={f.candidate.id} className={cell}>
                            {v === null ? <span className="text-[var(--text-secondary)]">—</span>
                              : row.label === 'Appréciation' ? <Stars value={v} size={15} />
                              : <span className={`tabular-nums ${isBest ? 'font-semibold text-[var(--success-text)]' : ''}`}>{v}{row.suffix}{isBest ? <Star size={12} strokeWidth={1.5} className="inline ml-1" aria-label="Meilleure valeur" /> : null}</span>}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}

                <tr>
                  <th scope="row" className={head}>Recommandations</th>
                  {fiches.map((f) => (
                    <td key={f.candidate.id} className={cell}>
                      {evaluated(f).length === 0 ? <span className="text-[var(--text-secondary)]">Aucun entretien évalué</span> : (
                        <div className="flex flex-wrap gap-1.5">
                          {evaluated(f).map((i) => i.recommendation && <Badge key={i.id} tone={RECO_TONE[i.recommendation] ?? 'neutral'}>{RECO_LABEL[i.recommendation]}</Badge>)}
                        </div>
                      )}
                    </td>
                  ))}
                </tr>
                <tr>
                  <th scope="row" className={head}>Entretiens</th>
                  {fiches.map((f) => <td key={f.candidate.id} className={cell}>{f.interviews.filter((i) => i.status !== 'CANCELLED').length} ({evaluated(f).length} évalué{evaluated(f).length > 1 ? 's' : ''})</td>)}
                </tr>
                <tr>
                  <th scope="row" className={head}>Offre proposée</th>
                  {fiches.map((f) => <td key={f.candidate.id} className={cell}>{f.candidate.offerSalary ? fmtMoney(f.candidate.offerSalary, f.job.salaryCurrency ?? 'XAF') : <span className="text-[var(--text-secondary)]">Aucune</span>}</td>)}
                </tr>
                <tr>
                  <th scope="row" className={head}>Source</th>
                  {fiches.map((f) => <td key={f.candidate.id} className={cell}>{f.candidate.source ?? <span className="text-[var(--text-secondary)]">Non renseignée</span>}</td>)}
                </tr>
                <tr>
                  <th scope="row" className={head}>Candidature</th>
                  {fiches.map((f) => <td key={f.candidate.id} className={cell}>{fmtDate(f.candidate.createdAt)}<span className="block text-xs text-[var(--text-secondary)]">dans l’étape depuis {f.daysInStage} j</span></td>)}
                </tr>
                <tr>
                  <th scope="row" className={head}>Synthèses d’entretien</th>
                  {fiches.map((f) => (
                    <td key={f.candidate.id} className={cell}>
                      {evaluated(f).filter((i) => i.summary).length === 0 ? <span className="text-[var(--text-secondary)]">—</span> : (
                        <ul className="space-y-2">{evaluated(f).filter((i) => i.summary).map((i) => <li key={i.id} className="whitespace-pre-line text-xs text-[var(--text-secondary)]">{i.summary}</li>)}</ul>
                      )}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </ModulePageFrame>
  );
}