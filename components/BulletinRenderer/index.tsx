'use client';
// ============================================================================
// BulletinRendererDefault v3.2
//
// CORRECTIF v3.2 vs v3.1 :
// - TUS DGI (2,025%) : affiché après ITS dans section 2 MAIS valeur en patMt
//   (charge 100% patronale versée à la DGI, pas une retenue salarié)
// - TUS DGI inclus dans totalCotisPat
// - Tout le reste = v3.1 intact
// ============================================================================

import React, { useMemo } from 'react';
import type { BulletinPayroll, BulletinTemplateConfig, PayrollItem } from '@/types/bulletin-template';
import { classifyItems } from '@/lib/bulletin-items-classifier';
import BulletinRendererCorporate from '@/components/BulletinRendererCorporate';
import BulletinRendererAdmin     from '@/components/BulletinRendererAdmin';

export interface BulletinRendererProps {
  payroll:      BulletinPayroll;
  template?:    BulletinTemplateConfig;
  previewMode?: boolean;
}

export default function BulletinRenderer(props: BulletinRendererProps) {
  const templateId = (props.template ?? { templateId:'default' }).templateId;
  if (templateId === 'corporate') return <BulletinRendererCorporate {...props} />;
  if (templateId === 'admin')     return <BulletinRendererAdmin     {...props} />;
  return <BulletinRendererDefault {...props} />;
}

export interface BulletinRendererDefaultProps {
  payroll:      BulletinPayroll;
  template?:    BulletinTemplateConfig;
  previewMode?: boolean;
}

// ── Constantes ────────────────────────────────────────────────────────────────
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
const PAYMENT: Record<string,string> = {
  BANK_TRANSFER:'Virement', CASH:'Espèces',
  MOBILE_MONEY:'Mobile Money', CHECK:'Chèque',
};

// Numérotation rubriques — plages fixes par section
const RUB = {
  GAIN_START:   1001,
  CNSS_SAL:     2505,
  PAT_START:    3510,
  ITS:          4520,
  TOL:          4601,
  CAMU:         4650,
  TUS_DGI_RUB:  4700,
  LOAN_START:   6700,
  INDEM_START:  5400,
};

// ── Utilitaires ───────────────────────────────────────────────────────────────
const nv  = (v: any): number => { const x = Number(v); return isFinite(x) ? x : 0; };
const fmt = (v: any): string => { const x = Math.round(nv(v)); return x===0?'':x.toLocaleString('fr-FR'); };
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

const isOT = (code?: string) => /^HS_|^OT_|HSUP|H_SUP|HEURE_SUP/i.test(code ?? '');

// ── itemBase OT ───────────────────────────────────────────────────────────────
function itemBase(item: any): string {
  if (item.base==null||nv(item.base)===0) return '';
  const base=nv(item.base), rate=nv(item.rate);
  if (isOT(item.code) && rate > 1 && rate <= 3) {
    return Math.round(base * rate).toLocaleString('fr-FR');
  }
  return Math.round(base).toLocaleString('fr-FR');
}

// ── itemTaux OT = nb heures (quantity) ───────────────────────────────────────
function itemTaux(item: any): string {
  if (isOT(item.code)) {
    const q = nv(item.quantity);
    return q > 0 ? String(q) : '';
  }
  const qty=item.quantity; if(qty!=null&&nv(qty)!==0) return String(nv(qty));
  const r=nv(item.rate); if(!r||r===1) return '';
  if(r>1&&r<=3) return r.toFixed(2).replace('.',',');
  if(r>0&&r<1){const p=r*100; return p%1===0?p.toFixed(0):p.toFixed(3).replace(/0+$/,'');}
  return String(r);
}

// ── Styles ────────────────────────────────────────────────────────────────────
const FONT = '"Courier New",Courier,monospace';
const SANS = 'Arial,Helvetica,sans-serif';
const BD   = '0.5px solid #000';

const BLACK = '#000000';
const WHITE = '#ffffff';
const GRAY1 = '#f4f4f4';
const GRAY2 = '#e8e8e8';
const GRAY3 = '#f0f0f0';

