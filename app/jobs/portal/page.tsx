'use client';

// ============================================================================
// 📁 app/jobs/portal/page.tsx — Portail des offres d'emploi
// Page du PORTAIL (offres de toutes les entreprises) : logo Konza en haut.
// Chaque offre garde le logo de SON entreprise sur sa carte.
// Logique inchangée : GET /public/jobs/portal, recherche, filtres, offres à la
// une, vue liste / grille, pagination.
// ============================================================================

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  Building2, ChevronLeft, ChevronRight, Clock, LayoutGrid, List, Loader2, MapPin, Search, X,
} from 'lucide-react';
import { ACCENT, PortalFooter, PortalHeader } from '@/components/jobs/job-kit';

interface JobOffer {
  id: string;
  title: string;
  company: string;
  companySlug: string;
  companyLogo: string | null;
  industry: string | null;
  location: string;
  type: string;
  imageUrl: string | null;
  isPremium: boolean;
  salaryRange: string | null;
  requiredSkills: string[];
  daysRemaining: number | null;
  createdAt: string;
}

const CONTRACT_TYPES = ['CDI', 'CDD', 'STAGE', 'CONSULTANT'];
const PAGE_SIZE_OPTIONS = [6, 8, 12];

const postedLabel = (iso: string) => {
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  return d <= 0 ? 'Aujourd’hui' : d === 1 ? 'Hier' : `il y a ${d} j`;
};

// Logo de l'entreprise de l'offre (tuile claire pour rester lisible sur fond sombre)
function Logo({ job, size }: { job: JobOffer; size: number }) {
  return (
    <span
      className="flex shrink-0 items-center justify-center overflow-hidden rounded-xl"
      style={{ width: size, height: size, background: job.companyLogo ? '#fff' : 'rgba(255,255,255,0.08)' }}
    >
      {job.companyLogo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={job.companyLogo} alt={job.company} className="h-full w-full object-contain p-1" />
      ) : (
        <Building2 size={size * 0.45} className="text-[#6f6f6f]" />
      )}
    </span>
  );
}

