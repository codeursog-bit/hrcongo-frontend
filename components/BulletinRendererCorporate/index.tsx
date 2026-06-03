'use client';

// ============================================================================
// components/BulletinRendererCorporate/index.tsx
//
// ✅ Corrections 2026-06 complètes (idem Admin + Default) :
//  1. fmtTaux masque rate=1
//  2. SALAIRE BRUT = ligne pleine largeur seule (colSpan 9)
//  3. ABS_DEDUCT supprimé du tableau
//  4. Absences en-tête : uniquement si absenceDays > 0
//  5. CNSS patronale : 3 lignes distinctes (Pension 8% / Famille 10,03% / AT 2,25%)
//  6. TUS DGI + CNSS dans colonnes patronales
//  7. H.suppl cumuls : heures réelles, sanity ≤ 300, sans doublon
//  8. Base Congés cumuls : '—'
//  9. Total Gains = Brut + Indemnités
// 10. Total Cotisations = CNSS + ITS + custom (sans prêts/avances)
// 11. Total Retenues = totalDeductions (cotis + prêts + avances)
// 12. Prêts/Avances dans section dédiée
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
const PAYMENT: Record<string,string> = { BANK_TRANSFER:'Virement bancaire', CASH:'Espèces', MOBILE_MONEY:'Mobile Money', CHECK:'Chèque' };
const CONTRACT: Record<string,string> = { CDI:'CDI', CDD:'CDD', STAGE:'Stage', CONSULTANT:'Consultant', PRESTATAIRE:'Prestataire', INTERIM:'Intérimaire', FREELANCE:'Freelance' };

const fmt = (v: any) => {
  const n = Math.round(Number(v) || 0);
  if (!isFinite(n) || Math.abs(n) > 999_999_999_999) return '—';
  return n.toLocaleString('fr-FR');
};

function fmtBase(item: any): string {
  if (item.base == null || Number(item.base) === 0) return '—';
  return Math.round(Number(item.base)).toLocaleString('fr-FR');
}

function fmtTaux(item: any): string {
  const qty = item.quantity;
  if (qty != null && Number(qty) !== 0) return String(qty);
  if (item.rate == null || Number(item.rate) === 0) return '—';
  const r = Number(item.rate);
  if (r === 1) return '—';
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
  return `${y} an${y > 1 ? 's' : ''} · ${m} mois`;
}
function formatDate(d?: string): string { return d ? new Date(d).toLocaleDateString('fr-FR') : '—'; }

