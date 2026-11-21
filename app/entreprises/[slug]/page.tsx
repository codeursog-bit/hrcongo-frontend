'use client';

// ============================================================================
// 📁 app/entreprises/[slug]/page.tsx — Page carrière d'une entreprise
// Page liée à l'entreprise : SON logo (grand, dans l'en-tête) et sa couleur
// d'accent si elle est lisible sur fond sombre. Jamais le logo Konza.
// Logique inchangée : GET /public/jobs/company/:slug, filtre par contrat, onglets.
// ============================================================================

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Briefcase, Building2, ChevronRight, Clock, DollarSign, Heart, Loader2, MapPin, Share2,
} from 'lucide-react';
import { CompanyMark, JobPageShell, NotFoundJob, PoweredBy, ShareDialog, readableAccent } from '@/components/jobs/job-kit';

interface CompanyJob {
  id: string; title: string; location: string; type: string;
  salaryMin: number | null; salaryMax: number | null; salaryCurrency: string; createdAt: string;
}

interface CompanyData {
  id: string; legalName: string; slug: string; logo: string | null; industry: string | null; city: string | null;
  careerPageBanner: string | null; careerPageLogo: string | null;
  careerPageColors: { primary: string; secondary: string; accent: string } | null;
  careerPageAbout: string | null; careerPageValues: string[] | null; careerPagePhotos: string[] | null;
}

type Tab = 'jobs' | 'about';
const LIKED_KEY = 'kz_liked_companies';

