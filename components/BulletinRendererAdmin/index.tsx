'use client';

// ============================================================================
// BulletinRendererAdmin v4
// ✅ Toutes les valeurs viennent du back/BDD — zéro recalcul front
// ✅ Parts fiscales : payroll.irppFiscalParts (calculé par FiscalPartsService)
// ✅ Base ITS : grossSalary - cnssSalarial (baseImposable, pas le brut)
// ✅ TOL (CTAX_TOL) inclus dans Total retenues via totalDeductions du back
// ✅ Sous-totaux par section
// ✅ Sections :
//    1 · Rémunérations & Primes     → sous-total = Salaire Brut
//    2 · Cotisations salariales     → CNSS sal. + ITS (sous-total)
//    3 · Indemnités & Avantages     → sous-total
//    4 · Autres cotisations salarié → TOL, CAMU emp., custom employee
//    5 · Charges patronales         → CNSS pat. + TUS + custom employer
//
// ✅ TOTAL COTISATIONS  = CNSS sal. + ITS  (sect. 2)
// ✅ TOTAL RETENUES     = sect.2 + sect.4 (TOL/CAMU) + prêt/avance
// ✅ TOTAL GAINS        = Brut + Indemnités
// ✅ NET = totalDeductions vient du back (pas recalculé)
// ============================================================================

import React, { useMemo } from 'react';
import type { BulletinPayroll, BulletinTemplateConfig, PayrollItem } from '@/types/bulletin-template';
import { getBaseTemplate } from '@/lib/bulletin-templates';
import { classifyItems } from '@/lib/bulletin-items-classifier';

export interface BulletinRendererAdminProps {
  payroll:      BulletinPayroll;
  template?:    BulletinTemplateConfig;
  previewMode?: boolean;
}

const MONTHS   = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
const MARITAL: Record<string,string> = { SINGLE:'Célibataire', MARRIED:'Marié(e)', DIVORCED:'Divorcé(e)', WIDOWED:'Veuf/Veuve', COHABITING:'Concubinage' };
const PAYMENT: Record<string,string> = { BANK_TRANSFER:'Virement bancaire', CASH:'Espèces', MOBILE_MONEY:'Mobile Money', CHECK:'Chèque' };
const CONTRACT: Record<string,string>= { CDI:'CDI', CDD:'CDD', STAGE:'Stage', CONSULTANT:'Consultant', PRESTATAIRE:'Prestataire', INTERIM:'Intérimaire', FREELANCE:'Freelance' };

// ── Utilitaires numériques ───────────────────────────────────────────────────
const toNum = (v: any): number => { const n = Number(v); return isFinite(n) ? n : 0; };
const fmt   = (v: any): string => {
  const n = Math.round(toNum(v));
  if (!isFinite(n) || Math.abs(n) > 999_999_999_999) return '—';
  return n.toLocaleString('fr-FR');
};
const fmtDec = (v: any, d = 1): string => {
  const n = toNum(v);
  return n % 1 === 0 ? String(n) : n.toFixed(d);
};
const formatDate = (d?: string) => d ? new Date(d).toLocaleDateString('fr-FR') : '—';
function seniority(hireDate?: string) {
  if (!hireDate) return '—';
  const h = new Date(hireDate), now = new Date();
  let y = now.getFullYear()-h.getFullYear(), m = now.getMonth()-h.getMonth();
  if (m < 0) { y--; m += 12; }
  return `${y} an${y>1?'s':''} · ${m} mois`;
}

// ── Affichage base / taux items (données du back) ────────────────────────────
function fmtBase(item: any): string {
  if (item.base == null || toNum(item.base) === 0) return '—';
  return Math.round(toNum(item.base)).toLocaleString('fr-FR');
}
function fmtTaux(item: any): string {
  const qty = item.quantity;
  if (qty != null && toNum(qty) !== 0) return String(toNum(qty));
  const r = toNum(item.rate);
  if (!r) return '—';
  if (r === 1) return '—';
  if (r > 1 && r <= 3) return `×${r.toFixed(2).replace('.',',')}`;
  if (r > 0 && r < 1) {
    const pct = r * 100;
    return `${pct % 1 === 0 ? pct.toFixed(0) : pct.toFixed(3).replace(/0+$/,'')}%`;
  }
  return String(r);
}

// ── Couleurs ─────────────────────────────────────────────────────────────────
// N&B print safe : uniquement noir/blanc/gris pour tous les fonds
const PRIMARY  = '#0f2544'; // header entreprise (fond très sombre = noir à l'impression)
const ACCENT   = '#b8860b'; // filet doré (devient gris foncé en N&B — décoratif uniquement)

