'use client';
// ============================================================================
// 📁 app/contact/page.tsx — Konza RH · Contact public
// Utilise api.ts (même pattern que authService / adminService)
// POST → NestJS /contact → email au SUPER_ADMIN
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
  { icon: Mail,    label: 'Email',         value: 'contact@konzarh.com',       href: 'mailto:contact@konzarh.com', color: 'text-emerald-400',   bg: 'bg-emerald-500/10'   },
  { icon: Phone,   label: 'Téléphone',     value: '+242 053 079 107',           href: 'tel:+242053079107',          color: 'text-emerald-400',bg: 'bg-emerald-500/10'},
  { icon: MapPin,  label: 'Adresse',       value: 'Pointe-Noire, Congo-Brazza.', href: null,                        color: 'text-slate-400', bg: 'bg-slate-400/10' },
  { icon: Clock,   label: 'Disponibilité', value: 'Lun–Ven, 8h–18h (heure CG)', href: null,                        color: 'text-orange-400', bg: 'bg-orange-500/10' },
];

const QUICK_LINKS = [
  { label: 'Voir la FAQ',               href: '/faq'           },
  { label: 'Consulter la documentation',href: '/docs'          },
  { label: 'Voir les tarifs',           href: '/tarifs'        },
  { label: 'Essai gratuit 14 jours',    href: '/auth/register' },
];

