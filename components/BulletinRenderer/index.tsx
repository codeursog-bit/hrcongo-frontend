'use client';

// ============================================================================
// components/BulletinRenderer/index.tsx
//
// Rendu universel — utilisé dans :
//   • app/(dashboard)/paie/[id]/page.tsx         (détail)
//   • app/(dashboard)/ma-paie/page.tsx            (modal employé)
//   • app/(dashboard)/cabinet/.../bulletins/      (cabinet)
//   • app/pme/[companyId]/bulletins/              (PME)
//   • BulletinDesigner DesignerCanvas             (preview live)
//
// IMPRESSION A4 :
//   • Blocs "print-priority" (header, employee, salary, deductions, net, signatures)
//     → page-break-inside: avoid — ne se coupent JAMAIS
//   • Blocs "app only" (legal, recap détaillé) → @media print { display: none }
//   • Les sections secondaires peuvent se couper entre elles
// ============================================================================

import React, { useMemo } from 'react';
import type { BulletinRendererProps, BlockConfig, BulletinPayroll, BulletinTemplateConfig } from '@/types/bulletin-template';
import { TEMPLATE_DEFAULT } from '@/lib/bulletin-templates';

export type { BulletinRendererProps };

// ─── Helpers ─────────────────────────────────────────────────────────────────

const MONTHS = ['Janvier','Février','Mars','Avril','Mai','Juin',
  'Juillet','Août','Septembre','Octobre','Novembre','Décembre'];

const MARITAL: Record<string, string> = {
  SINGLE:'Célibataire', MARRIED:'Marié(e)', DIVORCED:'Divorcé(e)',
  WIDOWED:'Veuf/Veuve', COHABITING:'Concubinage',
};
const PAYMENT: Record<string, string> = {
  BANK_TRANSFER:'Virement bancaire', CASH:'Espèces',
  MOBILE_MONEY:'Mobile Money', CHECK:'Chèque',
};
const CONTRACT: Record<string, string> = {
  CDI:'CDI', CDD:'CDD', STAGE:'Stage', CONSULTANT:'Consultant',
  FREELANCE:'Freelance',
};

export function fmt(v: any): string {
  return Math.round(Number(v) || 0).toLocaleString('fr-FR');
}

function seniority(hireDate?: string): string {
  if (!hireDate) return '—';
  const hire = new Date(hireDate);
  const now  = new Date();
  let y = now.getFullYear() - hire.getFullYear();
  let m = now.getMonth() - hire.getMonth();
  if (m < 0) { y--; m += 12; }
  const parts: string[] = [];
  if (y > 0) parts.push(`${y} an${y > 1 ? 's' : ''}`);
  if (m > 0) parts.push(`${m} mois`);
  return parts.join(' ') || '< 1 mois';
}

function initials(p?: BulletinPayroll['employee']): string {
  return ((p?.firstName?.[0] ?? '') + (p?.lastName?.[0] ?? '')).toUpperCase() || '?';
}

function hex2rgb(hex: string): string {
  const r = parseInt(hex.slice(1,3), 16);
  const g = parseInt(hex.slice(3,5), 16);
  const b = parseInt(hex.slice(5,7), 16);
  return `${r},${g},${b}`;
}

// ─── Style helpers ────────────────────────────────────────────────────────────

function getFontFamily(f: string): string {
  if (f === 'serif') return '"Georgia","Times New Roman",serif';
  if (f === 'mono')  return '"Courier New","Lucida Console",monospace';
  return '"Inter","Helvetica Neue",Arial,sans-serif';
}

function getDensityPx(d: string): { cell: string; section: string } {
  if (d === 'compact') return { cell: '4px 10px', section: '8px 14px' };
  if (d === 'airy')    return { cell: '10px 16px', section: '18px 22px' };
  return { cell: '7px 14px', section: '14px 18px' };
}

function getBaseFontSize(s: string): number {
  if (s === 'sm') return 10;
  if (s === 'lg') return 12.5;
  return 11.5;
}

// ─── Composant ───────────────────────────────────────────────────────────────