// ─── Carte (vue liste) ───────────────────────────────────────────────────────
function JobCardList({ job }: { job: JobOffer }) {
  return (
    <Link
      href={`/jobs/${job.id}`}
      className="group flex items-center gap-5 rounded-2xl border border-white/[0.08] bg-[#0c0c0d] px-5 py-4 transition-colors hover:border-white/[0.18]"
    >
      <Logo job={job} size={56} />
      <div className="min-w-0 flex-1">
        <h3 className="mb-1 truncate text-[16px] font-semibold leading-tight transition-colors group-hover:text-[#FF9A62]">{job.title}</h3>
        <p className="mb-2 truncate text-[13.5px] text-[#9a9a9a]">
          {job.company}{job.industry && <span className="text-[#6f6f6f]"> · {job.industry}</span>}
        </p>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[12.5px] text-[#6f6f6f]">
          <span className="inline-flex items-center gap-1"><MapPin size={12} />{job.location}</span>
          <span className="inline-flex items-center gap-1"><Clock size={12} />{job.type}</span>
          {job.salaryRange && <span className="font-medium" style={{ color: ACCENT }}>{job.salaryRange}</span>}
        </div>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-2">
        <span className="text-[12px] text-[#6f6f6f]">{postedLabel(job.createdAt)}</span>
        <ChevronRight size={16} className="text-[#6f6f6f] transition-colors group-hover:text-[#FF9A62]" />
      </div>
    </Link>
  );
}

// ─── Carte (vue grille) ──────────────────────────────────────────────────────
function JobCardGrid({ job }: { job: JobOffer }) {
  return (
    <Link
      href={`/jobs/${job.id}`}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0c0c0d] transition-colors hover:border-white/[0.18]"
    >
      <div className="relative h-32 overflow-hidden bg-[#161616]">
        {job.imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={job.imageUrl} alt={job.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0c0c0d] to-transparent" />
        <div className="absolute bottom-3 left-3"><Logo job={job} size={40} /></div>
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div>
          <h3 className="mb-0.5 text-[14.5px] font-semibold leading-snug transition-colors group-hover:text-[#FF9A62]"
            style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {job.title}
          </h3>
          <p className="truncate text-[12.5px] text-[#9a9a9a]">{job.company}</p>
        </div>
        <div className="mt-auto flex flex-wrap gap-1.5 border-t border-white/[0.08] pt-3 text-[12px] text-[#9a9a9a]">
          <span className="rounded-full bg-white/[0.06] px-2.5 py-0.5">{job.location.split(',')[0]}</span>
          <span className="rounded-full bg-white/[0.06] px-2.5 py-0.5">{job.type}</span>
          {job.salaryRange && <span className="rounded-full px-2.5 py-0.5 font-medium" style={{ color: ACCENT, background: `${ACCENT}14` }}>{job.salaryRange}</span>}
        </div>
      </div>
    </Link>
  );
}

// ─── Offres à la une (rangée défilante) ──────────────────────────────────────
function Featured({ jobs }: { jobs: JobOffer[] }) {
  const row = useRef<HTMLDivElement>(null);
  const scroll = (dir: 1 | -1) => row.current?.scrollBy({ left: dir * 300, behavior: 'smooth' });

  return (
    <section className="mb-12">
      <div className="mb-4 flex items-end justify-between">
        <div>
          <h2 className="text-[18px] font-semibold">Offres à la une</h2>
          <p className="text-[13px] text-[#6f6f6f]">{jobs.length} offre{jobs.length > 1 ? 's' : ''} mise{jobs.length > 1 ? 's' : ''} en avant</p>
        </div>
        <div className="flex gap-2">
          {([-1, 1] as const).map((d) => (
            <button
              key={d} type="button" onClick={() => scroll(d)} aria-label={d === -1 ? 'Précédent' : 'Suivant'}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-[#9a9a9a] transition-colors hover:border-white/25 hover:text-[#F2F2F2]"
            >
              {d === -1 ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
            </button>
          ))}
        </div>
      </div>
      <div ref={row} className="flex snap-x gap-4 overflow-x-auto pb-2">
        {jobs.map((job) => (
          <Link
            key={job.id} href={`/jobs/${job.id}`}
            className="group w-[270px] shrink-0 snap-start rounded-2xl border p-4 transition-colors hover:bg-white/[0.02]"
            style={{ borderColor: `${ACCENT}40` }}
          >
            <div className="mb-3 flex items-center gap-3">
              <Logo job={job} size={36} />
              <p className="min-w-0 flex-1 truncate text-[12.5px] text-[#9a9a9a]">{job.company}</p>
              <span className="rounded-full px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-[0.06em]" style={{ color: ACCENT, background: `${ACCENT}14` }}>
                À la une
              </span>
            </div>
            <h3 className="mb-3 text-[15px] font-semibold leading-snug transition-colors group-hover:text-[#FF9A62]"
              style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
              {job.title}
            </h3>
            <div className="flex items-center gap-2 text-[12.5px] text-[#6f6f6f]">
              <MapPin size={11} /> {job.location.split(',')[0]} <span>·</span> {job.type}
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────
export default function JobPortalPage() {
  const [jobs, setJobs] = useState<JobOffer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [view, setView] = useState<'list' | 'grid'>('list');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/public/jobs/portal`);
        const data = await res.json();
        setJobs(data.jobs || []);
      } catch { /* liste vide */ } finally {
        setIsLoading(false);
      }
    })();
  }, []);
  useEffect(() => { setPage(1); }, [searchTerm, selectedType, selectedLocation]);

  const filtered = jobs.filter((j) => {
    const s = searchTerm.toLowerCase();
    return (
      (!searchTerm || j.title.toLowerCase().includes(s) || j.company.toLowerCase().includes(s)) &&
      (!selectedType || j.type === selectedType) &&
      (!selectedLocation || j.location.toLowerCase().includes(selectedLocation.toLowerCase()))
    );
  });
  const boosted = filtered.filter((j) => j.isPremium);
  const regular = filtered.filter((j) => !j.isPremium);
  const totalPages = Math.ceil(regular.length / pageSize);
  const paginated = regular.slice((page - 1) * pageSize, page * pageSize);
  const uniqueLocations = Array.from(new Set(jobs.map((j) => j.location.split(',')[0].trim()))).sort();
  const hasFilters = !!(searchTerm || selectedType || selectedLocation);
  const clearFilters = () => { setSearchTerm(''); setSelectedType(''); setSelectedLocation(''); };

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1)
    .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
    .reduce<(number | '…')[]>((acc, p, i, arr) => {
      if (i > 0 && typeof arr[i - 1] === 'number' && p - (arr[i - 1] as number) > 1) acc.push('…');
      acc.push(p);
      return acc;
    }, []);

  const pill = 'rounded-full border px-3.5 py-1.5 text-[12.5px] font-medium transition-colors';

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#050607] font-sans text-[#F2F2F2]">
      <PortalHeader active="offres" />

      {/* ── Titre + recherche ── */}
      <section className="relative border-b border-white/[0.06] px-4 py-16">
        <div className="pointer-events-none absolute inset-0" style={{ background: 'radial-gradient(55% 70% at 15% 0%, rgba(247,135,75,.12), transparent 70%)' }} />
        <div className="relative mx-auto max-w-4xl">
          <h1 className="mb-4 text-[36px] font-bold leading-[1.08] tracking-[-0.03em] sm:text-[52px]">
            Trouvez votre prochain <span style={{ color: ACCENT }}>emploi au Congo</span>
          </h1>
          <p className="mb-8 text-[17px] text-[#9a9a9a]">
            {jobs.length} opportunité{jobs.length > 1 ? 's' : ''} dans les entreprises du pays
          </p>
          <div className="relative">
            <Search size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#6f6f6f]" />
            <input
              type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Poste, entreprise, mot-clé…" aria-label="Rechercher une offre"
              className="w-full rounded-2xl border border-white/10 bg-[#0c0c0d] py-4 pl-12 pr-12 text-[15px] outline-none transition-colors placeholder:text-[#5a5a5a] focus:border-[#FF9A62]/60"
            />
            {searchTerm && (
              <button type="button" onClick={() => setSearchTerm('')} aria-label="Effacer la recherche" className="absolute right-4 top-1/2 -translate-y-1/2 text-[#6f6f6f] hover:text-[#F2F2F2]">
                <X size={16} />
              </button>
            )}
          </div>
        </div>
      </section>

      {/* ── Filtres ── */}
      <div className="sticky top-16 z-40 border-b border-white/[0.06] bg-[#050607]/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-4 py-3 sm:px-6">
          <div className="flex gap-2 overflow-x-auto" role="group" aria-label="Type de contrat">
            {CONTRACT_TYPES.map((t) => {
              const on = selectedType === t;
              return (
                <button
                  key={t} type="button" onClick={() => setSelectedType(on ? '' : t)} aria-pressed={on}
                  className={`${pill} shrink-0 ${on ? 'border-[#FF9A62] text-[#FF9A62]' : 'border-white/10 text-[#9a9a9a] hover:border-white/25 hover:text-[#F2F2F2]'}`}
                >
                  {t}
                </button>
              );
            })}
          </div>
          <select
            value={selectedLocation} onChange={(e) => setSelectedLocation(e.target.value)} aria-label="Ville"
            className={`${pill} cursor-pointer border-white/10 bg-[#0c0c0d] text-[#9a9a9a] outline-none hover:border-white/25`}
          >
            <option value="">Toutes les villes</option>
            {uniqueLocations.map((l) => <option key={l} value={l}>{l}</option>)}
          </select>
          {hasFilters && (
            <button type="button" onClick={clearFilters} className="flex items-center gap-1.5 text-[12.5px] text-[#9a9a9a] transition-colors hover:text-[#F2F2F2]">
              <X size={12} /> Effacer
            </button>
          )}
          <div className="ml-auto flex items-center gap-3">
            <span className="hidden text-[12.5px] text-[#6f6f6f] sm:block">{filtered.length} offre{filtered.length > 1 ? 's' : ''}</span>
            <div className="flex rounded-xl border border-white/10 p-0.5" role="group" aria-label="Affichage">
              {([['list', List, 'Liste'], ['grid', LayoutGrid, 'Grille']] as const).map(([v, Icon, label]) => (
                <button
                  key={v} type="button" onClick={() => setView(v)} aria-pressed={view === v} aria-label={label}
                  className={`rounded-lg p-1.5 transition-colors ${view === v ? 'bg-white/10 text-[#F2F2F2]' : 'text-[#6f6f6f] hover:text-[#d6d6d6]'}`}
                >
                  <Icon size={15} />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Contenu ── */}
      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        {isLoading ? (
          <div role="status" className="flex flex-col items-center py-32">
            <Loader2 className="mb-4 animate-spin" size={32} style={{ color: ACCENT }} />
            <p className="text-[14px] text-[#6f6f6f]">Chargement des offres…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-24 text-center">
            <h2 className="mb-2 text-[22px] font-semibold">Aucune offre trouvée</h2>
            <p className="mb-6 text-[14px] text-[#9a9a9a]">Essayez de modifier vos critères de recherche.</p>
            {hasFilters && (
              <button type="button" onClick={clearFilters} className="rounded-xl border border-white/10 px-5 py-2.5 text-[14px] font-medium transition-colors hover:border-white/25 hover:bg-white/[0.04]">
                Réinitialiser les filtres
              </button>
            )}
          </div>
        ) : (
          <>
            {boosted.length > 0 && <Featured jobs={boosted} />}

            <div>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-[18px] font-semibold">
                  {hasFilters ? `Résultats (${regular.length})` : `Toutes les offres (${regular.length})`}
                </h2>
                <div className="flex items-center gap-1.5 text-[12.5px] text-[#6f6f6f]">
                  <span className="mr-1 hidden sm:block">Afficher</span>
                  {PAGE_SIZE_OPTIONS.map((n) => (
                    <button
                      key={n} type="button" onClick={() => { setPageSize(n); setPage(1); }} aria-pressed={pageSize === n}
                      className={`h-7 w-7 rounded-lg text-[12.5px] font-semibold transition-colors ${pageSize === n ? 'bg-white/10 text-[#F2F2F2]' : 'hover:text-[#F2F2F2]'}`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              {view === 'list' ? (
                <div className="space-y-2.5">{paginated.map((job) => <JobCardList key={job.id} job={job} />)}</div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {paginated.map((job) => <JobCardGrid key={job.id} job={job} />)}
                </div>
              )}

              {totalPages > 1 && (
                <nav aria-label="Pagination" className="mt-10 flex items-center justify-center gap-2">
                  <button
                    type="button" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} aria-label="Page précédente"
                    className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 text-[#9a9a9a] transition-colors hover:border-white/25 disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  {pages.map((p, i) =>
                    p === '…' ? (
                      <span key={`gap-${i}`} className="px-1 text-[#6f6f6f]">…</span>
                    ) : (
                      <button
                        key={p} type="button" onClick={() => setPage(p)} aria-current={page === p ? 'page' : undefined}
                        className={`h-9 w-9 rounded-xl border text-[13.5px] font-semibold transition-colors ${
                          page === p ? 'border-[#FF9A62] text-[#FF9A62]' : 'border-white/10 text-[#9a9a9a] hover:border-white/25'
                        }`}
                      >
                        {p}
                      </button>
                    ),
                  )}
                  <button
                    type="button" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} aria-label="Page suivante"
                    className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 text-[#9a9a9a] transition-colors hover:border-white/25 disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    <ChevronRight size={16} />
                  </button>
                </nav>
              )}
            </div>
          </>
        )}
      </main>

      <PortalFooter />
    </div>
  );
}