'use client';

// ============================================================================
// 📁 app/verify/[ref]/page.tsx — Vérification publique d'un certificat de formation
// Route : /verify/[ref] — aucun JWT requis. Appel : GET /training/verify/:ref
// Page de vérification Konza : logo Konza en haut. Le logo de l'entreprise
// concernée apparaît dans le certificat lui-même.
// ============================================================================

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Check, Loader2, Star, X } from 'lucide-react';

interface CertResult {
  valid: boolean; message?: string; ref?: string; employeeName?: string; position?: string; department?: string;
  company?: string; companyLogo?: string; courseTitle?: string; durationHours?: number; providerName?: string;
  format?: string; mention?: string; validationNote?: string; validatedBy?: string; validatedAt?: string; verifiedAt?: string;
}

const ACCENT = '#FF9A62';

const MENTION_CFG: Record<string, { color: string; stars: number }> = {
  'Satisfaisant': { color: '#9a9a9a', stars: 1 },
  'Bien':         { color: '#4ade80', stars: 2 },
  'Très Bien':    { color: '#60a5fa', stars: 3 },
  'Excellent':    { color: ACCENT,   stars: 4 },
};

const FORMAT_LABELS: Record<string, string> = { ONLINE: 'En ligne', IN_PERSON: 'Présentiel', HYBRID: 'Hybride' };

const fmtDate = (d?: string) =>
  d ? new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' }) : '—';

const labelCls = 'text-[11px] font-semibold uppercase tracking-[0.12em] text-[#6f6f6f]';

function InfoCell({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div className="rounded-xl border border-white/[0.08] p-4">
      <p className={labelCls}>{label}</p>
      <p className="mt-1 text-[14.5px] font-semibold text-[#F2F2F2]">{value ?? '—'}</p>
    </div>
  );
}

