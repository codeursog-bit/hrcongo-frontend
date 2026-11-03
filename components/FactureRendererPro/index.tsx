'use client';

// ============================================================================
// components/FactureRendererPro/index.tsx
//
// Gabarit « Facture professionnelle » (bleu marine / rouge) — reproduction
// fidèle du modèle Canva « Devis / facture simple professionnel illustratif
// bleu, blanc et rouge » fourni par le client, adaptée à la FACTURE DE PAIE
// (contrats PRESTATAIRE / CONSULTANT / INTERIM / STAGE).
//
// FIDÉLITÉ : toutes les cotes viennent du PDF d'origine, mesurées (pas
// estimées) — page A4 595,5 × 842,25 pt, vague = les 2 courbes de Bézier du
// PDF, cadre de tableau / barre Total rayon 11,25 pt, cadre de signature
// rayon 17,26 pt, traits 3 pt rognés à 1,5 pt visibles (mesuré), couleurs #272c57 / #bb0c19 / #bc1823, titres
// Roboto Bold (interlettrage 0,085 em), textes en Inter (police libre la plus
// proche de « Canva Sans », qui est propriétaire et n'est pas distribuable).
//
// DONNÉES : aucune donnée nouvelle — mêmes PayrollItem[] que les bulletins
// (classifyItems). Total brut = payroll.grossSalary et Net à payer =
// payroll.netSalary, tels que le back les a calculés (aucun recalcul front).
//
//   en-tête droite  : l'entreprise (logo, ou nom + secteur si pas de logo)
//   « Bénéficiaire »: la personne payée (adresse, téléphone, e-mail, NIU)
//   tableau         : gains imposables — Description / Prix unitaire /
//                     Quantité / Montant (Quantité = 1 si l'item n'en a pas,
//                     comme dans le modèle)
//   totaux          : Total brut, indemnités hors brut, retenues (BNC, avance,
//                     absence…) puis barre rouge « Net à payer »
//   bas de page     : moyen de paiement du bénéficiaire, période, date,
//                     signature
//
// Choisi via config.templateConfig.factureTemplateId === 'professionnelle'
// (FactureDisplay). Aucune migration : simple clé du Json existant.
// ============================================================================

import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { BulletinPayroll, BulletinTemplateConfig, PayrollItem } from '@/types/bulletin-template';
import { classifyItems } from '@/lib/bulletin-items-classifier';
import { formatQty, formatUnitBase } from '@/lib/bulletin-qty-format';

// ── Qui est l'émetteur (en-tête droite) ? ──────────────────────────────────
//  'company'  : l'entreprise émet le document (logo, coordonnées) et le
//               bénéficiaire (la personne payée) est dans le bloc « Bénéficiaire ».
//  'employee' : le prestataire émet (comme FactureRendererDetaillee) et
//               l'entreprise est le « Client ».
const ISSUER: 'company' | 'employee' = 'company';

// ── Constantes mesurées sur le PDF (points, origine en haut à gauche) ──────
const NAVY = '#272c57';
const RED = '#bb0c19';
const RED_OUTLINE = '#bc1823';
const PAGE_W = 595.5;
const PAGE_H = 842.25;
const CUR = '\u00a0FCFA';

const HEAD_FONT = "'Roboto','Helvetica Neue',Arial,sans-serif";
const BODY_FONT = "'Inter','Helvetica Neue',Arial,sans-serif";
// Polices libres (Roboto = police du modèle ; Inter = substitut de Canva Sans).
const FONT_IMPORT = "@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700&family=Roboto:wght@400;700&display=swap');";

// Décalage ligne de base → haut de la boîte avec line-height:1 (métriques hhea).
const BASE_K = { head: 0.8418, body: 0.8638 } as const;
const topFor = (baseline: number, size: number, f: keyof typeof BASE_K) => baseline - size * BASE_K[f];

const LS_HEAD = '0.085em';   // interlettrage des titres (mesuré : 0,085 em)
const LS_DESC = '0.11em';    // texte du tableau
const LS_NUM = '0.125em';    // chiffres du tableau