export default function CompanyDetailPage() {
  const params = useParams();
  const slug = params.slug as string; // le paramètre est le slug (ou l'id)

  const [company, setCompany] = useState<CompanyData | null>(null);
  const [jobs, setJobs] = useState<CompanyJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('jobs');
  const [selectedType, setSelectedType] = useState('');
  const [showShare, setShowShare] = useState(false);
  const [liked, setLiked] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/public/jobs/company/${slug}`);
        if (!res.ok) throw new Error('404');
        const data = await res.json();
        setCompany(data.company);
        setJobs(data.jobs || []);
      } catch { /* entreprise introuvable */ } finally { setIsLoading(false); }
    })();
  }, [slug]);

  // « Suivre » est conservé sur cet appareil
  useEffect(() => {
    try { setLiked((JSON.parse(localStorage.getItem(LIKED_KEY) || '[]') as string[]).includes(slug)); } catch { /* */ }
  }, [slug]);
  const toggleLiked = () => {
    try {
      const list: string[] = JSON.parse(localStorage.getItem(LIKED_KEY) || '[]');
      const next = list.includes(slug) ? list.filter((x) => x !== slug) : [...list, slug];
      localStorage.setItem(LIKED_KEY, JSON.stringify(next));
      setLiked(next.includes(slug));
    } catch { setLiked((l) => !l); }
  };

  if (isLoading) {
    return (
      <JobPageShell>
        <div role="status" className="flex min-h-screen items-center justify-center"><Loader2 className="animate-spin text-[#FF9A62]" size={32} /></div>
      </JobPageShell>
    );
  }
  if (!company) return <NotFoundJob message="Cette entreprise n’existe pas ou n’a pas de page carrière." />;

  const accent = readableAccent(company.careerPageColors?.accent || company.careerPageColors?.primary);
  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';
  const filteredJobs = selectedType ? jobs.filter((j) => j.type === selectedType) : jobs;
  const hasAbout = !!(company.careerPageAbout || company.careerPageValues?.length || company.careerPagePhotos?.length);

  const salary = (j: CompanyJob) => {
    if (!j.salaryMin) return null;
    return j.salaryMax
      ? `${j.salaryMin.toLocaleString('fr-FR')} – ${j.salaryMax.toLocaleString('fr-FR')} ${j.salaryCurrency}`
      : `${j.salaryMin.toLocaleString('fr-FR')} ${j.salaryCurrency}`;
  };
  const postedAgo = (d: string) => {
    const days = Math.floor((Date.now() - new Date(d).getTime()) / 86400000);
    if (days <= 0) return 'Aujourd’hui';
    if (days === 1) return 'Hier';
    if (days < 7) return `il y a ${days} j`;
    return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  };

  const iconBtn = 'flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2 text-[13.5px] transition-colors hover:border-white/25';

  return (
    <JobPageShell>
      {showShare && <ShareDialog title={company.legalName} url={shareUrl} onClose={() => setShowShare(false)} />}

      {/* Barre du haut : retour + actions (le logo de l'entreprise est dans l'en-tête ci-dessous) */}
      <header className="sticky top-0 z-40 border-b border-white/[0.08] bg-[#050607]/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link href="/entreprises" className="flex items-center gap-2 text-[13.5px] text-[#9a9a9a] transition-colors hover:text-[#F2F2F2]">
            <ArrowLeft size={15} /> Entreprises
          </Link>
          <div className="flex items-center gap-2">
            <button type="button" onClick={toggleLiked} aria-pressed={liked} aria-label={liked ? 'Ne plus suivre' : 'Suivre cette entreprise'}
              className={iconBtn} style={{ color: liked ? accent : '#9a9a9a' }}>
              <Heart size={15} fill={liked ? 'currentColor' : 'none'} />
            </button>
            <button type="button" onClick={() => setShowShare(true)} className={`${iconBtn} text-[#9a9a9a] hover:text-[#F2F2F2]`}>
              <Share2 size={14} /> Partager
            </button>
          </div>
        </div>
      </header>

      {/* Bannière */}
      <div className="relative h-36 overflow-hidden sm:h-48">
        {company.careerPageBanner ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={company.careerPageBanner} alt="" className="h-full w-full object-cover object-center" />
        ) : (
          <div className="h-full w-full" style={{ background: `radial-gradient(70% 120% at 20% 0%, ${accent}33, transparent 70%)` }} />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#050607] via-[#050607]/50 to-transparent" />
      </div>

      {/* En-tête de l'entreprise */}
      <div className="border-b border-white/[0.08]">
        <div className="mx-auto max-w-6xl px-6">
          <div className="-mt-12 flex flex-col items-start gap-5 sm:flex-row sm:items-end">
            <div className="rounded-2xl border-4 border-[#050607]"><CompanyMark company={company} size={88} /></div>
            <div className="flex-1 pb-5">
              <h1 className="mb-2 text-[28px] font-bold leading-tight tracking-[-0.02em] sm:text-[36px]">{company.legalName}</h1>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[14px] text-[#9a9a9a]">
                {company.industry && <span className="flex items-center gap-1.5"><Briefcase size={14} />{company.industry}</span>}
                {company.city && <span className="flex items-center gap-1.5"><MapPin size={14} />{company.city}</span>}
                <span className="font-medium" style={{ color: accent }}>{jobs.length} offre{jobs.length > 1 ? 's' : ''}</span>
              </div>
            </div>
          </div>

          <div className="-mb-px mt-2 flex" role="tablist">
            {([['jobs', `Offres (${jobs.length})`], ['about', 'À propos']] as [Tab, string][]).map(([id, label]) => (
              <button key={id} type="button" role="tab" aria-selected={tab === id} onClick={() => setTab(id)}
                className={`border-b-2 px-5 py-3.5 text-[14px] font-semibold transition-colors ${tab === id ? 'text-[#F2F2F2]' : 'border-transparent text-[#9a9a9a] hover:text-[#F2F2F2]'}`}
                style={tab === id ? { borderColor: accent } : undefined}>
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-6xl px-6 py-10">
        {/* ── Offres ── */}
        {tab === 'jobs' && (
          <div className="grid gap-8 lg:grid-cols-[220px_1fr]">
            <aside>
              <div className="rounded-2xl border border-white/[0.08] bg-[#0c0c0d] p-5 lg:sticky lg:top-24">
                <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#6f6f6f]">Type de contrat</p>
                <div className="flex flex-wrap gap-2 lg:flex-col lg:gap-1">
                  {['', 'CDI', 'CDD', 'STAGE', 'CONSULTANT'].map((t) => {
                    const on = selectedType === t;
                    return (
                      <button key={t || 'all'} type="button" onClick={() => setSelectedType(t)} aria-pressed={on}
                        className={`rounded-lg px-3 py-2 text-left text-[13.5px] transition-colors ${on ? 'bg-white/10 font-medium text-[#F2F2F2]' : 'text-[#9a9a9a] hover:bg-white/[0.05] hover:text-[#F2F2F2]'}`}>
                        {t || 'Tous les contrats'}
                      </button>
                    );
                  })}
                </div>
              </div>
            </aside>

            <div>
              {filteredJobs.length === 0 ? (
                <div className="rounded-2xl border border-white/[0.08] bg-[#0c0c0d] py-20 text-center">
                  <p className="text-[15px] text-[#9a9a9a]">Aucune offre disponible.</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {filteredJobs.map((job) => {
                    const sal = salary(job);
                    return (
                      <Link key={job.id} href={`/jobs/${job.id}`}
                        className="group flex items-center justify-between gap-4 rounded-2xl border border-white/[0.08] bg-[#0c0c0d] px-5 py-4 transition-colors hover:border-white/[0.18]">
                        <div className="min-w-0 flex-1">
                          <h3 className="mb-1.5 text-[16px] font-semibold leading-snug transition-colors group-hover:text-[var(--acc)]" style={{ ['--acc' as any]: accent }}>{job.title}</h3>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-[#9a9a9a]">
                            <span className="inline-flex items-center gap-1"><MapPin size={12} />{job.location}</span>
                            <span className="inline-flex items-center gap-1"><Clock size={12} />{job.type}</span>
                            {sal && <span className="inline-flex items-center gap-1 text-[12.5px] font-medium" style={{ color: accent }}><DollarSign size={11} />{sal}</span>}
                          </div>
                        </div>
                        <div className="flex shrink-0 flex-col items-end gap-2">
                          <span className="text-[12px] text-[#6f6f6f]">{postedAgo(job.createdAt)}</span>
                          <ChevronRight size={16} className="text-[#6f6f6f]" />
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── À propos ── */}
        {tab === 'about' && (
          <div className="max-w-3xl space-y-6">
            {company.careerPageAbout && (
              <section className="rounded-2xl border border-white/[0.08] bg-[#0c0c0d] p-6 sm:p-8">
                <h2 className="mb-4 text-[19px] font-semibold">À propos de {company.legalName}</h2>
                <p className="whitespace-pre-line text-[15px] leading-relaxed text-[#bdbdbd]">{company.careerPageAbout}</p>
              </section>
            )}

            {company.careerPageValues && company.careerPageValues.length > 0 && (
              <section className="rounded-2xl border border-white/[0.08] bg-[#0c0c0d] p-6 sm:p-8">
                <h2 className="mb-5 text-[19px] font-semibold">Nos valeurs</h2>
                <div className="grid gap-3 sm:grid-cols-2">
                  {company.careerPageValues.map((v, i) => (
                    <div key={i} className="flex items-center gap-3 rounded-xl border border-white/[0.08] p-4">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[13px] font-bold" style={{ background: `${accent}20`, color: accent }}>{i + 1}</span>
                      <span className="text-[14px] font-medium text-[#d6d6d6]">{v}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {company.careerPagePhotos && company.careerPagePhotos.length > 0 && (
              <section className="rounded-2xl border border-white/[0.08] bg-[#0c0c0d] p-6 sm:p-8">
                <h2 className="mb-5 text-[19px] font-semibold">La vie chez {company.legalName}</h2>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {company.careerPagePhotos.map((p, i) => (
                    <div key={i} className="aspect-square overflow-hidden rounded-xl">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={p} alt={`Photo ${i + 1}`} className="h-full w-full object-cover transition-transform duration-500 hover:scale-105" />
                    </div>
                  ))}
                </div>
              </section>
            )}

            {!hasAbout && (
              <div className="rounded-2xl border border-white/[0.08] bg-[#0c0c0d] py-16 text-center">
                <Building2 size={32} className="mx-auto mb-3 text-[#6f6f6f]" />
                <p className="text-[14px] text-[#9a9a9a]">L’entreprise n’a pas encore renseigné sa page carrière.</p>
              </div>
            )}
          </div>
        )}
      </main>

      <PoweredBy />
    </JobPageShell>
  );
}