export default function VerifyCertificatePage() {
  const params = useParams();
  const ref = (params?.ref ?? '') as string;

  const [result, setResult] = useState<CertResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!ref) { setLoading(false); return; }
    const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';
    fetch(`${API}/training/verify/${encodeURIComponent(ref)}`)
      .then((r) => r.json())
      .then(setResult)
      .catch(() => setResult({ valid: false, message: 'Impossible de joindre le serveur.' }))
      .finally(() => setLoading(false));
  }, [ref]);

  const mc = result?.mention ? (MENTION_CFG[result.mention] ?? MENTION_CFG['Satisfaisant']) : null;

  const handleCopy = async () => {
    try { await navigator.clipboard.writeText(result?.ref ?? ref); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { /* presse-papiers indisponible */ }
  };

  return (
    <div className="min-h-screen bg-[#050607] px-4 pb-20 pt-10 font-sans text-[#F2F2F2]">
      <div className="mx-auto max-w-[660px]">

        {/* En-tête : logo Konza */}
        <header className="mb-10 text-center">
          <Link href="/" aria-label="Konza RH, accueil" className="mb-8 inline-block">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logos/konza_logo_h_white.png" alt="Konza RH" className="h-9 w-auto" />
          </Link>
          <h1 className="text-[30px] font-bold tracking-[-0.025em] sm:text-[38px]">Vérification de certificat</h1>
          <p className="mt-2 text-[14px] text-[#9a9a9a]">Contrôlez l’authenticité d’un certificat de formation Konza RH.</p>
          {ref && (
            <div className="mt-5 inline-block rounded-lg border border-white/10 px-3.5 py-1.5 font-mono text-[12.5px] tracking-wide" style={{ color: ACCENT }}>
              {ref}
            </div>
          )}
        </header>

        {/* Chargement */}
        {loading && (
          <div role="status" className="rounded-2xl border border-white/[0.08] bg-[#0c0c0d] px-6 py-16 text-center">
            <Loader2 size={32} className="mx-auto mb-5 animate-spin" style={{ color: ACCENT }} />
            <p className={labelCls}>Vérification en cours…</p>
          </div>
        )}

        {/* Certificat invalide */}
        {!loading && result && !result.valid && (
          <div role="alert" className="rounded-2xl border border-red-500/25 bg-red-500/[0.04] px-6 py-12 text-center">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10"><X size={28} className="text-red-400" /></div>
            <h2 className="mb-3 text-[22px] font-semibold text-red-300">Certificat non valide</h2>
            <p className="text-[14.5px] leading-relaxed text-[#9a9a9a]">
              {result.message ?? 'Ce certificat est introuvable dans notre base de données ou a été révoqué.'}
            </p>
            <div className="mt-8 break-all rounded-xl border border-white/[0.08] px-4 py-2.5 font-mono text-[11.5px] text-[#6f6f6f]">
              Référence vérifiée : {ref || '—'}
            </div>
          </div>
        )}

        {/* Certificat valide */}
        {!loading && result?.valid && (
          <article className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0c0c0d]">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.08] bg-green-500/[0.05] px-6 py-4">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-green-400/30 bg-green-400/10"><Check size={17} className="text-green-400" /></span>
                <div>
                  <p className="text-[12px] font-bold uppercase tracking-[0.12em] text-green-400">Authentique et valide</p>
                  <p className="mt-0.5 text-[12px] text-[#6f6f6f]">Vérifié le {fmtDate(result.verifiedAt)}</p>
                </div>
              </div>

              {/* Entreprise concernée : son logo */}
              {result.companyLogo ? (
                <span className="flex h-10 items-center rounded-lg bg-white px-2.5">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={result.companyLogo} alt={result.company} className="h-7 w-auto object-contain" />
                </span>
              ) : result.company ? (
                <span className="text-[13px] font-semibold text-[#9a9a9a]">{result.company}</span>
              ) : null}
            </div>

            <div className="space-y-4 px-6 py-8">
              <div className="mb-2 text-center">
                <p className={`${labelCls} mb-2`}>Décerné à</p>
                <h2 className="text-[clamp(1.6rem,5vw,2.5rem)] font-bold leading-[1.1] tracking-[-0.02em]">{result.employeeName}</h2>
                {(result.position || result.department) && (
                  <p className="mt-2 text-[14px] text-[#9a9a9a]">{[result.position, result.department].filter(Boolean).join(' · ')}</p>
                )}
              </div>

              <div className="rounded-xl border border-white/[0.08] p-5">
                <p className={`${labelCls} mb-2`}>Formation certifiée</p>
                <p className="mb-3 text-[18px] font-semibold leading-snug" style={{ color: ACCENT }}>{result.courseTitle}</p>
                <div className="flex flex-wrap gap-2 text-[12px] text-[#9a9a9a]">
                  {result.format && <span className="rounded-full border border-white/10 px-3 py-1">{FORMAT_LABELS[result.format] ?? result.format}</span>}
                  {result.durationHours && <span className="rounded-full border border-white/10 px-3 py-1">{result.durationHours} h</span>}
                  {result.providerName && <span className="rounded-full border border-white/10 px-3 py-1">{result.providerName}</span>}
                </div>
              </div>

              {result.mention && mc && (
                <div className="flex flex-wrap items-center gap-4 rounded-xl border p-4" style={{ borderColor: `${mc.color}55`, background: `${mc.color}0f` }}>
                  <div className="flex gap-1" aria-hidden>
                    {Array.from({ length: mc.stars }).map((_, i) => <Star key={i} size={16} fill={mc.color} stroke={mc.color} />)}
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.12em]" style={{ color: mc.color }}>Mention</p>
                    <p className="text-[17px] font-bold" style={{ color: mc.color }}>{result.mention}</p>
                  </div>
                  {result.validationNote && (
                    <p className="ml-auto max-w-[220px] border-l pl-4 text-[12.5px] italic text-[#9a9a9a]" style={{ borderColor: `${mc.color}44` }}>
                      « {result.validationNote} »
                    </p>
                  )}
                </div>
              )}

              <div className="grid gap-3 sm:grid-cols-2">
                <InfoCell label="Date de validation" value={fmtDate(result.validatedAt)} />
                <InfoCell label="Validé par" value={result.validatedBy} />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/[0.08] p-4">
                <div className="min-w-0">
                  <p className={`${labelCls} mb-1`}>Référence officielle</p>
                  <p className="break-all font-mono text-[13.5px] font-bold tracking-wide" style={{ color: ACCENT }}>{result.ref}</p>
                </div>
                <button type="button" onClick={handleCopy}
                  className="shrink-0 rounded-lg border border-white/10 px-4 py-2 text-[12.5px] font-medium transition-colors hover:border-white/25"
                  style={{ color: copied ? '#4ade80' : '#9a9a9a' }}>
                  {copied ? 'Copié' : 'Copier'}
                </button>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-white/[0.08] px-6 py-3 text-[12px] text-[#6f6f6f]">
              <span>Konza RH · Formation</span>
              <span>République du Congo</span>
            </div>
          </article>
        )}

        <div className="mt-10 text-center">
          <Link href="/" className="text-[13px] text-[#6f6f6f] transition-colors hover:text-[#F2F2F2]">← Retour à Konza RH</Link>
        </div>
      </div>
    </div>
  );
}