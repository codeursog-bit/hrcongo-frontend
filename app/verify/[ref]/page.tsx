'use client';

// ============================================================================
// Page publique de vérification de certificat
// Route : /verify/[ref]  — aucun JWT requis
// Appel  : GET /training/verify/:ref
// ============================================================================

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

// ─── Types ────────────────────────────────────────────────────────────────────

interface CertResult {
  valid:           boolean;
  message?:        string;
  ref?:            string;
  employeeName?:   string;
  position?:       string;
  department?:     string;
  company?:        string;
  companyLogo?:    string;
  courseTitle?:    string;
  durationHours?:  number;
  providerName?:   string;
  format?:         string;
  mention?:        string;
  validationNote?: string;
  validatedBy?:    string;
  validatedAt?:    string;
  verifiedAt?:     string;
}

// ─── Config mentions ──────────────────────────────────────────────────────────

const MENTION_CFG: Record<string, {
  border: string; text: string; bg: string; glow: string; stars: number;
}> = {
  'Satisfaisant': { border:'#64748b', text:'#94a3b8', bg:'rgba(100,116,139,0.08)', glow:'rgba(100,116,139,0.12)', stars: 1 },
  'Bien':         { border:'#16a34a', text:'#4ade80', bg:'rgba(22,163,74,0.08)',   glow:'rgba(74,222,128,0.12)',  stars: 2 },
  'Très Bien':    { border:'#2563eb', text:'#60a5fa', bg:'rgba(37,99,235,0.08)',   glow:'rgba(96,165,250,0.15)',  stars: 3 },
  'Excellent':    { border:'#d97706', text:'#fbbf24', bg:'rgba(217,119,6,0.08)',   glow:'rgba(251,191,36,0.2)',   stars: 4 },
};

const FORMAT_LABELS: Record<string, string> = {
  ONLINE:    'En ligne',
  IN_PERSON: 'Présentiel',
  HYBRID:    'Hybride',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmtDate = (d?: string) =>
  d ? new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' }) : '—';

// ─── Composants atomiques ─────────────────────────────────────────────────────

function InfoCell({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div style={{
      padding: '14px 16px',
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(255,255,255,0.06)',
      borderRadius: '12px',
    }}>
      <p style={{ margin: 0, fontSize: '10px', letterSpacing: '2px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.25)', fontFamily: 'monospace' }}>{label}</p>
      <p style={{ margin: '4px 0 0', fontSize: '14px', fontWeight: 600, color: 'rgba(255,255,255,0.85)' }}>{value ?? '—'}</p>
    </div>
  );
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      padding: '3px 10px',
      background: 'rgba(255,255,255,0.05)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: '999px',
      fontSize: '11px', color: 'rgba(255,255,255,0.45)',
      fontFamily: 'monospace',
    }}>
      {children}
    </span>
  );
}

// ─── Page principale ──────────────────────────────────────────────────────────

