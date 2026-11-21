'use client';

// ============================================================================
// 📁 app/jobs/ia/[id]/page.tsx — Candidature (recrutement assisté par IA)
// Page liée à l'entreprise : on affiche SON logo, pas celui de Konza.
// Logique inchangée : analyse du CV à l'envoi, puis redirection vers le test
// technique si le candidat est retenu.
// ============================================================================

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Briefcase, CheckCircle2, MapPin, XCircle } from 'lucide-react';
import {
  ACCENT, ApplyForm, CompanyTopBar, Dialog, JobPageShell, NotFoundJob, PageSpinner,
  PoweredBy, Section, Tag, useJobOffer,
} from '@/components/jobs/job-kit';

interface ApplicationResult {
  isEligible: boolean;
  message: string;
  cvScore?: number;
  reasoning?: string;
  strengths?: string[];
  shouldTakeTest: boolean;
  candidateId?: string;
  testToken?: string;
}

const CV_MAX = 35;

export default function JobApplyIAPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { job, isLoading } = useJobOffer(params.id);
  const [result, setResult] = useState<ApplicationResult | null>(null);
  const [countdown, setCountdown] = useState(3);
  const [barPct, setBarPct] = useState(0);

  // Redirection automatique vers le test
  useEffect(() => {
    if (!result?.shouldTakeTest) return;
    if (countdown > 0) {
      const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
      return () => clearTimeout(t);
    }
    if (result.candidateId) router.push(`/jobs/ia/${params.id}/test/${result.candidateId}`);
  }, [result, countdown, router, params.id]);

  // Barre de score : part de 0 pour que la transition soit visible
  useEffect(() => {
    if (result?.cvScore === undefined) return;
    const t = setTimeout(() => setBarPct((result.cvScore! / CV_MAX) * 100), 150);
    return () => clearTimeout(t);
  }, [result]);

  function handleDone(res: ApplicationResult) {
    if (res.candidateId && res.testToken) sessionStorage.setItem(`recruitment-test:${res.candidateId}`, res.testToken);
    setResult(res);
  }

  if (isLoading) return <PageSpinner />;
  if (!job) return <NotFoundJob message="Ce poste a peut-être été pourvu ou n’existe plus." />;

  const testHref = result?.candidateId ? `/jobs/ia/${params.id}/test/${result.candidateId}` : null;
  const okColor = result?.isEligible ? ACCENT : '#f87171';

  return (
    <JobPageShell>
      <CompanyTopBar
        company={job.company}
        backHref={`/jobs/${job.id}`}
        right={<span className="hidden rounded-full border border-white/15 px-3 py-1 text-[12px] text-[#d6d6d6] sm:inline">Sélection assistée par IA</span>}
      />

      {/* Résultat de l'analyse du CV */}
      {result && (
        <Dialog>
          <div className="text-center">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full border" style={{ borderColor: `${okColor}55`, background: `${okColor}14` }}>
              {result.isEligible ? <CheckCircle2 size={28} style={{ color: okColor }} /> : <XCircle size={28} style={{ color: okColor }} />}
            </div>
            <h2 className="mb-3 text-[26px] font-semibold">{result.isEligible ? 'CV validé' : 'Profil non retenu'}</h2>
            <p className="mb-6 text-[15px] leading-relaxed text-[#9a9a9a]">{result.message}</p>
          </div>

          {result.cvScore !== undefined && (
            <div className="mb-5 rounded-xl border border-white/[0.08] bg-[#050607] p-5">
              <div className="mb-3 flex items-baseline justify-between">
                <span className="text-[12px] font-semibold uppercase tracking-[0.1em] text-[#6f6f6f]">Score du CV</span>
                <span className="text-[24px] font-bold" style={{ color: okColor }}>{result.cvScore}/{CV_MAX}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-white/10">
                <div className="h-full rounded-full transition-[width] duration-1000 ease-out" style={{ width: `${barPct}%`, background: okColor }} />
              </div>
              {result.reasoning && <p className="mt-4 text-[12.5px] leading-relaxed text-[#9a9a9a]">{result.reasoning}</p>}
            </div>
          )}

          {result.strengths && result.strengths.length > 0 && (
            <div className="mb-5 rounded-xl border border-white/[0.08] p-5">
              <h4 className="mb-3 text-[12px] font-semibold uppercase tracking-[0.1em]" style={{ color: ACCENT }}>Points forts repérés</h4>
              <ul className="space-y-2">
                {result.strengths.map((s, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-[13.5px] text-[#d6d6d6]">
                    <CheckCircle2 size={15} className="mt-0.5 shrink-0" style={{ color: ACCENT }} /> {s}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {result.shouldTakeTest && testHref ? (
            <>
              <div className="mb-5 rounded-xl border p-5 text-center" style={{ borderColor: `${ACCENT}44`, background: `${ACCENT}0d` }}>
                <p className="text-[15px] font-semibold">Prochaine étape : le test technique</p>
                <p className="mt-1 text-[13px] text-[#9a9a9a]">Redirection automatique dans {countdown} s</p>
              </div>
              <Link href={testHref} className="block w-full rounded-xl bg-[#FAFAFA] py-3.5 text-center text-[14.5px] font-semibold text-black transition-colors hover:bg-white">
                Commencer le test maintenant
              </Link>
            </>
          ) : (
            <Link href="/jobs/portal" className="block w-full rounded-xl border border-white/10 py-3.5 text-center text-[14.5px] font-semibold transition-colors hover:border-white/25 hover:bg-white/[0.04]">
              Voir d’autres offres
            </Link>
          )}
        </Dialog>
      )}

      <main className="mx-auto max-w-6xl px-6 pb-24 pt-12">
        <div className="grid gap-12 lg:grid-cols-[1.25fr_1fr] lg:gap-16">

          {/* Offre */}
          <div className="space-y-8">
            <div>
              <div className="mb-4 text-[13px] font-semibold uppercase tracking-[0.12em]" style={{ color: ACCENT }}>
                Recrutement
              </div>
              <h1 className="text-[34px] font-bold leading-[1.1] tracking-[-0.03em] sm:text-[48px]">{job.title}</h1>
              <div className="mt-6 flex flex-wrap gap-2.5">
                <Tag icon={<MapPin size={14} className="text-[#9a9a9a]" />}>{job.location}</Tag>
                <Tag icon={<Briefcase size={14} className="text-[#9a9a9a]" />}>{job.type}</Tag>
              </div>
            </div>

            <Section title="À propos du poste">
              <div className="whitespace-pre-line text-[15px] leading-relaxed text-[#bdbdbd]">{job.description}</div>
            </Section>

            {job.requirements && (
              <Section title="Ce que nous recherchons">
                <div className="whitespace-pre-line text-[15px] leading-relaxed text-[#bdbdbd]">{job.requirements}</div>
              </Section>
            )}

            <div className="rounded-2xl border border-white/[0.08] p-6">
              <h3 className="mb-2 text-[16px] font-semibold">Comment se déroule la sélection</h3>
              <p className="mb-5 text-[14px] leading-relaxed text-[#9a9a9a]">
                Votre CV est analysé dès l’envoi. Si votre profil correspond aux critères, vous passez directement un test technique.
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-white/[0.08] p-4">
                  <div className="mb-1 text-[11.5px] font-semibold uppercase tracking-[0.1em] text-[#6f6f6f]">Étape 1</div>
                  <div className="text-[14px] font-semibold">Analyse du CV (35 pts)</div>
                </div>
                <div className="rounded-xl border border-white/[0.08] p-4">
                  <div className="mb-1 text-[11.5px] font-semibold uppercase tracking-[0.1em] text-[#6f6f6f]">Étape 2</div>
                  <div className="text-[14px] font-semibold">Test technique (65 pts)</div>
                </div>
              </div>
            </div>
          </div>

          {/* Formulaire */}
          <div>
            <div className="lg:sticky lg:top-24">
              <ApplyForm job={job} jobId={params.id} subtitle="Votre CV est analysé dès l’envoi." onDone={handleDone} />
            </div>
          </div>
        </div>
      </main>

      <PoweredBy />
    </JobPageShell>
  );
}