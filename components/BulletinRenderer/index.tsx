'use client';
// ============================================================================
// BulletinRendererDefault v6
// ✅ Hauteur fixe A4 297mm — tableau principal flex:1 remplit l'espace
// ✅ Signature/cumuls toujours en bas
// ✅ Colonnes fixes — occupent toute la largeur dès le départ
// ✅ Textes 11px lignes normales, 12-13px totaux/net
// ✅ Impression propre : color-scheme:light, noir sur blanc, 0.5px bordures
// ✅ Pas de coupure : break-inside:avoid sur tr + conteneur
// ✅ Textes toujours #000, bg gris UNIQUEMENT pour les en-têtes
// ============================================================================

import React, { useMemo } from 'react';
import type { BulletinPayroll, BulletinTemplateConfig, PayrollItem } from '@/types/bulletin-template';
import { classifyItems } from '@/lib/bulletin-items-classifier';

export interface BulletinRendererDefaultProps {
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
const CONTRACT: Record<string,string> = {
  CDI:'CDI Temps Plein', CDD:'CDD', STAGE:'Stage',
  CONSULTANT:'Consultant', INTERIM:'Intérimaire', FREELANCE:'Freelance',
};

const nv  = (v: any): number => { const x = Number(v); return isFinite(x) ? x : 0; };
const fmt  = (v: any): string => { const x=Math.round(nv(v)); return x===0?'':x.toLocaleString('fr-FR'); };
const fmtZ = (v: any): string => Math.round(nv(v)).toLocaleString('fr-FR');
const fmtD = (v: any): string => { const x=Math.round(nv(v)); return x===0?'—':x.toLocaleString('fr-FR'); };
const fmtDate = (d?: string) => d ? new Date(d).toLocaleDateString('fr-FR') : '—';

function seniority(h?: string): string {
  if (!h) return '—';
  const hire=new Date(h), now=new Date();
  let y=now.getFullYear()-hire.getFullYear(), m=now.getMonth()-hire.getMonth();
  if (m<0){y--;m+=12;}
  return `${y} an${y!==1?'s':''} et ${String(m).padStart(2,'0')} mois`;
}

function cleanLabel(label: string): string {
  if (!label) return label;
  return label
    .replace(/\s*\(\d+h\)\s*—[^%]*/i, '')
    .replace(/\s*—\s*(5\s*premières?|heures?\s+suivantes?|nuit[^)]*|dimanche[^)]*)[^)]*$/i, '')
    .replace(/\s*\(\d+h\)/i, '')
    .replace(/\s*—\s*$/, '')
    .trim();
}

function itemBase(item: any): string {
  if (item.base==null||nv(item.base)===0) return '';
  const base=nv(item.base), rate=nv(item.rate);
  const label = item.label ?? '';
  const isOT = /^HS_\d+$/i.test(item.code??'')
             || /OT|OVER|HSUP|H_SUP|HEURE_SUP/i.test(item.code??'')
             || /heure[s]?\s+suppl/i.test(label);
  if (isOT) {
    if (rate > 1) return Math.round(base * rate).toLocaleString('fr-FR');
    const matchPct = label.match(/\+\s*(\d+)\s*%/);
    if (matchPct) return Math.round(base * (1 + parseInt(matchPct[1],10)/100)).toLocaleString('fr-FR');
    if (rate > 0 && rate < 1) return Math.round(base * (1+rate)).toLocaleString('fr-FR');
  }
  return Math.round(base).toLocaleString('fr-FR');
}

function itemTaux(item: any): string {
  const label = item.label ?? '';
  const isOT = /^HS_\d+$/i.test(item.code??'')
             || /OT|OVER|HSUP|H_SUP|HEURE_SUP/i.test(item.code??'')
             || /heure[s]?\s+suppl/i.test(label);
  if (isOT){ const q=nv(item.quantity); if(q>0) return String(q); }
  const qty=item.quantity; if(qty!=null&&nv(qty)!==0) return String(nv(qty));
  const r=nv(item.rate); if(!r||r===1) return '';
  if(r>1&&r<=3) return r.toFixed(2).replace('.',',');
  if(r>0&&r<1){const p=r*100; return p%1===0?p.toFixed(0):p.toFixed(3).replace(/0+$/,'');}
  return String(r);
}

// ── Constantes design ─────────────────────────────────────────────────────────
const FONT   = '"Courier New",Courier,monospace';
const SANS   = 'Arial,Helvetica,sans-serif';
const BD     = '0.5px solid #000';   // bordure standard
const TH_BG  = '#d0d0d0';            // fond en-têtes
const BLACK  = '#000';

