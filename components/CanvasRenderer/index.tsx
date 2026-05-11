'use client';

// ============================================================================
// components/CanvasRenderer/index.tsx
//
// Lit le JSON du layout canvas et injecte les vraies données payroll.
// Utilisé dans :
//   • L'éditeur canvas (preview live droite)
//   • paie/[id]/page.tsx (affichage bulletin)
//   • ma-paie/page.tsx (modal employé)
//   • Export PDF via window.print()
//
// Chaque bloc reçoit sa variable → la valeur réelle est extraite du payroll.
// ============================================================================

import React from 'react';
import type { CanvasLayout, CanvasBlock, CanvasVariable } from '@/types/canvas-block';
import type { BulletinPayroll } from '@/types/bulletin-template';

interface Props {
  layout:      CanvasLayout;
  payroll:     BulletinPayroll;
  previewMode?: boolean;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const MONTHS = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
const MARITAL: Record<string,string> = { SINGLE:'Célibataire', MARRIED:'Marié(e)', DIVORCED:'Divorcé(e)', WIDOWED:'Veuf/Veuve', COHABITING:'Concubinage' };
const PAYMENT: Record<string,string> = { BANK_TRANSFER:'Virement bancaire', CASH:'Espèces', MOBILE_MONEY:'Mobile Money', CHECK:'Chèque' };
const CONTRACT: Record<string,string> = { CDI:'CDI', CDD:'CDD', STAGE:'Stage', CONSULTANT:'Consultant', PRESTATAIRE:'Prestataire' };

function fmt(v: any): string { return Math.round(Number(v) || 0).toLocaleString('fr-FR'); }
function fmtF(v: any): string { return `${fmt(v)} F`; }

function seniority(d?: string): string {
  if (!d) return '—';
  const hire = new Date(d), now = new Date();
  let y = now.getFullYear() - hire.getFullYear();
  let m = now.getMonth() - hire.getMonth();
  if (m < 0) { y--; m += 12; }
  return [y > 0 ? `${y} an${y > 1 ? 's' : ''}` : '', m > 0 ? `${m} mois` : ''].filter(Boolean).join(' ') || '< 1 mois';
}

function cleanLabel(s: string): string {
  return s.replace(/^[🤖✋]\s*/, '').trim();
}

function getFont(f: string): string {
  if (f === 'serif') return '"Georgia","Times New Roman",serif';
  if (f === 'mono')  return '"Courier New",monospace';
  return '"Inter","Helvetica Neue",Arial,sans-serif';
}

function getPad(p: string): string {
  return p === 'compact' ? '6px 12px' : p === 'airy' ? '14px 20px' : '10px 16px';
}

function getFS(s: string): number { return s === 'sm' ? 10.5 : s === 'lg' ? 13 : 12; }

// ─── Résolution des variables ─────────────────────────────────────────────────
// Retourne la valeur textuelle d'une variable depuis le payroll

function resolveScalar(variable: CanvasVariable, payroll: BulletinPayroll): string {
  const e = payroll.employee ?? {} as any;
  const c = payroll.company  ?? {} as any;

  switch (variable) {
    case 'employee.fullName':       return [e.firstName, e.lastName].filter(Boolean).join(' ') || '—';
    case 'employee.firstName':      return e.firstName || '—';
    case 'employee.lastName':       return e.lastName  || '—';
    case 'employee.employeeNumber': return e.employeeNumber ? `Matricule : ${e.employeeNumber}` : '—';
    case 'employee.position':       return e.position  || '—';
    case 'employee.department':     return e.department?.name || '—';
    case 'employee.cnssNumber':     return e.cnssNumber || '—';
    case 'employee.contractType':   return CONTRACT[e.contractType ?? ''] ?? e.contractType ?? '—';
    case 'employee.hireDate':       return e.hireDate ? new Date(e.hireDate).toLocaleDateString('fr-FR') : '—';
    case 'employee.seniority':      return seniority(e.hireDate);
    case 'employee.maritalStatus':  return MARITAL[e.maritalStatus ?? ''] ?? e.maritalStatus ?? '—';
    case 'employee.paymentMethod':  return PAYMENT[e.paymentMethod ?? ''] ?? e.paymentMethod ?? '—';
    case 'employee.category':       return [e.professionalCategory, e.echelon ? `Échelon ${e.echelon}` : ''].filter(Boolean).join(' · ') || '—';
    case 'company.name':            return c.tradeName || c.legalName || '—';
    case 'company.logo':            return c.logo || '';
    case 'company.address':         return [c.address, c.city].filter(Boolean).join(', ') || '—';
    case 'company.rccm':            return c.rccmNumber || '—';
    case 'company.cnss':            return c.cnssNumber || '—';
    case 'company.phone':           return c.phone || '—';
    case 'period.monthYear':        return `${MONTHS[(payroll.month ?? 1) - 1]} ${payroll.year}`;
    case 'period.workDays':         return `${payroll.workDays ?? 0} jours ouvrables`;
    case 'period.workedDays':       return `${payroll.workedDays ?? 0} jours travaillés`;
    case 'period.absenceDays':      return `${payroll.absenceDays ?? 0} jour(s) d'absence`;
    case 'period.leaveDays':        return `${payroll.daysOnLeave ?? 0} jour(s) de congé`;
    case 'period.overtimeTotal':    return `${(Number(payroll.overtimeHours10 ?? 0) + Number(payroll.overtimeHours25 ?? 0) + Number(payroll.overtimeHours50 ?? 0) + Number(payroll.overtimeHours100 ?? 0))} heure(s) supp.`;
    case 'pay.baseSalary':          return fmtF(payroll.baseSalary);
    case 'pay.grossSalary':         return fmtF(payroll.grossSalary);
    case 'pay.netSalary':           return fmtF(payroll.netSalary);
    case 'pay.totalDeductions':     return fmtF(payroll.totalDeductions);
    case 'pay.totalEmployerCost':   return fmtF(payroll.totalEmployerCost);
    case 'pay.totalBonuses':        return fmtF(payroll.totalBonuses);
    case 'pay.cnssSalarial':        return fmtF(payroll.cnssSalarial);
    case 'pay.its':                 return fmtF(payroll.its);
    case 'pay.tusTotal':            return fmtF(payroll.tusTotal);
    case 'pay.cnssEmployerTotal':   return fmtF((payroll.cnssEmployerPension ?? 0) + (payroll.cnssEmployerFamily ?? 0) + (payroll.cnssEmployerAccident ?? 0));
    case 'pay.absenceDeduction':    return fmtF(payroll.absenceDeduction);
    // Variables scalaires ajoutées — couverture 100%
    case 'pay.leaveIndemnity': {
      const item = (payroll.items ?? []).find((i: any) => i.code === 'INDEM_CONGE');
      return fmtF(item?.amount ?? 0);
    }
    case 'pay.advanceDeduction': {
      const items2 = (payroll.items ?? []).filter((i: any) => i.code === 'ADVANCE');
      return fmtF(items2.reduce((s: number, i: any) => s + i.amount, 0));
    }
    case 'pay.loanDeduction': {
      const items2 = (payroll.items ?? []).filter((i: any) => i.code === 'LOAN');
      return fmtF(items2.reduce((s: number, i: any) => s + i.amount, 0));
    }
    case 'pay.customTaxEmployee': {
      const items2 = (payroll.items ?? []).filter((i: any) => i.code?.startsWith('CTAX_') && !i.code?.startsWith('CTAX_EMP_'));
      return fmtF(items2.reduce((s: number, i: any) => s + i.amount, 0));
    }
    case 'pay.customTaxEmployer': {
      const items2 = (payroll.items ?? []).filter((i: any) => i.code?.startsWith('CTAX_EMP_'));
      return fmtF(items2.reduce((s: number, i: any) => s + i.amount, 0));
    }
    case 'pay.cnssEmployerPension':  return fmtF(payroll.cnssEmployerPension);
    case 'pay.cnssEmployerFamily':   return fmtF(payroll.cnssEmployerFamily);
    case 'pay.cnssEmployerAccident': return fmtF(payroll.cnssEmployerAccident);
    case 'pay.tusDgi':               return fmtF(payroll.tusDgiAmount);
    case 'pay.tusCnss':              return fmtF(payroll.tusCnssAmount);
    case 'static.pageTitle':        return 'Bulletin de Paie';
    case 'static.legalMentions':    return 'Code du Travail — Loi n°45-75 · ITS 2026 barème progressif · CNSS 4% · SMIG 70 400 F';
    default: return '—';
  }
}

// Retourne les items filtrés selon la variable
function resolveItems(variable: CanvasVariable, payroll: BulletinPayroll): any[] {
  const items = payroll.items ?? [];
  switch (variable) {
    case 'items.gains':      return items.filter(i => i.type === 'GAIN' && !['HS_10','HS_25','HS_50','HS_100'].includes(i.code) && !i.code.startsWith('BONUS_') && !i.code.startsWith('AUTO_BONUS_')).sort((a,b)=>a.order-b.order);
    case 'items.deductions': return items.filter(i => i.type === 'DEDUCTION').sort((a,b)=>a.order-b.order);
    case 'items.employer':   return items.filter(i => i.type === 'EMPLOYER_COST').sort((a,b)=>a.order-b.order);
    case 'items.overtime':   return items.filter(i => ['HS_10','HS_25','HS_50','HS_100'].includes(i.code)).sort((a,b)=>a.order-b.order);
    case 'items.bonuses':    return items.filter(i => i.code.startsWith('BONUS_') || i.code.startsWith('AUTO_BONUS_')).sort((a,b)=>a.order-b.order);
    case 'items.all':        return [...items].sort((a,b)=>a.order-b.order);
    case 'items.loans':      return items.filter(i => i.code === 'LOAN').sort((a,b)=>a.order-b.order);
    case 'items.advances':   return items.filter(i => i.code === 'ADVANCE').sort((a,b)=>a.order-b.order);
    case 'items.customTaxEmp':      return items.filter(i => i.type === 'DEDUCTION' && i.code?.startsWith('CTAX_') && !i.code?.startsWith('CTAX_EMP_')).sort((a,b)=>a.order-b.order);
    case 'items.customTaxEmployer': return items.filter(i => i.code?.startsWith('CTAX_EMP_')).sort((a,b)=>a.order-b.order);
    case 'items.congé':      return items.filter(i => ['ABS_CONGE','ABS_DEDUCT','INDEM_CONGE'].includes(i.code)).sort((a,b)=>a.order-b.order);
    default:                 return [];
  }
}

const isTableVariable = (v?: CanvasVariable): boolean =>
  !!v && ['items.gains','items.deductions','items.employer','items.overtime','items.bonuses','items.all'].includes(v);

// ─── Rendu de chaque type de bloc ─────────────────────────────────────────────

function RenderHeader({ block, payroll, primary, secondary }: { block: CanvasBlock; payroll: BulletinPayroll; primary: string; secondary: string }) {
  const s   = block.style;
  const emp = payroll.employee ?? {} as any;
  const c   = payroll.company  ?? {} as any;
  const fs  = getFS(s.fontSize);

  return (
    <div style={{
      background: s.accentColor,
      padding: getPad(s.padding),
      borderRadius: s.borderRadius,
    }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:16 }}>
        <div style={{ display:'flex', gap:12, alignItems:'flex-start', flex:1 }}>
          {c.logo && (
            <div style={{ width:44, height:44, borderRadius:s.borderRadius, overflow:'hidden', border:'1px solid rgba(255,255,255,.3)', flexShrink:0 }}>
              <img src={c.logo} alt="Logo" style={{ width:'100%', height:'100%', objectFit:'contain' }} />
            </div>
          )}
          <div>
            <div style={{ fontSize:fs + 3, fontWeight:900, color:'#fff', marginBottom:3 }}>{c.tradeName || c.legalName || 'Entreprise'}</div>
            {c.address && <div style={{ fontSize:fs - 1, color:'rgba(255,255,255,.75)' }}>{c.address}{c.city ? `, ${c.city}` : ''}</div>}
            <div style={{ display:'flex', gap:10, marginTop:3, fontSize:fs - 2, color:'rgba(255,255,255,.65)' }}>
              {c.rccmNumber && <span>RCCM : {c.rccmNumber}</span>}
              {c.cnssNumber && <span>CNSS : {c.cnssNumber}</span>}
              {c.phone      && <span>{c.phone}</span>}
            </div>
          </div>
        </div>
        <div style={{ textAlign:'right', flexShrink:0 }}>
          <div style={{ fontSize:fs - 2, fontWeight:700, textTransform:'uppercase', letterSpacing:'.2em', color:'rgba(255,255,255,.6)' }}>Bulletin de</div>
          <div style={{ fontSize:fs + 12, fontWeight:900, textTransform:'uppercase', color:'#fff', lineHeight:1 }}>Paie</div>
          <div style={{ height:2, background:'rgba(255,255,255,.4)', margin:'4px 0' }} />
          <div style={{ fontSize:fs + 2, fontWeight:700, color:'#fff' }}>
            {MONTHS[(payroll.month ?? 1) - 1]} {payroll.year}
          </div>
        </div>
      </div>
    </div>
  );
}