// ── Styles ───────────────────────────────────────────────────────────────────
const Cs  = (e?: React.CSSProperties): React.CSSProperties => ({ borderBottom:'0.5px solid #bbb', padding:'3.5px 6px', fontSize:9, verticalAlign:'middle', color:'#000', ...e });
const CR  = (e?: React.CSSProperties): React.CSSProperties => ({ ...Cs(), textAlign:'right', fontFamily:'Courier New, monospace', ...e });
const CC  = (e?: React.CSSProperties): React.CSSProperties => ({ ...Cs(), textAlign:'center', ...e });
const TH  = (e?: React.CSSProperties): React.CSSProperties => ({ background:PRIMARY, color:'#fff', fontWeight:700, fontSize:8, textTransform:'uppercase' as const, letterSpacing:'.5px', padding:'6px', textAlign:'center' as const, border:'0.5px solid #000', ...e });
const BD  = '0.5px solid #ddd';

// ── Composants ───────────────────────────────────────────────────────────────
// SectionRow — fond noir, texte blanc : lisible couleur ET N&B (noir sur imprimante)
const SectionRow = ({ num, children }: { num:string; children:React.ReactNode }) => (
  <tr>
    <td colSpan={8} style={{ background:'#000', padding:'4px 8px', fontSize:8, fontWeight:700, textTransform:'uppercase' as const, letterSpacing:'1.5px', color:'#fff', borderTop:'1px solid #000', borderBottom:'1px solid #000' }}>
      {num} · {children}
    </td>
  </tr>
);

// Ligne résumé de section — N&B print safe
// Fond blanc, bordure noire épaisse, texte noir gras → lisible couleur ET N&B
const SummaryRow = ({ label, gainAmt, retAmt, patAmt }: { label:string; gainAmt?:string; retAmt?:string; patAmt?:string }) => (
  <tr style={{ background:'#fff', borderTop:'2.5px solid #000', borderBottom:'2.5px solid #000' }}>
    <td colSpan={4} style={{ padding:'5px 8px', fontSize:9.5, fontWeight:800, color:'#000', border:'0.5px solid #000', textTransform:'uppercase' as const, letterSpacing:'.3px' }}>{label}</td>
    <td style={{ ...CR({ fontWeight:800, fontSize:11, border:'0.5px solid #000' }), color:'#000' }}>{gainAmt ?? ''}</td>
    <td style={{ ...CR({ fontWeight:800, fontSize:11, border:'0.5px solid #000' }), color:'#000' }}>{retAmt  ?? ''}</td>
    <td style={CC({ border:'0.5px solid #000', color:'#000' })} />
    <td style={{ ...CR({ fontWeight:800, fontSize:11, border:'0.5px solid #000' }), color:'#000' }}>{patAmt  ?? ''}</td>
  </tr>
);

// TotalFinalRow — N&B safe : fond blanc, double bordure noire, texte noir
const TotalFinalRow = ({ label, amount, col }: { label:string; amount:string; col:'gain'|'ret'|'pat' }) => {
  const leftCols  = col==='gain' ? 4 : col==='ret' ? 5 : 6;
  const rightCols = col==='gain' ? 4 : col==='ret' ? 3 : 2;
  return (
    <tr style={{ background:'#fff', borderTop:'3px double #000', borderBottom:'3px double #000' }}>
      <td colSpan={leftCols} style={{ padding:'6px 8px', fontSize:10, fontWeight:900, textTransform:'uppercase' as const, color:'#000', border:'1px solid #000', letterSpacing:'.5px' }}>
        {label}
      </td>
      <td colSpan={rightCols} style={{ padding:'6px 8px', textAlign:'right', fontFamily:'Courier New, monospace', fontSize:13, fontWeight:900, color:'#000', border:'1px solid #000' }}>
        {amount}
      </td>
    </tr>
  );
};

const InfoRow = ({ label, value }: { label:string; value:string }) => (
  <div style={{ display:'grid', gridTemplateColumns:'115px 1fr', marginBottom:2 }}>
    <span style={{ fontSize:8.5, color:'#444' }}>{label}</span>
    <span style={{ fontSize:8.5, fontWeight:700, color:'#000' }}>{value}</span>
  </div>
);

