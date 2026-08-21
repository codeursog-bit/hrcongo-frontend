'use client';

// ============================================================================
// components/BulletinRendererClarifie/index.tsx  (v2)
//
// Gabarit "Bulletin de salaire clarifié" — reproduit la mise en page du
// modèle papier fourni par le client (bulletin AIRCAM / EBP).
//
// ✅ v2 — même architecture "canevas A4 fixe" que BulletinRendererDefault :
//    la page est une boîte de taille FIXE (210mm × 297mm, overflow: hidden,
//    flex column) — ce sont les lignes et colonnes qui sont pré-dimensionnées
//    pour occuper le bon espace, et le CONTENU vient se placer dedans, jamais
//    l'inverse. Le tableau principal vit dans un conteneur flex:1 avec
//    height:100%, exactement comme #main-grid dans le Default. Plus de
//    colonnes qui débordent / se coupent quel que soit le contenu.
// ============================================================================

import React, { useMemo } from 'react';
import type { BulletinPayroll, BulletinTemplateConfig, PayrollItem } from '@/types/bulletin-template';
import { classifyItems } from '@/lib/bulletin-items-classifier';
import { getBaseTemplate } from '@/lib/bulletin-templates';

export interface BulletinRendererClarifieProps {
  payroll:      BulletinPayroll;
  template?:    BulletinTemplateConfig;
  previewMode?: boolean;
}

const MONTHS = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet',
                'Août','Septembre','Octobre','Novembre','Décembre'];
const MARITAL: Record<string,string> = {
  SINGLE:'Célibataire', MARRIED:'Marié(e)', DIVORCED:'Divorcé(e)',
  WIDOWED:'Veuf/Veuve', COHABITING:'Union libre',
};
const PAYMENT: Record<string,string> = {
  BANK_TRANSFER:'Virement', CASH:'Espèces', MOBILE_MONEY:'Mobile Money', CHECK:'Chèque',
};
const CONTRACT: Record<string,string> = {
  CDI:'CDI', CDD:'CDD', STAGE:'Stage', CONSULTANT:'Consultant',
  PRESTATAIRE:'Prestataire', INTERIM:'Intérimaire', FREELANCE:'Freelance',
};

// ── Utilitaires numériques (identiques BulletinRenderer Default) ───────────
const nv     = (v: any): number => { const x = Number(v); return isFinite(x) ? x : 0; };
const fmt    = (v: any): string  => { const x = Math.round(nv(v)); return x === 0 ? '' : x.toLocaleString('fr-FR'); };
const fmtZ   = (v: any): string  => Math.round(nv(v)).toLocaleString('fr-FR');
const fmtD   = (v: any): string  => { const x = Math.round(nv(v)); return x === 0 ? '—' : x.toLocaleString('fr-FR'); };
const fmtNeg = (v: any): string  => { const x = Math.round(nv(v)); return x === 0 ? '' : `-${Math.abs(x).toLocaleString('fr-FR')}`; };
const fmtDate = (d?: string)     => d ? new Date(d).toLocaleDateString('fr-FR') : '—';

function seniority(hireDate?: string, asOf?: Date): string {
  if (!hireDate) return '—';
  // ✅ Ancrée sur la période du bulletin (fin de mois payé), pas sur la date
  // d'affichage — sinon un bulletin de janvier consulté en août affiche
  // l'ancienneté "au jour d'août".
  const hire = new Date(hireDate);
  const now  = asOf ?? new Date();
  if (isNaN(hire.getTime())) return '—';

  let months = (now.getFullYear() - hire.getFullYear()) * 12 + (now.getMonth() - hire.getMonth());
  if (now.getDate() < hire.getDate()) months--;
  // ✅ Ne jamais afficher de nombre négatif.
  if (months < 0 || !isFinite(months)) months = 0;

  const y = Math.floor(months / 12);
  const m = months % 12;

  // ✅ Moins d'un an : seulement les mois ("5 mois", "11 mois"), pas "0 an".
  if (y === 0) return `${m} mois`;
  return m === 0 ? `${y} an${y !== 1 ? 's' : ''}` : `${y} an${y !== 1 ? 's' : ''} et ${String(m).padStart(2,'0')} mois`;
}

function formatCategorie(code: string | null | undefined): string {
  if (!code) return '—';
  const m = code.match(/^[A-Z]+(\d+)-E(\d+)$/i);
  if (m) return `Cat.${m[1]} Éch.${m[2]}`;
  const m2 = code.match(/^E(\d+)-(\d+)$/i);
  if (m2) return `Cat.${m2[1]} Éch.${m2[2]}`;
  return code;
}