export default function BulletinRenderer({
  payroll,
  template,
  previewMode = false,
  printMode = false,
}: BulletinRendererProps) {
  const cfg   = template ?? TEMPLATE_DEFAULT;
  const style = cfg.style;
  const p     = style.primaryColor;
  const s2    = style.secondaryColor;
  const t     = style.textColor;
  const r     = style.borderRadius;
  const font  = getFontFamily(style.fontFamily);
  const den   = getDensityPx(style.density);
  const fs    = getBaseFontSize(style.fontSize);

  // Blocs visibles ordonnés
  const visibleBlocks = useMemo(
    () => [...cfg.blocks].sort((a, b) => a.order - b.order).filter(b => b.visible),
    [cfg.blocks]
  );

  // Données payroll normalisées
  const emp  = payroll.employee ?? {} as any;
  const comp = payroll.company  ?? {} as any;

  const items      = payroll.items ?? [];
  const gains      = items.filter(i => i.type === 'GAIN').sort((a, b) => a.order - b.order);
  const deductions = items.filter(i => i.type === 'DEDUCTION').sort((a, b) => a.order - b.order);

  const isOT    = (i: any) => ['OT','OVERTIME','HS','HEURE'].some(k => i.code?.toUpperCase().includes(k));
  const isBonus = (i: any) => ['BONUS','PRIME','TRANSPORT','PANIER','INDEMNITE'].some(k => i.code?.toUpperCase().includes(k));

  const salaryItems = gains.filter(i => !isOT(i) && !isBonus(i));
  const otItems     = gains.filter(isOT);
  const bonusItems  = (payroll.bonuses?.length ?? 0) > 0 ? payroll.bonuses! : gains.filter(isBonus);

  const cnssItem    = deductions.find(i => i.code?.toUpperCase().includes('CNSS'));
  const irppItem    = deductions.find(i => ['ITS','IRPP'].some(k => i.code?.toUpperCase().includes(k)));
  const loanItems   = deductions.filter(i => ['LOAN','PRET','ADVANCE','AVANCE'].some(k => i.code?.toUpperCase().includes(k)));
  const customDed   = deductions.filter(i =>
    i.id !== cnssItem?.id && i.id !== irppItem?.id &&
    !['LOAN','PRET','ADVANCE','AVANCE','ABSENCE'].some(k => i.code?.toUpperCase().includes(k))
  );
  const customEmpItems = items.filter(i =>
    i.type === 'EMPLOYER_COST' &&
    !['CNSS','TUS','PENSION','FAMILY','ACCIDENT'].some(k => i.code?.toUpperCase().includes(k))
  );

  const cnssAmt   = Number(cnssItem?.amount ?? payroll.cnssSalarial ?? 0);
  const irppAmt   = Number(irppItem?.amount ?? payroll.its ?? 0);
  const totalRet  = Number(payroll.totalDeductions ?? deductions.reduce((s, i) => s + i.amount, 0));
  const cnssPatTotal = Number(payroll.cnssEmployerPension ?? 0)
    + Number(payroll.cnssEmployerFamily ?? 0)
    + Number(payroll.cnssEmployerAccident ?? 0);
  const tusTotal  = Number(payroll.tusTotal ?? 0);
  const tusDgi    = Number(payroll.tusDgiAmount ?? 0);
  const tusCnss   = Number(payroll.tusCnssAmount ?? 0);
  const totalOT   = Number(payroll.overtimeHours10 ?? 0) + Number(payroll.overtimeHours25 ?? 0)
    + Number(payroll.overtimeHours50 ?? 0) + Number(payroll.overtimeHours100 ?? 0);

  const today = new Date().toLocaleDateString('fr-FR', { day:'2-digit', month:'long', year:'numeric' });

  // ── Tableau de cotisations — cœur du bulletin ────────────────────────────

  let rowIdx = 0;
  const TRow = ({ label, sub, base, rate, amount, color }: {
    label: string; sub?: string; base?: string; rate?: string; amount: string; color: string;
  }) => {
    const bg = rowIdx++ % 2 === 0 ? '#fff' : '#f9fafb';
    return (
      <tr>
        <td style={{ background: bg, padding: den.cell, borderBottom:'1px solid #e5e7eb', verticalAlign:'top' }}>
          <div style={{ fontSize: fs, fontWeight: 600, color: t, lineHeight:1.3 }}>{label}</div>
          {sub && <div style={{ fontSize: fs - 1.5, color:'#9ca3af', marginTop:1, lineHeight:1.3 }}>{sub}</div>}
        </td>
        <td style={{ background: bg, padding: den.cell, borderBottom:'1px solid #e5e7eb', textAlign:'right', fontFamily:'monospace', fontSize: fs - 1.5, color:'#9ca3af' }}>{base ?? '—'}</td>
        <td style={{ background: bg, padding: den.cell, borderBottom:'1px solid #e5e7eb', textAlign:'right', fontFamily:'monospace', fontSize: fs - 1.5, color:'#9ca3af' }}>{rate ?? '—'}</td>
        <td style={{ background: bg, padding: den.cell, borderBottom:'1px solid #e5e7eb', textAlign:'right', fontFamily:'monospace', fontWeight: 700, fontSize: fs + 0.5, color }}>{amount}</td>
      </tr>
    );
  };
  const SHead = ({ label, color }: { label: string; color: string }) => (
    <tr>
      <td colSpan={4} style={{ background: color, padding:`5px 14px`, fontSize: fs - 2, fontWeight: 900, textTransform:'uppercase', letterSpacing:'0.1em', color:'#fff' }}>{label}</td>
    </tr>
  );

  // ── Rendu du bloc tableau complet ────────────────────────────────────────

  const renderTable = (showSalary: boolean, showOT: boolean, showBonus: boolean, showDed: boolean, showEmp: boolean) => {
    rowIdx = 0;
    return (
      <div style={{ borderRadius: r, overflow:'hidden', border:'1.5px solid #e5e7eb' }}>
        <table style={{ width:'100%', borderCollapse:'collapse', tableLayout:'fixed' }}>
          <colgroup>
            <col style={{ width:'46%' }} /><col style={{ width:'20%' }} />
            <col style={{ width:'13%' }} /><col style={{ width:'21%' }} />
          </colgroup>
          <thead>
            <tr>
              {[['Désignation','left'],['Base (FCFA)','right'],['Taux','right'],['Montant (FCFA)','right']].map(([h, a]) => (
                <th key={h} style={{ background: t, padding:`8px 14px`, textAlign: a as any, fontSize: fs - 2, fontWeight: 900, textTransform:'uppercase', letterSpacing:'0.1em', color:'#fff' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {showSalary && <>
              <SHead label="Rémunérations" color="#15803d" />
              {salaryItems.length > 0
                ? salaryItems.map(i => <TRow key={i.id} label={i.label} base={i.base ? fmt(i.base) : undefined} rate={i.rate ? `${(i.rate*100).toFixed(0)}%` : undefined} amount={`+${fmt(i.amount)}`} color="#15803d" />)
                : <TRow label={visibleBlocks.find(b=>b.id==='salary')?.label ?? 'Salaire de base'} amount={`+${fmt(payroll.baseSalary ?? payroll.grossSalary)}`} color="#15803d" />
              }
              {(payroll.absenceDays ?? 0) > 0 && (payroll.absenceDeduction ?? 0) > 0 && (
                <TRow label={`Déduction absences (${payroll.absenceDays} j)`} amount={`−${fmt(payroll.absenceDeduction)}`} color="#b45309" />
              )}
            </>}

            {showOT && otItems.length > 0 && <>
              <SHead label="Heures Supplémentaires — Décret n°78-360" color="#b45309" />
              {otItems.map(i => <TRow key={i.id} label={i.label} rate={i.rate ? `+${(i.rate*100).toFixed(0)}%` : undefined} amount={`+${fmt(i.amount)}`} color="#b45309" />)}
            </>}

            {showBonus && bonusItems.length > 0 && <>
              <SHead label={visibleBlocks.find(b=>b.id==='bonuses')?.label ?? 'Primes & Accessoires'} color="#0e7490" />
              {bonusItems.map((b: any, idx: number) => (
                <TRow key={b.id ?? idx} label={b.label || b.bonusType || 'Prime'}
                  rate={b.percentage ? `${b.percentage}%` : undefined}
                  amount={`+${fmt(b.amount || b.computedAmount || 0)}`} color="#0e7490" />
              ))}
            </>}

            {/* Total brut */}
            <tr>
              <td colSpan={3} style={{ background:'#15803d', padding:`9px 14px`, fontSize: fs - 1, fontWeight:900, textTransform:'uppercase', letterSpacing:'0.08em', color:'#fff' }}>Total Brut</td>
              <td style={{ background:'#15803d', padding:`9px 14px`, textAlign:'right', fontFamily:'monospace', fontWeight:900, fontSize: fs + 3, color:'#fff' }}>{fmt(payroll.grossSalary)}</td>
            </tr>

            {showDed && <>
              <SHead label={visibleBlocks.find(b=>b.id==='deductions')?.label ?? 'Cotisations & Retenues Salariales'} color="#b91c1c" />
              <TRow label="CNSS Salariale — Branche Pension" sub="Caisse Nationale de Sécurité Sociale"
                base={cnssItem?.base ? fmt(cnssItem.base) : undefined} rate="4 %"
                amount={`−${fmt(cnssAmt)}`} color="#b91c1c" />
              <TRow label="ITS — Impôt sur les Traitements et Salaires" sub="Barème progressif 2026 — Abattement 20%"
                base={irppItem?.base ? fmt(irppItem.base) : undefined} rate="Barème"
                amount={`−${fmt(irppAmt)}`} color="#b91c1c" />
              {customDed.map(i => (
                <TRow key={i.id} label={i.label} sub={i.code}
                  base={i.base ? fmt(i.base) : undefined}
                  rate={i.rate ? `${(i.rate*100).toFixed(2)}%` : undefined}
                  amount={`−${fmt(i.amount)}`} color="#0f766e" />
              ))}
              {loanItems.length > 0 && <>
                <SHead label="Retenues Facultatives — Prêts & Avances" color="#7e22ce" />
                {loanItems.map(i => <TRow key={i.id} label={i.label} amount={`−${fmt(i.amount)}`} color="#7e22ce" />)}
              </>}
              <tr>
                <td colSpan={3} style={{ background:'#fef2f2', padding:`8px 14px`, borderTop:'2px solid #fecaca', fontSize: fs - 1, fontWeight:700, textTransform:'uppercase', color:'#b91c1c' }}>
                  Total Retenues Salariales
                </td>
                <td style={{ background:'#fef2f2', padding:`8px 14px`, borderTop:'2px solid #fecaca', textAlign:'right', fontFamily:'monospace', fontWeight:700, fontSize: fs + 1, color:'#b91c1c' }}>
                  −{fmt(totalRet)}
                </td>
              </tr>
            </>}

            {showEmp && <>
              <SHead label={visibleBlocks.find(b=>b.id==='employer')?.label ?? 'Part Patronale — Charges Sociales Employeur'} color="#c2410c" />
              <TRow label="CNSS Patronale — Pensions (Vieillesse / Invalidité)" sub="Plafond mensuel : 1 200 000 FCFA" rate="8 %" amount={`+${fmt(payroll.cnssEmployerPension)}`} color="#c2410c" />
              <TRow label="CNSS Patronale — Prestations Familiales" sub="Plafond mensuel : 600 000 FCFA" rate="10,03 %" amount={`+${fmt(payroll.cnssEmployerFamily)}`} color="#c2410c" />
              <TRow label="CNSS Patronale — Accidents du Travail" sub="Plafond mensuel : 600 000 FCFA" rate="2,25 %" amount={`+${fmt(payroll.cnssEmployerAccident)}`} color="#c2410c" />
              <TRow label="TUS — Part DGI (2,025%)" sub="Taxe Unique sur Salaires · versée à la DGI" rate="2,025 %" amount={`+${fmt(tusDgi)}`} color="#c2410c" />
              <TRow label="TUS — Part CNSS (5,475%)" sub="Taxe Unique sur Salaires · versée à la CNSS" rate="5,475 %" amount={`+${fmt(tusCnss)}`} color="#c2410c" />
              {customEmpItems.map(i => (
                <TRow key={i.id} label={i.label} sub={i.code}
                  base={i.base ? fmt(i.base) : undefined}
                  rate={i.rate ? `${(i.rate*100).toFixed(2)}%` : undefined}
                  amount={`+${fmt(i.amount)}`} color="#0f766e" />
              ))}
              <tr>
                <td colSpan={3} style={{ background:'#fff7ed', padding:`8px 14px`, borderTop:'2px solid #fed7aa', fontSize: fs - 1, fontWeight:700, textTransform:'uppercase', color:'#c2410c' }}>
                  Total Charges Patronales
                </td>
                <td style={{ background:'#fff7ed', padding:`8px 14px`, borderTop:'2px solid #fed7aa', textAlign:'right', fontFamily:'monospace', fontWeight:700, fontSize: fs + 1, color:'#c2410c' }}>
                  +{fmt(cnssPatTotal + tusTotal + customEmpItems.reduce((s, i) => s + i.amount, 0))}
                </td>
              </tr>
            </>}
          </tbody>
        </table>

        {/* NET À PAYER */}
        <div style={{ background: t, padding:`${den.section}`, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div>
            <div style={{ fontSize: fs - 2.5, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.25em', color:'#9ca3af', marginBottom:3 }}>Net à Payer</div>
            <div style={{ fontSize: fs - 3, color:'#6b7280' }}>Montant net versé à l'employé</div>
          </div>
          <div style={{ textAlign:'right' }}>
            <span style={{ fontSize: fs + 16, fontWeight:900, fontFamily:'monospace', color:'#fff' }}>{fmt(payroll.netSalary)}</span>
            <span style={{ marginLeft:8, fontSize: fs, color:'#6b7280' }}>FCFA</span>
          </div>
        </div>
      </div>
    );
  };

  // ─── En-tête ───────────────────────────────────────────────────────────────

  const renderHeader = () => {
    const logoEl = style.showLogo && comp.logo ? (
      <div style={{ width:48, height:48, borderRadius: r, overflow:'hidden', border:'1px solid #e2e8f0', flexShrink:0 }}>
        <img src={comp.logo} alt="Logo" style={{ width:'100%', height:'100%', objectFit:'contain' }} />
      </div>
    ) : style.showLogo ? (
      <div style={{ width:44, height:44, borderRadius: r, background:`rgba(${hex2rgb(p)},0.12)`, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:900, fontSize:14, color: p, flexShrink:0 }}>
        {(comp.tradeName || comp.legalName || 'E')[0]}
      </div>
    ) : null;

    const compInfo = (
      <div>
        <div style={{ fontSize: fs + 2, fontWeight:900, color: style.headerStyle === 'dark' ? '#fff' : t, marginBottom:3, lineHeight:1.2 }}>
          {comp.tradeName || comp.legalName || 'Entreprise'}
        </div>
        {style.showAddress && comp.address && (
          <div style={{ fontSize: fs - 2, color: style.headerStyle === 'dark' ? '#94a3b8' : '#64748b' }}>
            {comp.address}{comp.city ? `, ${comp.city}` : ''}
          </div>
        )}
        {style.showFiscalNumbers && (
          <div style={{ display:'flex', gap:12, flexWrap:'wrap', marginTop:3, fontSize: fs - 2, color: style.headerStyle === 'dark' ? '#94a3b8' : '#64748b' }}>
            {comp.rccmNumber && <span>RCCM : <strong style={{ color: style.headerStyle === 'dark' ? '#e2e8f0' : t }}>{comp.rccmNumber}</strong></span>}
            {comp.cnssNumber && <span>CNSS : <strong style={{ color: style.headerStyle === 'dark' ? '#e2e8f0' : t }}>{comp.cnssNumber}</strong></span>}
            {comp.phone      && <span>Tél : <strong style={{ color: style.headerStyle === 'dark' ? '#e2e8f0' : t }}>{comp.phone}</strong></span>}
          </div>
        )}
      </div>
    );

    const titleEl = (
      <div style={{ textAlign:'right', flexShrink:0 }}>
        <div style={{ fontSize: fs - 3, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.2em', color: style.headerStyle === 'dark' ? '#64748b' : '#94a3b8' }}>Bulletin de</div>
        <div style={{ fontSize: fs + 10, fontWeight:900, textTransform:'uppercase', letterSpacing:'0.12em', color: style.headerStyle === 'dark' ? '#fff' : t, lineHeight:1 }}>Paie</div>
        <div style={{ height:2, background:`linear-gradient(to left, ${p}, transparent)`, margin:'4px 0' }} />
        <div style={{ fontSize: fs + 2, fontWeight:700, color: p }}>{MONTHS[(payroll.month ?? 1) - 1]} {payroll.year}</div>
      </div>
    );

    if (style.headerStyle === 'dark') {
      return (
        <div style={{ background:'#0f172a', padding:`${den.section}` }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:16 }}>
            <div style={{ display:'flex', gap:12, alignItems:style.logoPosition === 'center' ? 'center' : 'flex-start', flex:1 }}>
              {style.logoPosition !== 'right' && logoEl}
              <div style={{ flex: style.logoPosition === 'center' ? 1 : undefined, textAlign: style.logoPosition === 'center' ? 'center' : 'left' }}>
                {compInfo}
              </div>
              {style.logoPosition === 'right' && logoEl}
            </div>
            {titleEl}
          </div>
        </div>
      );
    }

    if (style.headerStyle === 'minimal') {
      return (
        <div style={{ padding:`${den.section}`, borderBottom:'1px solid #e2e8f0', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div style={{ fontSize: fs + 1, fontWeight:700, color: t }}>
            {comp.tradeName || comp.legalName}
          </div>
          <div style={{ fontSize: fs, color:'#64748b' }}>
            Bulletin · <strong style={{ color: p }}>{MONTHS[(payroll.month ?? 1) - 1]} {payroll.year}</strong>
          </div>
        </div>
      );
    }

    if (style.headerStyle === 'line') {
      return (
        <div style={{ padding:`${den.section}`, borderBottom:`3px solid ${p}` }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:16 }}>
            <div style={{ display:'flex', gap:12, alignItems:'flex-start', flex:1 }}>
              {logoEl}
              {compInfo}
            </div>
            {titleEl}
          </div>
        </div>
      );
    }

    // gradient (défaut)
    return (
      <>
        <div style={{ height:4, background:`linear-gradient(90deg, ${p}, ${s2})` }} />
        <div style={{ padding:`${den.section}`, borderBottom:'1px solid #e2e8f0', display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:16 }}>
          <div style={{ display:'flex', gap:12, alignItems:'flex-start', flex:1 }}>
            {logoEl}
            {compInfo}
          </div>
          {titleEl}
        </div>
      </>
    );
  };

  // ─── Bloc employé ────────────────────────────────────────────────────────

  const renderEmployee = (showTime: boolean) => {
    const otDetail = [
      payroll.overtimeHours10  ? `${payroll.overtimeHours10}h (+10%)`  : null,
      payroll.overtimeHours25  ? `${payroll.overtimeHours25}h (+25%)`  : null,
      payroll.overtimeHours50  ? `${payroll.overtimeHours50}h (+50%)`  : null,
      payroll.overtimeHours100 ? `${payroll.overtimeHours100}h (+100%)` : null,
    ].filter(Boolean).join(' · ');

    return (
      <div style={{ padding:`${den.section}`, borderBottom:'1.5px solid #e2e8f0' }}>
        <div style={{ background:'#f1f5f9', borderRadius: r, padding:'10px 16px', marginBottom:14, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div>
            <div style={{ fontSize: fs - 3, fontWeight:800, textTransform:'uppercase', letterSpacing:'0.1em', color:'#94a3b8' }}>Période de paie</div>
            <div style={{ fontSize: fs + 4, fontWeight:900, color: t }}>{MONTHS[(payroll.month ?? 1) - 1]} {payroll.year}</div>
          </div>
          <div style={{ textAlign:'right', fontSize: fs - 1, color:'#475569', lineHeight:1.6 }}>
            {emp.professionalCategory && <div>Catégorie <strong style={{ color: t }}>{emp.professionalCategory}</strong>{emp.echelon ? ` · Échelon ${emp.echelon}` : ''}</div>}
          </div>
        </div>

        <div style={{ display:'grid', gridTemplateColumns: showTime ? '1fr 1fr' : '1fr', gap:'0 24px' }}>
          {/* Infos employé */}
          <div>
            <div style={{ fontSize: fs - 3, fontWeight:800, textTransform:'uppercase', letterSpacing:'0.12em', color:'#94a3b8', borderBottom:'1px solid #e2e8f0', paddingBottom:6, marginBottom:10 }}>
              {visibleBlocks.find(b=>b.id==='employee')?.label ?? 'Informations Employé'}
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
              <div style={{ width:36, height:36, borderRadius:'50%', background:`linear-gradient(135deg,${p},${s2})`, display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:900, fontSize:13, flexShrink:0 }}>
                {initials(emp)}
              </div>
              <div>
                <div style={{ fontSize: fs + 2, fontWeight:900, color: t }}>{emp.firstName} {emp.lastName}</div>
                <div style={{ fontSize: fs - 2, color:'#64748b', fontFamily:'monospace' }}>
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
              <div key={label as string} style={{ display:'grid', gridTemplateColumns:'130px 1fr', gap:'2px 8px', marginBottom:4 }}>
                <span style={{ fontSize: fs - 1.5, color:'#64748b' }}>{label}</span>
                <span style={{ fontSize: fs - 1.5, fontWeight:700, color: t }}>{val || '—'}</span>
              </div>
            ))}
          </div>

          {/* Temps de travail */}
          {showTime && (
            <div>
              <div style={{ fontSize: fs - 3, fontWeight:800, textTransform:'uppercase', letterSpacing:'0.12em', color:'#94a3b8', borderBottom:'1px solid #e2e8f0', paddingBottom:6, marginBottom:10 }}>
                {visibleBlocks.find(b=>b.id==='time')?.label ?? 'Temps de Travail'}
              </div>
              {[
                { label:'Jours ouvrables',    val:`${payroll.workDays} jours`,                color:'#0f172a' },
                { label:'Jours travaillés',   val:`${payroll.workedDays} jours`,              color:'#059669' },
                (payroll.absenceDays ?? 0) > 0 && { label:'Absences', val:`${payroll.absenceDays} j`, color:'#dc2626' },
                (payroll.daysOnLeave ?? 0) > 0 && { label:'Congés payés', val:`${payroll.daysOnLeave} j`, color: p },
                (payroll.daysRemote ?? 0) > 0  && { label:'Télétravail',  val:`${payroll.daysRemote} j`,  color:'#7c3aed' },
              ].filter(Boolean).map((row: any) => (
                <div key={row.label} style={{ display:'flex', justifyContent:'space-between', marginBottom:5 }}>
                  <span style={{ fontSize: fs - 1.5, color:'#64748b' }}>{row.label}</span>
                  <span style={{ fontSize: fs - 1.5, fontWeight:700, fontFamily:'monospace', color:row.color }}>{row.val}</span>
                </div>
              ))}
              {totalOT > 0 && <>
                <div style={{ borderTop:'1px dashed #e2e8f0', margin:'8px 0' }} />
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:3 }}>
                  <span style={{ fontSize: fs - 1.5, color:'#64748b' }}>Heures supplémentaires</span>
                  <span style={{ fontSize: fs - 1.5, fontWeight:700, fontFamily:'monospace', color:'#d97706' }}>{totalOT}h</span>
                </div>
                {otDetail && <div style={{ fontSize: fs - 2.5, color:'#d97706', textAlign:'right', fontFamily:'monospace' }}>{otDetail}</div>}
              </>}
            </div>
          )}
        </div>
      </div>
    );
  };

  // ─── Récapitulatif ────────────────────────────────────────────────────────

  const renderRecap = () => (
    <div style={{ padding:`0 ${den.section.split(' ')[1] ?? '18px'} ${den.section.split(' ')[0] ?? '14px'}` }}>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:10 }}>
        <div style={{ background:`rgba(${hex2rgb(p)},0.08)`, borderRadius: r, padding:'12px 16px', border:`1.5px solid rgba(${hex2rgb(p)},0.3)`, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <span style={{ fontSize: fs, fontWeight:700, color: p }}>Net à payer</span>
          <span style={{ fontSize: fs + 5, fontFamily:'monospace', fontWeight:900, color: p }}>{fmt(payroll.netSalary)} F</span>
        </div>
        <div style={{ background:'#fff7ed', borderRadius: r, padding:'12px 16px', border:'1.5px solid #fed7aa', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <span style={{ fontSize: fs, fontWeight:700, color:'#c2410c' }}>Coût employeur</span>
          <span style={{ fontSize: fs + 5, fontFamily:'monospace', fontWeight:900, color:'#c2410c' }}>{fmt(payroll.totalEmployerCost)} F</span>
        </div>
      </div>
    </div>
  );

  // ─── Signatures ───────────────────────────────────────────────────────────

  const renderSignatures = () => (
    <div style={{ padding:`${den.section}`, display:'grid', gridTemplateColumns:'1fr 1fr', gap:60 }}>
      {[{ l:"Signature de l'employeur", s:'Cachet & signature' }, { l:"Signature de l'employé", s:'Lu et approuvé' }].map(sg => (
        <div key={sg.l} style={{ textAlign:'center' }}>
          <div style={{ fontSize: fs - 1, fontWeight:700, color:'#4b5563', marginBottom:3 }}>{sg.l}</div>
          <div style={{ fontSize: fs - 2, color:'#9ca3af', marginBottom:10 }}>{sg.s}</div>
          <div style={{ height:40, borderBottom:'2px dashed #d1d5db' }} />
        </div>
      ))}
    </div>
  );

  // ─── Message employeur ────────────────────────────────────────────────────

  const renderMessage = () => style.footerMessage ? (
    <div style={{ margin:`0 ${den.section.split(' ')[1] ?? '18px'} 14px`, background:`rgba(${hex2rgb(p)},0.07)`, border:`1px solid rgba(${hex2rgb(p)},0.25)`, borderRadius: r, padding:'10px 14px', display:'flex', gap:10, alignItems:'flex-start' }}>
      <span style={{ fontSize:16 }}>💬</span>
      <div>
        <div style={{ fontSize: fs - 1, fontWeight:700, color: p, marginBottom:3 }}>Message de l'employeur</div>
        <div style={{ fontSize: fs - 1, color:'#475569', fontStyle:'italic' }}>{style.footerMessage}</div>
      </div>
    </div>
  ) : null;

  // ─── Mentions légales (app only — masquées à l'impression) ───────────────

  const renderLegal = () => (
    <div className="print:hidden" style={{ padding:`0 ${den.section.split(' ')[1] ?? '18px'} 16px`, borderTop:'1px solid #e5e7eb', marginTop:8 }}>
      <div style={{ borderRadius: r, border:'1px solid #e5e7eb', overflow:'hidden', marginBottom:8 }}>
        <div style={{ background:'#f8fafc', padding:'7px 14px', borderBottom:'1px solid #e5e7eb', fontSize: fs - 3, fontWeight:800, textTransform:'uppercase', letterSpacing:'0.1em', color:'#475569' }}>
          ⚖️ Réglementation — République du Congo (Brazzaville)
        </div>
        <div style={{ background:'#fff', padding:'10px 14px', display:'grid', gridTemplateColumns:'1fr 1fr', gap:'3px 20px' }}>
          {['Code du Travail — Loi n°45-75 du 15 mars 1975','ITS 2026 — Barème progressif — Abattement 20%',
            'CNSS salarié : 4% — Plafond pension : 1 200 000 FCFA','CNSS patronale : pensions 8% · famille 10% · AT 2,25%',
            'SMIG Congo : 70 400 FCFA/mois (2026)','TUS : 7,51% sur brut total (sans plafond)',
            'HS — Décret n°78-360 : +10% · +25% · +50% · +100%',"L'ITS est prélevé à la source — reversé à la DGID",
          ].map((item, i) => (
            <div key={i} style={{ display:'flex', gap:4 }}>
              <span style={{ color:'#cbd5e1', fontSize: fs - 3, flexShrink:0 }}>•</span>
              <span style={{ fontSize: fs - 3, color:'#64748b', lineHeight:1.5 }}>{item}</span>
            </div>
          ))}
        </div>
      </div>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:7, paddingTop:8 }}>
        <span style={{ fontSize: fs - 2, fontWeight:800, color:'#475569', textTransform:'uppercase', letterSpacing:'0.15em' }}>KonzaRH</span>
        <span style={{ fontSize: fs - 3, color:'#94a3b8' }}>· Généré le {today}</span>
      </div>
    </div>
  );

  // ─── Assemblage final ─────────────────────────────────────────────────────

  const showSalary  = visibleBlocks.some(b => b.id === 'salary');
  const showOT      = visibleBlocks.some(b => b.id === 'overtime');
  const showBonus   = visibleBlocks.some(b => b.id === 'bonuses');
  const showDed     = visibleBlocks.some(b => b.id === 'deductions');
  const showEmpCh   = visibleBlocks.some(b => b.id === 'employer');
  const showTime    = visibleBlocks.some(b => b.id === 'time');
  const showRecap   = visibleBlocks.some(b => b.id === 'recap');
  const showSig     = visibleBlocks.some(b => b.id === 'signatures');
  const showMsg     = visibleBlocks.some(b => b.id === 'message');
  const showLegal   = visibleBlocks.some(b => b.id === 'legal');

  const tableNeeded = showSalary || showOT || showBonus || showDed || showEmpCh;

  return (
    <>
      {/* ── CSS IMPRESSION A4 ── */}
      <style>{`
        @media print {
          .print\\:hidden { display: none !important; }
          #bulletin-print-root { width: 210mm; font-size: ${fs}px; }
          /* Blocs prioritaires — ne jamais couper */
          .print-block-priority { page-break-inside: avoid; }
          /* Séparateurs légers entre sections */
          .print-block-secondary { page-break-inside: auto; }
        }
      `}</style>

      <div
        id="bulletin-print-root"
        style={{
          fontFamily: font,
          fontSize: fs,
          background: '#fff',
          color: t,
          width: previewMode ? '100%' : 'auto',
          minWidth: previewMode ? undefined : '100%',
          boxSizing: 'border-box',
        }}
      >
        {/* En-tête entreprise */}
        <div className="print-block-priority">
          {renderHeader()}
        </div>

        {/* Infos employé + temps de travail */}
        {(visibleBlocks.some(b => b.id === 'employee') || showTime) && (
          <div className="print-block-priority">
            {renderEmployee(showTime)}
          </div>
        )}

        {/* Tableau de paie — bloc prioritaire ne se coupe JAMAIS */}
        {tableNeeded && (
          <div className="print-block-priority" style={{ padding:`12px ${den.section.split(' ')[1] ?? '18px'}` }}>
            {renderTable(showSalary, showOT, showBonus, showDed, showEmpCh)}
          </div>
        )}

        {/* Récapitulatif */}
        {showRecap && (
          <div className="print-block-secondary">
            {renderRecap()}
          </div>
        )}

        {/* Message employeur */}
        {showMsg && renderMessage()}

        {/* Signatures */}
        {showSig && (
          <div className="print-block-priority">
            {renderSignatures()}
          </div>
        )}

        {/* Mentions légales — APP ONLY, masquées à l'impression */}
        {showLegal && (
          <div className="print\\:hidden">
            {renderLegal()}
          </div>
        )}
      </div>
    </>
  );
}