function RenderValueCard({ block, payroll, primary }: { block: CanvasBlock; payroll: BulletinPayroll; primary: string }) {
  const s   = block.style;
  const fs  = getFS(s.fontSize);
  const val = block.variable ? resolveScalar(block.variable, payroll) : '—';
  const lbl = block.label || (block.variable ? (block.variable.split('.').pop() ?? '') : '');

  // Net à payer = mise en avant spéciale
  const isNet = block.variable === 'pay.netSalary';

  return (
    <div style={{
      background: isNet ? s.accentColor : s.backgroundColor,
      borderRadius: s.borderRadius,
      padding: getPad(s.padding),
      border: s.showBorder ? `1.5px solid ${isNet ? s.accentColor : '#e5e7eb'}` : 'none',
      display:'flex', justifyContent:'space-between', alignItems:'center',
    }}>
      <div>
        <div style={{ fontSize:fs - 1, fontWeight:700, textTransform:'uppercase', letterSpacing:'.1em', color: isNet ? 'rgba(255,255,255,.75)' : '#94a3b8', marginBottom:3 }}>
          {lbl}
        </div>
        {!isNet && <div style={{ fontSize:fs - 2, color:'#6b7280' }}>Montant en FCFA</div>}
      </div>
      <div style={{ fontSize: isNet ? fs + 14 : fs + 6, fontWeight:900, fontFamily:'monospace', color: isNet ? '#fff' : s.accentColor }}>
        {val}
      </div>
    </div>
  );
}

