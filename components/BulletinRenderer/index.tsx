'use client';

// ============================================================================
// components/BulletinRenderer/index.tsx
//
// ✅ Lit 100% des items[] retournés par l'API (SAL_BASE, HS_10/25/50/100,
//    BONUS_*, AUTO_BONUS_*, CNSS_SAL, ITS, BNC_SOURCE, LOAN, ADVANCE,
//    CTAX_*, CNSS_EMP, TUS_DGI, TUS_CNSS, CTAX_EMP_*)
// ✅ Champs employee complets : hireDate, contractType, echelon,
//    professionalCategory, nationalIdNumber, isSubjectToCnss, isSubjectToIrpp
// ✅ Labels bonus nettoyés (pas d'emojis 🤖✋ dans le bulletin imprimé)
// ✅ Taxes custom entreprise (CTAX_*) affichées ligne par ligne
// ✅ TUS DGI + TUS CNSS affichés séparément
// ✅ @media print : sections prioritaires ne se coupent jamais
//    Mentions légales masquées à l'impression
// ============================================================================

import React, { useMemo } from 'react';
import type { BulletinRendererProps, BulletinPayroll, BulletinTemplateConfig } from '@/types/bulletin-template';
import { getBaseTemplate } from '@/lib/bulletin-templates';

export type { BulletinRendererProps };

// ─── Constantes ───────────────────────────────────────────────────────────────

