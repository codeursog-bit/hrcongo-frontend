'use client';
// ============================================================================
// BulletinRendererDefault v8
// ✅ Cumuls Année : grossSalary + cnssSalarial + cnssEmployer + its depuis ytd
// ✅ Charges Sal Année = ytd.cnssSalarial uniquement (CNSS 4% — pas ITS ni TOL)
// ✅ Net imposable Année = ytd.grossSalary - ytd.cnssSalarial
// ✅ Tout le reste identique v7 — design intact
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
  CDI:'CDI', CDD:'CDD', STAGE:'Stage',
  CONSULTANT:'Consultant', INTERIM:'Intérimaire', FREELANCE:'Freelance',
};

const nv   = (v: any): number => { const x = Number(v); return isFinite(x) ? x : 0; };
const fmt  = (v: any): string  => { const x = Math.round(nv(v)); return x === 0 ? '' : x.toLocaleString('fr-FR'); };
const fmtZ = (v: any): string  => Math.round(nv(v)).toLocaleString('fr-FR');
const fmtD = (v: any): string  => { const x = Math.round(nv(v)); return x === 0 ? '—' : x.toLocaleString('fr-FR'); };
const fmtDate = (d?: string)   => d ? new Date(d).toLocaleDateString('fr-FR') : '—';

function seniority(h?: string): string {
  if (!h) return '—';
  const hire = new Date(h), now = new Date();
  let y = now.getFullYear() - hire.getFullYear();
  let m = now.getMonth()    - hire.getMonth();
  if (m < 0) { y--; m += 12; }
  return `${y} an${y !== 1 ? 's' : ''} et ${String(m).padStart(2,'0')} mois`;
}

function formatCategorie(code: string | null | undefined): string {
  if (!code) return '—';
  // "PH5-E2" / "C5-E2" / "I11-E1" → "Cat.5 Éch.2" / "Cat.11 Éch.1"
  const m = code.match(/^[A-Z]+(\d+)-E(\d+)$/i);
  if (m) return `Cat.${m[1]} Éch.${m[2]}`;
  // BTP employés : "E8-1" → "Cat.8 Éch.1"
  const m2 = code.match(/^E(\d+)-(\d+)$/i);
  if (m2) return `Cat.${m2[1]} Éch.${m2[2]}`;
  return code; // fallback : affiche tel quel
}

function cleanLabel(label: string): string {
  if (!label) return label;
  // ✅ TOL : raccourcir le label pour éviter le débordement
  if (/taxe.{0,10}occupation.{0,10}locaux/i.test(label)) return 'T.O.L.';
  return label
    .replace(/\s*\(\d+h\)\s*—[^%]*/i, '')
    .replace(/\s*—\s*(5\s*premières?|heures?\s+suivantes?|nuit[^)]*|dimanche[^)]*)[^)]*$/i, '')
    .replace(/\s*\(\d+h\)/i, '')
    .replace(/\s*—\s*$/, '')
    .trim();
}

function itemBase(item: any): string {
  if (item.base == null || nv(item.base) === 0) return '';
  const base = nv(item.base), rate = nv(item.rate);
  const label = item.label ?? '';
  const isOT = /^HS_\d+$/i.test(item.code ?? '')
    || /OT|OVER|HSUP|H_SUP|HEURE_SUP/i.test(item.code ?? '')
    || /heure[s]?\s+suppl/i.test(label);
  if (isOT) {
    if (rate > 1) return Math.round(base * rate).toLocaleString('fr-FR');
    const m = label.match(/\+\s*(\d+)\s*%/);
    if (m) return Math.round(base * (1 + parseInt(m[1], 10) / 100)).toLocaleString('fr-FR');
    if (rate > 0 && rate < 1) return Math.round(base * (1 + rate)).toLocaleString('fr-FR');
  }
  return Math.round(base).toLocaleString('fr-FR');
}

function itemTaux(item: any): string {
  const label = item.label ?? '';
  const isOT = /^HS_\d+$/i.test(item.code ?? '')
    || /OT|OVER|HSUP|H_SUP|HEURE_SUP/i.test(item.code ?? '')
    || /heure[s]?\s+suppl/i.test(label);
  if (isOT) { const q = nv(item.quantity); if (q > 0) return String(q); }
  const qty = item.quantity; if (qty != null && nv(qty) !== 0) return String(nv(qty));
  // ✅ Si rate absent ou null → rien (gain = base direct, pas de calcul)
  if (item.rate == null || item.rate === undefined) return '';
  const r = nv(item.rate);
  if (r === 0) return '';
  // ✅ Rate entre 0 et 1 :
  // - Ancienneté (rate=années/100, ex: 0.11) → afficher "11 ans"
  // - Autres (gratification 0.5 etc.) → afficher décimal "0,50"
  if (r > 0 && r < 1) {
    if (/anc[iè]/i.test(label)) return String(Math.round(r * 100));
    return r.toFixed(2).replace('.', ',');
  }
  // ✅ Rate = 1 → afficher "1" (congés, montant fixe avec base)
  if (r === 1) return '1';
  // Rate > 1 (multiplicateur HS)
  if (r > 1 && r <= 3) return r.toFixed(2).replace('.', ',');
  return String(r);
}

