'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  MapPin, Clock, Briefcase, ChevronRight, Loader2, Building2,
  DollarSign, Share2, Users, Heart, X, Copy, Check,
  Linkedin, Twitter, Facebook, MessageCircle, ArrowLeft,
  LayoutGrid, List, ChevronLeft, Globe, Award, TrendingUp,
  Zap,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface CompanyJob {
  id: string;
  title: string;
  location: string;
  type: string;
  department?: string;
  salaryMin?: number | null;
  salaryMax?: number | null;
  salaryCurrency?: string;
  createdAt: string;
}

interface CompanyData {
  id: string;
  legalName: string;
  slug: string;
  logo: string | null;
  industry: string | null;
  city: string | null;
  careerPageBanner: string | null;
  careerPageLogo: string | null;
  careerPageColors: { primary: string; secondary: string; accent: string } | null;
  careerPageAbout: string | null;
  careerPageValues: string[] | null;
  careerPagePhotos: string[] | null;
}

const PAGE_SIZE = 8;

type Tab = 'jobs' | 'about';
type ViewMode = 'list' | 'grid';

export default function CompanyDetailPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [company, setCompany] = useState<CompanyData | null>(null);
  const [jobs, setJobs] = useState<CompanyJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('jobs');
  const [selectedType, setSelectedType] = useState('');
  const [view, setView] = useState<ViewMode>('list');
  const [page, setPage] = useState(1);
  const [showShare, setShowShare] = useState(false);
  const [copied, setCopied] = useState(false);
  const [liked, setLiked] = useState(false);

  useEffect(() => { fetchData(); }, [slug]);
  useEffect(() => { setPage(1); }, [selectedType, view]);

  const fetchData = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/public/jobs/company/${slug}`);
      if (!res.ok) throw new Error('404');
      const data = await res.json();
      setCompany(data.company);
      setJobs(data.jobs || []);
    } catch { } finally { setIsLoading(false); }
  };

  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';
  const handleCopy = () => { navigator.clipboard.writeText(shareUrl); setCopied(true); setTimeout(() => setCopied(false), 2000); };

  const colors = company?.careerPageColors || { primary: '#06b6d4', secondary: '#0284c7', accent: '#06b6d4' };

  const filteredJobs = selectedType ? jobs.filter(j => j.type === selectedType) : jobs;
  const totalPages = Math.ceil(filteredJobs.length / PAGE_SIZE);
  const paginatedJobs = filteredJobs.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const getSalary = (j: CompanyJob) => {
    if (!j.salaryMin) return null;
    if (j.salaryMax) return `${j.salaryMin.toLocaleString()} – ${j.salaryMax.toLocaleString()} ${j.salaryCurrency || 'XAF'}`;
    return `${j.salaryMin.toLocaleString()} ${j.salaryCurrency || 'XAF'}`;
  };

  const postedAgo = (d: string) => {
    const days = Math.floor((Date.now() - new Date(d).getTime()) / 86400000);
    if (days === 0) return "Aujourd'hui";
    if (days === 1) return 'Hier';
    if (days < 7) return `il y a ${days}j`;
    return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  };

  const contractTypes = Array.from(new Set(jobs.map(j => j.type))).sort();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="animate-spin text-cyan-500" size={40} />
      </div>
    );
  }

  if (!company) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
        <Building2 size={48} className="text-slate-700 mb-4" />
        <h1 className="text-xl font-bold text-white mb-2">Entreprise introuvable</h1>
        <Link href="/entreprises" className="mt-4 text-sm text-cyan-400 hover:underline">← Toutes les entreprises</Link>
      </div>
    );
  }

  const logo = company.careerPageLogo || company.logo;

  return (
    <div className="min-h-screen bg-slate-950 text-white">

      {/* MODAL PARTAGE */}
      <AnimatePresence>
        {showShare && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setShowShare(false)}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          >
            <motion.div initial={{ scale: 0.92 }} animate={{ scale: 1 }} exit={{ scale: 0.92, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-sm w-full shadow-2xl"
            >
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-bold text-white text-base">Partager {company.legalName}</h3>
                <button onClick={() => setShowShare(false)} className="text-slate-500 hover:text-white"><X size={18} /></button>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-4">
                {[
                  { icon: Linkedin, label: 'LinkedIn', color: '#0A66C2', href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}` },
                  { icon: Twitter, label: 'Twitter / X', color: '#1DA1F2', href: `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}` },
                  { icon: Facebook, label: 'Facebook', color: '#1877F2', href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}` },
                  { icon: MessageCircle, label: 'WhatsApp', color: '#25D366', href: `https://wa.me/?text=${encodeURIComponent(company.legalName + ' – ' + shareUrl)}` },
                ].map(({ icon: Icon, label, color, href }) => (
                  <a key={label} href={href} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-bold text-white hover:opacity-80 transition-opacity"
                    style={{ backgroundColor: color + '20', border: `1px solid ${color}40` }}
                  >
                    <Icon size={16} style={{ color }} />{label}
                  </a>
                ))}
              </div>
              <div className="flex items-center gap-2 bg-slate-800 rounded-xl p-3">
                <p className="flex-1 text-xs text-slate-400 font-mono truncate">{shareUrl}</p>
                <button onClick={handleCopy} className="shrink-0 px-3 py-1.5 bg-cyan-500 text-slate-950 rounded-lg text-xs font-bold flex items-center gap-1.5">
                  {copied ? <><Check size={12} />Copié</> : <><Copy size={12} />Copier</>}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* HEADER */}
      <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-xl border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/entreprises" className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm">
              <ArrowLeft size={16} /> Entreprises
            </Link>
            <div className="hidden sm:block h-4 w-px bg-slate-800" />
            <Link href="/" className="hidden sm:block text-sm font-black">RH<span className="text-cyan-400">Konza</span></Link>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setLiked(l => !l)}
              className={`p-2.5 rounded-xl border transition-all ${liked ? 'border-red-500/50 bg-red-500/10 text-red-400' : 'border-slate-800 text-slate-500 hover:text-white'}`}
            >
              <Heart size={16} fill={liked ? 'currentColor' : 'none'} />
            </button>
            <button
              onClick={() => setShowShare(true)}
              className="flex items-center gap-2 px-4 py-2.5 border border-slate-800 hover:border-slate-600 text-slate-400 hover:text-white rounded-xl text-sm transition-all"
            >
              <Share2 size={14} /> Partager
            </button>
          </div>
        </div>
      </header>

      {/* BANNER */}
      <div className="relative h-52 sm:h-72 overflow-hidden">
        {company.careerPageBanner ? (
          <Image src={company.careerPageBanner} alt={company.legalName} fill className="object-cover" />
        ) : (
          <div className="w-full h-full" style={{ background: `linear-gradient(135deg, ${colors.primary}30, ${colors.secondary}15, transparent)` }}>
            <div className="absolute inset-0 bg-slate-950/50" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
      </div>

      {/* COMPANY HEADER */}
      <div className="bg-slate-950 border-b border-slate-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-5 -mt-14 pb-0">
            <div className="w-24 h-24 rounded-2xl bg-slate-900 border-4 border-slate-950 shadow-xl flex items-center justify-center overflow-hidden shrink-0">
              {logo
                ? <Image src={logo} alt={company.legalName} width={96} height={96} className="object-contain w-full h-full" />
                : <Building2 size={36} className="text-slate-700" />
              }
            </div>
            <div className="flex-1 pb-4">
              <h1 className="text-2xl sm:text-3xl font-black text-white mb-1.5 tracking-tight">{company.legalName}</h1>
              <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500">
                {company.industry && <span className="flex items-center gap-1.5"><Briefcase size={14} />{company.industry}</span>}
                {company.city && <span className="flex items-center gap-1.5"><MapPin size={14} />{company.city}</span>}
                <span className="flex items-center gap-1.5 font-medium" style={{ color: colors.accent }}>
                  <Building2 size={14} />{jobs.length} offre{jobs.length > 1 ? 's' : ''} active{jobs.length > 1 ? 's' : ''}
                </span>
              </div>
            </div>
          </div>

          {/* TABS */}
          <div className="flex gap-0 mt-4 -mb-px">
            {([
              { id: 'jobs' as Tab, label: `Offres (${jobs.length})` },
              { id: 'about' as Tab, label: 'À propos' },
            ]).map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`px-5 py-3.5 text-sm font-bold border-b-2 transition-all ${
                  tab === t.id ? 'text-white border-cyan-400' : 'text-slate-500 border-transparent hover:text-slate-300 hover:border-slate-700'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* CONTENU */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">

        {/* ── TAB OFFRES ── */}
        {tab === 'jobs' && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">

            {/* Sidebar filtres */}
            <div className="lg:col-span-1">
              <div className="sticky top-24 space-y-4">
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
                  <h3 className="text-sm font-bold text-white mb-4">Filtrer les offres</h3>
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Type de contrat</p>
                    <div className="space-y-1.5">
                      {(['', ...contractTypes]).map(t => (
                        <button
                          key={t || 'all'}
                          onClick={() => { setSelectedType(t); setPage(1); }}
                          className={`w-full text-left px-3 py-2 rounded-xl text-sm transition-all ${
                            selectedType === t
                              ? 'text-white font-medium border'
                              : 'text-slate-500 hover:text-white hover:bg-slate-800'
                          }`}
                          style={selectedType === t ? { backgroundColor: `${colors.accent}18`, borderColor: `${colors.accent}40`, color: colors.accent } : {}}
                        >
                          {t || 'Tous les contrats'}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* CTA postuler */}
                <div className="bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700 rounded-2xl p-5">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-3" style={{ backgroundColor: `${colors.accent}20` }}>
                    <Zap size={16} style={{ color: colors.accent }} />
                  </div>
                  <p className="text-sm font-bold text-white mb-1">Candidature spontanée</p>
                  <p className="text-xs text-slate-500 mb-4 leading-relaxed">Aucune offre ne correspond ? Envoyez votre candidature directement.</p>
                  <Link href={`/jobs/portal`} className="w-full block text-center py-2.5 rounded-xl text-xs font-bold transition-all text-white" style={{ backgroundColor: colors.accent }}>
                    Voir toutes les offres
                  </Link>
                </div>
              </div>
            </div>

            {/* Liste offres */}
            <div className="lg:col-span-3">
              {/* Toolbar */}
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-slate-500">
                  <span className="font-bold text-white">{filteredJobs.length}</span> offre{filteredJobs.length > 1 ? 's' : ''}
                  {selectedType && <span className="text-slate-600"> · {selectedType}</span>}
                </p>
                <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-0.5">
                  <button onClick={() => setView('list')} className={`p-1.5 rounded-lg transition-colors ${view === 'list' ? 'bg-slate-700 text-white' : 'text-slate-600 hover:text-slate-400'}`}><List size={15} /></button>
                  <button onClick={() => setView('grid')} className={`p-1.5 rounded-lg transition-colors ${view === 'grid' ? 'bg-slate-700 text-white' : 'text-slate-600 hover:text-slate-400'}`}><LayoutGrid size={15} /></button>
                </div>
              </div>

              {filteredJobs.length === 0 ? (
                <div className="text-center py-20 bg-slate-900/50 border border-slate-800 rounded-2xl">
                  <Briefcase size={36} className="mx-auto text-slate-700 mb-3" />
                  <p className="text-slate-500 font-medium">Aucune offre disponible</p>
                  {selectedType && <button onClick={() => setSelectedType('')} className="mt-3 text-xs text-cyan-400 hover:underline">Voir toutes les offres</button>}
                </div>
              ) : view === 'list' ? (
                <div className="space-y-2">
                  <AnimatePresence mode="popLayout">
                    {paginatedJobs.map((job, i) => {
                      const salary = getSalary(job);
                      return (
                        <motion.div key={job.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                          <Link href={`/jobs/${job.id}`} className="group flex items-center justify-between gap-4 bg-slate-900 hover:bg-slate-800/80 border border-slate-800 hover:border-slate-600 rounded-2xl px-5 py-4 transition-all">
                            <div className="flex-1 min-w-0">
                              <h3 className="font-bold text-white group-hover:text-cyan-400 transition-colors mb-1.5 text-base leading-snug truncate">{job.title}</h3>
                              <div className="flex flex-wrap items-center gap-2.5 text-sm">
                                <span className="inline-flex items-center gap-1 text-slate-500"><MapPin size={12} />{job.location}</span>
                                <span className="text-slate-700">·</span>
                                <span className="inline-flex items-center gap-1 text-slate-500"><Clock size={12} />{job.type}</span>
                                {salary && <><span className="text-slate-700">·</span><span className="inline-flex items-center gap-1 text-cyan-500 font-medium text-xs"><DollarSign size={11} />{salary}</span></>}
                              </div>
                            </div>
                            <div className="shrink-0 flex flex-col items-end gap-2">
                              <span className="text-xs text-slate-600">{postedAgo(job.createdAt)}</span>
                              <ChevronRight size={16} className="text-slate-700 group-hover:text-cyan-400 transition-colors" />
                            </div>
                          </Link>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <AnimatePresence mode="popLayout">
                    {paginatedJobs.map((job, i) => {
                      const salary = getSalary(job);
                      return (
                        <motion.div key={job.id} initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }}>
                          <Link href={`/jobs/${job.id}`} className="group flex flex-col bg-slate-900 hover:bg-slate-800/80 border border-slate-800 hover:border-slate-600 rounded-2xl p-5 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-black/40 h-full">
                            <div className="flex items-start justify-between gap-2 mb-3">
                              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${colors.accent}18` }}>
                                <Briefcase size={18} style={{ color: colors.accent }} />
                              </div>
                              <span className="text-xs text-slate-600">{postedAgo(job.createdAt)}</span>
                            </div>
                            <h3 className="font-bold text-white group-hover:text-cyan-400 transition-colors text-sm leading-snug mb-2 line-clamp-2">{job.title}</h3>
                            <div className="flex flex-col gap-1.5 mt-auto pt-3 border-t border-slate-800">
                              <span className="inline-flex items-center gap-1.5 text-xs text-slate-500"><MapPin size={11} />{job.location}</span>
                              <div className="flex items-center gap-2">
                                <span className="text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full">{job.type}</span>
                                {salary && <span className="text-xs text-cyan-500 font-medium">{salary}</span>}
                              </div>
                            </div>
                          </Link>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              )}

              {/* PAGINATION */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-8">
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                    className="w-9 h-9 rounded-xl border border-slate-800 flex items-center justify-center text-slate-500 hover:text-white hover:border-slate-600 disabled:opacity-30 transition-all">
                    <ChevronLeft size={16} />
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                    .reduce<(number | '...')[]>((acc, p, i, arr) => {
                      if (i > 0 && typeof arr[i - 1] === 'number' && (p as number) - (arr[i - 1] as number) > 1) acc.push('...');
                      acc.push(p); return acc;
                    }, [])
                    .map((p, i) => p === '...'
                      ? <span key={`dot-${i}`} className="text-slate-700 px-1">…</span>
                      : <button key={p} onClick={() => setPage(p as number)}
                          className={`w-9 h-9 rounded-xl text-sm font-bold transition-all ${page === p ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/20' : 'border border-slate-800 text-slate-500 hover:text-white hover:border-slate-600'}`}
                        >{p}</button>
                    )}
                  <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                    className="w-9 h-9 rounded-xl border border-slate-800 flex items-center justify-center text-slate-500 hover:text-white hover:border-slate-600 disabled:opacity-30 transition-all">
                    <ChevronRight size={16} />
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── TAB À PROPOS ── */}
        {tab === 'about' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

            {/* Colonne principale */}
            <div className="lg:col-span-2 space-y-6">

              {/* À propos */}
              {company.careerPageAbout ? (
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8">
                  <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${colors.accent}20` }}>
                      <Building2 size={13} style={{ color: colors.accent }} />
                    </div>
                    À propos de {company.legalName}
                  </h2>
                  <p className="text-slate-300 leading-relaxed whitespace-pre-line text-sm">{company.careerPageAbout}</p>
                </div>
              ) : (
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center">
                  <Building2 size={32} className="mx-auto text-slate-700 mb-3" />
                  <p className="text-slate-500 text-sm">L'entreprise n'a pas encore renseigné sa présentation.</p>
                </div>
              )}

              {/* Valeurs */}
              {company.careerPageValues && company.careerPageValues.length > 0 && (
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8">
                  <h2 className="text-lg font-bold text-white mb-5 flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${colors.accent}20` }}>
                      <Award size={13} style={{ color: colors.accent }} />
                    </div>
                    Nos valeurs
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {company.careerPageValues.map((v, i) => (
                      <div key={i} className="flex items-center gap-3 p-4 rounded-xl border" style={{ borderColor: `${colors.accent}30`, backgroundColor: `${colors.accent}08` }}>
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-black shrink-0" style={{ backgroundColor: `${colors.accent}20`, color: colors.accent }}>
                          {i + 1}
                        </div>
                        <span className="text-slate-200 text-sm font-medium">{v}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Photos */}
              {company.careerPagePhotos && company.careerPagePhotos.length > 0 && (
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8">
                  <h2 className="text-lg font-bold text-white mb-5 flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${colors.accent}20` }}>
                      <Users size={13} style={{ color: colors.accent }} />
                    </div>
                    La vie chez {company.legalName}
                  </h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {company.careerPagePhotos.map((p, i) => (
                      <div key={i} className="aspect-square rounded-xl overflow-hidden">
                        <Image src={p} alt={`Photo ${i + 1}`} width={300} height={300} className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Colonne droite — toujours remplie */}
            <div className="space-y-4">

              {/* Infos rapides */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
                <h3 className="text-sm font-bold text-white mb-4">Informations</h3>
                <div className="space-y-3">
                  {company.industry && (
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-slate-800 rounded-lg flex items-center justify-center shrink-0">
                        <Briefcase size={14} className="text-slate-500" />
                      </div>
                      <div>
                        <p className="text-xs text-slate-600 uppercase tracking-wider">Secteur</p>
                        <p className="text-sm text-white font-medium">{company.industry}</p>
                      </div>
                    </div>
                  )}
                  {company.city && (
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-slate-800 rounded-lg flex items-center justify-center shrink-0">
                        <MapPin size={14} className="text-slate-500" />
                      </div>
                      <div>
                        <p className="text-xs text-slate-600 uppercase tracking-wider">Localisation</p>
                        <p className="text-sm text-white font-medium">{company.city}, Congo</p>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-slate-800 rounded-lg flex items-center justify-center shrink-0">
                      <TrendingUp size={14} className="text-slate-500" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-600 uppercase tracking-wider">Offres actives</p>
                      <p className="text-sm font-medium" style={{ color: colors.accent }}>{jobs.length} poste{jobs.length > 1 ? 's' : ''} ouvert{jobs.length > 1 ? 's' : ''}</p>
                    </div>
                  </div>
                  {company.careerPageValues && company.careerPageValues.length > 0 && (
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-slate-800 rounded-lg flex items-center justify-center shrink-0">
                        <Award size={14} className="text-slate-500" />
                      </div>
                      <div>
                        <p className="text-xs text-slate-600 uppercase tracking-wider">Valeurs clés</p>
                        <p className="text-sm text-white font-medium">{company.careerPageValues.length} valeur{company.careerPageValues.length > 1 ? 's' : ''} d'entreprise</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Types de contrats proposés */}
              {contractTypes.length > 0 && (
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
                  <h3 className="text-sm font-bold text-white mb-3">Contrats proposés</h3>
                  <div className="flex flex-wrap gap-2">
                    {contractTypes.map(t => (
                      <button
                        key={t}
                        onClick={() => { setTab('jobs'); setSelectedType(t); setPage(1); }}
                        className="px-3 py-1.5 rounded-xl text-xs font-bold border transition-all hover:border-slate-500 hover:text-white border-slate-700 text-slate-400"
                        style={{}}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* CTA postuler */}
              <div className="rounded-2xl p-5 border" style={{ background: `linear-gradient(135deg, ${colors.accent}15, ${colors.primary}08)`, borderColor: `${colors.accent}30` }}>
                <p className="text-sm font-bold text-white mb-1">Rejoindre {company.legalName} ?</p>
                <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                  {jobs.length > 0
                    ? `${jobs.length} poste${jobs.length > 1 ? 's' : ''} disponible${jobs.length > 1 ? 's' : ''} en ce moment.`
                    : "Suivez l'entreprise pour être alerté des nouvelles offres."}
                </p>
                <button
                  onClick={() => setTab('jobs')}
                  className="w-full py-2.5 rounded-xl text-sm font-bold transition-all text-white"
                  style={{ backgroundColor: colors.accent }}
                >
                  Voir les offres →
                </button>
              </div>

              {/* Partager */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
                <h3 className="text-sm font-bold text-white mb-3">Partager cette page</h3>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { icon: Linkedin, label: 'LinkedIn', color: '#0A66C2', href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}` },
                    { icon: Twitter, label: 'Twitter', color: '#1DA1F2', href: `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}` },
                    { icon: Facebook, label: 'Facebook', color: '#1877F2', href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}` },
                    { icon: MessageCircle, label: 'WhatsApp', color: '#25D366', href: `https://wa.me/?text=${encodeURIComponent(company.legalName + ' – ' + shareUrl)}` },
                  ].map(({ icon: Icon, label, color, href }) => (
                    <a key={label} href={href} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-white hover:opacity-80 transition-opacity"
                      style={{ backgroundColor: color + '18', border: `1px solid ${color}30` }}
                    >
                      <Icon size={13} style={{ color }} />{label}
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* FOOTER */}
      <footer className="border-t border-slate-800/50 mt-16 py-8 px-4">
        <div className="max-w-7xl mx-auto text-center text-xs text-slate-700">
          © 2026 RH Konza · Plateforme de recrutement propulsée pour {company.legalName}
        </div>
      </footer>
    </div>
  );
}