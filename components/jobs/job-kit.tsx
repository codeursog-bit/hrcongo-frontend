'use client';

// ============================================================================
// 📁 components/jobs/job-kit.tsx
// Éléments communs aux pages « offres d'emploi » (détail, candidature manuelle,
// candidature IA, test candidat, portail).
//
// RÈGLE DES LOGOS
//   • Page liée à UNE entreprise (offre, candidature, test) → logo de l'entreprise
//     (careerPageLogo, sinon logo ; à défaut, sa première lettre). Jamais Konza.
//   • Page du portail (liste des offres de toutes les entreprises) → logo Konza.
// ============================================================================

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Check, CheckCircle2, Copy, FileText, Facebook, Linkedin, Loader2, MessageCircle, Send, Twitter, Upload } from 'lucide-react';

export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
export const ACCENT = '#FF9A62';
export const KONZA_LOGO_WHITE = '/logos/konza_logo_h_white.png';

// ─── Types ───────────────────────────────────────────────────────────────────
export interface JobCompany {
  id?: string;
  legalName: string;
  slug?: string;
  logo?: string | null;
  careerPageLogo?: string | null;
  careerPageBanner?: string | null;
  industry?: string | null;
  city?: string | null;
}

export interface JobOffer {
  id: string;
  title: string;
  location: string;
  type: string;
  description: string;
  requirements?: string | null;
  additionalDocumentType?: string | null;
  additionalDocumentLabel?: string | null;
  department?: { name: string } | null;
  company?: JobCompany | null;
}