function RenderInfoGrid({ block, payroll }: { block: CanvasBlock; payroll: BulletinPayroll }) {
  const s  = block.style;
  const fs = getFS(s.fontSize);
  const e  = payroll.employee ?? {} as any;

  const rows: [string, string][] = [
    ['Nom',               [e.firstName, e.lastName].filter(Boolean).join(' ') || '—'],
    ['Matricule',         e.employeeNumber || '—'],
    ['Poste',             e.position || '—'],
    ['Département',       e.department?.name || '—'],
    ['Contrat',           CONTRACT[e.contractType ?? ''] ?? e.contractType ?? '—'],
    ['Ancienneté',        seniority(e.hireDate)],
    ['Situation',         MARITAL[e.maritalStatus ?? ''] ?? e.maritalStatus ?? '—'],
    ['N° CNSS',           e.cnssNumber || '—'],
    ['Paiement',          PAYMENT[e.paymentMethod ?? ''] ?? e.paymentMethod ?? '—'],
  ].filter(([, v]) => v && v !== '—') as [string, string][];

  return (
    <div style={{
      background: s.backgroundColor,
      borderRadius: s.borderRadius,
      padding: getPad(s.padding),
      border: s.showBorder ? '1.5px solid #e5e7eb' : 'none',
    }}>
      {block.label && (
        <div style={{ fontSize:fs - 2, fontWeight:800, textTransform:'uppercase', letterSpacing:'.1em', color:'#94a3b8', marginBottom:10, borderBottom:'1px solid #e5e7eb', paddingBottom:6 }}>
          {block.label}
        </div>
      )}
      {/* Période en haut */}
      <div style={{ background:'#f1f5f9', borderRadius:s.borderRadius, padding:'8px 12px', marginBottom:10, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <div>
          <div style={{ fontSize:fs - 3, fontWeight:700, textTransform:'uppercase', color:'#94a3b8' }}>Période de paie</div>
          <div style={{ fontSize:fs + 3, fontWeight:900, color:s.textColor }}>{MONTHS[(payroll.month ?? 1) - 1]} {payroll.year}</div>
        </div>
        {(e.professionalCategory || e.echelon) && (
          <div style={{ fontSize:fs - 1, color:'#475569', textAlign:'right' }}>
            {e.professionalCategory && <>Catégorie <strong>{e.professionalCategory}</strong></>}
            {e.echelon && ` · Échelon ${e.echelon}`}
          </div>
        )}
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'3px 20px' }}>
        {rows.map(([label, val]) => (
          <div key={label} style={{ display:'grid', gridTemplateColumns:'90px 1fr', gap:'0 6px', marginBottom:4 }}>
            <span style={{ fontSize:fs - 1.5, color:'#64748b' }}>{label}</span>
            <span style={{ fontSize:fs - 1.5, fontWeight:700, color:s.textColor }}>{val}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function RenderTable({ block, payroll }: { block: CanvasBlock; payroll: BulletinPayroll }) {
  const s     = block.style;
  const fs    = getFS(s.fontSize);
  const items = block.variable ? resolveItems(block.variable, payroll) : [];
  const pad   = getPad(s.padding);

  const isGain  = block.variable === 'items.gains' || block.variable === 'items.overtime' || block.variable === 'items.bonuses';
  const isDed   = block.variable === 'items.deductions';
  const isEmp   = block.variable === 'items.employer';

  const amountColor = (type: string) => {
    if (type === 'GAIN')          return '#15803d';
    if (type === 'DEDUCTION')     return '#b91c1c';
    if (type === 'EMPLOYER_COST') return '#c2410c';
    return s.textColor;
  };

  const sign = (type: string) => type === 'GAIN' ? '+' : type === 'DEDUCTION' ? '−' : '+';

  return (
    <div style={{
      borderRadius: s.borderRadius,
      overflow:'hidden',
      border: s.showBorder ? '1.5px solid #e5e7eb' : 'none',
    }}>
      {/* En-tête section */}
      <div style={{ background: s.accentColor, padding:`5px 14px`, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <span style={{ fontSize:fs - 2, fontWeight:900, textTransform:'uppercase', letterSpacing:'.1em', color:'#fff' }}>
          {block.label || 'Détail'}
        </span>
      </div>

      {items.length === 0 ? (
        <div style={{ padding:'20px', textAlign:'center', fontSize:fs - 1, color:'#94a3b8', background:s.backgroundColor }}>
          Aucune donnée
        </div>
      ) : (
        <table style={{ width:'100%', borderCollapse:'collapse', tableLayout:'fixed' }}>
          <colgroup>
            <col style={{ width:'50%' }} />
            <col style={{ width:'20%' }} />
            <col style={{ width:'13%' }} />
            <col style={{ width:'17%' }} />
          </colgroup>
          <thead>
            <tr>
              {['Désignation','Base (F)','Taux','Montant (F)'].map((h, i) => (
                <th key={h} style={{ background:'#1e293b', padding:`6px 12px`, textAlign: i === 0 ? 'left' : 'right', fontSize:fs - 2.5, fontWeight:700, textTransform:'uppercase', letterSpacing:'.08em', color:'#fff' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map((item: any, idx: number) => (
              <tr key={item.id ?? idx} style={{ background: idx % 2 === 0 ? s.backgroundColor : '#f9fafb' }}>
                <td style={{ padding:`${pad}`, borderBottom:'1px solid #e5e7eb', fontSize:fs - 0.5, color:s.textColor, fontWeight: s.bold ? 700 : 500 }}>
                  {cleanLabel(item.label || '—')}
                </td>
                <td style={{ padding:`${pad}`, borderBottom:'1px solid #e5e7eb', textAlign:'right', fontFamily:'monospace', fontSize:fs - 1.5, color:'#9ca3af' }}>
                  {item.base ? fmt(item.base) : '—'}
                </td>
                <td style={{ padding:`${pad}`, borderBottom:'1px solid #e5e7eb', textAlign:'right', fontFamily:'monospace', fontSize:fs - 1.5, color:'#9ca3af' }}>
                  {item.rate ? `${(item.rate * (item.type === 'GAIN' && item.rate > 1 ? 100 : 100)).toFixed(item.type === 'GAIN' && item.rate > 1 ? 0 : 2)}%` : '—'}
                </td>
                <td style={{ padding:`${pad}`, borderBottom:'1px solid #e5e7eb', textAlign:'right', fontFamily:'monospace', fontWeight:700, fontSize:fs + 0.5, color: amountColor(item.type) }}>
                  {sign(item.type)}{fmt(item.amount)}
                </td>
              </tr>
            ))}
            {/* Sous-total */}
            <tr>
              <td colSpan={3} style={{ background: isDed ? '#fef2f2' : isEmp ? '#fff7ed' : '#f0fdf4', padding:`8px 12px`, fontSize:fs - 1, fontWeight:700, textTransform:'uppercase', color: isDed ? '#b91c1c' : isEmp ? '#c2410c' : '#15803d' }}>
                {isDed ? 'Total retenues' : isEmp ? 'Total charges patronales' : 'Sous-total'}
              </td>
              <td style={{ background: isDed ? '#fef2f2' : isEmp ? '#fff7ed' : '#f0fdf4', padding:`8px 12px`, textAlign:'right', fontFamily:'monospace', fontWeight:700, fontSize:fs + 1, color: isDed ? '#b91c1c' : isEmp ? '#c2410c' : '#15803d' }}>
                {isDed ? '−' : '+'}{fmt(items.reduce((s: number, i: any) => s + (Number(i.amount) || 0), 0))}
              </td>
            </tr>
          </tbody>
        </table>
      )}
    </div>
  );
}

function RenderDivider({ block }: { block: CanvasBlock }) {
  return (
    <div style={{ padding:'4px 0' }}>
      <div style={{ height:2, background:`linear-gradient(90deg, ${block.style.accentColor}, transparent)`, borderRadius:1 }} />
    </div>
  );
}

function RenderText({ block, payroll }: { block: CanvasBlock; payroll: BulletinPayroll }) {
  const s  = block.style;
  const fs = getFS(s.fontSize);

  const isLegal = block.variable === 'static.legalMentions';
  const text    = block.variable === 'static.text' ? (block.staticText || '') : resolveScalar(block.variable ?? 'static.text', payroll);

  if (isLegal) {
    return (
      <div style={{ background:'#f8fafc', borderRadius:s.borderRadius, border:'1px solid #e5e7eb', overflow:'hidden' }}>
        <div style={{ background:s.accentColor, padding:'5px 12px', fontSize:fs - 2, fontWeight:700, textTransform:'uppercase', color:'#fff' }}>
          ⚖️ Réglementation — République du Congo
        </div>
        <div style={{ padding:'10px 12px', display:'grid', gridTemplateColumns:'1fr 1fr', gap:'3px 16px' }}>
          {['Code du Travail — Loi n°45-75 du 15 mars 1975','ITS 2026 — Barème progressif — Abattement 20%','CNSS salarié : 4% — Plafond : 1 200 000 FCFA','CNSS patronale : pensions 8% · famille 10% · AT 2,25%','SMIG Congo : 70 400 FCFA/mois (2026)','TUS : 7,5% sur brut total (DGI + CNSS)','HS — Décret n°78-360 : +10%·+25%·+50%·+100%',"L'ITS est prélevé à la source et reversé à la DGID"].map((item, i) => (
            <div key={i} style={{ display:'flex', gap:4 }}>
              <span style={{ color:'#cbd5e1', fontSize:fs - 2, flexShrink:0 }}>•</span>
              <span style={{ fontSize:fs - 2, color:'#64748b', lineHeight:1.5 }}>{item}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (block.variable === 'static.pageTitle') {
    return (
      <div style={{ textAlign:'center', padding: getPad(s.padding) }}>
        <div style={{ fontSize:fs + 8, fontWeight:900, textTransform:'uppercase', letterSpacing:'.15em', color:s.textColor }}>
          Bulletin de Paie
        </div>
      </div>
    );
  }

  return text ? (
    <div style={{
      background: `rgba(${s.accentColor.slice(1).match(/.{2}/g)?.map(h=>parseInt(h,16)).join(',') ?? '14,165,233'},.07)`,
      border: `1px solid rgba(${s.accentColor.slice(1).match(/.{2}/g)?.map(h=>parseInt(h,16)).join(',') ?? '14,165,233'},.25)`,
      borderRadius: s.borderRadius, padding: getPad(s.padding),
      display:'flex', gap:10, alignItems:'flex-start',
    }}>
      <span style={{ fontSize:16 }}>💬</span>
      <div>
        {block.label && <div style={{ fontSize:fs - 1, fontWeight:700, color:s.accentColor, marginBottom:3 }}>{block.label}</div>}
        <div style={{ fontSize:fs - 1, color:'#475569', fontStyle:'italic', lineHeight:1.6 }}>{text}</div>
      </div>
    </div>
  ) : (
    <div style={{ padding: getPad(s.padding), textAlign:'center', color:'#94a3b8', fontSize:fs - 1, fontStyle:'italic' }}>
      Texte non défini
    </div>
  );
}

function RenderSignatures({ block }: { block: CanvasBlock }) {
  const fs = getFS(block.style.fontSize);
  return (
    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:60, padding: getPad(block.style.padding) }}>
      {[{ l:"Signature de l'employeur", s:'Cachet & signature' }, { l:"Signature de l'employé", s:'Lu et approuvé' }].map(sg => (
        <div key={sg.l} style={{ textAlign:'center' }}>
          <div style={{ fontSize:fs - 1, fontWeight:700, color:'#4b5563', marginBottom:3 }}>{sg.l}</div>
          <div style={{ fontSize:fs - 2, color:'#9ca3af', marginBottom:10 }}>{sg.s}</div>
          <div style={{ height:38, borderBottom:'2px dashed #d1d5db' }} />
        </div>
      ))}
    </div>
  );
}

// ─── Rendu d'un bloc selon son type ──────────────────────────────────────────

function RenderBlock({ block, payroll, primary, secondary }: {
  block: CanvasBlock; payroll: BulletinPayroll; primary: string; secondary: string;
}) {
  switch (block.type) {
    case 'header':     return <RenderHeader     block={block} payroll={payroll} primary={primary} secondary={secondary} />;
    case 'value-card': return <RenderValueCard  block={block} payroll={payroll} primary={primary} />;
    case 'info-grid':  return <RenderInfoGrid   block={block} payroll={payroll} />;
    case 'table':      return <RenderTable      block={block} payroll={payroll} />;
    case 'divider':    return <RenderDivider    block={block} />;
    case 'text':       return <RenderText       block={block} payroll={payroll} />;
    case 'signatures': return <RenderSignatures block={block} />;
    default:           return null;
  }
}

// ─── Composant principal ──────────────────────────────────────────────────────

export default function CanvasRenderer({ layout, payroll, previewMode = false }: Props) {
  const sorted = [...layout.blocks].sort((a, b) => a.order - b.order);
  const font   = getFont(layout.fontFamily);

  // Blocs dont les sections ne doivent JAMAIS se couper à l'impression
  const isPriority = (type: CanvasBlock['type']) =>
    ['header', 'info-grid', 'table', 'value-card', 'signatures'].includes(type);

  return (
    <>
      <style>{`
        @media print {
          #canvas-root { width: 210mm !important; font-size: 11px !important; }
          .canvas-no-break { page-break-inside: avoid !important; break-inside: avoid !important; }
          .canvas-legal { display: none !important; }
          @page { size: A4 portrait; margin: 10mm 12mm; }
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        }
      `}</style>
      <div
        id="canvas-root"
        style={{
          fontFamily: font,
          fontSize:   12,
          background: '#fff',
          color:      '#111827',
          width:      previewMode ? '100%' : 'auto',
          boxSizing:  'border-box',
          padding:    8,
          display:    'flex',
          flexDirection: 'column',
          gap:        8,
        }}
      >
        {sorted.map(block => (
          <div
            key={block.id}
            className={`${isPriority(block.type) ? 'canvas-no-break' : ''} ${block.variable === 'static.legalMentions' ? 'canvas-legal' : ''}`}
          >
            <RenderBlock
              block={block}
              payroll={payroll}
              primary={layout.primaryColor}
              secondary={layout.secondaryColor}
            />
          </div>
        ))}

        {sorted.length === 0 && (
          <div style={{ padding:'60px 20px', textAlign:'center', color:'#94a3b8', fontSize:13 }}>
            <div style={{ fontSize:32, marginBottom:12 }}>📄</div>
            <div style={{ fontWeight:700, marginBottom:6 }}>Canvas vide</div>
            <div>Glissez des blocs depuis la palette pour construire votre bulletin</div>
          </div>
        )}
      </div>
    </>
  );
}
