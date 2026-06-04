'use client';
// ============================================================================
// BulletinRendererDefault v4
// ✅ Reproduction FIDÈLE du bulletin physique Congo
// ✅ A4 PAYSAGE (297mm × 210mm)
// ✅ Couleurs : en-têtes gris clair fond texte noir (pas fond noir)
// ✅ En-tête : société + salarié côte à côte dans même tableau
// ✅ Pas de SepRow fond noir — sections séparées par lignes total en gras
// ✅ Bas de page : Signature gauche | Cumuls droite | NET À PAYER encadré
// ✅ Numérotation rubriques incrémentale par plage
// ✅ N&B safe : gris clair → imprime gris lisible, texte noir partout
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

// ── Utilitaires ───────────────────────────────────────────────────────────────
const nv = (v: any): number => { const x = Number(v); return isFinite(x) ? x : 0; };
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

function itemBase(item: any): string {
  if (item.base==null||nv(item.base)===0) return '';
  const base=nv(item.base), rate=nv(item.rate);
  const isOT=/OT|OVER|HSUP|H_SUP|HEURE_SUP/i.test(item.code??'');
  if (isOT&&rate>0&&rate<1) return Math.round(base*(1+rate)).toLocaleString('fr-FR');
  return Math.round(base).toLocaleString('fr-FR');
}
function itemTaux(item: any): string {
  const isOT=/OT|OVER|HSUP|H_SUP|HEURE_SUP/i.test(item.code??'');
  if (isOT){const q=nv(item.quantity); if(q>0) return String(q);}
  const qty=item.quantity; if(qty!=null&&nv(qty)!==0) return String(nv(qty));
  const r=nv(item.rate); if(!r||r===1) return '';
  if(r>1&&r<=3) return r.toFixed(2).replace('.',',');
  if(r>0&&r<1){const p=r*100; return p%1===0?p.toFixed(0):p.toFixed(3).replace(/0+$/,'');}
  return String(r);
}

// ── Styles — gris clair pour N&B safe ────────────────────────────────────────
const FONT  = '"Courier New",Courier,monospace';
const SANS  = 'Arial,Helvetica,sans-serif';
const BD    = '0.5px solid #999';
const BDK   = '0.5px solid #000';

// En-tête colonne : fond gris clair, texte noir — N&B safe (imprime gris)
const TH_BG = '#c8c8c8';  // gris moyen — lisible N&B
const TH_SAL_BG = '#b8b8b8'; // légèrement plus sombre pour Part Salariale
const TH_PAT_BG = '#a8a8a8'; // encore légèrement plus sombre pour Part Patronale

const cell = (e?: React.CSSProperties): React.CSSProperties => ({
  border:BD, padding:'2px 4px', fontSize:8, verticalAlign:'middle',
  color:'#000', fontFamily:SANS, ...e,
});
const cellR = (e?: React.CSSProperties): React.CSSProperties => ({
  ...cell(), textAlign:'right', fontFamily:FONT, whiteSpace:'nowrap', ...e,
});
const cellC = (e?: React.CSSProperties): React.CSSProperties => ({
  ...cell(), textAlign:'center', ...e,
});

// TH fond gris clair texte noir — IDENTIQUE au bulletin physique
const th = (bg=TH_BG, e?: React.CSSProperties): React.CSSProperties => ({
  border:BDK, padding:'3px 4px', fontSize:7.5, fontWeight:700,
  textAlign:'center', background:bg, color:'#000',
  textTransform:'uppercase' as const, fontFamily:SANS, ...e,
});