// Vague d'en-tête : courbes du PDF d'origine, telles quelles.
const WAVE_RED_D = 'M44.534 176.971 C44.534 176.971 136.594 199.069 329.445 89.728 C520.187 -18.413 639.476 130.904 639.476 130.904 L639.932 10.248 L47.836 20.793 L43.781 172.982 L44.534 176.971 Z';
const WAVE_NAVY_D = 'M639.932 131.491 L639.932 -2.928 L-56.862 -2.928 L-56.862 180.257 C-56.862 180.257 108.006 206.543 301.760 74.789 C495.514 -56.965 639.932 131.491 639.932 131.491 Z';

// ── Modèle de données (déjà formaté) — la mise en page n'a aucune logique métier ──
export interface ProInvoiceModel {
  title: string;
  issuer: { name: string; tagline?: string; logo?: string | null; lines: string[] };
  recipient: { label: string; name: string; lines: string[] };
  columns: { description: string; unit: string; qty: string; total: string };
  rows: { label: string; unit: string; qty: string; total: string }[];
  totals: { label: string; value: string }[];
  net: { label: string; value: string };
  payment: { heading: string; lines: string[] };
  terms: { heading: string; text: string };
  dateLabel: string;
  dateValue?: string;
  signatureLabel: string;
  signatureImage?: string | null;
}

// ── Géométrie du flux (dérivée du modèle) ───────────────────────────────────
const ROW_PITCH = 29.97;        // pas des lignes du tableau (modèle)
const ROWS_TOP = 351.0;         // haut de la 1re ligne
const TOTALS_PITCH = 26.9;      // pas des lignes de totaux (modèle)
const TOTALS_TOP = 500.59;      // haut du bloc de totaux (modèle)
const BAR_GAP = 12.77;          // totaux → barre rouge
const BAR_H = 28.81;
const BOTTOM_H = 120.92;        // cadre de signature (rectangle du tracé : le trait est rogné vers l'intérieur)
const PAD_BOTTOM = 72.04;
const PAD_MIN = 24;
const SPACER_MIN = 12;          // espace mini entre la barre rouge et le bas de page
// Cible de hauteur à l'écran : sous la zone imprimable A4 (841,9 pt), sinon une 2e page vide sort.
const FIT_H = 840;

// Mode compact (beaucoup de lignes) : mêmes polices, pas de lignes resserré.
const COMPACT = { row: 24, tot: 21.5, rowPad: '0.9pt 0 3pt', totPadL: '0.2pt', totPadV: '1.6pt' };

// Estimation du nombre de lignes de texte (largeur moyenne d'un caractère ≈ 0,62 em)
const linesFor = (text: string, widthPt: number, sizePt: number) =>
  Math.max(1, Math.ceil((text.length * 0.62 * sizePt) / widthPt));
const isLongLabel = (label: string) => label.length > 10;

function estimateFlow(rows: { label: string }[], totals: { label: string }[]) {
  const nRows = Math.max(rows.length, 1);
  // Compact si le modèle ne peut pas contenir les lignes (≈ 4 lignes + 5 totaux en pas normal)
  const compact = nRows * ROW_PITCH + 18 + totals.length * TOTALS_PITCH > 292;
  const rowPitch = compact ? COMPACT.row : ROW_PITCH;
  const totPitch = compact ? COMPACT.tot : TOTALS_PITCH;
  const rowsH = rows.reduce(
    (h, r) => h + Math.max(rowPitch, 1.12 + linesFor(r.label, 159.6, 11) * 13.2 + (compact ? 3 : 6)), 0);
  const anyLong = totals.some((t) => isLongLabel(t.label));
  const totalsH = totals.reduce(
    (h, t) => h + (anyLong
      ? Math.max(totPitch, 2.4 + linesFor(t.label, 194, 11) * 13.2)
      : totPitch), 0);
  const rowsEnd = ROWS_TOP + (rows.length ? rowsH : rowPitch);
  const totalsTop = compact ? rowsEnd + 14 : Math.max(rowsEnd + 18, TOTALS_TOP);
  const barBottom = totalsTop + totalsH + BAR_GAP + BAR_H;
  const avail = PAGE_H - (barBottom + 20 + BOTTOM_H);
  return {
    compact, rowPitch, totPitch,
    totalsGap: totalsTop - rowsEnd,
    padBottom: Math.min(PAD_BOTTOM, Math.max(PAD_MIN, avail)),
  };
}

// useLayoutEffect sans avertissement au rendu serveur
const useIsoLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

