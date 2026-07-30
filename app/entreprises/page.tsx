'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Search, MapPin, Briefcase, Building2, Loader2,
  ChevronRight, X, SlidersHorizontal,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Company {
  id: string;
  slug: string;
  legalName: string;
  logo: string | null;
  careerPageLogo: string | null;
  careerPageBanner: string | null;
  careerPageColors: { primary: string; accent: string } | null;
  industry: string | null;
  city: string | null;
  jobCount: number;
}

const PAGE_SIZE = 12;

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedIndustry, setSelectedIndustry] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => { fetchCompanies(); }, []);
  useEffect(() => { setPage(1); }, [search, selectedIndustry]);

  const fetchCompanies = async () => {
    try {
      // ✅ FIX: bon endpoint
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/public/jobs/companies/all`);
      const data = await res.json();
      setCompanies(data.companies || []);
    } catch { } finally { setIsLoading(false); }
  };

  const filtered = companies.filter(c => {
    const s = search.toLowerCase();
    return (
      (!search || c.legalName.toLowerCase().includes(s) || c.industry?.toLowerCase().includes(s)) &&
      (!selectedIndustry || c.industry === selectedIndustry)
    );
  });

  const uniqueIndustries = Array.from(new Set(companies.map(c => c.industry).filter(Boolean) as string[])).sort();
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const hasFilters = !!(search || selectedIndustry);

  return (
    <div className="min-h-screen bg-slate-950 text-white">

      {/* HEADER */}
      <header className="sticky top-0 z-50 bg-slate-950/90 backdrop-blur-xl border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-6">
          <div className="flex items-center gap-8 shrink-0">
            <Link href="/" className="text-xl font-black tracking-tight">
              RH<span className="text-cyan-400">Konza</span>
            </Link>
            <nav className="hidden md:flex items-center gap-6 text-sm">
              <Link href="/jobs/portal" className="text-slate-400 hover:text-white transition-colors">Offres</Link>
              <Link href="/entreprises" className="text-white font-semibold border-b-2 border-cyan-400 pb-0.5">Entreprises</Link>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="hidden sm:block text-sm text-slate-400 hover:text-white transition-colors px-3 py-2">Connexion</Link>
            <Link href="/register" className="text-sm font-bold px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-xl transition-colors">
              Créer un compte
            </Link>
          </div>
        </div>
      </header>

      {/* HERO */}
      <div className="border-b border-slate-800/50 py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-4xl sm:text-5xl font-black text-white mb-3 leading-tight tracking-tight">
              Trouvez l'entreprise<br />
              <span className="text-cyan-400">qui vous correspond</span>
            </h1>
            <p className="text-slate-400 mb-7 text-lg">
              {companies.length} entreprise{companies.length > 1 ? 's' : ''} recrutent au Congo
            </p>
            <div className="flex gap-2 bg-slate-900 border border-slate-700 rounded-2xl p-2">
              <div className="flex-1 flex items-center gap-3 bg-slate-800 rounded-xl px-4 py-3">
                <Search size={18} className="text-slate-500 shrink-0" />
                <input
                  type="text"
                  placeholder="Nom d'entreprise, secteur..."
                  className="flex-1 bg-transparent outline-none text-white placeholder:text-slate-600 text-sm"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
                {search && <button onClick={() => setSearch('')}><X size={14} className="text-slate-600 hover:text-white" /></button>}
              </div>
              <button className="px-5 py-3 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl text-sm transition-colors shrink-0">
                Rechercher
              </button>
            </div>
          </motion.div>
        </div>
      </div>

      {/* FILTRES SECTEUR */}
      <div className="sticky top-16 z-40 bg-slate-950/95 backdrop-blur-sm border-b border-slate-800/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
          <div className="flex items-center gap-3">
            <SlidersHorizontal size={15} className="text-slate-600 shrink-0" />
            <div className="flex items-center gap-2 overflow-x-auto pb-0.5 flex-nowrap flex-1 scrollbar-none">
              <button
                onClick={() => setSelectedIndustry('')}
                className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-bold border transition-all whitespace-nowrap ${
                  !selectedIndustry ? 'bg-cyan-500 border-cyan-500 text-slate-950' : 'border-slate-700 text-slate-400 hover:border-slate-500 hover:text-white'
                }`}
              >
                Tous les secteurs
              </button>
              {uniqueIndustries.map(ind => (
                <button
                  key={ind}
                  onClick={() => setSelectedIndustry(selectedIndustry === ind ? '' : ind)}
                  className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-bold border transition-all whitespace-nowrap ${
                    selectedIndustry === ind ? 'bg-cyan-500 border-cyan-500 text-slate-950' : 'border-slate-700 text-slate-400 hover:border-slate-500 hover:text-white'
                  }`}
                >
                  {ind}
                </button>
              ))}
            </div>
            <span className="shrink-0 text-xs text-slate-600 hidden sm:block">{filtered.length} résultat{filtered.length > 1 ? 's' : ''}</span>
          </div>
        </div>
      </div>

      {/* CONTENU */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-32">
            <Loader2 className="animate-spin text-cyan-500 mb-4" size={40} />
            <p className="text-slate-500 text-sm">Chargement des entreprises...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-24">
            <Building2 size={40} className="mx-auto text-slate-700 mb-4" />
            <h2 className="text-lg font-bold text-white mb-2">Aucune entreprise trouvée</h2>
            <p className="text-slate-500 text-sm mb-5">Modifiez vos critères de recherche</p>
            {hasFilters && (
              <button onClick={() => { setSearch(''); setSelectedIndustry(''); }}
                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-sm font-medium transition-colors">
                Réinitialiser
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              <AnimatePresence mode="popLayout">
                {paginated.map((company, i) => {
                  const logo = company.careerPageLogo || company.logo;
                  const accent = company.careerPageColors?.accent || '#06b6d4';
                  const href = `/entreprises/${company.slug || company.id}`;
                  return (
                    <motion.div key={company.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ delay: i * 0.04 }}>
                      <Link href={href} className="group flex flex-col bg-slate-900 border border-slate-800 hover:border-slate-600 rounded-2xl overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-black/40">
                        <div className="relative h-28 overflow-hidden bg-slate-800">
                          {company.careerPageBanner ? (
                            <Image src={company.careerPageBanner} alt={company.legalName} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                          ) : (
                            <div className="w-full h-full" style={{ background: `linear-gradient(135deg, ${accent}25, ${accent}08, transparent)` }} />
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent" />
                        </div>
                        <div className="px-5 -mt-7 mb-3">
                          <div className="w-14 h-14 rounded-xl bg-slate-900 border-2 border-slate-950 shadow-xl flex items-center justify-center overflow-hidden">
                            {logo ? <Image src={logo} alt={company.legalName} width={56} height={56} className="object-contain" /> : <Building2 size={22} className="text-slate-600" />}
                          </div>
                        </div>
                        <div className="px-5 pb-5 flex-1 flex flex-col">
                          <h3 className="font-bold text-white group-hover:text-cyan-400 transition-colors text-base mb-1 leading-snug">{company.legalName}</h3>
                          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mb-3">
                            {company.industry && <span className="flex items-center gap-1"><Briefcase size={11} />{company.industry}</span>}
                            {company.city && <><span className="text-slate-700">·</span><span className="flex items-center gap-1"><MapPin size={11} />{company.city}</span></>}
                          </div>
                          <div className="flex items-center justify-between mt-auto pt-3 border-t border-slate-800">
                            <span className="text-xs font-bold" style={{ color: company.jobCount > 0 ? accent : '#475569' }}>
                              {company.jobCount > 0 ? `${company.jobCount} offre${company.jobCount > 1 ? 's' : ''}` : 'Aucune offre'}
                            </span>
                            <span className="text-xs text-slate-600 flex items-center gap-1 group-hover:text-slate-400 transition-colors">
                              Voir le profil <ChevronRight size={12} />
                            </span>
                          </div>
                        </div>
                      </Link>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>

            {/* PAGINATION */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-12">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                  className="px-4 py-2.5 rounded-xl border border-slate-800 text-slate-500 hover:text-white hover:border-slate-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all text-sm">
                  ← Précédent
                </button>
                <div className="flex items-center gap-1.5">
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                    .reduce<(number | '...')[]>((acc, p, i, arr) => {
                      if (i > 0 && typeof arr[i - 1] === 'number' && (p as number) - (arr[i - 1] as number) > 1) acc.push('...');
                      acc.push(p); return acc;
                    }, [])
                    .map((p, i) => p === '...'
                      ? <span key={`dot-${i}`} className="text-slate-700 px-1 text-sm">…</span>
                      : <button key={p} onClick={() => setPage(p as number)}
                          className={`w-9 h-9 rounded-xl text-sm font-bold transition-all ${page === p ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/20' : 'border border-slate-800 text-slate-500 hover:text-white hover:border-slate-600'}`}
                        >{p}</button>
                    )}
                </div>
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                  className="px-4 py-2.5 rounded-xl border border-slate-800 text-slate-500 hover:text-white hover:border-slate-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all text-sm">
                  Suivant →
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* FOOTER */}
      <footer className="border-t border-slate-800/50 mt-16 py-10 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 mb-8 text-sm">
            <div>
              <p className="font-black text-white mb-3 text-base">RH<span className="text-cyan-400">Konza</span></p>
              <p className="text-slate-600 text-xs leading-relaxed">Plateforme de recrutement pour l'Afrique centrale.</p>
            </div>
            {([
              { title: 'Candidats', links: [['Offres', '/jobs/portal'], ['Entreprises', '/entreprises'], ['Créer un profil', '/register']] },
              { title: 'Recruteurs', links: [['Publier une offre', '/recrutement/nouveau'], ['Solution SIRH', '/sirh'], ['Contact', '/contact']] },
              { title: 'À propos', links: [['Qui sommes-nous', '/about'], ['CGU', '/cgu'], ['Confidentialité', '/privacy']] },
            ] as { title: string; links: [string, string][] }[]).map(col => (
              <div key={col.title}>
                <p className="font-bold text-slate-500 mb-3 text-xs uppercase tracking-wider">{col.title}</p>
                <ul className="space-y-2">
                  {col.links.map(([label, href]) => (
                    <li key={label}><Link href={href} className="text-slate-600 hover:text-slate-300 transition-colors text-xs">{label}</Link></li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="border-t border-slate-800/50 pt-6 text-center text-xs text-slate-700">© 2026 RH Konza. Tous droits réservés.</div>
        </div>
      </footer>
    </div>
  );
}