export default function BulletinRendererCorporate({ payroll, template }: BulletinRendererCorporateProps) {
  const tpl     = template ?? getBaseTemplate('corporate');
  const primary = tpl.style.primaryColor || '#1e3a5f';
  const e       = (payroll.employee ?? {}) as any;
  const co      = (payroll.company  ?? {}) as any;
  const ytd     = (payroll as any).ytd;
  const monthLabel = MONTHS[(payroll.month ?? 1) - 1];

  const { gainItems, cotisItems, indemItems, retenueItems, empItems } = useMemo(
    () => classifyItems(payroll.items ?? []), [payroll.items]
  );

  // Filtrer ABS
  const gainFiltered  = gainItems.filter((i: any) => i.code !== 'ABS_DEDUCT' && i.code !== 'ABS_CONGE');
  const cotisFiltered = cotisItems.filter((i: any) => i.code !== 'ABS_DEDUCT' && i.code !== 'ABS_CONGE');

  const loanAdvItems  = retenueItems.filter((i: any) => i.code === 'LOAN' || i.code === 'ADVANCE');
  const otherRetItems = retenueItems.filter((i: any) => i.code !== 'LOAN' && i.code !== 'ADVANCE');

  // CNSS Patronale
  const cnssEmpPension  = Number(payroll.cnssEmployerPension  ?? 0);
  const cnssEmpFamily   = Number(payroll.cnssEmployerFamily   ?? 0);
  const cnssEmpAccident = Number(payroll.cnssEmployerAccident ?? 0);

  // TUS
  const tusDgi   = getTusDgi(empItems, payroll);
  const tusCnss  = getTusCnss(empItems, payroll);
  const ctaxEmps = getCtaxEmpItems(empItems);

  // Totaux
  const totalDed     = payroll.totalDeductions ?? 0;
  const totalLoanAdv = loanAdvItems.reduce((s: number, i: any) => s + Number(i.amount || 0), 0);
  const totalCotis   = totalDed - totalLoanAdv;
  const totalIndem   = indemItems.reduce((s: number, i: any) => s + Number(i.amount || 0), 0);
  const totalGains   = (payroll.grossSalary ?? 0) + totalIndem;
  const netSalary    = payroll.netSalary ?? 0;

  // H.suppl — sanity ≤ 300
  const rawOT    = Number(payroll.overtimeHours10??0)+Number(payroll.overtimeHours25??0)
                 + Number(payroll.overtimeHours50??0)+Number(payroll.overtimeHours100??0);
  const overTime = rawOT > 0 && rawOT <= 300 ? rawOT : null;

  const fullName = [e.firstName, e.lastName].filter(Boolean).join(' ');
  const cat      = [e.professionalCategory, e.echelon ? `Echelon ${e.echelon}` : ''].filter(Boolean).join(' ');

  let ref2 = 199;

  // ── Styles ──
  const TH = (extra?: React.CSSProperties): React.CSSProperties => ({
    background: '#1e293b', color: '#fff', fontWeight: 700, fontSize: 9,
    textTransform: 'uppercase' as const, letterSpacing: .5,
    padding: '7px 8px', textAlign: 'center' as const, ...extra,
  });
  const C  = (extra?: React.CSSProperties): React.CSSProperties => ({
    borderBottom: '1px solid #e2e8f0', padding: '5px 8px', fontSize: 10, verticalAlign: 'middle', ...extra,
  });
  const CR = (extra?: React.CSSProperties): React.CSSProperties => ({
    ...C(), textAlign: 'right' as const, fontFamily: 'monospace', ...extra,
  });
  const CC = (extra?: React.CSSProperties): React.CSSProperties => ({
    ...C(), textAlign: 'center' as const, ...extra,
  });

  const SecLabel = ({ color, bg, border, children }: any) => (
    <tr><td colSpan={9} style={{
      background: bg, padding: '4px 8px', fontSize: 8, fontWeight: 800,
      textTransform: 'uppercase' as const, letterSpacing: 1, color,
      borderTop: `1px solid ${border}`, borderBottom: `1px solid ${border}`,
    }}>{children}</td></tr>
  );

  const InfoRow = ({ label, val }: { label: string; val: string }) => (
    <div style={{ display:'grid', gridTemplateColumns:'115px 1fr', gap:'0 6px', marginBottom:2 }}>
      <span style={{ fontSize:9, color:'#555' }}>{label}</span>
      <span style={{ fontSize:9, fontWeight:600, color:'#1e293b' }}>{val}</span>
    </div>
  );

  const ytdNetImp = ytd ? (ytd.grossSalary - ytd.cnssSalarial) : null;
  const cumCols = [
    { label:'Salaire brut',   period: payroll.grossSalary,   year: ytd?.grossSalary     ?? null },
    { label:'Ch. salariales', period: payroll.cnssSalarial,  year: ytd?.cnssSalarial    ?? null },
    { label:'Ch. patronales', period: payroll.cnssEmployer ?? 0, year: ytd?.cnssEmployer ?? null },
    { label:'Avt. nature',    period: 0,                     year: 0 },
    { label:'Net imposable',  period: (payroll.grossSalary??0)-(payroll.cnssSalarial??0), year: ytdNetImp },
    { label:'H. travaillées', period: (payroll.workedDays??0)*8, year: ytd ? ytd.workedDays*8 : null },
    { label:'H. suppl.',      period: overTime,               year: null },
    { label:'Base Congés',    period: null,                   year: null },
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
          .corp-legal { display: none !important; }
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        }
      `}</style>

      <div id="bulletin-corp-root" style={{
        fontFamily: '"Segoe UI","Helvetica Neue",Arial,sans-serif',
        fontSize: 10, background: '#fff', color: '#000',
        width: '210mm', boxSizing: 'border-box' as const,
        padding: '28px 34px', margin: '0 auto',
      }}>

        {/* ── EN-TÊTE ─────────────────────────────────────────────────────── */}
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
              {(payroll as any).paymentDate ? `Paiement : ${formatDate((payroll as any).paymentDate)} · ` : ''}{PAYMENT[e.paymentMethod??'']??'Virement bancaire'}
            </div>
          </div>
        </div>

        {/* ── INFOS EMPLOYÉ 3 COL ─────────────────────────────────────────── */}
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
            <InfoRow label="Date d'embauche" val={formatDate(e.hireDate)} />
            <InfoRow label="Ancienneté"       val={seniority(e.hireDate)} />
            <InfoRow label="Etat civil"        val={MARITAL[e.maritalStatus??'']??'—'} />
            <InfoRow label="Nb. d'enfants"     val={String(e.numberOfChildren??0)} />
            <InfoRow label="N° CNSS"           val={e.cnssNumber||'—'} />
            <InfoRow label="Convention"        val={co.collectiveAgreement||'Commerce'} />
          </div>
          <div style={{ padding:'12px 16px' }}>
            <div style={{ fontSize:8, fontWeight:700, textTransform:'uppercase', letterSpacing:1, color:'#333', marginBottom:7 }}>Période de travail</div>
            <InfoRow label="Site"              val={co.city||co.address||'Administration'} />
            <InfoRow label="Jours ouvrables"   val={`${payroll.workDays??26} j`} />
            <InfoRow label="Jours travaillés"  val={payroll.workedDays != null ? `${payroll.workedDays} j` : '—'} />
            {/* Absences : uniquement si > 0 */}
            {Number(payroll.absenceDays??0) > 0 && <InfoRow label="Absences" val={`${payroll.absenceDays} j`} />}
            {/* H.suppl : uniquement si > 0 et ≤ 300h */}
            {overTime != null && <InfoRow label="Heures suppl." val={`${overTime} h`} />}
          </div>
        </div>

        {/* ── TABLEAU PAIE ────────────────────────────────────────────────── */}
        <div className="corp-no-break" style={{ marginTop:12 }}>
          <table style={{ width:'100%', borderCollapse:'collapse', tableLayout:'fixed' }}>
            <colgroup>
              <col style={{ width:'5%'  }}/><col style={{ width:'31%' }}/><col style={{ width:'9%'  }}/>
              <col style={{ width:'7%'  }}/><col style={{ width:'13%' }}/><col style={{ width:'12%' }}/>
              <col style={{ width:'5%'  }}/><col style={{ width:'12%' }}/>
              <col style={{ width:'6%'  }}/>
            </colgroup>
            <thead>
              <tr>
                <th style={TH()}>N°</th>
                <th style={TH({ textAlign:'left' })}>Désignation</th>
                <th style={TH()}>Base</th>
                <th style={TH()}>Taux</th>
                <th style={TH({ background:'#1a472a' })}>Gain</th>
                <th style={TH({ background:'#7f1d1d' })}>Retenue</th>
                <th style={TH({ background:'#3b0764' })}>T.p.</th>
                <th style={TH({ background:'#3b0764' })}>Ret. pat.</th>
                <th style={TH({ background:'#1e293b' })} />
              </tr>
            </thead>
            <tbody>

              {/* ── GAINS ─────────────────────────────────────────────────── */}
              <SecLabel color="#3730a3" bg="#eef2ff" border="#c7d2fe">Rémunérations &amp; Primes</SecLabel>
              {gainFiltered.map((item: any, idx: number) => (
                <tr key={item.id??item.code} style={{ background: idx%2===0?'#fff':'#fafafa' }}>
                  <td style={CC({ color:'#333', fontSize:9 })}>{(idx+1)*10}</td>
                  <td style={C({ fontWeight: item.code==='SAL_BASE'?700:400 })}>{item.label}</td>
                  <td style={CR()}>{fmtBase(item)}</td>
                  <td style={CC({ fontSize:9 })}>{fmtTaux(item)}</td>
                  <td style={CR({ fontWeight:700, color:'#166534', background:'#f0fdf4' })}>{fmt(item.amount)}</td>
                  <td style={C({ background:'#fef2f2' })} />
                  <td style={C({ background:'#faf5ff' })} />
                  <td style={C({ background:'#faf5ff' })} />
                  <td style={C()} />
                </tr>
              ))}

              {/* SALAIRE BRUT — pleine largeur */}
              <tr style={{ background:'#dbeafe', borderTop:`2px solid ${primary}`, borderBottom:`2px solid ${primary}` }}>
                <td colSpan={9} style={{ padding:'7px 12px', fontSize:11, fontWeight:900, textTransform:'uppercase', letterSpacing:1.5, color:primary, textAlign:'center' }}>
                  Salaire brut &nbsp;&mdash;&nbsp; {fmt(payroll.grossSalary)} F
                </td>
              </tr>

              {/* ── COTISATIONS SALARIALES ────────────────────────────────── */}
              <SecLabel color="#92400e" bg="#fef3c7" border="#fcd34d">Cotisations &amp; Prélèvements obligatoires</SecLabel>
              {cotisFiltered.map((item: any, idx: number) => {
                ref2++;
                const taux = item.rate
                  ? `${(Number(item.rate)*100).toFixed(Number(item.rate)<0.1?3:2).replace('.',',')}%`
                  : (item.code==='ITS'||item.code==='BNC_SOURCE' ? 'Barème' : '—');
                return (
                  <tr key={item.id??item.code} style={{ background: idx%2===0?'#fffbeb':'#fef9ee' }}>
                    <td style={CC({ color:'#333', fontSize:9 })}>{ref2}</td>
                    <td style={C()}>{item.label}</td>
                    <td style={CR()}>{item.base ? fmt(item.base) : '—'}</td>
                    <td style={CC({ fontWeight:700, fontSize:9 })}>{taux}</td>
                    <td style={C({ background:'#f0fdf4' })} />
                    <td style={CR({ fontWeight:700, color:'#991b1b', background:'#fef2f2' })}>{fmt(item.amount)}</td>
                    <td style={CC({ background:'#faf5ff' })}>—</td>
                    <td style={CR({ background:'#faf5ff' })}>—</td>
                    <td style={C()} />
                  </tr>
                );
              })}

              {/* CNSS Patronale — 3 branches */}
              {cnssEmpPension > 0 && (() => { ref2++; return (
                <tr key="cnss_pat_pen" style={{ background:'#fdf5ff' }}>
                  <td style={CC({ color:'#555', fontSize:9 })}>{ref2}</td>
                  <td style={C({ fontStyle:'italic', fontSize:9 })}>CNSS patronale — Pension vieillesse</td>
                  <td style={CR({ fontSize:9 })}>{fmt(payroll.grossSalary)}</td>
                  <td style={CC({ fontWeight:700, fontSize:9 })}>8%</td>
                  <td style={C({ background:'#f0fdf4' })} />
                  <td style={C({ background:'#fef2f2' })} />
                  <td style={CC({ fontWeight:700, fontSize:9, color:'#7c3aed', background:'#faf5ff' })}>8%</td>
                  <td style={CR({ fontWeight:700, color:'#7c3aed', background:'#faf5ff' })}>{fmt(cnssEmpPension)}</td>
                  <td style={C()} />
                </tr>
              ); })()}
              {cnssEmpFamily > 0 && (() => { ref2++; return (
                <tr key="cnss_pat_fam" style={{ background:'#fdf5ff' }}>
                  <td style={CC({ color:'#555', fontSize:9 })}>{ref2}</td>
                  <td style={C({ fontStyle:'italic', fontSize:9 })}>CNSS patronale — Prestations familiales</td>
                  <td style={CR({ fontSize:9 })}>{fmt(payroll.grossSalary)}</td>
                  <td style={CC({ fontWeight:700, fontSize:9 })}>10,03%</td>
                  <td style={C({ background:'#f0fdf4' })} />
                  <td style={C({ background:'#fef2f2' })} />
                  <td style={CC({ fontWeight:700, fontSize:9, color:'#7c3aed', background:'#faf5ff' })}>10,03%</td>
                  <td style={CR({ fontWeight:700, color:'#7c3aed', background:'#faf5ff' })}>{fmt(cnssEmpFamily)}</td>
                  <td style={C()} />
                </tr>
              ); })()}
              {cnssEmpAccident > 0 && (() => { ref2++; return (
                <tr key="cnss_pat_at" style={{ background:'#fdf5ff' }}>
                  <td style={CC({ color:'#555', fontSize:9 })}>{ref2}</td>
                  <td style={C({ fontStyle:'italic', fontSize:9 })}>CNSS patronale — Accidents du travail</td>
                  <td style={CR({ fontSize:9 })}>{fmt(payroll.grossSalary)}</td>
                  <td style={CC({ fontWeight:700, fontSize:9 })}>2,25%</td>
                  <td style={C({ background:'#f0fdf4' })} />
                  <td style={C({ background:'#fef2f2' })} />
                  <td style={CC({ fontWeight:700, fontSize:9, color:'#7c3aed', background:'#faf5ff' })}>2,25%</td>
                  <td style={CR({ fontWeight:700, color:'#7c3aed', background:'#faf5ff' })}>{fmt(cnssEmpAccident)}</td>
                  <td style={C()} />
                </tr>
              ); })()}

              {/* TUS DGI + CNSS */}
              {tusDgi > 0 && (() => { ref2++; return (
                <tr key="tus_dgi" style={{ background:'#fdf5ff' }}>
                  <td style={CC({ color:'#555', fontSize:9 })}>{ref2}</td>
                  <td style={C({ fontStyle:'italic', fontSize:9 })}>TUS — Part DGI (2,025%)</td>
                  <td style={CR({ fontSize:9 })}>{fmt(payroll.grossSalary)}</td>
                  <td style={CC({ fontWeight:700, fontSize:9 })}>2,025%</td>
                  <td style={C({ background:'#f0fdf4' })} />
                  <td style={C({ background:'#fef2f2' })} />
                  <td style={CC({ color:'#7c3aed', background:'#faf5ff' })}>—</td>
                  <td style={CR({ fontWeight:700, color:'#7c3aed', background:'#faf5ff' })}>{fmt(tusDgi)}</td>
                  <td style={C()} />
                </tr>
              ); })()}
              {tusCnss > 0 && (() => { ref2++; return (
                <tr key="tus_cnss" style={{ background:'#fdf5ff' }}>
                  <td style={CC({ color:'#555', fontSize:9 })}>{ref2}</td>
                  <td style={C({ fontStyle:'italic', fontSize:9 })}>TUS — Part CNSS (5,475%)</td>
                  <td style={CR({ fontSize:9 })}>{fmt(payroll.grossSalary)}</td>
                  <td style={CC({ fontWeight:700, fontSize:9 })}>5,475%</td>
                  <td style={C({ background:'#f0fdf4' })} />
                  <td style={C({ background:'#fef2f2' })} />
                  <td style={CC({ color:'#7c3aed', background:'#faf5ff' })}>—</td>
                  <td style={CR({ fontWeight:700, color:'#7c3aed', background:'#faf5ff' })}>{fmt(tusCnss)}</td>
                  <td style={C()} />
                </tr>
              ); })()}

              {/* CTAX_EMP custom */}
              {ctaxEmps.map((item: any) => { ref2++; return (
                <tr key={item.id??item.code} style={{ background:'#fdf5ff' }}>
                  <td style={CC({ color:'#555', fontSize:9 })}>{ref2}</td>
                  <td style={C({ fontStyle:'italic', fontSize:9 })}>{item.label}</td>
                  <td style={CR({ fontSize:9 })}>{item.base ? fmt(item.base) : '—'}</td>
                  <td style={CC({ fontSize:9 })}>—</td>
                  <td style={C({ background:'#f0fdf4' })} />
                  <td style={C({ background:'#fef2f2' })} />
                  <td style={CC({ color:'#7c3aed', background:'#faf5ff' })}>—</td>
                  <td style={CR({ fontWeight:700, color:'#7c3aed', background:'#faf5ff' })}>{fmt(item.amount)}</td>
                  <td style={C()} />
                </tr>
              ); })}

              {/* TOTAL COTISATIONS — taxes uniquement */}
              <tr style={{ background:'#fef3c7', borderTop:'1.5px solid #d97706', borderBottom:'1.5px solid #d97706' }}>
                <td colSpan={5} style={{ padding:'6px 8px', fontSize:10, fontWeight:900, textTransform:'uppercase', letterSpacing:.5, color:'#92400e' }}>
                  Total Cotisations &nbsp;(CNSS + ITS + Taxes)
                </td>
                <td style={{ padding:'6px 8px', fontSize:13, fontWeight:900, textAlign:'right', fontFamily:'monospace', color:'#991b1b' }}>
                  {fmt(totalCotis)}
                </td>
                <td colSpan={2} style={{ padding:'6px 8px', fontSize:13, fontWeight:900, textAlign:'right', fontFamily:'monospace', color:'#7c3aed', background:'#faf0ff' }}>
                  {payroll.cnssEmployer ? fmt(payroll.cnssEmployer) : '—'}
                </td>
                <td style={{ background:'#fef3c7' }} />
              </tr>

              {/* ── INDEMNITÉS HORS BRUT ──────────────────────────────────── */}
              {indemItems.length > 0 && <>
                <SecLabel color="#166534" bg="#f0fdf4" border="#bbf7d0">Indemnités &amp; Avantages (non soumis à cotisations)</SecLabel>
                {indemItems.map((item: any, idx: number) => (
                  <tr key={item.id??item.code} style={{ background: idx%2===0?'#f9fffe':'#f0fdf4' }}>
                    <td style={CC({ color:'#333', fontSize:9 })}>{400+idx}</td>
                    <td style={C()}>{item.label}</td>
                    <td style={CR()}>{fmtBase(item)}</td>
                    <td style={CC({ fontSize:9 })}>{fmtTaux(item)}</td>
                    <td style={CR({ fontWeight:700, color:'#166534', background:'#f0fdf4' })}>{fmt(item.amount)}</td>
                    <td style={C({ background:'#fef2f2' })} />
                    <td style={C({ background:'#faf5ff' })} />
                    <td style={C({ background:'#faf5ff' })} />
                    <td style={C()} />
                  </tr>
                ))}
              </>}

              {/* ── PRÊTS & AVANCES ───────────────────────────────────────── */}
              {loanAdvItems.length > 0 && <>
                <SecLabel color="#7c2d12" bg="#fff7ed" border="#fed7aa">Prêts &amp; Avances sur salaire</SecLabel>
                {loanAdvItems.map((item: any, idx: number) => (
                  <tr key={item.id??item.code} style={{ background: idx%2===0?'#fff7ed':'#fef3e2' }}>
                    <td style={CC({ color:'#333', fontSize:9 })}>{700+idx}</td>
                    <td style={C()}>{item.label}</td>
                    <td style={CR()}>—</td>
                    <td style={CC({ fontSize:9 })}>—</td>
                    <td style={C({ background:'#f0fdf4' })} />
                    <td style={CR({ fontWeight:700, color:'#991b1b', background:'#fef2f2' })}>{fmt(item.amount)}</td>
                    <td style={C({ background:'#faf5ff' })} />
                    <td style={C({ background:'#faf5ff' })} />
                    <td style={C()} />
                  </tr>
                ))}
              </>}

              {otherRetItems.length > 0 && <>
                {loanAdvItems.length === 0 && <SecLabel color="#7c2d12" bg="#fff7ed" border="#fed7aa">Retenues diverses</SecLabel>}
                {otherRetItems.map((item: any, idx: number) => (
                  <tr key={item.id??item.code} style={{ background: idx%2===0?'#fff7ed':'#fef3e2' }}>
                    <td style={CC({ color:'#333', fontSize:9 })}>{750+idx}</td>
                    <td style={C()}>{item.label}</td>
                    <td style={CR()}>{fmtBase(item)}</td>
                    <td style={CC({ fontSize:9 })}>{fmtTaux(item)}</td>
                    <td style={C({ background:'#f0fdf4' })} />
                    <td style={CR({ fontWeight:700, color:'#991b1b', background:'#fef2f2' })}>{fmt(item.amount)}</td>
                    <td style={C({ background:'#faf5ff' })} />
                    <td style={C({ background:'#faf5ff' })} />
                    <td style={C()} />
                  </tr>
                ))}
              </>}

              {/* ── TOTAUX FINAUX ─────────────────────────────────────────── */}
              <tr style={{ borderTop:`2px solid ${primary}`, background:'#f8fafc' }}>
                <td style={CC({ color:'#333', fontSize:9 })}>990</td>
                <td style={C({ fontWeight:900, fontSize:11 })}>
                  TOTAL GAINS{totalIndem > 0 ? ` (Brut + Indemnités)` : ''}
                </td>
                <td style={CR()} /><td style={CC()} />
                <td style={CR({ fontWeight:900, fontSize:12, color:'#166534', background:'#f0fdf4' })}>{fmt(totalGains)}</td>
                <td style={C({ background:'#fef2f2' })} />
                <td style={C({ background:'#faf5ff' })} />
                <td style={C({ background:'#faf5ff' })} />
                <td style={C()} />
              </tr>
              <tr style={{ background:'#f8fafc' }}>
                <td style={CC({ color:'#333', fontSize:9 })}>995</td>
                <td style={C({ fontWeight:900, fontSize:11 })}>
                  TOTAL RETENUES{totalLoanAdv > 0 ? ` (Cotis. + Prêts/Avances)` : ''}
                </td>
                <td style={CR()} /><td style={CC()} />
                <td style={C({ background:'#f0fdf4' })} />
                <td style={CR({ fontWeight:900, fontSize:12, color:'#991b1b', background:'#fef2f2' })}>{fmt(totalDed)}</td>
                <td style={C({ background:'#faf5ff' })} />
                <td style={C({ background:'#faf5ff' })} />
                <td style={C()} />
              </tr>

            </tbody>
          </table>
        </div>

        {/* ── CUMULS + NET ─────────────────────────────────────────────────── */}
        <div className="corp-no-break" style={{ marginTop:8 }}>
          <div style={{ display:'flex', alignItems:'stretch', borderTop:`2px solid ${primary}` }}>
            <table style={{ flex:1, borderCollapse:'collapse' }}>
              <thead>
                <tr>
                  <th style={{ background:'#334155', color:'#fff', fontWeight:700, fontSize:8, padding:'4px 8px', textAlign:'left', width:55, border:'0.5px solid #000' }} />
                  {cumCols.map(c => (
                    <th key={c.label} style={{ background:'#334155', color:'#fff', fontWeight:700, fontSize:8, padding:'4px 6px', textAlign:'center', whiteSpace:'nowrap', border:'0.5px solid #000' }}>
                      {c.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ border:'1px solid #e2e8f0', fontSize:9, fontWeight:700, background:'#f1f5f9', padding:'4px 8px' }}>Période</td>
                  {cumCols.map(c => (
                    <td key={c.label} style={{ border:'1px solid #e2e8f0', fontSize:9, textAlign:'center', padding:'4px 6px', fontFamily:'monospace', fontWeight:600, color:'#1e293b' }}>
                      {c.period != null ? fmt(c.period) : '—'}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td style={{ border:'1px solid #e2e8f0', fontSize:9, fontWeight:700, background:'#f1f5f9', padding:'4px 8px' }}>Année</td>
                  {cumCols.map(c => (
                    <td key={c.label} style={{ border:'1px solid #e2e8f0', fontSize:9, textAlign:'center', padding:'4px 6px', fontFamily:'monospace', color:'#333' }}>
                      {c.year != null ? fmt(c.year) : '—'}
                    </td>
                  ))}
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

        {/* Message employeur */}
        {tpl.style.footerMessage && (
          <div style={{ padding:'6px 0', borderTop:'1px solid #e2e8f0', marginTop:6, fontSize:9, fontStyle:'italic', textAlign:'center', color:'#333' }}>
            {tpl.style.footerMessage}
          </div>
        )}

        {/* ── SIGNATURES ─────────────────────────────────────────────────── */}
        <div className="corp-no-break" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:30, padding:'14px 0 10px', borderTop:'1px solid #e2e8f0', marginTop:8 }}>
          {[
            { label:"Signature de l'Employé(e)", sub:'Lu et approuvé' },
            { label:"Signature et cachet de l'Employeur", sub:'Cachet & signature obligatoire' },
          ].map(s => (
            <div key={s.label} style={{ textAlign:'center' }}>
              <div style={{ fontSize:10, fontWeight:700, color:primary, marginBottom:8 }}>{s.label}</div>
              <div style={{ height:48, borderBottom:`2px solid ${primary}` }} />
              <div style={{ fontSize:8, color:'#444', marginTop:4 }}>{s.sub}</div>
            </div>
          ))}
        </div>

        {/* ── PIED DE PAGE ──────────────────────────────────────────────── */}
        <div style={{ background:'#f8fafc', borderTop:`3px solid ${primary}`, padding:'8px 0', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div style={{ fontSize:8, color:'#333' }}>Code du Travail — Loi n°45-75 · CNSS 4% salarié · ITS barème 2026 · SMIG 70 400 FCFA</div>
          <div style={{ fontSize:8, fontWeight:700, color:primary, letterSpacing:1 }}>KONZARH · Généré automatiquement</div>
        </div>

        <div className="corp-legal" style={{ paddingTop:4 }}>
          <div style={{ fontSize:8, color:'#444', textAlign:'center' }}>ITS 2026 barème progressif · CNSS 4% · SMIG 70 400 FCFA · KonzaRH</div>
        </div>

      </div>
    </>
  );
}