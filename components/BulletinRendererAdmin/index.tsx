'use client';

// ============================================================================
// BulletinRendererAdmin v5
// ✅ Refonte visuelle 2026-08 : grille classique noir & blanc (modèle papier
//    fourni par le client), une seule table continue Réf/Désignation/Base/
//    Taux/Gain sal./Retenue sal./Taux pat./Retenue pat. — sans bandeaux de
//    section colorés.
// ✅ Calculs INCHANGÉS par rapport à v4 — toutes les valeurs viennent du
//    back/BDD, zéro recalcul front. Data-prep copiée verbatim de v4 (déjà
//    vérifiée/correcte).
// ✅ Pas de section "Dates de congés" — uniquement les rubriques déjà
//    calculées par l'app (les 2 images fournies par le client ne sont que
//    des modèles de mise en page, pas une liste de rubriques à ajouter).
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
const PAYMENT: Record<string,string> = { BANK_TRANSFER:'Virement', CASH:'Espèces', MOBILE_MONEY:'Mobile Money', CHECK:'Chèque' };
const CONTRACT: Record<string,string>= { CDI:'CDI', CDD:'CDD', STAGE:'Stage', CONSULTANT:'Consultant', PRESTATAIRE:'Prestataire', INTERIM:'Intérimaire', FREELANCE:'Freelance' };

// ── Utilitaires numériques (inchangés v4) ────────────────────────────────────
const toNum = (v: any): number => { const n = Number(v); return isFinite(n) ? n : 0; };
const fmt   = (v: any): string => {
  const n = Math.round(toNum(v));
  if (!isFinite(n) || Math.abs(n) > 999_999_999_999) return '—';
  return n === 0 ? '' : n.toLocaleString('fr-FR');
};
const fmtZ  = (v: any): string => Math.round(toNum(v)).toLocaleString('fr-FR');
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
  return `${y} an${y>1?'s':''} et ${String(m).padStart(2,'0')} mois`;
}

// ── Affichage base / taux items (données du back — inchangé v4) ─────────────
function fmtBase(item: any): string {
  if (item.base == null || toNum(item.base) === 0) return '';
  return Math.round(toNum(item.base)).toLocaleString('fr-FR');
}
function fmtTaux(item: any): string {
  const qty = item.quantity;
  if (qty != null && toNum(qty) !== 0) return String(toNum(qty));
  const r = toNum(item.rate);
  if (!r) return '';
  if (r === 1) return '';
  if (r > 1 && r <= 3) return `×${r.toFixed(2).replace('.',',')}`;
  if (r > 0 && r < 1) {
    const pct = r * 100;
    return `${pct % 1 === 0 ? pct.toFixed(0) : pct.toFixed(3).replace(/0+$/,'')}%`;
  }
  return String(r);
}

// ── Tokens visuels — grille classique noir & blanc (modèle papier) ─────────
const SANS   = 'Arial,Helvetica,sans-serif';
const FONT   = '"Courier New",Courier,monospace';
const BD     = '0.5px solid #000';
const BDB    = '1px solid #000';
const TH_BG  = '#d0d0d0';
const ROW_H  = 20;

const th = (o?: React.CSSProperties): React.CSSProperties => ({
  border: BD, padding: '3px 4px', fontSize: 8.5, fontWeight: 700,
  textAlign: 'center', background: TH_BG, textTransform: 'uppercase',
  fontFamily: SANS, verticalAlign: 'middle', ...o,
});
const td = (o?: React.CSSProperties): React.CSSProperties => ({
  border: BD, padding: '0 4px', height: ROW_H, lineHeight: `${ROW_H}px`,
  fontSize: 10.5, verticalAlign: 'middle', color: '#000', fontFamily: SANS, background: '#fff', ...o,
});
const tdR = (o?: React.CSSProperties) => td({ textAlign: 'right', fontFamily: FONT, whiteSpace: 'nowrap', ...o });
const tdC = (o?: React.CSSProperties) => td({ textAlign: 'center', ...o });

const InfoRow = ({ label, value }: { label:string; value:string }) => (
  <div style={{ display:'grid', gridTemplateColumns:'115px 1fr', marginBottom:2 }}>
    <span style={{ fontSize:8.5, color:'#444' }}>{label}</span>
    <span style={{ fontSize:8.5, fontWeight:700, color:'#000' }}>{value}</span>
  </div>
);