// ── Petits composants de placement (cotes en points) ───────────────────────
const Abs: React.FC<{
  x: number; baseline: number; size: number; font: keyof typeof BASE_K;
  weight?: number; color?: string; ls?: string; align?: 'left' | 'center' | 'right';
  style?: React.CSSProperties; children: React.ReactNode;
}> = ({ x, baseline, size, font, weight = 400, color = NAVY, ls = '0', align = 'left', style, children }) => {
  const base: React.CSSProperties = {
    position: 'absolute', top: `${topFor(baseline, size, font)}pt`,
    fontFamily: font === 'head' ? HEAD_FONT : BODY_FONT,
    fontSize: `${size}pt`, fontWeight: weight, color, lineHeight: 1,
    letterSpacing: ls, whiteSpace: 'nowrap',
  };
  if (align === 'left') base.left = `${x}pt`;
  if (align === 'right') base.right = `${PAGE_W - x}pt`;
  if (align === 'center') { base.left = `${x}pt`; base.transform = 'translateX(-50%)'; base.paddingLeft = ls; }
  return <div style={{ ...base, ...style }}>{children}</div>;
};

// Montant : le nombre à la taille du texte, « FCFA » en plus petit juste derrière
// (comme « € » collé dans le modèle) — tient dans la colonne même pour 7 chiffres.
const SUFFIX = '\u00a0FCFA';
const Money: React.FC<{ v: string }> = ({ v }) => {
  if (!v.endsWith(SUFFIX)) return <>{v}</>;
  return (
    <>
      {v.slice(0, -SUFFIX.length)}
      <span style={{ fontSize: '0.68em', letterSpacing: '0.05em', marginLeft: '0.28em' }}>FCFA</span>
    </>
  );
};

const Cell: React.FC<{ center?: boolean; num?: boolean; children?: React.ReactNode }> = ({ center, num, children }) => (
  <div style={{
    fontFamily: BODY_FONT, fontSize: '11pt', lineHeight: 1.2, color: NAVY,
    letterSpacing: num ? LS_NUM : LS_DESC, textAlign: center ? 'center' : 'left',
    paddingLeft: center ? (num ? LS_NUM : LS_DESC) : 0,
    ...(num ? { whiteSpace: 'nowrap' as const } : { overflowWrap: 'anywhere' as const }),
  }}>{children}</div>
);

