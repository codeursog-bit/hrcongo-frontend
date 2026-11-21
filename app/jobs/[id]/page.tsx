'use client';

// ============================================================================
// 📁 app/jobs/[id]/page.tsx — Détail d'une offre
// Page liée à l'entreprise : on affiche SON logo (barre du haut + encart),
// jamais celui de Konza. Logique inchangée : GET /public/jobs/:id, lien de
// candidature selon le mode (manuel / IA), partage.
// ============================================================================

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  AlertCircle, BookmarkPlus, Briefcase, Calendar, Check, ChevronRight, Clock, Copy, DollarSign,
  ExternalLink, Facebook, GraduationCap, Linkedin, MapPin, MessageCircle, Share2, Twitter, Users,
} from 'lucide-react';
import {
  ACCENT, CompanyMark, CompanyTopBar, Dialog, JobPageShell, NotFoundJob, PageSpinner, PoweredBy,
  PrimaryLink, Section, Tag, useJobOffer, type JobOffer,
} from '@/components/jobs/job-kit';

interface JobDetail extends JobOffer {
  processingMode: 'MANUAL' | 'AI_ASSISTED';
  imageUrl: string | null;
  salaryMin: number | null;
  salaryMax: number | null;
  salaryCurrency: string;
  requiredSkills: string[];
  minExperience: number | null;
  educationLevel: string | null;
  expirationDate: string | null;
  isExpired: boolean;
  createdAt: string;
}

const SAVED_KEY = 'kz_saved_jobs';

function readSaved(): string[] {
  try { return JSON.parse(localStorage.getItem(SAVED_KEY) || '[]'); } catch { return []; }
}

