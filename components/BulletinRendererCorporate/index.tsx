'use client';

// ============================================================================
// components/BulletinRendererCorporate/index.tsx  (v2 — "Bulletin clarifié")
//
// ✅ Refonte visuelle 2026-08 : mise en page regroupée par catégorie de
//    cotisation (modèle papier fourni par le client), plus lisible pour le
//    salarié — chaque catégorie (Sécurité sociale, ITS, Autres cotisations…)
//    regroupe ses lignes salariales ET patronales.
// ✅ Calculs INCHANGÉS — toutes les valeurs viennent du back/BDD, data-prep
//    copiée verbatim de la version précédente (déjà vérifiée/correcte) :
//    1. fmtTaux masque rate=1
//    2. CNSS patronale : 3 lignes distinctes (Pension 8% / Famille 10,03% / AT 2,25%)
//    3. TUS DGI + CNSS
//    4. Total Gains = Brut + Indemnités
//    5. Total Retenues = totalDeductions (cotis + prêts + avances)
// ✅ Pas de section "Dates de congés" — uniquement les rubriques déjà
//    calculées par l'app (les 2 images fournies par le client ne sont que
//    des modèles de mise en page, pas une liste de rubriques à ajouter).
// ============================================================================

import React, { useMemo } from 'react';
import type { BulletinPayroll, BulletinTemplateConfig } from '@/types/bulletin-template';
import { getBaseTemplate } from '@/lib/bulletin-templates';
import { classifyItems, getTusDgi, getTusCnss, getCtaxEmpItems } from '@/lib/bulletin-items-classifier';

export interface BulletinRendererCorporateProps {
  payroll:      BulletinPayroll;
  template?:    BulletinTemplateConfig;
  previewMode?: boolean;
}

const MONTHS = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
const MARITAL: Record<string,string> = { SINGLE:'Célibataire', MARRIED:'Marié(e)', DIVORCED:'Divorcé(e)', WIDOWED:'Veuf/Veuve', COHABITING:'Concubinage' };
const PAYMENT: Record<string,string> = { BANK_TRANSFER:'Virement', CASH:'Espèces', MOBILE_MONEY:'Mobile Money', CHECK:'Chèque' };
const CONTRACT: Record<string,string> = { CDI:'CDI', CDD:'CDD', STAGE:'Stage', CONSULTANT:'Consultant', PRESTATAIRE:'Prestataire', INTERIM:'Intérimaire', FREELANCE:'Freelance' };

const fmt = (v: any) => {
  const n = Math.round(Number(v) || 0);
  if (!isFinite(n) || Math.abs(n) > 999_999_999_999) return '—';
  return n === 0 ? '' : n.toLocaleString('fr-FR');
};
const fmtZ = (v: any) => Math.round(Number(v) || 0).toLocaleString('fr-FR');

function fmtBase(item: any): string {
  if (item.base == null || Number(item.base) === 0) return '';
  return Math.round(Number(item.base)).toLocaleString('fr-FR');
}
function fmtTaux(item: any): string {
  const qty = item.quantity;
  if (qty != null && Number(qty) !== 0) return String(qty);
  if (item.rate == null || Number(item.rate) === 0) return '';
  const r = Number(item.rate);
  if (r === 1) return '';
  if (r > 1 && r <= 3) return `×${r.toFixed(2).replace('.', ',')}`;
  if (r > 0 && r < 1) {
    const pct = r * 100;
    const str = pct % 1 === 0 ? pct.toFixed(0) : pct.toFixed(3).replace(/0+$/, '');
    return `${str}%`;
  }
  return String(r);
}

function seniority(hireDate?: string): string {
  if (!hireDate) return '—';
  const hire = new Date(hireDate), now = new Date();
  let y = now.getFullYear() - hire.getFullYear(), m = now.getMonth() - hire.getMonth();
  if (m < 0) { y--; m += 12; }
  return `${y} an${y > 1 ? 's' : ''}`;
}
function formatDate(d?: string): string { return d ? new Date(d).toLocaleDateString('fr-FR') : '—'; }

// ── Tokens visuels — sobre, catégorisé (modèle "bulletin clarifié") ────────
const SANS = 'Arial,Helvetica,sans-serif';
const BD   = '1px solid #999';
const BDB  = '1px solid #000';

