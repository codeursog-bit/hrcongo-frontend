'use client';

// ============================================================================
// 📁 components/documents/modern/ModernDocumentKit.tsx
// ✅ MODÈLE 3 — fiche « corporate vert & or » commune aux 4 documents de demande
//    (absence, congé, prêt, avance).
//
// ✅ GÉOMÉTRIE FIXE — mesurée sur la fiche Axis Oil de référence et remise à
//    l'échelle A4 (210 × 296 mm). Tout est en millimètres (objet G ci-dessous) :
//      0 → 27,6      en-tête (logo, mention, coin décoratif)
//      29,8 → 41     « Réf. » + service (+ statut à droite)
//      42,8 → 53,2   bandeau de titre
//      56 → 59,6     sous-titre entre deux filets
//      64 → …        sections numérotées (espacement 4,2 mm)
//      …  → 281,7    décision + 3 signatures
//      284,8 → 296   bande de pied de page
//    La page est donc TOUJOURS remplie jusqu'en bas : `fillHeights()` répartit
//    la hauteur restante entre les sections de chaque document.
//
// ✅ Les champs sont REMPLIS avec les vraies données (valeur en gras sur ligne
//    pointillée) ; ce qui n'est pas renseigné reste une ligne à compléter.
// ✅ Période d'absence/congé : Du · au (dernier jour INCLUS) · Durée · Reprise,
//    avec le jour de la semaine.
// ✅ Couleurs : objet PALETTE (un seul endroit à modifier).
// ✅ Impression / export PDF : les exports remettent `color` et
//    `background-color` à plat sur tout élément dont la classe ne contient pas
//    « std- » (voir lib/*-print.ts). Toutes les classes de ce modèle commencent
//    par « std-mod- » ; les décors sont des SVG à couleurs explicites.
//    → rien à modifier dans les fichiers *-print.ts.
// ============================================================================

import type { ReactNode } from 'react';
import { sigFor, type DocumentSignature } from '../docSignatures';

export type { DocumentSignature };
export { sigFor };

// ── Charte (modifier ici) ────────────────────────────────────────────────────
const PALETTE = {
  ink: '#1b2430',
  muted: '#5f6b76',
  navy: '#12306a',
  greenDark: '#0b4d3f',
  green: '#16794f',
  gold: '#f4b72c',
  mint: '#dcebe8',
  pale: '#f2f8f7',
  border: '#cfe2de',
  dotted: '#8fb0a8',
  red: '#d6312b',
};
const P = PALETTE;
const SANS = `'Segoe UI', Inter, 'Helvetica Neue', Arial, sans-serif`;
const COUNTRY_LABELS: Record<string, string> = { CG: 'République du Congo' };

// ── Géométrie (mm) ───────────────────────────────────────────────────────────
export const G = {
  headerH: 27.6,
  refTop: 2.2,
  refH: 11.2,
  bannerTop: 1.8,
  bannerH: 10.4,
  subTop: 2.8,
  subH: 3.6,
  firstSectionTop: 4.4,
  gap: 4.2, // entre deux sections
  barH: 7.7, // barre de titre d'une section
  detachedGap: 2.7, // barre → tableau (section « détachée »)
  decisionBody: 21.2,
  sigGap: 2.3,
  sigH: 19.3,
  footerH: 11.2,
  region: 216.4, // de 64,0 (1re section) à ~280,4 (bas des signatures) : 1,3 mm de sécurité avant le pied de page
  signedH: 17, // bloc « Fait à… / Signature du… »
};

/**
 * Répartit la hauteur disponible entre les sections « ordinaires » d'un document
 * (hors décision) : chacune reçoit son minimum + une part du surplus (`grow`).
 * `extraFixed` = hauteur d'éléments déjà placés hors de ces sections (ex. tableau).
 * Retourne la hauteur du CORPS de chaque section, en mm.
 */