// ✅ Raccourcit les libellés longs pour qu'ils tiennent sur UNE ligne dans la
// largeur de colonne fixe (même logique que cleanLabel() du Default).
function cleanLabel(label: string): string {
  if (!label) return label;
  if (/taxe.{0,10}occupation.{0,10}locaux/i.test(label)) return 'T.O.L.';
  return label
    .replace(/\s*\(\d+h\)\s*—[^%]*/i, '')
    .replace(/\s*—\s*(5\s*premières?|heures?\s+suivantes?|nuit[^)]*|dimanche[^)]*)[^)]*$/i, '')
    .replace(/\s*\(\d+h\)/i, '')
    .replace(/\s*—\s*$/, '')
    .replace(' (part patronale)', '')
    .trim();
}

function itemBase(item: any): string {
  if (item.base == null || nv(item.base) === 0) return '';
  return Math.round(nv(item.base)).toLocaleString('fr-FR');
}
function itemTaux(item: any): string {
  if (item.quantity != null && nv(item.quantity) !== 0) return String(nv(item.quantity));
  if (item.rate == null) return '';
  const r = nv(item.rate);
  if (r === 0) return '';
  if (r > 0 && r < 1) return (r * 100).toFixed(3).replace('.', ',').replace(/,?0+$/, '');
  return Number.isInteger(r) ? String(r) : r.toFixed(2).replace('.', ',');
}

