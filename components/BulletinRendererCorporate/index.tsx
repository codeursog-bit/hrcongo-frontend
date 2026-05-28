'use client';

// ============================================================================
// components/BulletinRendererCorporate/index.tsx
// Template CORPORATE — Bandeau bleu marine, sections colorées, 3 colonnes infos
// ============================================================================

import React, { useMemo } from 'react';
import type { BulletinPayroll, BulletinTemplateConfig } from '@/types/bulletin-template';
import { getBaseTemplate } from '@/lib/bulletin-templates';
import { classifyItems, getCnssEmpTotal, getTusDgi, getTusCnss, getCtaxEmpItems, getTotalCotisSal, getTotalCotisPat, getEmpColsForItem } from '@/lib/bulletin-items-classifier';

export interface BulletinRendererCorporateProps {
  payroll:      BulletinPayroll;
  template?:    BulletinTemplateConfig;
  previewMode?: boolean;
}

const MONTHS = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
const MARITAL: Record<string,string> = { SINGLE:'Célibataire', MARRIED:'Marié(e)', DIVORCED:'Divorcé(e)', WIDOWED:'Veuf/Veuve', COHABITING:'Concubinage' };
const PAYMENT: Record<string,string> = { BANK_TRANSFER:'Virement bancaire', CASH:'Espèces', MOBILE_MONEY:'Mobile Money', CHECK:'Chèque' };
const CONTRACT: Record<string,string> = { CDI:'CDI', CDD:'CDD', STAGE:'Stage', CONSULTANT:'Consultant', PRESTATAIRE:'Prestataire', INTERIM:'Intérimaire', FREELANCE:'Freelance' };

const fmt = (v: any) => {
  const n = Math.round(Number(v) || 0);
  // Valeur aberrante (bug API) → afficher '—'
  if (Math.abs(n) > 999_999_999_999) return '—';
  return n.toLocaleString('fr-FR');
};

function seniority(hireDate?: string): string {
  if (!hireDate) return '—';
  const hire = new Date(hireDate), now = new Date();
  let y = now.getFullYear() - hire.getFullYear(), m = now.getMonth() - hire.getMonth();
  if (m < 0) { y--; m += 12; }
  return `${y} an${y > 1 ? 's' : ''} · ${m} mois`;
}
function formatDate(d?: string): string { if (!d) return '—'; return new Date(d).toLocaleDateString('fr-FR'); }

const C:  React.CSSProperties = { borderBottom: '1px solid #e2e8f0', padding: '5px 8px', fontSize: 10, verticalAlign: 'middle' };
const CR: React.CSSProperties = { ...C, textAlign: 'right', fontFamily: 'monospace', overflow: 'hidden', maxWidth: 120 };
const CC: React.CSSProperties = { ...C, textAlign: 'center' };