export function fillHeights(parts: { min: number; grow?: number }[], extraFixed = 0): number[] {
  const n = parts.length;
  const fixed = n * (G.barH + G.gap) + (G.barH + G.decisionBody + G.sigGap + G.sigH) + extraFixed;
  const free = G.region - fixed - parts.reduce((a, p) => a + p.min, 0);
  const totalGrow = parts.reduce((a, p) => a + (p.grow ?? 1), 0) || 1;
  return parts.map((p) => p.min + (free > 0 ? free * ((p.grow ?? 1) / totalGrow) : 0));
}

// ── Types partagés ───────────────────────────────────────────────────────────
export interface ModernCompany {
  legalName: string;
  tradeName?: string | null;
  logo?: string | null;
  address?: string | null;
  city?: string | null;
  country?: string | null;
  phone?: string | null;
  email?: string | null;
  cachetUrl?: string | null;
  documentFooterText?: string | null;
}

export interface ModernEmployee {
  firstName: string;
  lastName: string;
  employeeNumber?: string | null;
  position?: string;
  departmentName?: string;
  phone?: string;
  hireDate?: string | Date | null;
}

// ── Formats (dates, montants, durées) ────────────────────────────────────────
const toDate = (d?: string | Date | null): Date | null => {
  if (!d) return null;
  const date = typeof d === 'string' ? new Date(d) : d;
  return isNaN(date.getTime()) ? null : date;
};

/** Date « jour » (début/fin/reprise/embauche) : lue et écrite en UTC → jamais de décalage d'un jour. */
export const fmtDay = (d?: string | Date | null): string => {
  const date = toDate(d);
  return date ? date.toLocaleDateString('fr-FR', { timeZone: 'UTC' }) : '';
};

/** Instant (date de la demande) : fuseau local de l'utilisateur. */
export const fmtInstant = (d?: string | Date | null): string => {
  const date = toDate(d);
  return date ? date.toLocaleDateString('fr-FR') : '';
};

export const weekdayOf = (d?: string | Date | null): string => {
  const date = toDate(d);
  return date ? date.toLocaleDateString('fr-FR', { weekday: 'long', timeZone: 'UTC' }) : '';
};

export const fmtNumber = (n: number | string | null | undefined): string => {
  if (n === null || n === undefined || n === '') return '';
  const v = Number(n);
  return Number.isFinite(v) ? v.toLocaleString('fr-FR', { maximumFractionDigits: 2 }) : '';
};

export const fmtMoney = (n: number | string | null | undefined): string => {
  const s = fmtNumber(n);
  return s ? `${s} FCFA` : '';
};

export const plural = (n: number, one: string, many: string) => (n > 1 ? many : one);

// ── Statuts : un seul vocabulaire pour les 4 documents ───────────────────────
export type StatusTone = 'ok' | 'warn' | 'bad' | 'neutral';
type Gender = 'f' | 'm';

const STATUS_META: Record<string, [string, string, StatusTone]> = {
  PENDING: ['En attente', 'En attente', 'warn'],
  PENDING_DG: ['En attente de la Direction Générale', 'En attente de la Direction Générale', 'warn'],
  APPROVED: ['Approuvée', 'Approuvé', 'ok'],
  ACTIVE: ['Accordée', 'Accordé', 'ok'],
  PAID: ['Versée', 'Versé', 'ok'],
  DEDUCTED: ['Déduite', 'Déduit', 'ok'],
  REJECTED: ['Refusée', 'Refusé', 'bad'],
  CANCELLED: ['Annulée', 'Annulé', 'neutral'],
};

export const isApprovedStatus = (s?: string | null) =>
  s === 'APPROVED' || s === 'ACTIVE' || s === 'PAID' || s === 'DEDUCTED';

export function statusInfo(status: string | undefined | null, gender: Gender = 'f') {
  const meta = status ? STATUS_META[status] : undefined;
  if (!meta) return { label: status || 'En attente', tone: 'neutral' as StatusTone };
  return { label: gender === 'f' ? meta[0] : meta[1], tone: meta[2] };
}