// ─── Chargement d'une offre (GET /public/jobs/:id) ───────────────────────────
export function useJobOffer<T extends JobOffer = JobOffer>(id: string) {
  const [job, setJob] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${API_URL}/public/jobs/${id}`);
        if (!res.ok) throw new Error('Offre introuvable');
        const data = await res.json();
        if (!cancelled) setJob(data);
      } catch (e) {
        console.error(e);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [id]);

  return { job, isLoading };
}

// ─── Mise en page ────────────────────────────────────────────────────────────
export function JobPageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen overflow-x-hidden bg-[#050607] font-sans text-[#F2F2F2]">{children}</div>
  );
}

export function PageSpinner() {
  return (
    <JobPageShell>
      <div role="status" className="flex min-h-screen items-center justify-center">
        <Loader2 className="animate-spin" size={32} style={{ color: ACCENT }} />
      </div>
    </JobPageShell>
  );
}

export function NotFoundJob({ message = 'Cette offre n’existe plus ou a été retirée.' }: { message?: string }) {
  return (
    <JobPageShell>
      <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
        <h1 className="mb-3 text-[28px] font-semibold">Offre introuvable</h1>
        <p className="mb-8 max-w-sm text-[15px] text-[#9a9a9a]">{message}</p>
        <Link href="/jobs/portal" className="rounded-xl bg-[#FAFAFA] px-6 py-3 text-[14px] font-semibold text-black transition-colors hover:bg-white">
          Voir toutes les offres
        </Link>
      </div>
    </JobPageShell>
  );
}

// ─── Logo d'entreprise (tuile claire : le logo reste lisible sur fond sombre) ─
export function CompanyMark({ company, size = 40 }: { company?: JobCompany | null; size?: number }) {
  const logo = company?.careerPageLogo || company?.logo || null;
  const name = company?.legalName || '';
  return (
    <span
      className="flex shrink-0 items-center justify-center overflow-hidden rounded-xl"
      style={{ width: size, height: size, background: logo ? '#fff' : 'rgba(255,255,255,0.1)' }}
    >
      {logo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={logo} alt={name} className="h-full w-full object-contain p-1" />
      ) : (
        <span className="font-semibold" style={{ fontSize: size * 0.42 }}>{name ? name[0].toUpperCase() : '·'}</span>
      )}
    </span>
  );
}

// ─── Barre du haut d'une page d'entreprise : logo + nom de l'entreprise ──────
export function CompanyTopBar({
  company, backHref, onBack, right,
}: {
  company?: JobCompany | null;
  backHref?: string;
  onBack?: () => void;
  right?: React.ReactNode;
}) {
  const backCls = 'flex items-center gap-2 text-[13.5px] text-[#9a9a9a] transition-colors hover:text-[#F2F2F2]';
  const companyHref = company?.slug || company?.id ? `/entreprises/${company.slug || company.id}` : null;
  const identity = (
    <>
      <CompanyMark company={company} size={38} />
      <span className="truncate text-[15px] font-semibold">{company?.legalName}</span>
    </>
  );

  return (
    <header className="sticky top-0 z-40 border-b border-white/[0.08] bg-[#050607]/90 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-6">
        <div className="flex min-w-0 items-center gap-5">
          {backHref && <Link href={backHref} className={backCls}><ArrowLeft size={15} /> Retour</Link>}
          {onBack && <button type="button" onClick={onBack} className={backCls}><ArrowLeft size={15} /> Retour</button>}
          {(backHref || onBack) && <span className="hidden h-4 w-px bg-white/10 sm:block" />}
          {companyHref ? (
            <Link href={companyHref} className="flex min-w-0 items-center gap-3">{identity}</Link>
          ) : (
            <div className="flex min-w-0 items-center gap-3">{identity}</div>
          )}
        </div>
        {right && <div className="flex shrink-0 items-center gap-2">{right}</div>}
      </div>
    </header>
  );
}

export function PoweredBy() {
  return (
    <footer className="border-t border-white/[0.06] px-6 py-8 text-center text-[12.5px] text-[#6f6f6f]">
      Propulsé par{' '}
      <Link href="/" className="text-[#9a9a9a] underline-offset-4 hover:text-[#F2F2F2] hover:underline">Konza RH</Link>
    </footer>
  );
}

// ─── Petits composants d'affichage ───────────────────────────────────────────
export function Tag({ icon, children, accent }: { icon?: React.ReactNode; children: React.ReactNode; accent?: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[13.5px] ${
        accent ? 'font-medium' : 'border-white/10 text-[#d6d6d6]'
      }`}
      style={accent ? { borderColor: `${ACCENT}55`, color: ACCENT, background: `${ACCENT}14` } : undefined}
    >
      {icon}
      {children}
    </span>
  );
}

export function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-white/[0.08] bg-[#0c0c0d] p-6 sm:p-8">
      <h2 className="mb-4 text-[19px] font-semibold tracking-[-0.01em]">{title}</h2>
      {children}
    </section>
  );
}

export function PrimaryLink({ href, children, block }: { href: string; children: React.ReactNode; block?: boolean }) {
  return (
    <Link
      href={href}
      className={`items-center justify-center gap-2 rounded-xl bg-[#FAFAFA] px-7 py-3.5 text-[14.5px] font-semibold text-black transition-colors hover:bg-white ${
        block ? 'flex w-full' : 'inline-flex'
      }`}
    >
      {children}
    </Link>
  );
}