// Hauteurs de ligne
const ROW_H       = 22;   // ligne normale
const TOTAL_H     = 27;   // ligne total
const HEADER_H    = 18;   // en-têtes tableau
const FS_NORMAL   = 11;   // taille texte normal
const FS_TOTAL    = 12;   // taille texte total
const FS_NET      = 14;   // taille Net à payer

// ── Styles de cellule ─────────────────────────────────────────────────────────

/** Cellule normale — bordure gauche seulement (colonne) */
const cell = (e?: React.CSSProperties): React.CSSProperties => ({
  borderLeft: BD,
  borderRight: 'none',
  borderTop: 'none',
  borderBottom: 'none',
  padding: '0 4px',
  height: ROW_H,
  fontSize: FS_NORMAL,
  lineHeight: `${ROW_H}px`,
  verticalAlign: 'middle',
  color: BLACK,
  fontFamily: SANS,
  background: '#fff',
  ...e,
});

const cellR = (e?: React.CSSProperties): React.CSSProperties => ({
  ...cell(),
  textAlign: 'right',
  fontFamily: FONT,
  whiteSpace: 'nowrap' as const,
  ...e,
});

const cellC = (e?: React.CSSProperties): React.CSSProperties => ({
  ...cell(),
  textAlign: 'center',
  ...e,
});

/** En-tête de colonne */
const th = (bg = TH_BG, e?: React.CSSProperties): React.CSSProperties => ({
  border: BD,
  padding: '2px 4px',
  fontSize: 9,
  fontWeight: 700,
  textAlign: 'center',
  background: bg,
  color: BLACK,
  textTransform: 'uppercase' as const,
  fontFamily: SANS,
  height: HEADER_H,
  lineHeight: `${HEADER_H}px`,
  verticalAlign: 'middle',
  ...e,
});

// ── Ligne Total ───────────────────────────────────────────────────────────────
const TotalRow = ({ label, gain='', ret='', patMt='' }:
  { label: string; gain?: string; ret?: string; patMt?: string }) => {

  const base: React.CSSProperties = {
    borderTop: `1px solid ${BLACK}`,
    borderBottom: `1px solid ${BLACK}`,
    height: TOTAL_H,
    lineHeight: `${TOTAL_H}px`,
    fontSize: FS_TOTAL,
    fontWeight: 900,
    color: BLACK,
    background: '#e8e8e8',
    verticalAlign: 'middle',
    padding: '0 5px',
  };

  return (
    <tr style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}>
      <td colSpan={4} style={{ ...base, borderLeft: BD, textTransform: 'uppercase' as const, fontFamily: SANS }}>
        {label}
      </td>
      <td style={{ ...base, borderLeft: BD, textAlign: 'right', fontFamily: FONT }}>{gain}</td>
      <td style={{ ...base, borderLeft: BD, textAlign: 'right', fontFamily: FONT }}>{ret}</td>
      <td style={{ ...base, borderLeft: BD }} />
      <td style={{ ...base, borderLeft: BD, borderRight: BD, textAlign: 'right', fontFamily: FONT }}>{patMt}</td>
    </tr>
  );
};

// ── Ligne normale ─────────────────────────────────────────────────────────────
const Row = ({ rub, label, base='', taux='', gain='', ret='',
               patTaux='', patMt='', bold=false }:
  { rub: number|string; label: string; base?: string; taux?: string;
    gain?: string; ret?: string; patTaux?: string; patMt?: string; bold?: boolean }) => {

  const td: React.CSSProperties = {
    padding: '0 4px',
    margin: 0,
    fontSize: FS_NORMAL,
    height: ROW_H,
    lineHeight: `${ROW_H}px`,
    verticalAlign: 'middle',
    color: BLACK,
    borderLeft: BD,
    borderTop: 'none',
    borderBottom: 'none',
    borderRight: 'none',
    background: '#fff',
    whiteSpace: 'nowrap' as const,
    overflow: 'hidden',
  };

  return (
    <tr style={{ background: '#fff', pageBreakInside: 'avoid', breakInside: 'avoid' }}>
      <td style={{ ...td, textAlign: 'center', fontFamily: FONT }}>{rub}</td>
      <td style={{ ...td, paddingLeft: 5, fontWeight: bold ? 700 : 400, fontFamily: SANS, whiteSpace: 'normal' as const }}>{label}</td>
      <td style={{ ...td, textAlign: 'right', fontFamily: FONT }}>{base}</td>
      <td style={{ ...td, textAlign: 'center', fontFamily: SANS }}>{taux}</td>
      <td style={{ ...td, textAlign: 'right', fontFamily: FONT, fontWeight: gain ? 600 : 400 }}>{gain}</td>
      <td style={{ ...td, textAlign: 'right', fontFamily: FONT, fontWeight: ret ? 600 : 400 }}>{ret}</td>
      <td style={{ ...td, textAlign: 'center', fontFamily: SANS, fontWeight: patTaux ? 600 : 400 }}>{patTaux}</td>
      <td style={{ ...td, textAlign: 'right', fontFamily: FONT, fontWeight: patMt ? 600 : 400, borderRight: BD }}>{patMt}</td>
    </tr>
  );
};