export function StatusBadge({ status, gender = 'f' }: { status?: string | null; gender?: Gender }) {
  const { label, tone } = statusInfo(status, gender);
  return (
    <span
      className={`std-mod-st-${tone}`}
      style={{ display: 'inline-block', border: '1px solid transparent', borderRadius: 999, padding: '1px 11px', fontSize: 9, lineHeight: 1.3, fontWeight: 700, letterSpacing: 0.9, textTransform: 'uppercase', whiteSpace: 'nowrap', verticalAlign: 'middle' }}
    >
      {label}
    </span>
  );
}

// ── Décors (SVG à couleurs explicites : insensibles aux règles d'impression) ─
function CornerDecor() {
  return (
    <svg viewBox="0 0 150 100" preserveAspectRatio="none" style={{ position: 'absolute', top: 0, right: 0, width: '30mm', height: '100%', display: 'block' }} aria-hidden="true">
      <polygon points="46,100 118,0 150,0 150,100" fill={P.greenDark} />
      <polygon points="0,100 97,0 113,0 27,100" fill={P.gold} />
    </svg>
  );
}

function FooterWedgeLeft() {
  return (
    <svg viewBox="0 0 60 40" preserveAspectRatio="none" style={{ width: '14mm', height: '100%', display: 'block', flexShrink: 0 }} aria-hidden="true">
      <polygon points="0,0 40,0 14,40 0,40" fill={P.gold} />
    </svg>
  );
}

function FooterFlagRight() {
  return (
    <svg viewBox="0 0 70 40" preserveAspectRatio="none" style={{ width: '17mm', height: '100%', display: 'block', flexShrink: 0 }} aria-hidden="true">
      <polygon points="8,40 24,0 36,0 20,40" fill={P.green} />
      <polygon points="22,40 38,0 50,0 34,40" fill={P.gold} />
      <polygon points="36,40 52,0 64,0 48,40" fill={P.red} />
    </svg>
  );
}