// ─── Fenêtre de confirmation / résultat ──────────────────────────────────────
export function Dialog({ children }: { children: React.ReactNode }) {
  return (
    <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
      <div className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-white/10 bg-[#0c0c0d] p-8 shadow-2xl">
        {children}
      </div>
    </div>
  );
}

// ─── Formulaire de candidature (commun manuel / IA) ──────────────────────────
const MAX_FILE = 5 * 1024 * 1024;
const inputCls =
  'w-full rounded-xl border border-white/10 bg-[#050607] px-4 py-3 text-[15px] text-[#F2F2F2] outline-none transition-colors placeholder:text-[#5a5a5a] focus:border-[#FF9A62]/60';
const labelCls = 'mb-1.5 block text-[13px] font-medium text-[#9a9a9a]';

function FileDrop({
  id, accept, file, onFile, onTooBig, required, empty, hint,
}: {
  id: string; accept: string; file: File | null; onFile: (f: File) => void; onTooBig: () => void;
  required?: boolean; empty: string; hint?: string;
}) {
  return (
    <>
      <input
        id={id}
        type="file"
        accept={accept}
        required={required && !file}
        className="sr-only"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (!f) return;
          if (f.size > MAX_FILE) { onTooBig(); e.target.value = ''; return; }
          onFile(f);
        }}
      />
      <label
        htmlFor={id}
        className="block cursor-pointer rounded-xl border border-dashed border-white/20 bg-white/[0.02] px-4 py-5 text-center transition-colors hover:border-[#FF9A62]/60 hover:bg-white/[0.04]"
      >
        {file ? (
          <span className="flex items-center justify-center gap-2 text-[14px] font-medium" style={{ color: ACCENT }}>
            <CheckCircle2 size={18} /> {file.name}
          </span>
        ) : (
          <>
            <Upload size={20} className="mx-auto mb-2 text-[#9a9a9a]" />
            <span className="block text-[13px] text-[#9a9a9a]">{empty}</span>
            {hint && <span className="mt-1 block text-[11.5px] text-[#6f6f6f]">{hint}</span>}
          </>
        )}
      </label>
    </>
  );
}

