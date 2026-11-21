'use client';

// ============================================================================
// 📁 app/entreprises/EntreprisesClient.tsx — Annuaire des entreprises qui recrutent
// Page du PORTAIL : logo Konza en haut. Chaque carte garde le logo de SON entreprise.
// Logique inchangée : GET /public/jobs/companies/all, recherche, secteur, pagination.
// ============================================================================

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Briefcase, ChevronLeft, ChevronRight, Loader2, MapPin, Search, X } from 'lucide-react';
import { ACCENT, CompanyMark, PortalFooter, PortalHeader, readableAccent } from '@/components/jobs/job-kit';

interface Company {
  id: string; slug: string; legalName: string; logo: string | null; careerPageLogo: string | null;
  careerPageBanner: string | null; careerPageColors: { primary: string; accent: string } | null;
  industry: string | null; city: string | null; jobCount: number;
}

const PAGE_SIZE = 12;

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedIndustry, setSelectedIndustry] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/public/jobs/companies/all`);
        const data = await res.json();
        setCompanies(data.companies || []);
      } catch { /* liste vide */ } finally { setIsLoading(false); }
    })();
  }, []);
  useEffect(() => { setPage(1); }, [search, selectedIndustry]);

  const filtered = companies.filter((c) => {
    const s = search.toLowerCase();
    return (!search || c.legalName.toLowerCase().includes(s) || c.industry?.toLowerCase().includes(s)) && (!selectedIndustry || c.industry === selectedIndustry);
  });
  const industries = Array.from(new Set(companies.map((c) => c.industry).filter(Boolean) as string[])).sort();
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const hasFilters = !!(search || selectedIndustry);

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1)
    .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
    .reduce<(number | '…')[]>((acc, p, i, arr) => {
      if (i > 0 && typeof arr[i - 1] === 'number' && p - (arr[i - 1] as number) > 1) acc.push('…');
      acc.push(p);
      return acc;
    }, []);

  const pill = 'shrink-0 whitespace-nowrap rounded-full border px-3.5 py-1.5 text-[12.5px] font-medium transition-colors';

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#050607] font-sans text-[#F2F2F2]">
      <PortalHeader active="entreprises" />

      <section className="relative border-b border-white/[0.06] px-4 py-16">
        <div className="pointer-events-none absolute inset-0" style={{ background: 'radial-gradient(55% 70% at 15% 0%, rgba(247,135,75,.12), transparent 70%)' }} />
        <div className="relative mx-auto max-w-4xl">
          <h1 className="mb-4 text-[36px] font-bold leading-[1.08] tracking-[-0.03em] sm:text-[52px]">
            Trouvez l’entreprise <span style={{ color: ACCENT }}>qui vous correspond</span>
          </h1>
          <p className="mb-8 text-[17px] text-[#9a9a9a]">{companies.length} entreprise{companies.length > 1 ? 's' : ''} recrutent au Congo</p>
          <div className="relative">
            <Search size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#6f6f6f]" />
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Nom d’entreprise, secteur…" aria-label="Rechercher une entreprise"
              className="w-full rounded-2xl border border-white/10 bg-[#0c0c0d] py-4 pl-12 pr-12 text-[15px] outline-none transition-colors placeholder:text-[#5a5a5a] focus:border-[#FF9A62]/60" />
            {search && (
              <button type="button" onClick={() => setSearch('')} aria-label="Effacer" className="absolute right-4 top-1/2 -translate-y-1/2 text-[#6f6f6f] hover:text-[#F2F2F2]"><X size={16} /></button>
            )}
          </div>
        </div>
      </section>

      <div className="sticky top-16 z-40 border-b border-white/[0.06] bg-[#050607]/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 sm:px-6">
          <div className="flex flex-1 gap-2 overflow-x-auto" role="group" aria-label="Secteur">
            <button type="button" onClick={() => setSelectedIndustry('')} aria-pressed={!selectedIndustry}
              className={`${pill} ${!selectedIndustry ? 'border-[#FF9A62] text-[#FF9A62]' : 'border-white/10 text-[#9a9a9a] hover:border-white/25 hover:text-[#F2F2F2]'}`}>Tous les secteurs</button>
            {industries.map((ind) => {
              const on = selectedIndustry === ind;
              return (
                <button key={ind} type="button" onClick={() => setSelectedIndustry(on ? '' : ind)} aria-pressed={on}
                  className={`${pill} ${on ? 'border-[#FF9A62] text-[#FF9A62]' : 'border-white/10 text-[#9a9a9a] hover:border-white/25 hover:text-[#F2F2F2]'}`}>{ind}</button>
              );
            })}
          </div>
          <span className="hidden shrink-0 text-[12.5px] text-[#6f6f6f] sm:block">{filtered.length} résultat{filtered.length > 1 ? 's' : ''}</span>
        </div>
      </div>

      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        {isLoading ? (
          <div role="status" className="flex flex-col items-center py-32">
            <Loader2 className="mb-4 animate-spin" size={32} style={{ color: ACCENT }} />
            <p className="text-[14px] text-[#6f6f6f]">Chargement des entreprises…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-24 text-center">
            <h2 className="mb-2 text-[22px] font-semibold">Aucune entreprise trouvée</h2>
            <p className="mb-6 text-[14px] text-[#9a9a9a]">Modifiez vos critères de recherche.</p>
            {hasFilters && (
              <button type="button" onClick={() => { setSearch(''); setSelectedIndustry(''); }}
                className="rounded-xl border border-white/10 px-5 py-2.5 text-[14px] font-medium transition-colors hover:border-white/25 hover:bg-white/[0.04]">Réinitialiser</button>
            )}
          </div>
        ) : (
          <>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {paginated.map((c) => {
                const accent = readableAccent(c.careerPageColors?.accent);
                return (
                  <Link key={c.id} href={`/entreprises/${c.slug || c.id}`}
                    className="group flex flex-col overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0c0c0d] transition-colors hover:border-white/[0.18]">
                    <div className="relative h-28 overflow-hidden bg-[#161616]">
                      {c.careerPageBanner ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={c.careerPageBanner} alt="" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
                      ) : (
                        <div className="h-full w-full" style={{ background: `radial-gradient(80% 120% at 20% 0%, ${accent}30, transparent 70%)` }} />
                      )}
                    </div>
                    <div className="-mt-7 mb-3 px-5"><div className="inline-block rounded-xl border-2 border-[#0c0c0d]"><CompanyMark company={c} size={52} /></div></div>
                    <div className="flex flex-1 flex-col px-5 pb-5">
                      <h3 className="mb-1 text-[16px] font-semibold leading-snug transition-colors group-hover:text-[#FF9A62]">{c.legalName}</h3>
                      <div className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12.5px] text-[#9a9a9a]">
                        {c.industry && <span className="flex items-center gap-1"><Briefcase size={11} />{c.industry}</span>}
                        {c.city && <span className="flex items-center gap-1"><MapPin size={11} />{c.city}</span>}
                      </div>
                      <div className="mt-auto flex items-center justify-between border-t border-white/[0.08] pt-3 text-[12.5px]">
                        <span className="font-semibold" style={{ color: c.jobCount > 0 ? accent : '#6f6f6f' }}>
                          {c.jobCount > 0 ? `${c.jobCount} offre${c.jobCount > 1 ? 's' : ''}` : 'Aucune offre'}
                        </span>
                        <span className="flex items-center gap-1 text-[#6f6f6f] transition-colors group-hover:text-[#d6d6d6]">Voir le profil <ChevronRight size={12} /></span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>

            {totalPages > 1 && (
              <nav aria-label="Pagination" className="mt-12 flex items-center justify-center gap-2">
                <button type="button" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} aria-label="Page précédente"
                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 text-[#9a9a9a] transition-colors hover:border-white/25 disabled:cursor-not-allowed disabled:opacity-30"><ChevronLeft size={16} /></button>
                {pages.map((p, i) => p === '…' ? (
                  <span key={`g-${i}`} className="px-1 text-[#6f6f6f]">…</span>
                ) : (
                  <button key={p} type="button" onClick={() => setPage(p)} aria-current={page === p ? 'page' : undefined}
                    className={`h-9 w-9 rounded-xl border text-[13.5px] font-semibold transition-colors ${page === p ? 'border-[#FF9A62] text-[#FF9A62]' : 'border-white/10 text-[#9a9a9a] hover:border-white/25'}`}>{p}</button>
                ))}
                <button type="button" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} aria-label="Page suivante"
                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 text-[#9a9a9a] transition-colors hover:border-white/25 disabled:cursor-not-allowed disabled:opacity-30"><ChevronRight size={16} /></button>
              </nav>
            )}
          </>
        )}
      </main>

      <PortalFooter />
    </div>
  );
}