// ── Composant principal ───────────────────────────────────────────────────────
export function BulletinRendererDefault({ payroll }: BulletinRendererDefaultProps) {
  const e   = (payroll.employee ?? {}) as any;
  const co  = (payroll.company  ?? {}) as any;
  const items: PayrollItem[] = payroll.items ?? [];
  const ytd = (payroll as any).ytd ?? {};

  const { gainItems, cotisItems, indemItems, retenueItems, empItems } = useMemo(
    () => classifyItems(items), [items],
  );

  const cnssSal         = nv(payroll.cnssSalarial);
  const itsAmount       = nv(payroll.its);
  const itsBase         = nv(payroll.grossSalary) - cnssSal;
  const totalBrut       = nv(payroll.grossSalary);
  const netSalary       = nv(payroll.netSalary);
  const fiscalParts     = nv((payroll as any).irppFiscalParts) || 1;
  const cnssEmpPension  = nv(payroll.cnssEmployerPension);
  const cnssEmpFamily   = nv(payroll.cnssEmployerFamily);
  const cnssEmpAccident = nv(payroll.cnssEmployerAccident);
  const tusDgi          = nv((payroll as any).tusDgiAmount);
  const tusCnss         = nv((payroll as any).tusCnssAmount);

  const gains  = gainItems.filter((i:any)=>!['ABS_DEDUCT','ABS_CONGE'].includes(i.code));
  const indems = indemItems;

  const CNSS_PAT_SUMMARY_CODES = ['CNSS_PAT_SUMMARY','CNSS_PATRON_SUMMARY','CNSS_PAT','CNSS_EMPLOYER_TOTAL'];
  const CNSS_PAT_INDIVIDUAL_CODES = ['CNSS_EMP_PENSION','CNSS_EMP_FAMILY','CNSS_EMP_ACCIDENT',
    'CNSS_PENSION','CNSS_FAMILY','CNSS_ACCIDENT','CNSS_VIEILLESSE','CNSS_FAMILLE','CNSS_AT'];

  const isCnssPatSummary = (item: any) => {
    const label: string = (item.label ?? '').toLowerCase();
    const code: string  = (item.code  ?? '').toLowerCase();
    const hasPension  = label.includes('pension');
    const hasFamille  = label.includes('famil');
    const hasAccident = label.includes('accident') || label.includes(' at ') || label.includes('at 1');
    if (hasPension && (hasFamille || hasAccident)) return true;
    if (CNSS_PAT_SUMMARY_CODES.includes(item.code)) return true;
    if (CNSS_PAT_INDIVIDUAL_CODES.some(c => code.includes(c.toLowerCase()))) return true;
    return false;
  };
  const TUS_CODES = ['TUS_DGI','TUS_CNSS'];

  const ctaxEmp = cotisItems.filter((i:any)=>
    !['CNSS_SAL','CNSS','ITS','IRPP','BNC_SOURCE'].includes(i.code) &&
    !['LOAN','ADVANCE'].includes(i.code) &&
    !isCnssPatSummary(i) &&
    !TUS_CODES.includes(i.code)
  ).concat(retenueItems.filter((i:any)=>!['LOAN','ADVANCE'].includes(i.code)));

  const ctaxPat = ((empItems??[]) as any[]).filter((i:any)=>
    !TUS_CODES.includes(i.code) && !isCnssPatSummary(i)
  );

  const loanItems = retenueItems.filter((i:any)=>['LOAN','ADVANCE'].includes(i.code));

  const totalPat = cnssEmpPension + cnssEmpFamily + cnssEmpAccident + tusCnss + tusDgi
    + ctaxPat.reduce((s:number,i:any)=>s+nv(i.amount),0);

  const ytdNetImp  = nv(ytd.grossSalary) - nv(ytd.cnssSalarial);
  const monthLabel = MONTHS[(payroll.month??1)-1];
  const fullName   = [e.lastName?.toUpperCase(), e.firstName].filter(Boolean).join(' ');
  const cat        = [e.professionalCategory, e.echelon?`Ech.${e.echelon}`:null].filter(Boolean).join('/');
  const deptName   = e.department?.name ?? '';

  let gainRef  = 1000;
  let patRef   = 3500;
  let indemRef = 5390;
  let loanRef  = 6699;

  return (
    <>
      <style>{`
        /* ── Reset impression ─────────────────────────────── */
        @media print {
          @page {
            size: A4 portrait;
            margin: 6mm;
          }
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            background: #fff !important;
            color-scheme: light !important;
          }
          /* Masquer tout sauf le bulletin */
          body > *:not(#bul-root) { display: none !important; }
          nav, header, aside, footer,
          [class*="sidebar"], [class*="Sidebar"],
          [class*="navbar"],  [class*="Navbar"],
          .no-print { display: none !important; }

          #bul-root {
            display: block !important;
            position: fixed !important;
            top: 0; left: 0;
            width: 100% !important;
            height: 100% !important;
            background: #fff !important;
            z-index: 99999 !important;
          }

          #bul-default {
            width: 197mm !important;
            height: 285mm !important;
            padding: 4mm 5mm !important;
            margin: 0 auto !important;
            box-shadow: none !important;
            border: none !important;
            background: #fff !important;
            color-scheme: light !important;
          }

          /* Garantir couleurs à l'impression */
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
            color-scheme: light !important;
          }

          /* Pas de coupure dans les blocs importants */
          .nb { page-break-inside: avoid !important; break-inside: avoid !important; }
          tr  { page-break-inside: avoid !important; break-inside: avoid !important; }
        }

        /* ── Forcer light mode même si app en dark mode ───── */
        #bul-root, #bul-default {
          color-scheme: light;
          forced-color-adjust: none;
        }

        /* ── Typo globale du tableau ──────────────────────── */
        #bul-default table {
          border-collapse: collapse;
        }
        #bul-default .main-table td,
        #bul-default .main-table th {
          color: #000 !important;
        }
      `}</style>

      {/* Wrapper racine — intercepte le dark mode app */}
      <div id="bul-root" style={{
        colorScheme: 'light',
        forcedColorAdjust: 'none',
        background: '#fff',
        display: 'block',
      } as React.CSSProperties}>
      <div id="bul-default" style={{
        fontFamily: SANS,
        fontSize: `${FS_NORMAL}px`,
        lineHeight: 1.4,
        background: '#fff',
        color: BLACK,
        /* Taille fixe A4 */
        width: '197mm',
        height: '285mm',
        boxSizing: 'border-box' as const,
        padding: '5mm 6mm',
        margin: '0 auto',
        boxShadow: '0 2px 16px rgba(0,0,0,0.10)',
        /* Flex colonne pour que le tableau principal remplisse l'espace */
        display: 'flex',
        flexDirection: 'column' as const,
        overflow: 'hidden',
      }}>

        {/* ══ EN-TÊTE SOCIÉTÉ + SALARIÉ ════════════════════════════════════ */}
        <table className="nb" style={{ width:'100%', borderCollapse:'collapse', marginBottom: 3, border: BD }}>
          <tbody>
            <tr>
              <td style={{ width:'34%', padding:'4px 6px', borderRight: BD, fontWeight: 900, fontSize: 12, textTransform:'uppercase' as const, color: BLACK }}>
                {co.tradeName||co.legalName||'—'}
              </td>
              <td style={{ width:'29%', padding:'4px 6px', borderRight: BD, fontWeight: 900, fontSize: 11, color: BLACK }}>
                {fullName||'—'}
              </td>
              <td style={{ width:'15%', padding:'4px 6px', borderRight: BD, fontSize: 9, color: BLACK }}>
                Affectation : <strong>{deptName||'—'}</strong>
              </td>
              <td style={{ width:'12%', padding:'4px 6px', borderRight: BD, fontSize: 9, color: BLACK }}>
                Poste : <strong>{e.position||'—'}</strong>
              </td>
              <td rowSpan={3} style={{ width:'10%', padding:'5px 6px', textAlign:'center', verticalAlign:'middle', background: TH_BG, color: BLACK }}>
                <div style={{ fontSize: 7, fontWeight: 700, letterSpacing: 1.5, textTransform:'uppercase' as const, color: BLACK }}>
                  Bulletin de Paie
                </div>
                <div style={{ fontSize: 18, fontWeight: 900, fontFamily: FONT, marginTop: 2, color: BLACK }}>
                  {monthLabel.slice(0,4).toUpperCase()}
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, fontFamily: FONT, color: BLACK }}>
                  {payroll.year}
                </div>
              </td>
            </tr>
            <tr style={{ borderTop: BD }}>
              <td style={{ padding:'3px 6px', borderRight: BD, fontSize: 8, color: BLACK }}>
                {[co.address,co.city].filter(Boolean).join(', ')}
                {co.phone&&<span> · Tél : {co.phone}</span>}
              </td>
              <td style={{ padding:'3px 6px', borderRight: BD, fontSize: 8, color: BLACK }}>
                Cat / Ech : <strong>{cat||'—'}</strong>
              </td>
              <td style={{ padding:'3px 6px', borderRight: BD, fontSize: 8, color: BLACK }}>
                Matr. : <strong>{e.employeeNumber||'—'}</strong>
              </td>
              <td style={{ padding:'3px 6px', borderRight: BD, fontSize: 8, color: BLACK }}>
                {e.paymentMethod==='BANK_TRANSFER'?'Virement bancaire':'Espèces'}
              </td>
            </tr>
            <tr style={{ borderTop: BD }}>
              <td style={{ padding:'3px 6px', borderRight: BD, fontSize: 8, color: BLACK }}>
                RCCM : <strong>{co.rccmNumber||'—'}</strong>
                {co.cnssNumber&&<span> · CNSS Emp : <strong>{co.cnssNumber}</strong></span>}
              </td>
              <td colSpan={3} style={{ padding:'3px 6px', fontSize: 8, color: BLACK }}>
                Conv. : <strong>{co.collectiveAgreement||'—'}</strong>
                {co.nif&&<span> · NIU : <strong>{co.nif}</strong></span>}
              </td>
            </tr>
          </tbody>
        </table>

        {/* ══ INFO SALARIÉ ═════════════════════════════════════════════════ */}
        <table className="nb" style={{ width:'100%', borderCollapse:'collapse', marginBottom: 3, border: BD }}>
          <thead>
            <tr>
              {['Date embauche','N° CNSS/CRF','Sit. familiale','Nbr Enfant','Ancienneté','Nbr part IRPP','Type de contrat'].map(h=>(
                <th key={h} style={th(TH_BG, { fontSize: 8, padding:'3px 4px', color: BLACK })}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              {[
                fmtDate(e.hireDate),
                e.cnssNumber||'—',
                MARITAL[e.maritalStatus??'']||'—',
                nv(e.numberOfChildren)||'—',
                seniority(e.hireDate),
                fiscalParts,
                CONTRACT[e.contractType??'']||e.contractType||'—',
              ].map((val, idx) => (
                <td key={idx} style={{
                  ...cellC({ fontSize: 9 }),
                  borderLeft: BD,
                  borderBottom: BD,
                  borderRight: idx === 6 ? BD : 'none',
                  color: BLACK,
                  height: 22,
                  lineHeight: '22px',
                  fontWeight: idx === 5 ? 700 : 400,
                }}>
                  {val}
                </td>
              ))}
            </tr>
          </tbody>
        </table>

        {/* ══ TABLEAU PRINCIPAL — flex:1 pour remplir l'espace vertical ═══ */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' as const, minHeight: 0, overflow: 'hidden' }}>
          <table className="main-table" style={{
            width: '100%',
            borderCollapse: 'collapse',
            tableLayout: 'fixed' as const,
            border: BD,
            /* Le tbody s'étire pour remplir l'espace */
            height: '100%',
          }}>
            <colgroup>
              {/* Rubrique | Libellé | Base | Taux | Gains | Retenues | Taux Pat | Montant Pat */}
              <col style={{ width: '5%'  }} />
              <col style={{ width: '26%' }} />
              <col style={{ width: '11%' }} />
              <col style={{ width: '5%'  }} />
              <col style={{ width: '13%' }} />
              <col style={{ width: '13%' }} />
              <col style={{ width: '6%'  }} />
              <col style={{ width: '21%' }} />
            </colgroup>
            <thead>
              <tr>
                <th rowSpan={2} style={th(TH_BG, { color: BLACK })}>Rubrique</th>
                <th rowSpan={2} style={th(TH_BG, { textAlign:'left', paddingLeft: 5, color: BLACK })}>Libellé</th>
                <th rowSpan={2} style={th(TH_BG, { color: BLACK })}>Nbre / Base</th>
                <th rowSpan={2} style={th(TH_BG, { color: BLACK })}>Taux</th>
                <th colSpan={2} style={th('#b8b8b8', { fontSize: 9, color: BLACK })}>Part Salariale</th>
                <th colSpan={2} style={th('#a0a0a0', { fontSize: 9, color: BLACK })}>Part Patronale</th>
              </tr>
              <tr>
                <th style={th('#b8b8b8', { color: BLACK })}>Gains</th>
                <th style={th('#b8b8b8', { color: BLACK })}>Retenues</th>
                <th style={th('#a0a0a0', { color: BLACK })}>Taux</th>
                <th style={th('#a0a0a0', { color: BLACK })}>Montant</th>
              </tr>
            </thead>

            <tbody>
              {/* ── Gains ──────────────────────────────────────────── */}
              {gains.map((item:any, idx:number) => {
                gainRef++;
                return (
                  <Row key={item.id||item.code||idx}
                    rub={gainRef}
                    label={cleanLabel(item.label)}
                    base={itemBase(item)}
                    taux={itemTaux(item)}
                    gain={fmt(item.amount)}
                    bold={item.code==='SAL_BASE'}
                  />
                );
              })}

              {/* ── Ligne vide flexible — pousse le reste vers le bas ─ */}
              <tr style={{ background: '#fff' }}>
                <td colSpan={8} style={{ height: 'auto', borderLeft: BD, borderRight: BD, background: '#fff' }} />
              </tr>

              <TotalRow label="Total Brut" gain={fmtZ(totalBrut)} />

              {/* ── CNSS salariale ─────────────────────────────────── */}
              <Row rub={2505} label="CNSS (plafond 1.200.000)"
                base={fmtZ(Math.min(totalBrut, 1_200_000))} taux="4,00"
                ret={fmt(cnssSal)} />

              {/* ── CNSS patronale — 3 lignes ──────────────────────── */}
              {cnssEmpPension  > 0 && (()=>{ patRef+=10; return <Row key="cp" rub={patRef}
                label="CNSS Pension (plafond 1.200.000)"
                base={fmtZ(Math.min(totalBrut,1_200_000))}
                patTaux="8,00" patMt={fmt(cnssEmpPension)} />; })()}
              {cnssEmpFamily   > 0 && (()=>{ patRef+=10; return <Row key="cf" rub={patRef}
                label="CNSS Famille (plafond 600.000)"
                base={fmtZ(Math.min(totalBrut,600_000))}
                patTaux="10,03" patMt={fmt(cnssEmpFamily)} />; })()}
              {cnssEmpAccident > 0 && (()=>{ patRef+=10; return <Row key="ca" rub={patRef}
                label="CNSS Accident (plafond 600.000)"
                base={fmtZ(Math.min(totalBrut,600_000))}
                patTaux="2,25" patMt={fmt(cnssEmpAccident)} />; })()}

              {/* ── TUS CNSS + TUS DGI (patronaux) ────────────────── */}
              {tusCnss > 0 && (()=>{ patRef+=10; return <Row key="tc" rub={patRef}
                label="Taxe unique sur salaire (CNSS)"
                base={fmtZ(totalBrut)} patTaux="5,475%" patMt={fmt(tusCnss)} />; })()}
              {tusDgi  > 0 && (()=>{ patRef+=10; return <Row key="td" rub={patRef}
                label="Taxe unique sur salaire (DGI)"
                base={fmtZ(totalBrut)} patTaux="2,025%" patMt={fmt(tusDgi)} />; })()}

              {/* ── Autres cotisations patronales ──────────────────── */}
              {ctaxPat.map((item:any) => {
                patRef+=10;
                return <Row key={item.id||item.code}
                  rub={patRef}
                  label={cleanLabel(item.label.replace(' (part patronale)',''  ))}
                  base={itemBase(item)} patTaux={itemTaux(item)} patMt={fmt(item.amount)} />;
              })}

              <TotalRow label="Total cotisations" ret={fmtZ(cnssSal)} patMt={fmtZ(totalPat)} />

              {/* ── ITS ───────────────────────────────────────────── */}
              {itsAmount > 0 && (
                <Row rub={4520} label="ITS / IRPP Mois"
                  base={fmt(itsBase)} taux="Barème" ret={fmt(itsAmount)} />
              )}

              {/* ── Cotisations salariales supplémentaires ─────────── */}
              {(()=>{
                const taxMap = new Map<string,{emp:any|null,pat:any|null}>();
                ctaxEmp.forEach((i:any)=>{
                  const k=i.code.replace(/^CTAX_/,'');
                  if(!taxMap.has(k)) taxMap.set(k,{emp:null,pat:null});
                  taxMap.get(k)!.emp=i;
                });
                let rub=4600;
                return Array.from(taxMap.entries()).map(([k,{emp,pat}])=>{
                  rub++;
                  const fixedRub: Record<string,number> = {TOL:4601,CAMU:4650};
                  const r = fixedRub[k] ?? rub;
                  const label=cleanLabel(emp?.label??pat?.label?.replace(' (part patronale)','')?? k);
                  return <Row key={k} rub={r} label={label}
                    base={emp?itemBase(emp):(pat?itemBase(pat):'')}
                    taux={emp?itemTaux(emp):''}
                    ret={emp?fmt(emp.amount):''}
                    patTaux={pat?itemTaux(pat):''}
                    patMt={pat?fmt(pat.amount):''} />;
                });
              })()}

              {/* ── Prêts / Avances ───────────────────────────────── */}
              {loanItems.map((item:any) => {
                loanRef++;
                return <Row key={item.id||item.code}
                  rub={loanRef} label={cleanLabel(item.label)}
                  base={itemBase(item)} taux={itemTaux(item)}
                  ret={fmt(item.amount)} />;
              })}

              {/* ── Indemnités ────────────────────────────────────── */}
              {indems.map((item:any) => {
                indemRef+=10;
                return <Row key={item.id||item.code}
                  rub={indemRef} label={cleanLabel(item.label)}
                  base={itemBase(item)} taux={itemTaux(item)}
                  gain={fmt(item.amount)} />;
              })}

            </tbody>
          </table>
        </div>

        {/* ══ MODE RÈGLEMENT + NET À PAYER ═════════════════════════════════ */}
        <table className="nb" style={{ width:'100%', borderCollapse:'collapse', marginTop: 4, border: BD, flexShrink: 0 }}>
          <tbody>
            <tr>
              <td style={{ width:'14%', padding:'4px 6px', borderRight: BD, background: TH_BG, fontWeight: 700, textAlign:'center', fontSize: 10, color: BLACK }}>
                Mode règlement
              </td>
              <td style={{ width:'22%', padding:'4px 6px', borderRight: BD, fontSize: 10, color: BLACK }}>
                Banque : <strong>{e.bankName||'—'}</strong>
                {e.bankAccountNumber && (
                  <div style={{ fontSize: 8, color: BLACK }}>N° : <strong>{e.bankAccountNumber}</strong></div>
                )}
              </td>
              <td style={{ width:'10%', padding:'4px 6px', borderRight: BD, fontSize: 10, color: BLACK }}>
                {e.paymentMethod==='BANK_TRANSFER'?'Virement':'Espèces'}
              </td>
              <td style={{ width:'12%', padding:'4px 6px', borderRight: BD, background: TH_BG, fontWeight: 700, textAlign:'center', fontSize: 10, color: BLACK }}>
                Net à payer
              </td>
              {/* Valeur Net à payer — bien mise en évidence */}
              <td style={{ width:'16%', padding:'4px 10px', borderRight: BD, fontWeight: 900, fontSize: FS_NET, textAlign:'right', fontFamily: FONT, background:'#f0f0f0', color: BLACK }}>
                {fmtZ(netSalary)}
              </td>
              <td style={{ width:'12%', padding:'4px 6px', borderRight: BD, textAlign:'center', fontSize: 9, color: BLACK }}>
                2ème banque
              </td>
              <td style={{ width:'14%', padding:'4px 6px', fontSize: 9, color: BLACK }}>
                Droits annuels :
              </td>
            </tr>
          </tbody>
        </table>

        {/* ══ CUMULS + SIGNATURES ══════════════════════════════════════════ */}
        <table className="nb" style={{ width:'100%', borderCollapse:'collapse', marginTop: 5, border: BD, flexShrink: 0 }}>
          <colgroup>
            <col style={{ width:'19%' }} /> {/* Signature Employé */}
            <col style={{ width:'5%'  }} /> {/* CUMULS */}
            <col style={{ width:'10%' }} /> {/* Brut */}
            <col style={{ width:'11%' }} /> {/* Net imposable */}
            <col style={{ width:'9%'  }} /> {/* Charges Sal */}
            <col style={{ width:'9%'  }} /> {/* Charges Pat */}
            <col style={{ width:'6%'  }} /> {/* Droits */}
            <col style={{ width:'5%'  }} /> {/* Pris */}
            <col style={{ width:'6%'  }} /> {/* Solde */}
            <col style={{ width:'20%' }} /> {/* Signature DRH */}
          </colgroup>
          <thead>
            <tr>
              <th style={{ border:'none', background:'transparent' }} />
              <th rowSpan={2} style={th(TH_BG, { fontSize: 8, verticalAlign:'middle', color: BLACK })}>Cumuls</th>
              <th rowSpan={2} style={th(TH_BG, { fontSize: 8, verticalAlign:'middle', color: BLACK })}>Brut</th>
              <th rowSpan={2} style={th(TH_BG, { fontSize: 8, verticalAlign:'middle', color: BLACK })}>Net imposable</th>
              <th rowSpan={2} style={th(TH_BG, { fontSize: 8, verticalAlign:'middle', color: BLACK })}>Charges Sal</th>
              <th rowSpan={2} style={th(TH_BG, { fontSize: 8, verticalAlign:'middle', color: BLACK })}>Charges Pat</th>
              <th colSpan={3} style={th(TH_BG, { fontSize: 8, color: BLACK })}>Congés annuels</th>
              <th style={{ border:'none', background:'transparent' }} />
            </tr>
            <tr>
              <th style={{ border:'none', background:'transparent' }} />
              <th style={th(TH_BG, { fontSize: 7.5, color: BLACK })}>Droits</th>
              <th style={th(TH_BG, { fontSize: 7.5, color: BLACK })}>Pris</th>
              <th style={th(TH_BG, { fontSize: 7.5, color: BLACK })}>Solde</th>
              <th style={{ border:'none', background:'transparent' }} />
            </tr>
          </thead>
          <tbody>
            {/* Ligne Mois */}
            <tr>
              <td rowSpan={2} style={{
                padding: '6px 8px',
                borderRight: BD,
                verticalAlign: 'top',
                color: BLACK,
              }}>
                <div style={{ fontSize: 8.5, fontWeight: 700, textTransform:'uppercase' as const, color: BLACK }}>
                  Signature de l'Employé(e)
                </div>
                <div style={{ height: 28, borderBottom: BD, marginTop: 22 }} />
              </td>
              <td style={cellC({ fontWeight: 700, fontSize: 9, borderLeft: BD, color: BLACK })}>Mois</td>
              <td style={cellR({ fontWeight: 700, fontSize: 9, borderLeft: BD, color: BLACK })}>{fmtZ(totalBrut)}</td>
              <td style={cellR({ fontSize: 9, borderLeft: BD, color: BLACK })}>{fmtZ(nv(payroll.grossSalary)-cnssSal)}</td>
              <td style={cellR({ fontSize: 9, borderLeft: BD, color: BLACK })}>{fmtD(cnssSal)}</td>
              <td style={cellR({ fontSize: 9, borderLeft: BD, color: BLACK })}>{fmtD(totalPat)}</td>
              <td style={cell({ borderLeft: BD, color: BLACK })} />
              <td style={cell({ borderLeft: BD, color: BLACK })} />
              <td style={cell({ borderLeft: BD, color: BLACK })} />
              <td rowSpan={2} style={{
                padding: '6px 8px',
                borderLeft: BD,
                verticalAlign: 'top',
                textAlign: 'center',
                color: BLACK,
              }}>
                <div style={{ fontSize: 8.5, fontWeight: 700, textTransform:'uppercase' as const, color: BLACK }}>
                  DRH / Direction
                </div>
                <div style={{ height: 28, borderBottom: BD, marginTop: 22, width:'70%', marginLeft:'auto', marginRight:'auto' }} />
              </td>
            </tr>
            {/* Ligne Année */}
            <tr>
              <td style={cellC({ fontWeight: 700, fontSize: 9, borderLeft: BD, borderTop: BD, color: BLACK })}>Année</td>
              <td style={cellR({ fontWeight: 700, fontSize: 9, borderLeft: BD, borderTop: BD, color: BLACK })}>{fmtD(ytd.grossSalary)}</td>
              <td style={cellR({ fontSize: 9, borderLeft: BD, borderTop: BD, color: BLACK })}>{fmtD(ytdNetImp)}</td>
              <td style={cellR({ fontSize: 9, borderLeft: BD, borderTop: BD, color: BLACK })}>{fmtD(ytd.cnssSalarial)}</td>
              <td style={cellR({ fontSize: 9, borderLeft: BD, borderTop: BD, color: BLACK })}>{fmtD(ytd.cnssEmployer)}</td>
              <td style={cell({ borderLeft: BD, borderTop: BD, color: BLACK })} />
              <td style={cell({ borderLeft: BD, borderTop: BD, color: BLACK })} />
              <td style={cell({ borderLeft: BD, borderTop: BD, color: BLACK })} />
            </tr>
          </tbody>
        </table>

        {/* ══ PIED DE PAGE ════════════════════════════════════════════════ */}
        <div style={{
          borderTop: '0.5px solid #999',
          marginTop: 4,
          paddingTop: 3,
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: 7.5,
          color: '#444',
          flexShrink: 0,
        }}>
          <span>CNSS sal. 4% · ITS barème 2026 · Parts fiscales maintenues · SMIG 70 400 FCFA · Décret N°78-360</span>
          <span style={{ fontWeight: 700, color: BLACK }}>KONZARH</span>
        </div>

      </div>
      </div>
    </>
  );
}

export default BulletinRendererDefault;