export function ApplyForm({
  job, jobId, subtitle, onDone,
}: {
  job: JobOffer;
  jobId: string;
  subtitle: string;
  /** Appelé avec la réponse de l'API quand la candidature est bien envoyée. */
  onDone: (result: any) => void;
}) {
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', phone: '', coverLetter: '' });
  const [resume, setResume] = useState<File | null>(null);
  const [extra, setExtra] = useState<File | null>(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  const set = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const extraLabel = job.additionalDocumentLabel || job.additionalDocumentType || '';

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!resume) { setError('Veuillez importer votre CV.'); return; }
    if (job.additionalDocumentType && !extra) { setError(`Veuillez importer le document requis : ${extraLabel}`); return; }

    setSending(true);
    try {
      const body = new FormData();
      body.append('firstName', form.firstName);
      body.append('lastName', form.lastName);
      body.append('email', form.email);
      body.append('phone', form.phone);
      body.append('coverLetter', form.coverLetter);
      body.append('resume', resume);
      if (extra) body.append('additionalDoc', extra);

      const res = await fetch(`${API_URL}/public/jobs/${jobId}/apply`, { method: 'POST', body });
      const result = await res.json().catch(() => ({}));
      if (res.ok) onDone(result);
      else setError(result.message || 'Erreur lors de l’envoi.');
    } catch {
      setError('Erreur technique. Réessayez dans un instant.');
    } finally {
      setSending(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-5 rounded-2xl border border-white/[0.08] bg-[#0c0c0d] p-7 sm:p-8">
      <div>
        <h3 className="text-[22px] font-semibold tracking-[-0.01em]">Postuler</h3>
        <p className="mt-1 text-[13.5px] text-[#9a9a9a]">{subtitle}</p>
      </div>

      {error && (
        <div role="alert" className="rounded-xl border border-red-500/25 bg-red-500/[0.08] p-3.5 text-[13.5px] text-red-300">{error}</div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="ap-first" className={labelCls}>Prénom *</label>
          <input id="ap-first" required name="firstName" value={form.firstName} onChange={set} className={inputCls} placeholder="Jean" autoComplete="given-name" />
        </div>
        <div>
          <label htmlFor="ap-last" className={labelCls}>Nom *</label>
          <input id="ap-last" required name="lastName" value={form.lastName} onChange={set} className={inputCls} placeholder="Dupont" autoComplete="family-name" />
        </div>
      </div>

      <div>
        <label htmlFor="ap-email" className={labelCls}>Email *</label>
        <input id="ap-email" required type="email" name="email" value={form.email} onChange={set} className={inputCls} placeholder="jean.dupont@email.com" autoComplete="email" />
      </div>

      <div>
        <label htmlFor="ap-phone" className={labelCls}>Téléphone *</label>
        <input id="ap-phone" required type="tel" name="phone" value={form.phone} onChange={set} className={inputCls} placeholder="+242 06 …" autoComplete="tel" />
      </div>

      <div>
        <span className={labelCls}>CV * (PDF ou Word, 5 Mo max)</span>
        <FileDrop
          id="ap-resume" accept=".pdf,.doc,.docx" file={resume} onFile={setResume} required
          onTooBig={() => setError('Le fichier est trop volumineux (5 Mo max).')}
          empty="Cliquez pour importer votre CV"
        />
      </div>

      {job.additionalDocumentType && (
        <div>
          <span className={`${labelCls} flex items-center gap-1.5`}>
            <FileText size={13} /> {extraLabel} *
          </span>
          <FileDrop
            id="ap-extra" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp" file={extra} onFile={setExtra} required
            onTooBig={() => setError('Le fichier est trop volumineux (5 Mo max).')}
            empty={`Importer : ${extraLabel}`}
            hint="PDF, Word, JPG ou PNG (5 Mo max)"
          />
        </div>
      )}

      <div>
        <label htmlFor="ap-cover" className={labelCls}>Lettre de motivation (facultatif)</label>
        <textarea
          id="ap-cover" name="coverLetter" value={form.coverLetter} onChange={set}
          className={`${inputCls} h-28 resize-none text-[14px]`}
          placeholder="Pourquoi ce poste vous intéresse…"
        />
      </div>

      <button
        type="submit"
        disabled={sending}
        className="flex w-full items-center justify-center gap-2.5 rounded-xl bg-[#FAFAFA] py-3.5 text-[15px] font-semibold text-black transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
      >
        {sending ? <><Loader2 size={17} className="animate-spin" /> Envoi en cours…</> : <><Send size={16} /> Envoyer ma candidature</>}
      </button>

      <p className="text-center text-[12px] text-[#6f6f6f]">
        En envoyant ce formulaire, vous acceptez que {job.company?.legalName || 'l’entreprise'} et Konza RH traitent vos données pour ce recrutement.
      </p>
    </form>
  );
}


// ─── Couleur d'accent de l'entreprise, seulement si elle reste lisible sur fond sombre ──
export function readableAccent(color?: string | null): string {
  if (!color || !/^#([0-9a-f]{6})$/i.test(color)) return ACCENT;
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(color.slice(i, i + 2), 16) / 255)
    .map((c) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)));
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return luminance >= 0.25 ? color : ACCENT;
}

// ─── Partage ─────────────────────────────────────────────────────────────────
export function ShareDialog({ title, url, onClose }: { title: string; url: string; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { /* presse-papiers indisponible */ }
  };
  const shares = [
    { icon: Linkedin, label: 'LinkedIn', href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}` },
    { icon: Twitter, label: 'X (Twitter)', href: `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}` },
    { icon: Facebook, label: 'Facebook', href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}` },
    { icon: MessageCircle, label: 'WhatsApp', href: `https://wa.me/?text=${encodeURIComponent(`${title} – ${url}`)}` },
  ];
  return (
    <div onClick={onClose}>
      <Dialog>
        <div onClick={(e) => e.stopPropagation()}>
          <h3 className="mb-5 text-[18px] font-semibold">Partager {title}</h3>
          <div className="mb-5 grid grid-cols-2 gap-3">
            {shares.map(({ icon: Icon, label, href }) => (
              <a key={label} href={href} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2.5 rounded-xl border border-white/10 px-4 py-3 text-[14px] font-medium transition-colors hover:border-white/25 hover:bg-white/[0.04]">
                <Icon size={17} className="text-[#9a9a9a]" /> {label}
              </a>
            ))}
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-[#050607] p-3">
            <p className="flex-1 truncate font-mono text-[12px] text-[#9a9a9a]">{url}</p>
            <button type="button" onClick={copy} className="flex shrink-0 items-center gap-1.5 rounded-lg bg-[#FAFAFA] px-3 py-1.5 text-[12.5px] font-semibold text-black">
              {copied ? <><Check size={13} /> Copié</> : <><Copy size={13} /> Copier</>}
            </button>
          </div>
          <button type="button" onClick={onClose} className="mt-4 w-full text-center text-[13px] text-[#9a9a9a] hover:text-[#F2F2F2]">Fermer</button>
        </div>
      </Dialog>
    </div>
  );
}

// ─── En-tête et pied de page du PORTAIL : logo Konza ─────────────────────────
export function PortalHeader({ active }: { active: 'offres' | 'entreprises' }) {
  const link = (on: boolean) => on ? 'border-b-2 pb-0.5 font-semibold' : 'text-[#9a9a9a] transition-colors hover:text-[#F2F2F2]';
  return (
    <header className="sticky top-0 z-50 border-b border-white/[0.08] bg-[#050607]/90 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-6 px-4 sm:px-6">
        <div className="flex items-center gap-9">
          <Link href="/" aria-label="Konza RH, accueil">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={KONZA_LOGO_WHITE} alt="Konza RH" className="h-8 w-auto" />
          </Link>
          <nav className="hidden items-center gap-6 text-[14px] md:flex">
            <Link href="/jobs/portal" className={link(active === 'offres')} style={active === 'offres' ? { borderColor: ACCENT } : undefined}>Offres</Link>
            <Link href="/entreprises" className={link(active === 'entreprises')} style={active === 'entreprises' ? { borderColor: ACCENT } : undefined}>Entreprises</Link>
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/auth/login" className="hidden px-3 py-2 text-[14px] text-[#9a9a9a] transition-colors hover:text-[#F2F2F2] sm:block">Connexion</Link>
          <Link href="/auth/register" className="rounded-xl bg-[#FAFAFA] px-4 py-2 text-[14px] font-semibold text-black transition-colors hover:bg-white">Créer un compte</Link>
        </div>
      </div>
    </header>
  );
}

export function PortalFooter() {
  const cols = [
    { title: 'Candidats', links: [['Offres', '/jobs/portal'], ['Entreprises', '/entreprises'], ['Créer un profil', '/auth/register']] },
    { title: 'Recruteurs', links: [['Publier une offre', '/recrutement/nouveau'], ['Tarifs', '/tarifs'], ['Contact', '/contact']] },
    { title: 'À propos', links: [['Qui sommes-nous', '/qui-sommes-nous'], ['CGU', '/cgu'], ['Confidentialité', '/privacy']] },
  ];
  return (
    <footer className="mt-10 border-t border-white/[0.06] px-4 py-12">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10 grid grid-cols-2 gap-8 text-[13.5px] sm:grid-cols-4">
          <div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={KONZA_LOGO_WHITE} alt="Konza RH" className="mb-3 h-7 w-auto" />
            <p className="text-[12.5px] leading-relaxed text-[#6f6f6f]">Plateforme RH et recrutement pour les entreprises congolaises.</p>
          </div>
          {cols.map((col) => (
            <div key={col.title}>
              <p className="mb-3 text-[12px] font-semibold uppercase tracking-[0.1em] text-[#9a9a9a]">{col.title}</p>
              <ul className="space-y-2">
                {col.links.map(([label, href]) => (
                  <li key={label}><Link href={href} className="text-[#6f6f6f] transition-colors hover:text-[#d6d6d6]">{label}</Link></li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="border-t border-white/[0.06] pt-6 text-center text-[12px] text-[#6f6f6f]">© 2026 Konza RH. Tous droits réservés.</div>
      </div>
    </footer>
  );
}