// ── Tokens visuels ────────────────────────────────────────────────────────────
const FONT  = '"Courier New",Courier,monospace';
const SANS  = 'Arial,Helvetica,sans-serif';
const BD    = '0.5px solid #000';
const BDB   = '1px solid #000';
const TH_BG = '#d0d0d0';
const K     = '#000';

const ROW_H   = 21;
const TOT_H   = 26;
const HEAD_H  = 17;
const FS      = 11;
const FS_TOT  = 12;
const FS_NET  = 15;

// ── Helpers styles ────────────────────────────────────────────────────────────
const base_td = (o?: React.CSSProperties): React.CSSProperties => ({
  borderLeft: BD, borderRight: 'none', borderTop: 'none', borderBottom: 'none',
  padding: '0 4px', height: ROW_H, lineHeight: `${ROW_H}px`,
  fontSize: FS, verticalAlign: 'middle', color: K, fontFamily: SANS, background: '#fff',
  ...o,
});
const tdR = (o?: React.CSSProperties) => base_td({ textAlign: 'right', fontFamily: FONT, whiteSpace: 'nowrap', ...o });
const tdC = (o?: React.CSSProperties) => base_td({ textAlign: 'center', ...o });

const TH = (bg = TH_BG, o?: React.CSSProperties): React.CSSProperties => ({
  border: BD, padding: '0 3px', fontSize: 8.5, fontWeight: 700,
  textAlign: 'center', background: bg, color: K,
  textTransform: 'uppercase', fontFamily: SANS,
  height: HEAD_H, lineHeight: `${HEAD_H}px`, verticalAlign: 'middle',
  ...o,
});

// ── Ligne Total ───────────────────────────────────────────────────────────────
const TotalRow = ({ label, gain = '', ret = '', patMt = '' }:
  { label: string; gain?: string; ret?: string; patMt?: string }) => {
  const s: React.CSSProperties = {
    borderTop: BDB, borderBottom: BDB, height: TOT_H, lineHeight: `${TOT_H}px`,
    fontSize: FS_TOT, fontWeight: 900, color: K, background: '#e2e2e2',
    verticalAlign: 'middle', padding: '0 5px',
  };
  return (
    <tr style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}>
      <td colSpan={4} style={{ ...s, borderLeft: BD, fontFamily: SANS, textTransform: 'uppercase' }}>{label}</td>
      <td style={{ ...s, borderLeft: BD, textAlign: 'right', fontFamily: FONT }}>{gain}</td>
      <td style={{ ...s, borderLeft: BD, textAlign: 'right', fontFamily: FONT }}>{ret}</td>
      <td style={{ ...s, borderLeft: BD }} />
      <td style={{ ...s, borderLeft: BD, borderRight: BD, textAlign: 'right', fontFamily: FONT }}>{patMt}</td>
    </tr>
  );
};

