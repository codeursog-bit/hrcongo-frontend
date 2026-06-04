'use client';
// ============================================================================
// BulletinRendererDefault v4.0
// - Pas de bordures/carreaux : lignes séparatrices fines uniquement
// - Suppression ligne résumé CNSS patronale (doublon)
// - Footer fidèle bulletin physique
// - Cumuls : Brut / Net imposable / Ch.sal / Ch.pat / Droits ann / Solde
// - Signatures : 2 blocs seulement (Employé + Employeur)
// - TUS DGI (2,025%) : affiché après ITS, valeur colonne patronale
// - TUS CNSS (5,475%) : section patronale
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

const RUB = {
  GAIN_START:   1001,
  CNSS_SAL:     2505,
  ITS:          4520,
  TUS_DGI_RUB:  4700,
  TOL:          4601,
  CAMU:         4650,
  PAT_START:    3510,
  LOAN_START:   6700,
  INDEM_START:  5400,
};

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

function itemBase(item: any): string {
  if (item.base==null||nv(item.base)===0) return '';
  const base=nv(item.base), rate=nv(item.rate);
  if (isOT(item.code) && rate > 1 && rate <= 3)
    return Math.round(base * rate).toLocaleString('fr-FR');
  return Math.round(base).toLocaleString('fr-FR');
}

function itemTaux(item: any): string {
  if (isOT(item.code)) { const q=nv(item.quantity); return q>0?String(q):''; }
  const qty=item.quantity; if(qty!=null&&nv(qty)!==0) return String(nv(qty));
  const r=nv(item.rate); if(!r||r===1) return '';
  if(r>1&&r<=3) return r.toFixed(2).replace('.',',');
  if(r>0&&r<1){const p=r*100; return p%1===0?p.toFixed(0):p.toFixed(3).replace(/0+$/,'');}
  return String(r);
}

// ── Styles sans bordures — séparateurs fins uniquement ────────────────────────
const FONT = '"Courier New",Courier,monospace';
const SANS = 'Arial,Helvetica,sans-serif';
const BLACK = '#000';
const WHITE = '#fff';
const LINE  = '0.5px solid #999'; // séparateur fin
const LINE_STRONG = '1px solid #000';

// Cellule sans bordure, juste padding
const td = (e?: React.CSSProperties): React.CSSProperties => ({
  padding:'1.5px 4px', fontSize:8, verticalAlign:'middle',
  fontFamily:SANS, color:BLACK, ...e,
});
const tdR = (e?: React.CSSProperties): React.CSSProperties => ({
  ...td(), textAlign:'right', fontFamily:FONT, whiteSpace:'nowrap' as const, ...e,
});
const tdC = (e?: React.CSSProperties): React.CSSProperties => ({
  ...td(), textAlign:'center', ...e,
});

// En-tête colonne — fond noir, pas de bordure externe
const TH = (e?: React.CSSProperties): React.CSSProperties => ({
  padding:'3px 4px', fontSize:7.5, fontWeight:700, textAlign:'center',
  backgroundColor:BLACK, color:WHITE,
  textTransform:'uppercase' as const, fontFamily:SANS,
  WebkitPrintColorAdjust:'exact', printColorAdjust:'exact', ...e,
});

// Séparateur section — fond noir pleine largeur
const SepRow = ({ label }: { label: string }) => (
  <tr>
    <td colSpan={8} style={{
      backgroundColor:BLACK, color:WHITE,
      padding:'2px 6px', fontSize:7.5, fontWeight:700,
      letterSpacing:'0.8px', borderTop:LINE_STRONG,
      textTransform:'uppercase' as const, fontFamily:SANS,
      WebkitPrintColorAdjust:'exact', printColorAdjust:'exact',
    }}>{label}</td>
  </tr>
);

