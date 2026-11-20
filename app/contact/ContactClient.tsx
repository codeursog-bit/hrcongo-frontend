'use client';
// ============================================================================
// 📁 app/contact/ContactClient.tsx — Konza RH · Contact public
// POST → NestJS /contact → email à l'équipe (api.ts, credentials gérés).
// Même esprit que l'accueil : fond sombre, un seul accent orange.
// ============================================================================
import React, { useState } from 'react';
import Link from 'next/link';
import {
  Mail, Phone, MapPin, Clock, Send, Loader2,
  CheckCircle2, AlertCircle, ArrowRight,
} from 'lucide-react';
import { Navbar } from '@/components/landing/Navbar';
import { Footer } from '@/components/landing/Footer';
import { api }    from '@/services/api';

const ACCENT = '#FF9A62';

// ─── Types ────────────────────────────────────────────────────────────────────
interface ContactPayload {
  name:     string;
  email:    string;
  company?: string;
  phone?:   string;
  subject:  string;
  message:  string;
}

interface ContactResponse {
  trackingPath?: string;
  emailSent?: boolean;
  success: boolean;
  message: string;
  id?:     string;
}

// ─── Constantes ───────────────────────────────────────────────────────────────
const SUBJECTS = [
  'Demande de démo',
  'Question sur les tarifs',
  'Support technique',
  'Partenariat commercial',
  'Demande de formation sur site',
  'Signalement / Bug',
  'Autre',
];

const CONTACT_INFO = [
  { icon: Mail,   label: 'Email',         value: 'rhkonza@gmail.com',           href: 'mailto:rhkonza@gmail.com' },
  { icon: Phone,  label: 'Téléphone',     value: '+242 06 413 36 93',           href: 'tel:+242064133693' },
  { icon: MapPin, label: 'Adresse',       value: 'Pointe-Noire, Congo-Brazzaville', href: null },
  { icon: Clock,  label: 'Disponibilité', value: 'Lun–Ven, 8h–18h (heure du Congo)', href: null },
];

const QUICK_LINKS = [
  { label: 'Consulter la documentation', href: '/docs' },
  { label: 'Voir les tarifs',            href: '/tarifs' },
  { label: 'Essai gratuit de 30 jours',  href: '/auth/register' },
];

