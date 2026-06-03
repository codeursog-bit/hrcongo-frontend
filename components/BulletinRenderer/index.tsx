'use client';

// ============================================================================
// components/BulletinRenderer/index.tsx  — Template DEFAULT (IESM style)
//
// ✅ Corrections 2026-06 complètes :
//  1. Base/Taux transparents — fmtTaux masque taux=1
//  2. SALAIRE BRUT = ligne pleine largeur seule (colSpan 8)
//  3. ABS_DEDUCT supprimé du tableau (info dans l'en-tête si absenceDays > 0)
//  4. CNSS patronale : 3 lignes distinctes (Pension 8% / Famille 10,03% / AT 2,25%)
//  5. TUS DGI + CNSS affichés dans colonnes patronales
//  6. Absences en-tête : uniquement si > 0
//  7. H.suppl cumuls : heures réelles, sanity check ≤ 300
//  8. Base Congés cumuls : '—' (calculé côté générateur, pas front)
//  9. Total Gains = Brut + Indemnités
// 10. Total Cotisations = CNSS + ITS + custom (sans prêts/avances)
// 11. Total Retenues = totalDeductions (cotis + prêts + avances)
// 12. Prêts/Avances dans section RETENUES DIVERSES
// ============================================================================

import React, { useMemo } from 'react';
import type { BulletinPayroll, BulletinTemplateConfig } from '@/types/bulletin-template';
import { getBaseTemplate } from '@/lib/bulletin-templates';
import { classifyItems } from '@/lib/bulletin-items-classifier';
import BulletinRendererCorporate from '@/components/BulletinRendererCorporate';
import BulletinRendererAdmin     from '@/components/BulletinRendererAdmin';

export interface BulletinRendererProps {
  payroll:      BulletinPayroll;
  template?:    BulletinTemplateConfig;
  previewMode?: boolean;
}

export default function BulletinRendererDispatcher(props: BulletinRendererProps) {
  const templateId = (props.template ?? getBaseTemplate('default')).templateId;
  if (templateId === 'corporate') return <BulletinRendererCorporate {...props} />;
  if (templateId === 'admin')     return <BulletinRendererAdmin     {...props} />;
  return <BulletinRendererDefault {...props} />;
}

const MONTHS = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
const MARITAL: Record<string,string> = {
  SINGLE:'Célibataire', MARRIED:'Marié(e)', DIVORCED:'Divorcé(e)',
  WIDOWED:'Veuf/Veuve', COHABITING:'Concubinage',
};
const PAYMENT: Record<string,string> = {
  BANK_TRANSFER:'Virement', CASH:'Espèces', MOBILE_MONEY:'Mobile Money', CHECK:'Chèque',
};
const CONTRACT: Record<string,string> = {
  CDI:'CDI', CDD:'CDD', STAGE:'Stage', CONSULTANT:'Consultant',
  PRESTATAIRE:'Prestataire', INTERIM:'Intérimaire', FREELANCE:'Freelance',
};

const fmt = (v: any) => {
  const n = Math.round(Number(v) || 0);
  if (!isFinite(n) || Math.abs(n) > 999_999_999_999) return '—';
  return n.toLocaleString('fr-FR');
};

function seniority(d?: string) {
  if (!d) return { y: 0, m: 0 };
  const h = new Date(d), n = new Date();
  let y = n.getFullYear()-h.getFullYear(), m = n.getMonth()-h.getMonth();
  if (m < 0) { y--; m += 12; }
  return { y, m };
}
function fmtDate(d?: string) { return d ? new Date(d).toLocaleDateString('fr-FR') : '—'; }

function fmtBase(item: any): string {
  if (item.base == null || Number(item.base) === 0) return '—';
  return fmt(item.base);
}

function fmtTaux(item: any): string {
  const qty = item.quantity;
  if (qty != null && Number(qty) !== 0) return String(qty);
  if (item.rate == null || Number(item.rate) === 0) return '—';
  const r = Number(item.rate);
  if (r === 1) return '—'; // montant fixe direct — pas de multiplicateur à afficher
  if (r > 1 && r <= 3) return `×${r.toFixed(2).replace('.', ',')}`;
  if (r > 0 && r < 1) {
    const pct = r * 100;
    const str = pct % 1 === 0 ? pct.toFixed(0) : pct.toFixed(3).replace(/0+$/, '');
    return `${str}%`;
  }
  return String(r);
}

