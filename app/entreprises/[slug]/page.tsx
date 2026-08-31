'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  MapPin, Clock, Briefcase, ChevronRight, Loader2, Building2,
  DollarSign, Calendar, Share2, Globe, Users, Heart, X,
  Copy, Check, Linkedin, Twitter, Facebook, MessageCircle, ArrowLeft,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// ─────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────

interface CompanyJob {
  id: string;
  title: string;
  location: string;
  type: string;
  salaryMin: number | null;
  salaryMax: number | null;
  salaryCurrency: string;
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

const TABS = ['jobs', 'about'] as const;
type Tab = typeof TABS[number];

// ─────────────────────────────────────────────
// PAGE
// ─────────────────────────────────────────────

export default function CompanyDetailPage() {
  const params = useParams();
  // Le paramètre est le slug (nom-de-l-entreprise), pas l'id
  const slug = params.slug as string;

  const [company, setCompany] = useState<CompanyData | null>(null);
  const [jobs, setJobs] = useState<CompanyJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('jobs');
  const [selectedType, setSelectedType] = useState('');
  const [showShare, setShowShare] = useState(false);
  const [copied, setCopied] = useState(false);
  const [liked, setLiked] = useState(false);

  useEffect(() => { fetchData(); }, [slug]);

  const fetchData = async () => {
    try {
      // L'API accepte le slug OU l'id
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/public/jobs/company/${slug}`);
      if (!res.ok) throw new Error('404');
      const data = await res.json();
      setCompany(data.company);
      setJobs(data.jobs || []);
    } catch {
    } finally {
      setIsLoading(false);
    }
  };

  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';
  const handleCopy = () => { navigator.clipboard.writeText(shareUrl); setCopied(true); setTimeout(() => setCopied(false), 2000); };

  const colors = company?.careerPageColors || { primary: '#06b6d4', secondary: '#0284c7', accent: '#06b6d4' };

  const filteredJobs = selectedType ? jobs.filter(j => j.type === selectedType) : jobs;

  const getSalary = (j: CompanyJob) => {
    if (!j.salaryMin) return null;
    if (j.salaryMax) return `${j.salaryMin.toLocaleString()} – ${j.salaryMax.toLocaleString()} ${j.salaryCurrency}`;
    return `${j.salaryMin.toLocaleString()} ${j.salaryCurrency}`;
  };

  const postedAgo = (d: string) => {
    const days = Math.floor((Date.now() - new Date(d).getTime()) / 86400000);
    if (days === 0) return "Aujourd'hui";
    if (days === 1) return 'Hier';
    if (days < 7) return `il y a ${days}j`;
    return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  };

  // ── LOADING
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

      {/* ── MODAL PARTAGE ── */}
      <AnimatePresence>
        {showShare && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setShowShare(false)}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ scale: 0.92 }} animate={{ scale: 1 }} exit={{ scale: 0.92, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-sm w-full shadow-2xl"
            >
              <h3 className="font-bold text-white mb-4 text-base">Partager {company.legalName}</h3>
              <div className="grid grid-cols-2 gap-3 mb-4">
                {[
                  { icon: Linkedin, label: 'LinkedIn', color: '#0A66C2', href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}` },
                  { icon: Twitter, label: 'Twitter', color: '#1DA1F2', href: `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}` },
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
                <button onClick={handleCopy} className="shrink-0 px-3 py-1.5 bg-cyan-500 text-slate-950 rounded-lg text-xs font-bold flex items-center gap-1">
                  {copied ? <><Check size={12} />Copié</> : <><Copy size={12} />Copier</>}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── HEADER ── */}
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
            <button onClick={() => setLiked(l => !l)} className={`p-2.5 rounded-xl border transition-all ${liked ? 'border-red-500/50 bg-red-500/10 text-red-400' : 'border-slate-800 text-slate-500 hover:text-white'}`}>
              <Heart size={16} fill={liked ? 'currentColor' : 'none'} />
            </button>
            <button onClick={() => setShowShare(true)} className="flex items-center gap-2 px-4 py-2.5 border border-slate-800 hover:border-slate-600 text-slate-400 hover:text-white rounded-xl text-sm transition-all">
              <Share2 size={14} /> Partager
            </button>
          </div>
        </div>
      </header>

      {/* ── COVER BANNER ── */}
      <div className="relative h-36 sm:h-44 overflow-hidden">
        {company.careerPageBanner ? (
          <Image src={company.careerPageBanner} alt={company.legalName} fill className="object-cover object-center" />
        ) : (
          <div className="w-full h-full" style={{ background: `linear-gradient(135deg, ${colors.primary}30, ${colors.secondary}15, transparent)` }} />
        )}
        {/* Dégradé fort vers le bas pour ne pas cacher le contenu */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent" />
      </div>

      {/* ── COMPANY HEADER ── */}
      <div className="bg-slate-950 border-b border-slate-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          {/* Logo + Infos — logo chevauche le banner */}
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4 -mt-10 pb-0">
            <div className="w-20 h-20 rounded-2xl bg-slate-900 border-4 border-slate-950 shadow-xl flex items-center justify-center overflow-hidden shrink-0">
              {logo ? (
                <Image src={logo} alt={company.legalName} width={96} height={96} className="object-contain w-full h-full" />
              ) : (
                <Building2 size={36} className="text-slate-700" />
              )}
            </div>
            <div className="flex-1 pb-4">
              <h1 className="text-2xl sm:text-3xl font-black text-white mb-1.5 tracking-tight">{company.legalName}</h1>
              <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500">
                {company.industry && <span className="flex items-center gap-1.5"><Briefcase size={14} />{company.industry}</span>}
                {company.city && <span className="flex items-center gap-1.5"><MapPin size={14} />{company.city}</span>}
                <span className="flex items-center gap-1.5">
                  <Building2 size={14} />
                  <span className="font-medium" style={{ color: colors.accent }}>{jobs.length} offre{jobs.length > 1 ? 's' : ''}</span>
                </span>
              </div>
            </div>
          </div>

          {/* TABS */}
          <div className="flex gap-0 mt-4 -mb-px">
            {[
              { id: 'jobs' as Tab, label: `Offres (${jobs.length})` },
              { id: 'about' as Tab, label: 'À propos' },
            ].map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`px-5 py-3.5 text-sm font-bold border-b-2 transition-all ${
                  tab === t.id
                    ? 'text-white border-cyan-400'
                    : 'text-slate-500 border-transparent hover:text-slate-300 hover:border-slate-700'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── CONTENU ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">

        {/* ── TAB: OFFRES ── */}
        {tab === 'jobs' && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">

            {/* Filtres latéraux */}
            <div className="lg:col-span-1">
              <div className="sticky top-24 bg-slate-900 border border-slate-800 rounded-2xl p-5">
                <h3 className="text-sm font-bold text-white mb-4">Filtrer</h3>
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Type de contrat</p>
                  <div className="space-y-1.5">
                    {['', 'CDI', 'CDD', 'STAGE', 'CONSULTANT'].map(t => (
                      <button
                        key={t || 'all'}
                        onClick={() => setSelectedType(t)}
                        className={`w-full text-left px-3 py-2 rounded-xl text-sm transition-all ${
                          selectedType === t
                            ? 'bg-cyan-500/15 text-cyan-400 font-medium border border-cyan-500/30'
                            : 'text-slate-500 hover:text-white hover:bg-slate-800'
                        }`}
                      >
                        {t || 'Tous les contrats'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Liste offres */}
            <div className="lg:col-span-3">
              {filteredJobs.length === 0 ? (
                <div className="text-center py-20 bg-slate-900/50 border border-slate-800 rounded-2xl">
                  <Briefcase size={36} className="mx-auto text-slate-700 mb-3" />
                  <p className="text-slate-500 font-medium">Aucune offre disponible</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredJobs.map((job, i) => {
                    const salary = getSalary(job);
                    return (
                      <motion.div key={job.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                        <Link
                          href={`/jobs/${job.id}`}
                          className="group flex items-center justify-between gap-4 bg-slate-900 hover:bg-slate-800/80 border border-slate-800 hover:border-slate-600 rounded-2xl px-5 py-4 transition-all"
                        >
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-white group-hover:text-cyan-400 transition-colors mb-1.5 text-base leading-snug">
                              {job.title}
                            </h3>
                            <div className="flex flex-wrap items-center gap-2.5 text-sm">
                              <span className="inline-flex items-center gap-1 text-slate-500">
                                <MapPin size={12} />{job.location}
                              </span>
                              <span className="text-slate-700">·</span>
                              <span className="inline-flex items-center gap-1 text-slate-500">
                                <Clock size={12} />{job.type}
                              </span>
                              {salary && (
                                <>
                                  <span className="text-slate-700">·</span>
                                  <span className="inline-flex items-center gap-1 text-cyan-500 font-medium text-xs">
                                    <DollarSign size={11} />{salary}
                                  </span>
                                </>
                              )}
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
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── TAB: À PROPOS ── */}
        {tab === 'about' && (
          <div className="max-w-3xl space-y-6">

            {/* À propos */}
            {company.careerPageAbout && (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8">
                <h2 className="text-lg font-bold text-white mb-4">À propos de {company.legalName}</h2>
                <p className="text-slate-300 leading-relaxed whitespace-pre-line text-sm">{company.careerPageAbout}</p>
              </div>
            )}

            {/* Valeurs */}
            {company.careerPageValues && company.careerPageValues.length > 0 && (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8">
                <h2 className="text-lg font-bold text-white mb-5">Nos valeurs</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {company.careerPageValues.map((v, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 p-4 rounded-xl border"
                      style={{ borderColor: `${colors.accent}30`, backgroundColor: `${colors.accent}08` }}
                    >
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-black shrink-0"
                        style={{ backgroundColor: `${colors.accent}20`, color: colors.accent }}
                      >
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
                <h2 className="text-lg font-bold text-white mb-5">La vie chez {company.legalName}</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {company.careerPagePhotos.map((p, i) => (
                    <div key={i} className="aspect-square rounded-xl overflow-hidden">
                      <Image src={p} alt={`Photo ${i + 1}`} width={300} height={300} className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Pas de contenu */}
            {!company.careerPageAbout && !company.careerPageValues?.length && !company.careerPagePhotos?.length && (
              <div className="text-center py-16 bg-slate-900/50 border border-slate-800 rounded-2xl">
                <Building2 size={36} className="mx-auto text-slate-700 mb-3" />
                <p className="text-slate-500 text-sm">L'entreprise n'a pas encore renseigné sa page carrière.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── FOOTER ── */}
      <footer className="border-t border-slate-800/50 mt-16 py-8 px-4">
        <div className="max-w-7xl mx-auto text-center text-xs text-slate-700">
          © 2026 RH Konza · Plateforme de recrutement propulsée pour {company.legalName}
        </div>
      </footer>
    </div>
  );
}