export default function JobDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const jobId = params.id;
  const { job, isLoading } = useJobOffer<JobDetail>(jobId);

  const [showShare, setShowShare] = useState(false);
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);

  // « Sauvegarder » est conservé sur cet appareil (avant, le bouton ne gardait rien)
  useEffect(() => { setSaved(readSaved().includes(jobId)); }, [jobId]);

  function toggleSaved() {
    const list = readSaved();
    const next = list.includes(jobId) ? list.filter((x) => x !== jobId) : [...list, jobId];
    try { localStorage.setItem(SAVED_KEY, JSON.stringify(next)); } catch { /* stockage indisponible */ }
    setSaved(next.includes(jobId));
  }

  if (isLoading) return <PageSpinner />;
  if (!job) return <NotFoundJob />;

  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';
  const company = job.company;
  const companyHref = company ? `/entreprises/${company.slug || company.id}` : null;
  const applyHref = job.processingMode === 'AI_ASSISTED' ? `/jobs/ia/${job.id}` : `/jobs/manuel/${job.id}`;

  const salary = !job.salaryMin
    ? null
    : job.salaryMax
      ? `${job.salaryMin.toLocaleString('fr-FR')} – ${job.salaryMax.toLocaleString('fr-FR')} ${job.salaryCurrency}`
      : `${job.salaryMin.toLocaleString('fr-FR')} ${job.salaryCurrency}`;

  const daysLeft = job.expirationDate
    ? Math.max(0, Math.ceil((new Date(job.expirationDate).getTime() - Date.now()) / 86400000))
    : null;

  const days = Math.floor((Date.now() - new Date(job.createdAt).getTime()) / 86400000);
  const postedAgo =
    days === 0 ? 'Aujourd’hui'
    : days === 1 ? 'Hier'
    : days < 7 ? `il y a ${days} jours`
    : days < 30 ? `il y a ${Math.floor(days / 7)} semaine${days > 13 ? 's' : ''}`
    : new Date(job.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });

  const copy = async () => {
    try { await navigator.clipboard.writeText(shareUrl); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { /* presse-papiers indisponible */ }
  };

  const shares = [
    { icon: Linkedin, label: 'LinkedIn', href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}` },
    { icon: Twitter, label: 'X (Twitter)', href: `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(job.title)}` },
    { icon: Facebook, label: 'Facebook', href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}` },
    { icon: MessageCircle, label: 'WhatsApp', href: `https://wa.me/?text=${encodeURIComponent(`${job.title} – ${shareUrl}`)}` },
  ];

  const infos = [
    { icon: Clock, label: 'Contrat', value: job.type },
    { icon: MapPin, label: 'Lieu', value: job.location },
    ...(job.department ? [{ icon: Briefcase, label: 'Département', value: job.department.name }] : []),
    ...(salary ? [{ icon: DollarSign, label: 'Salaire', value: salary }] : []),
    ...(job.minExperience !== null ? [{ icon: Users, label: 'Expérience', value: `${job.minExperience}+ ans` }] : []),
    ...(job.educationLevel ? [{ icon: GraduationCap, label: 'Formation', value: job.educationLevel }] : []),
    { icon: Calendar, label: 'Publiée', value: postedAgo },
  ];

  const faq = [
    { q: 'Un CV est-il obligatoire ?', a: 'Oui, votre CV est requis pour postuler.' },
    { q: 'Quel est le type de contrat ?', a: job.type },
    ...(job.minExperience !== null ? [{ q: 'Expérience requise ?', a: `${job.minExperience}+ ans d’expérience` }] : []),
    ...(job.educationLevel ? [{ q: 'Niveau d’études requis ?', a: job.educationLevel }] : []),
  ];

  const iconBtn = 'flex items-center gap-2 rounded-xl border px-4 py-2 text-[13.5px] transition-colors';

  return (
    <JobPageShell>
      {/* Partage */}
      {showShare && (
        <div onClick={() => setShowShare(false)}>
          <Dialog>
            <div onClick={(e) => e.stopPropagation()}>
              <h3 className="mb-5 text-[18px] font-semibold">Partager cette offre</h3>
              <div className="mb-5 grid grid-cols-2 gap-3">
                {shares.map(({ icon: Icon, label, href }) => (
                  <a
                    key={label} href={href} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2.5 rounded-xl border border-white/10 px-4 py-3 text-[14px] font-medium transition-colors hover:border-white/25 hover:bg-white/[0.04]"
                  >
                    <Icon size={17} className="text-[#9a9a9a]" /> {label}
                  </a>
                ))}
              </div>
              <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-[#050607] p-3">
                <p className="flex-1 truncate font-mono text-[12px] text-[#9a9a9a]">{shareUrl}</p>
                <button
                  type="button" onClick={copy}
                  className="flex shrink-0 items-center gap-1.5 rounded-lg bg-[#FAFAFA] px-3 py-1.5 text-[12.5px] font-semibold text-black"
                >
                  {copied ? <><Check size={13} /> Copié</> : <><Copy size={13} /> Copier</>}
                </button>
              </div>
              <button type="button" onClick={() => setShowShare(false)} className="mt-4 w-full text-center text-[13px] text-[#9a9a9a] hover:text-[#F2F2F2]">
                Fermer
              </button>
            </div>
          </Dialog>
        </div>
      )}

      <CompanyTopBar
        company={company}
        onBack={() => router.back()}
        right={
          <>
            <button
              type="button" onClick={toggleSaved} aria-pressed={saved} aria-label={saved ? 'Retirer des offres sauvegardées' : 'Sauvegarder cette offre'}
              className={`${iconBtn} border-white/10 hover:border-white/25`} style={{ color: saved ? ACCENT : '#9a9a9a' }}
            >
              <BookmarkPlus size={15} />
            </button>
            <button type="button" onClick={() => setShowShare(true)} className={`${iconBtn} border-white/10 text-[#9a9a9a] hover:border-white/25 hover:text-[#F2F2F2]`}>
              <Share2 size={14} /> Partager
            </button>
          </>
        }
      />

      {/* Image de couverture */}
      {(job.imageUrl || company?.careerPageBanner) && (
        <div className="relative h-52 overflow-hidden sm:h-72">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={(job.imageUrl || company?.careerPageBanner)!} alt={job.title} className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#050607] via-[#050607]/40 to-transparent" />
        </div>
      )}

      <main className="mx-auto max-w-6xl px-6 pb-24 pt-10">
        <div className="grid gap-10 lg:grid-cols-[1fr_320px]">

          {/* Colonne principale */}
          <div className="min-w-0 space-y-6">
            <div>
              <h1 className="mb-5 text-[32px] font-bold leading-[1.1] tracking-[-0.03em] sm:text-[44px]">{job.title}</h1>

              <div className="mb-5 flex flex-wrap gap-2.5">
                <Tag icon={<Clock size={14} className="text-[#9a9a9a]" />}>{job.type}</Tag>
                <Tag icon={<MapPin size={14} className="text-[#9a9a9a]" />}>{job.location}</Tag>
                {job.department && <Tag icon={<Briefcase size={14} className="text-[#9a9a9a]" />}>{job.department.name}</Tag>}
                {salary && <Tag accent icon={<DollarSign size={14} />}>{salary}</Tag>}
              </div>

              <div className="mb-6 flex flex-wrap items-center gap-3 text-[12.5px] text-[#6f6f6f]">
                <span className="flex items-center gap-1.5"><Calendar size={12} /> Publiée {postedAgo}</span>
                {daysLeft !== null && daysLeft > 0 && daysLeft <= 7 && (
                  <span className="font-medium" style={{ color: ACCENT }}>Expire dans {daysLeft} j</span>
                )}
                {job.isExpired && <span className="font-medium text-red-400">Offre expirée</span>}
              </div>

              {job.isExpired ? (
                <div role="alert" className="flex items-center gap-3 rounded-xl border border-red-500/25 bg-red-500/[0.08] p-4 text-[14px] text-red-300">
                  <AlertCircle size={18} className="shrink-0" /> Cette offre n’est plus disponible aux candidatures.
                </div>
              ) : (
                <PrimaryLink href={applyHref}>Postuler à cette offre <ChevronRight size={16} /></PrimaryLink>
              )}
            </div>

            <Section title="Description du poste">
              <div className="whitespace-pre-wrap text-[15px] leading-relaxed text-[#bdbdbd]">{job.description}</div>
            </Section>

            {job.requirements && (
              <Section title="Profil recherché">
                <div className="whitespace-pre-wrap text-[15px] leading-relaxed text-[#bdbdbd]">{job.requirements}</div>
              </Section>
            )}

            {job.requiredSkills?.length > 0 && (
              <Section title="Compétences requises">
                <div className="flex flex-wrap gap-2">
                  {job.requiredSkills.map((s, i) => <Tag key={i}>{s}</Tag>)}
                </div>
              </Section>
            )}

            <Section title="Questions fréquentes">
              <div className="space-y-4 text-[14px]">
                {faq.map(({ q, a }) => (
                  <div key={q} className="border-b border-white/[0.08] pb-4 last:border-0 last:pb-0">
                    <p className="mb-1 font-medium">{q}</p>
                    <p className="text-[#9a9a9a]">{a}</p>
                  </div>
                ))}
              </div>
            </Section>
          </div>

          {/* Colonne latérale */}
          <aside>
            <div className="space-y-4 lg:sticky lg:top-24">
              {!job.isExpired && (
                <div className="rounded-2xl border border-white/[0.08] bg-[#0c0c0d] p-5">
                  <p className="mb-3 text-[14px] text-[#9a9a9a]">Cette offre vous intéresse ?</p>
                  <PrimaryLink href={applyHref} block>Postuler maintenant</PrimaryLink>
                  <button
                    type="button" onClick={toggleSaved} aria-pressed={saved}
                    className="mt-2.5 flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 py-2.5 text-[13.5px] font-medium transition-colors hover:border-white/25"
                    style={{ color: saved ? ACCENT : '#9a9a9a' }}
                  >
                    <BookmarkPlus size={15} /> {saved ? 'Sauvegardée' : 'Sauvegarder'}
                  </button>
                </div>
              )}

              <div className="rounded-2xl border border-white/[0.08] bg-[#0c0c0d] p-5">
                <h3 className="mb-4 text-[14px] font-semibold">Informations pratiques</h3>
                <div className="space-y-3.5">
                  {infos.map(({ icon: Icon, label, value }) => (
                    <div key={label} className="flex items-start gap-3">
                      <Icon size={15} className="mt-0.5 shrink-0 text-[#6f6f6f]" />
                      <div className="min-w-0">
                        <p className="text-[12px] text-[#6f6f6f]">{label}</p>
                        <p className="truncate text-[14px] font-medium text-[#d6d6d6]">{value}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {company && companyHref && (
                <Link
                  href={companyHref}
                  className="group flex items-center gap-4 rounded-2xl border border-white/[0.08] bg-[#0c0c0d] p-4 transition-colors hover:border-white/[0.18]"
                >
                  <CompanyMark company={company} size={48} />
                  <div className="min-w-0 flex-1">
                    <p className="mb-0.5 text-[12px] text-[#6f6f6f]">Voir toutes les offres de</p>
                    <p className="truncate text-[14px] font-semibold transition-colors group-hover:text-[#FF9A62]">{company.legalName}</p>
                    {company.industry && <p className="truncate text-[12px] text-[#6f6f6f]">{company.industry}</p>}
                  </div>
                  <ExternalLink size={14} className="shrink-0 text-[#6f6f6f]" />
                </Link>
              )}
            </div>
          </aside>
        </div>
      </main>

      <PoweredBy />
    </JobPageShell>
  );
}