// ═════════════════════════════════════════════════════════════════════════
// Mise en page pure
// ═════════════════════════════════════════════════════════════════════════
export function FactureProLayout({ model }: { model: ProInvoiceModel }) {
  const m = model;
  const flow = useMemo(() => estimateFlow(m.rows, m.totals), [m.rows, m.totals]);
  const anyLongTotal = m.totals.some((t) => isLongLabel(t.label));

  // Marge basse : part de l'estimation, puis s'ajuste à la hauteur RÉELLE mesurée
  // (libellés qui passent à la ligne…) pour que la facture tienne sur un A4.
  const pageRef = useRef<HTMLDivElement>(null);
  const spacerRef = useRef<HTMLDivElement>(null);
  const [padBottom, setPadBottom] = useState(flow.padBottom);
  useIsoLayoutEffect(() => { setPadBottom(flow.padBottom); }, [flow.padBottom, m]);
  useIsoLayoutEffect(() => {
    const page = pageRef.current;
    const spacer = spacerRef.current;
    if (!page || !spacer) return;
    // Hauteur NATURELLE du contenu = hauteur de page − espace extensible + son minimum
    // (la page a une hauteur minimale A4 : sans cela on confondrait « page courte » et « contenu long »).
    const PX = 0.75; // px → pt
    const natural = (page.getBoundingClientRect().height - spacer.getBoundingClientRect().height) * PX + SPACER_MIN;
    const over = natural - FIT_H;                       // > 0 : déborde de l'A4
    const next = Math.min(flow.padBottom, Math.max(PAD_MIN, padBottom - over));
    if (Math.abs(next - padBottom) > 0.25) setPadBottom(next);
  }, [padBottom, flow.padBottom, m]);
  const nameSize = Math.max(12, Math.min(27.2, 135 / (0.7 * Math.max(m.issuer.name.length, 1))));

  return (
    <>
      <style>{`
        ${FONT_IMPORT}
        @media print {
          @page { size: A4 portrait; margin: 0; }
          body { visibility: hidden !important; background: #fff !important; margin: 0 !important; padding: 0 !important; }
          #fac-pro-wrap, #fac-pro-wrap * { visibility: visible !important; }
          #fac-pro-wrap { position: absolute !important; top: 0 !important; left: 0 !important; width: 100% !important; }
          #fac-pro { box-shadow: none !important; min-height: 841pt !important; }
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        }
      `}</style>

      <div id="fac-pro-wrap" data-bulletin-root="true" style={{ background: '#fff' }}>
        <div id="fac-pro" ref={pageRef} style={{
          position: 'relative', width: `${PAGE_W}pt`, minHeight: `${PAGE_H}pt`, boxSizing: 'border-box',
          paddingBottom: `${padBottom}pt`, display: 'flex', flexDirection: 'column',
          background: '#fff', overflow: 'hidden', margin: '0 auto',
          boxShadow: '0 2px 16px rgba(0,0,0,0.10)', color: NAVY,
        }}>

          {/* ── Vague d'en-tête : courbes du PDF ───────────────────────── */}
          <svg width={`${PAGE_W}pt`} height="206.57pt" viewBox={`0 0 ${PAGE_W} 206.57`}
               style={{ position: 'absolute', left: 0, top: 0 }} aria-hidden="true">
            <path d={WAVE_RED_D} fill={RED} />
            <path d={WAVE_NAVY_D} fill={NAVY} />
          </svg>

          {/* ── Titre (blanc sur la vague) ──────────────────────────────── */}
          <Abs x={60.0} baseline={107.06} size={m.title.length > 24 ? Math.max(13, (18.6 * 24) / m.title.length) : 18.6}
               font="head" weight={700} color="#fff">{m.title}</Abs>

          {/* ── Émetteur : logo, sinon nom + secteur ────────────────────── */}
          {m.issuer.logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={m.issuer.logo} alt="" crossOrigin="anonymous" style={{
              position: 'absolute', left: '393.5pt', top: '64.8pt', width: '135pt', height: '57.5pt',
              objectFit: 'contain', objectPosition: 'right center',
            }} />
          ) : (
            <>
              <Abs x={527.5} baseline={102.73} size={nameSize} font="head" weight={700} align="right"
                   style={{ textTransform: 'uppercase' }}>{m.issuer.name}</Abs>
              {m.issuer.tagline && (
                <Abs x={522.9} baseline={112.81} size={8.5} font="body" align="right" ls="-0.03em">{m.issuer.tagline}</Abs>
              )}
            </>
          )}
          {m.issuer.lines.map((l, i) => (
            <Abs key={i} x={528.7} baseline={138.39 + 12 * i} size={11.2} font="body" align="right">{l}</Abs>
          ))}

          {/* ── Bénéficiaire / client ───────────────────────────────────── */}
          <Abs x={59.5} baseline={197.6} size={12.6} font="head" weight={700}>
            {m.recipient.label} {m.recipient.name}
          </Abs>
          {m.recipient.lines.map((l, i) => (
            <Abs key={i} x={59.5} baseline={222.19 + 12 * i} size={11.2} font="body">{l}</Abs>
          ))}

          {/* ── Espace jusqu'au tableau ─────────────────────────────────── */}
          <div style={{ height: '304.84pt', flex: 'none' }} />

          {/* ── En-tête du tableau : cadre arrondi, trait 3 pt ──────────── */}
          <div style={{ position: 'relative', height: '28.8pt', flex: 'none' }}>
            <div style={{
              position: 'absolute', left: '66.1pt', top: 0, width: '463.41pt', height: '28.8pt',
              boxSizing: 'border-box', border: `1.5pt solid ${RED_OUTLINE}`, borderRadius: '11.25pt',
            }} />
            <Abs x={85.3} baseline={323.03 - 304.84} size={12} font="head" weight={700} ls={LS_HEAD}>{m.columns.description}</Abs>
            <Abs x={291.5} baseline={323.03 - 304.84} size={12} font="head" weight={700} ls={LS_HEAD} align="center">{m.columns.unit}</Abs>
            <Abs x={396.55} baseline={323.03 - 304.84} size={12} font="head" weight={700} ls={LS_HEAD} align="center">{m.columns.qty}</Abs>
            <Abs x={489.55} baseline={323.03 - 304.84} size={12} font="head" weight={700} ls={LS_HEAD} align="center">{m.columns.total}</Abs>
          </div>

          {/* ── Lignes ───────────────────────────────────────────────────── */}
          <div style={{ marginTop: '17.36pt', flex: 'none' }}>
            {m.rows.map((r, i) => (
              <div key={i} style={{
                display: 'grid', gridTemplateColumns: '86.4pt 159.6pt 91pt 14pt 91pt 2pt 91pt 1fr',
                minHeight: `${flow.rowPitch}pt`, padding: flow.compact ? COMPACT.rowPad : '1.12pt 0 6pt', boxSizing: 'border-box',
              }}>
                <div />
                <Cell>{r.label}</Cell>
                <Cell center num><Money v={r.unit} /></Cell>
                <div />
                <Cell center num>{r.qty}</Cell>
                <div />
                <Cell center num><Money v={r.total} /></Cell>
                <div />
              </div>
            ))}
          </div>

          {/* ── Totaux (Total brut, indemnités, retenues) ───────────────── */}
          <div style={{ marginTop: `${flow.totalsGap}pt`, flex: 'none' }}>
            {m.totals.map((t, i) => {
              const long = anyLongTotal; // une seule présentation pour tout le bloc (sinon libellés désalignés)
              return (
                <div key={i} style={{
                  display: 'grid', gridTemplateColumns: long ? '250pt 194pt 91pt 1fr' : '356.6pt 87.4pt 91pt 1fr',
                  minHeight: `${flow.totPitch}pt`, boxSizing: 'border-box',
                }}>
                  <div />
                  <div style={{
                    fontFamily: HEAD_FONT, fontSize: long ? '11pt' : '14pt', lineHeight: 1.2, color: NAVY,
                    letterSpacing: LS_HEAD, paddingTop: long ? '2.4pt' : (flow.compact ? COMPACT.totPadL : '0.8pt'),
                  }}>{t.label}</div>
                  <div style={{
                    fontFamily: BODY_FONT, fontSize: '11pt', lineHeight: 1.2, color: NAVY, textAlign: 'center',
                    letterSpacing: LS_NUM, paddingLeft: LS_NUM, paddingTop: flow.compact ? COMPACT.totPadV : '2.67pt', whiteSpace: 'nowrap',
                  }}><Money v={t.value} /></div>
                  <div />
                </div>
              );
            })}
          </div>

          {/* ── Barre rouge : Net à payer ───────────────────────────────── */}
          <div style={{
            position: 'relative', flex: 'none', marginTop: `${BAR_GAP}pt`, marginLeft: '65.76pt',
            width: '463.5pt', height: `${BAR_H}pt`, background: RED, borderRadius: '11.25pt',
          }}>
            <div style={{
              position: 'absolute', left: '10.84pt', top: `${topFor(19.04, 15.2, 'head')}pt`,
              fontFamily: HEAD_FONT, fontWeight: 700, fontSize: '15.2pt', lineHeight: 1, color: '#fff',
              letterSpacing: LS_HEAD, whiteSpace: 'nowrap',
            }}>{m.net.label}</div>
            <div style={{
              position: 'absolute', right: '16.7pt', top: `${topFor(19.66, 15.1, 'body')}pt`,
              fontFamily: BODY_FONT, fontWeight: 700, fontSize: '15.1pt', lineHeight: 1, color: '#fff',
              letterSpacing: '0.089em', whiteSpace: 'nowrap',
            }}><Money v={m.net.value} /></div>
          </div>

          <div ref={spacerRef} style={{ flex: 1, minHeight: `${SPACER_MIN}pt` }} />

          {/* ── Bas de page : paiement, conditions, date / signature ────── */}
          <div style={{ position: 'relative', flex: 'none', height: `${BOTTOM_H}pt`, breakInside: 'avoid' }}>
            {/* positions relatives au haut du cadre (649,29 pt dans le modèle) */}
            <Abs x={60.9} baseline={10.83} size={12.2} font="head" weight={700}>{m.payment.heading}</Abs>
            <div style={{
              position: 'absolute', left: '60.9pt', width: '255pt', top: `${topFor(30.07, 10.2, 'body')}pt`,
              fontFamily: BODY_FONT, fontSize: '10.2pt', lineHeight: '12.76pt', color: NAVY, marginTop: '-1.3pt',
            }}>
              {m.payment.lines.map((l, i) => <div key={i}>{l}</div>)}
            </div>
            <Abs x={59.5} baseline={87.01} size={12.2} font="head" weight={700}>{m.terms.heading}</Abs>
            <div style={{
              position: 'absolute', left: '59.5pt', width: '255pt', top: `${topFor(106.23, 10.2, 'body') }pt`,
              fontFamily: BODY_FONT, fontSize: '10.2pt', lineHeight: '12.76pt', color: NAVY,
              marginTop: '-1.3pt',
            }}>{m.terms.text}</div>

            <div style={{
              position: 'absolute', left: '328.94pt', top: 0, width: '206.64pt', height: `${BOTTOM_H}pt`,
              boxSizing: 'border-box', border: `1.5pt solid ${RED}`, borderRadius: '17.26pt',
            }} />
            <Abs x={337.1} baseline={28.99} size={11.3} font="head" weight={700}>{m.dateLabel}</Abs>
            {m.dateValue && <Abs x={337.1 + 36} baseline={28.99} size={10.2} font="body">{m.dateValue}</Abs>}
            <Abs x={337.1} baseline={74.69} size={11.3} font="head" weight={700}>{m.signatureLabel}</Abs>
            {m.signatureImage && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={m.signatureImage} alt="" crossOrigin="anonymous" style={{
                position: 'absolute', left: '337.1pt', top: '82pt', height: '32pt', maxWidth: '180pt', objectFit: 'contain',
              }} />
            )}
          </div>
        </div>
      </div>
    </>
  );
}