// ── Feuille A4 ───────────────────────────────────────────────────────────────
export function ModernSheet({
  id,
  company,
  reference,
  issuedAt,
  eyebrow = 'Direction des Ressources Humaines',
  title,
  subtitle,
  status,
  gender = 'f',
  children,
}: {
  id?: string;
  company: ModernCompany;
  reference?: string;
  issuedAt?: string | Date;
  eyebrow?: string;
  title: string;
  subtitle?: string;
  status?: string | null;
  gender?: Gender;
  children: ReactNode;
}) {
  const companyName = company.tradeName || company.legalName || 'Entreprise';
  const country = company.country ? COUNTRY_LABELS[company.country] || company.country : '';
  const footerText = company.documentFooterText
    ? company.documentFooterText
    : [companyName, [company.address, company.city, country].filter(Boolean).join(', '), company.phone && `Tél. : ${company.phone}`].filter(Boolean).join('  ·  ');

  return (
    <div
      id={id}
      className="std-mod-doc"
      style={{ position: 'relative', width: '210mm', height: '296mm', margin: '0 auto', boxSizing: 'border-box', overflow: 'hidden', background: '#fff', color: P.ink, fontFamily: SANS, lineHeight: 1.25, breakInside: 'avoid', pageBreakInside: 'avoid' }}
    >
      <style>{`
        .std-mod-doc, .std-mod-doc * { color-scheme: light !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; box-sizing: border-box; }
        .std-mod-doc { background: #fff !important; color: ${P.ink} !important; font-family: ${SANS} !important; }
        .std-mod-doc .std-mod-ink { color: ${P.ink} !important; }
        .std-mod-doc .std-mod-muted { color: ${P.muted} !important; }
        .std-mod-doc .std-mod-navy { color: ${P.navy} !important; }
        .std-mod-doc .std-mod-gd { color: ${P.greenDark} !important; }
        .std-mod-doc .std-mod-white { color: #fff !important; }
        .std-mod-doc .std-mod-fav { color: #166534 !important; }
        .std-mod-doc .std-mod-unf { color: #991b1b !important; }
        .std-mod-doc .std-mod-hdr { background-image: linear-gradient(90deg, #ffffff 0%, #eef4f8 100%) !important; background-color: #f6f9fb !important; }
        .std-mod-doc .std-mod-bg-dark { background-color: ${P.greenDark} !important; color: #fff !important; }
        .std-mod-doc .std-mod-bg-mint { background-color: ${P.mint} !important; }
        .std-mod-doc .std-mod-bg-pale { background-color: ${P.pale} !important; }
        .std-mod-doc .std-mod-bg-white { background-color: #fff !important; }
        .std-mod-doc .std-mod-rule-l { background-image: linear-gradient(90deg, ${P.green}, ${P.gold}) !important; background-color: ${P.green} !important; }
        .std-mod-doc .std-mod-rule-r { background-image: linear-gradient(90deg, ${P.gold}, ${P.green}) !important; background-color: ${P.gold} !important; }
        .std-mod-doc .std-mod-th { background-color: ${P.greenDark} !important; color: #fff !important; }
        .std-mod-doc .std-mod-row-on { background-color: ${P.mint} !important; }
        .std-mod-doc .std-mod-st-ok { color: #166534 !important; background-color: #dcfce7 !important; border-color: #86efac !important; }
        .std-mod-doc .std-mod-st-warn { color: #92400e !important; background-color: #fef3c7 !important; border-color: #fcd34d !important; }
        .std-mod-doc .std-mod-st-bad { color: #991b1b !important; background-color: #fee2e2 !important; border-color: #fca5a5 !important; }
        .std-mod-doc .std-mod-st-neutral { color: #374151 !important; background-color: #f3f4f6 !important; border-color: #d1d5db !important; }
      `}</style>

      {/* En-tête : 0 → 27,6 mm */}
      <header className="std-mod-hdr" style={{ position: 'relative', height: `${G.headerH}mm`, borderBottom: `1px solid ${P.border}`, overflow: 'hidden' }}>
        <CornerDecor />
        {company.logo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={company.logo} alt={companyName} style={{ position: 'absolute', left: '10mm', top: '3.9mm', height: '21mm', maxWidth: '84mm', objectFit: 'contain', objectPosition: 'left center' }} />
        ) : (
          <div className="std-mod-gd" style={{ position: 'absolute', left: '10mm', top: '8mm', fontWeight: 800, fontSize: 28, letterSpacing: 0.5 }}>
            {companyName}
          </div>
        )}
        <div className="std-mod-navy" style={{ position: 'absolute', right: '24mm', top: '9mm', width: '50mm', textAlign: 'right', fontSize: 12.5, lineHeight: 1.35 }}>
          Document confidentiel à usage exclusif du destinataire
        </div>
      </header>

      <div style={{ padding: '0 10mm' }}>
        {/* Réf. + service (+ statut) : 29,8 → 41 mm */}
        <div style={{ marginTop: `${G.refTop}mm`, height: `${G.refH}mm`, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div className="std-mod-navy" style={{ fontSize: 12.5, fontWeight: 700, lineHeight: `${G.refH / 2}mm` }}>
            <div>Réf. : {reference || '—'}</div>
            <div>{eyebrow}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ height: `${G.refH / 2}mm`, lineHeight: `${G.refH / 2}mm` }}>{status !== undefined && <StatusBadge status={status} gender={gender} />}</div>
            <div className="std-mod-muted" style={{ height: `${G.refH / 2}mm`, lineHeight: `${G.refH / 2}mm`, fontSize: 9.5 }}>
              {fmtInstant(issuedAt) ? `Émis le ${fmtInstant(issuedAt)}` : ''}
            </div>
          </div>
        </div>

        {/* Bandeau de titre : 42,8 → 53,2 mm */}
        <h1
          className="std-mod-bg-dark"
          style={{ margin: `${G.bannerTop}mm 0 0`, height: `${G.bannerH}mm`, lineHeight: `${G.bannerH}mm`, borderRadius: 5, textAlign: 'center', fontSize: 22, fontWeight: 800, letterSpacing: 0.3, textTransform: 'uppercase', overflow: 'hidden', whiteSpace: 'nowrap' }}
        >
          {title}
        </h1>

        {/* Sous-titre : 56 → 59,6 mm */}
        <div style={{ marginTop: `${G.subTop}mm`, height: `${G.subH}mm`, display: 'flex', alignItems: 'center', gap: 12 }}>
          <span className="std-mod-rule-l" style={{ flex: 1, height: 2 }} />
          {subtitle && (
            <span className="std-mod-navy" style={{ fontSize: 15, fontWeight: 700, fontStyle: 'italic', whiteSpace: 'nowrap' }}>
              {subtitle}
            </span>
          )}
          <span className="std-mod-rule-r" style={{ flex: 1, height: 2 }} />
        </div>

        {children}
      </div>

      {/* Pied de page : 284,8 → 296 mm */}
      <footer className="std-mod-bg-dark" style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: `${G.footerH}mm`, display: 'flex', alignItems: 'stretch' }}>
        <FooterWedgeLeft />
        <div className="std-mod-white" style={{ flex: 1, display: 'flex', alignItems: 'center', paddingLeft: '5mm', fontSize: 10, letterSpacing: 2.4, textTransform: 'uppercase', whiteSpace: 'pre-line', lineHeight: 1.4 }}>
          {footerText}
        </div>
        <FooterFlagRight />
      </footer>
    </div>
  );
}