const cell = (e?: React.CSSProperties): React.CSSProperties => ({
  border:BD, padding:'2px 3px', fontSize:8.5, verticalAlign:'middle',
  color:BLACK, fontFamily:SANS, backgroundColor:WHITE, ...e,
});
const cellR = (e?: React.CSSProperties): React.CSSProperties => ({
  ...cell(), textAlign:'right', fontFamily:FONT, whiteSpace:'nowrap', ...e,
});
const cellC = (e?: React.CSSProperties): React.CSSProperties => ({
  ...cell(), textAlign:'center', ...e,
});

const TH = (e?: React.CSSProperties): React.CSSProperties => ({
  border:BD, padding:'3px 3px', fontSize:8, fontWeight:700, textAlign:'center',
  backgroundColor:BLACK, color:WHITE,
  textTransform:'uppercase' as const, fontFamily:SANS,
  WebkitPrintColorAdjust:'exact', printColorAdjust:'exact', ...e,
});

const SepRow = ({ label }: { label: string }) => (
  <tr>
    <td colSpan={8} style={{
      backgroundColor:BLACK, color:WHITE,
      padding:'2.5px 6px', fontSize:8, fontWeight:700,
      letterSpacing:'0.8px', border:BD,
      textTransform:'uppercase' as const, fontFamily:SANS,
      WebkitPrintColorAdjust:'exact', printColorAdjust:'exact',
    }}>{label}</td>
  </tr>
);

const TotalRow = ({ label, gain='', ret='', patMt='' }:
  { label:string; gain?:string; ret?:string; patMt?:string }) => (
  <tr>
    <td colSpan={4} style={{
      ...cell({ fontWeight:900, fontSize:9,
        borderTop:'1.5px solid #000', borderBottom:'1.5px solid #000',
        textTransform:'uppercase' as const, backgroundColor:GRAY2,
        WebkitPrintColorAdjust:'exact', printColorAdjust:'exact',
      })
    }}>{label}</td>
    <td style={cellR({ fontWeight:900, fontSize:10, borderTop:'1.5px solid #000', borderBottom:'1.5px solid #000', backgroundColor:GRAY2 })}>{gain}</td>
    <td style={cellR({ fontWeight:900, fontSize:10, borderTop:'1.5px solid #000', borderBottom:'1.5px solid #000', backgroundColor:GRAY2 })}>{ret}</td>
    <td style={cellC({ borderTop:'1.5px solid #000', borderBottom:'1.5px solid #000', backgroundColor:GRAY2 })} />
    <td style={cellR({ fontWeight:900, fontSize:10, borderTop:'1.5px solid #000', borderBottom:'1.5px solid #000', backgroundColor:GRAY2 })}>{patMt}</td>
  </tr>
);

