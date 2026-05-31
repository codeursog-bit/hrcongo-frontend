'use client';

// ============================================================================
// components/BulletinRenderer/index.tsx  — Template DEFAULT
//
// ✅ Design IESM fidèle : PEU de carreaux
//    • En-tête + infos employé : lignes horizontales seulement, pas de grille
//    • Tableau paie : colonnes sans bordures verticales internes
//      SEULE exception : les 2 colonnes Part Patronale ont un encadrement léger
//    • Cumuls Période/Année : tableau normal avec bordures (section cumuls)
//    • NET À PAYER : encadré noir, chiffre gras
// ✅ Colonnes : N° | Désignation | Base | Taux | Gain | Retenue | T.pat | Ret.pat
//    (Nombre supprimé — Taux porte quantity??rate)
// ✅ quantity : item.quantity en priorité, sinon workedDays/rate selon le code
// ✅ Compatible paie manuelle (même logique quantity??rate)
// ✅ A4 210mm fixe, @media print propre, preview OK
// ============================================================================

import React, { useMemo } from 'react';
import type { BulletinPayroll, BulletinTemplateConfig } from '@/types/bulletin-template';
import { getBaseTemplate } from '@/lib/bulletin-templates';
import {
  classifyItems, } from '@/lib/bulletin-items-classifier';
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

// ─── Helpers Base / Taux ──────────────────────────────────────────────────────
//
// RÈGLE STRICTE — le front n'invente rien :
//   Base  = item.base   tel que fourni par le back  (base journalière, taux horaire, brut…)
//   Taux  = item.quantity si présent (jours, heures, unités)
//           sinon item.rate formaté (0.04 → "4%", 1.10 → "×1,10", 26 → "26")
//   Gain  = item.amount (toujours fourni par le back)
//
// Si base ou taux sont null/0 → on affiche '—'
// JAMAIS de fallback sur payroll.workedDays, payroll.absenceDays, etc.
// Quand le back sera mis à jour (quantity + base journalière sur SAL_BASE) : ça marchera
// automatiquement sans toucher au front.

function fmtBase(item: any): string {
  if (item.base == null || item.base === 0) return '—';
  return fmt(item.base);
}

function fmtTaux(item: any): string {
  // quantity en priorité (nouveau champ back — jours, heures, unités)
  const qty = item.quantity;
  if (qty != null && qty !== 0) return String(qty);

  // rate sinon
  if (item.rate == null || item.rate === 0) return '—';
  const r = Number(item.rate);

  // Taux multiplicateur HS (1.10, 1.25, 1.50, 2.00) → afficher ×1,10 etc.
  if (r > 1 && r <= 3) return `×${r.toFixed(2).replace('.', ',')}`;

  // Taux en % (0.04 → 4%, 0.02025 → 2,025%)
  if (r > 0 && r < 1) {
    const pct = r * 100;
    const str = pct % 1 === 0 ? pct.toFixed(0) : pct.toFixed(3).replace(/0+$/, '');
    return `${str}%`;
  }

  // Nombre brut (ex: 26 jours si back envoie rate=26 pour SAL_BASE)
  return String(r);
}

// ─── Styles ───────────────────────────────────────────────────────────────────
// Principe : PAS de bordures verticales internes dans le tableau principal
// Seule séparation = lignes horizontales fines
const LINE  = '1px solid #ccc';   // séparateur léger
const LINE_DARK = '1px solid #000'; // bordure forte (en-tête, total)

// Cellule standard — PAS de border gauche/droite
const td = (extra?: React.CSSProperties): React.CSSProperties => ({
  padding: '3px 5px',
  fontSize: 9,
  verticalAlign: 'middle',
  borderBottom: LINE,
  ...extra,
});
const tdR = (extra?: React.CSSProperties): React.CSSProperties => ({
  ...td(), textAlign: 'right', fontFamily: 'Courier New, monospace', ...extra,
});
const tdC = (extra?: React.CSSProperties): React.CSSProperties => ({
  ...td(), textAlign: 'center', ...extra,
});