// ─── PAGE ─────────────────────────────────────────────────────────────────────
export default function ContactPage() {
  const [form, setForm] = useState<ContactPayload>({
    name: '', email: '', company: '', phone: '', subject: '', message: '',
  });
  const [status,  setStatus]  = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errMsg,  setErrMsg]  = useState('');
  const [followUp,setFollowUp] = useState<ContactResponse|null>(null);

  const set = (field: keyof ContactPayload) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm(p => ({ ...p, [field]: e.target.value }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.subject || !form.message.trim()) {
      setErrMsg('Merci de remplir tous les champs obligatoires.');
      return;
    }
    setStatus('loading');
    setErrMsg('');
    try {
      // api.post de services/api.ts — credentials:include géré automatiquement
      const result = await api.post<ContactResponse>('/contact', {
        name:    form.name.trim(),
        email:   form.email.trim().toLowerCase(),
        company: form.company?.trim() || undefined,
        phone:   form.phone?.trim()   || undefined,
        subject: form.subject,
        message: form.message.trim(),
      });
      setFollowUp(result);
      setStatus('success');
    } catch (err: any) {
      setErrMsg(err.message || 'Une erreur est survenue. Réessayez ou contactez-nous directement.');
      setStatus('error');
    }
  }

  function reset() {
    setFollowUp(null);
    setForm({ name:'', email:'', company:'', phone:'', subject:'', message:'' });
    setStatus('idle');
    setErrMsg('');
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#050607] font-sans text-[#F2F2F2]">
      <Navbar />

      {/* ── Titre ───────────────────────────────────────────────────────────── */}
      <section className="relative px-6 pb-16 pt-36 text-center">
        <div
          className="pointer-events-none absolute inset-0"
          style={{ background: 'radial-gradient(55% 60% at 50% 0%, rgba(247,135,75,.12), transparent 70%)' }}
        />
        <div className="relative mx-auto max-w-2xl">
          <div className="mb-4 text-[13px] font-semibold uppercase tracking-[0.12em]" style={{ color: ACCENT }}>
            Contact
          </div>
          <h1 className="text-[38px] font-bold leading-[1.08] tracking-[-0.03em] sm:text-[54px]">
            On vous répond <span style={{ color: ACCENT }}>sous 24 heures.</span>
          </h1>
          <p className="mx-auto mt-5 max-w-lg text-[18px] leading-relaxed text-[#9a9a9a]">
            Une question sur la paie, un besoin de démo, un projet d’intégration ? Notre équipe à Pointe-Noire est là
            pour vous.
          </p>
        </div>
      </section>

      {/* ── Contenu ─────────────────────────────────────────────────────────── */}
      <section className="border-t border-white/[0.06]">
        <div className="mx-auto grid max-w-6xl items-start gap-14 px-6 py-20 lg:grid-cols-[360px_1fr] lg:gap-16">

          {/* ── Infos ── */}
          <div className="space-y-9">
            <div>
              <h2 className="mb-2 text-[22px] font-semibold tracking-[-0.01em]">Parlons de votre projet</h2>
              <p className="text-[15px] leading-relaxed text-[#9a9a9a]">
                Démo, devis, support ou simple question : on répond en français, par une équipe qui connaît votre réalité.
              </p>
            </div>

            <ul className="border-t border-white/10">
              {CONTACT_INFO.map(({ icon: Icon, label, value, href }) => (
                <li key={label} className="flex items-center gap-4 border-b border-white/10 py-4">
                  <Icon size={18} style={{ color: ACCENT }} className="shrink-0" />
                  <div>
                    <div className="mb-0.5 text-[12px] font-medium text-[#6f6f6f]">{label}</div>
                    {href ? (
                      <a href={href} className="text-[15px] font-medium text-[#F2F2F2] underline-offset-4 hover:underline">
                        {value}
                      </a>
                    ) : (
                      <span className="text-[15px] text-[#d6d6d6]">{value}</span>
                    )}
                  </div>
                </li>
              ))}
            </ul>

            <p className="text-[14px] leading-relaxed text-[#9a9a9a]">
              En cas d’urgence, appelez-nous au{' '}
              <a href="tel:+242064133693" className="font-semibold text-[#F2F2F2] underline-offset-4 hover:underline">
                +242 06 413 36 93
              </a>.
            </p>

            <div>
              <p className="mb-3 text-[12px] font-semibold uppercase tracking-[0.12em] text-[#6f6f6f]">Liens utiles</p>
              <div className="space-y-2.5">
                {QUICK_LINKS.map((lk) => (
                  <Link
                    key={lk.label}
                    href={lk.href}
                    className="flex items-center gap-2 text-[14px] text-[#9a9a9a] transition-colors hover:text-[#F2F2F2]"
                  >
                    <ArrowRight size={13} style={{ color: ACCENT }} /> {lk.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* ── Formulaire ── */}
          <div className="rounded-2xl border border-white/[0.08] bg-[#0c0c0d] p-7 sm:p-10">
            {status === 'success' ? (
              <div className="py-10 text-center">
                <div
                  className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full border"
                  style={{ borderColor: `${ACCENT}55`, background: `${ACCENT}14` }}
                >
                  <CheckCircle2 size={28} style={{ color: ACCENT }} />
                </div>
                <h3 className="mb-3 text-[22px] font-semibold">Message envoyé</h3>
                <p className="mb-2 text-[15px] leading-relaxed text-[#9a9a9a]">
                  Merci <strong className="text-[#F2F2F2]">{form.name}</strong>. Notre équipe vous répondra sous 24 h à{' '}
                  <span style={{ color: ACCENT }}>{form.email}</span>.
                </p>
                <p className="mb-8 text-[13px] text-[#6f6f6f]">
                  {followUp?.emailSent
                    ? 'Le lien privé de suivi vous a été envoyé par e-mail.'
                    : 'Conservez le lien ci-dessous pour lire nos réponses et poursuivre la conversation.'}
                </p>
                {followUp?.trackingPath?.startsWith('/contact/suivi#') && (
                  <p className="mb-6">
                    <Link href={followUp.trackingPath} className="text-[14px] underline underline-offset-4" style={{ color: ACCENT }}>
                      Ouvrir ma conversation privée avec le support
                    </Link>
                  </p>
                )}
                <button
                  type="button"
                  onClick={reset}
                  className="rounded-xl border border-white/10 px-5 py-2.5 text-[14px] font-medium text-[#d6d6d6] transition-colors hover:border-white/25 hover:bg-white/[0.04]"
                >
                  Envoyer un autre message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                <div>
                  <h3 className="mb-1 text-[20px] font-semibold">Écrivez-nous</h3>
                  <p className="text-[13px] text-[#6f6f6f]">Les champs * sont obligatoires.</p>
                  <Link href="/assistance" className="mt-1 inline-block text-[13px] text-[#9a9a9a] underline underline-offset-4 hover:text-[#F2F2F2]">
                    Déjà un compte ? Retrouvez vos conversations avec le support.
                  </Link>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field label="Nom complet *">
                    <input value={form.name} onChange={set('name')} required placeholder="Jean-Pierre M." autoComplete="name" />
                  </Field>
                  <Field label="Email *">
                    <input type="email" value={form.email} onChange={set('email')} required placeholder="drh@entreprise.com" autoComplete="email" />
                  </Field>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field label="Entreprise">
                    <input value={form.company} onChange={set('company')} placeholder="Nom de votre société" autoComplete="organization" />
                  </Field>
                  <Field label="Téléphone">
                    <input type="tel" value={form.phone} onChange={set('phone')} placeholder="+242 0X XXX XXXX" autoComplete="tel" />
                  </Field>
                </div>

                <Field label="Sujet *">
                  <select value={form.subject} onChange={set('subject')} required>
                    <option value="" disabled>Choisissez un sujet</option>
                    {SUBJECTS.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </Field>

                <Field label="Message *">
                  <textarea
                    value={form.message}
                    onChange={set('message')}
                    required
                    rows={5}
                    placeholder="Décrivez votre besoin. Plus vous êtes précis, mieux nous pourrons vous aider."
                  />
                </Field>

                {(status === 'error' || errMsg) && (
                  <div role="alert" className="flex items-start gap-3 rounded-xl border border-red-500/25 bg-red-500/[0.08] p-3.5 text-[14px] text-red-300">
                    <AlertCircle size={15} className="mt-0.5 shrink-0" />
                    <span>{errMsg}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={status === 'loading'}
                  className="flex w-full items-center justify-center gap-2.5 rounded-xl bg-[#FAFAFA] py-3.5 text-[15px] font-semibold text-black transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {status === 'loading'
                    ? <><Loader2 size={16} className="animate-spin" /> Envoi en cours…</>
                    : <><Send size={15} /> Envoyer le message</>}
                </button>

                <p className="text-center text-[12.5px] text-[#6f6f6f]">
                  En envoyant ce message, vous acceptez notre{' '}
                  <Link href="/privacy" className="text-[#9a9a9a] underline underline-offset-4 hover:text-[#F2F2F2]">
                    politique de confidentialité
                  </Link>.
                </p>
              </form>
            )}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

// ─── Champ : label relié à son champ (clic sur le label = focus) ─────────────
function Field({ label, children }: { label: string; children: React.ReactElement }) {
  const id = React.useId();
  const isSelect = children.type === 'select';
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-[13px] font-medium text-[#9a9a9a]">{label}</label>
      {React.cloneElement(children, {
        id,
        style: isSelect
          ? {
              backgroundImage:
                "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%239a9a9a' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'><path d='M6 9l6 6 6-6'/></svg>\")",
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 14px center',
              paddingRight: 40,
            }
          : undefined,
        className: [
          'w-full rounded-xl border border-white/10 bg-[#050607] px-4 py-3',
          'font-[inherit] text-[15px] text-[#F2F2F2] placeholder:text-[#5a5a5a]',
          'outline-none transition-colors focus:border-[#FF9A62]/60',
          children.type === 'textarea' ? 'min-h-[110px] resize-y' : '',
          isSelect ? 'cursor-pointer appearance-none' : '',
          children.props.className || '',
        ].join(' '),
      })}
    </div>
  );
}