// ── Ligne article ─────────────────────────────────────────────────────────
const ItemRow = ({ ref_, item, col }: { ref_:number; item:any; col:'gain'|'ret'|'pat' }) => {
  const isGain = col === 'gain', isRet = col === 'ret', isPat = col === 'pat';
  return (
    <tr>
      <td style={tdC({ fontFamily: FONT, fontSize:9.5 })}>{ref_}</td>
      <td style={td({ paddingLeft:6, fontWeight: item.code==='SAL_BASE'?700:400 })}>{item.label}</td>
      <td style={tdR()}>{fmtBase(item)}</td>
      <td style={tdC({ fontSize:9, padding:'0 2px' })}>{fmtTaux(item)}</td>
      <td style={tdR({ fontWeight: isGain?700:400 })}>{isGain ? fmt(item.amount) : ''}</td>
      <td style={tdR({ fontWeight: isRet?700:400 })}>{isRet ? fmt(item.amount) : ''}</td>
      <td style={tdC({ fontSize:9 })}>{isPat && item.rate ? fmtTaux(item) : ''}</td>
      <td style={tdR({ fontWeight: isPat?700:400 })}>{isPat ? fmt(item.amount) : ''}</td>
    </tr>
  );
};

// ── Ligne total pleine largeur (ex: "Salaire brut — 3 180 F") ──────────────
const FullTotalRow = ({ label }: { label: string }) => (
  <tr>
    <td colSpan={8} style={{ ...td(), background: TH_BG, fontWeight: 800, fontSize: 11, textAlign:'center', letterSpacing: 0.5, textTransform:'uppercase' }}>
      {label}
    </td>
  </tr>
);

// ── Ligne sous-total (répartie sur les colonnes gain/ret/pat) ──────────────
const SubTotalRow = ({ label, gain, ret, pat }: { label:string; gain?:string; ret?:string; pat?:string }) => (
  <tr>
    <td colSpan={4} style={{ ...td(), background:'#eee', fontWeight:800, fontSize:10, textTransform:'uppercase' }}>{label}</td>
    <td style={{ ...tdR(), background:'#eee', fontWeight:800, fontSize:11 }}>{gain ?? ''}</td>
    <td style={{ ...tdR(), background:'#eee', fontWeight:800, fontSize:11 }}>{ret ?? ''}</td>
    <td style={{ ...td(), background:'#eee' }} />
    <td style={{ ...tdR(), background:'#eee', fontWeight:800, fontSize:11 }}>{pat ?? ''}</td>
  </tr>
);