// ═════════════════════════════════════════════════════════════════════════
// Adaptateur payroll → modèle (toute la logique métier est ici)
// ═════════════════════════════════════════════════════════════════════════
const MOIS = [
  'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
  'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre',
];
const CONTRACT: Record<string, string> = {
  CDI: 'CDI', CDD: 'CDD', STAGE: 'Stagiaire', CONSULTANT: 'Consultant',
  PRESTATAIRE: 'Prestataire', INTERIM: 'Intérimaire', FREELANCE: 'Freelance',
};

const nv = (v: any): number => { const x = Number(v); return Number.isFinite(x) ? x : 0; };
const clean = (s: string) => s.replace(/[\u202f\u00a0]/g, '\u00a0'); // espaces insécables universels (présents dans toutes les polices)
const money = (v: any) => clean(Math.round(nv(v)).toLocaleString('fr-FR')) + CUR;
const moneyUnit = (v: any) => clean(formatUnitBase(v)) + CUR;
const fmtDate = (d: any): string => {
  if (!d) return '';
  const x = new Date(d);
  return isNaN(x.getTime()) ? '' : x.toLocaleDateString('fr-FR');
};
const abbrevQualite = (q: string): string => {
  const word = (q || '').trim().split(/\s+/)[0] || '';
  if (!word) return '—';
  return word.charAt(0).toUpperCase() + word.slice(1, 3).toLowerCase();
};
const joinAddr = (...p: (string | null | undefined)[]) => p.map((x) => (x ?? '').trim()).filter(Boolean).join(', ');