// ── Ligne tableau standard ───────────────────────────────────────────────────
const ItemRow = ({ ref_, item, col, zebra }: { ref_:number; item:any; col:'gain'|'ret'|'pat'; zebra:boolean }) => {
  const bg = zebra ? '#fafafa' : '#fff';
  const isGain = col === 'gain';
  const isRet  = col === 'ret';
  const isPat  = col === 'pat';
  return (
    <tr style={{ borderBottom:'0.5px solid #ccc', background:bg }}>
      <td style={CC({ color:'#555', fontSize:8.5, border:BD })}>{ref_}</td>
      <td style={Cs({ border:BD, paddingLeft:8, fontWeight: item.code==='SAL_BASE'?700:400 })}>{item.label}</td>
      <td style={CR({ border:BD })}>{fmtBase(item)}</td>
      <td style={CC({ fontSize:8.5, fontWeight:600, border:BD })}>{fmtTaux(item)}</td>
      {/* Gain salarié */}
      <td style={CR({ fontWeight:700, border:BD, background: isGain?'#fff':'#f5f5f5', color: isGain?'#000':'#bbb' })}>
        {isGain ? fmt(item.amount) : ''}
      </td>
      {/* Retenue salariale */}
      <td style={CR({ fontWeight:700, border:BD, background: isRet?'#fff':'#f5f5f5', color: isRet?'#000':'#bbb' })}>
        {isRet ? fmt(item.amount) : ''}
      </td>
      {/* T.% patronal */}
      <td style={CC({ border:BD, background: isPat?'#f0f0fa':'#f5f5f5', color:'#888', fontSize:8 })}>
        {isPat && item.rate ? fmtTaux(item) : '—'}
      </td>
      {/* Ret. pat. */}
      <td style={CR({ fontWeight:700, border:BD, background: isPat?'#f0f0fa':'#f5f5f5', color: isPat?'#1a1a4a':'#bbb' })}>
        {isPat ? fmt(item.amount) : ''}
      </td>
    </tr>
  );
};