// Ligne total — fond gris clair, texte gras, trait fort dessus/dessous
const TotalRow = ({ label, gain='', ret='', patMt='' }:
  { label:string; gain?:string; ret?:string; patMt?:string }) => (
  <tr style={{ borderTop:LINE_STRONG, borderBottom:LINE_STRONG }}>
    <td colSpan={4} style={{
      ...td({ fontWeight:900, fontSize:8.5,
        backgroundColor:'#ebebeb', textTransform:'uppercase' as const,
        borderTop:LINE_STRONG, borderBottom:LINE_STRONG,
        WebkitPrintColorAdjust:'exact', printColorAdjust:'exact',
      })
    }}>{label}</td>
    <td style={tdR({ fontWeight:900, fontSize:9, backgroundColor:'#ebebeb', borderTop:LINE_STRONG, borderBottom:LINE_STRONG })}>{gain}</td>
    <td style={tdR({ fontWeight:900, fontSize:9, backgroundColor:'#ebebeb', borderTop:LINE_STRONG, borderBottom:LINE_STRONG })}>{ret}</td>
    <td style={tdC({ backgroundColor:'#ebebeb', borderTop:LINE_STRONG, borderBottom:LINE_STRONG })} />
    <td style={tdR({ fontWeight:900, fontSize:9, backgroundColor:'#ebebeb', borderTop:LINE_STRONG, borderBottom:LINE_STRONG })}>{patMt}</td>
  </tr>
);