// ─── PAGE ─────────────────────────────────────────────────────────────────────
export default function ContactPage() {
  const [form, setForm] = useState<ContactPayload>({
    name: '', email: '', company: '', phone: '', subject: '', message: '',
  });
  const [status,  setStatus]  = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errMsg,  setErrMsg]  = useState('');

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
      // Utilise api.post de services/api.ts — credentials:include géré automatiquement
      await api.post<ContactResponse>('/contact', {
        name:    form.name.trim(),
        email:   form.email.trim().toLowerCase(),
        company: form.company?.trim() || undefined,
        phone:   form.phone?.trim()   || undefined,
        subject: form.subject,
        message: form.message.trim(),
      });
      setStatus('success');
    } catch (err: any) {
      setErrMsg(err.message || 'Une erreur est survenue. Réessayez ou contactez-nous directement.');
      setStatus('error');
    }
  }

  function reset() {
    setForm({ name:'', email:'', company:'', phone:'', subject:'', message:'' });
    setStatus('idle');
    setErrMsg('');
  }

  return (
    <div className="min-h-screen bg-[#050607] text-white font-sans overflow-x-hidden">
      {/* Fond (identique à la landing) */}
      <div className="fixed -right-40 -top-40 w-[600px] h-[600px] bg-white/[0.04] rounded-full blur-[130px] pointer-events-none z-0" />
      <div className="fixed -left-40 bottom-0 w-[500px] h-[500px] bg-[#D4A548]/[0.06] rounded-full blur-[130px] pointer-events-none z-0" />
      <div className="fixed inset-0 pointer-events-none z-0 opacity-[0.05]"
        style={{
          backgroundImage: `linear-gradient(to right, #fff 1px, transparent 1px), linear-gradient(to bottom, #fff 1px, transparent 1px)`,
          backgroundSize: '48px 48px',
        }}
      />

      <Navbar/>

      {/* ── HERO ────────────────────────────────────────────────────────────── */}
      <section className="relative pt-40 pb-20 px-8 text-center overflow-hidden z-10">
        <div className="max-w-2xl mx-auto relative">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-[11px] font-bold text-emerald-400 uppercase tracking-widest mb-6">
            // Contact
          </div>
          <h1 className="text-[clamp(32px,5vw,58px)] font-black tracking-tight leading-[1.1] mb-5">
            On vous répond<br/>
            <span className="bg-gradient-to-r from-emerald-400 to-emerald-600 bg-clip-text text-transparent">
              sous 24 heures.
            </span>
          </h1>
          <p className="text-lg text-slate-400 leading-relaxed">
            Une question sur la paie, un besoin de démo, un projet d'intégration ?<br/>
            Notre équipe à Pointe-Noire est là pour vous.
          </p>
        </div>
      </section>

      {/* ── MAIN ────────────────────────────────────────────────────────────── */}
      <section className="relative z-10 border-t border-white/5">
        <div className="max-w-[1160px] mx-auto px-8 py-20 grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-16 items-start">

          {/* ── Info ────────────────────────────────────────────────────────── */}
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-black text-white mb-2">Parlons de votre projet</h2>
              <p className="text-sm text-slate-400 leading-relaxed">
                Démo, devis, support ou simple question — on répond en français, par des Congolais qui connaissent votre réalité.
              </p>
            </div>

            {/* Infos de contact */}
            <div className="space-y-3">
              {CONTACT_INFO.map(item => {
                const Icon = item.icon;
                return (
                  <div key={item.label} className="flex items-center gap-4 p-4 bg-white/5 border border-white/7 rounded-xl">
                    <div className={`w-10 h-10 rounded-xl ${item.bg} flex items-center justify-center flex-shrink-0`}>
                      <Icon size={18} className={item.color}/>
                    </div>
                    <div>
                      <div className="text-[11px] text-slate-500 font-bold uppercase tracking-wide mb-0.5">{item.label}</div>
                      {item.href
                        ? <a href={item.href} className={`text-sm font-semibold ${item.color} no-underline hover:underline`}>{item.value}</a>
                        : <span className="text-sm text-slate-300">{item.value}</span>
                      }
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Disponibilité */}
            <div className="p-4 bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border border-emerald-500/20 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"/>
                <span className="text-xs font-bold text-emerald-400">Équipe disponible</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Temps de réponse moyen : <strong className="text-white">moins de 4h</strong> en journée.<br/>
                Urgences : <a href="tel:+242053079107" className="text-emerald-400 no-underline hover:underline font-bold">+242 053 079 107</a>
              </p>
            </div>

            {/* Liens rapides */}
            <div>
              <p className="text-[11px] text-slate-500 font-bold uppercase tracking-widest mb-3">Liens utiles</p>
              <div className="space-y-2">
                {QUICK_LINKS.map(lk => (
                  <Link key={lk.label} href={lk.href}
                    className="flex items-center gap-2 text-sm text-slate-400 hover:text-emerald-400 no-underline transition-colors">
                    <ArrowRight size={13}/> {lk.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* ── Formulaire ──────────────────────────────────────────────────── */}
          <div className="bg-[#0B0C0F] border border-white/7 rounded-2xl p-10">

            {/* Succès */}
            {status === 'success' ? (
              <div className="text-center py-10">
                <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-6">
                  <CheckCircle2 size={28} className="text-emerald-400"/>
                </div>
                <h3 className="text-xl font-black text-white mb-3">Message envoyé !</h3>
                <p className="text-sm text-slate-400 leading-relaxed mb-2">
                  Merci <strong className="text-white">{form.name}</strong>. Notre équipe vous répondra sous 24h à{' '}
                  <span className="text-emerald-400">{form.email}</span>.
                </p>
                <p className="text-xs text-slate-500 mb-8">
                  Vous recevrez également un email de confirmation.
                </p>
                <button onClick={reset}
                  className="px-5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-slate-300 font-semibold hover:bg-white/10 transition-all">
                  Envoyer un autre message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <h3 className="text-lg font-black text-white mb-1">Écrivez-nous</h3>
                  <p className="text-xs text-slate-500">Les champs * sont obligatoires.</p>
                </div>

                {/* Ligne 1 : Nom + Email */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Nom complet *">
                    <input value={form.name} onChange={set('name')} required placeholder="Jean-Pierre M."/>
                  </Field>
                  <Field label="Email *">
                    <input type="email" value={form.email} onChange={set('email')} required placeholder="drh@entreprise.com"/>
                  </Field>
                </div>

                {/* Ligne 2 : Entreprise + Téléphone */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Entreprise">
                    <input value={form.company} onChange={set('company')} placeholder="Nom de votre société"/>
                  </Field>
                  <Field label="Téléphone">
                    <input type="tel" value={form.phone} onChange={set('phone')} placeholder="+242 0X XXX XXXX"/>
                  </Field>
                </div>

                {/* Sujet */}
                <Field label="Sujet *">
                  <select value={form.subject} onChange={set('subject')} required>
                    <option value="" disabled>Choisissez un sujet</option>
                    {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </Field>

                {/* Message */}
                <Field label="Message *">
                  <textarea value={form.message} onChange={set('message')} required rows={5}
                    placeholder="Décrivez votre besoin en détail. Plus vous êtes précis, mieux nous pourrons vous aider."/>
                </Field>

                {/* Erreur */}
                {(status === 'error' || errMsg) && (
                  <div className="flex items-start gap-3 p-3.5 bg-red-500/8 border border-red-500/20 rounded-xl text-sm text-red-400">
                    <AlertCircle size={15} className="flex-shrink-0 mt-0.5"/>
                    <span>{errMsg}</span>
                  </div>
                )}

                {/* Submit */}
                <button type="submit" disabled={status === 'loading'}
                  className="w-full flex items-center justify-center gap-2.5 py-3.5 bg-gradient-to-r from-emerald-500 to-emerald-700 hover:from-emerald-400 hover:to-emerald-600 text-white font-black text-[15px] rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-500/20">
                  {status === 'loading'
                    ? <><Loader2 size={16} className="animate-spin"/> Envoi en cours...</>
                    : <><Send size={15}/> Envoyer le message</>
                  }
                </button>

                <p className="text-center text-xs text-slate-600">
                  En soumettant, vous acceptez notre{' '}
                  <Link href="/privacy" className="text-emerald-400 no-underline hover:underline">politique de confidentialité</Link>.
                </p>
              </form>
            )}
          </div>
        </div>
      </section>

      <Footer/>

      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        ::-webkit-scrollbar { width: 6px; background: #050607; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 3px; }
      `}</style>
    </div>
  );
}

// ─── Composant champ réutilisable ─────────────────────────────────────────────
function Field({ label, children }: { label: string; children: React.ReactElement }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-[13px] text-slate-400 font-medium">{label}</label>
      {React.cloneElement(children, {
        className: [
          'w-full px-4 py-3 bg-[#050607] border border-white/10 rounded-xl',
          'text-white text-[15px] placeholder:text-slate-600',
          'outline-none focus:border-emerald-500/50 transition-colors',
          'font-[inherit]',
          children.type === 'textarea' ? 'resize-y min-h-[110px]' : '',
          children.type === 'select'   ? 'appearance-none cursor-pointer' : '',
          children.props.className || '',
        ].join(' '),
      })}
    </div>
  );
}