// ── Sections numérotées ──────────────────────────────────────────────────────
export function Section({
  n,
  title,
  hint,
  h,
  mt = G.gap,
  detached = false,
  children,
}: {
  n: string | number;
  title: string;
  hint?: string;
  /** hauteur du corps (mm) : le contenu y est centré verticalement */
  h?: number;
  mt?: number;
  /** true : la barre est seule, le contenu (ex. tableau) vient dessous, pleine largeur */
  detached?: boolean;
  children: ReactNode;
}) {
  const bar = (
    <div
      className="std-mod-bg-mint"
      style={{ height: `${G.barH}mm`, paddingLeft: '13.9mm', display: 'flex', alignItems: 'center', gap: 8, ...(detached ? { border: `1px solid ${P.border}`, borderRadius: 8 } : {}) }}
    >
      <h2 className="std-mod-gd" style={{ margin: 0, fontSize: 14, fontWeight: 800, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
        {title}
      </h2>
      {hint && (
        <span className="std-mod-navy" style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
          ({hint})
        </span>
      )}
    </div>
  );
  return (
    <section style={{ position: 'relative', marginTop: `${mt}mm` }}>
      <div className="std-mod-bg-dark" style={{ position: 'absolute', left: 0, top: 0, zIndex: 2, width: '9.8mm', height: '8.5mm', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 800 }}>
        {n}
      </div>
      {detached ? (
        <>
          {bar}
          <div style={{ marginTop: `${G.detachedGap}mm` }}>{children}</div>
        </>
      ) : (
        <div style={{ border: `1px solid ${P.border}`, borderRadius: 8, overflow: 'hidden' }}>
          {bar}
          <table className="std-mod-bg-pale" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tbody>
              <tr>
                <td style={{ height: `${h ?? 20}mm`, padding: '0 5mm', verticalAlign: 'middle' }}>{children}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

// ── Lignes « Libellé : valeur ………… » ─────────────────────────────────────────
export interface InfoItem {
  label: string;
  value?: ReactNode;
  wide?: boolean;
}

/**
 * Lignes alignées en colonnes (tableau, pas de grille CSS : rendu identique à
 * l'écran, à l'impression et dans les exports PDF).
 * Chaque ligne = 2 champs côte à côte ; `wide` = un champ sur toute la ligne.
 */
function FieldTable({ rows, labelWidth, rowH }: { rows: (InfoItem | null)[][]; labelWidth: string; rowH: number }) {
  const cell = { padding: '0 0 0.6mm', height: `${rowH}mm`, verticalAlign: 'bottom' as const };
  const labelCell = { ...cell, fontSize: 13, whiteSpace: 'nowrap' as const };
  const valueCell = { ...cell, fontSize: 13.5, fontWeight: 700 as const, borderBottom: `1px dotted ${P.dotted}`, overflowWrap: 'anywhere' as const };
  return (
    <table style={{ width: '100%', tableLayout: 'fixed', borderCollapse: 'collapse' }}>
      <colgroup>
        <col style={{ width: labelWidth }} />
        <col style={{ width: '4mm' }} />
        <col />
        <col style={{ width: '9mm' }} />
        <col style={{ width: labelWidth }} />
        <col style={{ width: '4mm' }} />
        <col />
      </colgroup>
      <tbody>
        {rows.map((row, i) => {
          const wide = row.length === 1 && !!row[0]?.wide;
          const cells = wide ? [row[0]] : [row[0] ?? null, row[1] ?? null];
          return (
            <tr key={i}>
              {cells.map((it, k) =>
                it ? (
                  <FieldCells key={it.label} item={it} lc={labelCell} vc={valueCell} span={wide ? 5 : 1} gap={k === 0 && !wide} />
                ) : (
                  <td key={`e${k}`} colSpan={k === 0 ? 4 : 3} />
                ),
              )}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

function FieldCells({ item, lc, vc, span, gap }: { item: InfoItem; lc: React.CSSProperties; vc: React.CSSProperties; span: number; gap: boolean }) {
  return (
    <>
      <td className="std-mod-navy" style={lc}>
        {item.label}
      </td>
      <td className="std-mod-navy" style={{ ...lc, textAlign: 'center' }}>
        :
      </td>
      <td className="std-mod-ink" style={vc} colSpan={span}>
        {item.value ?? ''}
      </td>
      {gap && <td />}
    </>
  );
}

export function InfoGrid({ items, cols = 2, labelWidth = '34mm', rowH = 6.9 }: { items: InfoItem[]; cols?: number; labelWidth?: string; rowH?: number }) {
  const rows: InfoItem[][] = [];
  let cur: InfoItem[] = [];
  for (const it of items) {
    if (it.wide || cols === 1) {
      if (cur.length) rows.push(cur), (cur = []);
      rows.push([{ ...it, wide: true }]);
      continue;
    }
    cur.push(it);
    if (cur.length === 2) rows.push(cur), (cur = []);
  }
  if (cur.length) rows.push(cur);
  return <FieldTable rows={rows} labelWidth={labelWidth} rowH={rowH} />;
}

/** Bloc « Renseignements » : identique sur les 4 documents (champs facultatifs masqués s'ils sont vides). */
export function employeeItems(emp: ModernEmployee): InfoItem[] {
  const items: InfoItem[] = [{ label: 'Nom(s) et prénom(s)', value: `${emp.lastName} ${emp.firstName}`.trim() }];
  if (emp.employeeNumber) items.push({ label: 'Matricule', value: emp.employeeNumber });
  items.push({ label: 'Poste occupé', value: emp.position });
  if (emp.departmentName) items.push({ label: 'Service / Direction', value: emp.departmentName });
  if (emp.phone) items.push({ label: 'Téléphone', value: emp.phone });
  if (fmtDay(emp.hireDate)) items.push({ label: "Date d'embauche", value: fmtDay(emp.hireDate) });
  return items;
}

// ── Période (absence / congé) ────────────────────────────────────────────────
const dayWithWeekday = (d?: string | Date | null) => {
  const v = fmtDay(d);
  if (!v) return '';
  const w = weekdayOf(d);
  return (
    <>
      {v}
      {w && <span className="std-mod-muted" style={{ fontWeight: 400, fontSize: 10.5 }}> · {w}</span>}
    </>
  );
};

/** Lignes « Du … au (inclus) … » puis « Durée … Reprise le … » — sans ambiguïté. */
export function periodRows({
  startDate,
  endDate,
  days,
  daysLabel,
  returnDate,
}: {
  startDate: string | Date;
  endDate: string | Date;
  days?: number | string | null;
  /** « ouvrables » (absence) ou « décomptés » (congé) */
  daysLabel: string;
  returnDate?: string | Date | null;
}): InfoItem[] {
  const n = Number(days);
  const hasDays = days !== null && days !== undefined && days !== '' && Number.isFinite(n) && n > 0;
  const items: InfoItem[] = [
    { label: 'Du', value: dayWithWeekday(startDate) },
    { label: 'au (inclus)', value: dayWithWeekday(endDate) },
  ];
  if (hasDays) items.push({ label: 'Durée', value: `${fmtNumber(n)} ${plural(n, 'jour', 'jours')} ${daysLabel}` });
  if (fmtDay(returnDate)) {
    items.push({ label: 'Reprise le', value: dayWithWeekday(returnDate) });
  }
  return items;
}

/** « Fait à …, le … » + « Signature du … : ______ » — hauteur fixe G.signedH. */
export function SignedLine({ company, date, who }: { company: ModernCompany; date?: string | Date; who: string }) {
  return (
    <div style={{ height: `${G.signedH}mm` }}>
      <div className="std-mod-navy" style={{ height: '7.2mm', lineHeight: '7.2mm', fontSize: 13 }}>
        Fait à {company.city || '……………………'}, le <strong>{fmtInstant(date) || '……/……/………'}</strong>
      </div>
      <div style={{ height: '9.8mm', display: 'flex', alignItems: 'flex-end', gap: 8 }}>
        <span className="std-mod-navy" style={{ fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap' }}>
          Signature du {who} :
        </span>
        <span style={{ flex: '0 0 78mm', borderBottom: `1px solid ${P.navy}`, height: '1px', marginBottom: '1.2mm' }} />
      </div>
    </div>
  );
}

/** Zone de texte libre (motif…) de hauteur donnée (mm). */
export function TextBlock({ label, text, h = 24 }: { label: string; text?: string | null; h?: number }) {
  return (
    <div>
      <div className="std-mod-navy" style={{ height: '5.4mm', lineHeight: '5.4mm', fontSize: 13 }}>
        {label} :
      </div>
      <div className="std-mod-bg-white std-mod-ink" style={{ height: `${Math.max(h, 10)}mm`, overflow: 'hidden', border: `1px solid ${P.border}`, borderRadius: 6, padding: '2mm 3mm', fontSize: 13, lineHeight: 1.4 }}>
        {text?.trim() ? text : ''}
      </div>
    </div>
  );
}
/** Hauteur occupée par le libellé d'un TextBlock (mm). */
export const TEXT_LABEL_H = 5.4;

export function Tick({ checked, size = 15 }: { checked: boolean; size?: number }) {
  return (
    <span
      className="std-mod-bg-white std-mod-gd"
      style={{ display: 'inline-block', width: size, height: size, border: `1.4px solid ${P.greenDark}`, borderRadius: 2, textAlign: 'center', fontSize: size - 3, fontWeight: 800, lineHeight: `${size - 3}px`, verticalAlign: '-3px', overflow: 'hidden' }}
    >
      {checked ? '✓' : ''}
    </span>
  );
}

// ── Décision de la hiérarchie + signatures ───────────────────────────────────
export interface SignatureBox {
  label: string;
  /** Code de fonction du workflow (HIERARCHY_HEAD, HR, DG, ACCOUNTANT) → signature personnelle éventuelle */
  code?: string;
  /** Décision connue indépendamment d'une signature (ex. drhDecision du prêt) */
  decision?: 'FAVORABLE' | 'UNFAVORABLE' | null;
  /** Cachet de l'entreprise (affiché seulement si fourni) */
  cachetUrl?: string | null;
}

const otherOpinionsText = (signatures: DocumentSignature[] | null | undefined, codes: string[]) =>
  (signatures ?? [])
    .filter((s) => !codes.includes(s.functionCode))
    .map((s) => `${s.label} — ${s.opinion === 'FAVORABLE' ? 'Favorable' : 'Défavorable'} · ${s.authorName} · ${fmtInstant(s.date)}`)
    .join('   |   ');

export function DecisionSection({
  n,
  title = 'Décision de la hiérarchie',
  boxes,
  signatures,
  granted,
  refused,
  extra,
}: {
  n: string | number;
  title?: string;
  boxes: SignatureBox[];
  signatures?: DocumentSignature[] | null;
  granted: boolean;
  refused: boolean;
  extra?: ReactNode;
}) {
  const codes = boxes.map((b) => b.code).filter(Boolean) as string[];
  const others = otherOpinionsText(signatures, codes);
  return (
    <>
      <Section n={n} title={title} h={G.decisionBody}>
        <div style={{ height: '6.6mm', display: 'flex', alignItems: 'center', gap: 22 }}>
          <span className="std-mod-navy" style={{ fontSize: 14, fontWeight: 700 }}>
            Accordé <Tick checked={granted} />
          </span>
          <span className="std-mod-navy" style={{ fontSize: 14, fontWeight: 700 }}>
            Refusé <Tick checked={refused} />
          </span>
          {extra}
        </div>
        <FieldTable
          labelWidth="26mm"
          rowH={6.6}
          rows={[[{ label: 'Commentaire', value: others ? <span style={{ fontWeight: 400, fontSize: 10 }}>{others}</span> : '', wide: true }]]}
        />
        <div style={{ height: '6.4mm', borderBottom: `1px dotted ${P.dotted}` }} />
      </Section>

      <div className="std-mod-bg-pale" style={{ marginTop: `${G.sigGap}mm`, border: `1px solid ${P.border}`, borderRadius: 8, overflow: 'hidden' }}>
        <table style={{ width: '100%', tableLayout: 'fixed', borderCollapse: 'collapse' }}>
          <tbody>
            <tr>
              {boxes.map((b, i) => {
                const sig = b.code ? sigFor(signatures ?? undefined, b.code) : undefined;
                const decision = sig ? (sig.opinion === 'FAVORABLE' ? 'FAVORABLE' : 'UNFAVORABLE') : b.decision ?? null;
                return (
                  <td key={b.label} style={{ height: `${G.sigH - 0.4}mm`, padding: '1.6mm 3mm 1.4mm', borderLeft: i === 0 ? undefined : `1px solid ${P.border}`, textAlign: 'center', verticalAlign: 'top' }}>
                    <div className="std-mod-navy" style={{ height: '4.6mm', lineHeight: '4.6mm', fontSize: 10.5, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {b.label}
                    </div>
                    <div style={{ height: '8.2mm', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                      {b.cachetUrl && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={b.cachetUrl} alt="Cachet" style={{ height: '8mm', maxWidth: '18mm', objectFit: 'contain' }} />
                      )}
                      {sig?.signatureUrl && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={sig.signatureUrl} alt={`Signature ${sig.authorName}`} style={{ height: '8mm', maxWidth: '24mm', objectFit: 'contain' }} />
                      )}
                    </div>
                    <div style={{ margin: '0 auto', width: '72%', borderBottom: `1px solid ${P.navy}` }} />
                    <div className="std-mod-muted" style={{ marginTop: '0.8mm', height: '3.2mm', lineHeight: '3.2mm', fontSize: 8, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {sig ? `${sig.authorName} · ${fmtInstant(sig.date)}` : ''}
                      {decision && (
                        <span className={decision === 'FAVORABLE' ? 'std-mod-fav' : 'std-mod-unf'} style={{ fontWeight: 700 }}>
                          {sig ? ' · ' : ''}
                          {decision === 'FAVORABLE' ? 'Favorable' : 'Défavorable'}
                        </span>
                      )}
                    </div>
                  </td>
                );
              })}
            </tr>
          </tbody>
        </table>
      </div>
    </>
  );
}

/** Règle commune du cachet : seulement si la demande est approuvée ET que l'entreprise en a un. */
export const cachetIf = (approved: boolean, company: ModernCompany) => (approved && company.cachetUrl ? company.cachetUrl : null);