export default function BulletinRendererCorporate({ payroll, template, previewMode = false }: BulletinRendererCorporateProps) {
  const tpl     = template ?? getBaseTemplate('corporate');
  const primary = tpl.style.primaryColor || '#1e3a5f';
  const e       = (payroll.employee ?? {}) as any;
  const co      = (payroll.company  ?? {}) as any;
  const items   = payroll.items ?? [];
  const month   = payroll.month ?? 1;
  const monthLabel = MONTHS[month - 1];

  const { gainItems: gainLines, cotisItems: cotisLines, indemItems: indemLines, retenueItems, empItems } = useMemo(
    () => classifyItems(items), [items]
  );

  const cnssEmpTotal  = getCnssEmpTotal(empItems, payroll);
  const brutGains     = gainLines.reduce((s,i)=>s+Number(i.amount),0);
  const totalCotisSal = getTotalCotisSal(cotisLines);
  const totalCotisPat = getTotalCotisPat(empItems, payroll);
  const totalGainsRow = brutGains + indemLines.reduce((s,i)=>s+Number(i.amount),0)
                      + retenueItems.reduce((s,i)=>s+Number(i.amount),0);
  const totalRetenues = totalCotisSal + retenueItems.reduce((s,i)=>s+Number(i.amount),0);
  const netSalary     = payroll.netSalary ?? 0;

  const TH = (extra?: React.CSSProperties): React.CSSProperties => ({
    background: '#1e293b', color: '#fff', fontWeight: 700, fontSize: 9,
    textTransform: 'uppercase', letterSpacing: .5, padding: '7px 8px', textAlign: 'center', ...extra,
  });

  const SectionLabel = ({ color, bg, border, children }: any) => (
    <tr><td colSpan={9} style={{
      background: bg, padding: '4px 8px', fontSize: 8, fontWeight: 800,
      textTransform: 'uppercase', letterSpacing: 1, color,
      borderTop: `1px solid ${border}`, borderBottom: `1px solid ${border}`,
    }}>{children}</td></tr>
  );

  const row = (label: string, val: string) => (
    <div key={label} style={{ display:'grid', gridTemplateColumns:'115px 1fr', gap:'0 6px', marginBottom:2 }}>
      <span style={{ fontSize:9, color:'#333' }}>{label}</span>
      <span style={{ fontSize:9, fontWeight:600, color:'#1e293b' }}>{val}</span>
    </div>
  );

  const overTime = (payroll.overtimeHours10??0)+(payroll.overtimeHours25??0)+(payroll.overtimeHours50??0)+(payroll.overtimeHours100??0);
  const fullName = [e.firstName, e.lastName].filter(Boolean).join(' ');
  const cat      = [e.professionalCategory, e.echelon ? `Echelon ${e.echelon}` : ''].filter(Boolean).join(' ');

  const cumCols = [
    { label:'Salaire brut',    period:payroll.grossSalary,   year:(payroll.grossSalary??0)*month },
    { label:'Ch. salariales',  period:payroll.cnssSalarial,  year:(payroll.cnssSalarial??0)*month },
    { label:'Ch. patronales',  period:cnssEmpTotal,          year:cnssEmpTotal*month },
    { label:'Avant. nature',   period:0,                     year:0 },
    { label:'Net imposable',   period:(payroll.grossSalary??0)-(payroll.cnssSalarial??0), year:((payroll.grossSalary??0)-(payroll.cnssSalarial??0))*month },
    { label:'H. travaillées',  period:(payroll.workedDays??0)*8, year:(payroll.workedDays??0)*8*month },
    { label:'H. suppl.',       period:overTime,              year:0 },
    { label:'Base Congés',     period:payroll.baseSalary,    year:(payroll.baseSalary??0)*month },
  ];

  return (
    <>
      <style>{`
        @media print {
          /* A4 portrait, pleine page */
          @page { size: A4 portrait; margin: 0; }
          html, body { margin: 0 !important; padding: 0 !important; }
          /* Masquer tout sauf le bulletin */
          body > * { display: none !important; }
          .payslip-sheet-wrap, .bulletin-modal-overlay {
            display: block !important;
            position: fixed !important;
            inset: 0 !important;
            z-index: 99999 !important;
            background: #fff !important;
          }
          /* Bulletin pleine page */
          #bulletin-corp-root {
            width:     210mm !important;
            min-height:297mm !important;
            padding:   10mm 12mm !important;
            margin:    0 !important;
            box-shadow:none !important;
            border:    none !important;
          }
          .corp-no-break { page-break-inside: avoid !important; break-inside: avoid !important; }
          .bulletin-legal-corp    { display: none !important; }
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        }
        `}</style>

      <div id="bulletin-corp-root" style={{
          fontFamily: '"Segoe UI","Helvetica Neue",Arial,sans-serif',
          fontSize: 10,
          background: '#fff',
          color: '#000',
          width: '100%',
          boxSizing: 'border-box' as const,
          padding: '28px 34px',
          margin: '0 auto',
        }}>

        {/* ── HEADER ── */}
        <div className="corp-no-break" style={{ background:primary, color:'#fff', padding:'18px 24px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div style={{ display:'flex', alignItems:'center', gap:14 }}>
            {co.logo
              ? <img src={co.logo} alt="Logo" style={{ width:52, height:52, objectFit:'contain', background:'#fff', borderRadius:6, padding:4, flexShrink:0 }} />
              : <div style={{ width:52, height:52, background:'#fff', borderRadius:6, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:900, fontSize:11, color:primary, letterSpacing:1, flexShrink:0 }}>
                  {(co.tradeName||co.legalName||'ENT').slice(0,4).toUpperCase()}
                </div>
            }
            <div>
              <div style={{ fontSize:14, fontWeight:700, letterSpacing:.5 }}>{(co.tradeName||co.legalName||'ENTREPRISE').toUpperCase()}</div>
              {co.address && <div style={{ fontSize:9, opacity:.7, marginTop:3 }}>{co.address}{co.city?`, ${co.city}`:''}{co.phone?` · Tél : ${co.phone}`:''}{co.email?` · ${co.email}`:''}</div>}
              <div style={{ fontSize:9, opacity:.6, marginTop:2 }}>
                {[co.rccmNumber&&`RCCM : ${co.rccmNumber}`, co.cnssNumber&&`CNSS : ${co.cnssNumber}`, co.nif&&`NIU : ${co.nif}`].filter(Boolean).join(' · ')}
              </div>
            </div>
          </div>
          <div style={{ textAlign:'right', flexShrink:0 }}>
            <div style={{ fontSize:9, fontWeight:700, textTransform:'uppercase', letterSpacing:2, opacity:.6 }}>Bulletin de paie</div>
            <div style={{ fontSize:24, fontWeight:900, letterSpacing:1, lineHeight:1.1 }}>{monthLabel.toUpperCase()}</div>
            <div style={{ fontSize:14, opacity:.8 }}>{payroll.year}</div>
            <div style={{ marginTop:6, background:'rgba(255,255,255,.15)', borderRadius:4, padding:'3px 10px', fontSize:9 }}>
              {payroll.paymentDate ? `Paiement : ${formatDate(payroll.paymentDate)} · ` : ''}{PAYMENT[e.paymentMethod??'']??'Virement bancaire'}
            </div>
          </div>
        </div>

        {/* ── INFOS EMPLOYÉ 3 COL ── */}
        <div className="corp-no-break" style={{ background:'#f0f4f8', display:'grid', gridTemplateColumns:'1fr 1fr 1fr', borderBottom:`2px solid ${primary}` }}>
          <div style={{ padding:'12px 16px', borderRight:'1px solid #cbd5e0' }}>
            <div style={{ fontSize:8, fontWeight:700, textTransform:'uppercase', letterSpacing:1, color:'#333', marginBottom:7 }}>Employé</div>
            <div style={{ fontSize:12, fontWeight:800, color:primary, marginBottom:3 }}>{fullName||'—'}</div>
            <div style={{ fontSize:9.5, color:'#475569', marginBottom:7 }}>{e.position||'—'}</div>
            <div style={{ display:'flex', gap:5, flexWrap:'wrap' }}>
              {CONTRACT[e.contractType??''] && <span style={{ background:primary, color:'#fff', fontSize:8, padding:'2px 7px', borderRadius:3, fontWeight:700 }}>{CONTRACT[e.contractType]}</span>}
              {cat && <span style={{ background:'#bbb', color:'#475569', fontSize:8, padding:'2px 7px', borderRadius:3 }}>{cat}</span>}
              {e.employeeNumber && <span style={{ background:'#bbb', color:'#475569', fontSize:8, padding:'2px 7px', borderRadius:3 }}>Mat. {e.employeeNumber}</span>}
            </div>
          </div>
          <div style={{ padding:'12px 16px', borderRight:'1px solid #cbd5e0' }}>
            <div style={{ fontSize:8, fontWeight:700, textTransform:'uppercase', letterSpacing:1, color:'#333', marginBottom:7 }}>Contrat &amp; Identité</div>
            {row("Date d'embauche", formatDate(e.hireDate))}
            {row('Ancienneté', seniority(e.hireDate))}
            {row('Etat civil', MARITAL[e.maritalStatus??'']??'—')}
            {row("Nb. d'enfants", String(e.numberOfChildren??0))}
            {row('N° CNSS', e.cnssNumber||'—')}
            {row('Convention', co.collectiveAgreement||'Commerce')}
          </div>
          <div style={{ padding:'12px 16px' }}>
            <div style={{ fontSize:8, fontWeight:700, textTransform:'uppercase', letterSpacing:1, color:'#333', marginBottom:7 }}>Période de travail</div>
            {row('Site', co.city||co.address||'Administration')}
            {row('Jours ouvrables', `${payroll.workDays??26} jours`)}
            {row('Jours travaillés', `${payroll.workedDays??26} jours`)}
            {row('Absences', `${payroll.absenceDays??0} jour(s)`)}
            {row('Heures suppl.', overTime > 0 ? `${overTime} h` : '—')}
            {row('Salaire base/j', payroll.baseSalary && payroll.workDays
              ? `${fmt(Math.round(Number(payroll.baseSalary)/(payroll.workDays??26)))} FCFA` : '—')}
          </div>
        </div>

        {/* ── TABLEAU PAIE ── */}
        <div className="corp-no-break" style={{ padding:'0 24px', marginTop:12 }}>
          <table style={{ width:'100%', borderCollapse:'collapse', tableLayout:'fixed' }}>
            <colgroup>
              <col style={{ width:'5%' }}/><col style={{ width:'31%' }}/><col style={{ width:'7%' }}/>
              <col style={{ width:'9%' }}/><col style={{ width:'6%' }}/><col style={{ width:'13%' }}/>
              <col style={{ width:'12%' }}/><col style={{ width:'5%' }}/><col style={{ width:'12%' }}/>
            </colgroup>
            <thead>
              <tr>
                <th style={TH()}>N°</th>
                <th style={TH({ textAlign:'left' })}>Désignation</th>
                <th style={TH()}>Nb</th>
                <th style={TH()}>Base</th>
                <th style={TH()}>Taux</th>
                <th style={TH({ background:'#1a472a' })}>Gain</th>
                <th style={TH({ background:'#7f1d1d' })}>Retenue</th>
                <th style={TH({ background:'#3b0764' })}>T.p.</th>
                <th style={TH({ background:'#3b0764' })}>Ret. pat.</th>
              </tr>
            </thead>
            <tbody>

              <SectionLabel color="#3730a3" bg="#eef2ff" border="#c7d2fe">Rémunérations soumises</SectionLabel>
              {gainLines.map((item:any, idx:number) => (
                <tr key={item.id??idx} style={{ background: idx%2===0?'#fff':'#fafafa' }}>
                  <td style={{ ...CC, color:'#333', fontSize:9 }}>{(idx+1)*10}</td>
                  <td style={{ ...C, fontWeight: item.code==='SAL_BASE'?700:400 }}>{item.label}</td>
                  <td style={CR}>{item.code==='SAL_BASE' ? fmt(payroll.workedDays??26) : ''}</td>
                  <td style={CR}>{item.base ? fmt(item.base) : ''}</td>
                  <td style={{ ...CC, fontSize:9, color:'#333' }}>{item.rate&&item.rate!==1 ? `${(item.rate*100).toFixed(0)}%` : '—'}</td>
                  <td style={{ ...CR, fontWeight:700, color:'#166534', background:'#f0fdf4' }}>{fmt(item.amount)}</td>
                  <td style={{ ...C, background:'#fef2f2' }} />
                  <td style={{ ...C, background:'#faf5ff' }} />
                  <td style={{ ...C, background:'#faf5ff' }} />
                </tr>
              ))}

              {/* Total Brut */}
              <tr style={{ background:'#dbeafe', borderTop:`2px solid ${primary}`, borderBottom:`2px solid ${primary}` }}>
                <td colSpan={4} style={{ padding:'6px 8px', fontSize:10, fontWeight:900, textTransform:'uppercase', letterSpacing:.5, color:primary }}>Total Brut</td>
                <td style={{ background:'#dbeafe' }} />
                <td style={{ padding:'6px 8px', fontSize:13, fontWeight:900, textAlign:'right', fontFamily:'monospace', color:primary, background:'#dbeafe' }}>{fmt(brutGains)}</td>
                <td style={{ background:'#dbeafe' }} /><td style={{ background:'#dbeafe' }} /><td style={{ background:'#dbeafe' }} />
              </tr>

              <SectionLabel color="#92400e" bg="#fef3c7" border="#fcd34d">Cotisations &amp; Prélèvements</SectionLabel>
              {cotisLines.map((item:any, idx:number) => {
                const { tauxPat: _tauxPat, retPat: _retPat } = getEmpColsForItem(item, empItems, payroll);
                return (
                  <tr key={item.id??idx} style={{ background: idx%2===0?'#fffbeb':'#fef9ee' }}>
                    <td style={{ ...CC, color:'#333', fontSize:9 }}>{300+idx}</td>
                    <td style={C}>{item.label}</td>
                    <td style={CR} /><td style={CR}>{item.base?fmt(item.base):''}</td>
                    <td style={{ ...CC, fontWeight:700, fontSize:9 }}>{item.rate?(Number(item.rate)*100).toFixed(3):'—'}</td>
                    <td style={{ ...C, background:'#f0fdf4' }} />
                    <td style={{ ...CR, fontWeight:700, color:'#991b1b', background:'#fef2f2' }}>{fmt(item.amount)}</td>
                    <td style={{ ...CC, fontWeight:700, fontSize:9, background:'#faf5ff', color:'#6d28d9' }}>{_tauxPat}</td>
                    <td style={{ ...CR, fontWeight:700, color:'#7c3aed', background:'#faf5ff' }}>{_retPat}</td>
                  </tr>
                );
              })}

              {/* Total Cotisations */}
              <tr style={{ background:'#fef3c7', borderTop:'1.5px solid #d97706', borderBottom:'1.5px solid #d97706' }}>
                <td colSpan={4} style={{ padding:'6px 8px', fontSize:10, fontWeight:900, textTransform:'uppercase', letterSpacing:.5, color:'#92400e' }}>Total Cotisations</td>
                <td style={{ background:'#fef3c7' }} /><td style={{ background:'#fef3c7' }} />
                <td style={{ padding:'6px 8px', fontSize:13, fontWeight:900, textAlign:'right', fontFamily:'monospace', color:'#991b1b' }}>{fmt(totalCotisSal)}</td>
                <td style={{ background:'#fef3c7' }} />
                <td style={{ padding:'6px 8px', fontSize:13, fontWeight:900, textAlign:'right', fontFamily:'monospace', color:'#7c3aed', background:'#fef3c7' }}>{fmt(totalCotisPat)}</td>
              </tr>

              {indemLines.length > 0 && <SectionLabel color="#166534" bg="#f0fdf4" border="#bbf7d0">Indemnités &amp; Avantages (hors brut)</SectionLabel>}
              {indemLines.map((item:any, idx:number) => (
                <tr key={item.id??idx} style={{ background: idx%2===0?'#f9fffe':'#f0fdf4' }}>
                  <td style={{ ...CC, color:'#333', fontSize:9 }}>{400+idx}</td>
                  <td style={C}>{item.label}</td>
                  <td style={CR}>{payroll.workedDays?fmt(payroll.workedDays):''}</td>
                  <td style={CR}>{item.base?fmt(item.base):''}</td>
                  <td style={{ ...CC, fontSize:9, color:'#333' }}>—</td>
                  <td style={{ ...CR, fontWeight:700, color:'#166534', background:'#f0fdf4' }}>{fmt(item.amount)}</td>
                  <td style={{ ...C, background:'#fef2f2' }} />
                  <td style={{ ...C, background:'#faf5ff' }} /><td style={{ ...C, background:'#faf5ff' }} />
                </tr>
              ))}

              {payroll.absenceDeduction ? (
                <tr style={{ background:'#fff8f8' }}>
                  <td style={{ ...CC, color:'#333', fontSize:9 }}>ABS</td>
                  <td style={C}>Retenue absence</td>
                  <td style={CR}>{payroll.absenceDays??0}</td>
                  <td style={CR}/><td style={CC}/>
                  <td style={{ ...C, background:'#f0fdf4' }}/>
                  <td style={{ ...CR, fontWeight:700, color:'#991b1b', background:'#fef2f2' }}>{fmt(payroll.absenceDeduction)}</td>
                  <td style={{ ...C, background:'#faf5ff' }}/><td style={{ ...C, background:'#faf5ff' }}/>
                </tr>
              ) : null}

              {/* Totaux finaux */}
              <tr style={{ borderTop:`2px solid ${primary}`, background:'#f8fafc' }}>
                <td style={{ ...CC, color:'#333', fontSize:9 }}>990</td>
                <td style={{ ...C, fontWeight:900, fontSize:11 }}>TOTAL GAINS</td>
                <td style={CR}/><td style={CR}/><td style={CC}/>
                <td style={{ ...CR, fontWeight:900, fontSize:12, color:'#166534', background:'#f0fdf4' }}>{fmt(totalGainsRow)}</td>
                <td style={{ ...C, background:'#fef2f2' }}/><td style={{ ...C, background:'#faf5ff' }}/><td style={{ ...C, background:'#faf5ff' }}/>
              </tr>
              <tr style={{ background:'#f8fafc' }}>
                <td style={{ ...CC, color:'#333', fontSize:9 }}>995</td>
                <td style={{ ...C, fontWeight:900, fontSize:11 }}>TOTAL RETENUES</td>
                <td style={CR}/><td style={CR}/><td style={CC}/>
                <td style={{ ...C, background:'#f0fdf4' }}/>
                <td style={{ ...CR, fontWeight:900, fontSize:12, color:'#991b1b', background:'#fef2f2' }}>{fmt(totalCotisSal)}</td>
                <td style={{ ...C, background:'#faf5ff' }}/><td style={{ ...C, background:'#faf5ff' }}/>
              </tr>

            </tbody>
          </table>
        </div>

        {/* ── CUMULS + NET ── */}
        <div className="corp-no-break" style={{ padding:'0 24px', marginTop:8 }}>
          <div style={{ display:'flex', alignItems:'stretch', borderTop:`2px solid ${primary}` }}>
            <table style={{ flex:1, borderCollapse:'collapse' }}>
              <thead>
                <tr>
                  <th style={{ background:'#334155', color:'#fff', fontWeight:700, fontSize:8, padding:'4px 8px', textAlign:'left', width:55 }}></th>
                  {cumCols.map(c => <th key={c.label} style={{ background:'#334155', color:'#fff', fontWeight:700, fontSize:8, padding:'4px 6px', textAlign:'center', whiteSpace:'nowrap' }}>{c.label}</th>)}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ border:'1px solid #e2e8f0', fontSize:9, fontWeight:700, background:'#f1f5f9', padding:'4px 8px' }}>Période</td>
                  {cumCols.map(c => <td key={c.label} style={{ border:'1px solid #e2e8f0', fontSize:9, textAlign:'center', padding:'4px 6px', fontFamily:'monospace', fontWeight:600, color:'#1e293b' }}>{c.period!=null?fmt(c.period):'0'}</td>)}
                </tr>
                <tr>
                  <td style={{ border:'1px solid #e2e8f0', fontSize:9, fontWeight:700, background:'#f1f5f9', padding:'4px 8px' }}>Année</td>
                  {cumCols.map(c => <td key={c.label} style={{ border:'1px solid #e2e8f0', fontSize:9, textAlign:'center', padding:'4px 6px', fontFamily:'monospace', color:'#333' }}>{c.year!=null?fmt(c.year):'0'}</td>)}
                </tr>
              </tbody>
            </table>
            <div style={{ background:primary, color:'#fff', display:'flex', flexDirection:'column', justifyContent:'center', alignItems:'center', minWidth:130, padding:'10px 16px', flexShrink:0 }}>
              <div style={{ fontSize:8, fontWeight:700, textTransform:'uppercase', letterSpacing:2, opacity:.7, marginBottom:4, whiteSpace:'nowrap' }}>Net à payer</div>
              <div style={{ fontSize:20, fontWeight:900, fontFamily:'monospace', letterSpacing:1, whiteSpace:'nowrap' }}>{fmt(netSalary)}</div>
              <div style={{ fontSize:8, opacity:.6, marginTop:2 }}>FCFA</div>
            </div>
          </div>
        </div>

        {/* Message employeur optionnel */}
        {tpl.style.footerMessage && (
          <div style={{ padding:'6px 24px', borderTop:'1px solid #e2e8f0', marginTop:6, fontSize:9, fontStyle:'italic', textAlign:'center', color:'#333' }}>
            {tpl.style.footerMessage}
          </div>
        )}

        {/* ── SIGNATURES ── */}
        <div className="corp-no-break" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:30, padding:'14px 24px 10px', borderTop:'1px solid #e2e8f0', marginTop:8 }}>
          {[{ label:"Signature de l'Employé(e)", sub:'Lu et approuvé' }, { label:"Signature et cachet de l'Employeur", sub:'Cachet &amp; signature obligatoire' }].map(s => (
            <div key={s.label} style={{ textAlign:'center' }}>
              <div style={{ fontSize:10, fontWeight:700, color:primary, marginBottom:8 }}>{s.label}</div>
              <div style={{ height:48, borderBottom:`2px solid ${primary}` }} />
              <div style={{ fontSize:8, color:'#444', marginTop:4 }} dangerouslySetInnerHTML={{ __html:s.sub }} />
            </div>
          ))}
        </div>

        {/* ── PIED DE PAGE ── */}
        <div style={{ background:'#f8fafc', borderTop:`3px solid ${primary}`, padding:'8px 24px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div style={{ fontSize:8, color:'#333' }}>Code du Travail — Loi n°45-75 · CNSS 4% salarié · ITS barème 2026 · SMIG 70 400 FCFA</div>
          <div style={{ fontSize:8, fontWeight:700, color:primary, letterSpacing:1 }}>KONZARH · Généré automatiquement</div>
        </div>

        <div className="bulletin-legal-corp" style={{ padding:'4px 24px' }}>
          <div style={{ fontSize:8, color:'#444', textAlign:'center' }}>ITS 2026 barème progressif · CNSS 4% · SMIG 70 400 FCFA · KonzaRH</div>
        </div>

      </div>
    </>
  );
}