'use client';

// ============================================================================
// 📁 components/payroll-journal/JournalPrintable.tsx
// ✅ Journal de paie imprimable / PDF — A4 PAYSAGE (297 × 210 mm).
//    - Chaque page = un bloc 297×210 mm avec son propre en-tête entreprise
//      (logo, raison sociale, RCCM, CNSS, NIU, adresse, téléphone) et son pied.
//    - Le tableau est découpé en pages : l'en-tête des colonnes est répété.
//    - Dernière page : récapitulatif de la paie, détail des paies étrangères
//      (si expatriés), indicateurs et blocs de signature.
//    - `mono` = noir & blanc : uniquement des gris, du gras et des traits, donc
//      lisible sur une imprimante noir & blanc ; sinon accent = couleur de
//      l'entreprise.
//    - Styles 100 % inline (le document est copié dans une iframe d'impression
//      / capturé en image par lib/payroll-journal-pdf.ts).
//    - Chaque page porte data-journal-page : utilisé par le PDF.
// ============================================================================

import React from 'react';
import type { JournalRow, PayrollJournal } from '@/types/payroll-journal';
import {
  GROUP_LABEL, MONTHS_FR, buildJournalColumns, fmtMoney, groupSpans,
} from '@/lib/payroll-journal-columns';

// Capacité (lignes d'employés) par page — volontairement prudente pour que
// rien ne déborde, même avec des noms/fonctions longs.
const ROWS_FIRST_PAGE = 12;
const ROWS_NEXT_PAGE = 16;

function paginate(rows: JournalRow[]): JournalRow[][] {
  const pages: JournalRow[][] = [];
  let i = 0;
  let cap = ROWS_FIRST_PAGE;
  while (i < rows.length) {
    pages.push(rows.slice(i, i + cap));
    i += cap;
    cap = ROWS_NEXT_PAGE;
  }
  if (pages.length === 0) pages.push([]);
  // La ligne TOTAL doit tenir sur la dernière page : sinon page dédiée.
  const last = pages[pages.length - 1];
  const lastCap = pages.length === 1 ? ROWS_FIRST_PAGE : ROWS_NEXT_PAGE;
  if (last.length > lastCap - 1) {
    const moved = last.pop() as JournalRow;
    pages.push([moved]);
  }
  return pages;
}

interface Props {
  id: string;
  journal: PayrollJournal;
  mono?: boolean;
}