// Ligne standard — séparateur fin bas uniquement, zébrage léger
const Row = ({ rub, label, base='', taux='', gain='', ret='',
               patTaux='', patMt='', bold=false, zebra=false }:
  { rub:number|string; label:string; base?:string; taux?:string;
    gain?:string; ret?:string; patTaux?:string; patMt?:string;
    bold?:boolean; zebra?:boolean }) => {
  const bg = zebra ? '#f8f8f8' : WHITE;
  const sep = { borderBottom: LINE } as React.CSSProperties;
  return (
    <tr style={{ backgroundColor:bg }}>
      <td style={{ ...tdC({ fontFamily:FONT, fontSize:7.5 }), ...sep }}>{rub}</td>
      <td style={{ ...td({ paddingLeft:6, fontWeight:bold?700:400 }), ...sep }}>{label}</td>
      <td style={{ ...tdR(), ...sep }}>{base}</td>
      <td style={{ ...tdC(), ...sep }}>{taux}</td>
      <td style={{ ...tdR({ fontWeight:gain?600:400 }), ...sep }}>{gain}</td>
      <td style={{ ...tdR({ fontWeight:ret?600:400 }), ...sep }}>{ret}</td>
      <td style={{ ...tdC({ fontWeight:patTaux?600:400 }), ...sep }}>{patTaux}</td>
      <td style={{ ...tdR({ fontWeight:patMt?600:400 }), ...sep }}>{patMt}</td>
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

  const gains = gainItems.filter((i: any) => !['ABS_DEDUCT','ABS_CONGE'].includes(i.code));

  const tolItems     = cotisItems.filter((i: any) => /TOL/i.test(i.code||''));
  const camuItems    = cotisItems.filter((i: any) => /CAMU/i.test(i.code||''));
  const otherCtaxSal = cotisItems.filter((i: any) =>
    !['CNSS_SAL','CNSS','ITS','IRPP','BNC_SOURCE'].includes(i.code) &&
    !/TOL|CAMU/i.test(i.code||'') &&
    !['LOAN','ADVANCE'].includes(i.code)
  ).concat(retenueItems.filter((i: any) => !['LOAN','ADVANCE'].includes(i.code)));

  const loanItems = retenueItems.filter((i: any) => ['LOAN','ADVANCE'].includes(i.code));
  const indems    = indemItems;

  // Charges patronales custom hors TUS natifs
  const ctaxPat = ((empItems ?? []) as any[])
    .filter((i: any) => !['TUS_DGI','TUS_CNSS'].includes(i.code));

  // Total charges patronales (TUS DGI inclus = charge patronale)
  const totalCotisPat = cnssEmpPension + cnssEmpFamily + cnssEmpAccident
    + tusCnss + tusDgi
    + ctaxPat.reduce((s:number,i:any)=>s+nv(i.amount),0);

  const totalDed  = nv(payroll.totalDeductions);
  const ytdNetImp = nv(ytd.grossSalary) - nv(ytd.cnssSalarial);
  const fullName  = [e.lastName?.toUpperCase(), e.firstName].filter(Boolean).join(' ');
  const cat       = [e.professionalCategory, e.echelon?`Ech.${e.echelon}`:null].filter(Boolean).join('/');

  let gainRef  = RUB.GAIN_START - 1;
  let patRef   = RUB.PAT_START  - 10;
  let indemRef = RUB.INDEM_START - 10;
  let loanRef  = RUB.LOAN_START;

  return (
    <>
      <style>{`
        @media print {
          @page { size: A4 portrait; margin: 8mm; }
          html, body { margin:0!important; padding:0!important; background:#fff!important; }
          .no-print, nav, header, aside, footer,
          [class*="sidebar"],[class*="Sidebar"],
          [class*="navbar"],[class*="Navbar"] { display:none!important; }
          #bul-default {
            width:194mm!important; min-height:277mm!important;
            padding:0!important; margin:0!important;
            box-shadow:none!important; border:none!important;
            background-color:#fff!important;
          }
          .nb { page-break-inside:avoid!important; break-inside:avoid!important; }
          * {
            -webkit-print-color-adjust:exact!important;
            print-color-adjust:exact!important;
            color-adjust:exact!important;
          }
          [data-black="1"] { background-color:#000!important; color:#fff!important; }
        }
      `}</style>

      <div id="bul-default" style={{
        fontFamily:SANS, fontSize:8, color:BLACK, backgroundColor:WHITE,
        width:'210mm', minHeight:'277mm', boxSizing:'border-box' as const,
        padding:'10px 14px', margin:'0 auto',
        display:'flex', flexDirection:'column' as const,
        boxShadow:'0 2px 12px rgba(0,0,0,0.08)',
      }}>

        {/* ══ EN-TÊTE ══════════════════════════════════════════════════════ */}
        <div className="nb" style={{
          borderTop:'2px solid #000', borderBottom:'1px solid #000',
          paddingBottom:4, marginBottom:4,
          display:'flex', justifyContent:'space-between', alignItems:'flex-start',
        }}>
          {/* Gauche : logo + infos société */}
          <div style={{ flex:1 }}>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:3 }}>
              {co.logo
                ? <img src={co.logo} alt="" style={{ width:40,height:40,objectFit:'contain' }} />
                : <div style={{
                    width:40, height:40, backgroundColor:BLACK,
                    display:'flex', alignItems:'center', justifyContent:'center',
                    color:WHITE, fontWeight:900, fontSize:9, fontFamily:SANS,
                    WebkitPrintColorAdjust:'exact', printColorAdjust:'exact',
                  }}>
                    {(co.tradeName||co.legalName||'').slice(0,4).toUpperCase()}
                  </div>
              }
              <div>
                <div style={{ fontWeight:900, fontSize:11, textTransform:'uppercase' as const, letterSpacing:.5 }}>
                  {co.tradeName||co.legalName||'—'}
                </div>
                {co.tradeName&&co.legalName&&co.tradeName!==co.legalName&&
                  <div style={{ fontSize:7.5, color:'#444' }}>{co.legalName}</div>}
              </div>
            </div>
            <div style={{ fontSize:7.5, lineHeight:1.6 }}>
              <span>{[co.address,co.city,co.country==='CG'?'Congo-Brazzaville':co.country].filter(Boolean).join(', ')}</span>
              {co.phone&&<span> · Tél : {co.phone}</span>}
              {co.email&&<span> · {co.email}</span>}
            </div>
            <div style={{ fontSize:7.5, lineHeight:1.6 }}>
              RCCM : <strong>{co.rccmNumber||'—'}</strong>
              {' · '}CNSS : <strong>{co.cnssNumber||'—'}</strong>
              {' · '}Conv. : <strong>{co.collectiveAgreement||'—'}</strong>
            </div>
          </div>

          {/* Droite : titre bulletin */}
          <div data-black="1" style={{
            backgroundColor:BLACK, color:WHITE,
            padding:'8px 14px', textAlign:'center', minWidth:100,
            WebkitPrintColorAdjust:'exact', printColorAdjust:'exact',
          }}>
            <div style={{ fontSize:7, fontWeight:700, letterSpacing:2, textTransform:'uppercase' as const }}>Bulletin de Paie</div>
            <div style={{ fontSize:22, fontWeight:900, fontFamily:FONT, marginTop:2 }}>
              {monthLabel.slice(0,4).toUpperCase()}
            </div>
            <div style={{ fontSize:13, fontWeight:700, fontFamily:FONT }}>{payroll.year}</div>
          </div>
        </div>

        {/* ══ INFOS SALARIÉ ════════════════════════════════════════════════ */}
        <div className="nb" style={{
          borderBottom:'1px solid #000', paddingBottom:4, marginBottom:4,
        }}>
          {/* Ligne 1 : nom + poste + cat */}
          <div style={{ display:'flex', gap:16, marginBottom:2 }}>
            <div style={{ fontWeight:900, fontSize:10, flex:'0 0 auto' }}>{fullName||'—'}</div>
            <div style={{ fontSize:8 }}>Poste : <strong>{e.position||'—'}</strong></div>
            {cat&&<div style={{ fontSize:8 }}>Cat/Ech : <strong>{cat}</strong></div>}
            {e.department?.name&&<div style={{ fontSize:8 }}>Dept : <strong>{e.department.name}</strong></div>}
            <div style={{ fontSize:8 }}>Paiement : <strong>{PAYMENT[e.paymentMethod??'']||'Virement'}</strong></div>
          </div>
          {/* Ligne 2 : infos admin */}
          <div style={{ display:'flex', gap:16, fontSize:7.5 }}>
            <span>Embauche : <strong>{fmtDate(e.hireDate)}</strong></span>
            <span>N° CNSS/CRF : <strong>{e.cnssNumber||'—'}</strong></span>
            <span>Situation : <strong>{MARITAL[e.maritalStatus??'']||'—'}</strong></span>
            <span>Enfants : <strong>{nv(e.numberOfChildren)||'0'}</strong></span>
            <span>Ancienneté : <strong>{seniority(e.hireDate)}</strong></span>
            <span>Parts IRPP : <strong>{fiscalParts}</strong></span>
            <span>Contrat : <strong>{CONTRACT[e.contractType??'']||e.contractType||'—'}</strong></span>
          </div>
        </div>

        {/* ══ TABLEAU PRINCIPAL ════════════════════════════════════════════ */}
        <table className="nb" style={{ width:'100%', borderCollapse:'collapse', tableLayout:'fixed' }}>
          <colgroup>
            <col style={{ width:'6%'  }} />
            <col style={{ width:'30%' }} />
            <col style={{ width:'11%' }} />
            <col style={{ width:'5%'  }} />
            <col style={{ width:'12%' }} />
            <col style={{ width:'12%' }} />
            <col style={{ width:'6%'  }} />
            <col style={{ width:'12%' }} />
          </colgroup>
          <thead>
            <tr>
              <th rowSpan={2} style={TH()}>Rub.</th>
              <th rowSpan={2} style={TH({ textAlign:'left', paddingLeft:6 })}>Libellé</th>
              <th rowSpan={2} style={TH()}>Nbre / Base</th>
              <th rowSpan={2} style={TH()}>Taux</th>
              <th colSpan={2} style={TH()}>Part Salariale</th>
              <th colSpan={2} style={TH()}>Part Patronale</th>
            </tr>
            <tr>
              <th style={TH()}>Gains</th>
              <th style={TH()}>Retenues</th>
              <th style={TH()}>Taux</th>
              <th style={TH()}>Montant</th>
            </tr>
          </thead>
          <tbody>

            {/* ── 1. GAINS ──────────────────────────────────────────── */}
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

            {/* TOTAL BRUT */}
            <tr>
              <td colSpan={8} style={{
                backgroundColor:'#e0e0e0', fontWeight:900, fontSize:10,
                textAlign:'center', letterSpacing:1,
                borderTop:LINE_STRONG, borderBottom:LINE_STRONG,
                padding:'4px 8px', fontFamily:SANS,
                WebkitPrintColorAdjust:'exact', printColorAdjust:'exact',
              }}>
                TOTAL BRUT &nbsp;—&nbsp; {fmtZ(totalBrut)} F
              </td>
            </tr>

            {/* ── 2. COTISATIONS ────────────────────────────────────── */}
            <SepRow label="2 - Cotisations" />

            {/* CNSS salariale */}
            <Row rub={RUB.CNSS_SAL}
              label="CNSS (plafond 1.200.000)"
              base={fmtZ(Math.min(totalBrut,1_200_000))}
              taux="4,00%"
              ret={fmt(cnssSal)}
            />

            {/* ITS */}
            {itsAmount>0&&(
              <Row rub={RUB.ITS}
                label="ITS / IRPP Mois"
                base={fmt(itsBase)} taux="Barème"
                ret={fmt(itsAmount)} zebra
              />
            )}

            {/* TUS DGI — après ITS, charge patronale versée à la DGI */}
            {tusDgi>0&&(
              <Row rub={RUB.TUS_DGI_RUB}
                label="Taxe unique sur salaire (DGI)"
                base={fmtZ(totalBrut)} taux="2,025%"
                patTaux="2,025%" patMt={fmt(tusDgi)}
              />
            )}

            {/* TOL */}
            {tolItems.map((item: any) => (
              <Row key={item.id||item.code} rub={RUB.TOL}
                label={item.label}
                base={itemBase(item)} taux={itemTaux(item)}
                ret={fmt(item.amount)} zebra
              />
            ))}

            {/* CAMU */}
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

            {/* Prêts & avances */}
            {loanItems.map((item: any, idx: number) => (
              <Row key={item.id||item.code} rub={loanRef+idx}
                label={item.label}
                base={itemBase(item)} taux={itemTaux(item)}
                ret={fmt(item.amount)} zebra={idx%2!==0}
              />
            ))}

            {/* CNSS Pension patronale */}
            {cnssEmpPension>0&&(()=>{patRef+=10; return(
              <Row key="cpen" rub={patRef}
                label="CNSS (plafond 1.200.000)"
                base={fmtZ(Math.min(totalBrut,1_200_000))}
                patTaux="8%" patMt={fmt(cnssEmpPension)}
              />
            );})()}

            {/* CNSS Famille patronale */}
            {cnssEmpFamily>0&&(()=>{patRef+=10; return(
              <Row key="cfam" rub={patRef}
                label="CNSS (plafond 600.000)"
                base={fmtZ(Math.min(totalBrut,600_000))}
                patTaux="10,03%" patMt={fmt(cnssEmpFamily)} zebra
              />
            );})()}

            {/* CNSS AT patronale */}
            {cnssEmpAccident>0&&(()=>{patRef+=10; return(
              <Row key="cat" rub={patRef}
                label="CNSS (plafond 600.000)"
                base={fmtZ(Math.min(totalBrut,600_000))}
                patTaux="2,25%" patMt={fmt(cnssEmpAccident)}
              />
            );})()}

            {/* TUS CNSS patronale */}
            {tusCnss>0&&(()=>{patRef+=10; return(
              <Row key="tcnss" rub={patRef}
                label="Taxe unique sur salaire"
                base={fmtZ(totalBrut)}
                patTaux="5,475%" patMt={fmt(tusCnss)} zebra
              />
            );})()}

            {/* Custom patronal */}
            {ctaxPat.map((item: any) => { patRef+=10; return(
              <Row key={item.id||item.code} rub={patRef}
                label={item.label}
                base={itemBase(item)}
                patTaux={itemTaux(item)} patMt={fmt(item.amount)}
              />
            );})}

            <TotalRow label="Total cotisations" ret={fmtZ(totalDed)} patMt={fmtZ(totalCotisPat)} />
            <TotalRow label="Total gains"    gain={fmtZ(netSalary + totalDed)} />
            <TotalRow label="Total retenues" ret={fmtZ(totalDed)} />

            {/* ── 3. INDEMNITÉS ─────────────────────────────────────── */}
            {indems.length>0&&<SepRow label="3 - Indemnités &amp; Avantages" />}
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

        {/* ══ FOOTER — fidèle bulletin physique ════════════════════════════ */}
        <div className="nb" style={{ marginTop:6, borderTop:LINE_STRONG }}>

          {/* Ligne mode règlement + net à payer */}
          <table style={{ width:'100%', borderCollapse:'collapse', marginTop:4 }}>
            <tbody>
              <tr>
                {/* Mode règlement */}
                <td style={{ width:'18%', ...td({ fontWeight:700, fontSize:8 }) }}>
                  Mode règlement :
                </td>
                <td style={{ width:'20%', ...td({ fontSize:8 }) }}>
                  {PAYMENT[e.paymentMethod??'']||'Virement'}
                </td>
                {/* Banque */}
                <td style={{ width:'12%', ...td({ fontWeight:700, fontSize:8 }) }}>
                  Banque :
                </td>
                <td style={{ width:'20%', ...td({ fontSize:8 }) }}>
                  <div><strong>{e.bankName||'—'}</strong></div>
                  {e.bankAccountNumber&&
                    <div style={{ fontSize:7.5 }}>N° de compte : <strong>{e.bankAccountNumber}</strong></div>}
                </td>
                {/* Net à payer */}
                <td style={{ width:'14%', ...td({ fontWeight:900, fontSize:9, textAlign:'right' as const }) }}>
                  Net à payer :
                </td>
                <td style={{
                  width:'16%',
                  textAlign:'right' as const, fontWeight:900, fontSize:14,
                  fontFamily:FONT, padding:'2px 6px',
                  borderBottom:'2px solid #000',
                  color:BLACK,
                }}>
                  {fmtZ(netSalary)}
                </td>
              </tr>
              <tr>
                <td style={td({ fontWeight:700, fontSize:8 })}>2ème banque :</td>
                <td colSpan={3} style={td({ fontSize:8, borderBottom:LINE })}>—</td>
                <td style={td({ fontWeight:700, fontSize:8, textAlign:'right' as const })}>Droits annuels :</td>
                <td style={{ ...tdR({ fontSize:8 }), borderBottom:LINE }}>—</td>
              </tr>
            </tbody>
          </table>

          {/* Cumuls */}
          <table style={{ width:'100%', borderCollapse:'collapse', marginTop:6, tableLayout:'fixed' }}>
            <colgroup>
              <col style={{ width:'8%'  }} />
              <col style={{ width:'15%' }} />
              <col style={{ width:'14%' }} />
              <col style={{ width:'14%' }} />
              <col style={{ width:'14%' }} />
              <col style={{ width:'14%' }} />
              <col style={{ width:'10%' }} />
              <col style={{ width:'11%' }} />
            </colgroup>
            <thead>
              <tr>
                {['Cumuls','Brut','Net imposable','Charges sal.','Charges pat.','Droits ann.','Solde',''].map((h,i)=>(
                  <th key={i} style={TH({ fontSize:7, padding:'2px 3px' })}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr style={{ backgroundColor:'#f4f4f4', WebkitPrintColorAdjust:'exact' as any }}>
                <td style={tdC({ fontWeight:700, fontSize:7.5 })}>Mois</td>
                <td style={tdR({ fontWeight:700 })}>{fmtZ(totalBrut)}</td>
                <td style={tdR()}>{fmtZ(nv(payroll.grossSalary)-cnssSal)}</td>
                <td style={tdR()}>{fmtD(cnssSal)}</td>
                <td style={tdR()}>{fmtD(totalCotisPat)}</td>
                <td style={tdR()}>—</td>
                <td style={tdR()}>—</td>
                <td style={tdR()}></td>
              </tr>
              <tr>
                <td style={tdC({ fontWeight:700, fontSize:7.5 })}>Année</td>
                <td style={tdR({ fontWeight:700 })}>{fmtD(ytd.grossSalary)}</td>
                <td style={tdR()}>{fmtD(ytdNetImp)}</td>
                <td style={tdR()}>{fmtD(ytd.cnssSalarial)}</td>
                <td style={tdR()}>{fmtD(ytd.cnssEmployer)}</td>
                <td style={tdR()}>—</td>
                <td style={tdR()}>—</td>
                <td style={tdR()}></td>
              </tr>
            </tbody>
          </table>

          {/* Signatures — 2 blocs uniquement */}
          <table style={{ width:'100%', borderCollapse:'collapse', marginTop:14 }}>
            <tbody>
              <tr>
                <td style={{ width:'45%', verticalAlign:'top', paddingTop:4, borderTop:LINE_STRONG }}>
                  <div style={{ fontSize:8, fontWeight:700, textTransform:'uppercase' as const }}>
                    Signature de l'Employé(e)
                  </div>
                  <div style={{ height:32, borderBottom:'1px solid #000', marginTop:20 }} />
                  <div style={{ fontSize:7.5, marginTop:3 }}>Lu et approuvé</div>
                </td>
                <td style={{ width:'10%' }} />
                <td style={{ width:'45%', verticalAlign:'top', paddingTop:4, borderTop:LINE_STRONG }}>
                  <div style={{ fontSize:8, fontWeight:700, textTransform:'uppercase' as const, textAlign:'center' as const }}>
                    Signature et cachet de l'Employeur
                  </div>
                  <div style={{ height:32, borderBottom:'1px solid #000', marginTop:20 }} />
                </td>
              </tr>
            </tbody>
          </table>

        </div>

        {/* ══ PIED DE PAGE ════════════════════════════════════════════════ */}
        <div style={{
          borderTop:LINE, marginTop:'auto', paddingTop:3,
          display:'flex', justifyContent:'space-between', fontSize:7, color:'#555',
        }}>
          <span>CNSS sal. 4% · ITS barème 2026 · SMIG 70 400 FCFA · Décret N°78-360</span>
          <span style={{ fontWeight:700, color:BLACK }}>KONZARH</span>
        </div>

      </div>
    </>
  );
}