const MONTHS = [
  'Janvier','Février','Mars','Avril','Mai','Juin',
  'Juillet','Août','Septembre','Octobre','Novembre','Décembre',
];
const MARITAL: Record<string, string> = {
  SINGLE:'Célibataire', MARRIED:'Marié(e)', DIVORCED:'Divorcé(e)',
  WIDOWED:'Veuf/Veuve', COHABITING:'Concubinage',
};
const PAYMENT: Record<string, string> = {
  BANK_TRANSFER:'Virement bancaire', CASH:'Espèces',
  MOBILE_MONEY:'Mobile Money', CHECK:'Chèque',
};
const CONTRACT: Record<string, string> = {
  CDI:'CDI', CDD:'CDD', STAGE:'Stage', CONSULTANT:'Consultant/Prestataire',
  PRESTATAIRE:'Prestataire', INTERIM:'Intérimaire', FREELANCE:'Freelance',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(v: any): string {
  return Math.round(Number(v) || 0).toLocaleString('fr-FR');
}

function hex2rgb(hex: string): string {
  if (!hex || hex.length < 7) return '0,0,0';
  return `${parseInt(hex.slice(1,3),16)},${parseInt(hex.slice(3,5),16)},${parseInt(hex.slice(5,7),16)}`;
}

function initials(e: any): string {
  return ((e?.firstName?.[0] ?? '') + (e?.lastName?.[0] ?? '')).toUpperCase() || '?';
}

function seniority(hireDate?: string): string {
  if (!hireDate) return '—';
  const hire = new Date(hireDate);
  const now  = new Date();
  let y = now.getFullYear() - hire.getFullYear();
  let m = now.getMonth()    - hire.getMonth();
  if (m < 0) { y--; m += 12; }
  const parts: string[] = [];
  if (y > 0) parts.push(`${y} an${y > 1 ? 's' : ''}`);
  if (m > 0) parts.push(`${m} mois`);
  return parts.join(' ') || '< 1 mois';
}

function cleanLabel(label: string): string {
  // Nettoie les emojis 🤖✋ insérés par payroll-items.service.ts
  return label.replace(/^[🤖✋]\s*/, '').trim();
}

function getFont(f: string): string {
  if (f === 'serif') return '"Georgia","Times New Roman",serif';
  if (f === 'mono')  return '"Courier New","Lucida Console",monospace';
  return '"Inter","Helvetica Neue",Arial,sans-serif';
}
function getFS(s: string): number { return s === 'sm' ? 10 : s === 'lg' ? 12.5 : 11.5; }
function getPad(d: string): string { return d === 'compact' ? '5px 12px' : d === 'airy' ? '10px 18px' : '7px 14px'; }
function getSecPad(d: string): string { return d === 'compact' ? '8px 14px' : d === 'airy' ? '18px 22px' : '13px 18px'; }

// ─── Composant principal ──────────────────────────────────────────────────────

export default function BulletinRenderer({
  payroll,
  template,
  previewMode = false,
}: BulletinRendererProps) {
  const cfg    = template ?? getBaseTemplate('default');
  const st     = cfg.style;
  const p      = st.primaryColor;
  const s2     = st.secondaryColor;
  const tc     = st.textColor;
  const r      = st.borderRadius;
  const font   = getFont(st.fontFamily);
  const fs     = getFS(st.fontSize);
  const pad    = getPad(st.density);
  const secPad = getSecPad(st.density);

  const vis = useMemo(
    () => new Set([...cfg.blocks].sort((a, b) => a.order - b.order).filter(b => b.visible).map(b => b.id)),
    [cfg.blocks],
  );
  const lbl = (id: string, fallback: string) => cfg.blocks.find(b => b.id === id)?.label ?? fallback;

  const emp  = payroll.employee ?? {} as any;
  const comp = payroll.company  ?? {} as any;

  // ── Catégorisation des items par code ────────────────────────────────────────

  const items = payroll.items ?? [];

  // Gains
  const salaryItems = items.filter(i =>
    i.type === 'GAIN' &&
    ['SAL_BASE','INDEM_CONGE'].includes(i.code)
  ).sort((a, b) => a.order - b.order);

  const leaveDeduct = items.find(i => i.code === 'ABS_CONGE' || i.code === 'ABS_DEDUCT');

  const otItems = items.filter(i =>
    i.type === 'GAIN' &&
    ['HS_10','HS_25','HS_50','HS_100'].includes(i.code)
  ).sort((a, b) => a.order - b.order);

  const bonusItems = items.filter(i =>
    i.type === 'GAIN' &&
    !['SAL_BASE','INDEM_CONGE'].includes(i.code) &&
    !['HS_10','HS_25','HS_50','HS_100'].includes(i.code) &&
    (i.code.startsWith('BONUS_') || i.code.startsWith('AUTO_BONUS_') ||
     i.code.startsWith('PRIME_') || i.code.startsWith('TRANSPORT') ||
     i.code.startsWith('REPAS') || i.code.startsWith('PANIER') ||
     i.code.startsWith('INDEM_') || i.code.startsWith('ALLOC_'))
  ).sort((a, b) => a.order - b.order);

  // Déductions salariales
  const cnssItem  = items.find(i => i.code === 'CNSS_SAL');
  const irppItem  = items.find(i => i.code === 'ITS' || i.code === 'BNC_SOURCE');
  const loanItems = items.filter(i => i.code === 'LOAN').sort((a, b) => a.order - b.order);
  const advItems  = items.filter(i => i.code === 'ADVANCE').sort((a, b) => a.order - b.order);

  // Taxes custom salariales (CTAX_* mais pas CTAX_EMP_*)
  const customSalTaxItems = items.filter(i =>
    i.type === 'DEDUCTION' &&
    i.code.startsWith('CTAX_') &&
    !i.code.startsWith('CTAX_EMP_')
  ).sort((a, b) => a.order - b.order);

  // Charges patronales
  const cnssEmpItem  = items.find(i => i.code === 'CNSS_EMP');
  const tusDgiItem   = items.find(i => i.code === 'TUS_DGI');
  const tusCnssItem  = items.find(i => i.code === 'TUS_CNSS');
  // Fallback si TUS_DGI/TUS_CNSS pas encore dans la BDD (anciens bulletins avec code 'TUS')
  const tusOldItem   = items.find(i => i.code === 'TUS');
  const customEmpTaxItems = items.filter(i =>
    i.type === 'EMPLOYER_COST' &&
    i.code.startsWith('CTAX_EMP_')
  ).sort((a, b) => a.order - b.order);

  // Valeurs numériques (fallback sur les champs directs du payroll)
  const cnssAmt      = Number(cnssItem?.amount  ?? payroll.cnssSalarial   ?? 0);
  const irppAmt      = Number(irppItem?.amount  ?? payroll.its             ?? 0);
  const totalRet     = Number(payroll.totalDeductions ?? 0);
  const cnssEmpAmt   = Number(cnssEmpItem?.amount ?? payroll.cnssEmployer ?? 0);
  const tusDgiAmt    = Number(tusDgiItem?.amount  ?? payroll.tusDgiAmount  ?? 0);
  const tusCnssAmt   = Number(tusCnssItem?.amount ?? payroll.tusCnssAmount ?? 0);
  // Si anciens bulletins avec TUS groupé
  const tusTotAmt    = tusDgiAmt + tusCnssAmt || Number(tusOldItem?.amount ?? payroll.tusTotal ?? 0);
  const cnssPatTot   = Number(payroll.cnssEmployerPension  ?? 0)
                     + Number(payroll.cnssEmployerFamily   ?? 0)
                     + Number(payroll.cnssEmployerAccident ?? 0);
  const customEmpTot = customEmpTaxItems.reduce((s, i) => s + i.amount, 0);

  const totalOT = Number(payroll.overtimeHours10  ?? 0)
                + Number(payroll.overtimeHours25  ?? 0)
                + Number(payroll.overtimeHours50  ?? 0)
                + Number(payroll.overtimeHours100 ?? 0);

  const today = new Date().toLocaleDateString('fr-FR', { day:'2-digit', month:'long', year:'numeric' });

  // ── Table row helpers ─────────────────────────────────────────────────────

  let rowIdx = 0;

  const TRow = ({
    label, sub, base, rate, amount, color,
  }: {
    label: string; sub?: string; base?: string; rate?: string; amount: string; color: string;
  }) => {
    const bg = rowIdx++ % 2 === 0 ? '#fff' : '#f9fafb';
    return (
      <tr>
        <td style={{ background:bg, padding:pad, borderBottom:'1px solid #e5e7eb', verticalAlign:'top' }}>
          <div style={{ fontSize:fs, fontWeight:600, color:tc, lineHeight:1.3 }}>{label}</div>
          {sub && <div style={{ fontSize:fs - 2, color:'#9ca3af', marginTop:1, lineHeight:1.3 }}>{sub}</div>}
        </td>
        <td style={{ background:bg, padding:pad, borderBottom:'1px solid #e5e7eb', textAlign:'right', fontFamily:'monospace', fontSize:fs - 2, color:'#9ca3af' }}>
          {base ?? '—'}
        </td>
        <td style={{ background:bg, padding:pad, borderBottom:'1px solid #e5e7eb', textAlign:'right', fontFamily:'monospace', fontSize:fs - 2, color:'#9ca3af' }}>
          {rate ?? '—'}
        </td>
        <td style={{ background:bg, padding:pad, borderBottom:'1px solid #e5e7eb', textAlign:'right', fontFamily:'monospace', fontWeight:700, fontSize:fs + 0.5, color }}>
          {amount}
        </td>
      </tr>
    );
  };

  const SHead = ({ label, color }: { label: string; color: string }) => (
    <tr>
      <td colSpan={4} style={{ background:color, padding:`5px 14px`, fontSize:fs - 2, fontWeight:900, textTransform:'uppercase', letterSpacing:'.1em', color:'#fff' }}>
        {label}
      </td>
    </tr>
  );

  const SubTotal = ({ label, amount, color, bg }: { label:string; amount:string; color:string; bg:string }) => (
    <tr>
      <td colSpan={3} style={{ background:bg, padding:`8px 14px`, borderTop:`2px solid ${color}33`, fontSize:fs - 1, fontWeight:700, textTransform:'uppercase', color }}>
        {label}
      </td>
      <td style={{ background:bg, padding:`8px 14px`, borderTop:`2px solid ${color}33`, textAlign:'right', fontFamily:'monospace', fontWeight:700, fontSize:fs + 1, color }}>
        {amount}
      </td>
    </tr>
  );

  // ── En-tête entreprise ────────────────────────────────────────────────────

  const logoEl = st.showLogo
    ? comp.logo
      ? <div style={{ width:44, height:44, borderRadius:r, overflow:'hidden', border:'1px solid #e2e8f0', flexShrink:0 }}>
          <img src={comp.logo} alt="Logo" style={{ width:'100%', height:'100%', objectFit:'contain' }} />
        </div>
      : <div style={{ width:40, height:40, borderRadius:r, background:`rgba(${hex2rgb(p)},.12)`, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:900, fontSize:14, color:p, flexShrink:0 }}>
          {(comp.tradeName || comp.legalName || 'E')[0]}
        </div>
    : null;

  const CompanyInfo = ({ dark }: { dark: boolean }) => (
    <div>
      <div style={{ fontSize:fs + 2, fontWeight:900, color:dark ? '#fff' : tc, marginBottom:3 }}>
        {comp.tradeName || comp.legalName || 'Entreprise'}
      </div>
      {st.showAddress && comp.address && (
        <div style={{ fontSize:fs - 2, color:dark ? '#94a3b8' : '#64748b' }}>
          {comp.address}{comp.city ? `, ${comp.city}` : ''}
        </div>
      )}
      {st.showFiscalNumbers && (
        <div style={{ display:'flex', gap:10, flexWrap:'wrap', marginTop:3, fontSize:fs - 2, color:dark ? '#94a3b8' : '#64748b' }}>
          {comp.rccmNumber && <span>RCCM : <strong style={{ color:dark?'#e2e8f0':tc }}>{comp.rccmNumber}</strong></span>}
          {comp.cnssNumber && <span>CNSS : <strong style={{ color:dark?'#e2e8f0':tc }}>{comp.cnssNumber}</strong></span>}
          {comp.phone      && <span>Tél : <strong style={{ color:dark?'#e2e8f0':tc }}>{comp.phone}</strong></span>}
        </div>
      )}
    </div>
  );

  const TitleEl = ({ dark }: { dark: boolean }) => (
    <div style={{ textAlign:'right', flexShrink:0 }}>
      <div style={{ fontSize:fs - 3, fontWeight:700, textTransform:'uppercase', letterSpacing:'.2em', color:dark?'#64748b':'#94a3b8' }}>Bulletin de</div>
      <div style={{ fontSize:fs + 10, fontWeight:900, textTransform:'uppercase', letterSpacing:'.12em', color:dark?'#fff':tc, lineHeight:1 }}>Paie</div>
      <div style={{ height:2, background:`linear-gradient(to left,${p},transparent)`, margin:'4px 0' }} />
      <div style={{ fontSize:fs + 2, fontWeight:700, color:p }}>{MONTHS[(payroll.month ?? 1) - 1]} {payroll.year}</div>
    </div>
  );

  const renderHeader = () => {
    if (st.headerStyle === 'dark') return (
      <div style={{ background:'#0f172a', padding:secPad }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:16 }}>
          <div style={{ display:'flex', gap:12, alignItems:'flex-start', flex:1 }}>
            {st.logoPosition !== 'right' && logoEl}
            <div style={{ flex: st.logoPosition === 'center' ? 1 : undefined, textAlign: st.logoPosition === 'center' ? 'center' : 'left' }}>
              <CompanyInfo dark />
            </div>
            {st.logoPosition === 'right' && logoEl}
          </div>
          <TitleEl dark />
        </div>
      </div>
    );

    if (st.headerStyle === 'minimal') return (
      <div style={{ padding:secPad, borderBottom:'1px solid #e2e8f0', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <div style={{ fontSize:fs + 1, fontWeight:700, color:tc }}>{comp.tradeName || comp.legalName}</div>
        <div style={{ fontSize:fs, color:'#64748b' }}>
          Bulletin · <strong style={{ color:p }}>{MONTHS[(payroll.month ?? 1) - 1]} {payroll.year}</strong>
        </div>
      </div>
    );

    if (st.headerStyle === 'line') return (
      <div style={{ padding:secPad, borderBottom:`3px solid ${p}` }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:16 }}>
          <div style={{ display:'flex', gap:12, alignItems:'flex-start', flex:1 }}>{logoEl}<CompanyInfo dark={false} /></div>
          <TitleEl dark={false} />
        </div>
      </div>
    );

    // gradient (défaut)
    return (
      <>
        <div style={{ height:4, background:`linear-gradient(90deg,${p},${s2})` }} />
        <div style={{ padding:secPad, borderBottom:'1px solid #e2e8f0', display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:16 }}>
          <div style={{ display:'flex', gap:12, alignItems:'flex-start', flex:1 }}>{logoEl}<CompanyInfo dark={false} /></div>
          <TitleEl dark={false} />
        </div>
      </>
    );
  };

  // ── Bloc employé + temps de travail ──────────────────────────────────────

  const renderEmployee = () => {
    const showTime = vis.has('time');
    return (
      <div style={{ padding:secPad, borderBottom:'1.5px solid #e2e8f0' }}>
        {/* Bande période */}
        <div style={{ background:'#f1f5f9', borderRadius:r, padding:'10px 16px', marginBottom:14, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div>
            <div style={{ fontSize:fs - 3, fontWeight:800, textTransform:'uppercase', letterSpacing:'.1em', color:'#94a3b8' }}>Période de paie</div>
            <div style={{ fontSize:fs + 4, fontWeight:900, color:tc }}>{MONTHS[(payroll.month ?? 1) - 1]} {payroll.year}</div>
          </div>
          {(emp.professionalCategory || emp.echelon) && (
            <div style={{ fontSize:fs - 1, color:'#475569', textAlign:'right', lineHeight:1.6 }}>
              {emp.professionalCategory && <>Catégorie <strong style={{ color:tc }}>{emp.professionalCategory}</strong></>}
              {emp.echelon && ` · Échelon ${emp.echelon}`}
            </div>
          )}
        </div>

        <div style={{ display:'grid', gridTemplateColumns:showTime ? '1fr 1fr' : '1fr', gap:'0 24px' }}>
          {/* Infos employé */}
          <div>
            <div style={{ fontSize:fs - 3, fontWeight:800, textTransform:'uppercase', letterSpacing:'.1em', color:'#94a3b8', borderBottom:'1px solid #e2e8f0', paddingBottom:5, marginBottom:8 }}>
              {lbl('employee', 'Informations Employé')}
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8 }}>
              <div style={{ width:34, height:34, borderRadius:'50%', background:`linear-gradient(135deg,${p},${s2})`, display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:900, fontSize:13, flexShrink:0 }}>
                {initials(emp)}
              </div>
              <div>
                <div style={{ fontSize:fs + 2, fontWeight:900, color:tc }}>{emp.firstName} {emp.lastName}</div>
                <div style={{ fontSize:fs - 2, color:'#64748b', fontFamily:'monospace' }}>
                  {emp.employeeNumber ? `Matricule : ${emp.employeeNumber}` : '—'}
                </div>
              </div>
            </div>
            {[
              ['Poste',              emp.position],
              ['Département',        emp.department?.name],
              ['Contrat',            CONTRACT[emp.contractType ?? ''] ?? emp.contractType],
              ['Ancienneté',         seniority(emp.hireDate)],
              ['Situation familiale', MARITAL[emp.maritalStatus ?? ''] ?? emp.maritalStatus],
              ['N° CNSS',            emp.cnssNumber],
              ['Mode de paiement',   PAYMENT[emp.paymentMethod ?? ''] ?? emp.paymentMethod],
            ].map(([label, val]) => (
              <div key={label as string} style={{ display:'grid', gridTemplateColumns:'130px 1fr', gap:'2px 6px', marginBottom:4 }}>
                <span style={{ fontSize:fs - 1.5, color:'#64748b' }}>{label}</span>
                <span style={{ fontSize:fs - 1.5, fontWeight:700, color:tc }}>{val || '—'}</span>
              </div>
            ))}
            {/* Badges exemptions */}
            {(emp.isSubjectToCnss === false || emp.isSubjectToIrpp === false) && (
              <div style={{ display:'flex', gap:5, marginTop:6, flexWrap:'wrap' }}>
                {emp.isSubjectToCnss === false && (
                  <span style={{ fontSize:fs - 3, background:'#fef3c7', color:'#b45309', padding:'2px 6px', borderRadius:4, fontWeight:700 }}>CNSS : exempté</span>
                )}
                {emp.isSubjectToIrpp === false && (
                  <span style={{ fontSize:fs - 3, background:'#fef3c7', color:'#b45309', padding:'2px 6px', borderRadius:4, fontWeight:700 }}>ITS : exempté</span>
                )}
              </div>
            )}
          </div>

          {/* Temps de travail */}
          {showTime && (
            <div>
              <div style={{ fontSize:fs - 3, fontWeight:800, textTransform:'uppercase', letterSpacing:'.1em', color:'#94a3b8', borderBottom:'1px solid #e2e8f0', paddingBottom:5, marginBottom:8 }}>
                {lbl('time', 'Temps de Travail')}
              </div>
              {[
                { label:'Jours ouvrables',   val:`${payroll.workDays} jours`,   color:'#0f172a'  },
                { label:'Jours travaillés',  val:`${payroll.workedDays} jours`, color:'#059669'  },
                (payroll.absenceDays ?? 0) > 0 && { label:'Absences', val:`${payroll.absenceDays} j`, color:'#dc2626' },
                (payroll.daysOnLeave ?? 0) > 0 && { label:'Congés payés', val:`${payroll.daysOnLeave} j`, color:p },
                (payroll.daysRemote  ?? 0) > 0 && { label:'Télétravail',  val:`${payroll.daysRemote} j`,  color:'#7c3aed' },
              ].filter(Boolean).map((row: any) => (
                <div key={row.label} style={{ display:'flex', justifyContent:'space-between', marginBottom:5 }}>
                  <span style={{ fontSize:fs - 1.5, color:'#64748b' }}>{row.label}</span>
                  <span style={{ fontSize:fs - 1.5, fontWeight:700, fontFamily:'monospace', color:row.color }}>{row.val}</span>
                </div>
              ))}
              {totalOT > 0 && (
                <>
                  <div style={{ borderTop:'1px dashed #e2e8f0', margin:'8px 0' }} />
                  <div style={{ display:'flex', justifyContent:'space-between' }}>
                    <span style={{ fontSize:fs - 1.5, color:'#64748b' }}>Heures supplémentaires</span>
                    <span style={{ fontSize:fs - 1.5, fontWeight:700, fontFamily:'monospace', color:'#d97706' }}>{totalOT}h total</span>
                  </div>
                  <div style={{ fontSize:fs - 3, color:'#d97706', textAlign:'right', fontFamily:'monospace', marginTop:2 }}>
                    {[
                      payroll.overtimeHours10  ? `${payroll.overtimeHours10}h (+10%)`  : null,
                      payroll.overtimeHours25  ? `${payroll.overtimeHours25}h (+25%)`  : null,
                      payroll.overtimeHours50  ? `${payroll.overtimeHours50}h (+50%)`  : null,
                      payroll.overtimeHours100 ? `${payroll.overtimeHours100}h (+100%)` : null,
                    ].filter(Boolean).join(' · ')}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  // ── Tableau de paie ───────────────────────────────────────────────────────

  const renderTable = () => {
    const showSalary = vis.has('salary');
    const showOT     = vis.has('overtime');
    const showBonus  = vis.has('bonuses');
    const showDed    = vis.has('deductions');
    const showEmp    = vis.has('employer');
    rowIdx = 0;

    return (
      <div style={{ borderRadius:r, overflow:'hidden', border:'1.5px solid #e5e7eb' }}>
        <table style={{ width:'100%', borderCollapse:'collapse', tableLayout:'fixed' }}>
          <colgroup>
            <col style={{ width:'46%' }} /><col style={{ width:'20%' }} />
            <col style={{ width:'13%' }} /><col style={{ width:'21%' }} />
          </colgroup>
          <thead>
            <tr>
              {[['Désignation','left'],['Base (FCFA)','right'],['Taux','right'],['Montant (FCFA)','right']].map(([h, a]) => (
                <th key={h} style={{ background:tc, padding:`8px 14px`, textAlign:a as any, fontSize:fs - 2, fontWeight:900, textTransform:'uppercase', letterSpacing:'.1em', color:'#fff' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>

            {/* ── RÉMUNÉRATIONS ── */}
            {showSalary && (
              <>
                <SHead label={lbl('salary', 'Rémunérations')} color="#15803d" />
                {salaryItems.length > 0
                  ? salaryItems.map(i => (
                      <TRow key={i.id}
                        label={cleanLabel(i.label)}
                        base={i.base ? fmt(i.base) : undefined}
                        rate={i.rate ? `${(i.rate * 100).toFixed(0)}%` : undefined}
                        amount={`+${fmt(i.amount)}`}
                        color="#15803d"
                      />
                    ))
                  : <TRow
                      label={lbl('salary', 'Salaire de base')}
                      amount={`+${fmt(payroll.baseSalary ?? payroll.grossSalary)}`}
                      color="#15803d"
                    />
                }
                {leaveDeduct && (
                  <TRow
                    label={cleanLabel(leaveDeduct.label)}
                    base={leaveDeduct.base ? fmt(leaveDeduct.base) : undefined}
                    amount={`−${fmt(leaveDeduct.amount)}`}
                    color="#b45309"
                  />
                )}
              </>
            )}

            {/* ── HEURES SUPPLÉMENTAIRES ── */}
            {showOT && otItems.length > 0 && (
              <>
                <SHead label={lbl('overtime', 'Heures Supplémentaires — Décret n°78-360')} color="#b45309" />
                {otItems.map(i => (
                  <TRow key={i.id}
                    label={cleanLabel(i.label)}
                    base={i.base ? fmt(i.base) : undefined}
                    rate={i.rate ? `+${((i.rate - 1) * 100).toFixed(0)}%` : undefined}
                    amount={`+${fmt(i.amount)}`}
                    color="#b45309"
                  />
                ))}
              </>
            )}

            {/* ── PRIMES & AVANTAGES ── */}
            {showBonus && bonusItems.length > 0 && (
              <>
                <SHead label={lbl('bonuses', 'Primes & Accessoires')} color="#0e7490" />
                {bonusItems.map(i => (
                  <TRow key={i.id}
                    label={cleanLabel(i.label)}
                    rate={undefined}
                    amount={`+${fmt(i.amount)}`}
                    color="#0e7490"
                  />
                ))}
              </>
            )}

            {/* ── TOTAL BRUT ── */}
            <tr>
              <td colSpan={3} style={{ background:'#15803d', padding:`9px 14px`, fontSize:fs - 1, fontWeight:900, textTransform:'uppercase', letterSpacing:'.08em', color:'#fff' }}>
                Total Brut
              </td>
              <td style={{ background:'#15803d', padding:`9px 14px`, textAlign:'right', fontFamily:'monospace', fontWeight:900, fontSize:fs + 4, color:'#fff' }}>
                {fmt(payroll.grossSalary)}
              </td>
            </tr>

            {/* ── COTISATIONS SALARIALES ── */}
            {showDed && (
              <>
                <SHead label={lbl('deductions', 'Cotisations & Retenues Salariales')} color="#b91c1c" />

                {/* CNSS salariale */}
                <TRow
                  label="CNSS Salariale — Branche Pension"
                  sub="Caisse Nationale de Sécurité Sociale"
                  base={cnssItem?.base ? fmt(cnssItem.base) : fmt(payroll.grossSalary)}
                  rate="4 %"
                  amount={`−${fmt(cnssAmt)}`}
                  color="#b91c1c"
                />

                {/* ITS / IRPP / BNC */}
                <TRow
                  label={irppItem ? cleanLabel(irppItem.label) : 'ITS — Impôt sur les Traitements et Salaires'}
                  sub={irppItem?.code === 'BNC_SOURCE' ? 'Retenue à la source BNC' : 'Barème progressif 2026 — Abattement 20%'}
                  base={irppItem?.base ? fmt(irppItem.base) : undefined}
                  rate={irppItem?.code === 'BNC_SOURCE' ? undefined : 'Barème'}
                  amount={`−${fmt(irppAmt)}`}
                  color="#b91c1c"
                />

                {/* Taxes custom salariales (CAMU, TOL, taxe apprentissage…) */}
                {customSalTaxItems.map(i => (
                  <TRow key={i.id}
                    label={cleanLabel(i.label)}
                    sub="Taxe spécifique entreprise"
                    base={i.base ? fmt(i.base) : undefined}
                    rate={i.rate ? `${(i.rate * 100).toFixed(2)}%` : undefined}
                    amount={`−${fmt(i.amount)}`}
                    color="#0f766e"
                  />
                ))}

                {/* Prêts */}
                {loanItems.length > 0 && (
                  <>
                    <SHead label="Retenues Facultatives — Prêts & Avances" color="#7e22ce" />
                    {loanItems.map(i => (
                      <TRow key={i.id} label={cleanLabel(i.label)} amount={`−${fmt(i.amount)}`} color="#7e22ce" />
                    ))}
                  </>
                )}

                {/* Avances */}
                {advItems.length > 0 && (
                  <>
                    {loanItems.length === 0 && <SHead label="Retenues Facultatives — Avances" color="#7e22ce" />}
                    {advItems.map(i => (
                      <TRow key={i.id} label={cleanLabel(i.label)} amount={`−${fmt(i.amount)}`} color="#7e22ce" />
                    ))}
                  </>
                )}

                <SubTotal
                  label="Total Retenues Salariales"
                  amount={`−${fmt(totalRet)}`}
                  color="#b91c1c" bg="#fef2f2"
                />
              </>
            )}

            {/* ── CHARGES PATRONALES ── */}
            {showEmp && (
              <>
                <SHead label={lbl('employer', 'Part Patronale — Charges Sociales Employeur')} color="#c2410c" />

                {/* CNSS pension */}
                {(payroll.cnssEmployerPension ?? 0) > 0 && (
                  <TRow
                    label="CNSS Patronale — Pensions (Vieillesse / Invalidité)"
                    sub="Plafond mensuel : 1 200 000 FCFA"
                    rate="8 %"
                    amount={`+${fmt(payroll.cnssEmployerPension)}`}
                    color="#c2410c"
                  />
                )}
                {/* CNSS famille */}
                {(payroll.cnssEmployerFamily ?? 0) > 0 && (
                  <TRow
                    label="CNSS Patronale — Prestations Familiales"
                    sub="Plafond mensuel : 600 000 FCFA"
                    rate="10,03 %"
                    amount={`+${fmt(payroll.cnssEmployerFamily)}`}
                    color="#c2410c"
                  />
                )}
                {/* CNSS accident */}
                {(payroll.cnssEmployerAccident ?? 0) > 0 && (
                  <TRow
                    label="CNSS Patronale — Accidents du Travail"
                    sub="Plafond mensuel : 600 000 FCFA"
                    rate="2,25 %"
                    amount={`+${fmt(payroll.cnssEmployerAccident)}`}
                    color="#c2410c"
                  />
                )}
                {/* Fallback si cnssEmployerPension/Family/Accident pas dispo (anciens bulletins) */}
                {cnssPatTot === 0 && cnssEmpAmt > 0 && (
                  <TRow
                    label={cnssEmpItem ? cleanLabel(cnssEmpItem.label) : 'CNSS Patronale (total)'}
                    amount={`+${fmt(cnssEmpAmt)}`}
                    color="#c2410c"
                  />
                )}

                {/* TUS DGI — item séparé (nouveaux bulletins) */}
                {tusDgiAmt > 0 && (
                  <TRow
                    label="TUS — Part DGI (2,025%)"
                    sub="Taxe Unique sur Salaires · versée à la DGI"
                    rate="2,025 %"
                    amount={`+${fmt(tusDgiAmt)}`}
                    color="#c2410c"
                  />
                )}
                {/* TUS CNSS — item séparé (nouveaux bulletins) */}
                {tusCnssAmt > 0 && (
                  <TRow
                    label="TUS — Part CNSS (5,475%)"
                    sub="Taxe Unique sur Salaires · versée à la CNSS"
                    rate="5,475 %"
                    amount={`+${fmt(tusCnssAmt)}`}
                    color="#c2410c"
                  />
                )}
                {/* Fallback anciens bulletins avec TUS groupé */}
                {tusDgiAmt === 0 && tusCnssAmt === 0 && tusTotAmt > 0 && (
                  <TRow
                    label={tusOldItem ? cleanLabel(tusOldItem.label) : 'TUS (DGI + CNSS)'}
                    sub="Taxe Unique sur Salaires"
                    amount={`+${fmt(tusTotAmt)}`}
                    color="#c2410c"
                  />
                )}

                {/* Taxes custom patronales */}
                {customEmpTaxItems.map(i => (
                  <TRow key={i.id}
                    label={cleanLabel(i.label)}
                    sub="Taxe spécifique entreprise (part patronale)"
                    base={i.base ? fmt(i.base) : undefined}
                    rate={i.rate ? `${(i.rate * 100).toFixed(2)}%` : undefined}
                    amount={`+${fmt(i.amount)}`}
                    color="#0f766e"
                  />
                ))}

                <SubTotal
                  label="Total Charges Patronales"
                  amount={`+${fmt(cnssPatTot + tusTotAmt + customEmpTot || cnssEmpAmt + tusTotAmt)}`}
                  color="#c2410c" bg="#fff7ed"
                />
              </>
            )}
          </tbody>
        </table>

        {/* ── NET À PAYER ── */}
        <div style={{ background:tc, padding:secPad, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div>
            <div style={{ fontSize:fs - 2.5, fontWeight:700, textTransform:'uppercase', letterSpacing:'.25em', color:'#9ca3af', marginBottom:3 }}>
              Net à Payer
            </div>
            <div style={{ fontSize:fs - 3, color:'#6b7280' }}>Montant net versé à l'employé</div>
          </div>
          <div style={{ textAlign:'right' }}>
            <span style={{ fontSize:fs + 16, fontWeight:900, fontFamily:'monospace', color:'#fff' }}>
              {fmt(payroll.netSalary)}
            </span>
            <span style={{ marginLeft:8, fontSize:fs, color:'#6b7280' }}>FCFA</span>
          </div>
        </div>
      </div>
    );
  };

  // ── Récapitulatif ─────────────────────────────────────────────────────────

  const renderRecap = () => {
    const hPad = secPad.split(' ')[1] ?? '18px';
    return (
      <div style={{ padding:`0 ${hPad} 12px` }}>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
          <div style={{ background:`rgba(${hex2rgb(p)},.08)`, borderRadius:r, padding:'12px 16px', border:`1.5px solid rgba(${hex2rgb(p)},.3)`, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <span style={{ fontSize:fs, fontWeight:700, color:p }}>Net à payer</span>
            <span style={{ fontSize:fs + 5, fontFamily:'monospace', fontWeight:900, color:p }}>{fmt(payroll.netSalary)} F</span>
          </div>
          <div style={{ background:'#fff7ed', borderRadius:r, padding:'12px 16px', border:'1.5px solid #fed7aa', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <span style={{ fontSize:fs, fontWeight:700, color:'#c2410c' }}>Coût employeur</span>
            <span style={{ fontSize:fs + 5, fontFamily:'monospace', fontWeight:900, color:'#c2410c' }}>{fmt(payroll.totalEmployerCost)} F</span>
          </div>
        </div>
      </div>
    );
  };

  // ── Signatures ────────────────────────────────────────────────────────────

  const renderSignatures = () => (
    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:60, padding:secPad }}>
      {[
        { l:"Signature de l'employeur", s:'Cachet & signature' },
        { l:"Signature de l'employé",   s:'Lu et approuvé'    },
      ].map(sg => (
        <div key={sg.l} style={{ textAlign:'center' }}>
          <div style={{ fontSize:fs - 1, fontWeight:700, color:'#4b5563', marginBottom:3 }}>{sg.l}</div>
          <div style={{ fontSize:fs - 2, color:'#9ca3af', marginBottom:10 }}>{sg.s}</div>
          <div style={{ height:38, borderBottom:'2px dashed #d1d5db' }} />
        </div>
      ))}
    </div>
  );

  // ── Message personnalisé ──────────────────────────────────────────────────

  const renderMessage = () => {
    if (!st.footerMessage) return null;
    const hPad = secPad.split(' ')[1] ?? '18px';
    return (
      <div style={{ margin:`0 ${hPad} 14px`, background:`rgba(${hex2rgb(p)},.07)`, border:`1px solid rgba(${hex2rgb(p)},.25)`, borderRadius:r, padding:'10px 14px', display:'flex', gap:10, alignItems:'flex-start' }}>
        <span style={{ fontSize:16 }}>💬</span>
        <div>
          <div style={{ fontSize:fs - 1, fontWeight:700, color:p, marginBottom:3 }}>Message de l'employeur</div>
          <div style={{ fontSize:fs - 1, color:'#475569', fontStyle:'italic' }}>{st.footerMessage}</div>
        </div>
      </div>
    );
  };

  // ── Mentions légales — APP ONLY, jamais imprimées ─────────────────────────

  const renderLegal = () => (
    <div style={{ padding:`0 ${secPad.split(' ')[1] ?? '18px'} 16px`, borderTop:'1px solid #e5e7eb', marginTop:8 }}>
      <div style={{ borderRadius:r, border:'1px solid #e5e7eb', overflow:'hidden', marginBottom:8 }}>
        <div style={{ background:'#f8fafc', padding:'7px 14px', borderBottom:'1px solid #e5e7eb', fontSize:fs - 3, fontWeight:800, textTransform:'uppercase', letterSpacing:'.1em', color:'#475569' }}>
          ⚖️ Réglementation — République du Congo (Brazzaville)
        </div>
        <div style={{ background:'#fff', padding:'10px 14px', display:'grid', gridTemplateColumns:'1fr 1fr', gap:'3px 20px' }}>
          {[
            'Code du Travail — Loi n°45-75 du 15 mars 1975',
            'ITS 2026 — Barème progressif — Abattement 20%',
            'CNSS salarié : 4% — Plafond pension : 1 200 000 FCFA',
            'CNSS patronale : pensions 8% · famille 10% · AT 2,25%',
            'SMIG Congo : 70 400 FCFA/mois (2026)',
            'TUS : 7,5% sur brut total (DGI 2,025% + CNSS 5,475%)',
            'HS — Décret n°78-360 : +10% · +25% · +50% · +100%',
            "L'ITS est prélevé à la source — reversé à la DGID",
          ].map((item, i) => (
            <div key={i} style={{ display:'flex', gap:4 }}>
              <span style={{ color:'#cbd5e1', fontSize:fs - 3, flexShrink:0 }}>•</span>
              <span style={{ fontSize:fs - 3, color:'#64748b', lineHeight:1.5 }}>{item}</span>
            </div>
          ))}
        </div>
      </div>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:7, paddingTop:8, borderTop:'1px solid #f1f5f9' }}>
        <svg width="11" height="11" viewBox="0 0 16 16" fill="none">
          <polygon points="8,1 15,5 15,11 8,15 1,11 1,5" stroke={p} strokeWidth="1.5" fill="none"/>
          <circle cx="8" cy="8" r="2" fill={p}/>
        </svg>
        <span style={{ fontSize:fs - 1.5, fontWeight:800, color:'#475569', textTransform:'uppercase', letterSpacing:'.15em' }}>KonzaRH</span>
        <span style={{ fontSize:fs - 2, color:'#94a3b8' }}>· Généré le {today}</span>
      </div>
    </div>
  );

  // ── Assemblage final ──────────────────────────────────────────────────────

  const tableNeeded = vis.has('salary') || vis.has('overtime') || vis.has('bonuses') || vis.has('deductions') || vis.has('employer');

  return (
    <>
      {/*
        ── CSS IMPRESSION A4 ──────────────────────────────────────────────────
        .no-break       : ne se coupe JAMAIS entre 2 pages (header, employee, tableau, net, signatures)
        .bulletin-legal : visible dans l'app, MASQUÉ à l'impression
      */}
      <style>{`
        @media print {
          .bulletin-legal { display: none !important; }
          #bulletin-root  { width: 210mm !important; font-size: ${fs}px !important; }
          .no-break       { page-break-inside: avoid !important; break-inside: avoid !important; }
          @page           { size: A4 portrait; margin: 10mm 12mm 10mm 12mm; }
          *               { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        }
      `}</style>

      <div
        id="bulletin-root"
        style={{
          fontFamily: font,
          fontSize:   fs,
          background: '#fff',
          color:      tc,
          width:      previewMode ? '100%' : 'auto',
          boxSizing:  'border-box',
        }}
      >
        {/* En-tête entreprise — PRIORITAIRE IMPRESSION */}
        <div className="no-break">
          {renderHeader()}
        </div>

        {/* Fiche employé + temps de travail — PRIORITAIRE IMPRESSION */}
        {(vis.has('employee') || vis.has('time')) && (
          <div className="no-break">
            {renderEmployee()}
          </div>
        )}

        {/* Tableau complet (rémunérations + cotisations + charges) — PRIORITAIRE IMPRESSION */}
        {tableNeeded && (
          <div className="no-break" style={{ padding:`12px ${secPad.split(' ')[1] ?? '18px'}` }}>
            {renderTable()}
          </div>
        )}

        {/* Récapitulatif net / coût */}
        {vis.has('recap') && renderRecap()}

        {/* Message personnalisé de l'employeur */}
        {vis.has('message') && renderMessage()}

        {/* Signatures — PRIORITAIRE IMPRESSION */}
        {vis.has('signatures') && (
          <div className="no-break">
            {renderSignatures()}
          </div>
        )}

        {/* Mentions légales — APP ONLY, jamais imprimées */}
        {vis.has('legal') && (
          <div className="bulletin-legal">
            {renderLegal()}
          </div>
        )}
      </div>
    </>
  );
}
