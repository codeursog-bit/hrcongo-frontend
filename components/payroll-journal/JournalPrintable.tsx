'use client';

// ============================================================================
// 📁 components/payroll-journal/JournalPrintable.tsx
// ✅ Journal de paie imprimable / PDF — A4 PAYSAGE (297 × 210 mm), rendu
//    "feuille de comptabilité" IDENTIQUE à l'export Excel :
//      bandeau titre bleu marine • bandeau KPI à liseré or • en-têtes colorés
//      par groupe (mêmes couleurs que l'Excel) • grille fine • lignes zébrées
//      • ligne TOTAL dorée à double filet • légende en pied de page.
//    - Une page = un bloc 297×210 mm (data-journal-page) avec en-tête entreprise
//      (logo, raison sociale, RCCM, CNSS, adresse) ; en-têtes de colonnes
//      répétés sur chaque page.
//    - Tableau en table-layout FIXE : largeurs calculées en mm → rien ne peut
//      déborder de la page, quel que soit le nombre de colonnes (la taille de
//      police s'adapte à la largeur disponible par colonne).
//    - Dernière page : récapitulatif, détail des paies étrangères, signatures.
//    - `mono` = noir & blanc : gris foncés distincts + gras + traits (lisible
//      sur imprimante N&B) ; sinon couleurs de l'Excel.
//    - Styles 100 % inline (copié dans l'iframe d'impression / capturé en PDF).
// ============================================================================

import React from 'react';
import type { JournalRow, PayrollJournal } from '@/types/payroll-journal';
import {
  GROUP_COLOR, GROUP_COLOR_MONO, GROUP_LABEL, MONTHS_FR,
  buildJournalColumns, fmtMoney, groupSpans,
} from '@/lib/payroll-journal-columns';

// Largeur utile d'une page A4 paysage avec 10 mm de marge de chaque côté
const USABLE_MM = 277;
const NO_MM = 7;
const NAME_MM = 38;

// Hauteur disponible pour les LIGNES du tableau (mm), marge de sécurité incluse :
//   page 1  = 193 − en-tête − bandeau KPI − en-têtes de colonnes − ligne TOTAL − pied
//   suivantes = idem sans le bandeau KPI
const BUDGET_FIRST_MM = 140;
const BUDGET_NEXT_MM = 162;
const TOTAL_ROW_MM = 8;

/** Hauteur estimée d'une ligne (mm) : le nom peut passer sur 2-3 lignes selon sa longueur. */
function estimateRowMm(r: JournalRow, fs: number): number {
  const charMm = 0.159 * fs; // largeur moyenne d'un caractère gras
  const perLine = Math.max(8, Math.floor((NAME_MM - 1.6) / charMm));
  const label = r.employeeName + (r.isExpat ? `  [Expat ${r.foreign.map((f) => f.countryCode).join('/')}]` : '');
  const nameLines = Math.max(1, Math.ceil(label.length / perLine));
  const posLines = Math.max(1, Math.ceil((r.position || ' ').length / (perLine * 1.15)));
  const lineMm = fs * 1.25 * 0.2646;
  return 1.7 + (nameLines + posLines) * lineMm;
}