// Ligne Total — fond gris clair, texte gras
const TotalRow = ({ label, gain='', ret='', patMt='' }:
  { label:string; gain?:string; ret?:string; patMt?:string }) => (
  <tr style={{ background:'#e0e0e0', borderTop:'1.5px solid #000', borderBottom:'1.5px solid #000' }}>
    <td colSpan={4} style={{ ...cell({ fontWeight:900, fontSize:8.5, border:BDK,
      textTransform:'uppercase' as const, background:'#e0e0e0' }) }}>
      {label}
    </td>
    <td style={cellR({ fontWeight:900, fontSize:9.5, border:BDK, background:'#e0e0e0' })}>{gain}</td>
    <td style={cellR({ fontWeight:900, fontSize:9.5, border:BDK, background:'#e0e0e0' })}>{ret}</td>
    <td style={cellC({ border:BDK, background:'#e0e0e0' })} />
    <td style={cellR({ fontWeight:900, fontSize:9.5, border:BDK, background:'#e0e0e0' })}>{patMt}</td>
  </tr>
);

// Ligne standard
const Row = ({ rub, label, base='', taux='', gain='', ret='',
               patTaux='', patMt='', bold=false, zebra=false }:
  { rub:number|string; label:string; base?:string; taux?:string;
    gain?:string; ret?:string; patTaux?:string; patMt?:string;
    bold?:boolean; zebra?:boolean }) => (
  <tr style={{ background: zebra?'#f5f5f5':'#fff' }}>
    <td style={cellC({ fontFamily:FONT, fontSize:7.5, border:BD })}>{rub}</td>
    <td style={cell({ paddingLeft:5, fontWeight:bold?700:400, border:BD })}>{label}</td>
    <td style={cellR({ border:BD })}>{base}</td>
    <td style={cellC({ border:BD })}>{taux}</td>
    <td style={cellR({ fontWeight:gain?600:400, border:BD })}>{gain}</td>
    <td style={cellR({ fontWeight:ret?600:400, border:BD })}>{ret}</td>
    <td style={cellC({ fontWeight:patTaux?600:400, border:BD })}>{patTaux}</td>
    <td style={cellR({ fontWeight:patMt?600:400, border:BD })}>{patMt}</td>
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

  // Données du back
  const cnssSal         = nv(payroll.cnssSalarial);
  const itsAmount       = nv(payroll.its);
  const itsBase         = nv(payroll.grossSalary) - cnssSal;
  const totalBrut       = nv(payroll.grossSalary);
  const netSalary       = nv(payroll.netSalary);
  const fiscalParts     = nv((payroll as any).irppFiscalParts)||1;
  const cnssEmpPension  = nv(payroll.cnssEmployerPension);
  const cnssEmpFamily   = nv(payroll.cnssEmployerFamily);
  const cnssEmpAccident = nv(payroll.cnssEmployerAccident);
  const tusDgi          = nv((payroll as any).tusDgiAmount);
  const tusCnss         = nv((payroll as any).tusCnssAmount);

  // Items classifiés
  const gains = gainItems.filter((i:any)=>!['ABS_DEDUCT','ABS_CONGE'].includes(i.code));
  const indems = indemItems;

  // Taxes salarié custom (DEDUCTION, hors CNSS/ITS/prêts)
  const ctaxEmp = cotisItems.filter((i:any)=>
    !['CNSS_SAL','CNSS','ITS','IRPP','BNC_SOURCE'].includes(i.code)&&
    !['LOAN','ADVANCE'].includes(i.code)
  ).concat(retenueItems.filter((i:any)=>!['LOAN','ADVANCE'].includes(i.code)));

  // Taxes patronales custom (hors TUS)
  const ctaxPat = ((empItems??[]) as any[]).filter((i:any)=>
    !['TUS_DGI','TUS_CNSS'].includes(i.code)
  );

  // Prêts & avances
  const loanItems = retenueItems.filter((i:any)=>['LOAN','ADVANCE'].includes(i.code));

  // Totaux
  const totalPat = cnssEmpPension+cnssEmpFamily+cnssEmpAccident+tusCnss+tusDgi
    +ctaxPat.reduce((s:number,i:any)=>s+nv(i.amount),0);
  const totalRetenues = nv(payroll.totalDeductions);

  // YTD
  const ytdNetImp = nv(ytd.grossSalary)-nv(ytd.cnssSalarial);
  const monthLabel = MONTHS[(payroll.month??1)-1];
  const fullName   = [e.lastName?.toUpperCase(), e.firstName].filter(Boolean).join(' ');
  const cat        = [e.professionalCategory, e.echelon?`Ech.${e.echelon}`:null].filter(Boolean).join('/');
  const deptName   = e.department?.name ?? '';

  // Numérotation
  let gainRef  = 1000;
  let patRef   = 3500;
  let indemRef = 5390;
  let loanRef  = 6699;

  return (
    <>
      <style>{`
        @media print {
          @page { size: A4 landscape; margin: 6mm; }
          html,body { margin:0!important;padding:0!important;background:#fff!important; }
          .no-print,nav,header,aside,footer,
          [class*="sidebar"],[class*="Sidebar"],
          [class*="navbar"],[class*="Navbar"] { display:none!important; }
          #bul-default {
            width:285mm!important; min-height:195mm!important;
            padding:0!important; margin:0!important;
            box-shadow:none!important; border:none!important;
            background:#fff!important;
          }
          .nb { page-break-inside:avoid!important; break-inside:avoid!important; }
          * { -webkit-print-color-adjust:exact!important; print-color-adjust:exact!important; }
        }
      `}</style>

      <div id="bul-default" style={{
        fontFamily:SANS, fontSize:8, background:'#fff', color:'#000',
        width:'297mm', minHeight:'205mm',
        boxSizing:'border-box' as const,
        padding:'8px 10px',
        margin:'0 auto',
        boxShadow:'0 2px 12px rgba(0,0,0,0.08)',
        display:'flex', flexDirection:'column' as const,
      }}>

        {/* ══ EN-TÊTE : société + salarié côte à côte ══════════════════════ */}
        <table className="nb" style={{ width:'100%',borderCollapse:'collapse',marginBottom:3,border:'1px solid #000' }}>
          <tbody>
            {/* Ligne 1 : Nom société | Nom salarié + affectation */}
            <tr>
              <td style={{ width:'35%',padding:'3px 6px',border:BDK,fontWeight:900,fontSize:11,textTransform:'uppercase' as const }}>
                {co.tradeName||co.legalName||'—'}
              </td>
              <td style={{ width:'30%',padding:'3px 6px',border:BDK,fontWeight:900,fontSize:10 }}>
                {fullName||'—'}
              </td>
              <td style={{ width:'15%',padding:'3px 6px',border:BDK,fontSize:8 }}>
                Affectation : <strong>{deptName||'—'}</strong>
              </td>
              <td style={{ width:'12%',padding:'3px 6px',border:BDK,fontSize:8 }}>
                Poste : <strong>{e.position||'—'}</strong>
              </td>
              {/* Titre Bulletin — fond gris */}
              <td rowSpan={3} style={{ width:'8%',padding:'4px 6px',border:'1.5px solid #000',textAlign:'center',verticalAlign:'middle',background:TH_BG }}>
                <div style={{ fontSize:6.5,fontWeight:700,letterSpacing:1.5,textTransform:'uppercase' as const }}>Bulletin de Paie</div>
                <div style={{ fontSize:17,fontWeight:900,fontFamily:FONT,marginTop:2,letterSpacing:1 }}>
                  {monthLabel.slice(0,4).toUpperCase()}
                </div>
                <div style={{ fontSize:11,fontWeight:700,fontFamily:FONT }}>{payroll.year}</div>
              </td>
            </tr>
            {/* Ligne 2 : Adresse | Cat/Ech + N°matricule */}
            <tr>
              <td style={{ padding:'2px 6px',border:BDK,fontSize:7.5 }}>
                {[co.address,co.city].filter(Boolean).join(', ')}
                {co.phone&&<span> · Tél : {co.phone}</span>}
              </td>
              <td style={{ padding:'2px 6px',border:BDK,fontSize:7.5 }}>
                Cat / Ech : <strong>{cat||'—'}</strong>
              </td>
              <td style={{ padding:'2px 6px',border:BDK,fontSize:7.5 }}>
                Matr. : <strong>{e.employeeNumber||'—'}</strong>
              </td>
              <td style={{ padding:'2px 6px',border:BDK,fontSize:7.5 }}>
                {e.paymentMethod==='BANK_TRANSFER'?'Virement bancaire':'Espèces'}
              </td>
            </tr>
            {/* Ligne 3 : RCCM/CNSS | infos contrat */}
            <tr>
              <td style={{ padding:'2px 6px',border:BDK,fontSize:7.5 }}>
                RCCM : <strong>{co.rccmNumber||'—'}</strong>
                {co.cnssNumber&&<span> · CNSS Emp : <strong>{co.cnssNumber}</strong></span>}
              </td>
              <td colSpan={3} style={{ padding:'2px 6px',border:BDK,fontSize:7.5 }}>
                Conv. : <strong>{co.collectiveAgreement||'—'}</strong>
                {co.nif&&<span> · NIU : <strong>{co.nif}</strong></span>}
              </td>
            </tr>
          </tbody>
        </table>

        {/* ══ TABLEAU INFO SALARIÉ — 1 seule ligne ═════════════════════════ */}
        <table className="nb" style={{ width:'100%',borderCollapse:'collapse',marginBottom:3 }}>
          <thead>
            <tr>
              {['Date embauche','N° CNSS/CRF','Sit. familiale','Nbr Enfant','Ancienneté','Nbr part IRPP','Type de contrat'].map(h=>(
                <th key={h} style={th(TH_BG,{ fontSize:7,padding:'2px 3px' })}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={cellC({ fontSize:8 })}>{fmtDate(e.hireDate)}</td>
              <td style={cellC({ fontSize:8 })}>{e.cnssNumber||'—'}</td>
              <td style={cellC({ fontSize:8 })}>{MARITAL[e.maritalStatus??'']||'—'}</td>
              <td style={cellC({ fontSize:8 })}>{nv(e.numberOfChildren)||'—'}</td>
              <td style={cellC({ fontSize:8 })}>{seniority(e.hireDate)}</td>
              <td style={cellC({ fontSize:8,fontWeight:700 })}>{fiscalParts}</td>
              <td style={cellC({ fontSize:8 })}>{CONTRACT[e.contractType??'']||e.contractType||'—'}</td>
            </tr>
          </tbody>
        </table>

        {/* ══ TABLEAU PRINCIPAL ════════════════════════════════════════════ */}
        <table className="nb" style={{ width:'100%',borderCollapse:'collapse',tableLayout:'fixed',flex:1 }}>
          <colgroup>
            <col style={{ width:'5%'  }} />{/* Rubrique */}
            <col style={{ width:'24%' }} />{/* Libellé */}
            <col style={{ width:'9%'  }} />{/* Nbre/Base */}
            <col style={{ width:'4%'  }} />{/* Taux */}
            <col style={{ width:'12%' }} />{/* Gains */}
            <col style={{ width:'12%' }} />{/* Retenues */}
            <col style={{ width:'5%'  }} />{/* Taux pat */}
            <col style={{ width:'12%' }} />{/* Montant pat */}
          </colgroup>
          <thead>
            <tr>
              <th rowSpan={2} style={th(TH_BG)}>Rubrique</th>
              <th rowSpan={2} style={th(TH_BG,{ textAlign:'left',paddingLeft:5 })}>Libellé</th>
              <th rowSpan={2} style={th(TH_BG)}>Nbre / Base</th>
              <th rowSpan={2} style={th(TH_BG)}>Taux</th>
              <th colSpan={2} style={th(TH_SAL_BG,{ fontSize:8.5 })}>Part Salariale</th>
              <th colSpan={2} style={th(TH_PAT_BG,{ fontSize:8.5 })}>Part Patronale</th>
            </tr>
            <tr>
              <th style={th(TH_SAL_BG)}>Gains</th>
              <th style={th(TH_SAL_BG)}>Retenues</th>
              <th style={th(TH_PAT_BG)}>Taux</th>
              <th style={th(TH_PAT_BG)}>Montant</th>
            </tr>
          </thead>
          <tbody>

            {/* ── GAINS ──────────────────────────────────────────── */}
            {gains.map((item:any,idx:number)=>{
              gainRef++;
              return <Row key={item.id||item.code||idx} rub={gainRef} label={item.label}
                base={itemBase(item)} taux={itemTaux(item)} gain={fmt(item.amount)}
                bold={item.code==='SAL_BASE'} zebra={idx%2!==0} />;
            })}

            <TotalRow label="Total Brut" gain={fmtZ(totalBrut)} />

            {/* ── COTISATIONS SOCIALES ───────────────────────────── */}
            {/* CNSS salariale — 2505 */}
            <Row rub={2505} label="CNSS (plafond 1.200.000)"
              base={fmtZ(Math.min(totalBrut,1_200_000))} taux="4,00"
              ret={fmt(cnssSal)} />

            {/* CNSS patronale 3 branches */}
            {cnssEmpPension>0&&(()=>{ patRef+=10; return <Row key="cp" rub={patRef}
              label="CNSS (plafond 1.200.000)"
              base={fmtZ(Math.min(totalBrut,1_200_000))}
              patTaux="8,00" patMt={fmt(cnssEmpPension)} zebra />; })()}
            {cnssEmpFamily>0&&(()=>{ patRef+=10; return <Row key="cf" rub={patRef}
              label="CNSS (plafond 600.000)"
              base={fmtZ(Math.min(totalBrut,600_000))}
              patTaux="10,03" patMt={fmt(cnssEmpFamily)} />; })()}
            {cnssEmpAccident>0&&(()=>{ patRef+=10; return <Row key="ca" rub={patRef}
              label="CNSS (plafond 600.000)"
              base={fmtZ(Math.min(totalBrut,600_000))}
              patTaux="2,25" patMt={fmt(cnssEmpAccident)} zebra />; })()}

            {/* TUS CNSS → cotisation patronale */}
            {tusCnss>0&&(()=>{ patRef+=10; return <Row key="tc" rub={patRef}
              label="Taxe unique sur salaire"
              base={fmtZ(totalBrut)} patTaux="5,475%" patMt={fmt(tusCnss)} />; })()}

            {/* Taxes patronales custom */}
            {ctaxPat.map((item:any)=>{ patRef+=10; return <Row key={item.id||item.code}
              rub={patRef} label={item.label.replace(' (part patronale)','')}
              base={itemBase(item)} patTaux={itemTaux(item)} patMt={fmt(item.amount)} zebra />; })}

            <TotalRow label="Total cotisations" ret={fmtZ(cnssSal)} patMt={fmtZ(totalPat)} />

            {/* ── ITS + TUS DGI + TAXES SALARIÉ + PRÊTS ─────────── */}
            {/* ITS — 4520 */}
            {itsAmount>0&&<Row rub={4520} label="ITS / IRPP Mois"
              base={fmt(itsBase)} taux="Barème" ret={fmt(itsAmount)} />}

            {/* TUS DGI — patronal, affiché après ITS */}
            {tusDgi>0&&<Row rub={4700} label="Taxe unique sur salaire (DGI)"
              base={fmtZ(totalBrut)} patTaux="2,025%" patMt={fmt(tusDgi)} zebra />}

            {/* Taxes custom : CTAX_* salarié + CTAX_EMP_* patronal → une ligne par taxe */}
            {(()=>{
              const taxMap = new Map<string,{emp:any|null,pat:any|null}>();
              ctaxEmp.forEach((i:any)=>{
                const k=i.code.replace(/^CTAX_/,'');
                if(!taxMap.has(k)) taxMap.set(k,{emp:null,pat:null});
                taxMap.get(k)!.emp=i;
              });
              ctaxPat.forEach((i:any)=>{
                const k=i.code.replace(/^CTAX_EMP_/,'');
                if(!taxMap.has(k)) taxMap.set(k,{emp:null,pat:null});
                if(!taxMap.get(k)!.pat) taxMap.get(k)!.pat=i;
              });
              let rub=4600;
              return Array.from(taxMap.entries()).map(([k,{emp,pat}],idx)=>{
                rub++;
                // Rubriques fixes connues
                const fixedRub: Record<string,number> = {TOL:4601,CAMU:4650};
                const r = fixedRub[k] ?? rub;
                const label=emp?.label??pat?.label?.replace(' (part patronale)','')?? k;
                return <Row key={k} rub={r} label={label}
                  base={emp?itemBase(emp):(pat?itemBase(pat):'')}
                  taux={emp?itemTaux(emp):''}
                  ret={emp?fmt(emp.amount):''}
                  patTaux={pat?itemTaux(pat):''}
                  patMt={pat?fmt(pat.amount):''}
                  zebra={idx%2===0} />;
              });
            })()}

            {/* Prêts & Avances */}
            {loanItems.map((item:any)=>{ loanRef++; return <Row key={item.id||item.code}
              rub={loanRef} label={item.label}
              base={itemBase(item)} taux={itemTaux(item)}
              ret={fmt(item.amount)} zebra />; })}

            {/* ── INDEMNITÉS & AVANTAGES ─────────────────────────── */}
            {indems.map((item:any,idx:number)=>{ indemRef+=10; return <Row
              key={item.id||item.code} rub={indemRef} label={item.label}
              base={itemBase(item)} taux={itemTaux(item)}
              gain={fmt(item.amount)} zebra={idx%2!==0} />; })}

          </tbody>
        </table>

        {/* ══ BAS DU BULLETIN ══════════════════════════════════════════════ */}
        <table className="nb" style={{ width:'100%',borderCollapse:'collapse',marginTop:3,tableLayout:'fixed' }}>
          <colgroup>
            <col style={{ width:'14%' }} />{/* Mode règlement label */}
            <col style={{ width:'22%' }} />{/* Banque + N° compte */}
            <col style={{ width:'9%'  }} />{/* Virement */}
            <col style={{ width:'13%' }} />{/* Net à payer label */}
            <col style={{ width:'13%' }} />{/* Net à payer montant */}
            <col style={{ width:'10%' }} />{/* 2ème banque */}
            <col style={{ width:'19%' }} />{/* Droits annuels */}
          </colgroup>
          <tbody>
            <tr>
              <td style={cell({ background:TH_BG,fontWeight:700,textAlign:'center',fontSize:8 })}>
                Mode règlement
              </td>
              <td style={cell({ fontSize:8 })}>
                Banque : <strong>{e.bankName||'—'}</strong>
                {e.bankAccountNumber&&
                  <div style={{ fontSize:7 }}>N° de compte : <strong>{e.bankAccountNumber}</strong></div>}
              </td>
              <td style={cell({ fontSize:8 })}>
                {e.paymentMethod==='BANK_TRANSFER'?'Virement':'Espèces'}
              </td>
              <td style={cell({ background:TH_BG,fontWeight:700,textAlign:'center',fontSize:8 })}>
                Net à payer
              </td>
              <td style={cellR({ fontWeight:900,fontSize:13,fontFamily:FONT,
                background:'#f0f0f0',border:'2px solid #000' })}>
                {fmtZ(netSalary)}
              </td>
              <td style={cellC({ fontSize:7.5 })}>2ème banque</td>
              <td style={cell({ fontSize:7.5 })}>Droits annuels :</td>
            </tr>
          </tbody>
        </table>

        {/* ══ CUMULS + SIGNATURES ══════════════════════════════════════════ */}
        <table style={{ width:'100%',borderCollapse:'collapse',marginTop:0,tableLayout:'fixed' }}>
          <colgroup>
            <col style={{ width:'40%' }} />{/* Signature employé */}
            <col style={{ width:'8%'  }} />{/* Label Cumuls */}
            <col style={{ width:'10%' }} />{/* Brut */}
            <col style={{ width:'10%' }} />{/* Net imposable */}
            <col style={{ width:'8%'  }} />{/* Ch.Sal */}
            <col style={{ width:'8%'  }} />{/* Ch.Pat */}
            <col style={{ width:'8%'  }} />{/* Droits */}
            <col style={{ width:'8%'  }} />{/* Solde */}
          </colgroup>
          <thead>
            <tr>
              <th style={{ border:'none',background:'transparent' }} />
              <th style={th(TH_BG,{ fontSize:7 })}>Cumuls</th>
              <th style={th(TH_BG,{ fontSize:7 })}>Brut</th>
              <th style={th(TH_BG,{ fontSize:7 })}>Net imposable</th>
              <th style={th(TH_BG,{ fontSize:7 })}>Charges Sal</th>
              <th style={th(TH_BG,{ fontSize:7 })}>Charges Pat</th>
              <th style={th(TH_BG,{ fontSize:7 })}>Droits ann.</th>
              <th style={th(TH_BG,{ fontSize:7 })}>Solde</th>
            </tr>
          </thead>
          <tbody>
            {/* Ligne Mois */}
            <tr>
              {/* Signature employé — rowSpan 2 */}
              <td rowSpan={3} style={{ padding:'4px 8px',borderTop:'1px solid #000',verticalAlign:'top' }}>
                <div style={{ fontSize:8,fontWeight:700,textTransform:'uppercase' as const }}>
                  Signature de l'Employé(e)
                </div>
                <div style={{ height:30,borderBottom:'1px solid #000',marginTop:18 }} />
              </td>
              <td style={cell({ fontWeight:700,fontSize:8 })}>Mois</td>
              <td style={cellR({ fontWeight:700,fontSize:8 })}>{fmtZ(totalBrut)}</td>
              <td style={cellR({ fontSize:8 })}>{fmtZ(nv(payroll.grossSalary)-cnssSal)}</td>
              <td style={cellR({ fontSize:8 })}>{fmtD(cnssSal)}</td>
              <td style={cellR({ fontSize:8 })}>{fmtD(totalPat)}</td>
              <td style={cell()} />
              <td style={cell()} />
            </tr>
            {/* Ligne Année */}
            <tr>
              <td style={cell({ fontWeight:700,fontSize:8 })}>Année</td>
              <td style={cellR({ fontWeight:700,fontSize:8 })}>{fmtD(ytd.grossSalary)}</td>
              <td style={cellR({ fontSize:8 })}>{fmtD(ytdNetImp)}</td>
              <td style={cellR({ fontSize:8 })}>{fmtD(ytd.cnssSalarial)}</td>
              <td style={cellR({ fontSize:8 })}>{fmtD(ytd.cnssEmployer)}</td>
              <td style={cell()} />
              <td style={cell()} />
            </tr>
            {/* Signature employeur */}
            <tr>
              <td colSpan={7} style={{ padding:'4px 8px',borderTop:'1px solid #000',verticalAlign:'top' }}>
                <div style={{ display:'flex',justifyContent:'flex-end',gap:40 }}>
                  <div style={{ textAlign:'center' }}>
                    <div style={{ fontSize:7.5,fontWeight:700,textTransform:'uppercase' as const }}>
                      Chef Département
                    </div>
                    <div style={{ height:24,borderBottom:'1px solid #000',width:80,marginTop:14 }} />
                  </div>
                  <div style={{ textAlign:'center' }}>
                    <div style={{ fontSize:7.5,fontWeight:700,textTransform:'uppercase' as const }}>
                      DRH / Direction
                    </div>
                    <div style={{ height:24,borderBottom:'1px solid #000',width:80,marginTop:14 }} />
                  </div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        {/* ══ PIED DE PAGE ════════════════════════════════════════════════ */}
        <div style={{ borderTop:'0.5px solid #999',marginTop:'auto',paddingTop:3,
          display:'flex',justifyContent:'space-between',fontSize:7,color:'#555' }}>
          <span>CNSS sal. 4% · ITS barème 2026 · Parts fiscales maintenues · SMIG 70 400 FCFA · Décret N°78-360</span>
          <span style={{ fontWeight:700,color:'#000' }}>KONZARH</span>
        </div>

      </div>
    </>
  );
}

export default BulletinRendererDefault;