const TH = (extra?: React.CSSProperties): React.CSSProperties => ({
  fontWeight: 700, fontSize: 9, textTransform: 'uppercase' as const,
  letterSpacing: .3, padding: '6px 8px', textAlign: 'center' as const,
  borderBottom: BDB, color:'#000', ...extra,
});
const C = (extra?: React.CSSProperties): React.CSSProperties => ({
  padding: '3px 8px', fontSize: 10, verticalAlign: 'middle', color:'#000',
  borderBottom: '0.5px solid #bbb', ...extra,
});
const CR = (extra?: React.CSSProperties) => ({ ...C(), textAlign: 'right' as const, fontFamily: 'monospace', ...extra });
const CC = (extra?: React.CSSProperties) => ({ ...C(), textAlign: 'center' as const, ...extra });

const CatHeader = ({ children }: { children: React.ReactNode }) => (
  <tr>
    <td colSpan={7} style={{ padding: '8px 8px 3px', fontSize: 10, fontWeight: 800, textTransform:'uppercase' as const, letterSpacing:.5, color:'#000', borderBottom:'1px solid #999' }}>
      {children}
    </td>
  </tr>
);

const InfoRow = ({ label, val }: { label: string; val: string }) => (
  <div style={{ display:'grid', gridTemplateColumns:'110px 1fr', gap:'0 6px', marginBottom:2 }}>
    <span style={{ fontSize:9, color:'#555' }}>{label}</span>
    <span style={{ fontSize:9, fontWeight:600, color:'#000' }}>{val}</span>
  </div>
);