// ─── Styles IESM ─────────────────────────────────────────────────────────────
const BD = '1px solid #000';

const td = (extra?: React.CSSProperties): React.CSSProperties => ({
  border: BD, padding: '2.5px 4px', fontSize: 9, verticalAlign: 'middle', ...extra,
});
const tdR = (extra?: React.CSSProperties): React.CSSProperties => ({
  ...td(), textAlign: 'right', fontFamily: 'Courier New, monospace', ...extra,
});
const tdC = (extra?: React.CSSProperties): React.CSSProperties => ({
  ...td(), textAlign: 'center', ...extra,
});
const tdPat = (extra?: React.CSSProperties): React.CSSProperties => ({
  ...tdR(), background: '#f5f5f5', ...extra,
});
const tdPatC = (extra?: React.CSSProperties): React.CSSProperties => ({
  ...tdC(), background: '#f5f5f5', ...extra,
});
const th = (extra?: React.CSSProperties): React.CSSProperties => ({
  border: BD, padding: '3px 4px', fontSize: 8.5, fontWeight: 700,
  textAlign: 'center', background: '#d0d0d0', ...extra,
});
const thPat = (extra?: React.CSSProperties): React.CSSProperties => ({
  ...th(), background: '#c0c0c0', ...extra,
});

function BulletinRendererDefault({ payroll, template }: BulletinRendererProps) {
  const tpl = template ?? getBaseTemplate('default');
  const e   = (payroll.employee ?? {}) as any;
  const co  = (payroll.company  ?? {}) as any;
  const ytd = (payroll as any).ytd;

  const monthLabel = MONTHS[(payroll.month ?? 1) - 1];
  const sen        = seniority(e.hireDate);
  const fullName   = [e.firstName, e.lastName].filter(Boolean).join(' ');
  const cat        = [e.professionalCategory, e.echelon ? `Cat ${e.echelon}` : ''].filter(Boolean).join(' ');

  const { gainItems, cotisItems, indemItems, retenueItems, empItems } = useMemo(
    () => classifyItems(payroll.items ?? []), [payroll.items]
  );

  // Filtrer ABS — info dans l'en-tête
  const gainFiltered   = gainItems.filter((i: any) => i.code !== 'ABS_DEDUCT' && i.code !== 'ABS_CONGE');
  const cotisFiltered  = cotisItems.filter((i: any) => i.code !== 'ABS_DEDUCT' && i.code !== 'ABS_CONGE');

  // Prêts/Avances = items DEDUCTION code LOAN ou ADVANCE
  const loanAdvItems   = retenueItems.filter((i: any) => i.code === 'LOAN' || i.code === 'ADVANCE');
  const otherRetItems  = retenueItems.filter((i: any) => i.code !== 'LOAN' && i.code !== 'ADVANCE');

  // CNSS patronale — branches depuis payroll
  const cnssEmpPension  = Number(payroll.cnssEmployerPension  ?? 0);
  const cnssEmpFamily   = Number(payroll.cnssEmployerFamily   ?? 0);
  const cnssEmpAccident = Number(payroll.cnssEmployerAccident ?? 0);

  // TUS depuis empItems
  const tusDgiItem  = empItems.find((i: any) => i.code === 'TUS_DGI');
  const tusCnssItem = empItems.find((i: any) => i.code === 'TUS_CNSS');
  const tusDgi      = tusDgiItem  ? Number((tusDgiItem  as any).empAmount ?? (tusDgiItem  as any).amount ?? 0) : Number(payroll.tusDgiAmount  ?? 0);
  const tusCnss     = tusCnssItem ? Number((tusCnssItem as any).empAmount ?? (tusCnssItem as any).amount ?? 0) : Number(payroll.tusCnssAmount ?? 0);

  // Totaux
  const totalDed     = payroll.totalDeductions ?? 0;
  const totalLoanAdv = loanAdvItems.reduce((s: number, i: any) => s + Number(i.amount || 0), 0);
  const totalCotis   = totalDed - totalLoanAdv;
  const totalIndem   = indemItems.reduce((s: number, i: any) => s + Number(i.amount || 0), 0);
  const totalGains   = (payroll.grossSalary ?? 0) + totalIndem;
  const netSalary    = payroll.netSalary ?? 0;

  // H.suppl sanity
  const rawOT    = Number(payroll.overtimeHours10??0)+Number(payroll.overtimeHours25??0)
                 + Number(payroll.overtimeHours50??0)+Number(payroll.overtimeHours100??0);
  const overTime = rawOT > 0 && rawOT <= 300 ? rawOT : null;

  // ── EN-TÊTE ──────────────────────────────────────────────────────────────────
  const Header = () => (
    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', borderBottom:'2px solid #000', paddingBottom:8, marginBottom:8 }}>
      <div style={{ display:'flex', gap:10, alignItems:'flex-start', flex:1 }}>
        {co.logo ? (
          <img src={co.logo} alt="Logo" style={{ width:68, height:68, objectFit:'contain', border:'1.5px solid #000', padding:3, flexShrink:0 }} />
        ) : (
          <div style={{ border:'2px solid #000', padding:'4px 8px', fontWeight:900, fontSize:12, letterSpacing:2, minWidth:80, textAlign:'center', flexShrink:0, lineHeight:1.3 }}>
            {(co.tradeName || co.legalName || 'ENTREPRISE').toUpperCase()}
          </div>
        )}
        <div style={{ fontSize:8.5, lineHeight:1.7, color:'#111' }}>
          {co.address && <div>{co.address}{co.city ? `, ${co.city}` : ''}</div>}
          {co.phone   && <div>Tél.{co.fax ? ` / Fax: ${co.phone} / ${co.fax}` : `: ${co.phone}`}</div>}
          {co.email   && <div>Email : {co.email}</div>}
          {co.rccmNumber && <div>RCCM : {co.rccmNumber}</div>}
          {co.nif     && <div>NIU : {co.nif}</div>}
        </div>
      </div>
      <div style={{ textAlign:'center', flexShrink:0, marginLeft:16 }}>
        <div style={{ fontSize:16, fontWeight:900, letterSpacing:4, textTransform:'uppercase', border:'2px solid #000', padding:'4px 12px' }}>
          BULLETIN DE PAIE
        </div>
        <div style={{ marginTop:5, fontSize:13, fontWeight:700 }}>{monthLabel} &nbsp; {payroll.year}</div>
        <div style={{ fontSize:8.5, marginTop:2, color:'#333' }}>
          {(payroll as any).paymentDate
            ? `Paiement le ${fmtDate((payroll as any).paymentDate)} par ${PAYMENT[e.paymentMethod??'']??'Virement'}`
            : `par ${PAYMENT[e.paymentMethod??'']??'Virement'}`
          }
        </div>
      </div>
    </div>
  );

  // ── INFOS EMPLOYÉ ─────────────────────────────────────────────────────────────
  const EmployeeInfo = () => {
    const Row = ({ label, val }: { label: string; val: string }) => (
      <div style={{ display:'grid', gridTemplateColumns:'120px 1fr', borderBottom:'1px solid #ccc', fontSize:9 }}>
        <span style={{ fontWeight:700, padding:'2px 5px', background:'#f0f0f0', borderRight:'1px solid #ccc' }}>{label}</span>
        <span style={{ padding:'2px 5px' }}>{val || '—'}</span>
      </div>
    );
    return (
      <div style={{ border:'1px solid #000', marginBottom:8 }}>
        <div style={{ borderTop:'1.5px solid #000', borderBottom:'1px solid #ccc', padding:'4px 0', marginBottom:4 }}>
          <span style={{ fontWeight:700, fontSize:9 }}>M &nbsp;</span>
          <span style={{ fontWeight:900, fontSize:13, textTransform:'uppercase' }}>{fullName}</span>
          <span style={{ float:'right', fontSize:9, fontWeight:600 }}>
            Matricule : {e.employeeNumber || '—'} &nbsp;|&nbsp; {MARITAL[e.maritalStatus??''] ?? '—'}
          </span>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0 24px' }}>
          <div>
            <Row label="Fonction"            val={e.position || '—'} />
            <Row label="Catégorie / Echelon" val={cat || '—'} />
            <Row label="Nature de contrat"   val={CONTRACT[e.contractType??''] ?? '—'} />
            <Row label="Date d'embauche"      val={fmtDate(e.hireDate)} />
            <Row label="Ancienneté"           val={`${sen.y} an(s) et ${sen.m} mois`} />
          </div>
          <div>
            <Row label="N° CNSS"             val={e.cnssNumber || '—'} />
            <Row label="Convention"          val={co.collectiveAgreement || 'Commerce'} />
            <Row label="Site"                val={co.city || co.address || '—'} />
            <Row label="Nombre d'enfants"    val={String(e.numberOfChildren ?? 0)} />
            <Row label="N° Compte"           val={[co.bankCode, co.bankBranch, e.bankAccount].filter(Boolean).join(' ')} />
          </div>
        </div>
        <div style={{ display:'flex', gap:20, borderTop:'1px solid #e0e0e0', paddingTop:3, marginTop:2, fontSize:9, flexWrap:'wrap' }}>
          <span><strong>Nombre de parts :</strong> {(e.numberOfChildren ?? 0) + 1}</span>
          <span><strong>Jours ouvrables :</strong> {payroll.workDays ?? '—'}</span>
          <span><strong>Jours travaillés :</strong> {payroll.workedDays ?? '—'}</span>
          {/* Absences : uniquement si > 0 */}
          {Number(payroll.absenceDays??0) > 0 && <span style={{color:'#c00'}}><strong>Absences :</strong> {fmt(payroll.absenceDays)} j</span>}
          {/* H.suppl : uniquement si > 0 et ≤ 300h */}
          {overTime != null && <span><strong>Heures suppl. :</strong> {overTime} h</span>}
        </div>
      </div>
    );
  };

  // ── TABLEAU DE PAIE ───────────────────────────────────────────────────────────
  const PayTable = () => {
    let ref1 = 99, ref2 = 199, ref3 = 399, ref4 = 699;
    return (
      <table style={{ width:'100%', borderCollapse:'collapse', fontSize:9, marginBottom:0 }}>
        <colgroup>
          <col style={{ width:'5%'  }} />
          <col style={{ width:'32%' }} />
          <col style={{ width:'10%' }} />
          <col style={{ width:'7%'  }} />
          <col style={{ width:'13%' }} />
          <col style={{ width:'12%' }} />
          <col style={{ width:'7%'  }} />
          <col style={{ width:'14%' }} />
        </colgroup>
        <thead>
          <tr>
            <th style={th()}>N°</th>
            <th style={th({ textAlign:'left', paddingLeft:6 })}>Désignation</th>
            <th style={th()}>Base</th>
            <th style={th()}>Taux</th>
            <th style={th()}>Gain</th>
            <th style={th()}>Retenue</th>
            <th style={thPat()}>T.pat</th>
            <th style={thPat()}>Ret.pat</th>
          </tr>
        </thead>
        <tbody>

          {/* ── GAINS ───────────────────────────────────────────────────── */}
          {gainFiltered.map((item: any) => {
            ref1++;
            return (
              <tr key={item.id ?? item.code}>
                <td style={tdC({ fontSize:8, color:'#555' })}>{ref1}</td>
                <td style={td({ paddingLeft:6, fontWeight: item.code==='SAL_BASE' ? 700 : 400 })}>{item.label}</td>
                <td style={tdR()}>{fmtBase(item)}</td>
                <td style={tdC({ fontSize:8.5 })}>{fmtTaux(item)}</td>
                <td style={tdR({ fontWeight:700 })}>{fmt(item.amount)}</td>
                <td style={td()} />
                <td style={tdPatC()} /><td style={tdPat()} />
              </tr>
            );
          })}

          {/* SALAIRE BRUT — pleine largeur, seul */}
          <tr>
            <td colSpan={8} style={{
              ...td({ fontWeight:900, fontSize:11, background:'#dedede',
                      textAlign:'center', letterSpacing:1,
                      borderTop:'2px solid #000', borderBottom:'2px solid #000' })
            }}>
              SALAIRE BRUT &nbsp;&mdash;&nbsp; {fmt(payroll.grossSalary)} F
            </td>
          </tr>

          {/* ── COTISATIONS SALARIALES ──────────────────────────────────── */}
          {cotisFiltered.map((item: any) => {
            ref2++;
            const taux = item.rate
              ? `${(Number(item.rate)*100).toFixed(Number(item.rate)<0.1?3:2).replace('.',',')}%`
              : (item.code==='ITS'||item.code==='BNC_SOURCE' ? 'Barème' : '—');
            return (
              <tr key={item.id ?? item.code}>
                <td style={tdC({ fontSize:8, color:'#555' })}>{ref2}</td>
                <td style={td({ paddingLeft:6 })}>{item.label}</td>
                <td style={tdR()}>{fmtBase(item)}</td>
                <td style={tdC({ fontSize:8.5 })}>{taux}</td>
                <td style={td()} />
                <td style={tdR({ fontWeight:700 })}>{fmt(item.amount)}</td>
                <td style={tdPatC()}>—</td>
                <td style={tdPat()}>—</td>
              </tr>
            );
          })}

          {/* ── CNSS PATRONALE — 3 branches distinctes ─────────────────── */}
          {cnssEmpPension > 0 && (() => { ref2++; return (
            <tr key="cnss_pat_pen" style={{ background:'#fafaf5' }}>
              <td style={tdC({ fontSize:8, color:'#555' })}>{ref2}</td>
              <td style={td({ paddingLeft:6, fontStyle:'italic', fontSize:8.5 })}>CNSS patronale — Pension vieillesse</td>
              <td style={tdR({ fontSize:8.5 })}>{fmt(payroll.grossSalary)}</td>
              <td style={tdC({ fontSize:8.5 })}>8%</td>
              <td style={td()} /><td style={td()} />
              <td style={tdPatC({ fontWeight:700 })}>8%</td>
              <td style={tdPat({ fontWeight:700 })}>{fmt(cnssEmpPension)}</td>
            </tr>
          ); })()}
          {cnssEmpFamily > 0 && (() => { ref2++; return (
            <tr key="cnss_pat_fam" style={{ background:'#fafaf5' }}>
              <td style={tdC({ fontSize:8, color:'#555' })}>{ref2}</td>
              <td style={td({ paddingLeft:6, fontStyle:'italic', fontSize:8.5 })}>CNSS patronale — Prestations familiales</td>
              <td style={tdR({ fontSize:8.5 })}>{fmt(payroll.grossSalary)}</td>
              <td style={tdC({ fontSize:8.5 })}>10,03%</td>
              <td style={td()} /><td style={td()} />
              <td style={tdPatC({ fontWeight:700 })}>10,03%</td>
              <td style={tdPat({ fontWeight:700 })}>{fmt(cnssEmpFamily)}</td>
            </tr>
          ); })()}
          {cnssEmpAccident > 0 && (() => { ref2++; return (
            <tr key="cnss_pat_at" style={{ background:'#fafaf5' }}>
              <td style={tdC({ fontSize:8, color:'#555' })}>{ref2}</td>
              <td style={td({ paddingLeft:6, fontStyle:'italic', fontSize:8.5 })}>CNSS patronale — Accidents du travail</td>
              <td style={tdR({ fontSize:8.5 })}>{fmt(payroll.grossSalary)}</td>
              <td style={tdC({ fontSize:8.5 })}>2,25%</td>
              <td style={td()} /><td style={td()} />
              <td style={tdPatC({ fontWeight:700 })}>2,25%</td>
              <td style={tdPat({ fontWeight:700 })}>{fmt(cnssEmpAccident)}</td>
            </tr>
          ); })()}

          {/* ── TUS DGI + CNSS ──────────────────────────────────────────── */}
          {tusDgi > 0 && (() => { ref2++; return (
            <tr key="tus_dgi" style={{ background:'#fafaf5' }}>
              <td style={tdC({ fontSize:8, color:'#555' })}>{ref2}</td>
              <td style={td({ paddingLeft:6, fontStyle:'italic', fontSize:8.5 })}>TUS — Part DGI (2,025%)</td>
              <td style={tdR({ fontSize:8.5 })}>{fmt(payroll.grossSalary)}</td>
              <td style={tdC({ fontSize:8.5 })}>2,025%</td>
              <td style={td()} /><td style={td()} />
              <td style={tdPatC({ fontWeight:700 })}>—</td>
              <td style={tdPat({ fontWeight:700 })}>{fmt(tusDgi)}</td>
            </tr>
          ); })()}
          {tusCnss > 0 && (() => { ref2++; return (
            <tr key="tus_cnss" style={{ background:'#fafaf5' }}>
              <td style={tdC({ fontSize:8, color:'#555' })}>{ref2}</td>
              <td style={td({ paddingLeft:6, fontStyle:'italic', fontSize:8.5 })}>TUS — Part CNSS (5,475%)</td>
              <td style={tdR({ fontSize:8.5 })}>{fmt(payroll.grossSalary)}</td>
              <td style={tdC({ fontSize:8.5 })}>5,475%</td>
              <td style={td()} /><td style={td()} />
              <td style={tdPatC({ fontWeight:700 })}>—</td>
              <td style={tdPat({ fontWeight:700 })}>{fmt(tusCnss)}</td>
            </tr>
          ); })()}

          {/* TOTAL COTISATIONS — taxes uniquement, seul sur sa ligne */}
          <tr style={{ background:'#f0f0f0' }}>
            <td colSpan={5} style={td({ fontWeight:900, textAlign:'center', fontSize:9.5, background:'#f0f0f0', borderTop:BD })}>
              Total Cotisations &nbsp;(CNSS + ITS + Taxes)
            </td>
            <td style={tdR({ fontWeight:900, fontSize:10.5, background:'#f0f0f0', borderTop:BD })}>{fmt(totalCotis)}</td>
            <td style={tdPatC({ background:'#e8e8e8', borderTop:BD })} />
            <td style={tdPat({ fontWeight:900, background:'#e8e8e8', borderTop:BD })}>
              {payroll.cnssEmployer ? fmt(payroll.cnssEmployer) : '—'}
            </td>
          </tr>

          {/* ── INDEMNITÉS HORS BRUT ────────────────────────────────────── */}
          {indemItems.map((item: any) => {
            ref3++;
            return (
              <tr key={item.id ?? item.code}>
                <td style={tdC({ fontSize:8, color:'#555' })}>{ref3}</td>
                <td style={td({ paddingLeft:6 })}>{item.label}</td>
                <td style={tdR()}>{fmtBase(item)}</td>
                <td style={tdC({ fontSize:8.5 })}>{fmtTaux(item)}</td>
                <td style={tdR({ fontWeight:700 })}>{fmt(item.amount)}</td>
                <td style={td()} />
                <td style={tdPatC()} /><td style={tdPat()} />
              </tr>
            );
          })}

          {/* ── PRÊTS & AVANCES ─────────────────────────────────────────── */}
          {loanAdvItems.map((item: any) => {
            ref4++;
            return (
              <tr key={item.id ?? item.code}>
                <td style={tdC({ fontSize:8, color:'#555' })}>{ref4}</td>
                <td style={td({ paddingLeft:6 })}>{item.label}</td>
                <td style={tdR()}>—</td>
                <td style={tdC({ fontSize:8.5 })}>—</td>
                <td style={td()} />
                <td style={tdR({ fontWeight:700 })}>{fmt(item.amount)}</td>
                <td style={tdPatC()} /><td style={tdPat()} />
              </tr>
            );
          })}

          {/* ── RETENUES DIVERSES ───────────────────────────────────────── */}
          {otherRetItems.map((item: any) => {
            ref4++;
            return (
              <tr key={item.id ?? item.code}>
                <td style={tdC({ fontSize:8, color:'#555' })}>{ref4}</td>
                <td style={td({ paddingLeft:6 })}>{item.label}</td>
                <td style={tdR()}>{fmtBase(item)}</td>
                <td style={tdC({ fontSize:8.5 })}>{fmtTaux(item)}</td>
                <td style={td()} />
                <td style={tdR({ fontWeight:700 })}>{fmt(item.amount)}</td>
                <td style={tdPatC()} /><td style={tdPat()} />
              </tr>
            );
          })}

          {/* TOTAL GAINS = Brut + Indemnités */}
          <tr>
            <td style={tdC({ fontSize:8, color:'#555' })}>990</td>
            <td style={td({ fontWeight:900, paddingLeft:6 })}>
              TOTAL GAINS{totalIndem > 0 ? ` (Brut + Indemnités)` : ''}
            </td>
            <td style={td()} /><td style={td()} />
            <td style={tdR({ fontWeight:900, fontSize:10 })}>{fmt(totalGains)}</td>
            <td style={td()} /><td style={tdPatC()} /><td style={tdPat()} />
          </tr>

          {/* TOTAL RETENUES = cotisations + prêts/avances */}
          <tr>
            <td style={tdC({ fontSize:8, color:'#555' })}>995</td>
            <td style={td({ fontWeight:900, paddingLeft:6 })}>
              TOTAL RETENUES{totalLoanAdv > 0 ? ` (Cotis. + Prêts/Avances)` : ''}
            </td>
            <td style={td()} /><td style={td()} /><td style={td()} />
            <td style={tdR({ fontWeight:900, fontSize:10 })}>{fmt(totalDed)}</td>
            <td style={tdPatC()} /><td style={tdPat()} />
          </tr>

        </tbody>
      </table>
    );
  };

  // ── CUMULS + NET À PAYER ──────────────────────────────────────────────────────
  const Cumuls = () => {
    const ytdNetImp = ytd ? (ytd.grossSalary - ytd.cnssSalarial) : null;
    const cols = [
      { label:'Sal. brut',     p: payroll.grossSalary,                              a: ytd?.grossSalary    ?? null },
      { label:'Ch. sal.',      p: payroll.cnssSalarial,                             a: ytd?.cnssSalarial   ?? null },
      { label:'Ch. pat.',      p: payroll.cnssEmployer ?? 0,                        a: ytd?.cnssEmployer   ?? null },
      { label:'Avt. nature',   p: 0,                                                a: 0 },
      { label:'Net imposable', p: (payroll.grossSalary??0)-(payroll.cnssSalarial??0), a: ytdNetImp },
      { label:'H. trav.',      p: (payroll.workedDays??0)*8,                        a: ytd ? (ytd.workedDays*8) : null },
      // H.suppl : heures réelles saisies — null si > 300 (bug données)
      { label:'H. suppl.',     p: overTime,                                         a: null },
      // Base congés : tirets — calculé côté générateur lors des congés
      { label:'Base Congés',   p: null,                                             a: null },
    ];

    const thC: React.CSSProperties = { background:'#444', color:'#fff', fontWeight:700, fontSize:7.5, padding:'3px 4px', textAlign:'center', whiteSpace:'nowrap', border:'1px solid #000' };
    const tdL: React.CSSProperties = { fontSize:8.5, fontWeight:700, background:'#efefef', border:'1px solid #aaa', padding:'2.5px 5px', textAlign:'center' };
    const tdV: React.CSSProperties = { fontSize:8.5, fontFamily:'Courier New, monospace', border:'1px solid #ccc', padding:'2.5px 4px', textAlign:'right', whiteSpace:'nowrap' };

    return (
      <div style={{ display:'flex', alignItems:'stretch', borderTop:'2px solid #000' }}>
        <table style={{ flex:1, borderCollapse:'collapse', tableLayout:'fixed' }}>
          <thead>
            <tr>
              <th style={{ ...thC, width:52 }}>Cumuls</th>
              {cols.map(c => <th key={c.label} style={thC}>{c.label}</th>)}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={tdL}>Période</td>
              {cols.map(c => <td key={c.label} style={tdV}>{c.p != null ? fmt(c.p) : '—'}</td>)}
            </tr>
            <tr>
              <td style={tdL}>Année</td>
              {cols.map(c => <td key={c.label} style={tdV}>{c.a != null ? fmt(c.a) : '—'}</td>)}
            </tr>
          </tbody>
        </table>
        <div style={{ border:'2px solid #000', borderLeft:'none', display:'flex', flexDirection:'column', justifyContent:'center', alignItems:'center', minWidth:115, padding:'6px 10px', flexShrink:0 }}>
          <div style={{ fontSize:7.5, fontWeight:900, textTransform:'uppercase', letterSpacing:1.5, marginBottom:4, whiteSpace:'nowrap' }}>NET A PAYER</div>
          <div style={{ fontSize:17, fontWeight:900, fontFamily:'Courier New, monospace', whiteSpace:'nowrap', letterSpacing:1 }}>{fmt(netSalary)}</div>
          <div style={{ fontSize:8, color:'#444', marginTop:2 }}>FCFA</div>
        </div>
      </div>
    );
  };

  // ── SIGNATURES ────────────────────────────────────────────────────────────────
  const Signatures = () => (
    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:30, padding:'10px 0 8px', borderTop:'1px solid #ccc', marginTop:10 }}>
      {["Signature de l'Employé(e)", "Signature et cachet de l'Employeur"].map(label => (
        <div key={label} style={{ textAlign:'center' }}>
          <div style={{ fontSize:9.5, fontWeight:700, marginBottom:4 }}>{label}</div>
          <div style={{ height:50, borderBottom:'1.5px solid #000' }} />
        </div>
      ))}
    </div>
  );

  // ── PIED DE PAGE ──────────────────────────────────────────────────────────────
  const Footer = () => {
    const parts = [
      co.phone   && `Tél. : ${co.phone}`,
      co.address && `${co.address}${co.city?', '+co.city:''}`,
      co.email   && `Email : ${co.email}`,
      co.rccmNumber && `RCCM : ${co.rccmNumber}`,
      co.nif     && `NIU : ${co.nif}`,
    ].filter(Boolean);
    return parts.length > 0 ? (
      <div style={{ borderTop:'1.5px solid #000', paddingTop:4, textAlign:'center', fontSize:7.5, color:'#333', marginTop:6 }}>
        {parts.join(' · ')}
      </div>
    ) : null;
  };

  return (
    <>
      <style>{`
        @media print {
          @page { size: A4 portrait; margin: 8mm; }
          html, body { margin: 0 !important; padding: 0 !important; background: #fff !important; }
          .no-print, nav, header, aside, footer,
          [class*="sidebar"],[class*="Sidebar"],
          [class*="navbar"],[class*="Navbar"] { display: none !important; }
          #bulletin-root {
            width: 194mm !important; padding: 0 !important; margin: 0 !important;
            box-shadow: none !important; border: none !important;
          }
          .bul-no-break { page-break-inside: avoid !important; break-inside: avoid !important; }
          .bul-legal { display: none !important; }
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        }
      `}</style>
      <div id="bulletin-root" style={{
        fontFamily: '"Helvetica Neue", Arial, sans-serif',
        fontSize: 10, background: '#fff', color: '#000',
        width: '210mm', boxSizing: 'border-box', padding: '8mm 10mm',
        margin: '0 auto',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08), 0 8px 32px rgba(0,0,0,0.1)',
      }}>
        <div className="bul-no-break"><Header /></div>
        <div className="bul-no-break"><EmployeeInfo /></div>
        <div className="bul-no-break"><PayTable /></div>
        <div className="bul-no-break"><Cumuls /></div>
        {tpl.style.footerMessage && (
          <div style={{ borderTop:'1px solid #ccc', paddingTop:5, marginTop:6, fontSize:8.5, fontStyle:'italic', textAlign:'center', color:'#444' }}>
            {tpl.style.footerMessage}
          </div>
        )}
        <div className="bul-no-break"><Signatures /></div>
        <Footer />
        <div className="bul-legal" style={{ marginTop:8, borderTop:'1px dashed #ddd', paddingTop:5 }}>
          <div style={{ fontSize:7.5, color:'#666', textAlign:'center' }}>
            Code du Travail — Loi n°45-75 · ITS 2026 barème progressif · CNSS 4% · SMIG 70 400 FCFA · KonzaRH
          </div>
        </div>
      </div>
    </>
  );
}