// Cellule Part Patronale — encadrement léger pour distinguer du reste
const tdPat = (extra?: React.CSSProperties): React.CSSProperties => ({
  ...tdR(),
  borderLeft: '1px solid #bbb',
  background: '#fafafa',
  ...extra,
});
const tdPatC = (extra?: React.CSSProperties): React.CSSProperties => ({
  ...tdC(),
  borderLeft: '1px solid #bbb',
  background: '#fafafa',
  ...extra,
});

// En-tête colonne
const th = (extra?: React.CSSProperties): React.CSSProperties => ({
  padding: '4px 5px',
  fontSize: 8.5,
  fontWeight: 700,
  textAlign: 'center',
  background: '#e0e0e0',
  borderBottom: LINE_DARK,
  borderTop: LINE_DARK,
  ...extra,
});
const thPat = (extra?: React.CSSProperties): React.CSSProperties => ({
  ...th(),
  borderLeft: '1px solid #bbb',
  background: '#d0d0d0',
  ...extra,
});

function BulletinRendererDefault({ payroll, template }: BulletinRendererProps) {
  const tpl = template ?? getBaseTemplate('default');
  const e   = (payroll.employee ?? {}) as any;
  const co  = (payroll.company  ?? {}) as any;

  const monthLabel = MONTHS[(payroll.month ?? 1) - 1];
  const sen        = seniority(e.hireDate);
  const fullName   = [e.firstName, e.lastName].filter(Boolean).join(' ');
  const cat        = [e.professionalCategory, e.echelon ? `Cat ${e.echelon}` : ''].filter(Boolean).join(' ');
  // ytd = cumul annuel réel fourni par le back (Jan → mois actuel)
  // Si absent (back pas encore mis à jour) : on affiche '—' proprement
  const ytd = (payroll as any).ytd;

  const { gainItems, cotisItems, indemItems, retenueItems, empItems } = useMemo(
    () => classifyItems(payroll.items ?? []), [payroll.items]
  );

  // cnssEmpTotal = payroll.cnssEmployer (fourni par le back)
  // brutGains = payroll.grossSalary (fourni par le back)
  // totalCotisSal = payroll.totalDeductions (fourni par le back)
  // totalCotisPat = payroll.cnssEmployer (fourni par le back)
  // totalGains = items de type GAIN déjà dans grossSalary + indemnités
  // totalRetenues = payroll.totalDeductions (fourni par le back)
  const netSalary = payroll.netSalary ?? 0;

  // ── EN-TÊTE ─────────────────────────────────────────────────────────────────
  const Header = () => (
    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', borderBottom:'2px solid #000', paddingBottom:8, marginBottom:8 }}>
      {/* Logo + coordonnées */}
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
      {/* Titre */}
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

  // ── INFOS EMPLOYÉ — lignes horizontales seulement, pas de grille ───────────
  // Style : label en gras, valeur à droite, séparateur fin entre chaque ligne
  const EmployeeInfo = () => {
    const Row = ({ label, val }: { label: string; val: string }) => (
      <div style={{ display:'flex', justifyContent:'space-between', padding:'2.5px 0', borderBottom:'1px solid #e0e0e0', fontSize:9 }}>
        <span style={{ fontWeight:700, color:'#333', minWidth:130 }}>{label}</span>
        <span style={{ color:'#000' }}>{val || '—'}</span>
      </div>
    );

    return (
      <div style={{ marginBottom:8 }}>
        {/* Nom — plus grand, mis en avant */}
        <div style={{ borderTop:'1.5px solid #000', borderBottom:'1px solid #ccc', padding:'4px 0', marginBottom:4 }}>
          <span style={{ fontWeight:700, fontSize:9 }}>M &nbsp;</span>
          <span style={{ fontWeight:900, fontSize:13, textTransform:'uppercase' }}>{fullName}</span>
          <span style={{ float:'right', fontSize:9, fontWeight:600 }}>
            Matricule : {e.employeeNumber || '—'} &nbsp;|&nbsp; {MARITAL[e.maritalStatus??''] ?? '—'}
          </span>
        </div>

        {/* 2 colonnes infos */}
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
            <Row label="N° Compte"           val={[co.bankCode||'30005', co.bankBranch||'00363', e.bankAccount||''].filter(Boolean).join(' ')} />
          </div>
        </div>

        {/* Ligne bas : N° Compte complet + parts */}
        <div style={{ display:'flex', gap:24, borderTop:'1px solid #e0e0e0', paddingTop:3, marginTop:2, fontSize:9 }}>
          <span><strong>N° Compte :</strong> {[co.bankCode||'30005', co.bankBranch||'00363', e.bankAccount||''].filter(Boolean).join('  ')}</span>
          <span><strong>Nombre de parts :</strong> {(e.numberOfChildren ?? 0) + 1}</span>
          <span><strong>Jours travaillés :</strong> {payroll.workedDays ?? '—'} / {payroll.workDays ?? '—'}</span>
        </div>
      </div>
    );
  };

  // ── TABLEAU DE PAIE — design épuré ─────────────────────────────────────────
  const PayTable = () => (
    <table style={{ width:'100%', borderCollapse:'collapse', fontSize:9, marginBottom:0 }}>
      <colgroup>
        <col style={{ width:'5%'  }} />
        <col style={{ width:'32%' }} />
        <col style={{ width:'10%' }} />
        <col style={{ width:'7%'  }} />
        <col style={{ width:'13%' }} />
        <col style={{ width:'12%' }} />
        {/* Part patronale — 2 cols encadrées */}
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

        {/* ── GAINS ── */}
        {gainItems.map((item: any, idx: number) => (
          <tr key={item.id ?? idx}>
            <td style={tdC({ fontSize:8, color:'#555' })}>
              {item.code === 'SAL_BASE' ? '10' : String(10 + idx + 1)}
            </td>
            <td style={td({ paddingLeft:6, fontWeight: item.code==='SAL_BASE' ? 700 : 400 })}>{item.label}</td>
            <td style={tdR()}>{fmtBase(item)}</td>
            <td style={tdC({ fontSize:8.5 })}>{fmtTaux(item)}</td>
            <td style={tdR({ fontWeight:700 })}>{fmt(item.amount)}</td>
            <td style={td()} />
            <td style={tdPatC()} /><td style={tdPat()} />
          </tr>
        ))}

        {/* TOTAL BRUT */}
        <tr style={{ background:'#e8e8e8' }}>
          <td colSpan={4} style={{ ...td({ borderBottom: LINE_DARK, borderTop: LINE_DARK, background:'#e8e8e8', fontWeight:900, textAlign:'center', fontSize:10 }) }}>
            Total Brut
          </td>
          <td style={tdR({ fontWeight:900, fontSize:11, background:'#e8e8e8', borderBottom:LINE_DARK, borderTop:LINE_DARK })}>{fmt(payroll.grossSalary)}</td>
          <td style={td({ background:'#e8e8e8', borderBottom:LINE_DARK, borderTop:LINE_DARK })} />
          <td style={tdPatC({ background:'#e0e0e0', borderBottom:LINE_DARK, borderTop:LINE_DARK })} />
          <td style={tdPat({ background:'#e0e0e0', borderBottom:LINE_DARK, borderTop:LINE_DARK })} />
        </tr>

        {/* ── COTISATIONS ── */}
        {cotisItems.map((item: any, idx: number) => {
          const tauxPat = (item as any).empRate   ?? '—';
          const retPat  = (item as any).empAmount ? fmt((item as any).empAmount) : '—';
          return (
            <tr key={item.id ?? idx}>
              <td style={tdC({ fontSize:8, color:'#555' })}>{300 + idx}</td>
              <td style={td({ paddingLeft:6 })}>{item.label}</td>
              <td style={tdR()}>{fmtBase(item)}</td>
              <td style={tdC({ fontSize:8.5 })}>{fmtTaux(item)}</td>
              <td style={td()} />
              <td style={tdR({ fontWeight:700 })}>{fmt(item.amount)}</td>
              <td style={tdPatC({ fontWeight:600 })}>{tauxPat}</td>
              <td style={tdPat({ fontWeight:700 })}>{retPat}</td>
            </tr>
          );
        })}

        {/* TOTAL COTISATIONS */}
        <tr style={{ background:'#f0f0f0' }}>
          <td colSpan={4} style={{ ...td({ fontWeight:900, textAlign:'center', fontSize:9.5, background:'#f0f0f0', borderBottom:LINE, borderTop:'1px solid #bbb' }) }}>
            Total Cotisations
          </td>
          <td style={td({ background:'#f0f0f0', borderTop:'1px solid #bbb' })} />
          <td style={tdR({ fontWeight:900, fontSize:10.5, background:'#f0f0f0', borderTop:'1px solid #bbb' })}>{fmt(payroll.totalDeductions)}</td>
          <td style={tdPatC({ background:'#e8e8e8', borderTop:'1px solid #bbb' })} />
          <td style={tdPat({ fontWeight:900, background:'#e8e8e8', borderTop:'1px solid #bbb' })}>
            {payroll.cnssEmployer ? fmt(payroll.cnssEmployer) : '—'}
          </td>
        </tr>

        {/* ── INDEMNITÉS ── */}
        {indemItems.map((item: any, idx: number) => (
          <tr key={item.id ?? idx}>
            <td style={tdC({ fontSize:8, color:'#555' })}>{400 + idx}</td>
            <td style={td({ paddingLeft:6 })}>{item.label}</td>
            <td style={tdR()}>{fmtBase(item)}</td>
            <td style={tdC({ fontSize:8.5 })}>{fmtTaux(item)}</td>
            <td style={tdR({ fontWeight:700 })}>{fmt(item.amount)}</td>
            <td style={td()} />
            <td style={tdPatC()} /><td style={tdPat()} />
          </tr>
        ))}

        {/* ── RETENUES DIVERSES ── */}
        {retenueItems.map((item: any, idx: number) => (
          <tr key={item.id ?? idx}>
            <td style={tdC({ fontSize:8, color:'#555' })}>{700 + idx}</td>
            <td style={td({ paddingLeft:6 })}>{item.label}</td>
            <td style={tdR()}>{fmtBase(item)}</td>
            <td style={tdC({ fontSize:8.5 })}>{fmtTaux(item)}</td>
            <td style={td()} />
            <td style={tdR({ fontWeight:700 })}>{fmt(item.amount)}</td>
            <td style={tdPatC()} /><td style={tdPat()} />
          </tr>
        ))}

        {/* Absence */}
        {(payroll.absenceDeduction ?? 0) > 0 && (
          <tr>
            <td style={tdC({ fontSize:8, color:'#555' })}>ABS</td>
            <td style={td({ paddingLeft:6 })}>Retenue absence</td>
            <td style={tdR()}>{payroll.absenceDays ?? '—'}</td>
            <td style={tdC({ fontSize:8.5 })}>—</td>
            <td style={td()} />
            <td style={tdR({ fontWeight:700 })}>{fmt(payroll.absenceDeduction)}</td>
            <td style={tdPatC()} /><td style={tdPat()} />
          </tr>
        )}

        {/* Séparateur pointillé */}
        <tr>
          <td colSpan={8} style={{ padding:0, height:5, borderTop:'1px dashed #aaa', borderBottom:'none' }} />
        </tr>

        {/* TOTAL GAINS */}
        <tr>
          <td style={tdC({ fontSize:8, color:'#555' })}>990</td>
          <td style={td({ fontWeight:900, paddingLeft:6 })}>TOTAL GAINS</td>
          <td style={td()} /><td style={td()} />
          <td style={tdR({ fontWeight:900, fontSize:10 })}>{fmt(payroll.grossSalary)}</td>
          <td style={td()} /><td style={tdPatC()} /><td style={tdPat()} />
        </tr>

        <tr>
          <td colSpan={8} style={{ padding:0, height:5, borderTop:'1px dashed #aaa', borderBottom:'none' }} />
        </tr>

        {/* TOTAL RETENUES */}
        <tr>
          <td style={tdC({ fontSize:8, color:'#555' })}>995</td>
          <td style={td({ fontWeight:900, paddingLeft:6 })}>TOTAL RETENUES</td>
          <td style={td()} /><td style={td()} /><td style={td()} />
          <td style={tdR({ fontWeight:900, fontSize:10 })}>{fmt(payroll.totalDeductions)}</td>
          <td style={tdPatC()} /><td style={tdPat()} />
        </tr>

      </tbody>
    </table>
  );

  // ── CUMULS + NET À PAYER ────────────────────────────────────────────────────
  const Cumuls = () => {
    const overTime = (payroll.overtimeHours10??0)+(payroll.overtimeHours25??0)+(payroll.overtimeHours50??0)+(payroll.overtimeHours100??0);
    const ytdNetImp = ytd ? (ytd.grossSalary - ytd.cnssSalarial) : null;
    const cols = [
      { label:'Sal. brut',     p:payroll.grossSalary,                                    a: ytd?.grossSalary          ?? null },
      { label:'Ch. sal.',      p:payroll.cnssSalarial,                                   a: ytd?.cnssSalarial         ?? null },
      { label:'Ch. pat.',      p: payroll.cnssEmployer ?? 0, a: ytd?.cnssEmployer ?? null },
      { label:'Avt. nature',   p:0,                                                      a: 0                                },
      { label:'Net imposable', p:(payroll.grossSalary??0)-(payroll.cnssSalarial??0),      a: ytdNetImp                        },
      { label:'H. trav.',      p:(payroll.workedDays??0)*8,                              a: ytd ? (ytd.workedDays*8) : null  },
      { label:'H. suppl.',     p:overTime,                                               a: ytd?.totalOvertimeAmount  ?? null },
      { label:'Base Congés',   p:payroll.baseSalary,                                    a: ytd?.baseSalary           ?? null },
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
              {cols.map(c => <td key={c.label} style={tdV}>{c.p != null ? fmt(c.p) : '0'}</td>)}
            </tr>
            <tr>
              <td style={tdL}>Année</td>
              {cols.map(c => <td key={c.label} style={tdV}>{c.a != null ? fmt(c.a) : '—'}</td>)}
            </tr>
          </tbody>
        </table>
        {/* NET À PAYER */}
        <div style={{ border:'2px solid #000', borderLeft:'none', display:'flex', flexDirection:'column', justifyContent:'center', alignItems:'center', minWidth:115, padding:'6px 10px', flexShrink:0, background:'#fff' }}>
          <div style={{ fontSize:7.5, fontWeight:900, textTransform:'uppercase', letterSpacing:1.5, marginBottom:4, whiteSpace:'nowrap' }}>NET A PAYER</div>
          <div style={{ fontSize:17, fontWeight:900, fontFamily:'Courier New, monospace', whiteSpace:'nowrap', letterSpacing:1 }}>{fmt(netSalary)}</div>
        </div>
      </div>
    );
  };

  // ── SIGNATURES ──────────────────────────────────────────────────────────────
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

  // ── PIED DE PAGE ────────────────────────────────────────────────────────────
  const Footer = () => {
    const parts = [co.phone && `Tél. : ${co.phone}`, co.address && `${co.address}${co.city?', '+co.city:''}`, co.email && `Email : ${co.email}`, co.rccmNumber && `RCCM : ${co.rccmNumber}`, co.nif && `NIU : ${co.nif}`].filter(Boolean);
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
          .payslip-sheet-wrap { display: block !important; position: static !important; }
          #bulletin-root {
            width: 194mm !important; min-height: 281mm !important;
            padding: 0 !important; margin: 0 !important;
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
        width: '210mm', minHeight: '297mm',
        boxSizing: 'border-box', padding: '8mm 10mm',
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