export default function BulletinRendererCorporate({ payroll, template }: BulletinRendererCorporateProps) {
  const tpl     = template ?? getBaseTemplate('corporate');
  const e       = (payroll.employee ?? {}) as any;
  const co      = (payroll.company  ?? {}) as any;
  const ytd     = (payroll as any).ytd;
  const monthLabel = MONTHS[(payroll.month ?? 1) - 1];

  // ── Classification des items (inchangé) ──────────────────────────────────
  const { gainItems, cotisItems, indemItems, retenueItems, empItems } = useMemo(
    () => classifyItems(payroll.items ?? []), [payroll.items]
  );

  const gainFiltered  = gainItems.filter((i: any) => i.code !== 'ABS_DEDUCT' && i.code !== 'ABS_CONGE');
  const cnssSalItems  = cotisItems.filter((i: any) => ['CNSS_SAL','CNSS'].includes(i.code));
  const itsItems      = cotisItems.filter((i: any) => ['ITS','IRPP','BNC_SOURCE'].includes(i.code));
  const autresCotis   = cotisItems.filter((i: any) => !['CNSS_SAL','CNSS','ITS','IRPP','BNC_SOURCE'].includes(i.code))
                          .concat(retenueItems.filter((i:any)=>i.code!=='LOAN'&&i.code!=='ADVANCE'));
  const loanAdvItems  = retenueItems.filter((i: any) => i.code === 'LOAN' || i.code === 'ADVANCE');

  const cnssEmpPension  = Number(payroll.cnssEmployerPension  ?? 0);
  const cnssEmpFamily   = Number(payroll.cnssEmployerFamily   ?? 0);
  const cnssEmpAccident = Number(payroll.cnssEmployerAccident ?? 0);
  const tusDgi   = getTusDgi(empItems, payroll);
  const tusCnss  = getTusCnss(empItems, payroll);
  const ctaxEmps = getCtaxEmpItems(empItems);

  const totalDed     = payroll.totalDeductions ?? 0;
  const totalLoanAdv = loanAdvItems.reduce((s: number, i: any) => s + Number(i.amount || 0), 0);
  const totalIndem   = indemItems.reduce((s: number, i: any) => s + Number(i.amount || 0), 0);
  const totalGains   = (payroll.grossSalary ?? 0) + totalIndem;
  const netSalary    = payroll.netSalary ?? 0;

  const rawOT    = Number(payroll.overtimeHours10??0)+Number(payroll.overtimeHours25??0)
                 + Number(payroll.overtimeHours50??0)+Number(payroll.overtimeHours100??0);
  const overTime = rawOT > 0 && rawOT <= 300 ? rawOT : null;

  const fullName = [e.firstName, e.lastName].filter(Boolean).join(' ');
  const cat      = [e.professionalCategory, e.echelon ? `Éch. ${e.echelon}` : ''].filter(Boolean).join(' ');

  let ref = 9;

  const ytdNetImp = ytd ? (ytd.grossSalary - ytd.cnssSalarial) : null;
  const cumCols = [
    { label:'Salaire brut',   period: payroll.grossSalary,   year: ytd?.grossSalary     ?? null },
    { label:'Charges sal.',   period: payroll.cnssSalarial,  year: ytd?.cnssSalarial    ?? null },
    { label:'Charges pat.',   period: payroll.cnssEmployer ?? 0, year: ytd?.cnssEmployer ?? null },
    { label:'Net imposable',  period: (payroll.grossSalary??0)-(payroll.cnssSalarial??0), year: ytdNetImp },
    { label:'Heures',         period: (payroll.workedDays??0)*8, year: ytd ? ytd.workedDays*8 : null },
  ];

  return (
    <>
      <style>{`
        @media print {
          @page { size: A4 portrait; margin: 8mm; }
          html, body { margin: 0 !important; padding: 0 !important; background: #fff !important; }
          .no-print, nav, header, aside, footer,
          [class*="sidebar"],[class*="Sidebar"],
          [class*="navbar"],[class*="Navbar"] { display: none !important; }
          #bulletin-corp-root {
            width: 194mm !important; padding: 0 !important; margin: 0 !important;
            box-shadow: none !important; border: none !important;
          }
          .corp-no-break { page-break-inside: avoid !important; break-inside: avoid !important; }
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        }
        #bulletin-corp-root table tbody tr:nth-child(even) td { background: #f7f7f7; }
      `}</style>

      <div id="bulletin-corp-root" style={{
        fontFamily: SANS, fontSize: 10, background: '#fff', color: '#000',
        width: '210mm', boxSizing: 'border-box' as const, padding: '20px 26px', margin: '0 auto',
      }}>

        {/* ── EN-TÊTE ─────────────────────────────────────────────────────── */}
        <div className="corp-no-break" style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12 }}>
          <div style={{ display:'flex', gap:10, alignItems:'flex-start' }}>
            {co.logo && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={co.logo} alt="Logo" crossOrigin="anonymous" style={{ width:42, height:42, objectFit:'contain' }} />
            )}
            <div>
              <div style={{ fontSize:13, fontWeight:800 }}>{co.tradeName || co.legalName || 'Entreprise'}</div>
              {co.legalForm && <div style={{ fontSize:9, color:'#555' }}>{co.legalForm}</div>}
              {co.address && <div style={{ fontSize:9, color:'#333', marginTop:3 }}>{co.address}</div>}
              {co.city && <div style={{ fontSize:9, color:'#333' }}>{co.city}</div>}
              <div style={{ fontSize:9, color:'#333', marginTop:3 }}>
                {[co.rccmNumber&&`Siret/RCCM ${co.rccmNumber}`, co.nif&&`APE/NIU ${co.nif}`].filter(Boolean).join('   ')}
              </div>
            </div>
          </div>
          <div style={{ textAlign:'right' }}>
            <div style={{ fontSize:19, fontWeight:800, letterSpacing:.5 }}>BULLETIN DE SALAIRE CLARIFIÉ</div>
            <div style={{ fontSize:9.5, marginTop:6 }}>
              Période du 01/{String(payroll.month??1).padStart(2,'0')}/{payroll.year} au {new Date(payroll.year, payroll.month, 0).getDate()}/{String(payroll.month??1).padStart(2,'0')}/{payroll.year}
            </div>
            <div style={{ fontSize:9.5, marginTop:2 }}>
              Matricule {e.employeeNumber||'—'} &nbsp;·&nbsp; N° contrat {e.contractNumber||'—'}
            </div>
            <div style={{ fontSize:9.5, marginTop:2 }}>
              Paiement le {(payroll as any).paymentDate?formatDate((payroll as any).paymentDate):'—'} par {PAYMENT[e.paymentMethod??'']??'Virement'}
            </div>
          </div>
        </div>

        {/* ── IDENTITÉ SALARIÉ ─────────────────────────────────────────────── */}
        <div className="corp-no-break" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', border:BDB, marginBottom:12 }}>
          <div style={{ padding:'10px 14px', borderRight:BD }}>
            <div style={{ fontSize:8, fontWeight:700, textTransform:'uppercase', letterSpacing:1, color:'#555', marginBottom:6 }}>Salarié</div>
            <div style={{ fontSize:12.5, fontWeight:800 }}>{fullName||'—'}</div>
            <div style={{ fontSize:9.5, color:'#333', marginTop:2 }}>{e.position||'—'}</div>
            <div style={{ display:'flex', gap:5, flexWrap:'wrap', marginTop:6 }}>
              {CONTRACT[e.contractType??''] && <span style={{ border:'1px solid #000', fontSize:8, padding:'2px 7px', fontWeight:700 }}>{CONTRACT[e.contractType]}</span>}
              {cat && <span style={{ border:'1px solid #999', color:'#555', fontSize:8, padding:'2px 7px' }}>{cat}</span>}
            </div>
          </div>
          <div style={{ padding:'10px 14px' }}>
            <InfoRow label="Ancienneté"       val={seniority(e.hireDate)} />
            <InfoRow label="N° Sécu."         val={e.cnssNumber||'—'} />
            <InfoRow label="Horaires"         val="151,67 h" />
            <InfoRow label="Convention coll." val={co.collectiveAgreement||'—'} />
            {toN(payroll.absenceDays)>0 && <InfoRow label="Absences" val={`${payroll.absenceDays} j`} />}
            {overTime!=null && <InfoRow label="Heures suppl." val={`${overTime} h`} />}
          </div>
        </div>

        {/* ── TABLEAU — regroupé par catégorie de cotisation ───────────────── */}
        <div className="corp-no-break">
          <table style={{ width:'100%', borderCollapse:'collapse', tableLayout:'fixed' }}>
            <colgroup>
              <col style={{ width:'34%' }}/><col style={{ width:'12%' }}/><col style={{ width:'8%' }}/>
              <col style={{ width:'14%' }}/><col style={{ width:'8%' }}/><col style={{ width:'14%' }}/>
              <col style={{ width:'10%' }}/>
            </colgroup>
            <thead>
              <tr>
                <th style={TH({ textAlign:'left' })}>Désignation</th>
                <th style={TH()} colSpan={3}>Gains et cotisations salariales</th>
                <th style={TH()} colSpan={2}>Cotisations patronales</th>
                <th style={TH()} />
              </tr>
              <tr>
                <th style={TH({ fontSize:7.5 })} />
                <th style={TH({ fontSize:7.5 })}>Base ou nombre</th>
                <th style={TH({ fontSize:7.5 })}>Taux</th>
                <th style={TH({ fontSize:7.5 })}>Montant</th>
                <th style={TH({ fontSize:7.5 })}>Taux</th>
                <th style={TH({ fontSize:7.5 })}>Montant</th>
                <th style={TH({ fontSize:7.5 })} />
              </tr>
            </thead>
            <tbody>

              {/* ── SALAIRE ────────────────────────────────────────────── */}
              <CatHeader>Salaire</CatHeader>
              {gainFiltered.map((item: any) => { ref++; return (
                <tr key={item.id??item.code}>
                  <td style={C()}>{item.label}</td>
                  <td style={CR()}>{fmtBase(item)}</td>
                  <td style={CC({ fontSize:9 })}>{fmtTaux(item)}</td>
                  <td style={CR({ fontWeight:700 })}>{fmt(item.amount)}</td>
                  <td style={CC()} /><td style={CR()} /><td style={C()} />
                </tr>
              ); })}
              <tr>
                <td style={{ ...C(), fontWeight:800 }}>Total brut</td>
                <td style={CR()} /><td style={CC()} />
                <td style={{ ...CR(), fontWeight:800, borderTop:'1px solid #000', borderBottom:'1px solid #000' }}>{fmtZ(payroll.grossSalary)}</td>
                <td style={CC()} /><td style={CR()} /><td style={C()} />
              </tr>

              {/* ── SÉCURITÉ SOCIALE (CNSS) ───────────────────────────── */}
              <CatHeader>Sécurité sociale (CNSS)</CatHeader>
              {cnssSalItems.map((item:any) => { ref++; return (
                <tr key={item.id??item.code}>
                  <td style={C()}>{item.label}</td>
                  <td style={CR()}>{fmtBase(item)}</td>
                  <td style={CC({ fontSize:9 })}>{fmtTaux(item)}</td>
                  <td style={CR({ fontWeight:700 })}>{fmt(item.amount)}</td>
                  <td style={CC()} /><td style={CR()} /><td style={C()} />
                </tr>
              ); })}
              {[
                { key:'pen',  label:'Pension vieillesse',     taux:'8%',     amt:cnssEmpPension  },
                { key:'fam',  label:'Prestations familiales',  taux:'10,03%', amt:cnssEmpFamily   },
                { key:'at',   label:'Accidents du travail',    taux:'2,25%',  amt:cnssEmpAccident },
              ].filter(r=>r.amt>0).map(r => (
                <tr key={r.key}>
                  <td style={C({ paddingLeft:16 })}>{r.label}</td>
                  <td style={CR()}>{fmtZ(payroll.grossSalary)}</td>
                  <td style={CC({ fontSize:9 })} />
                  <td style={CR()} />
                  <td style={CC({ fontSize:9 })}>{r.taux}</td>
                  <td style={CR({ fontWeight:700 })}>{fmt(r.amt)}</td>
                  <td style={C()} />
                </tr>
              ))}

              {/* ── ITS ────────────────────────────────────────────────── */}
              {itsItems.length > 0 && <>
                <CatHeader>Impôt sur les traitements et salaires (ITS)</CatHeader>
                {itsItems.map((item:any) => { ref++; return (
                  <tr key={item.id??item.code}>
                    <td style={C()}>{item.label}</td>
                    <td style={CR()}>{fmtBase(item) || fmtZ((payroll.grossSalary??0)-(payroll.cnssSalarial??0))}</td>
                    <td style={CC({ fontSize:9 })}>Barème</td>
                    <td style={CR({ fontWeight:700 })}>{fmt(item.amount)}</td>
                    <td style={CC()} /><td style={CR()} /><td style={C()} />
                  </tr>
                ); })}
              </>}

              {/* ── AUTRES COTISATIONS ET TAXES ──────────────────────────── */}
              {(autresCotis.length > 0 || tusDgi > 0 || tusCnss > 0 || ctaxEmps.length > 0) && <>
                <CatHeader>Autres cotisations et taxes</CatHeader>
                {autresCotis.map((item:any) => { ref++; return (
                  <tr key={item.id??item.code}>
                    <td style={C()}>{item.label}</td>
                    <td style={CR()}>{fmtBase(item)}</td>
                    <td style={CC({ fontSize:9 })}>{fmtTaux(item)}</td>
                    <td style={CR({ fontWeight:700 })}>{fmt(item.amount)}</td>
                    <td style={CC()} /><td style={CR()} /><td style={C()} />
                  </tr>
                ); })}
                {tusDgi > 0 && (
                  <tr>
                    <td style={C({ paddingLeft:16 })}>TUS — Part DGI</td>
                    <td style={CR()}>{fmtZ(payroll.grossSalary)}</td>
                    <td style={CC({ fontSize:9 })} /><td style={CR()} />
                    <td style={CC({ fontSize:9 })}>2,025%</td>
                    <td style={CR({ fontWeight:700 })}>{fmt(tusDgi)}</td>
                    <td style={C()} />
                  </tr>
                )}
                {tusCnss > 0 && (
                  <tr>
                    <td style={C({ paddingLeft:16 })}>TUS — Part CNSS</td>
                    <td style={CR()}>{fmtZ(payroll.grossSalary)}</td>
                    <td style={CC({ fontSize:9 })} /><td style={CR()} />
                    <td style={CC({ fontSize:9 })}>5,475%</td>
                    <td style={CR({ fontWeight:700 })}>{fmt(tusCnss)}</td>
                    <td style={C()} />
                  </tr>
                )}
                {ctaxEmps.map((item:any) => (
                  <tr key={item.id??item.code}>
                    <td style={C({ paddingLeft:16 })}>{item.label}</td>
                    <td style={CR()}>{fmtBase(item)}</td>
                    <td style={CC()} /><td style={CR()} />
                    <td style={CC()} />
                    <td style={CR({ fontWeight:700 })}>{fmt(item.amount)}</td>
                    <td style={C()} />
                  </tr>
                ))}
              </>}

              {/* ── INDEMNITÉS & AVANTAGES ────────────────────────────────── */}
              {indemItems.length > 0 && <>
                <CatHeader>Indemnités &amp; avantages (non soumis à cotisations)</CatHeader>
                {indemItems.map((item:any) => (
                  <tr key={item.id??item.code}>
                    <td style={C()}>{item.label}</td>
                    <td style={CR()}>{fmtBase(item)}</td>
                    <td style={CC({ fontSize:9 })}>{fmtTaux(item)}</td>
                    <td style={CR({ fontWeight:700 })}>{fmt(item.amount)}</td>
                    <td style={CC()} /><td style={CR()} /><td style={C()} />
                  </tr>
                ))}
              </>}

              {/* ── PRÊTS & AVANCES ───────────────────────────────────────── */}
              {loanAdvItems.length > 0 && <>
                <CatHeader>Prêts &amp; avances sur salaire</CatHeader>
                {loanAdvItems.map((item:any) => (
                  <tr key={item.id??item.code}>
                    <td style={C({ fontStyle:'italic' })}>{item.label}</td>
                    <td style={CR()} /><td style={CC()} />
                    <td style={CR({ fontWeight:700 })}>{fmt(item.amount)}</td>
                    <td style={CC()} /><td style={CR()} /><td style={C()} />
                  </tr>
                ))}
              </>}

              {/* ── SALAIRE NET ────────────────────────────────────────────── */}
              <tr>
                <td colSpan={3} style={{ ...C(), fontWeight:900, fontSize:12, borderTop:'2px solid #000', textTransform:'uppercase' }}>Salaire net</td>
                <td style={{ ...CR(), fontWeight:900, fontSize:13, borderTop:'2px solid #000' }}>{fmtZ(netSalary)}</td>
                <td style={{ borderTop:'2px solid #000' }} /><td style={{ borderTop:'2px solid #000' }} /><td style={{ borderTop:'2px solid #000' }} />
              </tr>

            </tbody>
          </table>
        </div>

        {/* ── CUMULS (Mois / Année) + NET À PAYER ──────────────────────────── */}
        <div className="corp-no-break" style={{ marginTop:10 }}>
          <div style={{ display:'flex', alignItems:'stretch', borderTop:BDB }}>
            <table style={{ flex:1, borderCollapse:'collapse' }}>
              <thead>
                <tr>
                  <th style={{ ...TH(), width:60, textAlign:'left', borderRight:BD }} />
                  {cumCols.map(c => <th key={c.label} style={{ ...TH(), borderRight:BD }}>{c.label}</th>)}
                </tr>
              </thead>
              <tbody>
                {[['Mois', cumCols.map(c=>c.period)], ['Année', cumCols.map(c=>c.year)]].map(([lbl,vals]:any) => (
                  <tr key={lbl}>
                    <td style={{ ...C(), fontWeight:800, background:'#f3f3f3', borderRight:BD }}>{lbl}</td>
                    {vals.map((v:any,i:number) => (
                      <td key={i} style={{ ...CR(), borderRight:BD }}>{v!=null ? fmtZ(v) : '—'}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ display:'flex', flexDirection:'column', justifyContent:'center', alignItems:'center', minWidth:140, padding:'10px 16px', flexShrink:0, background:'#eee' }}>
              <div style={{ fontSize:9, fontWeight:700, textTransform:'uppercase', letterSpacing:1.5 }}>Net à payer</div>
              <div style={{ fontSize:20, fontWeight:900, fontFamily:'monospace', marginTop:2 }}>{fmtZ(netSalary)}</div>
              <div style={{ fontSize:8, marginTop:1 }}>FCFA</div>
            </div>
          </div>
        </div>

        {/* Message employeur */}
        {tpl.style.footerMessage && (
          <div style={{ padding:'6px 0', borderTop:BD, marginTop:8, fontSize:9, fontStyle:'italic', textAlign:'center', color:'#333' }}>
            {tpl.style.footerMessage}
          </div>
        )}

        {/* ── SIGNATURES ─────────────────────────────────────────────────── */}
        <div className="corp-no-break" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', border:BDB, borderTop:'none', marginTop: tpl.style.footerMessage?0:8 }}>
          <div style={{ padding:'10px 14px', borderRight:BD, minHeight:52 }}>
            <div style={{ fontSize:9, fontWeight:700, textTransform:'uppercase' }}>Signature de l&apos;Employé(e)</div>
          </div>
          <div style={{ padding:'10px 14px', minHeight:52, textAlign:'center' }}>
            <div style={{ fontSize:9, fontWeight:700, textTransform:'uppercase' }}>Signature et cachet de l&apos;Employeur</div>
          </div>
        </div>

        {/* ── PIED DE PAGE ──────────────────────────────────────────────── */}
        <div style={{ borderTop:'0.5px solid #999', padding:'6px 0', marginTop:6, display:'flex', justifyContent:'space-between', fontSize:8, color:'#444' }}>
          <span>Pour vous aider à faire valoir vos droits, conservez ce bulletin sans limitation de durée · CNSS 4% sal. · ITS barème 2026 · SMIG 70 400 FCFA</span>
          <span style={{ fontWeight:700, color:'#000' }}>KONZARH</span>
        </div>

      </div>
    </>
  );
}

function toN(v: any): number { const n = Number(v); return isFinite(n) ? n : 0; }