// ── Ligne normale ─────────────────────────────────────────────────────────────
const Row = ({ rub, label, base = '', taux = '', gain = '', ret = '',
               patTaux = '', patMt = '', bold = false }:
  { rub: number | string; label: string; base?: string; taux?: string;
    gain?: string; ret?: string; patTaux?: string; patMt?: string; bold?: boolean }) => (
  <tr style={{ background: '#fff', pageBreakInside: 'avoid', breakInside: 'avoid' }}>
    <td style={tdC({ fontFamily: FONT })}>{rub}</td>
    <td style={base_td({ paddingLeft: 5, fontWeight: bold ? 700 : 400, whiteSpace: 'normal', overflow: 'hidden' })}>{label}</td>
    <td style={tdR()}>{base}</td>
    <td style={tdC({ fontSize: 9, overflow: 'hidden', whiteSpace: 'nowrap', padding: '0 2px' })}>{taux}</td>
    <td style={tdR({ fontWeight: gain ? 600 : 400 })}>{gain}</td>
    <td style={tdR({ fontWeight: ret  ? 600 : 400 })}>{ret}</td>
    <td style={tdC({ fontWeight: patTaux ? 600 : 400 })}>{patTaux}</td>
    <td style={tdR({ fontWeight: patMt  ? 600 : 400, borderRight: BD })}>{patMt}</td>
  </tr>
);

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

  // ── Cumuls annuels ─────────────────────────────────────────────────────────
  // Tous les champs viennent du backend (somme réelle Jan → mois actuel)
  // Le front ne calcule RIEN — il lit et affiche.
  // Congés annuels — depuis ytd si disponibles
  // ✅ Congés depuis LeaveBalance (via ytd.droitsConge) — noms corrects
  const congesDroits  = nv(ytd.droitsConge ?? (payroll as any).congesDroits ?? 0);
  const congesPris    = nv(ytd.priseConge  ?? (payroll as any).congesPris   ?? 0);
  const congesSolde   = nv(ytd.soldeConge  ?? (payroll as any).congesSolde  ?? 0);

  const ytdGross      = nv(ytd.grossSalary);
  const ytdCnss       = nv(ytd.cnssSalarial);
  const ytdIts        = nv(ytd.its);
  const ytdCnssEmp    = nv(ytd.cnssEmployer);
  // ✅ Net imposable et Net annuel — viennent du back (carryOver inclus)
  const ytdNetImp    = nv(ytd.netImposable)   || (ytdGross - ytdCnss);  // back calcule, fallback local
  const ytdNetSalary = nv(ytd.netSalaryAnnual) || nv(ytd.netSalary);   // net à payer annuel
  const ytdChargesSal = ytdCnss;  // ✅ Charges sal = CNSS salariale uniquement (4%)

  const gains  = gainItems.filter((i: any) => !['ABS_DEDUCT','ABS_CONGE'].includes(i.code));
  const indems = indemItems;

  // ── Totaux pour la ligne "Total" avant net à payer ──────────────────────


  const CNSS_PAT_SUMMARY   = ['CNSS_PAT_SUMMARY','CNSS_PATRON_SUMMARY','CNSS_PAT','CNSS_EMPLOYER_TOTAL'];
  const CNSS_PAT_INDIVIDUAL = ['CNSS_EMP_PENSION','CNSS_EMP_FAMILY','CNSS_EMP_ACCIDENT',
    'CNSS_PENSION','CNSS_FAMILY','CNSS_ACCIDENT','CNSS_VIEILLESSE','CNSS_FAMILLE','CNSS_AT'];
  const TUS_CODES = ['TUS_DGI','TUS_CNSS'];

  const isCnssPatSummary = (item: any) => {
    const lbl  = (item.label ?? '').toLowerCase();
    const code = (item.code  ?? '').toLowerCase();
    if (lbl.includes('pension') && (lbl.includes('famil') || lbl.includes('accident'))) return true;
    if (CNSS_PAT_SUMMARY.includes(item.code)) return true;
    if (CNSS_PAT_INDIVIDUAL.some(c => code.includes(c.toLowerCase()))) return true;
    if (lbl.includes('cnss patronale') && lbl.includes('famil'))    return true;
    if (lbl.includes('cnss patronale') && lbl.includes('accident')) return true;
    if (lbl.includes('cnss patronale') && lbl.includes('pension'))  return true;
    if (lbl.includes('prestations familiales'))                      return true;
    if (lbl.includes('accidents du travail'))                        return true;
    return false;
  };

  // ✅ Autres retenues manuelles — affichage direct sans base/taux
  const manualDeductions = retenueItems.filter((i: any) => i.code === 'MANUAL_DEDUCTION');

  const ctaxEmp = cotisItems.filter((i: any) =>
    !['CNSS_SAL','CNSS','ITS','IRPP','BNC_SOURCE'].includes(i.code) &&
    !['LOAN','ADVANCE'].includes(i.code) &&
    !isCnssPatSummary(i) && !TUS_CODES.includes(i.code)
  ).concat(retenueItems.filter((i: any) =>
    !['LOAN','ADVANCE'].includes(i.code) && i.code !== 'MANUAL_DEDUCTION'
  ));

  const ctaxPat = ((empItems ?? []) as any[]).filter((i: any) =>
    !TUS_CODES.includes(i.code) && !isCnssPatSummary(i)
  );

  const loanItems = retenueItems.filter((i: any) => ['LOAN','ADVANCE'].includes(i.code));

  // ✅ Totaux pour ligne "Total" — déclarés après ctaxEmp et loanItems
  const totalGains    = gains.reduce((s: number, i: any) => s + nv(i.amount), 0)
    + indems.reduce((s: number, i: any) => s + nv(i.amount), 0);
  const totalRetenues = cnssSal + itsAmount
    + ctaxEmp.reduce((s: number, i: any) => s + nv(i.amount), 0)
    + loanItems.reduce((s: number, i: any) => s + nv(i.amount), 0)
    + manualDeductions.reduce((s: number, i: any) => s + nv(i.amount), 0);

  const totalPat    = cnssEmpPension + cnssEmpFamily + cnssEmpAccident + tusCnss + tusDgi
    + ctaxPat.reduce((s: number, i: any) => s + nv(i.amount), 0);
  // ✅ Charges Pat colonne = CNSS patron seul (pension+famille+accident) — pas TUS ni DGI
  // ✅ Charges Pat = CNSS patron (pension+famille+accident) + TUS CNSS — pas TUS DGI
  const cnssPatOnly = cnssEmpPension + cnssEmpFamily + cnssEmpAccident + tusCnss;

  const monthLabel = MONTHS[(payroll.month ?? 1) - 1];
  const fullName   = [e.lastName?.toUpperCase(), e.firstName].filter(Boolean).join(' ');
  const cat        = formatCategorie(e.professionalCategory);
  const rawDept  = e.department?.name ?? '';
  const deptName = /no.dep/i.test(rawDept) || rawDept.trim() === '' ? '' : rawDept;

  let gainRef  = 1000;
  let patRef   = 3500;
  let indemRef = 5390;
  let loanRef  = 6699;

  return (
    <>
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 8mm 6mm;
          }
          body {
            visibility: hidden !important;
            background: #fff !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          #bul-wrap,
          #bul-wrap * {
            visibility: visible !important;
          }
          #bul-wrap {
            position: absolute !important;
            top: 0 !important;
            left: 0 !important;
            width: 100% !important;
          }
          #bul-default {
            width: 195mm !important;
            height: 277mm !important;
            min-height: unset !important;
            padding: 6mm 7mm !important;
            margin: 0 auto !important;
            box-shadow: none !important;
            border: none !important;
            overflow: hidden !important;
          }
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
          .nobreak { page-break-inside: avoid !important; break-inside: avoid !important; }
          tr        { page-break-inside: avoid !important; break-inside: avoid !important; }
        }
        #bul-wrap {
          color-scheme: light;
          forced-color-adjust: none;
        }
        #main-grid {
          width: 100%;
          table-layout: fixed;
          border-collapse: collapse;
          border: ${BD};
          height: 100%;
        }
        #main-grid td, #main-grid th {
          color: #000 !important;
        }
        #grid-spacer {
          height: auto;
        }
      `}</style>

      <div id="bul-wrap" data-bulletin-root="true" style={{
        colorScheme: 'light',
        forcedColorAdjust: 'none',
        background: '#fff',
      } as React.CSSProperties}>

      <div id="bul-default" style={{
        fontFamily: SANS,
        fontSize: `${FS}px`,
        lineHeight: 1.4,
        background: '#fff',
        color: K,
        width: '210mm',
        height: '297mm',
        boxSizing: 'border-box',
        padding: '6mm 7mm',
        margin: '0 auto',
        boxShadow: '0 2px 16px rgba(0,0,0,0.10)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}>

        {/* ══ EN-TÊTE SOCIÉTÉ + SALARIÉ ══════════════════════════════ */}
        <table className="nobreak" style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 3, border: BDB }}>
          <tbody>
            <tr>
              <td style={{ width:'34%', padding:'4px 6px', borderRight: BDB, fontWeight:900, fontSize:13, textTransform:'uppercase', color:K }}>
                {co.tradeName || co.legalName || '—'}
              </td>
              <td style={{ width:'28%', padding:'4px 6px', borderRight: BDB, fontWeight:900, fontSize:11, color:K }}>
                {fullName || '—'}
              </td>
              <td style={{ width:'14%', padding:'4px 6px', borderRight: BDB, fontSize:9, color:K }}>
                {deptName ? <>Affectation : <strong>{deptName}</strong></> : null}
              </td>
              <td style={{ width:'12%', padding:'4px 6px', borderRight: BDB, fontSize:9, color:K }}>
                Poste : <strong>{e.position || '—'}</strong>
              </td>
              <td rowSpan={3} style={{ width:'12%', padding:'5px 4px', textAlign:'center', verticalAlign:'middle', background:TH_BG, color:K }}>
                <div style={{ fontSize:7, fontWeight:700, letterSpacing:1.2, textTransform:'uppercase', color:K }}>Bulletin de Paie</div>
                <div style={{ fontSize:20, fontWeight:900, fontFamily:FONT, marginTop:2, color:K }}>{monthLabel.slice(0,4).toUpperCase()}</div>
                <div style={{ fontSize:13, fontWeight:700, fontFamily:FONT, color:K }}>{payroll.year}</div>
              </td>
            </tr>
            <tr style={{ borderTop: BDB }}>
              <td style={{ padding:'2px 6px', borderRight:BDB, fontSize:8, color:K }}>
                {[co.address, co.city].filter(Boolean).join(', ')}
                {co.phone && <span> · Tél : {co.phone}</span>}
              </td>
              <td style={{ padding:'2px 6px', borderRight:BDB, fontSize:8, color:K }}>
                Cat / Ech : <strong>{cat || '—'}</strong>
              </td>
              <td style={{ padding:'2px 6px', borderRight:BDB, fontSize:8, color:K }}>
                Matr. : <strong>{e.employeeNumber || '—'}</strong>
              </td>
              <td style={{ padding:'2px 6px', borderRight:BDB, fontSize:8, color:K }}>
                {e.paymentMethod === 'BANK_TRANSFER' ? 'Virement bancaire' : 'Espèces'}
              </td>
            </tr>
            <tr style={{ borderTop: BDB }}>
              <td style={{ padding:'2px 6px', borderRight:BDB, fontSize:8, color:K }}>
                RCCM : <strong>{co.rccmNumber || '—'}</strong>
                {co.nif && <span> · NIU : <strong>{co.nif}</strong></span>}
                {co.cnssNumber && <span> · CNSS Ent. : <strong>{co.cnssNumber}</strong></span>}
              </td>
              <td colSpan={3} style={{ padding:'2px 6px', fontSize:8, color:K }}>
                Conv. : <strong>{co.collectiveAgreement || '—'}</strong>
                {e.cnssNumber && <span> · N° CNSS Sal. : <strong>{e.cnssNumber}</strong></span>}
              </td>
            </tr>
          </tbody>
        </table>

        {/* ══ INFO SALARIÉ ════════════════════════════════════════════ */}
        <table className="nobreak" style={{ width:'100%', borderCollapse:'collapse', marginBottom:3, border:BDB }}>
          <thead>
            <tr>
              {['Date embauche','N° CNSS/CRF','Sit. familiale','Nbr Enfant','Ancienneté','Nbr part IRPP','Type de contrat'].map(h => (
                <th key={h} style={TH(TH_BG, { fontSize:8, padding:'3px 4px' })}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              {[fmtDate(e.hireDate), MARITAL[e.maritalStatus??'']||'—',
                nv(e.numberOfChildren)||'—', seniority(e.hireDate), fiscalParts,
                CONTRACT[e.contractType??'']||e.contractType||'—'
              ].map((val, idx) => (
                <td key={idx} style={{
                  ...tdC({ fontSize:9, height:22, lineHeight:'22px', fontWeight: idx===4?700:400 }),
                  borderLeft: BD, borderBottom: BD,
                  borderRight: idx === 5 ? BD : 'none',
                }}>
                  {val}
                </td>
              ))}
            </tr>
          </tbody>
        </table>

        {/* ══ TABLEAU PRINCIPAL ══════════════════════════════════════ */}
        <div style={{ flex:1, minHeight:0, position:'relative' }}>
          <table id="main-grid">
            <colgroup>
              <col style={{ width:'5%'  }} />
              <col style={{ width:'27%' }} />
              <col style={{ width:'10%' }} />
              <col style={{ width:'5%'  }} />
              <col style={{ width:'13%' }} />
              <col style={{ width:'13%' }} />
              <col style={{ width:'6%'  }} />
              <col style={{ width:'21%' }} />
            </colgroup>
            <thead>
              <tr>
                <th rowSpan={2} style={TH()}>Rub.</th>
                <th rowSpan={2} style={TH(TH_BG, { textAlign:'left', paddingLeft:5 })}>Libellé</th>
                <th rowSpan={2} style={TH()}>Nbre / Base</th>
                <th rowSpan={2} style={TH(TH_BG, { fontSize: 7.5, overflow: 'hidden' })}>Taux</th>
                <th colSpan={2} style={TH('#bbb', { fontSize:9 })}>Part Salariale</th>
                <th colSpan={2} style={TH('#a8a8a8', { fontSize:9 })}>Part Patronale</th>
              </tr>
              <tr>
                <th style={TH('#bbb')}>Gains</th>
                <th style={TH('#bbb')}>Retenues</th>
                <th style={TH('#a8a8a8')}>Taux</th>
                <th style={TH('#a8a8a8')}>Montant</th>
              </tr>
            </thead>

            <tbody>
              {/* ── Gains ───────────────────────────────────────────── */}
              {gains.map((item: any, idx: number) => {
                gainRef++;
                return <Row key={item.id||item.code||idx}
                  rub={gainRef} label={cleanLabel(item.label)}
                  base={itemBase(item)} taux={itemTaux(item)}
                  gain={fmt(item.amount)} bold={item.code==='SAL_BASE'} />;
              })}

              <TotalRow label="Total Brut" gain={fmtZ(totalBrut)} />

              {/* ── CNSS salariale ──────────────────────────────────── */}
              <Row rub={2505} label="CNSS (plafond 1.200.000)"
                base={fmtZ(Math.min(totalBrut,1_200_000))} taux="4,00" ret={fmt(cnssSal)} />

              {/* ── CNSS patronale — 3 lignes ───────────────────────── */}
              {cnssEmpPension  > 0 && (()=>{ patRef+=10; return <Row key="cp" rub={patRef}
                label="CNSS Pension (pl. 1.200.000)"
                base={fmtZ(Math.min(totalBrut,1_200_000))} patTaux="8,00" patMt={fmt(cnssEmpPension)} />; })()}
              {cnssEmpFamily   > 0 && (()=>{ patRef+=10; return <Row key="cf" rub={patRef}
                label="CNSS Famille (pl. 600.000)"
                base={fmtZ(Math.min(totalBrut,600_000))} patTaux="10,03" patMt={fmt(cnssEmpFamily)} />; })()}
              {cnssEmpAccident > 0 && (()=>{ patRef+=10; return <Row key="ca" rub={patRef}
                label="CNSS Accident (pl. 600.000)"
                base={fmtZ(Math.min(totalBrut,600_000))} patTaux="2,25" patMt={fmt(cnssEmpAccident)} />; })()}

              {/* ── TUS ─────────────────────────────────────────────── */}
              {tusCnss > 0 && (()=>{ patRef+=10; return <Row key="tc" rub={patRef}
                label="Taxe unique sur salaire (CNSS)"
                base={fmtZ(totalBrut)} patTaux="5,475%" patMt={fmt(tusCnss)} />; })()}
              {tusDgi  > 0 && (()=>{ patRef+=10; return <Row key="td" rub={patRef}
                label="Taxe unique sur salaire (DGI)"
                base={fmtZ(totalBrut)} patTaux="2,025%" patMt={fmt(tusDgi)} />; })()}

              {/* ── Autres cotisations patronales ───────────────────── */}
              {ctaxPat.map((item: any) => {
                patRef+=10;
                return <Row key={item.id||item.code}
                  rub={patRef} label={cleanLabel(item.label.replace(' (part patronale)',''))}
                  base={itemBase(item)} patTaux={itemTaux(item)} patMt={fmt(item.amount)} />;
              })}

              <TotalRow label="Total cotisations" ret={fmtZ(cnssSal)} patMt={fmtZ(totalPat)} />

              {/* ── ITS ─────────────────────────────────────────────── */}
              {itsAmount > 0 && (
                <Row rub={4520} label="ITS Mois"
                  base={fmt(itsBase)} ret={fmt(itsAmount)} />
              )}

              {/* ── Cotisations salariales supplémentaires ──────────── */}
              {(()=>{
                const taxMap = new Map<string,{emp:any|null,pat:any|null}>();
                ctaxEmp.forEach((i: any) => {
                  const k = i.code.replace(/^CTAX_/,'');
                  if (!taxMap.has(k)) taxMap.set(k,{emp:null,pat:null});
                  taxMap.get(k)!.emp = i;
                });
                let rub = 4600;
                return Array.from(taxMap.entries()).map(([k,{emp,pat}]) => {
                  rub++;
                  const fixedRub: Record<string,number> = { TOL:4601, CAMU:4650 };
                  const r = fixedRub[k] ?? rub;
                  const label = cleanLabel(emp?.label ?? pat?.label?.replace(' (part patronale)','') ?? k);
                  return <Row key={k} rub={r} label={label}
                    base={emp ? itemBase(emp) : (pat ? itemBase(pat) : '')}
                    taux={emp ? itemTaux(emp) : ''}
                    ret={emp  ? fmt(emp.amount) : ''}
                    patTaux={pat ? itemTaux(pat) : ''}
                    patMt={pat   ? fmt(pat.amount) : ''} />;
                });
              })()}

              {/* ── Prêts / Avances ─────────────────────────────────── */}
              {loanItems.map((item: any) => {
                loanRef++;
                return <Row key={item.id||item.code}
                  rub={loanRef} label={cleanLabel(item.label)}
                  base={itemBase(item)} taux={itemTaux(item)} ret={fmt(item.amount)} />;
              })}

              {/* ── Indemnités ───────────────────────────────────────── */}
              {indems.map((item: any) => {
                indemRef+=10;
                return <Row key={item.id||item.code}
                  rub={indemRef} label={cleanLabel(item.label)}
                  base={itemBase(item)} taux={itemTaux(item)} gain={fmt(item.amount)} />;
              })}

              {/* ── Autres retenues manuelles — montant direct, pas de base/taux ── */}
              {manualDeductions.map((item: any, idx: number) => (
                <Row key={item.id || item.code || idx}
                  rub={6800 + idx}
                  label={cleanLabel(item.label)}
                  ret={fmt(item.amount)} />
              ))}

              {/* ── Spacer ──────────────────────────────────────────── */}
              <tr id="grid-spacer" style={{ background:'#fff' }}>
                <td style={{ borderLeft:BD, borderRight:'none', borderTop:'none', borderBottom:'none', background:'#fff' }} />
                <td style={{ borderLeft:BD, background:'#fff' }} />
                <td style={{ borderLeft:BD, background:'#fff' }} />
                <td style={{ borderLeft:BD, background:'#fff' }} />
                <td style={{ borderLeft:BD, background:'#fff' }} />
                <td style={{ borderLeft:BD, background:'#fff' }} />
                <td style={{ borderLeft:BD, background:'#fff' }} />
                <td style={{ borderLeft:BD, borderRight:BD, background:'#fff' }} />
              </tr>

              {/* ✅ Ligne Total — dans tbody pour respecter colonnes main-grid */}
              <TotalRow
                label="Total"
                gain={fmtZ(totalBrut + indems.reduce((s: number, i: any) => s + nv(i.amount), 0))}
                ret={fmtZ(totalRetenues)}
                patMt={fmtZ(totalPat)}
              />
            </tbody>
          </table>
        </div>

        {/* ══ MODE RÈGLEMENT + NET À PAYER ════════════════════════════ */}
        <table className="nobreak" style={{ width:'100%', borderCollapse:'collapse', marginTop:4, border:BDB, flexShrink:0 }}>
          <tbody>
            <tr>
              <td style={{ width:'14%', padding:'4px 6px', borderRight:BDB, background:TH_BG, fontWeight:700, textAlign:'center', fontSize:10, color:K }}>
                Mode règlement
              </td>
              <td style={{ width:'22%', padding:'4px 6px', borderRight:BDB, fontSize:10, color:K }}>
                Banque : <strong>{e.bankName || '—'}</strong>
                {e.bankAccountNumber && <div style={{ fontSize:8, color:K }}>N° : <strong>{e.bankAccountNumber}</strong></div>}
              </td>
              <td style={{ width:'10%', padding:'4px 6px', borderRight:BDB, fontSize:10, color:K }}>
                {e.paymentMethod === 'BANK_TRANSFER' ? 'Virement' : 'Espèces'}
              </td>
              <td style={{ width:'12%', padding:'4px 6px', borderRight:BDB, background:TH_BG, fontWeight:700, textAlign:'center', fontSize:10, color:K }}>
                Net à payer
              </td>
              <td style={{ width:'16%', padding:'4px 10px', borderRight:BDB, fontWeight:900, fontSize:FS_NET, textAlign:'right', fontFamily:FONT, background:'#efefef', color:K }}>
                {fmtZ(netSalary)}
              </td>
              <td style={{ width:'12%', padding:'4px 6px', borderRight:BDB, textAlign:'center', fontSize:9, color:K }}>
                2ème banque
              </td>
              <td style={{ width:'14%', padding:'4px 6px', fontSize:9, color:K }}>
                Droits annuels :
              </td>
            </tr>
          </tbody>
        </table>

        {/* ══ LIGNE MOIS ══════════════════════════════════════════════ */}
        <table className="nobreak" style={{ width:'100%', borderCollapse:'collapse', marginTop:4, border:BDB, flexShrink:0 }}>
          <colgroup>
            <col style={{ width:'7%'  }} />
            <col style={{ width:'19%' }} />
            <col style={{ width:'19%' }} />
            <col style={{ width:'19%' }} />
            <col style={{ width:'18%' }} />
            <col style={{ width:'18%' }} />
          </colgroup>
          <thead>
            <tr>
              <th style={TH(TH_BG, { fontSize:8 })}> </th>
              <th style={TH(TH_BG, { fontSize:8 })}>Brut</th>
              <th style={TH(TH_BG, { fontSize:8 })}>Net imposable</th>
              <th style={TH(TH_BG, { fontSize:8 })}>Net à payer</th>
              <th style={TH(TH_BG, { fontSize:8 })}>Charges Sal</th>
              <th style={TH(TH_BG, { fontSize:8 })}>Charges Pat</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={tdC({ fontWeight:700, fontSize:9, borderLeft:BD, borderTop:BD })}>Mois</td>
              <td style={tdR({ fontWeight:700, fontSize:9, borderLeft:BD, borderTop:BD })}>{fmtZ(totalBrut)}</td>
              <td style={tdR({ fontSize:9, borderLeft:BD, borderTop:BD })}>{fmtZ(nv(payroll.grossSalary)-cnssSal)}</td>
              <td style={tdR({ fontWeight:700, fontSize:9, borderLeft:BD, borderTop:BD })}>{fmtZ(netSalary)}</td>
              <td style={tdR({ fontSize:9, borderLeft:BD, borderTop:BD })}>{fmtD(cnssSal)}</td>
              <td style={tdR({ fontSize:9, borderLeft:BD, borderTop:BD, borderRight:BD })}>{fmtD(cnssPatOnly)}</td>
            </tr>
          </tbody>
        </table>

        {/* ══ SÉPARATEUR CUMULS ═══════════════════════════════════════ */}
        <div style={{
          width:'100%', textAlign:'center', fontSize:8, fontWeight:700,
          color:K, background:TH_BG, border:BDB, borderTop:'none',
          padding:'3px 0', textTransform:'uppercase', letterSpacing:2,
          flexShrink:0,
        }}>
          Cumuls
        </div>

        {/* ══ LIGNE ANNÉE + CONGÉS ANNUELS ════════════════════════════
            Brut YTD | Net imposable YTD | Charges Sal YTD | Charges Pat YTD
            Toutes les valeurs = somme réelle Jan → mois actuel (backend)
        ════════════════════════════════════════════════════════════ */}
        <table className="nobreak" style={{ width:'100%', borderCollapse:'collapse', border:BDB, borderTop:'none', flexShrink:0 }}>
          <colgroup>
            <col style={{ width:'7%'  }} />
            <col style={{ width:'15%' }} />
            <col style={{ width:'14%' }} />
            <col style={{ width:'13%' }} />
            <col style={{ width:'12%' }} />
            <col style={{ width:'12%' }} />
            <col style={{ width:'9%'  }} />
            <col style={{ width:'9%'  }} />
            <col style={{ width:'9%'  }} />
          </colgroup>
          <thead>
            <tr>
              <th style={TH(TH_BG, { fontSize:8 })}> </th>
              <th style={TH(TH_BG, { fontSize:8 })}>Brut</th>
              <th style={TH(TH_BG, { fontSize:8 })}>Net imposable</th>
              <th style={TH(TH_BG, { fontSize:8 })}>Net annuel</th>
              <th style={TH(TH_BG, { fontSize:8 })}>Charges Sal</th>
              <th style={TH(TH_BG, { fontSize:8 })}>Charges Pat</th>
              <th colSpan={3} style={TH(TH_BG, { fontSize:8 })}>Congés annuels</th>
            </tr>
            <tr>
              <th style={TH(TH_BG, { fontSize:7 })}> </th>
              <th style={TH(TH_BG, { fontSize:7 })}> </th>
              <th style={TH(TH_BG, { fontSize:7 })}> </th>
              <th style={TH(TH_BG, { fontSize:7 })}> </th>
              <th style={TH(TH_BG, { fontSize:7 })}> </th>
              <th style={TH(TH_BG, { fontSize:7 })}> </th>
              <th style={TH(TH_BG, { fontSize:7 })}>Droits</th>
              <th style={TH(TH_BG, { fontSize:7 })}>Pris</th>
              <th style={TH(TH_BG, { fontSize:7 })}>Solde</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={tdC({ fontWeight:700, fontSize:9, borderLeft:BD })}>Année</td>
              <td style={tdR({ fontWeight:700, fontSize:9, borderLeft:BD })}>{fmtD(ytdGross)}</td>
              <td style={tdR({ fontSize:9, borderLeft:BD })}>{fmtD(ytdNetImp)}</td>
              <td style={tdR({ fontWeight:700, fontSize:9, borderLeft:BD })}>{fmtD(ytdNetSalary)}</td>
              <td style={tdR({ fontSize:9, borderLeft:BD })}>{fmtD(ytdChargesSal)}</td>
              <td style={tdR({ fontSize:9, borderLeft:BD })}>{fmtD(ytdCnssEmp)}</td>
              <td style={tdR({ fontSize:9, borderLeft:BD })}>{congesDroits > 0 ? fmtD(congesDroits) : ''}</td>
              <td style={tdR({ fontSize:9, borderLeft:BD })}>{congesPris   > 0 ? fmtD(congesPris)   : ''}</td>
              <td style={tdR({ fontSize:9, borderLeft:BD, borderRight:BD })}>{congesSolde > 0 ? fmtD(congesSolde) : ''}</td>
            </tr>
          </tbody>
        </table>

        {/* ══ SIGNATURES ══════════════════════════════════════════════ */}
        <table className="nobreak" style={{ width:'100%', borderCollapse:'collapse', border:BDB, borderTop:'none', flexShrink:0 }}>
          <colgroup>
            <col style={{ width:'50%' }} />
            <col style={{ width:'50%' }} />
          </colgroup>
          <tbody>
            <tr>
              <td style={{ padding:'6px 10px', borderRight:BDB, verticalAlign:'top', color:K, height:48 }}>
                <div style={{ fontSize:8.5, fontWeight:700, textTransform:'uppercase', color:K }}>
                  Signature de l'Employé(e)
                </div>
                <div style={{ height:28, borderBottom:BD, marginTop:20 }} />
              </td>
              <td style={{ padding:'6px 10px', verticalAlign:'top', textAlign:'center', color:K, height:48 }}>
                <div style={{ fontSize:8.5, fontWeight:700, textTransform:'uppercase', color:K }}>
                  Direction Générale
                </div>
                <div style={{ height:28, borderBottom:BD, marginTop:20, width:'60%', marginLeft:'auto', marginRight:'auto' }} />
              </td>
            </tr>
          </tbody>
        </table>

        {/* ══ PIED DE PAGE ═══════════════════════════════════════════ */}
        <div style={{
          borderTop:'0.5px solid #999', marginTop:4, paddingTop:3,
          display:'flex', justifyContent:'space-between',
          fontSize:7.5, color:'#444', flexShrink:0,
        }}>
          <span>CNSS sal. 4% · ITS barème 2026 · Parts fiscales maintenues · SMIG 70 400 FCFA · Décret N°78-360</span>
          <span style={{ fontWeight:700, color:K }}>KONZARH</span>
        </div>

      </div>
      </div>
    </>
  );
}

export default BulletinRendererDefault;