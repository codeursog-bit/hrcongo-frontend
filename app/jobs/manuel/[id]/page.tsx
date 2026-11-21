'use client';

// ============================================================================
// 📁 app/jobs/manuel/[id]/page.tsx — Candidature (recrutement manuel)
// Page liée à l'entreprise : on affiche SON logo, pas celui de Konza.
// ============================================================================

import React, { useState } from 'react';
import Link from 'next/link';
import { Briefcase, Building2, CheckCircle2, MapPin } from 'lucide-react';
import {
  ACCENT, ApplyForm, CompanyTopBar, Dialog, JobPageShell, NotFoundJob, PageSpinner,
  PoweredBy, Section, Tag, useJobOffer,
} from '@/components/jobs/job-kit';

export default function JobApplyManualPage({ params }: { params: { id: string } }) {
  const { job, isLoading } = useJobOffer(params.id);
  const [isSuccess, setIsSuccess] = useState(false);

  if (isLoading) return <PageSpinner />;
  if (!job) return <NotFoundJob />;

  return (
    <JobPageShell>
      <CompanyTopBar company={job.company} backHref={`/jobs/${job.id}`} />

      {isSuccess && (
        <Dialog>
          <div className="text-center">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full border" style={{ borderColor: `${ACCENT}55`, background: `${ACCENT}14` }}>
              <CheckCircle2 size={28} style={{ color: ACCENT }} />
            </div>
            <h2 className="mb-3 text-[24px] font-semibold">Candidature envoyée</h2>
            <p className="mb-8 text-[15px] leading-relaxed text-[#9a9a9a]">
              Merci. L’équipe RH{job.company?.legalName ? ` de ${job.company.legalName}` : ''} examinera votre profil et reviendra vers vous si votre candidature correspond au poste.
            </p>
            <Link href="/jobs/portal" className="block w-full rounded-xl bg-[#FAFAFA] py-3.5 text-[14.5px] font-semibold text-black transition-colors hover:bg-white">
              Voir d’autres offres
            </Link>
          </div>
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
                {job.department && <Tag icon={<Building2 size={14} className="text-[#9a9a9a]" />}>{job.department.name}</Tag>}
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
              <h3 className="mb-2 text-[16px] font-semibold">Comment votre candidature est traitée</h3>
              <p className="text-[14px] leading-relaxed text-[#9a9a9a]">
                Elle est examinée par l’équipe RH, qui vous contactera si votre profil correspond aux besoins du poste.
              </p>
            </div>
          </div>

          {/* Formulaire */}
          <div>
            <div className="lg:sticky lg:top-24">
              <ApplyForm job={job} jobId={params.id} subtitle="Remplissez le formulaire ci-dessous." onDone={() => setIsSuccess(true)} />
            </div>
          </div>
        </div>
      </main>

      <PoweredBy />
    </JobPageShell>
  );
}