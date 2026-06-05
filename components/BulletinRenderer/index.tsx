'use client';
// ============================================================================
// BulletinRendererDefault v5
// ✅ Style bulletin physique Congo — bordures colonnes UNIQUEMENT (pas lignes)
// ✅ Suppression de "CNSS patronale — Pension + Famille + AT" (résumé inutile)
// ✅ TUS CNSS et TUS DGI affichés l'un après l'autre, tous les 2 patronaux
// ✅ Section signature : Employé(e) à gauche | Employeur à droite
// ✅ A4 PORTRAIT 210mm × 297mm
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

// ── Design : bordures colonnes uniquement ────────────────────────────────────
const FONT    = '"Courier New",Courier,monospace';
const SANS    = 'Arial,Helvetica,sans-serif';
// Seule bordure verticale entre colonnes — pas de ligne horizontale par ligne
const COL_BD  = '0.5px solid #000'; // bordure verticale colonne
const NO_BD   = 'none';

const TH_BG   = '#d0d0d0';

// Cellule standard — SANS bordure horizontale, uniquement bordure gauche/droite
const cell = (e?: React.CSSProperties): React.CSSProperties => ({
  borderLeft: COL_BD,
  borderRight: NO_BD,
  borderTop: NO_BD,
  borderBottom: NO_BD,
  padding: '2px 3px',
  lineHeight: '16px',
  height: '20px',
  fontSize: 9,
  verticalAlign: 'middle',
  color: '#000',
  fontFamily: SANS,
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

// En-tête de colonne — avec bordure complète
const th = (bg=TH_BG, e?: React.CSSProperties): React.CSSProperties => ({
  border: `0.5px solid #000`,
  padding: '3px 4px',
  fontSize: 8,
  fontWeight: 700,
  textAlign: 'center',
  background: bg,
  color: '#000',
  textTransform: 'uppercase' as const,
  fontFamily: SANS,
  ...e,
});

// Ligne de total — fond gris, bordure haut et bas uniquement
const TotalRow = ({ label, gain='', ret='', patMt='' }:
  { label:string; gain?:string; ret?:string; patMt?:string }) => (
  <tr style={{ background: '#e8e8e8', borderTop: '1px solid #000', borderBottom: '1px solid #000' }}>
    <td colSpan={4} style={{ borderTop:'1px solid #000', borderBottom:'1px solid #000', borderLeft:COL_BD, padding:'2px 5px', fontSize:8.5, lineHeight:'14px', fontWeight:900, textTransform:'uppercase' as const, background:'#e8e8e8', color:'#000', fontFamily:SANS, verticalAlign:'middle' }}>
      {label}
    </td>
    <td style={{ borderTop:'1px solid #000', borderBottom:'1px solid #000', borderLeft:COL_BD, padding:'2px 3px', fontSize:9, lineHeight:'14px', fontWeight:900, textAlign:'right', fontFamily:FONT, background:'#e8e8e8', color:'#000', verticalAlign:'middle' }}>{gain}</td>
    <td style={{ borderTop:'1px solid #000', borderBottom:'1px solid #000', borderLeft:COL_BD, padding:'2px 3px', fontSize:9, lineHeight:'14px', fontWeight:900, textAlign:'right', fontFamily:FONT, background:'#e8e8e8', color:'#000', verticalAlign:'middle' }}>{ret}</td>
    <td style={{ borderTop:'1px solid #000', borderBottom:'1px solid #000', borderLeft:COL_BD, background:'#e8e8e8' }} />
    <td style={{ borderTop:'1px solid #000', borderBottom:'1px solid #000', borderLeft:COL_BD, borderRight:COL_BD, padding:'2px 3px', fontSize:9, lineHeight:'14px', fontWeight:900, textAlign:'right', fontFamily:FONT, background:'#e8e8e8', color:'#000', verticalAlign:'middle' }}>{patMt}</td>
  </tr>
);

// Ligne normale — UNIQUEMENT bordures verticales (gauche de chaque colonne)
const Row = ({ rub, label, base='', taux='', gain='', ret='',
               patTaux='', patMt='', bold=false }:
  { rub:number|string; label:string; base?:string; taux?:string;
    gain?:string; ret?:string; patTaux?:string; patMt?:string; bold?:boolean }) => {
  const td: React.CSSProperties = {
    padding: '2px 3px', margin: 0, fontSize: 9, lineHeight: '16px',
    verticalAlign: 'middle', color: '#000', borderLeft: COL_BD,
    borderTop: 'none', borderBottom: 'none', borderRight: 'none',
    whiteSpace: 'nowrap' as const, overflow: 'hidden',
  };
  return (
    <tr style={{ background:'#fff', lineHeight:'16px' }}>
      <td style={{ ...td, textAlign:'center', fontFamily:FONT }}>{rub}</td>
      <td style={{ ...td, paddingLeft:5, fontWeight:bold?700:400, fontFamily:SANS, whiteSpace:'normal' as const }}>{label}</td>
      <td style={{ ...td, textAlign:'right', fontFamily:FONT }}>{base}</td>
      <td style={{ ...td, textAlign:'center', fontFamily:SANS }}>{taux}</td>
      <td style={{ ...td, textAlign:'right', fontFamily:FONT, fontWeight:gain?600:400 }}>{gain}</td>
      <td style={{ ...td, textAlign:'right', fontFamily:FONT, fontWeight:ret?600:400 }}>{ret}</td>
      <td style={{ ...td, textAlign:'center', fontFamily:SANS, fontWeight:patTaux?600:400 }}>{patTaux}</td>
      <td style={{ ...td, textAlign:'right', fontFamily:FONT, fontWeight:patMt?600:400, borderRight:COL_BD }}>{patMt}</td>
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
  const fiscalParts     = nv((payroll as any).irppFiscalParts)||1;
  const cnssEmpPension  = nv(payroll.cnssEmployerPension);
  const cnssEmpFamily   = nv(payroll.cnssEmployerFamily);
  const cnssEmpAccident = nv(payroll.cnssEmployerAccident);
  const tusDgi          = nv((payroll as any).tusDgiAmount);
  const tusCnss         = nv((payroll as any).tusCnssAmount);

  const gains  = gainItems.filter((i:any)=>!['ABS_DEDUCT','ABS_CONGE'].includes(i.code));
  const indems = indemItems;

  // Filtrer les items CTAX — exclure les résumés CNSS patronale et TUS (gérés séparément)
  const CNSS_PAT_SUMMARY_CODES = ['CNSS_PAT_SUMMARY','CNSS_PATRON_SUMMARY'];
  const TUS_CODES = ['TUS_DGI','TUS_CNSS'];

  const ctaxEmp = cotisItems.filter((i:any)=>
    !['CNSS_SAL','CNSS','ITS','IRPP','BNC_SOURCE'].includes(i.code) &&
    !['LOAN','ADVANCE'].includes(i.code) &&
    !CNSS_PAT_SUMMARY_CODES.includes(i.code) &&
    !TUS_CODES.includes(i.code)
  ).concat(retenueItems.filter((i:any)=>!['LOAN','ADVANCE'].includes(i.code)));

  const ctaxPat = ((empItems??[]) as any[]).filter((i:any)=>
    !TUS_CODES.includes(i.code) &&
    !CNSS_PAT_SUMMARY_CODES.includes(i.code)
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
        @media print {
          @page { size: A4 portrait; margin: 8mm; }
          html,body { margin:0!important;padding:0!important;background:#fff!important; }
          .no-print,nav,header,aside,footer,
          [class*="sidebar"],[class*="Sidebar"],
          [class*="navbar"],[class*="Navbar"] { display:none!important; }
          #bul-default {
            width:194mm!important;
            padding:0!important; margin:0!important;
            box-shadow:none!important; border:none!important;
            background:#fff!important;
          }
          .nb { page-break-inside:avoid!important; break-inside:avoid!important; }
          * {
            -webkit-print-color-adjust:exact!important;
            print-color-adjust:exact!important;
            color-adjust:exact!important;
          }
        }
        .main-table, .main-table tr, .main-table td, .main-table th {
          line-height: 16px !important;
        }
        .main-table tbody td {
          padding-top: 2px !important;
          padding-bottom: 2px !important;
          font-size: 9px !important;
          line-height: 16px !important;
        }
        .main-table tbody tr {
          line-height: 16px !important;
        }
      `}</style>

      <div id="bul-default" style={{
        fontFamily: SANS, fontSize: 8, background: '#fff', color: '#000',
        width: '210mm', minHeight: '297mm',
        boxSizing: 'border-box' as const,
        padding: '8px 10px',
        margin: '0 auto',
        boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
        display: 'flex', flexDirection: 'column' as const,
      }}>

        {/* ══ EN-TÊTE : société + salarié côte à côte ══════════════════════ */}
        <table className="nb" style={{ width:'100%', borderCollapse:'collapse', marginBottom:3, border:'1px solid #000' }}>
          <tbody>
            <tr>
              <td style={{ width:'35%', padding:'3px 6px', borderRight:'1px solid #000', fontWeight:900, fontSize:11, textTransform:'uppercase' as const }}>
                {co.tradeName||co.legalName||'—'}
              </td>
              <td style={{ width:'30%', padding:'3px 6px', borderRight:'1px solid #000', fontWeight:900, fontSize:10 }}>
                {fullName||'—'}
              </td>
              <td style={{ width:'15%', padding:'3px 6px', borderRight:'1px solid #000', fontSize:8 }}>
                Affectation : <strong>{deptName||'—'}</strong>
              </td>
              <td style={{ width:'12%', padding:'3px 6px', borderRight:'1px solid #000', fontSize:8 }}>
                Poste : <strong>{e.position||'—'}</strong>
              </td>
              <td rowSpan={3} style={{ width:'8%', padding:'4px 6px', textAlign:'center', verticalAlign:'middle', background:TH_BG }}>
                <div style={{ fontSize:6.5, fontWeight:700, letterSpacing:1.5, textTransform:'uppercase' as const }}>Bulletin de Paie</div>
                <div style={{ fontSize:17, fontWeight:900, fontFamily:FONT, marginTop:2, letterSpacing:1 }}>
                  {monthLabel.slice(0,4).toUpperCase()}
                </div>
                <div style={{ fontSize:11, fontWeight:700, fontFamily:FONT }}>{payroll.year}</div>
              </td>
            </tr>
            <tr style={{ borderTop:'1px solid #000' }}>
              <td style={{ padding:'2px 6px', borderRight:'1px solid #000', fontSize:7.5 }}>
                {[co.address,co.city].filter(Boolean).join(', ')}
                {co.phone&&<span> · Tél : {co.phone}</span>}
              </td>
              <td style={{ padding:'2px 6px', borderRight:'1px solid #000', fontSize:7.5 }}>
                Cat / Ech : <strong>{cat||'—'}</strong>
              </td>
              <td style={{ padding:'2px 6px', borderRight:'1px solid #000', fontSize:7.5 }}>
                Matr. : <strong>{e.employeeNumber||'—'}</strong>
              </td>
              <td style={{ padding:'2px 6px', borderRight:'1px solid #000', fontSize:7.5 }}>
                {e.paymentMethod==='BANK_TRANSFER'?'Virement bancaire':'Espèces'}
              </td>
            </tr>
            <tr style={{ borderTop:'1px solid #000' }}>
              <td style={{ padding:'2px 6px', borderRight:'1px solid #000', fontSize:7.5 }}>
                RCCM : <strong>{co.rccmNumber||'—'}</strong>
                {co.cnssNumber&&<span> · CNSS Emp : <strong>{co.cnssNumber}</strong></span>}
              </td>
              <td colSpan={3} style={{ padding:'2px 6px', fontSize:7.5 }}>
                Conv. : <strong>{co.collectiveAgreement||'—'}</strong>
                {co.nif&&<span> · NIU : <strong>{co.nif}</strong></span>}
              </td>
            </tr>
          </tbody>
        </table>

        {/* ══ INFO SALARIÉ ═════════════════════════════════════════════════ */}
        <table className="nb" style={{ width:'100%', borderCollapse:'collapse', marginBottom:3, border:'1px solid #000' }}>
          <thead>
            <tr>
              {['Date embauche','N° CNSS/CRF','Sit. familiale','Nbr Enfant','Ancienneté','Nbr part IRPP','Type de contrat'].map(h=>(
                <th key={h} style={th(TH_BG,{ fontSize:7, padding:'2px 3px' })}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ ...cellC({ fontSize:8 }), borderLeft:COL_BD, borderBottom:'1px solid #000' }}>{fmtDate(e.hireDate)}</td>
              <td style={{ ...cellC({ fontSize:8 }), borderLeft:COL_BD, borderBottom:'1px solid #000' }}>{e.cnssNumber||'—'}</td>
              <td style={{ ...cellC({ fontSize:8 }), borderLeft:COL_BD, borderBottom:'1px solid #000' }}>{MARITAL[e.maritalStatus??'']||'—'}</td>
              <td style={{ ...cellC({ fontSize:8 }), borderLeft:COL_BD, borderBottom:'1px solid #000' }}>{nv(e.numberOfChildren)||'—'}</td>
              <td style={{ ...cellC({ fontSize:8 }), borderLeft:COL_BD, borderBottom:'1px solid #000' }}>{seniority(e.hireDate)}</td>
              <td style={{ ...cellC({ fontSize:8, fontWeight:700 }), borderLeft:COL_BD, borderBottom:'1px solid #000' }}>{fiscalParts}</td>
              <td style={{ ...cellC({ fontSize:8 }), borderLeft:COL_BD, borderRight:COL_BD, borderBottom:'1px solid #000' }}>{CONTRACT[e.contractType??'']||e.contractType||'—'}</td>
            </tr>
          </tbody>
        </table>

        {/* ══ TABLEAU PRINCIPAL ════════════════════════════════════════════ */}
        {/* Bordure extérieure du tableau : gauche + droite + haut + bas */}
        <div style={{ lineHeight:'1' }}>
        <table className="nb main-table" style={{
          width:'100%', borderCollapse:'collapse', tableLayout:'fixed', flex:1,
          border:'1px solid #000', lineHeight:'16px', fontSize:'9px',
        }}>
          <colgroup>
            <col style={{ width:'5%'  }} />
            <col style={{ width:'24%' }} />
            <col style={{ width:'9%'  }} />
            <col style={{ width:'4%'  }} />
            <col style={{ width:'12%' }} />
            <col style={{ width:'12%' }} />
            <col style={{ width:'5%'  }} />
            <col style={{ width:'12%' }} />
          </colgroup>
          <thead>
            <tr>
              <th rowSpan={2} style={th(TH_BG)}>Rubrique</th>
              <th rowSpan={2} style={th(TH_BG,{ textAlign:'left', paddingLeft:5 })}>Libellé</th>
              <th rowSpan={2} style={th(TH_BG)}>Nbre / Base</th>
              <th rowSpan={2} style={th(TH_BG)}>Taux</th>
              <th colSpan={2} style={th('#b8b8b8',{ fontSize:8.5 })}>Part Salariale</th>
              <th colSpan={2} style={th('#a0a0a0',{ fontSize:8.5 })}>Part Patronale</th>
            </tr>
            <tr>
              <th style={th('#b8b8b8')}>Gains</th>
              <th style={th('#b8b8b8')}>Retenues</th>
              <th style={th('#a0a0a0')}>Taux</th>
              <th style={th('#a0a0a0')}>Montant</th>
            </tr>
          </thead>
          <tbody>

            {/* ── GAINS ─────────────────────────────────────────────── */}
            {gains.map((item:any,idx:number)=>{
              gainRef++;
              return <Row key={item.id||item.code||idx} rub={gainRef} label={item.label}
                base={itemBase(item)} taux={itemTaux(item)} gain={fmt(item.amount)}
                bold={item.code==='SAL_BASE'} />;
            })}

            <TotalRow label="Total Brut" gain={fmtZ(totalBrut)} />

            {/* ── CNSS SALARIALE ────────────────────────────────────── */}
            <Row rub={2505} label="CNSS (plafond 1.200.000)"
              base={fmtZ(Math.min(totalBrut,1_200_000))} taux="4,00"
              ret={fmt(cnssSal)} />

            {/* ── CNSS PATRONALE — 3 lignes séparées, sans résumé ──── */}
            {cnssEmpPension>0&&(()=>{ patRef+=10; return <Row key="cp" rub={patRef}
              label="CNSS Pension (plafond 1.200.000)"
              base={fmtZ(Math.min(totalBrut,1_200_000))}
              patTaux="8,00" patMt={fmt(cnssEmpPension)} />; })()}
            {cnssEmpFamily>0&&(()=>{ patRef+=10; return <Row key="cf" rub={patRef}
              label="CNSS Famille (plafond 600.000)"
              base={fmtZ(Math.min(totalBrut,600_000))}
              patTaux="10,03" patMt={fmt(cnssEmpFamily)} />; })()}
            {cnssEmpAccident>0&&(()=>{ patRef+=10; return <Row key="ca" rub={patRef}
              label="CNSS Accident (plafond 600.000)"
              base={fmtZ(Math.min(totalBrut,600_000))}
              patTaux="2,25" patMt={fmt(cnssEmpAccident)} />; })()}

            {/* ── TUS CNSS puis TUS DGI — tous les 2 patronaux, l'un après l'autre ── */}
            {tusCnss>0&&(()=>{ patRef+=10; return <Row key="tc" rub={patRef}
              label="Taxe unique sur salaire (CNSS)"
              base={fmtZ(totalBrut)} patTaux="5,475%" patMt={fmt(tusCnss)} />; })()}
            {tusDgi>0&&(()=>{ patRef+=10; return <Row key="td" rub={patRef}
              label="Taxe unique sur salaire (DGI)"
              base={fmtZ(totalBrut)} patTaux="2,025%" patMt={fmt(tusDgi)} />; })()}

            {/* ── Autres cotisations patronales ─────────────────────── */}
            {ctaxPat.map((item:any)=>{ patRef+=10; return <Row key={item.id||item.code}
              rub={patRef} label={item.label.replace(' (part patronale)','')}
              base={itemBase(item)} patTaux={itemTaux(item)} patMt={fmt(item.amount)} />; })}

            <TotalRow label="Total cotisations" ret={fmtZ(cnssSal)} patMt={fmtZ(totalPat)} />

            {/* ── ITS ───────────────────────────────────────────────── */}
            {itsAmount>0&&<Row rub={4520} label="ITS / IRPP Mois"
              base={fmt(itsBase)} taux="Barème" ret={fmt(itsAmount)} />}

            {/* ── Cotisations salariales supplémentaires (CTAX) ────── */}
            {(()=>{
              const taxMap = new Map<string,{emp:any|null,pat:any|null}>();
              ctaxEmp.forEach((i:any)=>{
                const k=i.code.replace(/^CTAX_/,'');
                if(!taxMap.has(k)) taxMap.set(k,{emp:null,pat:null});
                taxMap.get(k)!.emp=i;
              });
              let rub=4600;
              return Array.from(taxMap.entries()).map(([k,{emp,pat}],idx)=>{
                rub++;
                const fixedRub: Record<string,number> = {TOL:4601,CAMU:4650};
                const r = fixedRub[k] ?? rub;
                const label=emp?.label??pat?.label?.replace(' (part patronale)','')?? k;
                return <Row key={k} rub={r} label={label}
                  base={emp?itemBase(emp):(pat?itemBase(pat):'')}
                  taux={emp?itemTaux(emp):''}
                  ret={emp?fmt(emp.amount):''}
                  patTaux={pat?itemTaux(pat):''}
                  patMt={pat?fmt(pat.amount):''} />;
              });
            })()}

            {/* ── Prêts / Avances ───────────────────────────────────── */}
            {loanItems.map((item:any)=>{ loanRef++; return <Row key={item.id||item.code}
              rub={loanRef} label={item.label}
              base={itemBase(item)} taux={itemTaux(item)}
              ret={fmt(item.amount)} />; })}

            {/* ── Indemnités ────────────────────────────────────────── */}
            {indems.map((item:any,idx:number)=>{ indemRef+=10; return <Row
              key={item.id||item.code} rub={indemRef} label={item.label}
              base={itemBase(item)} taux={itemTaux(item)}
              gain={fmt(item.amount)} />; })}

          </tbody>
        </table>
        </div>

        {/* ══ BAS DU BULLETIN — Mode règlement + Net à payer ═══════════════ */}
        <table className="nb" style={{ width:'100%', borderCollapse:'collapse', marginTop:3, border:'1px solid #000' }}>
          <tbody>
            <tr>
              <td style={{ width:'15%', padding:'3px 6px', borderRight:'1px solid #000', background:TH_BG, fontWeight:700, textAlign:'center', fontSize:8 }}>
                Mode règlement
              </td>
              <td style={{ width:'22%', padding:'3px 6px', borderRight:'1px solid #000', fontSize:8 }}>
                Banque : <strong>{e.bankName||'—'}</strong>
                {e.bankAccountNumber&&
                  <div style={{ fontSize:7 }}>N° de compte : <strong>{e.bankAccountNumber}</strong></div>}
              </td>
              <td style={{ width:'10%', padding:'3px 6px', borderRight:'1px solid #000', fontSize:8 }}>
                {e.paymentMethod==='BANK_TRANSFER'?'Virement':'Espèces'}
              </td>
              <td style={{ width:'12%', padding:'3px 6px', borderRight:'1px solid #000', background:TH_BG, fontWeight:700, textAlign:'center', fontSize:8 }}>
                Net à payer
              </td>
              <td style={{ width:'15%', padding:'3px 8px', borderRight:'1px solid #000', fontWeight:900, fontSize:13, textAlign:'right', fontFamily:FONT, background:'#f0f0f0' }}>
                {fmtZ(netSalary)}
              </td>
              <td style={{ width:'11%', padding:'3px 6px', borderRight:'1px solid #000', textAlign:'center', fontSize:7.5 }}>
                2ème banque
              </td>
              <td style={{ width:'15%', padding:'3px 6px', fontSize:7.5 }}>
                Droits annuels :
              </td>
            </tr>
          </tbody>
        </table>

        {/* ══ CUMULS + SIGNATURES ══════════════════════════════════════════
            Structure fidèle bulletin physique :
            ┌──────────────────┬───────┬──────────┬───────────────┬───────────┬───────────┬───────────────────────┬────────────────────┐
            │                  │       │          │               │           │           │   Congés annuels      │                    │
            │ Sig. Employé(e)  │CUMULS │  Brut    │ Net imposable │Charges Sal│Charges Pat├────────┬──────┬───────┤  DRH / Direction   │
            │                  │       │          │               │           │           │ Droits │ Pris │ Solde │                    │
            │                  │ Mois  │xxxxxxx   │  xxxxxxx      │  xxxxx    │  xxxxxx   │        │      │       │                    │
            │                  │ Année │xxxxxxx   │  xxxxxxx      │  xxxxx    │  xxxxxx   │        │      │       │                    │
            └──────────────────┴───────┴──────────┴───────────────┴───────────┴───────────┴────────┴──────┴───────┴────────────────────┘
        ════════════════════════════════════════════════════════════════════ */}
        <table style={{ width:'100%', borderCollapse:'collapse', marginTop:2, border:'1px solid #000' }}>
          <colgroup>
            <col style={{ width:'20%' }} /> {/* Signature Employé */}
            <col style={{ width:'5%'  }} /> {/* CUMULS */}
            <col style={{ width:'9%'  }} /> {/* Brut */}
            <col style={{ width:'10%' }} /> {/* Net imposable */}
            <col style={{ width:'8%'  }} /> {/* Charges Sal */}
            <col style={{ width:'8%'  }} /> {/* Charges Pat */}
            <col style={{ width:'6%'  }} /> {/* Droits */}
            <col style={{ width:'5%'  }} /> {/* Pris */}
            <col style={{ width:'6%'  }} /> {/* Solde */}
            <col style={{ width:'23%' }} /> {/* Signature DRH */}
          </colgroup>
          <thead>
            <tr>
              {/* Ligne 1 d'en-tête */}
              <th style={{ border:'none', background:'transparent' }} />
              <th rowSpan={2} style={th(TH_BG,{ fontSize:7, verticalAlign:'middle' })}>Cumuls</th>
              <th rowSpan={2} style={th(TH_BG,{ fontSize:7, verticalAlign:'middle' })}>Brut</th>
              <th rowSpan={2} style={th(TH_BG,{ fontSize:7, verticalAlign:'middle' })}>Net imposable</th>
              <th rowSpan={2} style={th(TH_BG,{ fontSize:7, verticalAlign:'middle' })}>Charges Sal</th>
              <th rowSpan={2} style={th(TH_BG,{ fontSize:7, verticalAlign:'middle' })}>Charges Pat</th>
              <th colSpan={3} style={th(TH_BG,{ fontSize:7 })}>Congés annuels</th>
              <th style={{ border:'none', background:'transparent' }} />
            </tr>
            <tr>
              <th style={{ border:'none', background:'transparent' }} />
              <th style={th(TH_BG,{ fontSize:6.5 })}>Droits</th>
              <th style={th(TH_BG,{ fontSize:6.5 })}>Pris</th>
              <th style={th(TH_BG,{ fontSize:6.5 })}>Solde</th>
              <th style={{ border:'none', background:'transparent' }} />
            </tr>
          </thead>
          <tbody>
            {/* Ligne Mois */}
            <tr>
              <td rowSpan={2} style={{
                padding:'4px 8px',
                borderRight:'1px solid #000',
                verticalAlign:'top',
              }}>
                <div style={{ fontSize:7.5, fontWeight:700, textTransform:'uppercase' as const }}>
                  Signature de l'Employé(e)
                </div>
                <div style={{ height:26, borderBottom:'1px solid #000', marginTop:20 }} />
              </td>
              <td style={cellC({ fontWeight:700, fontSize:8, borderLeft:COL_BD })}>Mois</td>
              <td style={cellR({ fontWeight:700, fontSize:8, borderLeft:COL_BD })}>{fmtZ(totalBrut)}</td>
              <td style={cellR({ fontSize:8, borderLeft:COL_BD })}>{fmtZ(nv(payroll.grossSalary)-cnssSal)}</td>
              <td style={cellR({ fontSize:8, borderLeft:COL_BD })}>{fmtD(cnssSal)}</td>
              <td style={cellR({ fontSize:8, borderLeft:COL_BD })}>{fmtD(totalPat)}</td>
              <td style={cell({ borderLeft:COL_BD })} />
              <td style={cell({ borderLeft:COL_BD })} />
              <td style={cell({ borderLeft:COL_BD })} />
              {/* Signature DRH — rowSpan 2 */}
              <td rowSpan={2} style={{
                padding:'4px 8px',
                borderLeft:'1px solid #000',
                verticalAlign:'top',
                textAlign:'center',
              }}>
                <div style={{ fontSize:7.5, fontWeight:700, textTransform:'uppercase' as const }}>
                  DRH / Direction
                </div>
                <div style={{ height:26, borderBottom:'1px solid #000', marginTop:20, width:'75%', marginLeft:'auto', marginRight:'auto' }} />
              </td>
            </tr>
            {/* Ligne Année */}
            <tr>
              <td style={cellC({ fontWeight:700, fontSize:8, borderLeft:COL_BD, borderTop:'1px solid #000' })}>Année</td>
              <td style={cellR({ fontWeight:700, fontSize:8, borderLeft:COL_BD, borderTop:'1px solid #000' })}>{fmtD(ytd.grossSalary)}</td>
              <td style={cellR({ fontSize:8, borderLeft:COL_BD, borderTop:'1px solid #000' })}>{fmtD(ytdNetImp)}</td>
              <td style={cellR({ fontSize:8, borderLeft:COL_BD, borderTop:'1px solid #000' })}>{fmtD(ytd.cnssSalarial)}</td>
              <td style={cellR({ fontSize:8, borderLeft:COL_BD, borderTop:'1px solid #000' })}>{fmtD(ytd.cnssEmployer)}</td>
              <td style={cell({ borderLeft:COL_BD, borderTop:'1px solid #000' })} />
              <td style={cell({ borderLeft:COL_BD, borderTop:'1px solid #000' })} />
              <td style={cell({ borderLeft:COL_BD, borderTop:'1px solid #000' })} />
            </tr>
          </tbody>
        </table>

        {/* ══ PIED DE PAGE ════════════════════════════════════════════════ */}
        <div style={{
          borderTop:'0.5px solid #999', marginTop:'auto', paddingTop:3,
          display:'flex', justifyContent:'space-between', fontSize:7, color:'#555',
        }}>
          <span>CNSS sal. 4% · ITS barème 2026 · Parts fiscales maintenues · SMIG 70 400 FCFA · Décret N°78-360</span>
          <span style={{ fontWeight:700, color:'#000' }}>KONZARH</span>
        </div>

      </div>
    </>
  );
}

export default BulletinRendererDefault;