// ── Composant principal ───────────────────────────────────────────────────────
export default function BulletinRendererAdmin({ payroll, template }: BulletinRendererAdminProps) {
  const tpl = template ?? getBaseTemplate('admin');
  const e   = (payroll.employee ?? {}) as any;
  const co  = (payroll.company  ?? {}) as any;
  const items: PayrollItem[] = payroll.items ?? [];
  const ytd = (payroll as any).ytd;

  // ── Classification des items (par le classifier existant) ─────────────────
  const { gainItems, cotisItems, indemItems, retenueItems, empItems } = useMemo(
    () => classifyItems(items), [items]
  );

  // ── Section 2 : Cotisations salariales = CNSS sal. + ITS uniquement ───────
  const cnssItsItems = cotisItems.filter((i:any) =>
    ['CNSS_SAL','CNSS','ITS','IRPP','BNC_SOURCE'].includes(i.code)
  );

  // ── Section 4 : Autres cotisations salarié = CTAX_* (TOL, CAMU, etc.) ─────
  // Tout ce qui est DEDUCTION mais ni CNSS/ITS ni LOAN/ADVANCE
  const autresCotisItems = cotisItems.filter((i:any) =>
    !['CNSS_SAL','CNSS','ITS','IRPP','BNC_SOURCE'].includes(i.code) &&
    i.code !== 'LOAN' && i.code !== 'ADVANCE'
  ).concat(
    retenueItems.filter((i:any) => i.code !== 'LOAN' && i.code !== 'ADVANCE')
  );

  // Prêts & avances — retenues mais pas cotisations
  const loanAdvItems = retenueItems.filter((i:any) => i.code==='LOAN'||i.code==='ADVANCE');

  // Section 5 : Charges patronales = empItems
  const patItems = (empItems ?? []) as any[];

  // ── Valeurs du back (JAMAIS recalculées ici) ─────────────────────────────
  const totalBrut     = toNum(payroll.grossSalary);
  const totalIndem    = indemItems.reduce((s:number,i:any)=>s+toNum(i.amount),0);
  const totalGains    = totalBrut + totalIndem; // addition numérique

  // ITS base = grossSalary - cnssSalarial (baseImposable) — non stocké en BDD, mais calcul évident
  const itsBase       = totalBrut - toNum(payroll.cnssSalarial);

  // Parts fiscales : TOUJOURS depuis le back (irppFiscalParts calculé par FiscalPartsService)
  const fiscalParts   = toNum((payroll as any).irppFiscalParts) || 1;

  // Sous-totaux section 2 (CNSS + ITS)
  const totalCotisSection = toNum(payroll.cnssSalarial) + toNum(payroll.its);

  // Sous-total section 4 (autres cotisations salarié — TOL, CAMU, etc.)
  const totalAutresCotis  = autresCotisItems.reduce((s:number,i:any)=>s+toNum(i.amount),0);

  // Total prêts/avances
  const totalLoanAdv  = loanAdvItems.reduce((s:number,i:any)=>s+toNum(i.amount),0);

  // Total retenues final = totalDeductions du back (fait autorité — CNSS+ITS+taxes+prêts)
  // On utilise payroll.totalDeductions directement
  const totalRetenues = toNum(payroll.totalDeductions);

  // Net : vient du back
  const netSalary = toNum(payroll.netSalary);

  // Charges patronales totaux
  const cnssEmpPension  = toNum(payroll.cnssEmployerPension);
  const cnssEmpFamily   = toNum(payroll.cnssEmployerFamily);
  const cnssEmpAccident = toNum(payroll.cnssEmployerAccident);
  const tusDgi          = toNum((payroll as any).tusDgiAmount);
  const tusCnss         = toNum((payroll as any).tusCnssAmount);
  const totalPat        = cnssEmpPension+cnssEmpFamily+cnssEmpAccident+tusDgi+tusCnss
                          + patItems.filter((i:any)=>!['TUS_DGI','TUS_CNSS'].includes(i.code))
                                    .reduce((s:number,i:any)=>s+toNum(i.amount),0);

  // H.supp
  const rawOT   = toNum(payroll.overtimeHours10)+toNum(payroll.overtimeHours25)+toNum(payroll.overtimeHours50)+toNum(payroll.overtimeHours100);
  const overTime= rawOT>0&&rawOT<=300?rawOT:null;

  const fullName= [e.firstName,e.lastName].filter(Boolean).join(' ');
  const cat     = [e.professionalCategory,e.echelon?`Ech. ${e.echelon}`:null].filter(Boolean).join(' / ');

  let ref1=99,ref2=199,ref3=299,ref4=399,ref5=499;

  // Cumuls
  const ytdNetImp = ytd ? toNum(ytd.grossSalary)-toNum(ytd.cnssSalarial) : null;
  const cumCols = [
    { label:'Sal. brut',  period:payroll.grossSalary,          year:ytd?.grossSalary??null },
    { label:'Ch. sal.',   period:payroll.cnssSalarial,         year:ytd?.cnssSalarial??null },
    { label:'Ch. pat.',   period:payroll.cnssEmployer??0,      year:ytd?.cnssEmployer??null },
    { label:'Avt. nat.',  period:0,                            year:0 },
    { label:'Net impos.', period:itsBase,                      year:ytdNetImp },
    { label:'H. trav.',   period:toNum(payroll.workedDays)*8,  year:ytd?toNum(ytd.workedDays)*8:null },
    { label:'H. suppl.',  period:overTime,                     year:null },
    { label:'Base cong.', period:null,                         year:null },
  ];

  return (
    <>
      <style>{`
        @media print {
          @page { size: A4 portrait; margin: 8mm; }
          html,body { margin:0!important; padding:0!important; background:#fff!important; }
          .no-print,nav,header,aside,footer,[class*="sidebar"],[class*="navbar"] { display:none!important; }
          #bul-admin-root { width:194mm!important; padding:0!important; margin:0!important; box-shadow:none!important; }
          .no-break { page-break-inside:avoid!important; }
          * { -webkit-print-color-adjust:exact!important; print-color-adjust:exact!important; }
        }
      `}</style>

      <div id="bul-admin-root" style={{ fontFamily:'"Segoe UI","Helvetica Neue",Arial,sans-serif', fontSize:10, background:'#fff', color:'#000', width:'210mm', boxSizing:'border-box' as const, padding:'28px 34px', margin:'0 auto' }}>

        {/* ── EN-TÊTE ─────────────────────────────────────────────────────── */}
        <div className="no-break" style={{ background:PRIMARY, color:'#fff', padding:'14px 18px', display:'flex', justifyContent:'space-between', alignItems:'flex-start', borderBottom:'4px solid #000' }}>
          <div style={{ display:'flex', alignItems:'flex-start', gap:12 }}>
            {co.logo
              ? <img src={co.logo} alt="" style={{ width:48, height:48, objectFit:'contain', background:'#fff', borderRadius:4, padding:3 }} />
              : <div style={{ width:48, height:48, background:'#fff', borderRadius:4, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:10, color:PRIMARY }}>{(co.tradeName||co.legalName||'ENT').slice(0,4).toUpperCase()}</div>
            }
            <div>
              <div style={{ fontSize:13, fontWeight:700, letterSpacing:.5 }}>{(co.tradeName||co.legalName||'ENTREPRISE').toUpperCase()}</div>
              {co.address&&<div style={{ fontSize:8, opacity:.75, marginTop:3 }}>{co.address}{co.city?`, ${co.city}`:''}{co.phone?` · ${co.phone}`:''}{co.email?` · ${co.email}`:''}</div>}
              <div style={{ fontSize:8, opacity:.55, marginTop:2 }}>{[co.rccmNumber&&`RCCM : ${co.rccmNumber}`,co.cnssNumber&&`CNSS Emp : ${co.cnssNumber}`,co.nif&&`NIU : ${co.nif}`].filter(Boolean).join(' · ')}</div>
            </div>
          </div>
          <div style={{ textAlign:'right', flexShrink:0 }}>
            <div style={{ fontSize:8, letterSpacing:3, opacity:.55, textTransform:'uppercase' }}>Bulletin de paie</div>
            <div style={{ fontSize:22, fontWeight:700, letterSpacing:2 }}>{MONTHS[(payroll.month??1)-1].toUpperCase()}</div>
            <div style={{ fontSize:12, opacity:.75 }}>{payroll.year}</div>
            <div style={{ marginTop:6, display:'inline-block', background:'rgba(184,134,11,.3)', border:`1px solid ${ACCENT}`, borderRadius:3, padding:'2px 10px', fontSize:8 }}>
              {PAYMENT[e.paymentMethod??'']??'Virement bancaire'}
            </div>
          </div>
        </div>

        {/* ── INFOS SALARIÉ ────────────────────────────────────────────────── */}
        <div className="no-break" style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', border:`1px solid #000`, borderTop:'none', marginBottom:10 }}>
          <div style={{ padding:'10px 12px', borderRight:'1px solid #000' }}>
            <div style={{ fontSize:8.5, fontWeight:700, letterSpacing:2, color:'#444', textTransform:'uppercase', marginBottom:6 }}>Salarié</div>
            <div style={{ fontSize:12, fontWeight:700, marginBottom:2 }}>{fullName||'—'}</div>
            <div style={{ fontSize:9, color:'#333', marginBottom:7 }}>{e.position||'—'}</div>
            <div style={{ display:'flex', gap:5, flexWrap:'wrap' }}>
              {CONTRACT[e.contractType??'']&&<span style={{ background:PRIMARY, color:'#fff', fontSize:8.5, padding:'2px 6px', fontWeight:700 }}>{CONTRACT[e.contractType]}</span>}
              {cat&&<span style={{ background:'#eee', color:'#222', fontSize:8.5, padding:'2px 6px', border:'1px solid #999' }}>{cat}</span>}
              {e.employeeNumber&&<span style={{ background:'#eee', color:'#222', fontSize:8.5, padding:'2px 6px', border:'1px solid #999' }}>Mat. {e.employeeNumber}</span>}
            </div>
          </div>
          <div style={{ padding:'10px 12px', borderRight:'1px solid #000' }}>
            <div style={{ fontSize:8.5, fontWeight:700, letterSpacing:2, color:'#444', textTransform:'uppercase', marginBottom:6 }}>Contrat &amp; Situation</div>
            <InfoRow label="Date d'embauche" value={formatDate(e.hireDate)} />
            <InfoRow label="Ancienneté"       value={seniority(e.hireDate)} />
            <InfoRow label="Etat civil"        value={MARITAL[e.maritalStatus??'']??'—'} />
            {/* Parts : TOUJOURS depuis payroll.irppFiscalParts (back) — jamais recalculé ici */}
            <InfoRow label="Nb. enfants / parts" value={`${toNum(e.numberOfChildren)} / ${fmtDec(fiscalParts)}`} />
            <InfoRow label="N° CNSS salarié"  value={e.cnssNumber||'—'} />
            <InfoRow label="Convention"        value={co.collectiveAgreement||'Commerce'} />
          </div>
          <div style={{ padding:'10px 12px' }}>
            <div style={{ fontSize:8.5, fontWeight:700, letterSpacing:2, color:'#444', textTransform:'uppercase', marginBottom:6 }}>Période de travail</div>
            <InfoRow label="Compte bancaire"  value={e.bankAccount?`…${String(e.bankAccount).slice(-4)}`:'—'} />
            <InfoRow label="Jours ouvrables"  value={`${payroll.workDays??26} j`} />
            <InfoRow label="Jours travaillés" value={payroll.workedDays!=null?`${payroll.workedDays} j`:'—'} />
            {toNum(payroll.absenceDays)>0&&<InfoRow label="Absences" value={`${payroll.absenceDays} j`} />}
            {overTime!=null&&<InfoRow label="Heures suppl." value={`${overTime} h`} />}
            <InfoRow label="Site" value={co.city||co.address||'Administration'} />
          </div>
        </div>

        {/* ── TABLEAU PRINCIPAL ─────────────────────────────────────────────── */}
        <div className="no-break">
          <table style={{ width:'100%', borderCollapse:'collapse', tableLayout:'fixed', border:'1px solid #000' }}>
            <colgroup>
              <col style={{ width:'5.5%'  }} />
              <col style={{ width:'34%'   }} />
              <col style={{ width:'10%'   }} />
              <col style={{ width:'7%'    }} />
              <col style={{ width:'13%'   }} />
              <col style={{ width:'12%'   }} />
              <col style={{ width:'7%'    }} />
              <col style={{ width:'11.5%' }} />
            </colgroup>
            <thead>
              <tr>
                <th style={TH()}>Réf.</th>
                <th style={TH({ textAlign:'left', paddingLeft:8 })}>Désignation</th>
                <th style={TH()}>Base</th>
                <th style={TH()}>Taux</th>
                <th style={TH({ background:'#000' })}>Gain salarié</th>
                <th style={TH({ background:'#000' })}>Retenue sal.</th>
                <th style={TH({ background:'#000' })}>T.%</th>
                <th style={TH({ background:'#000' })}>Ret. pat.</th>
              </tr>
            </thead>
            <tbody>

              {/* ══ 1 · GAINS & PRIMES ═══════════════════════════════════════ */}
              <SectionRow num="1">Rémunérations &amp; Primes</SectionRow>

              {gainItems.filter((i:any)=>i.code!=='ABS_DEDUCT'&&i.code!=='ABS_CONGE').map((item:any) => {
                ref1++;
                return <ItemRow key={item.id||item.code} ref_={ref1} item={item} col="gain" zebra={ref1%2===0} />;
              })}

              {/* Sous-total section 1 = Salaire Brut */}
              <tr style={{ background:'#f0f0f0', borderTop:'2.5px solid #000', borderBottom:'2.5px solid #000' }}>
                <td colSpan={8} style={{ padding:'6px 10px', fontSize:11, fontWeight:900, textTransform:'uppercase', color:'#000', border:'0.5px solid #888', textAlign:'center', letterSpacing:1.5 }}>
                  Salaire brut &nbsp;—&nbsp; {fmt(totalBrut)} F
                </td>
              </tr>

              {/* ══ 2 · COTISATIONS SALARIALES (CNSS + ITS) ═════════════════ */}
              <SectionRow num="2">Cotisations salariales</SectionRow>

              {/* Ligne CNSS salariale */}
              {(() => {
                ref2++;
                const cnssAmt = toNum(payroll.cnssSalarial);
                return cnssAmt > 0 ? (
                  <tr key="cnss_sal" style={{ borderBottom:'0.5px solid #ccc', background: ref2%2===0?'#f8f8f8':'#fff' }}>
                    <td style={CC({ color:'#555', fontSize:8.5, border:BD })}>{ref2}</td>
                    <td style={Cs({ border:BD, paddingLeft:8 })}>Cotisation CNSS</td>
                    <td style={CR({ border:BD })}>{fmt(payroll.grossSalary)}</td>
                    <td style={CC({ fontWeight:600, fontSize:8.5, border:BD })}>4,000%</td>
                    <td style={CR({ border:BD, background:'#f5f5f5', color:'#bbb' })} />
                    <td style={CR({ fontWeight:700, border:BD })}>{fmt(cnssAmt)}</td>
                    <td style={CC({ border:BD, background:'#f8f8f8', color:'#aaa' })}>—</td>
                    <td style={CR({ border:BD, background:'#f8f8f8', color:'#bbb' })} />
                  </tr>
                ) : null;
              })()}

              {/* Ligne ITS — base = grossSalary - cnssSalarial (baseImposable) */}
              {(() => {
                ref2++;
                const itsAmt = toNum(payroll.its);
                return itsAmt > 0 ? (
                  <tr key="its" style={{ borderBottom:'0.5px solid #ccc', background: ref2%2===0?'#f8f8f8':'#fff' }}>
                    <td style={CC({ color:'#555', fontSize:8.5, border:BD })}>{ref2}</td>
                    <td style={Cs({ border:BD, paddingLeft:8 })}>ITS — Barème progressif</td>
                    {/* Base ITS = brut - CNSS (baseImposable) — pas le brut ! */}
                    <td style={CR({ border:BD })}>{fmt(itsBase)}</td>
                    <td style={CC({ fontWeight:600, fontSize:8.5, border:BD })}>Barème</td>
                    <td style={CR({ border:BD, background:'#f5f5f5', color:'#bbb' })} />
                    <td style={CR({ fontWeight:700, border:BD })}>{fmt(itsAmt)}</td>
                    <td style={CC({ border:BD, background:'#f8f8f8', color:'#aaa' })}>—</td>
                    <td style={CR({ border:BD, background:'#f8f8f8', color:'#bbb' })} />
                  </tr>
                ) : null;
              })()}

              {/* Autres items cotis éventuels depuis classifier (BNC, etc.) */}
              {cnssItsItems.filter((i:any)=>!['CNSS_SAL','CNSS','ITS','IRPP'].includes(i.code)).map((item:any) => {
                ref2++;
                return <ItemRow key={item.id||item.code} ref_={ref2} item={item} col="ret" zebra={ref2%2===0} />;
              })}

              {/* Sous-total section 2 */}
              <SummaryRow label="Total cotisations salariales" retAmt={fmt(totalCotisSection)} />

              {/* ══ 3 · INDEMNITÉS & AVANTAGES ══════════════════════════════ */}
              {indemItems.length > 0 && <>
                <SectionRow num="3">Indemnités &amp; Avantages</SectionRow>
                {indemItems.map((item:any) => {
                  ref3++;
                  return <ItemRow key={item.id||item.code} ref_={ref3} item={item} col="gain" zebra={ref3%2===0} />;
                })}
                <SummaryRow label="Total indemnités" gainAmt={fmt(totalIndem)} />
              </>}

              {/* ══ 4 · AUTRES COTISATIONS SALARIÉ (TOL, CAMU, etc.) ════════ */}
              {autresCotisItems.length > 0 && <>
                <SectionRow num="4">Autres cotisations salarié</SectionRow>
                {autresCotisItems.map((item:any) => {
                  ref4++;
                  return <ItemRow key={item.id||item.code} ref_={ref4} item={item} col="ret" zebra={ref4%2===0} />;
                })}
                <SummaryRow label="Total autres cotisations" retAmt={fmt(totalAutresCotis)} />
              </>}

              {/* Prêts & avances — dans retenues, pas dans cotisations */}
              {loanAdvItems.length > 0 && <>
                {loanAdvItems.map((item:any) => {
                  ref4++;
                  const isLoan = item.code === 'LOAN';
                  return (
                    <tr key={item.id||item.code} style={{ borderBottom:'0.5px solid #ccc', background: ref4%2===0?'#fdf5ec':'#fff' }}>
                      <td style={CC({ color:'#555', fontSize:8.5, border:BD })}>{ref4}</td>
                      <td style={Cs({ border:BD, paddingLeft:8, fontStyle:'italic', color:'#555' })}>{item.label} {isLoan?'(non cotisable)':'(non cotisable)'}</td>
                      <td style={CR({ border:BD })}>—</td>
                      <td style={CC({ border:BD })}>—</td>
                      <td style={CR({ border:BD, background:'#f5f5f5', color:'#bbb' })} />
                      <td style={CR({ fontWeight:700, border:BD, color:'#8b4000' })}>{fmt(item.amount)}</td>
                      <td style={CC({ border:BD, background:'#f8f8f8', color:'#aaa' })}>—</td>
                      <td style={CR({ border:BD, background:'#f8f8f8', color:'#bbb' })} />
                    </tr>
                  );
                })}
              </>}

              {/* ══ 5 · CHARGES PATRONALES ══════════════════════════════════ */}
              <SectionRow num="5">Charges patronales</SectionRow>

              {/* CNSS Patronale — 3 branches fixes, valeurs du back */}
              {[
                { key:'pen', label:'CNSS Pension vieillesse',    taux:'8%',     amt:cnssEmpPension  },
                { key:'fam', label:'CNSS Prestations familiales',taux:'10,03%', amt:cnssEmpFamily   },
                { key:'at',  label:'CNSS Accidents du travail',  taux:'2,25%',  amt:cnssEmpAccident },
                { key:'tdgi',label:'TUS Part DGI',               taux:'2,025%', amt:tusDgi          },
                { key:'tcnss',label:'TUS Part CNSS',             taux:'5,475%', amt:tusCnss         },
              ].filter(r=>r.amt>0).map(r => {
                ref5++;
                return (
                  <tr key={r.key} style={{ borderBottom:'0.5px solid #ccc', background:'#f8f8f8' }}>
                    <td style={CC({ color:'#555', fontSize:8.5, border:BD })}>{ref5}</td>
                    <td style={Cs({ border:BD, paddingLeft:8 })}>{r.label}</td>
                    <td style={CR({ border:BD })}>{fmt(payroll.grossSalary)}</td>
                    <td style={CC({ fontWeight:600, fontSize:8.5, border:BD })}>{r.taux}</td>
                    <td style={CR({ border:BD, background:'#f5f5f5', color:'#bbb' })} />
                    <td style={CR({ border:BD, background:'#f5f5f5', color:'#bbb' })} />
                    <td style={CC({ fontWeight:700, fontSize:8.5, border:BD })}>{r.taux}</td>
                    <td style={CR({ fontWeight:700, border:BD, color:'#1a1a4a' })}>{fmt(r.amt)}</td>
                  </tr>
                );
              })}

              {/* Taxes patronales custom (CAMU pat., etc.) */}
              {patItems.filter((i:any)=>!['TUS_DGI','TUS_CNSS'].includes(i.code)).map((item:any) => {
                ref5++;
                return (
                  <tr key={item.id||item.code} style={{ borderBottom:'0.5px solid #ccc', background:'#f8f8f8' }}>
                    <td style={CC({ color:'#555', fontSize:8.5, border:BD })}>{ref5}</td>
                    <td style={Cs({ border:BD, paddingLeft:8 })}>{item.label}</td>
                    <td style={CR({ border:BD })}>{fmtBase(item)}</td>
                    <td style={CC({ fontSize:8.5, border:BD })}>{fmtTaux(item)}</td>
                    <td style={CR({ border:BD, background:'#f5f5f5', color:'#bbb' })} />
                    <td style={CR({ border:BD, background:'#f5f5f5', color:'#bbb' })} />
                    <td style={CC({ border:BD })}>—</td>
                    <td style={CR({ fontWeight:700, border:BD, color:'#1a1a4a' })}>{fmt(item.amount)}</td>
                  </tr>
                );
              })}

              <SummaryRow label="Total charges patronales" patAmt={fmt(totalPat)} />

              {/* ══ TOTAUX FINAUX ════════════════════════════════════════════ */}
              {/* Total Gains = Brut + Indemnités */}
              <TotalFinalRow label="Total Gains" amount={fmt(totalGains)} col="gain" />

              {/* Total Retenues = totalDeductions du back (CNSS+ITS+taxes+prêts) */}
              <TotalFinalRow label="Total retenues" amount={fmt(totalRetenues)} col="ret" />

            </tbody>
          </table>
        </div>

        {/* ── CUMULS + NET À PAYER ──────────────────────────────────────────── */}
        <div className="no-break" style={{ marginTop:8 }}>
          <div style={{ display:'flex', alignItems:'stretch', border:`1px solid #000`, borderTop:`2px solid ${PRIMARY}` }}>
            <table style={{ flex:1, borderCollapse:'collapse' }}>
              <thead>
                <tr style={{ background:'#000' }}>
                  <th style={{ padding:'4px 8px', fontSize:8, color:'#fff', fontWeight:700, width:52, border:'0.5px solid #000', textAlign:'left' }} />
                  {cumCols.map(c=>(
                    <th key={c.label} style={{ padding:'4px 5px', fontSize:8.5, fontWeight:700, color:'#fff', textAlign:'center', whiteSpace:'nowrap', border:'0.5px solid #000' }}>{c.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[['Période', cumCols.map(c=>c.period)],['Année', cumCols.map(c=>c.year)]].map(([lbl,vals]:any)=>(
                  <tr key={lbl}>
                    <td style={{ padding:'4px 8px', fontSize:8, fontWeight:700, background:'#eee', color:'#000', border:'0.5px solid #000' }}>{lbl}</td>
                    {vals.map((v:any,i:number)=>(
                      <td key={i} style={{ padding:'4px 5px', textAlign:'center', fontFamily:'Courier New, monospace', fontSize:8.5, fontWeight:600, color:'#000', border:'0.5px solid #999' }}>
                        {v!=null?fmt(v):'—'}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ background:PRIMARY, color:'#fff', display:'flex', flexDirection:'column', justifyContent:'center', alignItems:'center', minWidth:130, padding:'10px 16px', flexShrink:0, borderLeft:`4px solid ${ACCENT}` }}>
              <div style={{ fontSize:8.5, fontWeight:700, textTransform:'uppercase', letterSpacing:2, opacity:.65, marginBottom:4 }}>Net à payer</div>
              <div style={{ fontSize:20, fontWeight:700, fontFamily:'Courier New, monospace', letterSpacing:1 }}>{fmt(netSalary)}</div>
              <div style={{ fontSize:8, opacity:.55, marginTop:2, letterSpacing:1 }}>FCFA</div>
            </div>
          </div>
        </div>

        {/* ── SIGNATURES ───────────────────────────────────────────────────── */}
        <div className="no-break" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:24, padding:'12px 0 8px', borderTop:`1px solid #bbb`, marginTop:10 }}>
          {[{label:"Signature de l'Employé(e)",sub:'Lu et approuvé'},{label:"Signature et cachet de l'Employeur",sub:'Cachet & signature obligatoire'}].map(s=>(
            <div key={s.label} style={{ textAlign:'center' }}>
              <div style={{ fontSize:9, fontWeight:700, color:'#000', marginBottom:8, textTransform:'uppercase', letterSpacing:.5 }}>{s.label}</div>
              <div style={{ height:44, borderBottom:`1.5px solid #000` }} />
              <div style={{ fontSize:8.5, color:'#333', marginTop:4 }}>{s.sub}</div>
            </div>
          ))}
        </div>

        {/* ── PIED DE PAGE ─────────────────────────────────────────────────── */}
        <div style={{ borderTop:'2px solid #000', padding:'6px 0', marginTop:6, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div style={{ fontSize:8.5, color:'#444' }}>Code du Travail · CNSS 4% sal. · ITS barème 2026 · Parts fiscales maintenues · SMIG 70 400 FCFA</div>
          <div style={{ fontSize:8.5, fontWeight:700, color:'#000', letterSpacing:1 }}>KONZARH</div>
        </div>
      </div>
    </>
  );
}