export default function VerifyCertificatePage() {
  const params  = useParams();
  const ref     = (params?.ref ?? '') as string;

  const [result,  setResult]  = useState<CertResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied,  setCopied]  = useState(false);

  // ── Fetch ────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!ref) { setLoading(false); return; }
    const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';
    fetch(`${API}/training/verify/${encodeURIComponent(ref)}`)
      .then(r => r.json())
      .then(setResult)
      .catch(() => setResult({ valid: false, message: 'Impossible de joindre le serveur.' }))
      .finally(() => setLoading(false));
  }, [ref]);

  const mc = result?.mention ? (MENTION_CFG[result.mention] ?? MENTION_CFG['Satisfaisant']) : null;

  const handleCopy = () => {
    navigator.clipboard?.writeText(result?.ref ?? ref);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ── Rendu ────────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes spin  { to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:none; } }
        @keyframes pulse  { 0%,100% { opacity:.6; } 50% { opacity:1; } }
        .card-anim { animation: fadeUp .5s ease both; }
        .star-anim { animation: pulse 2s ease-in-out infinite; }
        @media (max-width: 600px) { .grid-2 { grid-template-columns: 1fr !important; } }
      `}</style>

      <div style={{
        minHeight: '100vh',
        background: '#030712',
        fontFamily: "'Georgia', 'Times New Roman', serif",
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        padding: '3rem 1rem 5rem',
        position: 'relative', overflow: 'hidden',
      }}>

        {/* ── Grille de fond ── */}
        <div style={{
          position: 'fixed', inset: 0, pointerEvents: 'none',
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.018) 1px, transparent 1px),' +
            'linear-gradient(90deg, rgba(255,255,255,0.018) 1px, transparent 1px)',
          backgroundSize: '52px 52px',
        }} />

        {/* ── Halo doré centré ── */}
        <div style={{
          position: 'fixed', top: '25%', left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '700px', height: '500px',
          background: 'radial-gradient(ellipse, rgba(251,191,36,0.04) 0%, transparent 65%)',
          pointerEvents: 'none',
        }} />

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div style={{ textAlign: 'center', marginBottom: '2.5rem', position: 'relative', zIndex: 1 }}>

          {/* Logo pill */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: '999px', padding: '6px 16px',
            marginBottom: '1.25rem',
          }}>
            <span>🇨🇬</span>
            <span style={{ fontSize: '11px', letterSpacing: '3px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', fontFamily: 'monospace' }}>
              HRCongo
            </span>
          </div>

          <h1 style={{
            fontSize: 'clamp(1.4rem, 4vw, 2.2rem)',
            fontWeight: 700, letterSpacing: '-0.02em',
            color: '#fff', lineHeight: 1.15,
          }}>
            Vérification de Certificat
          </h1>
          <p style={{ marginTop: '8px', fontSize: '12px', color: 'rgba(255,255,255,0.25)', fontFamily: 'monospace', letterSpacing: '1px' }}>
            Système officiel — Loi 45-75 du Code du Travail
          </p>

          {/* Réf affichée */}
          {ref && (
            <div style={{
              marginTop: '1rem',
              display: 'inline-block',
              padding: '5px 14px',
              background: 'rgba(251,191,36,0.06)',
              border: '1px solid rgba(251,191,36,0.15)',
              borderRadius: '8px',
              fontFamily: 'monospace', fontSize: '12px',
              color: 'rgba(251,191,36,0.6)', letterSpacing: '1px',
            }}>
              {ref}
            </div>
          )}
        </div>

        {/* ── Contenu principal ───────────────────────────────────────────── */}
        <div style={{ width: '100%', maxWidth: '660px', position: 'relative', zIndex: 1 }}>

          {/* ── Chargement ── */}
          {loading && (
            <div style={{
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: '20px', padding: '4rem 2rem', textAlign: 'center',
            }}>
              <div style={{
                width: '44px', height: '44px', margin: '0 auto 1.5rem',
                border: '3px solid rgba(251,191,36,0.15)',
                borderTopColor: '#fbbf24', borderRadius: '50%',
                animation: 'spin 0.9s linear infinite',
              }} />
              <p style={{ fontFamily: 'monospace', fontSize: '11px', letterSpacing: '3px', color: 'rgba(255,255,255,0.3)' }}>
                VÉRIFICATION EN COURS…
              </p>
            </div>
          )}

          {/* ── Certificat INVALIDE ── */}
          {!loading && result && !result.valid && (
            <div className="card-anim" style={{
              background: 'rgba(239,68,68,0.04)',
              border: '1px solid rgba(239,68,68,0.18)',
              borderRadius: '20px', padding: '3rem 2rem', textAlign: 'center',
            }}>
              <div style={{
                width: '64px', height: '64px', margin: '0 auto 1.25rem',
                background: 'rgba(239,68,68,0.1)', borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '28px', color: '#f87171',
              }}>✗</div>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: '#f87171', marginBottom: '0.75rem' }}>
                Certificat non valide
              </h2>
              <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.35)', lineHeight: 1.6 }}>
                {result.message ?? 'Ce certificat est introuvable dans notre base de données ou a été révoqué.'}
              </p>
              <div style={{
                marginTop: '2rem', padding: '10px 14px',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: '10px',
                fontFamily: 'monospace', fontSize: '11px',
                color: 'rgba(255,255,255,0.2)', wordBreak: 'break-all',
              }}>
                REF VÉRIFIÉE : {ref || '—'}
              </div>
            </div>
          )}

          {/* ── Certificat VALIDE ── */}
          {!loading && result?.valid && (
            <div className="card-anim" style={{
              background: 'rgba(255,255,255,0.015)',
              border: '1px solid rgba(255,215,0,0.12)',
              borderRadius: '20px', overflow: 'hidden',
              boxShadow: '0 0 80px rgba(251,191,36,0.04)',
            }}>

              {/* Ligne dorée haute */}
              <div style={{ height: '3px', background: 'linear-gradient(90deg, transparent 0%, #b45309 20%, #fbbf24 50%, #b45309 80%, transparent 100%)' }} />

              {/* ── Bandeau statut ── */}
              <div style={{
                padding: '18px 24px',
                background: 'rgba(34,197,94,0.04)',
                borderBottom: '1px solid rgba(34,197,94,0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width: '36px', height: '36px', flexShrink: 0,
                    background: 'rgba(34,197,94,0.12)',
                    border: '1px solid rgba(34,197,94,0.3)',
                    borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '16px', color: '#4ade80',
                  }}>✓</div>
                  <div>
                    <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '2px', color: '#4ade80', fontFamily: 'monospace', textTransform: 'uppercase' }}>
                      Authentique et valide
                    </p>
                    <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.25)', fontFamily: 'monospace', marginTop: '2px' }}>
                      Vérifié le {fmtDate(result.verifiedAt)}
                    </p>
                  </div>
                </div>

                {/* Entreprise */}
                {result.companyLogo ? (
                  <img src={result.companyLogo} alt={result.company}
                    style={{ height: '30px', objectFit: 'contain', opacity: 0.7 }} />
                ) : result.company ? (
                  <span style={{ fontSize: '12px', fontFamily: 'monospace', color: 'rgba(255,255,255,0.3)', fontWeight: 700 }}>
                    {result.company}
                  </span>
                ) : null}
              </div>

              {/* ── Corps ── */}
              <div style={{ padding: '28px 24px' }}>

                {/* Nom employé */}
                <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                  <p style={{ fontSize: '11px', letterSpacing: '3px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.25)', fontFamily: 'monospace', marginBottom: '8px' }}>
                    Décerné à
                  </p>
                  <h2 style={{ fontSize: 'clamp(1.6rem, 5vw, 2.6rem)', fontWeight: 700, color: '#fff', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
                    {result.employeeName}
                  </h2>
                  {(result.position || result.department) && (
                    <p style={{ marginTop: '6px', fontSize: '13px', color: 'rgba(255,255,255,0.35)', fontStyle: 'italic' }}>
                      {[result.position, result.department].filter(Boolean).join(' — ')}
                    </p>
                  )}
                </div>

                {/* Séparateur */}
                <div style={{ height: '1px', background: 'linear-gradient(90deg, transparent, rgba(251,191,36,0.25), transparent)', margin: '0 16px 24px' }} />

                {/* Formation */}
                <div style={{
                  background: 'rgba(125,211,252,0.04)',
                  border: '1px solid rgba(125,211,252,0.1)',
                  borderRadius: '14px', padding: '16px 18px', marginBottom: '16px',
                }}>
                  <p style={{ fontSize: '10px', letterSpacing: '2px', textTransform: 'uppercase', color: 'rgba(125,211,252,0.4)', fontFamily: 'monospace', marginBottom: '6px' }}>
                    Formation certifiée
                  </p>
                  <p style={{ fontSize: '1.05rem', fontWeight: 700, color: '#7dd3fc', lineHeight: 1.3, marginBottom: '10px' }}>
                    {result.courseTitle}
                  </p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {result.format    && <Pill>{FORMAT_LABELS[result.format] ?? result.format}</Pill>}
                    {result.durationHours && <Pill>{result.durationHours}h</Pill>}
                    {result.providerName  && <Pill>{result.providerName}</Pill>}
                  </div>
                </div>

                {/* Mention */}
                {result.mention && mc && (
                  <div style={{
                    background: mc.bg,
                    border: `1px solid ${mc.border}`,
                    borderRadius: '14px', padding: '14px 18px',
                    marginBottom: '16px',
                    boxShadow: `0 0 24px ${mc.glow}`,
                    display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {Array.from({ length: mc.stars }).map((_, i) => (
                        <span key={i} className="star-anim" style={{ fontSize: '16px', color: mc.text, animationDelay: `${i * 0.15}s` }}>★</span>
                      ))}
                    </div>
                    <div>
                      <p style={{ fontSize: '10px', letterSpacing: '2px', color: mc.text, fontFamily: 'monospace', opacity: 0.7 }}>MENTION</p>
                      <p style={{ fontSize: '1rem', fontWeight: 700, color: mc.text }}>{result.mention}</p>
                    </div>
                    {result.validationNote && (
                      <p style={{
                        marginLeft: 'auto', fontSize: '12px', fontStyle: 'italic',
                        color: 'rgba(255,255,255,0.35)',
                        borderLeft: `1px solid ${mc.border}30`,
                        paddingLeft: '12px', maxWidth: '200px',
                      }}>
                        "{result.validationNote}"
                      </p>
                    )}
                  </div>
                )}

                {/* Grille infos */}
                <div className="grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
                  <InfoCell label="Date de validation"  value={fmtDate(result.validatedAt)} />
                  <InfoCell label="Validé par"          value={result.validatedBy} />
                </div>

                {/* Référence + copier */}
                <div style={{
                  background: 'rgba(251,191,36,0.03)',
                  border: '1px solid rgba(251,191,36,0.1)',
                  borderRadius: '12px', padding: '14px 16px',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap',
                }}>
                  <div>
                    <p style={{ fontSize: '10px', letterSpacing: '2px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.2)', fontFamily: 'monospace', marginBottom: '4px' }}>
                      Référence officielle
                    </p>
                    <p style={{ fontFamily: 'monospace', fontSize: '13px', fontWeight: 700, color: 'rgba(251,191,36,0.65)', letterSpacing: '1px', wordBreak: 'break-all' }}>
                      {result.ref}
                    </p>
                  </div>
                  <button
                    onClick={handleCopy}
                    style={{
                      padding: '7px 14px',
                      background: copied ? 'rgba(34,197,94,0.1)' : 'rgba(255,255,255,0.05)',
                      border: `1px solid ${copied ? 'rgba(34,197,94,0.3)' : 'rgba(255,255,255,0.1)'}`,
                      borderRadius: '8px', cursor: 'pointer',
                      color: copied ? '#4ade80' : 'rgba(255,255,255,0.4)',
                      fontSize: '11px', fontFamily: 'monospace',
                      transition: 'all 0.2s', whiteSpace: 'nowrap',
                    }}
                  >
                    {copied ? '✓ Copié' : 'Copier'}
                  </button>
                </div>
              </div>

              {/* ── Pied de carte ── */}
              <div style={{
                padding: '12px 24px',
                borderTop: '1px solid rgba(255,255,255,0.04)',
                background: 'rgba(255,255,255,0.01)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px',
              }}>
                <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.15)', fontFamily: 'monospace' }}>
                  🇨🇬 HRCongo — Académie de Formation
                </span>
                <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.15)', fontFamily: 'monospace' }}>
                  République du Congo
                </span>
              </div>

              {/* Ligne dorée basse */}
              <div style={{ height: '3px', background: 'linear-gradient(90deg, transparent 0%, #b45309 20%, #fbbf24 50%, #b45309 80%, transparent 100%)' }} />
            </div>
          )}

          {/* ── Lien retour ── */}
          <div style={{ textAlign: 'center', marginTop: '2.5rem' }}>
            <a href="/" style={{
              color: 'rgba(255,255,255,0.18)', fontSize: '12px',
              textDecoration: 'none', fontFamily: 'monospace', letterSpacing: '1px',
              transition: 'color 0.2s',
            }}
              onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.5)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.18)')}
            >
              ← Retour à HRCongo
            </a>
          </div>
        </div>
      </div>
    </>
  );
}