/** Découpe les employés en pages d'après la hauteur estimée (jamais de débordement). */
function paginate(rows: JournalRow[], fs: number): JournalRow[][] {
  const pages: JournalRow[][] = [[]];
  let used = 0;
  let budget = BUDGET_FIRST_MM;
  for (const r of rows) {
    const h = estimateRowMm(r, fs);
    if (used + h > budget && pages[pages.length - 1].length > 0) {
      pages.push([]);
      used = 0;
      budget = BUDGET_NEXT_MM;
    }
    pages[pages.length - 1].push(r);
    used += h;
  }
  // La ligne TOTAL doit tenir sur la dernière page, sinon on déplace la dernière ligne
  if (used + TOTAL_ROW_MM > budget && pages[pages.length - 1].length > 1) {
    const moved = pages[pages.length - 1].pop() as JournalRow;
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

  // ── Palette (couleur = Excel ; mono = niveaux de gris) ───────────────
  const P = mono
    ? {
        navy: '#111827', gold: '#111827', goldLight: '#e5e7eb', kpiBg: '#f3f4f6',
        zebra: '#f3f4f6', border: '#9ca3af', text: '#111827', muted: '#4b5563',
        mismatch: '#e5e7eb',
      }
    : {
        navy: '#1F3864', gold: '#C9A227', goldLight: '#F4E9C9', kpiBg: '#EFF3F8',
        zebra: '#F7F8FA', border: '#D9DEE4', text: '#334155', muted: '#64748B',
        mismatch: '#FFF3CD',
      };
  const groupBg = (g: keyof typeof GROUP_COLOR) => (mono ? GROUP_COLOR_MONO[g] : GROUP_COLOR[g]);

  // ── Largeur par colonne → taille de police (jamais de débordement) ───
  const nCols = cols.length;
  const colMm = (USABLE_MM - NO_MM - NAME_MM) / Math.max(nCols, 1);
  const fs = Math.min(8.5, Math.max(5.5, (colMm - 1.2) / 1.5));

  const pages = paginate(j.rows, fs);
  const totalPages = pages.length + 1; // + récapitulatif

  const period = `${MONTHS_FR[j.month - 1]} ${j.year}`;
  const c = j.company;
  const generated = new Date(j.generatedAt).toLocaleDateString('fr-FR');
  const FONT = 'Calibri, Carlito, Arial, Helvetica, sans-serif';

  const pageStyle: React.CSSProperties = {
    width: '297mm', height: '210mm', boxSizing: 'border-box', background: '#fff',
    color: P.text, fontFamily: FONT, padding: '8mm 10mm 7mm', position: 'relative',
    overflow: 'hidden', pageBreakAfter: 'always', breakAfter: 'page',
  };

  const cellBase: React.CSSProperties = {
    border: `0.5px solid ${P.border}`, fontSize: fs, padding: '2.2px 3px', overflow: 'hidden',
  };

  // ── En-tête : identité entreprise + bandeau titre bleu marine ────────
  const Header = () => (
    <div style={{ marginBottom: 6 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
        {c.logo && (
          <img
            src={c.logo} alt={c.name} crossOrigin="anonymous"
            style={{ height: 34, maxWidth: 100, objectFit: 'contain', filter: mono ? 'grayscale(1)' : undefined }}
          />
        )}
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 12, fontWeight: 800, margin: 0, color: P.navy }}>
            {c.name}{c.legalForm ? ` (${c.legalForm})` : ''}
          </p>
          <p style={{ fontSize: 7, color: P.muted, margin: 0 }}>
            RCCM : {c.rccm}
            {c.taxNumber ? ` · NIU : ${c.taxNumber}` : ''}
            {c.cnssNumber ? ` · N° CNSS : ${c.cnssNumber}` : ''}
            {' · '}{c.address}, {c.city} · Tél : {c.phone} · {c.email}
          </p>
        </div>
      </div>
      <div style={{
        background: P.navy, color: '#fff', textAlign: 'center', fontWeight: 800,
        fontSize: 12.5, letterSpacing: 0.6, padding: '5px 8px',
      }}>
        JOURNAL DE PAIE — {period.toUpperCase()}
      </div>
    </div>
  );

  const Footer = ({ page }: { page: number }) => (
    <div style={{
      position: 'absolute', left: '10mm', right: '10mm', bottom: '4mm', display: 'flex',
      justifyContent: 'space-between', fontSize: 6.5, color: P.muted,
      borderTop: `0.5px solid ${P.border}`, paddingTop: 2,
    }}>
      <span>
        BRUT = base + primes + ancienneté + congés + heures sup. − absences · NET = brut − charges − retenues + indemnités non imposables ·
        Classement du plus payé au moins payé · Généré via Konza RH le {generated} · Montants en FCFA
      </span>
      <span style={{ whiteSpace: 'nowrap', marginLeft: 8 }}>Page {page} / {totalPages}</span>
    </div>
  );

  // ── Bandeau KPI (1re page) : liseré or, fond bleu clair ──────────────
  const kpis = [
    { l: j.options.hasExpat ? `EFFECTIF (dont ${j.summary.expatCount} expat.)` : 'EFFECTIF', v: String(j.summary.headcount) },
    { l: j.options.hasExpat ? 'BRUT TOTAL (CONGO + ÉTRANGER)' : 'MASSE SALARIALE BRUTE', v: `${fmtMoney(j.options.hasExpat ? j.summary.totalGross : j.summary.grossCongo)} F` },
    { l: 'CHARGES & RETENUES (CONGO)', v: `${fmtMoney(j.summary.totalChargesCongo + j.summary.retenues)} F` },
    { l: j.options.hasExpat ? 'NET TOTAL (CONGO + ÉTRANGER)' : 'NET À PAYER', v: `${fmtMoney(j.options.hasExpat ? j.summary.totalNet : j.summary.netCongo)} F` },
  ];
  const Kpis = () => (
    <div style={{ display: 'flex', gap: 5, marginBottom: 6 }}>
      {kpis.map((k) => (
        <div key={k.l} style={{
          flex: 1, background: P.kpiBg, border: `0.5px solid ${P.border}`,
          borderTop: `2.5px solid ${P.gold}`, padding: '3px 6px', textAlign: 'center',
        }}>
          <p style={{ fontSize: 6.5, fontWeight: 800, color: P.muted, margin: 0 }}>{k.l}</p>
          <p style={{ fontSize: 13, fontWeight: 800, color: P.navy, margin: 0 }}>{k.v}</p>
        </div>
      ))}
    </div>
  );

  return (
    <div id={id} style={{ width: '297mm', background: '#fff' }}>
      {pages.map((pageRows, pi) => {
        const isLast = pi === pages.length - 1;
        return (
          <div key={pi} data-journal-page style={pageStyle}>
            <Header />
            {pi === 0 && <Kpis />}

            <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
              <colgroup>
                <col style={{ width: `${NO_MM}mm` }} />
                <col style={{ width: `${NAME_MM}mm` }} />
                {cols.map((col) => <col key={col.id} />)}
              </colgroup>
              <thead style={{ display: 'table-header-group' }}>
                <tr>
                  <th rowSpan={2} style={{ ...cellBase, background: P.navy, color: '#fff', textAlign: 'center', fontWeight: 800 }}>N°</th>
                  <th rowSpan={2} style={{ ...cellBase, background: P.navy, color: '#fff', textAlign: 'center', fontWeight: 800 }}>Employé</th>
                  {spans.map((s, i) => (
                    <th
                      key={i} colSpan={s.span}
                      style={{
                        ...cellBase, background: groupBg(s.group), color: '#fff', textAlign: 'center',
                        fontWeight: 800, textTransform: 'uppercase', fontSize: Math.max(5, fs - 1),
                      }}
                    >
                      {GROUP_LABEL[s.group]}
                    </th>
                  ))}
                </tr>
                <tr>
                  {cols.map((col) => (
                    <th
                      key={col.id}
                      style={{
                        ...cellBase, background: groupBg(col.group), color: '#fff', textAlign: 'center',
                        fontWeight: 800, lineHeight: 1.15, fontSize: Math.max(5, fs - 0.5),
                      }}
                    >
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {pageRows.map((r, ri) => (
                  <tr key={r.employeeId} style={{ background: ri % 2 === 0 ? P.zebra : '#fff', pageBreakInside: 'avoid' }}>
                    <td style={{ ...cellBase, textAlign: 'center', color: P.muted }}>{r.rank}</td>
                    <td style={{ ...cellBase, textAlign: 'left', wordBreak: 'break-word' }}>
                      <span style={{ fontWeight: 800, color: P.navy }}>{r.employeeName}</span>
                      {r.isExpat && (
                        <span style={{ fontSize: fs - 1, fontWeight: 800 }}> [Expat {r.foreign.map((f) => f.countryCode).join('/')}]</span>
                      )}
                      <br />
                      <span style={{ fontSize: Math.max(5, fs - 1), color: P.muted }}>{r.position}</span>
                    </td>
                    {cols.map((col) => {
                      const v = col.get(r);
                      return (
                        <td
                          key={col.id}
                          style={{
                            ...cellBase, textAlign: 'right', whiteSpace: 'nowrap',
                            fontWeight: col.strong ? 800 : 400, color: v ? (col.strong ? P.navy : P.text) : '#94a3b8',
                          }}
                        >
                          {fmtMoney(v)}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>

              {isLast && (
                <tfoot>
                  <tr style={{ background: P.goldLight }}>
                    <td style={{ ...cellBase, borderTop: `1.5px double ${P.navy}` }} />
                    <td style={{ ...cellBase, borderTop: `1.5px double ${P.navy}`, fontWeight: 800, color: P.navy, textTransform: 'uppercase' }}>
                      Total ({j.rows.length})
                    </td>
                    {cols.map((col) => (
                      <td
                        key={col.id}
                        style={{
                          ...cellBase, borderTop: `1.5px double ${P.navy}`, textAlign: 'right',
                          fontWeight: 800, color: P.navy, whiteSpace: 'nowrap',
                        }}
                      >
                        {fmtMoney(col.total(j.totals))}
                      </td>
                    ))}
                  </tr>
                </tfoot>
              )}
            </table>

            <Footer page={pi + 1} />
          </div>
        );
      })}

      <RecapPage
        journal={j}
        pageStyle={{ ...pageStyle, pageBreakAfter: 'auto', breakAfter: 'auto' }}
        header={<Header />}
        footer={<Footer page={totalPages} />}
        palette={P}
        groupBg={groupBg}
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Page récapitulative — mêmes codes visuels (bandeaux marine, filets or)
// ─────────────────────────────────────────────────────────────────────────────

function RecapPage({
  journal: j, pageStyle, header, footer, palette: P, groupBg,
}: {
  journal: PayrollJournal;
  pageStyle: React.CSSProperties;
  header: React.ReactNode;
  footer: React.ReactNode;
  palette: { navy: string; gold: string; goldLight: string; kpiBg: string; zebra: string; border: string; text: string; muted: string };
  groupBg: (g: keyof typeof GROUP_COLOR) => string;
}) {
  const s = j.summary;
  const t = j.totals;
  const indemTotal = Object.values(t.indemnites).reduce((a, b) => a + b, 0);
  const primesTotal = Object.values(t.primes).reduce((a, b) => a + b, 0);
  const remuExtra = primesTotal + t.anciennete + t.conges + t.overtime;

  const box: React.CSSProperties = { border: `0.5px solid ${P.border}`, flex: 1 };
  const boxTitle = (bg: string): React.CSSProperties => ({
    background: bg, color: '#fff', fontSize: 9, fontWeight: 800, padding: '4px 8px', textTransform: 'uppercase',
  });
  const lineRow = (strong = false): React.CSSProperties => ({
    display: 'flex', justifyContent: 'space-between', padding: '3px 8px', fontSize: 9,
    fontWeight: strong ? 800 : 400, borderTop: `0.5px solid ${P.border}`,
    background: strong ? P.goldLight : undefined, color: strong ? P.navy : P.text,
  });
  const Line = ({ l, v, strong }: { l: string; v: number; strong?: boolean }) => (
    <div style={lineRow(strong)}>
      <span>{l}</span>
      <span style={{ fontVariantNumeric: 'tabular-nums' }}>{fmtMoney(v)} F</span>
    </div>
  );

  const foreignLines = j.rows.flatMap((r) => r.foreign.map((f) => ({ employee: r.employeeName, ...f })));

  return (
    <div data-journal-page style={pageStyle}>
      {header}
      <p style={{ fontSize: 10, fontWeight: 800, margin: '2px 0 6px', textTransform: 'uppercase', color: P.navy }}>
        Récapitulatif de la paie — {MONTHS_FR[j.month - 1]} {j.year}
      </p>

      <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
        <div style={box}>
          <div style={boxTitle(groupBg('REMUNERATION'))}>Paie Congo</div>
          <Line l="Salaires de base" v={t.baseSalary} />
          {remuExtra > 0 && <Line l="Primes, ancienneté, congés, heures sup." v={remuExtra} />}
          {t.absences > 0 && <Line l="Absences (déduction)" v={-t.absences} />}
          <Line l="Brut" v={t.grossCongo} strong />
          <Line l="CNSS salarié" v={t.cnss} />
          <Line l="ITS / BNC" v={t.its} />
          {s.customTaxes > 0 && <Line l="Autres taxes salarié (CAMU, TOL...)" v={s.customTaxes} />}
          {indemTotal > 0 && <Line l="Indemnités non imposables" v={indemTotal} />}
          {s.retenues > 0 && <Line l="Retenues (prêt, avance, autres)" v={s.retenues} />}
          <Line l="Net à payer — Congo" v={t.netCongo} strong />
        </div>

        <div style={box}>
          <div style={boxTitle(groupBg('NET'))}>Charges patronales &amp; coût</div>
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

        {j.options.hasExpat && (
          <div style={box}>
            <div style={boxTitle(groupBg('ETRANGER'))}>Total Congo + étranger</div>
            <Line l="Brut Congo" v={s.grossCongo} />
            <Line l="Brut étranger" v={s.foreignGross} />
            <Line l="Brut total" v={s.totalGross} strong />
            <Line l="Net Congo" v={s.netCongo} />
            <Line l="Net étranger" v={s.foreignNet} />
            <Line l="Net total" v={s.totalNet} strong />
          </div>
        )}
      </div>

      {j.options.hasExpat && foreignLines.length > 0 && (
        <div style={{ ...box, flex: 'none', marginTop: 8 }}>
          <div style={boxTitle(groupBg('ETRANGER'))}>Détail des rémunérations à l'étranger (saisies manuellement, en FCFA)</div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 8.5 }}>
            <thead>
              <tr style={{ background: P.kpiBg }}>
                {['Employé', 'Pays', 'Entité qui paie', 'Brut', 'Net', 'Note'].map((h, i) => (
                  <th key={h} style={{ padding: '3px 6px', textAlign: i === 3 || i === 4 ? 'right' : 'left', borderTop: `0.5px solid ${P.border}`, fontWeight: 800, color: P.navy }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {foreignLines.slice(0, 10).map((f) => (
                <tr key={f.id}>
                  <td style={{ padding: '2.5px 6px', borderTop: `0.5px solid ${P.border}`, fontWeight: 700 }}>{f.employee}</td>
                  <td style={{ padding: '2.5px 6px', borderTop: `0.5px solid ${P.border}` }}>{f.countryName} ({f.countryCode})</td>
                  <td style={{ padding: '2.5px 6px', borderTop: `0.5px solid ${P.border}` }}>{f.payerName || '—'}</td>
                  <td style={{ padding: '2.5px 6px', borderTop: `0.5px solid ${P.border}`, textAlign: 'right' }}>{fmtMoney(f.grossAmount)}</td>
                  <td style={{ padding: '2.5px 6px', borderTop: `0.5px solid ${P.border}`, textAlign: 'right', fontWeight: 700 }}>{fmtMoney(f.netAmount)}</td>
                  <td style={{ padding: '2.5px 6px', borderTop: `0.5px solid ${P.border}`, color: P.muted }}>{f.note || ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {foreignLines.length > 10 && (
            <p style={{ fontSize: 7.5, color: P.muted, margin: 0, padding: '3px 8px', borderTop: `0.5px solid ${P.border}` }}>
              … et {foreignLines.length - 10} autre(s) ligne(s) — voir le journal à l'écran ou l'export Excel.
            </p>
          )}
        </div>
      )}

      <div style={{ position: 'absolute', left: '10mm', right: '10mm', bottom: '12mm', display: 'flex', gap: 10 }}>
        {['Établi par (RH)', 'Vérifié par (Comptabilité)', 'Approuvé par (Direction)'].map((l) => (
          <div key={l} style={{ flex: 1, border: `0.5px solid ${P.border}`, borderTop: `2px solid ${P.gold}`, height: '24mm', padding: '4px 8px' }}>
            <p style={{ fontSize: 8, fontWeight: 800, margin: 0, color: P.navy }}>{l}</p>
            <p style={{ fontSize: 7, color: P.muted, margin: '2px 0 0' }}>Nom, date et signature</p>
          </div>
        ))}
      </div>

      {footer}
    </div>
  );
}