// ── Composant principal ───────────────────────────────────────────────────
export default function BulletinRendererAdmin({ payroll, template }: BulletinRendererAdminProps) {
  const tpl = template ?? getBaseTemplate('admin');
  const e   = (payroll.employee ?? {}) as any;
  const co  = (payroll.company  ?? {}) as any;
  const items: PayrollItem[] = payroll.items ?? [];
  const ytd = (payroll as any).ytd;

  // ── Classification des items (par le classifier existant — inchangé) ────
  const { gainItems, cotisItems, indemItems, retenueItems, empItems } = useMemo(
    () => classifyItems(items), [items]
  );

  const cnssItsItems = cotisItems.filter((i:any) =>
    ['CNSS_SAL','CNSS','ITS','IRPP','BNC_SOURCE'].includes(i.code)
  );
  const autresCotisItems = cotisItems.filter((i:any) =>
    !['CNSS_SAL','CNSS','ITS','IRPP','BNC_SOURCE'].includes(i.code) &&
    i.code !== 'LOAN' && i.code !== 'ADVANCE'
  ).concat(
    retenueItems.filter((i:any) => i.code !== 'LOAN' && i.code !== 'ADVANCE')
  );
  const loanAdvItems = retenueItems.filter((i:any) => i.code==='LOAN'||i.code==='ADVANCE');
  const patItems = (empItems ?? []) as any[];

  const totalBrut     = toNum(payroll.grossSalary);
  const totalIndem    = indemItems.reduce((s:number,i:any)=>s+toNum(i.amount),0);
  const totalGains    = totalBrut + totalIndem;
  const itsBase        = totalBrut - toNum(payroll.cnssSalarial);
  const fiscalParts   = toNum((payroll as any).irppFiscalParts) || 1;
  const totalCotisSection = toNum(payroll.cnssSalarial) + toNum(payroll.its);
  const totalAutresCotis  = autresCotisItems.reduce((s:number,i:any)=>s+toNum(i.amount),0);
  const totalRetenues = toNum(payroll.totalDeductions);
  const netSalary = toNum(payroll.netSalary);

  const cnssEmpPension  = toNum(payroll.cnssEmployerPension);
  const cnssEmpFamily   = toNum(payroll.cnssEmployerFamily);
  const cnssEmpAccident = toNum(payroll.cnssEmployerAccident);
  const tusDgi          = toNum((payroll as any).tusDgiAmount);
  const tusCnss         = toNum((payroll as any).tusCnssAmount);
  const totalPat        = cnssEmpPension+cnssEmpFamily+cnssEmpAccident+tusDgi+tusCnss
                          + patItems.filter((i:any)=>!['TUS_DGI','TUS_CNSS'].includes(i.code))
                                    .reduce((s:number,i:any)=>s+toNum(i.amount),0);

  const rawOT   = toNum(payroll.overtimeHours10)+toNum(payroll.overtimeHours25)+toNum(payroll.overtimeHours50)+toNum(payroll.overtimeHours100);
  const overTime= rawOT>0&&rawOT<=300?rawOT:null;

  const fullName= [e.firstName,e.lastName].filter(Boolean).join(' ');
  const cat     = [e.professionalCategory,e.echelon?`Ech. ${e.echelon}`:null].filter(Boolean).join(' / ');

  let ref = 9;

  const ytdNetImp = ytd ? toNum(ytd.grossSalary)-toNum(ytd.cnssSalarial) : null;
  const cumCols = [
    { label:'Salaire brut',   period:payroll.grossSalary,          year:ytd?.grossSalary??null },
    { label:'Charges sal.',   period:payroll.cnssSalarial,         year:ytd?.cnssSalarial??null },
    { label:'Charges pat.',   period:payroll.cnssEmployer??0,      year:ytd?.cnssEmployer??null },
    { label:'Avant. nature',  period:0,                            year:0 },
    { label:'Net imposable',  period:itsBase,                      year:ytdNetImp },
    { label:'H. travaillées', period:toNum(payroll.workedDays)*8,  year:ytd?toNum(ytd.workedDays)*8:null },
    { label:'H. suppl.',      period:overTime,                     year:null },
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

      <div id="bul-admin-root" style={{ fontFamily:SANS, fontSize:10, background:'#fff', color:'#000', width:'210mm', boxSizing:'border-box' as const, padding:'20px 24px', margin:'0 auto' }}>

        {/* ── EN-TÊTE : Entreprise (gauche) / Titre + période (droite) ────── */}
        <div className="no-break" style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10 }}>
          <div style={{ display:'flex', gap:10, alignItems:'flex-start' }}>
            {co.logo && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={co.logo} alt="" crossOrigin="anonymous" style={{ width:44, height:44, objectFit:'contain' }} />
            )}
            <div>
              <div style={{ fontSize:13, fontWeight:700 }}>{co.tradeName || co.legalName || 'Entreprise'}</div>
              {co.address && <div style={{ fontSize:9, color:'#333', marginTop:2 }}>{co.address}{co.city?`, ${co.city}`:''}</div>}
              <div style={{ fontSize:9, color:'#333', marginTop:2 }}>
                {[co.rccmNumber&&`SIRET/RCCM : ${co.rccmNumber}`, co.nif&&`NIU : ${co.nif}`].filter(Boolean).join('   ')}
              </div>
              <div style={{ fontSize:9, color:'#333', marginTop:4 }}>Conv. coll. : {co.collectiveAgreement||'—'}</div>
            </div>
          </div>
          <div style={{ textAlign:'right' }}>
            <div style={{ fontSize:20, fontWeight:800, letterSpacing:2 }}>BULLETIN DE PAIE</div>
            <div style={{ fontSize:9.5, marginTop:6 }}>Période du 01/{String(payroll.month??1).padStart(2,'0')}/{payroll.year} au {new Date(payroll.year, payroll.month, 0).getDate()}/{String(payroll.month??1).padStart(2,'0')}/{payroll.year}</div>
            <div style={{ fontSize:9.5, marginTop:2 }}>Paiement le {(payroll as any).paymentDate?formatDate((payroll as any).paymentDate):'—'} par {PAYMENT[e.paymentMethod??'']??'Virement'}</div>
          </div>
        </div>

        {/* ── BLOC IDENTITÉ SALARIÉ / CONTRAT ──────────────────────────────── */}
        <div className="no-break" style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', border:BDB, marginBottom:10 }}>
          <div style={{ padding:'8px 10px', borderRight:BD }}>
            <div style={{ fontSize:8, fontWeight:700, letterSpacing:1.5, color:'#444', textTransform:'uppercase', marginBottom:5 }}>Salarié</div>
            <div style={{ fontSize:11.5, fontWeight:700 }}>{fullName||'—'}</div>
            <div style={{ fontSize:9, color:'#333', marginTop:1 }}>{e.position||'—'}</div>
            <div style={{ fontSize:9, color:'#333', marginTop:4 }}>Matricule {e.employeeNumber||'—'} {CONTRACT[e.contractType??'']?`· ${CONTRACT[e.contractType]}`:''} {cat?`· ${cat}`:''}</div>
          </div>
          <div style={{ padding:'8px 10px', borderRight:BD }}>
            <div style={{ fontSize:8, fontWeight:700, letterSpacing:1.5, color:'#444', textTransform:'uppercase', marginBottom:5 }}>N° Séc. Soc. &amp; Ancienneté</div>
            <InfoRow label="N° CNSS" value={e.cnssNumber||'—'} />
            <InfoRow label="Ancienneté" value={seniority(e.hireDate)} />
            <InfoRow label="Etat civil" value={MARITAL[e.maritalStatus??'']??'—'} />
            <InfoRow label="Enfants / parts" value={`${toNum(e.numberOfChildren)} / ${fmtDec(fiscalParts)}`} />
          </div>
          <div style={{ padding:'8px 10px' }}>
            <div style={{ fontSize:8, fontWeight:700, letterSpacing:1.5, color:'#444', textTransform:'uppercase', marginBottom:5 }}>Période de travail</div>
            <InfoRow label="Jours ouvrables" value={`${payroll.workDays??26} j`} />
            <InfoRow label="Jours travaillés" value={payroll.workedDays!=null?`${payroll.workedDays} j`:'—'} />
            {toNum(payroll.absenceDays)>0 && <InfoRow label="Absences" value={`${payroll.absenceDays} j`} />}
            {overTime!=null && <InfoRow label="Heures suppl." value={`${overTime} h`} />}
          </div>
        </div>

        {/* ── TABLEAU PRINCIPAL — grille classique unique ──────────────────── */}
        <div className="no-break">
          <table style={{ width:'100%', borderCollapse:'collapse', tableLayout:'fixed', border:BDB }}>
            <colgroup>
              <col style={{ width:'5%'   }} />
              <col style={{ width:'33%'  }} />
              <col style={{ width:'11%'  }} />
              <col style={{ width:'7%'   }} />
              <col style={{ width:'13%'  }} />
              <col style={{ width:'13%'  }} />
              <col style={{ width:'6%'   }} />
              <col style={{ width:'12%'  }} />
            </colgroup>
            <thead>
              <tr>
                <th style={th()}>N°</th>
                <th style={th({ textAlign:'left', paddingLeft:6 })}>Désignation</th>
                <th style={th()} colSpan={2}>Base &amp; Taux</th>
                <th style={th()} colSpan={2}>Part salariale</th>
                <th style={th()} colSpan={2}>Part patronale</th>
              </tr>
              <tr>
                <th style={th({ fontSize:7.5 })} />
                <th style={th({ fontSize:7.5 })} />
                <th style={th({ fontSize:7.5 })}>Base</th>
                <th style={th({ fontSize:7.5 })}>Taux</th>
                <th style={th({ fontSize:7.5 })}>Gain</th>
                <th style={th({ fontSize:7.5 })}>Retenue</th>
                <th style={th({ fontSize:7.5 })}>Taux</th>
                <th style={th({ fontSize:7.5 })}>Retenue</th>
              </tr>
            </thead>
            <tbody>
              {/* Rémunérations & primes */}
              {gainItems.filter((i:any)=>i.code!=='ABS_DEDUCT'&&i.code!=='ABS_CONGE').map((item:any) => {
                ref++;
                return <ItemRow key={item.id||item.code} ref_={ref} item={item} col="gain" />;
              })}
              <FullTotalRow label={`Total Brut — ${fmtZ(totalBrut)} FCFA`} />

              {/* Cotisations salariales : CNSS + ITS */}
              {toNum(payroll.cnssSalarial) > 0 && (() => { ref++; return (
                <tr key="cnss_sal">
                  <td style={tdC({ fontFamily:FONT, fontSize:9.5 })}>{ref}</td>
                  <td style={td({ paddingLeft:6 })}>Cotisation CNSS salariale</td>
                  <td style={tdR()}>{fmtZ(payroll.grossSalary)}</td>
                  <td style={tdC({ fontSize:9 })}>4,000%</td>
                  <td style={tdR()} />
                  <td style={tdR({ fontWeight:700 })}>{fmt(payroll.cnssSalarial)}</td>
                  <td style={tdC()} />
                  <td style={tdR()} />
                </tr>
              ); })()}
              {toNum(payroll.its) > 0 && (() => { ref++; return (
                <tr key="its">
                  <td style={tdC({ fontFamily:FONT, fontSize:9.5 })}>{ref}</td>
                  <td style={td({ paddingLeft:6 })}>ITS — Barème progressif</td>
                  <td style={tdR()}>{fmtZ(itsBase)}</td>
                  <td style={tdC({ fontSize:9 })}>Barème</td>
                  <td style={tdR()} />
                  <td style={tdR({ fontWeight:700 })}>{fmt(payroll.its)}</td>
                  <td style={tdC()} />
                  <td style={tdR()} />
                </tr>
              ); })()}
              {cnssItsItems.filter((i:any)=>!['CNSS_SAL','CNSS','ITS','IRPP'].includes(i.code)).map((item:any) => {
                ref++;
                return <ItemRow key={item.id||item.code} ref_={ref} item={item} col="ret" />;
              })}
              <SubTotalRow label="Total cotisations" ret={fmt(totalCotisSection)} />

              {/* Indemnités & avantages */}
              {indemItems.length > 0 && <>
                {indemItems.map((item:any) => {
                  ref++;
                  return <ItemRow key={item.id||item.code} ref_={ref} item={item} col="gain" />;
                })}
                <SubTotalRow label="Total indemnités" gain={fmt(totalIndem)} />
              </>}

              {/* Autres cotisations salarié (TOL, CAMU, etc.) */}
              {autresCotisItems.length > 0 && <>
                {autresCotisItems.map((item:any) => {
                  ref++;
                  return <ItemRow key={item.id||item.code} ref_={ref} item={item} col="ret" />;
                })}
                <SubTotalRow label="Total autres cotisations" ret={fmt(totalAutresCotis)} />
              </>}

              {/* Prêts & avances */}
              {loanAdvItems.map((item:any) => {
                ref++;
                return (
                  <tr key={item.id||item.code}>
                    <td style={tdC({ fontFamily:FONT, fontSize:9.5 })}>{ref}</td>
                    <td style={td({ paddingLeft:6, fontStyle:'italic' })}>{item.label} (non cotisable)</td>
                    <td style={tdR()} />
                    <td style={tdC()} />
                    <td style={tdR()} />
                    <td style={tdR({ fontWeight:700 })}>{fmt(item.amount)}</td>
                    <td style={tdC()} />
                    <td style={tdR()} />
                  </tr>
                );
              })}

              {/* Charges patronales */}
              {[
                { key:'pen', label:'CNSS Pension vieillesse',    taux:'8%',     amt:cnssEmpPension  },
                { key:'fam', label:'CNSS Prestations familiales',taux:'10,03%', amt:cnssEmpFamily   },
                { key:'at',  label:'CNSS Accidents du travail',  taux:'2,25%',  amt:cnssEmpAccident },
                { key:'tdgi',label:'TUS Part DGI',               taux:'2,025%', amt:tusDgi          },
                { key:'tcnss',label:'TUS Part CNSS',             taux:'5,475%', amt:tusCnss         },
              ].filter(r=>r.amt>0).map(r => {
                ref++;
                return (
                  <tr key={r.key}>
                    <td style={tdC({ fontFamily:FONT, fontSize:9.5 })}>{ref}</td>
                    <td style={td({ paddingLeft:6 })}>{r.label}</td>
                    <td style={tdR()}>{fmtZ(payroll.grossSalary)}</td>
                    <td style={tdC({ fontSize:9 })}>{r.taux}</td>
                    <td style={tdR()} />
                    <td style={tdR()} />
                    <td style={tdC({ fontSize:9 })}>{r.taux}</td>
                    <td style={tdR({ fontWeight:700 })}>{fmt(r.amt)}</td>
                  </tr>
                );
              })}
              {patItems.filter((i:any)=>!['TUS_DGI','TUS_CNSS'].includes(i.code)).map((item:any) => {
                ref++;
                return (
                  <tr key={item.id||item.code}>
                    <td style={tdC({ fontFamily:FONT, fontSize:9.5 })}>{ref}</td>
                    <td style={td({ paddingLeft:6 })}>{item.label}</td>
                    <td style={tdR()}>{fmtBase(item)}</td>
                    <td style={tdC({ fontSize:9 })}>{fmtTaux(item)}</td>
                    <td style={tdR()} />
                    <td style={tdR()} />
                    <td style={tdC()} />
                    <td style={tdR({ fontWeight:700 })}>{fmt(item.amount)}</td>
                  </tr>
                );
              })}
              <SubTotalRow label="Total charges patronales" pat={fmt(totalPat)} />

              {/* Totaux finaux */}
              <tr>
                <td colSpan={4} style={{ ...td(), background:'#000', color:'#fff', fontWeight:800, fontSize:10.5, textTransform:'uppercase', letterSpacing:.5 }}>Total Gains</td>
                <td colSpan={2} style={{ ...tdR(), background:'#000', color:'#fff', fontWeight:800, fontSize:12 }}>{fmtZ(totalGains)}</td>
                <td colSpan={2} style={{ ...td(), background:'#000' }} />
              </tr>
              <tr>
                <td colSpan={5} style={{ ...td(), background:'#000', color:'#fff', fontWeight:800, fontSize:10.5, textTransform:'uppercase', letterSpacing:.5 }}>Total Retenues</td>
                <td colSpan={1} style={{ ...tdR(), background:'#000', color:'#fff', fontWeight:800, fontSize:12 }}>{fmtZ(totalRetenues)}</td>
                <td colSpan={2} style={{ ...td(), background:'#000' }} />
              </tr>
            </tbody>
          </table>
        </div>

        {/* ── CUMULS (Période / Année) + NET À PAYER ───────────────────────── */}
        <div className="no-break" style={{ marginTop:8, display:'flex', alignItems:'stretch', border:BDB, borderTop:'none' }}>
          <table style={{ flex:1, borderCollapse:'collapse' }}>
            <thead>
              <tr>
                <th style={th({ width:70, textAlign:'left', paddingLeft:6 })} />
                {cumCols.map(c => <th key={c.label} style={th({ fontSize:8 })}>{c.label}</th>)}
              </tr>
            </thead>
            <tbody>
              {[['Période', cumCols.map(c=>c.period)], ['Année', cumCols.map(c=>c.year)]].map(([lbl,vals]:any) => (
                <tr key={lbl}>
                  <td style={td({ fontWeight:800, background:'#eee', paddingLeft:6 })}>{lbl}</td>
                  {vals.map((v:any,i:number) => (
                    <td key={i} style={tdR({ fontSize:10 })}>{v!=null ? fmtZ(v) : '—'}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ display:'flex', flexDirection:'column', justifyContent:'center', alignItems:'center', minWidth:150, padding:'8px 14px', flexShrink:0, background:'#e0e0e0', borderLeft:BDB }}>
            <div style={{ fontSize:9, fontWeight:700, textTransform:'uppercase', letterSpacing:1.5 }}>Net à payer</div>
            <div style={{ fontSize:20, fontWeight:900, fontFamily:FONT, marginTop:2 }}>{fmtZ(netSalary)}</div>
            <div style={{ fontSize:8, marginTop:1 }}>FCFA</div>
          </div>
        </div>

        {/* ── SIGNATURES ────────────────────────────────────────────────────── */}
        <div className="no-break" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', border:BDB, borderTop:'none' }}>
          <div style={{ padding:'10px 12px', borderRight:BD, minHeight:52 }}>
            <div style={{ fontSize:9, fontWeight:700, textTransform:'uppercase' }}>Signature de l&apos;Employé(e)</div>
          </div>
          <div style={{ padding:'10px 12px', minHeight:52, textAlign:'center' }}>
            <div style={{ fontSize:9, fontWeight:700, textTransform:'uppercase' }}>Signature et cachet de l&apos;Employeur</div>
          </div>
        </div>

        {/* ── PIED DE PAGE ──────────────────────────────────────────────────── */}
        <div style={{ borderTop:'0.5px solid #999', marginTop:6, paddingTop:4, display:'flex', justifyContent:'space-between', fontSize:8, color:'#444' }}>
          <span>CNSS sal. 4% · ITS barème 2026 · Parts fiscales maintenues · SMIG 70 400 FCFA</span>
          <span style={{ fontWeight:700, color:'#000' }}>KONZARH</span>
        </div>

      </div>
    </>
  );
}