// ── En-tête entreprise : nom (+logo à droite si présent) ────────────────────
// - Sans logo : le nom garde toute la largeur de la case, sur une seule
//   ligne (comportement inchangé — pas de découpage même si le nom contient
//   un espace, ex. "PHARMACIE BANQUE DE VIE" reste sur une ligne).
// - Avec logo : la case se partage exactement 50% nom / 50% logo (agrandi,
//   centré verticalement). Le nom, lui, ne se découpe en 2 lignes QUE dans
//   ce cas — puisqu'il partage désormais sa moitié de case avec le logo —
//   1er mot en haut, reste du nom centré en dessous.
function CompanyNameLogo({ name, logo, nameStyle, logoHeight = 64 }: {
  name: string; logo?: string; nameStyle?: React.CSSProperties; logoHeight?: number;
}) {
  if (!logo) {
    return (
      <div style={{ ...nameStyle, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
        {name || '—'}
      </div>
    );
  }

  const parts = (name || '').trim().split(/\s+/);
  const hasSpace = parts.length > 1;
  const nameNode = hasSpace ? (
    <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
      <div style={{ overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{parts[0]}</div>
      <div style={{ overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', textAlign: 'center' }}>{parts.slice(1).join(' ')}</div>
    </div>
  ) : (
    <div style={{ overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{name || '—'}</div>
  );

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ width: '50%', minWidth: 0, ...nameStyle }}>{nameNode}</div>
      <div style={{ width: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logo} alt="" crossOrigin="anonymous" style={{ height: logoHeight, maxWidth: '100%', objectFit: 'contain' }} />
      </div>
    </div>
  );
}

// ── Tokens visuels — canevas A4 fixe, même logique que le Default ──────────
const SANS  = 'Arial,Helvetica,sans-serif';
const FONT  = '"Courier New",Courier,monospace';
const BD    = '0.5px solid #000';
const BDB   = '1px solid #000';
const TH_BG = '#d8d8d8';
const K     = '#000';

const ROW_H  = 17.5;   // hauteur de ligne fixe du tableau principal
const HEAD_H = 19;
const FS     = 9.6;

const th = (bg = TH_BG, o?: React.CSSProperties): React.CSSProperties => ({
  border: BD, padding: '1px 4px', fontSize: 9, fontWeight: 700,
  textAlign: 'center', background: bg, textTransform: 'uppercase',
  fontFamily: SANS, verticalAlign: 'middle', color: K,
  height: HEAD_H, lineHeight: `${HEAD_H}px`, overflow: 'hidden', ...o,
});
const td = (o?: React.CSSProperties): React.CSSProperties => ({
  borderLeft: BD, borderRight: 'none', borderTop: 'none', borderBottom: 'none',
  padding: '0 5px', height: ROW_H, lineHeight: `${ROW_H}px`, fontSize: FS,
  verticalAlign: 'middle', color: K, fontFamily: SANS, background: '#fff',
  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', ...o,
});
const tdR = (o?: React.CSSProperties) => td({ textAlign: 'right', fontFamily: FONT, ...o });
const tdC = (o?: React.CSSProperties) => td({ textAlign: 'center', ...o });

const SectionHeader = ({ children }: { children: React.ReactNode }) => (
  <tr style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}>
    <td colSpan={6} style={{ ...td({
      fontWeight: 800, fontSize: 10, textTransform: 'uppercase' as const,
      letterSpacing: .3, background: '#f0f0f0', whiteSpace: 'nowrap',
    }), borderRight: BD }}>
      {children}
    </td>
  </tr>
);

const DataRow = ({ label, base = '', tauxS = '', mtS = '', tauxP = '', mtP = '', indent = true, bold = false }:
  { label: string; base?: string; tauxS?: string; mtS?: string; tauxP?: string; mtP?: string; indent?: boolean; bold?: boolean }) => (
  <tr style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}>
    <td style={td({ paddingLeft: indent ? 13 : 5, fontWeight: bold ? 700 : 400, whiteSpace: 'nowrap' })}>{cleanLabel(label)}</td>
    <td style={tdR()}>{base}</td>
    <td style={tdC({ fontSize: 8.5, padding: '0 2px' })}>{tauxS}</td>
    <td style={tdR({ fontWeight: mtS ? 600 : 400 })}>{mtS}</td>
    <td style={tdC({ fontSize: 8.5, padding: '0 2px' })}>{tauxP}</td>
    <td style={tdR({ fontWeight: mtP ? 600 : 400, borderRight: BD })}>{mtP}</td>
  </tr>
);

const InfoLine = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div style={{ display: 'flex', gap: 5, fontSize: 9, marginBottom: 1 }}>
    <span style={{ color: '#555', minWidth: 84, flexShrink: 0 }}>{label}</span>
    <strong style={{ color: K, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{value}</strong>
  </div>
);

export default function BulletinRendererClarifie({ payroll, template, previewMode }: BulletinRendererClarifieProps) {
  const tpl = template ?? getBaseTemplate('clarifie');
  const e   = (payroll.employee ?? {}) as any;
  const co  = (payroll.company  ?? {}) as any;
  const items: PayrollItem[] = payroll.items ?? [];
  const ytd = (payroll as any).ytd ?? {};

  const { gainItems, cotisItems, indemItems, retenueItems, empItems } = useMemo(
    () => classifyItems(items), [items],
  );

  const cnssSal    = nv(payroll.cnssSalarial);
  const itsAmount  = nv(payroll.its);
  const totalBrut  = nv(payroll.grossSalary);
  const netSalary  = nv(payroll.netSalary);
  const cnssEmpPension  = nv(payroll.cnssEmployerPension);
  const cnssEmpFamily   = nv(payroll.cnssEmployerFamily);
  const cnssEmpAccident = nv(payroll.cnssEmployerAccident);
  const tusDgi  = nv((payroll as any).tusDgiAmount);
  const tusCnss = nv((payroll as any).tusCnssAmount);

  const absDeductItem = gainItems.find((i: any) => i.code === 'ABS_DEDUCT') ?? null;
  const gains  = gainItems.filter((i: any) => !['ABS_DEDUCT','ABS_CONGE'].includes(i.code));

  const CNSS_PAT_INDIVIDUAL = ['CNSS_EMP_PENSION','CNSS_EMP_FAMILY','CNSS_EMP_ACCIDENT',
    'CNSS_PENSION','CNSS_FAMILY','CNSS_ACCIDENT','CNSS_VIEILLESSE','CNSS_FAMILLE','CNSS_AT'];
  const isCnssPatSummary = (item: any) => {
    const lbl = (item.label ?? '').toLowerCase();
    if (CNSS_PAT_INDIVIDUAL.some(c => (item.code ?? '').toLowerCase().includes(c.toLowerCase()))) return true;
    return lbl.includes('pension') || lbl.includes('prestations familiales') || lbl.includes('accidents du travail');
  };

  const manualDeductions = retenueItems.filter((i: any) => i.code === 'MANUAL_DEDUCTION');
  const loanItems        = retenueItems.filter((i: any) => ['LOAN','ADVANCE'].includes(i.code));
  const ctaxEmp = cotisItems.filter((i: any) =>
    !['CNSS_SAL','CNSS','ITS','IRPP','BNC_SOURCE'].includes(i.code) && !isCnssPatSummary(i));
  const ctaxPat = ((empItems ?? []) as any[]).filter((i: any) =>
    !['TUS_DGI','TUS_CNSS'].includes(i.code) && !isCnssPatSummary(i));

  const totalPat = cnssEmpPension + cnssEmpFamily + cnssEmpAccident + tusDgi + tusCnss
    + ctaxPat.reduce((s: number, i: any) => s + nv(i.amount), 0);

  const congesDroits = nv(ytd.droitsConge ?? (payroll as any).congesDroits ?? 0);
  const congesPris   = nv(ytd.priseConge  ?? (payroll as any).congesPris   ?? 0);
  const _soldeRaw    = nv(ytd.soldeConge  ?? (payroll as any).congesSolde  ?? 0);
  const congesSolde  = _soldeRaw > 0 ? _soldeRaw : Math.max(0, congesDroits - congesPris);

  const ytdGross  = nv(ytd.grossSalary);
  const ytdCnss   = nv(ytd.cnssSalarial);
  const ytdCnssEmp = nv(ytd.cnssEmployer);
  const ytdNetImp = nv(ytd.netImposable) || (ytdGross - ytdCnss);

  const periodStart = `01/${String(payroll.month ?? 1).padStart(2,'0')}/${payroll.year}`;
  const periodEnd   = `${new Date(payroll.year, payroll.month, 0).getDate()}/${String(payroll.month ?? 1).padStart(2,'0')}/${payroll.year}`;
  const fullName = [e.civility === 'FEMALE' ? 'Mme' : e.civility === 'MALE' ? 'M.' : '', e.firstName, e.lastName?.toUpperCase()]
    .filter(Boolean).join(' ');
  const cat = formatCategorie(e.professionalCategory);
  const rawDept  = e.department?.name ?? '';
  const deptName = /no.dep/i.test(rawDept) || rawDept.trim() === '' ? '—' : rawDept;

  return (
    <>
      <style>{`
        @media print {
          @page { size: A4 portrait; margin: 8mm 6mm; }
          body { visibility: hidden !important; background: #fff !important; margin: 0 !important; padding: 0 !important; }
          #bul-wrap, #bul-wrap * { visibility: visible !important; }
          #bul-wrap { position: absolute !important; top: 0 !important; left: 0 !important; width: 100% !important; }
          #bul-clarifie {
            width: 195mm !important; height: 277mm !important; min-height: unset !important;
            padding: 6mm 7mm !important; margin: 0 auto !important;
            box-shadow: none !important; border: none !important; overflow: hidden !important;
          }
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          .nobreak, tr { page-break-inside: avoid !important; break-inside: avoid !important; }
        }
        #main-grid-clarifie {
          width: 100%; table-layout: fixed; border-collapse: collapse;
          border: ${BD}; height: 100%;
        }
        #main-grid-clarifie td, #main-grid-clarifie th { color: #000 !important; }
      `}</style>

      <div id="bul-wrap" data-bulletin-root="true" style={{ background: '#fff' }}>
      <div id="bul-clarifie" style={{
        fontFamily: SANS, fontSize: 10, lineHeight: 1.3, background: '#fff', color: K,
        width: '210mm', height: '297mm', boxSizing: 'border-box', padding: '6mm 7mm',
        margin: '0 auto', boxShadow: '0 2px 16px rgba(0,0,0,0.10)',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
      }}>

        {/* ══ TITRE ══════════════════════════════════════════════════ */}
        <div style={{ textAlign: 'center', fontSize: 16, fontWeight: 800, letterSpacing: .6, textTransform: 'uppercase', marginBottom: 4, flexShrink: 0 }}>
          Bulletin de salaire clarifié
        </div>

        {/* ══ EN-TÊTE : entreprise (encadré) + méta période/contrat ═══ */}
        <table className="nobreak" style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 4, flexShrink: 0 }}>
          <tbody>
            <tr>
              <td style={{ width: '44%', border: BDB, padding: '6px 8px', verticalAlign: 'top' }}>
                <CompanyNameLogo
                  name={co.tradeName || co.legalName || '—'}
                  logo={tpl.style.showLogo !== false ? co.logo : undefined}
                  logoHeight={64}
                  nameStyle={{ fontWeight: 800, fontSize: 12 }}
                />
                {co.legalForm && <div style={{ fontSize: 8.5, color: '#555', marginTop: 1 }}>{co.legalForm}</div>}
                {tpl.style.showAddress !== false && (
                  <div style={{ fontSize: 9, marginTop: 3, overflow: 'hidden' }}>
                    {co.address || '—'}<br/>
                    {[co.postalCode, co.city].filter(Boolean).join(' ')}
                  </div>
                )}
                {deptName !== '—' && (
                  <div style={{ fontSize: 8.5, marginTop: 5, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                    Ets de rattachement&nbsp;&nbsp;<strong>{deptName}</strong>
                  </div>
                )}
                {tpl.style.showFiscalNumbers !== false && (
                  <div style={{ fontSize: 8.5, marginTop: 3, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                    Siret&nbsp;<strong>{co.rccmNumber || '—'}</strong>
                    &nbsp;&nbsp;APE/NAF&nbsp;<strong>{co.nif || '—'}</strong>
                  </div>
                )}
              </td>
              <td style={{ width: '56%', padding: '6px 0 6px 14px', verticalAlign: 'top' }}>
                <div style={{ display: 'flex', gap: 5, fontSize: 9.5, marginBottom: 3 }}>
                  <span>Période du</span><strong>{periodStart}</strong><span>au</span><strong>{periodEnd}</strong>
                </div>
                <InfoLine label="Matricule"    value={e.employeeNumber || '—'} />
                <InfoLine label="N° contrat"   value={e.contractNumber || '—'} />
                <InfoLine label="Ancienneté"   value={seniority(e.hireDate, new Date(payroll.year, payroll.month, 0))} />
                <InfoLine label="Entrée"       value={fmtDate(e.hireDate)} />
                <InfoLine label="N° Sécu"      value={e.cnssNumber || '—'} />
                <InfoLine label="Horaires"     value="151,67" />

                <div style={{ background: '#eee', border: '0.5px solid #ccc', padding: '6px 8px', marginTop: 6, overflow: 'hidden' }}>
                  <div style={{ fontWeight: 800, fontSize: 11, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{fullName || '—'}</div>
                  {e.address && <div style={{ fontSize: 9, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.address}</div>}
                  {(e.postalCode || e.city) && (
                    <div style={{ fontSize: 9, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{[e.postalCode, e.city].filter(Boolean).join(' ')}</div>
                  )}
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        {/* ══ CONV. / EMPLOI / QUALIFICATION / SERVICE / CATÉGORIE ═══ */}
        <table className="nobreak" style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 4, tableLayout: 'fixed', flexShrink: 0 }}>
          <tbody>
            <tr>
              <td style={{ width: '18%', fontSize: 8.5, color: '#555', padding: '1px 0' }}>Conv. collective</td>
              <td style={{ width: '32%', fontSize: 9.5, fontWeight: 700, padding: '1px 4px 1px 0', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{co.collectiveAgreement || '—'}</td>
              <td style={{ width: '18%', fontSize: 8.5, color: '#555', padding: '1px 0' }}>Qualification</td>
              <td style={{ width: '32%', fontSize: 9.5, fontWeight: 700, padding: '1px 0', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{cat}</td>
            </tr>
            <tr>
              <td style={{ fontSize: 8.5, color: '#555', padding: '1px 0' }}>Emploi</td>
              <td style={{ fontSize: 9.5, fontWeight: 700, padding: '1px 4px 1px 0', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{e.position || '—'}</td>
              <td style={{ fontSize: 8.5, color: '#555', padding: '1px 0' }}>Service</td>
              <td style={{ fontSize: 9.5, fontWeight: 700, padding: '1px 0', textTransform: 'uppercase' as const, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{deptName}</td>
            </tr>
            <tr>
              <td style={{ fontSize: 8.5, color: '#555', padding: '1px 0' }}>Type de contrat</td>
              <td style={{ fontSize: 9.5, fontWeight: 700, padding: '1px 4px 1px 0' }}>{CONTRACT[e.contractType ?? ''] || e.contractType || '—'}</td>
              <td style={{ fontSize: 8.5, color: '#555', padding: '1px 0' }}>Sit. familiale</td>
              <td style={{ fontSize: 9.5, fontWeight: 700, padding: '1px 0' }}>{MARITAL[e.maritalStatus ?? ''] || '—'}</td>
            </tr>
            <tr>
              <td colSpan={4} style={{ fontSize: 8.5, color: '#555', padding: '4px 0 1px' }}>
                Paiement le <strong style={{ color: K }}>{fmtDate((payroll as any).paymentDate)}</strong>
                &nbsp;&nbsp;par&nbsp;&nbsp;<strong style={{ color: K }}>{PAYMENT[e.paymentMethod ?? ''] || 'Virement'}</strong>
              </td>
            </tr>
          </tbody>
        </table>

        {/* ══ TABLEAU PRINCIPAL — canevas fixe, remplit l'espace restant ═ */}
        <div style={{ flex: 1, minHeight: 0, position: 'relative' }}>
          <table id="main-grid-clarifie">
            <colgroup>
              <col style={{ width: '30%' }} /><col style={{ width: '11%' }} />
              <col style={{ width: '8%'  }} /><col style={{ width: '16%' }} />
              <col style={{ width: '8%'  }} /><col style={{ width: '27%' }} />
            </colgroup>
            <thead>
              <tr>
                <th rowSpan={2} style={th(TH_BG, { textAlign: 'left', paddingLeft: 5 })}>Désignation</th>
                <th rowSpan={2} style={th(TH_BG, { fontSize: 8 })}>Base ou nombre</th>
                <th colSpan={2} style={th('#c9c9c9')}>Gains et cotis. salariales</th>
                <th colSpan={2} style={th('#b6b6b6')}>Cotisations patronales</th>
              </tr>
              <tr>
                <th style={th('#c9c9c9', { fontSize: 8 })}>Taux</th>
                <th style={th('#c9c9c9', { fontSize: 8 })}>Montant</th>
                <th style={th('#b6b6b6', { fontSize: 8 })}>Taux</th>
                <th style={th('#b6b6b6', { fontSize: 8 })}>Montant</th>
              </tr>
            </thead>
            <tbody>

              {/* ── Gains ─────────────────────────────────────────────── */}
              {gains.map((item: any, idx: number) => (
                <DataRow key={item.id || item.code || idx} indent={false} bold={item.code === 'SAL_BASE'}
                  label={item.label} base={itemBase(item)} tauxS={itemTaux(item)} mtS={fmt(item.amount)} />
              ))}
              {absDeductItem && (
                <DataRow indent={false} label={absDeductItem.label}
                  base={absDeductItem.base ? Math.round(Number(absDeductItem.base)).toLocaleString('fr-FR') : ''}
                  mtS={fmtNeg(absDeductItem.amount)} />
              )}
              <tr style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}>
                <td style={{ ...td({ fontWeight: 800, textTransform: 'uppercase' as const, borderTop: BDB, borderBottom: BDB }) }}>Total brut</td>
                <td style={{ ...td({ borderTop: BDB, borderBottom: BDB }) }} />
                <td style={{ ...td({ borderTop: BDB, borderBottom: BDB }) }} />
                <td style={{ ...tdR({ fontWeight: 800, borderTop: BDB, borderBottom: BDB }) }}>{fmtZ(totalBrut)}</td>
                <td style={{ ...td({ borderTop: BDB, borderBottom: BDB }) }} />
                <td style={{ ...td({ borderTop: BDB, borderBottom: BDB, borderRight: BD }) }} />
              </tr>

              {/* ── Sécurité sociale (CNSS) ─────────────────────────────── */}
              <SectionHeader>Sécurité sociale (CNSS)</SectionHeader>
              <DataRow label="CNSS salariale (plafond 1 200 000)" base={fmtZ(Math.min(totalBrut,1_200_000))} tauxS="4,00%" mtS={fmtNeg(cnssSal)} />
              {cnssEmpPension  > 0 && <DataRow label="CNSS Pension"  base={fmtZ(Math.min(totalBrut,1_200_000))} tauxP="8,00%"  mtP={fmtNeg(cnssEmpPension)} />}
              {cnssEmpFamily   > 0 && <DataRow label="CNSS Famille"  base={fmtZ(Math.min(totalBrut,600_000))}   tauxP="10,03%" mtP={fmtNeg(cnssEmpFamily)} />}
              {cnssEmpAccident > 0 && <DataRow label="CNSS Accident du travail" base={fmtZ(Math.min(totalBrut,600_000))} tauxP="2,25%" mtP={fmtNeg(cnssEmpAccident)} />}

              {/* ── Impôts sur salaires (ITS / TUS) ─────────────────────── */}
              {(itsAmount > 0 || tusDgi > 0 || tusCnss > 0) && <>
                <SectionHeader>Impôts sur salaires (ITS / TUS)</SectionHeader>
                {itsAmount > 0 && <DataRow label="ITS mois" base={fmt(totalBrut - cnssSal)} mtS={fmtNeg(itsAmount)} />}
                {tusCnss   > 0 && <DataRow label="Taxe unique/salaire (CNSS)" base={fmtZ(totalBrut)} tauxP="5,475%" mtP={fmtNeg(tusCnss)} />}
                {tusDgi    > 0 && <DataRow label="Taxe unique/salaire (DGI)"  base={fmtZ(totalBrut)} tauxP="2,025%" mtP={fmtNeg(tusDgi)} />}
              </>}

              {/* ── Autres cotisations et taxes ─────────────────────────── */}
              {(ctaxEmp.length > 0 || ctaxPat.length > 0 || loanItems.length > 0 || manualDeductions.length > 0) && <>
                <SectionHeader>Autres cotisations et retenues</SectionHeader>
                {ctaxEmp.map((item: any) => (
                  <DataRow key={item.id || item.code} label={item.label} base={itemBase(item)} tauxS={itemTaux(item)} mtS={fmtNeg(item.amount)} />
                ))}
                {ctaxPat.map((item: any) => (
                  <DataRow key={item.id || item.code} label={item.label} tauxP={itemTaux(item)} mtP={fmtNeg(item.amount)} />
                ))}
                {loanItems.map((item: any) => (
                  <DataRow key={item.id || item.code} label={item.label} base={itemBase(item)} tauxS={itemTaux(item)} mtS={fmtNeg(item.amount)} />
                ))}
                {manualDeductions.map((item: any, idx: number) => (
                  <DataRow key={item.id || item.code || idx} label={item.label} mtS={fmtNeg(item.amount)} />
                ))}
              </>}

              {/* ── Indemnités hors cotisation ───────────────────────────── */}
              {indemItems.length > 0 && <>
                <SectionHeader>Indemnités et avantages</SectionHeader>
                {indemItems.map((item: any) => (
                  <DataRow key={item.id || item.code} indent={false} label={item.label} base={itemBase(item)} tauxS={itemTaux(item)} mtS={fmt(item.amount)} />
                ))}
              </>}

              {/* ── Spacer — absorbe l'espace restant du canevas A4 fixe (au
                   lieu de le répartir sur chaque ligne de contenu) ────────── */}
              <tr id="grid-spacer-clarifie" style={{ background: '#fff' }}>
                <td style={{ borderLeft: BD, background: '#fff' }} />
                <td style={{ borderLeft: BD, background: '#fff' }} />
                <td style={{ borderLeft: BD, background: '#fff' }} />
                <td style={{ borderLeft: BD, background: '#fff' }} />
                <td style={{ borderLeft: BD, background: '#fff' }} />
                <td style={{ borderLeft: BD, borderRight: BD, background: '#fff' }} />
              </tr>

              {/* ── Salaire net ──────────────────────────────────────────── */}
              <tr style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}>
                <td style={{ ...td({ fontWeight: 900, fontSize: 12, textTransform: 'uppercase' as const, borderTop: BDB, borderBottom: BDB }), background: '#eee' }}>Salaire net</td>
                <td style={{ ...td({ borderTop: BDB, borderBottom: BDB }), background: '#eee' }} />
                <td style={{ ...td({ borderTop: BDB, borderBottom: BDB }), background: '#eee' }} />
                <td style={{ ...tdR({ fontWeight: 900, fontSize: 12.5, borderTop: BDB, borderBottom: BDB }), background: '#eee' }}>{fmtZ(netSalary)}</td>
                <td style={{ ...td({ borderTop: BDB, borderBottom: BDB }), background: '#eee' }} />
                <td style={{ ...td({ borderTop: BDB, borderBottom: BDB, borderRight: BD }), background: '#eee' }} />
              </tr>
            </tbody>
          </table>
        </div>

        {/* ══ CUMULS MOIS / ANNÉE + NET À PAYER ═══════════════════════ */}
        <table className="nobreak" style={{ width: '100%', borderCollapse: 'collapse', marginTop: 4, border: BDB, tableLayout: 'fixed', flexShrink: 0 }}>
          <thead>
            <tr>
              <th style={th(TH_BG, { width: '9%' })}></th>
              <th style={th(TH_BG)}>Salaire brut</th>
              <th style={th(TH_BG)}>Chg. salariales</th>
              <th style={th(TH_BG)}>Chg. patronales</th>
              <th style={th(TH_BG)}>Net imposable</th>
              <th style={th(TH_BG)}>Heures</th>
              <th rowSpan={3} style={{ ...th('#eee', { width: '18%', height: 'auto' }), textTransform: 'none' as const }}>
                <div style={{ fontSize: 8.5, letterSpacing: 1, whiteSpace: 'nowrap' }}>NET À PAYER</div>
                <div style={{ fontFamily: FONT, fontSize: 16, fontWeight: 900, marginTop: 2 }}>{fmtZ(netSalary)}</div>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={tdC({ fontWeight: 800 })}>Mois</td>
              <td style={tdR()}>{fmtZ(totalBrut)}</td>
              <td style={tdR()}>{fmtD(cnssSal + itsAmount)}</td>
              <td style={tdR()}>{fmtD(totalPat)}</td>
              <td style={tdR()}>{fmtZ(totalBrut - cnssSal)}</td>
              <td style={{ ...tdR({ borderRight: BD }) }}>{fmt((payroll.workedDays ?? 0) * 8) || '—'}</td>
            </tr>
            <tr>
              <td style={{ ...tdC({ fontWeight: 800, borderTop: BD }) }}>Année</td>
              <td style={{ ...tdR({ borderTop: BD }) }}>{fmtD(ytdGross)}</td>
              <td style={{ ...tdR({ borderTop: BD }) }}>{fmtD(ytdCnss)}</td>
              <td style={{ ...tdR({ borderTop: BD }) }}>{fmtD(ytdCnssEmp)}</td>
              <td style={{ ...tdR({ borderTop: BD }) }}>{fmtD(ytdNetImp)}</td>
              <td style={{ ...tdR({ borderTop: BD, borderRight: BD }) }}>—</td>
            </tr>
          </tbody>
        </table>

        {/* ══ CONGÉS ANNUELS — Acquis / Pris / Solde ═══════════════════ */}
        <table className="nobreak" style={{ width: '100%', borderCollapse: 'collapse', border: BDB, borderTop: 'none', tableLayout: 'fixed', flexShrink: 0 }}>
          <thead>
            <tr>
              <th style={th('#eee', { width: '9%' })}>Congés</th>
              <th style={th('#eee')}>Acquis</th>
              <th style={th('#eee')}>Pris</th>
              <th style={th('#eee')}>Solde</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={tdC({ fontWeight: 800 })}>Jours</td>
              <td style={tdR()}>{congesDroits > 0 ? fmtD(congesDroits) : '—'}</td>
              <td style={tdR()}>{congesPris > 0 ? fmtD(congesPris) : '—'}</td>
              <td style={{ ...tdR({ borderRight: BD }) }}>{congesSolde > 0 ? fmtD(congesSolde) : '—'}</td>
            </tr>
          </tbody>
        </table>

        {/* ══ SIGNATURES ══════════════════════════════════════════════ */}
        <table className="nobreak" style={{ width: '100%', borderCollapse: 'collapse', border: BDB, borderTop: 'none', tableLayout: 'fixed', flexShrink: 0 }}>
          <tbody>
            <tr>
              <td style={{ padding: '5px 8px', borderRight: BD, verticalAlign: 'top', height: 34 }}>
                <div style={{ fontSize: 8.5, fontWeight: 700, textTransform: 'uppercase' as const }}>Signature de l&apos;Employé(e)</div>
              </td>
              <td style={{ padding: '5px 8px', verticalAlign: 'top', textAlign: 'center', height: 34 }}>
                <div style={{ fontSize: 8.5, fontWeight: 700, textTransform: 'uppercase' as const }}>Direction Générale</div>
              </td>
            </tr>
          </tbody>
        </table>

        {tpl.style.footerMessage && (
          <div style={{ textAlign: 'center', fontSize: 8.5, fontStyle: 'italic', marginTop: 3, flexShrink: 0 }}>{tpl.style.footerMessage}</div>
        )}

        {/* ══ MENTIONS LÉGALES ══════════════════════════════════════════ */}
        <div style={{ fontSize: 8, color: '#333', marginTop: 4, borderTop: '0.5px solid #999', paddingTop: 3, flexShrink: 0 }}>
          Pour vous aider à faire valoir vos droits, conservez ce bulletin de paie sans limitation de durée.
          <span style={{ display: 'flex', justifyContent: 'space-between', marginTop: 2 }}>
            <span>CNSS sal. 4% · ITS barème 2026 · SMIG 70 400 FCFA</span>
            <strong style={{ color: K }}>KONZARH</strong>
          </span>
        </div>

      </div>
      </div>
    </>
  );
}