function paymentBlock(e: any, payroll: any): { heading: string; lines: string[] } {
  const method = e.paymentMethod;
  const lines: string[] = [];
  if (method === 'BANK_TRANSFER') {
    lines.push('Paiement par virement bancaire');
    if (e.bankAccountNumber) lines.push(`Compte : ${[e.bankName, e.bankAccountNumber].filter(Boolean).join(' — ')}`);
  } else if (method === 'MOBILE_MONEY') {
    lines.push('Paiement par Mobile Money');
    if (e.mobileMoneyNumber) lines.push(`${e.mobileMoneyOperator || 'Numéro'} : ${e.mobileMoneyNumber}`);
  } else if (method === 'CHECK') {
    lines.push('Paiement par chèque');
  } else if (method === 'CASH') {
    lines.push('Paiement en espèces');
  }
  if (payroll.paymentReference) lines.push(`Référence : ${payroll.paymentReference}`);
  return { heading: 'Informations de paiement', lines };
}

export function buildProModel(payroll: BulletinPayroll, invoiceSequence = 1): ProInvoiceModel {
  const p = payroll as any;
  const e = (p.employee ?? {}) as any;
  const co = (p.company ?? {}) as any;
  const items: PayrollItem[] = p.items ?? [];
  const { gainItems, cotisItems, retenueItems, indemItems } = classifyItems(items);

  // Tableau : gains imposables (hors ABS_DEDUCT, traité comme une retenue)
  const rows = gainItems
    .filter((i: any) => i.code !== 'ABS_DEDUCT' && nv(i.amount) > 0)
    .map((i: any) => {
      const hasUnit = nv(i.quantity) > 0 && nv(i.base) > 0;
      return {
        label: i.label,
        unit: hasUnit ? moneyUnit(i.base) : money(i.amount),
        qty: hasUnit ? formatQty(i.quantity) : '1',
        total: money(i.amount),
      };
    });

  // Totaux : Total brut (back) → indemnités hors brut → retenues
  const absItems = gainItems.filter((i: any) => i.code === 'ABS_DEDUCT' && nv(i.amount) > 0);
  const deductions = [...absItems, ...cotisItems, ...retenueItems].filter((i: any) => nv(i.amount) > 0);
  const totals = [
    { label: 'Total brut', value: money(p.grossSalary) },
    ...indemItems.filter((i: any) => nv(i.amount) > 0).map((i: any) => ({ label: i.label, value: '+\u00a0' + money(i.amount) })),
    ...deductions.map((i: any) => ({ label: i.label, value: '\u2212\u00a0' + money(i.amount) })),
  ];

  const fullName = [e.firstName, e.lastName].filter(Boolean).join(' ') || '—';
  const qualite = e.position || CONTRACT[e.contractType ?? ''] || '—';
  const companyName = co.tradeName || co.legalName || '—';

  const personLines = [joinAddr(e.address, e.city), e.phone, e.email, e.niu ? `NIU : ${e.niu}` : ''].filter(Boolean) as string[];
  const companyLines = [joinAddr(co.address, co.city), co.phone, co.website || co.email].filter(Boolean) as string[];

  const issuer = ISSUER === 'company'
    ? { name: companyName, tagline: co.industry || undefined, logo: co.logo || null, lines: companyLines }
    : { name: fullName, tagline: qualite, logo: null, lines: personLines };
  const recipient = ISSUER === 'company'
    ? { label: 'Bénéficiaire :', name: fullName, lines: personLines }
    : { label: 'Client :', name: companyName, lines: companyLines };

  const moisIdx = Math.max(0, Math.min(11, (p.month ?? 1) - 1));
  const moisNom = MOIS[moisIdx];
  const moisPrefix = /^[aeiouéèêô]/i.test(moisNom) ? 'd\u2019' : 'de ';
  const annee = p.year ?? new Date().getFullYear();
  const numero = `${invoiceSequence}/${p.month}/${p.year}/${abbrevQualite(qualite)}`;

  return {
    title: `Facture n° ${numero}`,
    issuer,
    recipient,
    columns: { description: 'Description', unit: 'Prix unitaire', qty: 'Quantité', total: 'Montant' },
    rows,
    totals,
    net: { label: 'Net à payer', value: money(p.netSalary) },
    payment: paymentBlock(e, p),
    terms: {
      heading: 'Termes & conditions',
      text: `Paie du mois ${moisPrefix}${moisNom} ${annee}. Règlement à réception de la présente facture.`,
    },
    dateLabel: 'Date:',
    dateValue: fmtDate(p.paymentDate ?? p.paidAt ?? p.periodEnd),
    signatureLabel: 'Signature:',
    signatureImage: e.signatureImage || null,
  };
}

// ═════════════════════════════════════════════════════════════════════════
export interface FactureRendererProProps {
  payroll:      BulletinPayroll;
  template?:    BulletinTemplateConfig; // signature commune aux gabarits (couleurs fixes ici, fidèles au modèle)
  previewMode?: boolean;
  /** Numéro séquentiel de la facture pour la période (1, 2, 3...). Par défaut 1. */
  invoiceSequence?: number;
}

export default function FactureRendererPro({ payroll, invoiceSequence = 1 }: FactureRendererProProps) {
  const model = useMemo(() => buildProModel(payroll, invoiceSequence), [payroll, invoiceSequence]);
  return <FactureProLayout model={model} />;
}