const Row = ({ rub, label, base='', taux='', gain='', ret='',
               patTaux='', patMt='', bold=false, zebra=false }:
  { rub:number|string; label:string; base?:string; taux?:string;
    gain?:string; ret?:string; patTaux?:string; patMt?:string;
    bold?:boolean; zebra?:boolean; }) => {
  const bg = zebra ? GRAY1 : WHITE;
  return (
    <tr>
      <td style={cellC({ fontFamily:FONT, fontSize:8, backgroundColor:bg })}>{rub}</td>
      <td style={cell({ paddingLeft:5, fontWeight:bold?700:400, backgroundColor:bg })}>{label}</td>
      <td style={cellR({ backgroundColor:bg })}>{base}</td>
      <td style={cellC({ backgroundColor:bg })}>{taux}</td>
      <td style={cellR({ fontWeight:gain?600:400, backgroundColor:bg })}>{gain}</td>
      <td style={cellR({ fontWeight:ret?600:400, backgroundColor:bg })}>{ret}</td>
      <td style={cellC({ fontWeight:patTaux?600:400, backgroundColor:bg })}>{patTaux}</td>
      <td style={cellR({ fontWeight:patMt?600:400, backgroundColor:bg })}>{patMt}</td>
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

  // ── Valeurs du back ────────────────────────────────────────────────────────
  const cnssSal    = nv(payroll.cnssSalarial);
  const itsAmount  = nv(payroll.its);
  const itsBase    = nv(payroll.grossSalary) - cnssSal;
  const totalBrut  = nv(payroll.grossSalary);
  const netSalary  = nv(payroll.netSalary);
  const fiscalParts= nv((payroll as any).irppFiscalParts)||1;
  const monthLabel = MONTHS[(payroll.month??1)-1];

  const cnssEmpPension  = nv(payroll.cnssEmployerPension);
  const cnssEmpFamily   = nv(payroll.cnssEmployerFamily);
  const cnssEmpAccident = nv(payroll.cnssEmployerAccident);
  const tusDgi  = nv((payroll as any).tusDgiAmount);
  const tusCnss = nv((payroll as any).tusCnssAmount);

  // Gains hors absences
  const gains = gainItems.filter((i: any) => !['ABS_DEDUCT','ABS_CONGE'].includes(i.code));

  // Section 2 — cotisations salariales
  const tolItems  = cotisItems.filter((i: any) => /TOL/i.test(i.code||''));
  const camuItems = cotisItems.filter((i: any) => /CAMU/i.test(i.code||''));
  const otherCtaxSal = cotisItems.filter((i: any) =>
    !['CNSS_SAL','CNSS','ITS','IRPP','BNC_SOURCE'].includes(i.code) &&
    !/TOL|CAMU/i.test(i.code||'') &&
    !['LOAN','ADVANCE'].includes(i.code)
  ).concat(retenueItems.filter((i: any) => !['LOAN','ADVANCE'].includes(i.code)));

  // Prêts & avances
  const loanItems = retenueItems.filter((i: any) => ['LOAN','ADVANCE'].includes(i.code));

  // Indemnités
  const indems = indemItems;

  // Charges patronales custom hors TUS natifs (TUS_DGI et TUS_CNSS gérés nativement)
  const ctaxPat = ((empItems ?? []) as any[])
    .filter((i: any) => !['TUS_DGI','TUS_CNSS'].includes(i.code));

  // ── v3.2 : totalCotisPat inclut TUS DGI (charge patronale) ───────────────
  const totalCotisPat = cnssEmpPension + cnssEmpFamily + cnssEmpAccident
    + tusCnss + tusDgi
    + ctaxPat.reduce((s:number, i:any) => s + nv(i.amount), 0);

  const totalDed = nv(payroll.totalDeductions);

  // YTD
  const ytdNetImp = nv(ytd.grossSalary) - nv(ytd.cnssSalarial);
  const fullName  = [e.lastName?.toUpperCase(), e.firstName].filter(Boolean).join(' ');
  const cat       = [e.professionalCategory, e.echelon?`Ech.${e.echelon}`:null].filter(Boolean).join('/');

  // Numérotation incrémentale
  let gainRef  = RUB.GAIN_START - 1;
  let patRef   = RUB.PAT_START  - 10;
  let indemRef = RUB.INDEM_START - 10;
  let loanRef  = RUB.LOAN_START;

  return (
    <>
      <style>{`
        @media print {
          @page { size: A4 portrait; margin: 8mm; }
          html, body {
            margin: 0 !important; padding: 0 !important;
            background: #fff !important;
          }
          .no-print, nav, header, aside, footer,
          [class*="sidebar"],[class*="Sidebar"],
          [class*="navbar"],[class*="Navbar"] { display: none !important; }
          #bul-default {
            width: 194mm !important; min-height: 277mm !important;
            padding: 0 !important; margin: 0 !important;
            box-shadow: none !important; border: none !important;
            background-color: #fff !important;
          }
          .nb { page-break-inside: avoid !important; break-inside: avoid !important; }
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
          [data-black="1"] {
            background-color: #000 !important;
            color: #fff !important;
          }
          [data-gray="1"] {
            background-color: #e8e8e8 !important;
          }
        }
      `}</style>

      <div id="bul-default" style={{
        fontFamily:SANS, fontSize:8.5, backgroundColor:WHITE, color:BLACK,
        width:'210mm', minHeight:'277mm', boxSizing:'border-box' as const,
        padding:'14px 16px', margin:'0 auto',
        display:'flex', flexDirection:'column' as const,
        boxShadow:'0 2px 12px rgba(0,0,0,0.08)',
      }}>

        {/* ══ EN-TÊTE ══════════════════════════════════════════════════════ */}
        <table className="nb" style={{ width:'100%', borderCollapse:'collapse', marginBottom:4, border:'1px solid #000' }}>
          <tbody>
            <tr>
              <td rowSpan={3} style={{ width:52, padding:4, border:BD, textAlign:'center', verticalAlign:'middle', backgroundColor:WHITE }}>
                {co.logo
                  ? <img src={co.logo} alt="" style={{ width:46,height:46,objectFit:'contain' }} />
                  : <div style={{ width:46,height:46,backgroundColor:BLACK,display:'flex',alignItems:'center',justifyContent:'center',color:WHITE,fontWeight:900,fontSize:9,fontFamily:SANS,WebkitPrintColorAdjust:'exact',printColorAdjust:'exact' }}>
                      {(co.tradeName||co.legalName||'').slice(0,4).toUpperCase()}
                    </div>
                }
              </td>
              <td colSpan={3} style={{ padding:'3px 8px',border:BD,fontWeight:900,fontSize:12,textTransform:'uppercase' as const,letterSpacing:.5,backgroundColor:WHITE }}>
                {co.tradeName||co.legalName||'—'}
                {co.tradeName&&co.legalName&&co.tradeName!==co.legalName&&
                  <span style={{ fontWeight:400,fontSize:8,marginLeft:8 }}>({co.legalName})</span>}
              </td>
              <td rowSpan={3} data-black="1" style={{
                width:106, padding:'5px 8px', border:'1.5px solid #000',
                textAlign:'center', verticalAlign:'middle',
                backgroundColor:BLACK, color:WHITE,
                WebkitPrintColorAdjust:'exact', printColorAdjust:'exact',
              }}>
                <div style={{ fontSize:7,fontWeight:700,letterSpacing:2,textTransform:'uppercase' as const }}>Bulletin de Paie</div>
                <div style={{ fontSize:20,fontWeight:900,fontFamily:FONT,marginTop:2,letterSpacing:1 }}>
                  {monthLabel.slice(0,4).toUpperCase()}
                </div>
                <div style={{ fontSize:13,fontWeight:700,fontFamily:FONT }}>{payroll.year}</div>
              </td>
            </tr>
            <tr>
              <td style={{ padding:'2px 8px',border:BD,fontSize:8,backgroundColor:WHITE }}>
                {[co.address,co.city,co.country==='CG'?'Congo-Brazzaville':co.country].filter(Boolean).join(', ')}
              </td>
              <td style={{ padding:'2px 8px',border:BD,fontSize:8,backgroundColor:WHITE }}>
                {co.phone&&<span>Tél : {co.phone}</span>}
                {co.phone&&co.email&&<span> · </span>}
                {co.email&&<span>{co.email}</span>}
              </td>
              <td style={{ padding:'2px 8px',border:BD,fontSize:8,backgroundColor:WHITE }}>
                Conv. : <strong>{co.collectiveAgreement||'—'}</strong>
              </td>
            </tr>
            <tr>
              <td style={{ padding:'2px 8px',border:BD,fontSize:8,backgroundColor:WHITE }}>RCCM : <strong>{co.rccmNumber||'—'}</strong></td>
              <td style={{ padding:'2px 8px',border:BD,fontSize:8,backgroundColor:WHITE }}>CNSS : <strong>{co.cnssNumber||'—'}</strong></td>
              <td style={{ padding:'2px 8px',border:BD,fontSize:8,backgroundColor:WHITE }}>Lieu : <strong>{co.city||'—'}</strong> · Année : <strong>{payroll.year}</strong></td>
            </tr>
          </tbody>
        </table>

        {/* ══ LIGNE SALARIÉ ════════════════════════════════════════════════ */}
        <table className="nb" style={{ width:'100%',borderCollapse:'collapse',marginBottom:3 }}>
          <tbody>
            <tr>
              <td style={cell({ fontWeight:700,fontSize:10,width:'28%' })}>{fullName||'—'}</td>
              <td style={cell({ width:'18%',fontSize:8 })}>
                {e.department?.name&&<span>Affectation : <strong>{e.department.name}</strong></span>}
              </td>
              <td style={cell({ width:'18%',fontSize:8 })}>Poste : <strong>{e.position||'—'}</strong></td>
              <td style={cell({ width:'18%',fontSize:8 })}>Cat/Ech : <strong>{cat||'—'}</strong></td>
              <td style={cell({ width:'18%',fontSize:8 })}>
                Paiement : <strong>{PAYMENT[e.paymentMethod??'']||'Virement'}</strong>
              </td>
            </tr>
          </tbody>
        </table>

        {/* ══ INFO SALARIÉ ═════════════════════════════════════════════════ */}
        <table className="nb" style={{ width:'100%',borderCollapse:'collapse',marginBottom:4 }}>
          <thead>
            <tr>
              {['Date embauche','N° CNSS/CRF','Sit. familiale','Nbr enfants','Ancienneté','Nbr part IRPP','Type contrat'].map(h => (
                <th key={h} style={TH({ fontSize:7.5,padding:'2px 3px' })}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={cellC()}>{fmtDate(e.hireDate)}</td>
              <td style={cellC()}>{e.cnssNumber||'—'}</td>
              <td style={cellC()}>{MARITAL[e.maritalStatus??'']||'—'}</td>
              <td style={cellC()}>{nv(e.numberOfChildren)||'—'}</td>
              <td style={cellC()}>{seniority(e.hireDate)}</td>
              <td style={cellC({ fontWeight:700 })}>{fiscalParts}</td>
              <td style={cellC()}>{CONTRACT[e.contractType??'']||e.contractType||'—'}</td>
            </tr>
          </tbody>
        </table>

        {/* ══ TABLEAU PRINCIPAL ════════════════════════════════════════════ */}
        <table className="nb" style={{ width:'100%',borderCollapse:'collapse',tableLayout:'fixed' }}>
          <colgroup>
            <col style={{ width:'6%'  }} />
            <col style={{ width:'28%' }} />
            <col style={{ width:'11%' }} />
            <col style={{ width:'4%'  }} />
            <col style={{ width:'13%' }} />
            <col style={{ width:'13%' }} />
            <col style={{ width:'5%'  }} />
            <col style={{ width:'12%' }} />
          </colgroup>
          <thead>
            <tr>
              <th rowSpan={2} style={TH()}>Rub.</th>
              <th rowSpan={2} style={TH({ textAlign:'left',paddingLeft:5 })}>Libellé</th>
              <th rowSpan={2} style={TH()}>Nbre / Base</th>
              <th rowSpan={2} style={TH()}>Taux</th>
              <th colSpan={2} style={TH({ fontSize:8.5 })}>Part Salariale</th>
              <th colSpan={2} style={TH({ fontSize:8.5 })}>Part Patronale</th>
            </tr>
            <tr>
              <th style={TH()}>Gains</th>
              <th style={TH()}>Retenues</th>
              <th style={TH()}>Taux</th>
              <th style={TH()}>Montant</th>
            </tr>
          </thead>
          <tbody>

            {/* ── 1. RÉMUNÉRATIONS & PRIMES ─────────────────────────── */}
            <SepRow label="1 - Rémunérations &amp; Primes" />
            {gains.map((item: any, idx: number) => {
              gainRef++;
              return (
                <Row key={item.id||item.code||idx}
                  rub={gainRef} label={item.label}
                  base={itemBase(item)} taux={itemTaux(item)}
                  gain={fmt(item.amount)}
                  bold={item.code==='SAL_BASE'}
                  zebra={idx%2!==0}
                />
              );
            })}

            {/* SALAIRE BRUT */}
            <tr>
              <td colSpan={8} data-gray="1" style={{
                backgroundColor:GRAY2, fontWeight:900, fontSize:11,
                textAlign:'center', letterSpacing:1,
                border:'1.5px solid #000', padding:'5px 8px',
                WebkitPrintColorAdjust:'exact', printColorAdjust:'exact',
              }}>
                SALAIRE BRUT &nbsp;&mdash;&nbsp; {fmtZ(totalBrut)} F
              </td>
            </tr>

            {/* ── 2. COTISATIONS SALARIALES ─────────────────────────── */}
            <SepRow label="2 - Cotisations salariales" />

            {/* CNSS salariale — 2505 */}
            <Row rub={RUB.CNSS_SAL}
              label="CNSS (plafond 1.200.000)"
              base={fmtZ(Math.min(totalBrut,1_200_000))}
              taux="4,000%"
              ret={fmt(cnssSal)}
            />

            {/* ITS — 4520 */}
            {itsAmount>0&&(
              <Row rub={RUB.ITS}
                label="ITS — Barème progressif"
                base={fmt(itsBase)} taux="Barème"
                ret={fmt(itsAmount)} zebra
              />
            )}

            {/* ── v3.2 : TUS DGI — 4700
                Affiché ici (après ITS, ordre visuel bulletin physique)
                MAIS valeur en patMt : charge 100% patronale versée à la DGI */}
            {tusDgi>0&&(
              <Row rub={RUB.TUS_DGI_RUB}
                label="TUS — Part DGI (2,025%)"
                base={fmtZ(totalBrut)} taux="2,025%"
                patTaux="2,025%" patMt={fmt(tusDgi)}
              />
            )}

            {/* TOL — 4601 */}
            {tolItems.map((item: any) => (
              <Row key={item.id||item.code} rub={RUB.TOL}
                label={item.label}
                base={itemBase(item)} taux={itemTaux(item)}
                ret={fmt(item.amount)} zebra
              />
            ))}

            {/* CAMU — 4650 */}
            {camuItems.map((item: any) => (
              <Row key={item.id||item.code} rub={RUB.CAMU}
                label={item.label}
                base={itemBase(item)} taux={itemTaux(item)}
                ret={fmt(item.amount)}
              />
            ))}

            {/* Autres taxes salarié custom */}
            {otherCtaxSal.map((item: any, idx: number) => (
              <Row key={item.id||item.code} rub={4660+idx*10}
                label={item.label}
                base={itemBase(item)} taux={itemTaux(item)}
                ret={fmt(item.amount)} zebra={idx%2!==0}
              />
            ))}

            {/* Prêts & avances — 6700+ */}
            {loanItems.map((item: any, idx: number) => (
              <Row key={item.id||item.code} rub={loanRef+idx}
                label={item.label}
                base={itemBase(item)} taux={itemTaux(item)}
                ret={fmt(item.amount)} zebra={idx%2!==0}
              />
            ))}

            <TotalRow label="Total Cotisations Salariales" ret={fmtZ(totalDed)} />

            {/* ── 3. CHARGES PATRONALES ─────────────────────────────── */}
            <SepRow label="3 - Charges patronales" />

            {/* CNSS Pension — 3510 */}
            {cnssEmpPension>0&&(()=>{patRef+=10; return(
              <Row key="cpen" rub={patRef}
                label="CNSS Pension vieillesse"
                base={fmtZ(Math.min(totalBrut,1_200_000))}
                patTaux="8%" patMt={fmt(cnssEmpPension)}
              />
            );})()}

            {/* CNSS Famille — 3520 */}
            {cnssEmpFamily>0&&(()=>{patRef+=10; return(
              <Row key="cfam" rub={patRef}
                label="CNSS Prestations familiales"
                base={fmtZ(Math.min(totalBrut,600_000))}
                patTaux="10,03%" patMt={fmt(cnssEmpFamily)} zebra
              />
            );})()}

            {/* CNSS AT — 3530 */}
            {cnssEmpAccident>0&&(()=>{patRef+=10; return(
              <Row key="cat" rub={patRef}
                label="CNSS Accidents du travail"
                base={fmtZ(Math.min(totalBrut,600_000))}
                patTaux="2,25%" patMt={fmt(cnssEmpAccident)}
              />
            );})()}

            {/* TUS CNSS — 3540 */}
            {tusCnss>0&&(()=>{patRef+=10; return(
              <Row key="tcnss" rub={patRef}
                label="TUS — Part CNSS (5,475%)"
                base={fmtZ(totalBrut)}
                patTaux="5,475%" patMt={fmt(tusCnss)} zebra
              />
            );})()}

            {/* Custom patronal (empItems hors TUS natifs) */}
            {ctaxPat.map((item: any) => { patRef+=10; return(
              <Row key={item.id||item.code} rub={patRef}
                label={item.label}
                base={itemBase(item)}
                patTaux={itemTaux(item)} patMt={fmt(item.amount)}
              />
            );})}

            <TotalRow label="Total Charges Patronales" patMt={fmtZ(totalCotisPat)} />

            {/* TOTAL GAINS */}
            <TotalRow label="Total Gains" gain={fmtZ(netSalary + totalDed)} />

            {/* TOTAL RETENUES */}
            <TotalRow label="Total Retenues" ret={fmtZ(totalDed)} />

            {/* ── 4. INDEMNITÉS & AVANTAGES ─────────────────────────── */}
            {indems.length>0&&<SepRow label="4 - Indemnités &amp; Avantages" />}
            {indems.map((item: any, idx: number) => {
              indemRef+=10;
              return(
                <Row key={item.id||item.code} rub={indemRef}
                  label={item.label}
                  base={itemBase(item)} taux={itemTaux(item)}
                  gain={fmt(item.amount)} zebra={idx%2!==0}
                />
              );
            })}

          </tbody>
        </table>

        {/* ══ MODE RÈGLEMENT + NET À PAYER ═════════════════════════════════ */}
        <table className="nb" style={{ width:'100%',borderCollapse:'collapse',marginTop:4 }}>
          <tbody>
            <tr>
              <td data-black="1" style={{
                ...cell({ fontWeight:700,textAlign:'center',fontSize:8.5,width:'13%' }),
                backgroundColor:BLACK, color:WHITE,
                WebkitPrintColorAdjust:'exact', printColorAdjust:'exact',
              }}>Mode règlement</td>
              <td style={cell({ width:'34%',fontSize:8.5 })}>
                Banque : <strong>{e.bankName||'—'}</strong>
                {e.bankAccountNumber&&<div style={{ fontSize:7.5 }}>N° compte : <strong>{e.bankAccountNumber}</strong></div>}
              </td>
              <td style={cell({ width:'12%',fontSize:8.5 })}>{PAYMENT[e.paymentMethod??'']||'Virement'}</td>
              <td data-black="1" style={{
                ...cell({ fontWeight:700,textAlign:'center',fontSize:8.5,width:'12%' }),
                backgroundColor:BLACK, color:WHITE,
                WebkitPrintColorAdjust:'exact', printColorAdjust:'exact',
              }}>Net à payer</td>
              <td style={cellR({ fontWeight:900,fontSize:14,fontFamily:FONT,backgroundColor:GRAY3,border:'2px solid #000',width:'16%' })}>
                {fmtZ(netSalary)}
              </td>
              <td style={cell({ textAlign:'center',fontSize:8,width:'13%' })}>2ème banque</td>
            </tr>
          </tbody>
        </table>

        {/* ══ CUMULS ══════════════════════════════════════════════════════ */}
        <table className="nb" style={{ width:'100%',borderCollapse:'collapse',marginTop:0,tableLayout:'fixed' }}>
          <colgroup>
            <col style={{ width:'8%'  }} />
            <col style={{ width:'13%' }} />
            <col style={{ width:'12%' }} />
            <col style={{ width:'12%' }} />
            <col style={{ width:'9%'  }} />
            <col style={{ width:'13%' }} />
            <col style={{ width:'11%' }} />
            <col style={{ width:'11%' }} />
            <col style={{ width:'11%' }} />
          </colgroup>
          <thead>
            <tr>
              {['','Sal. brut','Ch. sal.','Ch. pat.','Avt. nat.','Net impos.','H. trav.','H. suppl.','Base cong.'].map((h,i)=>(
                <th key={i} style={TH({ fontSize:7.5,padding:'2px 3px' })}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr style={{ backgroundColor:GRAY1 }}>
              <td style={cell({ fontWeight:700,textAlign:'center',backgroundColor:GRAY1 })}>Mois</td>
              <td style={cellR({ fontWeight:700,backgroundColor:GRAY1 })}>{fmtZ(totalBrut)}</td>
              <td style={cellR({ backgroundColor:GRAY1 })}>{fmtD(cnssSal)}</td>
              <td style={cellR({ backgroundColor:GRAY1 })}>{fmtD(totalCotisPat)}</td>
              <td style={cellR({ backgroundColor:GRAY1 })}>0</td>
              <td style={cellR({ backgroundColor:GRAY1 })}>{fmtZ(nv(payroll.grossSalary)-cnssSal)}</td>
              <td style={cellR({ backgroundColor:GRAY1 })}>{fmtD((nv(payroll.workedDays)||0)*8)}</td>
              <td style={cellR({ backgroundColor:GRAY1 })}>—</td>
              <td style={cellR({ backgroundColor:GRAY1 })}>—</td>
            </tr>
            <tr>
              <td colSpan={9} data-black="1" style={{
                backgroundColor:BLACK, color:WHITE,
                padding:'2px 6px', fontSize:7.5, fontWeight:700,
                letterSpacing:'1px', border:BD,
                textTransform:'uppercase' as const,
                WebkitPrintColorAdjust:'exact', printColorAdjust:'exact',
              }}>
                Cumuls — Jan. → {monthLabel.slice(0,4)}. {payroll.year}
              </td>
            </tr>
            <tr style={{ backgroundColor:WHITE }}>
              <td style={cell({ fontWeight:700,textAlign:'center' })}>Année</td>
              <td style={cellR({ fontWeight:700 })}>{fmtD(ytd.grossSalary)}</td>
              <td style={cellR()}>{fmtD(ytd.cnssSalarial)}</td>
              <td style={cellR()}>{fmtD(ytd.cnssEmployer)}</td>
              <td style={cellR()}>0</td>
              <td style={cellR()}>{fmtD(ytdNetImp)}</td>
              <td style={cellR()}>—</td>
              <td style={cellR()}>—</td>
              <td style={cellR()}>—</td>
            </tr>
          </tbody>
        </table>

        {/* ══ SIGNATURES ══════════════════════════════════════════════════ */}
        <table style={{ width:'100%',borderCollapse:'collapse',marginTop:12 }}>
          <tbody>
            <tr>
              <td style={{ width:'40%',padding:'4px 8px',borderTop:'1.5px solid #000',fontSize:8.5,fontWeight:700,textTransform:'uppercase' as const,verticalAlign:'top' }}>
                Signature de l'Employé(e)
                <div style={{ height:36,borderBottom:'1px solid #000',marginTop:22 }} />
                <div style={{ fontSize:8,fontWeight:400,marginTop:3,textTransform:'none' as const }}>Lu et approuvé</div>
              </td>
              <td style={{ width:'10%' }} />
              <td style={{ width:'50%',padding:'4px 8px',borderTop:'1.5px solid #000',verticalAlign:'top' }}>
                <div style={{ fontSize:8.5,fontWeight:700,textTransform:'uppercase' as const,textAlign:'center',marginBottom:4 }}>
                  Signature et cachet de l'Employeur
                </div>
                <div style={{ display:'flex',gap:8 }}>
                  <div style={{ flex:1,textAlign:'center' }}>
                    <div style={{ fontSize:8,fontWeight:700 }}>Chef Département</div>
                    <div style={{ height:32,borderBottom:'1px solid #000',marginTop:16 }} />
                  </div>
                  <div style={{ flex:1,textAlign:'center' }}>
                    <div style={{ fontSize:8,fontWeight:700 }}>DRH / Direction</div>
                    <div style={{ height:32,borderBottom:'1px solid #000',marginTop:16 }} />
                  </div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        {/* ══ PIED DE PAGE ════════════════════════════════════════════════ */}
        <div style={{ borderTop:'1px solid #000',marginTop:'auto',paddingTop:4,display:'flex',justifyContent:'space-between',fontSize:7.5,color:'#444' }}>
          <span>CNSS sal. 4% · ITS barème 2026 · Parts fiscales maintenues · SMIG 70 400 FCFA · Décret N°78-360</span>
          <span style={{ fontWeight:700,color:BLACK }}>KONZARH</span>
        </div>

      </div>
    </>
  );
}