export default function JournalPrintable({ id, journal, mono = false }: Props) {
  const j = journal;
  const cols = buildJournalColumns(j);
  const spans = groupSpans(cols);
  const pages = paginate(j.rows);
  const totalPages = pages.length + 1; // + page récapitulatif

  const accent = mono ? '#111827' : j.company.primaryColor || '#0EA5E9';
  const headBg = mono ? '#d1d5db' : accent;
  const headFg = mono ? '#111827' : '#ffffff';
  const subBg = mono ? '#eeeeee' : '#f3f4f6';
  const stripe = mono ? '#f5f5f5' : '#f9fafb';
  const muted = mono ? '#444444' : '#6b7280';
  const line = mono ? '#777777' : '#d1d5db';

  // Taille de police selon le nombre de colonnes (A4 paysage = 273 mm utiles)
  const n = cols.length;
  const fs = n > 20 ? 6 : n > 16 ? 6.5 : n > 12 ? 7.5 : 8.5;

  const period = `${MONTHS_FR[j.month - 1]} ${j.year}`;
  const c = j.company;
  const generated = new Date(j.generatedAt).toLocaleDateString('fr-FR');

  const pageStyle: React.CSSProperties = {
    width: '297mm', height: '210mm', boxSizing: 'border-box', background: '#fff',
    color: '#111827', fontFamily: 'Arial, Helvetica, sans-serif',
    padding: '9mm 10mm 8mm', position: 'relative', overflow: 'hidden',
    pageBreakAfter: 'always', breakAfter: 'page',
  };

  const Header = () => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `2px solid ${accent}`, paddingBottom: 6, marginBottom: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {c.logo && <img src={c.logo} alt={c.name} crossOrigin="anonymous" style={{ height: 38, maxWidth: 110, objectFit: 'contain', filter: mono ? 'grayscale(1)' : undefined }} />}
        <div>
          <p style={{ fontSize: 14, fontWeight: 800, margin: 0 }}>{c.name}{c.legalForm ? ` (${c.legalForm})` : ''}</p>
          <p style={{ fontSize: 7.5, color: muted, margin: 0 }}>
            RCCM : {c.rccm}
            {c.taxNumber ? ` · NIU : ${c.taxNumber}` : ''}
            {c.cnssNumber ? ` · N° CNSS : ${c.cnssNumber}` : ''}
          </p>
          <p style={{ fontSize: 7.5, color: muted, margin: 0 }}>
            {c.address}, {c.city} · Tél : {c.phone} · {c.email}
          </p>
        </div>
      </div>
      <div style={{ textAlign: 'right' }}>
        <p style={{ fontSize: 16, fontWeight: 800, margin: 0, letterSpacing: 0.5, color: accent }}>JOURNAL DE PAIE</p>
        <p style={{ fontSize: 11, margin: 0, fontWeight: 700 }}>{period}</p>
      </div>
    </div>
  );

  const Footer = ({ page }: { page: number }) => (
    <div style={{ position: 'absolute', left: '10mm', right: '10mm', bottom: '5mm', display: 'flex', justifyContent: 'space-between', fontSize: 7, color: muted, borderTop: `1px solid ${line}`, paddingTop: 3 }}>
      <span>Document généré via Konza RH le {generated} · Montants en FCFA</span>
      <span>Page {page} / {totalPages}</span>
    </div>
  );

  const th: React.CSSProperties = { padding: '3px 4px', textAlign: 'right', border: `0.5px solid ${line}`, fontSize: fs, fontWeight: 700, background: subBg, whiteSpace: 'nowrap' };
  const td: React.CSSProperties = { padding: '3px 4px', textAlign: 'right', border: `0.5px solid ${line}`, fontSize: fs, whiteSpace: 'nowrap' };

  const Summary = () => (
    <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
      {[
        { l: 'Effectif', v: String(j.summary.headcount) },
        { l: 'Brut Congo', v: fmtMoney(j.summary.grossCongo) },
        { l: 'Charges salariales', v: fmtMoney(j.summary.totalChargesCongo) },
        { l: 'Net Congo', v: fmtMoney(j.summary.netCongo) },
        ...(j.options.hasExpat
          ? [
              { l: 'Brut étranger', v: fmtMoney(j.summary.foreignGross) },
              { l: 'Net étranger', v: fmtMoney(j.summary.foreignNet) },
              { l: 'Net total', v: fmtMoney(j.summary.totalNet) },
            ]
          : []),
      ].map((s) => (
        <div key={s.l} style={{ flex: 1, border: `1px solid ${line}`, borderRadius: 4, padding: '4px 6px', textAlign: 'center' }}>
          <p style={{ fontSize: 11, fontWeight: 800, margin: 0 }}>{s.v}</p>
          <p style={{ fontSize: 7, color: muted, margin: 0 }}>{s.l}</p>
        </div>
      ))}
    </div>
  );

  return (
    <div id={id} style={{ width: '297mm', background: '#fff' }}>
      {/* ── Pages du tableau ───────────────────────────────────────── */}
      {pages.map((pageRows, pi) => {
        const isLast = pi === pages.length - 1;
        return (
          <div key={pi} data-journal-page style={pageStyle}>
            <Header />
            {pi === 0 && <Summary />}

            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ display: 'table-header-group' }}>
                <tr>
                  <th rowSpan={2} style={{ ...th, textAlign: 'center', width: '4mm' }}>N°</th>
                  <th rowSpan={2} style={{ ...th, textAlign: 'left', minWidth: '34mm' }}>Employé</th>
                  {spans.map((s, i) => (
                    <th key={i} colSpan={s.span} style={{ ...th, textAlign: 'center', background: headBg, color: headFg, textTransform: 'uppercase', fontSize: fs - 0.5 }}>
                      {GROUP_LABEL[s.group]}
                    </th>
                  ))}
                </tr>
                <tr>
                  {cols.map((col) => (
                    <th key={col.id} style={{ ...th, whiteSpace: 'normal', lineHeight: 1.15 }}>{col.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pageRows.map((r, ri) => (
                  <tr key={r.employeeId} style={{ background: ri % 2 ? stripe : '#fff', pageBreakInside: 'avoid' }}>
                    <td style={{ ...td, textAlign: 'center' }}>{r.rank}</td>
                    <td style={{ ...td, textAlign: 'left', whiteSpace: 'normal' }}>
                      <span style={{ fontWeight: 700 }}>{r.employeeName}</span>
                      {r.isExpat && <span style={{ fontSize: fs - 1, fontWeight: 700 }}> [Expat {r.foreign.map((f) => f.countryCode).join('/')}]</span>}
                      <br />
                      <span style={{ fontSize: fs - 1, color: muted }}>{r.position}</span>
                    </td>
                    {cols.map((col) => (
                      <td key={col.id} style={{ ...td, fontWeight: col.strong ? 800 : 400 }}>{fmtMoney(col.get(r))}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
              {isLast && (
                <tfoot>
                  <tr style={{ background: subBg }}>
                    <td style={{ ...td, borderTop: `1.5px solid ${accent}` }} />
                    <td style={{ ...td, textAlign: 'left', fontWeight: 800, textTransform: 'uppercase', borderTop: `1.5px solid ${accent}` }}>
                      Total ({j.rows.length})
                    </td>
                    {cols.map((col) => (
                      <td key={col.id} style={{ ...td, fontWeight: 800, borderTop: `1.5px solid ${accent}` }}>{fmtMoney(col.total(j.totals))}</td>
                    ))}
                  </tr>
                </tfoot>
              )}
            </table>

            <Footer page={pi + 1} />
          </div>
        );
      })}

      {/* ── Page récapitulative ────────────────────────────────────── */}
      <RecapPage
        journal={j}
        pageStyle={{ ...pageStyle, pageBreakAfter: 'auto', breakAfter: 'auto' }}
        header={<Header />}
        footer={<Footer page={totalPages} />}
        colors={{ accent, headBg, headFg, subBg, muted, line }}
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

function RecapPage({
  journal: j, pageStyle, header, footer, colors,
}: {
  journal: PayrollJournal;
  pageStyle: React.CSSProperties;
  header: React.ReactNode;
  footer: React.ReactNode;
  colors: { accent: string; headBg: string; headFg: string; subBg: string; muted: string; line: string };
}) {
  const { accent, headBg, headFg, subBg, muted, line } = colors;
  const s = j.summary;
  const t = j.totals;
  const indemTotal = Object.values(t.indemnites).reduce((a, b) => a + b, 0);
  const primesTotal = Object.values(t.primes).reduce((a, b) => a + b, 0);

  const box: React.CSSProperties = { border: `1px solid ${line}`, borderRadius: 4, overflow: 'hidden' };
  const boxTitle: React.CSSProperties = { background: headBg, color: headFg, fontSize: 9, fontWeight: 800, padding: '4px 8px', textTransform: 'uppercase' };
  const lineRow = (strong = false): React.CSSProperties => ({
    display: 'flex', justifyContent: 'space-between', padding: '3px 8px', fontSize: 9,
    fontWeight: strong ? 800 : 400, borderTop: `0.5px solid ${line}`, background: strong ? subBg : undefined,
  });

  const Line = ({ l, v, strong }: { l: string; v: number; strong?: boolean }) => (
    <div style={lineRow(strong)}>
      <span>{l}</span>
      <span style={{ fontVariantNumeric: 'tabular-nums' }}>{fmtMoney(v)} F</span>
    </div>
  );

  const foreignLines = j.rows.flatMap((r) =>
    r.foreign.map((f) => ({ employee: r.employeeName, ...f })),
  );

  return (
    <div data-journal-page style={pageStyle}>
      {header}
      <p style={{ fontSize: 10, fontWeight: 800, margin: '0 0 6px', textTransform: 'uppercase', color: accent }}>
        Récapitulatif de la paie — {MONTHS_FR[j.month - 1]} {j.year}
      </p>

      <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
        {/* Paie Congo */}
        <div style={{ ...box, flex: 1 }}>
          <div style={boxTitle}>Paie Congo</div>
          <Line l="Salaires de base" v={t.baseSalary} />
          {primesTotal + t.anciennete + t.conges + t.overtime > 0 && (
            <Line l="Primes, ancienneté, congés, heures sup." v={primesTotal + t.anciennete + t.conges + t.overtime} />
          )}
          {t.absences > 0 && <Line l="Absences (déduction)" v={-t.absences} />}
          <Line l="Brut" v={t.grossCongo} strong />
          <Line l="CNSS salarié" v={t.cnss} />
          <Line l="ITS / BNC" v={t.its} />
          {s.customTaxes > 0 && <Line l="Autres taxes salarié (CAMU, TOL...)" v={s.customTaxes} />}
          {indemTotal > 0 && <Line l="Indemnités non imposables" v={indemTotal} />}
          {s.retenues > 0 && <Line l="Retenues (prêt, avance, autres)" v={s.retenues} />}
          <Line l="Net à payer — Congo" v={t.netCongo} strong />
        </div>

        {/* Charges patronales & coût */}
        <div style={{ ...box, flex: 1 }}>
          <div style={boxTitle}>Charges patronales &amp; coût</div>
          <Line l="CNSS patronale" v={s.cnssEmployer} />
          <Line l="Coût employeur Congo (bulletins)" v={s.employerCostCongo} />
          {j.options.hasExpat && <Line l="Brut payé à l'étranger" v={s.foreignGross} />}
          <Line l={j.options.hasExpat ? 'Coût total entreprise' : 'Coût total employeur'} v={s.totalCompanyCost} strong />
          <div style={{ ...lineRow(), flexDirection: 'column', gap: 2 }}>
            <span>Net / Brut : <b>{s.netToGrossRatio.toLocaleString('fr-FR')} %</b></span>
            <span>Charges salariales / Brut : <b>{s.chargesRatio.toLocaleString('fr-FR')} %</b></span>
            {j.options.hasExpat && <span>Part de l'étranger dans le brut total : <b>{s.foreignShare.toLocaleString('fr-FR')} %</b></span>}
          </div>
        </div>

        {/* Total Congo + étranger */}
        {j.options.hasExpat && (
          <div style={{ ...box, flex: 1 }}>
            <div style={boxTitle}>Total Congo + étranger</div>
            <Line l="Brut Congo" v={s.grossCongo} />
            <Line l="Brut étranger" v={s.foreignGross} />
            <Line l="Brut total" v={s.totalGross} strong />
            <Line l="Net Congo" v={s.netCongo} />
            <Line l="Net étranger" v={s.foreignNet} />
            <Line l="Net total" v={s.totalNet} strong />
          </div>
        )}
      </div>

      {/* Détail des paies étrangères : qui a payé quoi, à qui, d'où */}
      {j.options.hasExpat && foreignLines.length > 0 && (
        <div style={{ ...box, marginTop: 8 }}>
          <div style={boxTitle}>Détail des rémunérations à l'étranger (saisies manuellement, en FCFA)</div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 8.5 }}>
            <thead>
              <tr style={{ background: subBg }}>
                {['Employé', 'Pays', 'Entité qui paie', 'Brut', 'Net', 'Note'].map((h, i) => (
                  <th key={h} style={{ padding: '3px 6px', textAlign: i === 3 || i === 4 ? 'right' : 'left', borderTop: `0.5px solid ${line}`, fontWeight: 700 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {foreignLines.slice(0, 10).map((f) => (
                <tr key={f.id}>
                  <td style={{ padding: '2.5px 6px', borderTop: `0.5px solid ${line}`, fontWeight: 700 }}>{f.employee}</td>
                  <td style={{ padding: '2.5px 6px', borderTop: `0.5px solid ${line}` }}>{f.countryName} ({f.countryCode})</td>
                  <td style={{ padding: '2.5px 6px', borderTop: `0.5px solid ${line}` }}>{f.payerName || '—'}</td>
                  <td style={{ padding: '2.5px 6px', borderTop: `0.5px solid ${line}`, textAlign: 'right' }}>{fmtMoney(f.grossAmount)}</td>
                  <td style={{ padding: '2.5px 6px', borderTop: `0.5px solid ${line}`, textAlign: 'right', fontWeight: 700 }}>{fmtMoney(f.netAmount)}</td>
                  <td style={{ padding: '2.5px 6px', borderTop: `0.5px solid ${line}`, color: muted }}>{f.note || ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {foreignLines.length > 10 && (
            <p style={{ fontSize: 7.5, color: muted, margin: 0, padding: '3px 8px', borderTop: `0.5px solid ${line}` }}>
              … et {foreignLines.length - 10} autre(s) ligne(s) — voir le journal à l'écran.
            </p>
          )}
        </div>
      )}

      {/* Signatures */}
      <div style={{ position: 'absolute', left: '10mm', right: '10mm', bottom: '14mm', display: 'flex', gap: 10 }}>
        {['Établi par (RH)', 'Vérifié par (Comptabilité)', 'Approuvé par (Direction)'].map((l) => (
          <div key={l} style={{ flex: 1, border: `1px solid ${line}`, borderRadius: 4, height: '24mm', padding: '4px 8px' }}>
            <p style={{ fontSize: 8, fontWeight: 700, margin: 0 }}>{l}</p>
            <p style={{ fontSize: 7, color: muted, margin: '2px 0 0' }}>Nom, date et signature</p>
          </div>
        ))}
      </div>

      {footer}
    </div>
  );
}