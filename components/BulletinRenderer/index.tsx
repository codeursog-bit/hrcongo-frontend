'use client';

// ============================================================================
// components/BulletinRenderer/index.tsx
//
// ✅ Structure IDENTIQUE au bulletin IESM Congo (modèle de référence)
// ✅ 9 colonnes : N°, Désignation, Nombre, Base, Taux sal., Gain, Retenue sal., Taux pat., Retenue pat.
// ✅ Indemnités hors brut (transport, panier) SÉPARÉES SOUS les cotisations
// ✅ ITS : affiche montant annuel + mensuel, pas de label "taux effectif 0.00%"
// ✅ CNSS : même ligne = salariale 4% + patronale 8% (comme IESM)
// ✅ 3 catégories fiscales : TAXABLE_CNSS / TAXABLE_NO_CNSS / NON_TAXABLE
// ✅ Totaux : TOTAL BRUT · TOTAL GAINS · TOTAL RETENUES · NET À PAYER
// ✅ Cumuls annuels en bas (comme IESM)
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
  BANK_TRANSFER:'Virement', CASH:'Espèces',
  MOBILE_MONEY:'Mobile Money', CHECK:'Chèque',
};
const CONTRACT: Record<string, string> = {
  CDI:'CDI', CDD:'CDD', STAGE:'Stage', CONSULTANT:'Consultant',
  PRESTATAIRE:'Prestataire', INTERIM:'Intérimaire', FREELANCE:'Freelance',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt  = (v: any) => Math.round(Number(v) || 0).toLocaleString('fr-FR');
const fmtD = (v: any, d = 2) => Number(v || 0).toFixed(d);

function hex2rgb(hex: string): string {
  if (!hex || hex.length < 7) return '0,0,0';
  return `${parseInt(hex.slice(1,3),16)},${parseInt(hex.slice(3,5),16)},${parseInt(hex.slice(5,7),16)}`;
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
  parts.push(`${m} mois`);
  return parts.join(' et ') || '< 1 mois';
}

function cleanLabel(label: string): string {
  return label.replace(/^[🤖✋]\s*/, '').trim();
}

function getFont(f: string): string {
  if (f === 'serif') return '"Georgia","Times New Roman",serif';
  if (f === 'mono')  return '"Courier New","Lucida Console",monospace';
  return '"Inter","Helvetica Neue",Arial,sans-serif';
}
const getFS  = (s: string) => s === 'sm' ? 9.5 : s === 'lg' ? 11.5 : 10.5;
const getPad = (d: string) => d === 'compact' ? '4px 8px' : d === 'airy' ? '8px 14px' : '5px 10px';

// ─── Composant principal ──────────────────────────────────────────────────────

export default function BulletinRenderer({ payroll, template, previewMode = false }: BulletinRendererProps) {
  const cfg  = template ?? getBaseTemplate('default');
  const st   = cfg.style;
  const p    = st.primaryColor   || '#0EA5E9';
  const tc   = st.textColor      || '#111827';
  const r    = st.borderRadius   ?? 4;
  const font = getFont(st.fontFamily);
  const fs   = getFS(st.fontSize);
  const pad  = getPad(st.density);

  const vis = useMemo(
    () => new Set([...cfg.blocks].sort((a, b) => a.order - b.order).filter(b => b.visible).map(b => b.id)),
    [cfg.blocks],
  );
  const lbl = (id: string, fallback: string) => cfg.blocks.find(b => b.id === id)?.label ?? fallback;

  const emp  = payroll.employee ?? {} as any;
  const comp = payroll.company  ?? {} as any;
  const items = payroll.items ?? [];
  const today = new Date().toLocaleDateString('fr-FR', { day:'2-digit', month:'long', year:'numeric' });

  // ── Catégorisation des items ──────────────────────────────────────────────

  const salaryItems  = items.filter(i => i.type === 'GAIN' && ['SAL_BASE','INDEM_CONGE'].includes(i.code)).sort((a,b)=>a.order-b.order);
  const leaveDeduct  = items.find(i => ['ABS_CONGE','ABS_DEDUCT'].includes(i.code));
  const otItems      = items.filter(i => i.type === 'GAIN' && ['HS_10','HS_25','HS_50','HS_100'].includes(i.code)).sort((a,b)=>a.order-b.order);

  // Résolution type fiscal pour un bonus
  const getFiscalType = (item: any): 'TAXABLE_CNSS' | 'TAXABLE_NO_CNSS' | 'NON_TAXABLE' => {
    const enriched = (payroll.bonuses ?? []).find((b: any) => b.id === item.id || b.bonusType === cleanLabel(item.label));
    const ft = enriched?.fiscalType ?? (item as any).fiscalType ?? null;
    if (ft === 'NON_TAXABLE')     return 'NON_TAXABLE';
    if (ft === 'TAXABLE_NO_CNSS') return 'TAXABLE_NO_CNSS';
    if (ft === 'TAXABLE_CNSS')    return 'TAXABLE_CNSS';
    if (item.isTaxable === false)  return 'NON_TAXABLE';
    if (item.isCnss    === false)  return 'TAXABLE_NO_CNSS';
    return 'TAXABLE_CNSS';
  };

  // Sous-libellé bonus (ancienneté, prorata, quantité)
  const getBonusSub = (item: any): string | undefined => {
    const enriched = (payroll.bonuses ?? []).find((b: any) => b.id === item.id || b.bonusType === cleanLabel(item.label));
    if (!enriched) return undefined;
    if (enriched._seniorityYears != null && enriched._seniorityRate != null)
      return `${enriched._seniorityYears} an${enriched._seniorityYears > 1 ? 's' : ''} — ${enriched._seniorityRate}%`;
    if (enriched._proratized && enriched._originalAmount)
      return `Proratisé : ${fmt(enriched._originalAmount)} → ${fmt(item.amount)} FCFA`;
    if (enriched.quantityMode && enriched.unitAmount) {
      const ql: Record<string,string> = { AUTO_DAYS:'× jours', AUTO_WEEKS:'× sem.', AUTO_HOURS:'× h', FREE:'× qté saisie' };
      return `${fmt(enriched.unitAmount)} FCFA ${ql[enriched.quantityMode] ?? ''}`;
    }
    return undefined;
  };

  // Tous les bonus items (tous codes BONUS/PRIME/INDEM/TRANSPORT/PANIER/ALLOC)
  const allBonusItems = items.filter(i =>
    i.type === 'GAIN' &&
    !['SAL_BASE','INDEM_CONGE'].includes(i.code) &&
    !['HS_10','HS_25','HS_50','HS_100'].includes(i.code)
  ).sort((a,b)=>a.order-b.order);

  // Primes qui entrent dans le brut fiscal
  const primesImposables = allBonusItems.filter(i => getFiscalType(i) !== 'NON_TAXABLE');
  // Indemnités hors brut (transport, panier, logement...)
  const indemnitesHorsBrut = allBonusItems.filter(i => getFiscalType(i) === 'NON_TAXABLE');

  // Cotisations salariales
  const cnssItem         = items.find(i => i.code === 'CNSS_SAL');
  const irppItem         = items.find(i => i.code === 'ITS' || i.code === 'BNC_SOURCE');
  const loanItems        = items.filter(i => i.code === 'LOAN').sort((a,b)=>a.order-b.order);
  const advItems         = items.filter(i => i.code === 'ADVANCE').sort((a,b)=>a.order-b.order);
  const customSalTax     = items.filter(i => i.type === 'DEDUCTION' && i.code.startsWith('CTAX_') && !i.code.startsWith('CTAX_EMP_')).sort((a,b)=>a.order-b.order);

  // Charges patronales
  const tusDgiItem       = items.find(i => i.code === 'TUS_DGI');
  const tusCnssItem      = items.find(i => i.code === 'TUS_CNSS');
  const tusOldItem       = items.find(i => i.code === 'TUS');
  const customEmpTax     = items.filter(i => i.type === 'EMPLOYER_COST' && i.code.startsWith('CTAX_EMP_')).sort((a,b)=>a.order-b.order);

  // Valeurs numériques
  const cnssAmt      = Number(cnssItem?.amount  ?? payroll.cnssSalarial   ?? 0);
  const irppAmt      = Number(irppItem?.amount  ?? payroll.its             ?? 0);
  const cnssPatPen   = Number(payroll.cnssEmployerPension  ?? 0);
  const cnssPatFam   = Number(payroll.cnssEmployerFamily   ?? 0);
  const cnssPatAcc   = Number(payroll.cnssEmployerAccident ?? 0);
  const cnssPatTot   = cnssPatPen + cnssPatFam + cnssPatAcc;
  const tusDgi       = Number(tusDgiItem?.amount  ?? payroll.tusDgiAmount  ?? 0);
  const tusCnss      = Number(tusCnssItem?.amount ?? payroll.tusCnssAmount ?? 0);
  const tusTot       = tusDgi + tusCnss || Number(tusOldItem?.amount ?? payroll.tusTotal ?? 0);
  const grossSalary  = Number(payroll.grossSalary   ?? 0);
  const netSalary    = Number(payroll.netSalary     ?? 0);
  const totalRet     = Number(payroll.totalDeductions ?? 0);
  const totalCost    = Number(payroll.totalEmployerCost ?? 0);

  // ITS : annuel + mensuel
  const itsAnnuel    = irppAmt * 12;
  const irppRate     = Number(payroll.irppEffectiveRate ?? 0);
  const fiscalParts  = Number(payroll.irppFiscalParts   ?? 1);

  // Total gains affiché = brut + indemnités hors brut
  const totalIndem   = indemnitesHorsBrut.reduce((s, i) => s + i.amount, 0);
  const totalGains   = grossSalary + totalIndem;
  const totalRet2    = totalRet + loanItems.reduce((s,i)=>s+i.amount,0) + advItems.reduce((s,i)=>s+i.amount,0);

  // Numérotation des lignes (style bulletin officiel)
  let lineNo = 10;
  const nextNo = (step = 10) => { const n = lineNo; lineNo += step; return String(n); };

  // Alternance ligne
  let rowBg = false;
  const bg = () => { rowBg = !rowBg; return rowBg ? '#f9fafb' : '#ffffff'; };

  // Couleur selon fiscal type
  const gainColor = (ft: string) =>
    ft === 'NON_TAXABLE' ? '#b45309' : ft === 'TAXABLE_NO_CNSS' ? '#1d4ed8' : '#15803d';

  // ── Styles communs ─────────────────────────────────────────────────────────

  const thStyle = (align: 'left'|'right'|'center' = 'right'): React.CSSProperties => ({
    background: tc,
    color: '#fff',
    padding: '6px 8px',
    fontSize: fs - 1.5,
    fontWeight: 800,
    textTransform: 'uppercase',
    letterSpacing: '.06em',
    textAlign: align,
    whiteSpace: 'nowrap',
  });

  const tdStyle = (bg2: string, align: 'left'|'right'|'center' = 'right', color = tc, bold = false): React.CSSProperties => ({
    background: bg2,
    padding: pad,
    borderBottom: '1px solid #e5e7eb',
    fontSize: fs,
    fontWeight: bold ? 700 : 400,
    color,
    textAlign: align,
    fontFamily: align === 'right' ? 'monospace' : 'inherit',
    verticalAlign: 'top',
  });

  const sectionHead = (label: string, color: string) => (
    <tr>
      <td colSpan={9} style={{ background: color, padding: '4px 10px', fontSize: fs - 1.5, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '.1em', color: '#fff' }}>
        {label}
      </td>
    </tr>
  );

  const totalRow = (label: string, gain: number, retSal: number, retPat: number, bgColor: string, fColor: string) => (
    <tr>
      <td colSpan={5} style={{ background: bgColor, padding: '7px 10px', fontSize: fs, fontWeight: 900, textTransform: 'uppercase', color: fColor }}>
        {label}
      </td>
      <td style={{ background: bgColor, padding: '7px 10px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 900, fontSize: fs + 1, color: gain ? '#15803d' : bgColor }}>
        {gain ? fmt(gain) : ''}
      </td>
      <td style={{ background: bgColor, padding: '7px 10px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 900, fontSize: fs + 1, color: retSal ? '#b91c1c' : bgColor }}>
        {retSal ? fmt(retSal) : ''}
      </td>
      <td style={{ background: bgColor, padding: '7px 10px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 900, fontSize: fs + 1, color: retPat ? '#c2410c' : bgColor }}>
        {retPat ? fmt(retPat) : ''}
      </td>
      <td style={{ background: bgColor }} />
    </tr>
  );

  // ── Render header ──────────────────────────────────────────────────────────

  const renderHeader = () => {
    const hPad = '14px 18px';
    if (st.headerStyle === 'dark') return (
      <div style={{ background: tc, padding: hPad, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: fs + 6, fontWeight: 900, color: '#fff' }}>{comp.tradeName || comp.legalName || 'Entreprise'}</div>
          {st.showAddress && comp.address && <div style={{ fontSize: fs - 1, color: '#94a3b8', marginTop: 2 }}>{comp.address}{comp.city ? `, ${comp.city}` : ''}</div>}
          {st.showFiscalNumbers && <div style={{ fontSize: fs - 2, color: '#64748b', marginTop: 3 }}>
            {[comp.rccmNumber && `RCCM : ${comp.rccmNumber}`, comp.cnssNumber && `CNSS : ${comp.cnssNumber}`, comp.phone && `Tél : ${comp.phone}`].filter(Boolean).join(' · ')}
          </div>}
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: fs - 2, textTransform: 'uppercase', letterSpacing: '.2em', color: '#64748b' }}>Bulletin de Paie</div>
          <div style={{ fontSize: fs + 8, fontWeight: 900, color: p }}>{MONTHS[(payroll.month ?? 1) - 1]}</div>
          <div style={{ fontSize: fs + 1, fontWeight: 700, color: '#94a3b8' }}>{payroll.year}</div>
        </div>
      </div>
    );

    // Default / gradient / line / minimal → layout 2 colonnes
    const hasBg = st.headerStyle === 'gradient' || st.headerStyle === 'line';
    return (
      <div style={{
        padding: hPad,
        background: hasBg ? `linear-gradient(135deg, rgba(${hex2rgb(p)},.07), rgba(${hex2rgb(p)},.02))` : '#fff',
        borderBottom: `2px solid ${p}`,
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16,
      }}>
        {/* Logo + Entreprise */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {st.showLogo && (
            comp.logo
              ? <img src={comp.logo} alt="Logo" style={{ width: 52, height: 52, objectFit: 'contain', borderRadius: r }} />
              : <div style={{ width: 48, height: 48, borderRadius: r, background: `rgba(${hex2rgb(p)},.12)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 18, color: p, flexShrink: 0 }}>
                  {(comp.tradeName || comp.legalName || 'E')[0]}
                </div>
          )}
          <div>
            <div style={{ fontSize: fs + 4, fontWeight: 900, color: tc }}>{comp.tradeName || comp.legalName || 'Entreprise'}</div>
            {st.showAddress && comp.address && (
              <div style={{ fontSize: fs - 1, color: '#64748b', marginTop: 1 }}>{comp.address}{comp.city ? `, ${comp.city}` : ''}</div>
            )}
            {st.showFiscalNumbers && (
              <div style={{ fontSize: fs - 2, color: '#94a3b8', marginTop: 2 }}>
                {[comp.rccmNumber && `RCCM : ${comp.rccmNumber}`, comp.cnssNumber && `CNSS emp : ${comp.cnssNumber}`, comp.phone && `Tél : ${comp.phone}`].filter(Boolean).join(' · ')}
              </div>
            )}
            {comp.collectiveAgreement && (
              <div style={{ fontSize: fs - 2, color: p, marginTop: 2, fontWeight: 600 }}>Convention : {comp.collectiveAgreement}</div>
            )}
          </div>
        </div>
        {/* Titre + mois */}
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontSize: fs - 2, textTransform: 'uppercase', letterSpacing: '.25em', color: '#94a3b8', fontWeight: 700 }}>Bulletin de Paie</div>
          <div style={{ fontSize: fs + 10, fontWeight: 900, color: p, lineHeight: 1 }}>{MONTHS[(payroll.month ?? 1) - 1]}</div>
          <div style={{ fontSize: fs + 1, fontWeight: 700, color: '#475569' }}>{payroll.year}</div>
          {payroll.paymentDate && (
            <div style={{ fontSize: fs - 2, color: '#94a3b8', marginTop: 2 }}>
              Paiement le {new Date(payroll.paymentDate).toLocaleDateString('fr-FR')} par {PAYMENT[emp.paymentMethod ?? ''] ?? emp.paymentMethod ?? '—'}
            </div>
          )}
        </div>
      </div>
    );
  };

  // ── Render employee ────────────────────────────────────────────────────────

  const renderEmployee = () => {
    const showTime = vis.has('time');
    return (
      <div style={{ borderBottom: `1px solid #e2e8f0` }}>
        {/* Bande infos employé — style tableau officiel */}
        <div style={{ display: 'grid', gridTemplateColumns: showTime ? '1fr 1fr' : '1fr', gap: 0, borderBottom: '1px solid #e5e7eb' }}>

          {/* Colonne gauche — Identité */}
          <div style={{ padding: '10px 18px', borderRight: showTime ? '1px solid #e5e7eb' : 'none' }}>
            <div style={{ fontSize: fs - 2, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.1em', color: '#94a3b8', marginBottom: 6 }}>
              Informations du salarié
            </div>
            <div style={{ fontSize: fs + 3, fontWeight: 900, color: tc, marginBottom: 4 }}>
              {emp.firstName} {emp.lastName}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px 12px' }}>
              {[
                ['Matricule',          emp.employeeNumber],
                ['Fonction',           emp.position],
                ['Catégorie / Échelon', [emp.professionalCategory, emp.echelon].filter(Boolean).join(' / ') || null],
                ['Date d\'embauche',   emp.hireDate ? new Date(emp.hireDate).toLocaleDateString('fr-FR') : null],
                ['Ancienneté',         seniority(emp.hireDate)],
                ['Étatcivil',          MARITAL[emp.maritalStatus ?? ''] ?? emp.maritalStatus],
                ['N° CNSS',            emp.cnssNumber],
                ['N° compte',          emp.nationalIdNumber],
              ].map(([label, val]) => val ? (
                <div key={label as string} style={{ display: 'grid', gridTemplateColumns: '110px 1fr', gap: '0 4px', marginBottom: 2 }}>
                  <span style={{ fontSize: fs - 1.5, color: '#64748b' }}>{label}</span>
                  <span style={{ fontSize: fs - 1.5, fontWeight: 700, color: tc }}>{val}</span>
                </div>
              ) : null)}
            </div>
          </div>

          {/* Colonne droite — Contrat + période */}
          {showTime && (
            <div style={{ padding: '10px 18px' }}>
              <div style={{ fontSize: fs - 2, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.1em', color: '#94a3b8', marginBottom: 6 }}>
                Période & contrat
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px 12px' }}>
                {[
                  ['Nature de contrat',   CONTRACT[emp.contractType ?? ''] ?? emp.contractType],
                  ['Nombre d\'enfants',   emp.numberOfChildren != null ? String(emp.numberOfChildren) : null],
                  ['Nombre de parts',     fiscalParts > 0 ? String(fiscalParts) : null],
                  ['Site',               emp.department?.name],
                  ['Jours ouvrables',    `${payroll.workDays ?? 26} jours`],
                  ['Jours travaillés',   `${payroll.workedDays ?? payroll.workDays ?? 26} jours`],
                  (payroll.absenceDays ?? 0) > 0 && ['Absences', `${payroll.absenceDays} jour(s)`],
                  (payroll.daysOnLeave ?? 0) > 0 && ['Congés payés', `${payroll.daysOnLeave} jour(s)`],
                  payroll.totalOvertimeAmount && payroll.totalOvertimeAmount > 0 && ['Heures sup.',
                    [payroll.overtimeHours10  && `${payroll.overtimeHours10}h(+10%)`,
                     payroll.overtimeHours25  && `${payroll.overtimeHours25}h(+25%)`,
                     payroll.overtimeHours50  && `${payroll.overtimeHours50}h(+50%)`,
                     payroll.overtimeHours100 && `${payroll.overtimeHours100}h(+100%)`].filter(Boolean).join(' ')],
                ].filter(Boolean).map((row: any) => (
                  <div key={row[0]} style={{ display: 'grid', gridTemplateColumns: '110px 1fr', gap: '0 4px', marginBottom: 2 }}>
                    <span style={{ fontSize: fs - 1.5, color: '#64748b' }}>{row[0]}</span>
                    <span style={{ fontSize: fs - 1.5, fontWeight: 700, color: tc }}>{row[1]}</span>
                  </div>
                ))}
              </div>
              {(emp.isSubjectToCnss === false || emp.isSubjectToIrpp === false) && (
                <div style={{ display: 'flex', gap: 5, marginTop: 6, flexWrap: 'wrap' }}>
                  {emp.isSubjectToCnss === false && <span style={{ fontSize: fs - 2.5, background: '#fef3c7', color: '#b45309', padding: '2px 6px', borderRadius: 4, fontWeight: 700 }}>CNSS : exempté</span>}
                  {emp.isSubjectToIrpp === false && <span style={{ fontSize: fs - 2.5, background: '#fef3c7', color: '#b45309', padding: '2px 6px', borderRadius: 4, fontWeight: 700 }}>ITS : exempté</span>}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  // ── Tableau principal — structure IESM ─────────────────────────────────────

  const renderTable = () => {
    rowBg = false;
    lineNo = 10;

    // Réinitialiser la numérotation
    let no = 10;
    const n = () => { const v = no; no += (no < 100 ? 10 : no < 400 ? 10 : 10); return String(v); };

    const COL_WIDTHS = ['4%','36%','6%','9%','6%','10%','10%','6%','9%'];

    // Ligne standard du tableau
    const DataRow = ({
      num, label, sub, nombre, base, tauxSal, gain, retSal, tauxPat, retPat,
      gainColor: gc = '#15803d',
    }: {
      num?: string; label: string; sub?: string;
      nombre?: string; base?: string; tauxSal?: string;
      gain?: number; retSal?: number; tauxPat?: string; retPat?: number;
      gainColor?: string;
    }) => {
      const bg2 = bg();
      return (
        <tr>
          <td style={tdStyle(bg2, 'center', '#94a3b8')}>{num ?? ''}</td>
          <td style={{ ...tdStyle(bg2, 'left'), paddingLeft: 10 }}>
            <span style={{ fontWeight: 500, color: tc }}>{label}</span>
            {sub && <div style={{ fontSize: fs - 2, color: '#94a3b8', marginTop: 1 }}>{sub}</div>}
          </td>
          <td style={tdStyle(bg2)}>{nombre ?? '—'}</td>
          <td style={tdStyle(bg2)}>{base ?? '—'}</td>
          <td style={tdStyle(bg2)}>{tauxSal ?? '—'}</td>
          <td style={{ ...tdStyle(bg2, 'right', gc, !!gain), fontSize: gain ? fs + 0.5 : fs }}>
            {gain ? `+${fmt(gain)}` : '—'}
          </td>
          <td style={{ ...tdStyle(bg2, 'right', '#b91c1c', !!retSal), fontSize: retSal ? fs + 0.5 : fs }}>
            {retSal ? `-${fmt(retSal)}` : '—'}
          </td>
          <td style={tdStyle(bg2)}>{tauxPat ?? '—'}</td>
          <td style={{ ...tdStyle(bg2, 'right', '#c2410c', !!retPat), fontSize: retPat ? fs + 0.5 : fs }}>
            {retPat ? `+${fmt(retPat)}` : '—'}
          </td>
        </tr>
      );
    };

    return (
      <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
        {/* Colgroup */}
        <colgroup>
          {COL_WIDTHS.map((w, i) => <col key={i} style={{ width: w }} />)}
        </colgroup>

        {/* En-tête colonnes */}
        <thead>
          <tr>
            <th style={thStyle('center')}>N°</th>
            <th style={{ ...thStyle('left'), paddingLeft: 10 }}>Désignation</th>
            <th style={thStyle()}>Nombre</th>
            <th style={thStyle()}>Base</th>
            <th colSpan={2} style={{ ...thStyle('center'), borderLeft: '1px solid #374151' }}>
              Part salariale
            </th>
            <th style={{ ...thStyle(), borderLeft: '1px solid #374151' }}>Retenue</th>
            <th colSpan={2} style={{ ...thStyle('center'), borderLeft: '1px solid #374151' }}>
              Part patronale
            </th>
          </tr>
          <tr>
            <th style={{ ...thStyle('center'), background: '#374151', fontSize: fs - 2.5, padding: '3px 8px' }}></th>
            <th style={{ ...thStyle('left'), background: '#374151', fontSize: fs - 2.5, padding: '3px 10px' }}></th>
            <th style={{ ...thStyle(), background: '#374151', fontSize: fs - 2.5, padding: '3px 8px' }}></th>
            <th style={{ ...thStyle(), background: '#374151', fontSize: fs - 2.5, padding: '3px 8px' }}></th>
            <th style={{ ...thStyle(), background: '#374151', fontSize: fs - 2.5, padding: '3px 8px', borderLeft: '1px solid #4b5563' }}>Taux</th>
            <th style={{ ...thStyle(), background: '#374151', fontSize: fs - 2.5, padding: '3px 8px' }}>Gain</th>
            <th style={{ ...thStyle(), background: '#374151', fontSize: fs - 2.5, padding: '3px 8px', borderLeft: '1px solid #4b5563' }}>Retenue</th>
            <th style={{ ...thStyle(), background: '#374151', fontSize: fs - 2.5, padding: '3px 8px', borderLeft: '1px solid #4b5563' }}>Taux</th>
            <th style={{ ...thStyle(), background: '#374151', fontSize: fs - 2.5, padding: '3px 8px' }}>Retenue</th>
          </tr>
        </thead>

        <tbody>
          {/* ── RÉMUNÉRATIONS ─────────────────────────────────────────────── */}
          {sectionHead('Rémunérations', '#15803d')}

          {salaryItems.map(i => (
            <DataRow key={i.id}
              num={n()}
              label={cleanLabel(i.label)}
              nombre={payroll.workedDays != null ? fmt(payroll.workedDays) : undefined}
              base={Number(payroll.baseSalary) > 0 ? fmt(Number(payroll.baseSalary) / (payroll.workDays || 26)) : undefined}
              gain={i.amount}
              gainColor="#15803d"
            />
          ))}

          {/* Absences/congés */}
          {leaveDeduct && (
            <DataRow
              num={n()}
              label={cleanLabel(leaveDeduct.label)}
              base={leaveDeduct.base ? fmt(leaveDeduct.base) : undefined}
              retSal={leaveDeduct.amount}
            />
          )}

          {/* ── PRIMES IMPOSABLES (entrent dans le brut) ─────────────────── */}
          {primesImposables.map(i => {
            const ft  = getFiscalType(i);
            const sub = getBonusSub(i);
            const enriched = (payroll.bonuses ?? []).find((b: any) => b.id === i.id || b.bonusType === cleanLabel(i.label));
            const hasQty = enriched?.quantityMode && enriched?.unitAmount;
            return (
              <DataRow key={i.id}
                num={n()}
                label={cleanLabel(i.label)}
                sub={sub}
                nombre={hasQty ? (enriched?.quantityMode === 'AUTO_DAYS' ? fmt(payroll.workedDays ?? 26) : hasQty ? undefined : undefined) : undefined}
                base={hasQty ? fmt(enriched.unitAmount) : undefined}
                gain={i.amount}
                gainColor={gainColor(ft)}
              />
            );
          })}

          {/* Heures supplémentaires */}
          {otItems.map(i => (
            <DataRow key={i.id}
              num={n()}
              label={cleanLabel(i.label)}
              base={i.base ? fmt(i.base) : undefined}
              tauxSal={i.rate ? `${((i.rate - 1) * 100).toFixed(0)}%` : undefined}
              gain={i.amount}
              gainColor="#d97706"
            />
          ))}

          {/* ── TOTAL BRUT ────────────────────────────────────────────────── */}
          {totalRow('Total Brut', grossSalary, 0, 0, '#f0fdf4', '#15803d')}

          {/* ── COTISATIONS ───────────────────────────────────────────────── */}
          {sectionHead('Cotisations', '#1e293b')}

          {/* CNSS — ligne unique salariale + patronale */}
          {cnssAmt > 0 && (
            <DataRow
              num="300"
              label="Cotisation CNSS"
              base={fmt(grossSalary)}
              tauxSal="4 %"
              retSal={cnssAmt}
              tauxPat={cnssPatTot > 0 ? `${fmtD((cnssPatTot / grossSalary) * 100, 2)} %` : undefined}
              retPat={cnssPatTot > 0 ? cnssPatTot : undefined}
            />
          )}

          {/* ITS / IRPP — label propre selon fiscalMode */}
          {irppAmt > 0 && (() => {
            // Récupérer fiscalMode depuis l'item ITS dans payroll.items
            const itsItem    = items.find(i => i.code === 'ITS' || i.code === 'BNC_SOURCE');
            const fiscalMode = (itsItem as any)?.fiscalMode ?? 'ITS_2026';
            const fParts     = (itsItem as any)?.fiscalParts ?? fiscalParts;
            const rni        = (itsItem as any)?.rniAnnuel   ?? 0;
            const abat       = (itsItem as any)?.abattement  ?? 0;
            const isBnc      = itsItem?.code === 'BNC_SOURCE';
            const bncTaux    = (itsItem as any)?.bncTaux;
            const isForfait  = fiscalMode === 'FORFAIT';
            const isLegacy   = fiscalMode === 'IRPP_LEGACY';

            // Label principal : toujours simple
            const label = isBnc
              ? `BNC retenu à la source${bncTaux ? ` (${(bncTaux * 100).toFixed(0)}%)` : ''}`
              : isForfait
                ? `Impôt forfaitaire — Barème BNC`
                : isLegacy
                  ? `IRPP — Barème progressif`
                  : `ITS — Barème progressif`;

            // Sous-libellé : infos utiles SANS mention des 1 200 F
            // Annuel, parts fiscales, abattement — pour transparence
            const sub = isBnc || isForfait ? undefined
              : rni > 0
                ? `RNI annuel : ${fmt(rni)} F · Abattement 20% : ${fmt(abat)} F · Parts : ${fParts}${irppRate > 0 ? ` · Taux moyen : ${fmtD(irppRate, 2)}%` : ''}`
                : undefined;

            return (
              <DataRow
                num="350"
                label={label}
                sub={sub}
                retSal={irppAmt}
              />
            );
          })()}

          {/* Taxe occupation locaux / taxes custom salariales */}
          {customSalTax.map(i => (
            <DataRow key={i.id}
              num={n()}
              label={i.label}
              base={i.base ? fmt(i.base) : undefined}
              retSal={i.amount}
            />
          ))}

          {/* TUS patronal — 2 lignes */}
          {tusDgi > 0 && (
            <DataRow num="360" label="TUS — Part DGI" base={fmt(grossSalary)} tauxPat="2,025 %" retPat={tusDgi} />
          )}
          {tusCnss > 0 && (
            <DataRow num="361" label="TUS — Part CNSS" base={fmt(grossSalary)} tauxPat="5,475 %" retPat={tusCnss} />
          )}

          {/* Taxes custom patronales */}
          {customEmpTax.map(i => (
            <DataRow key={i.id} num={n()} label={i.label} base={i.base ? fmt(i.base) : undefined} retPat={i.amount} />
          ))}

          {/* ── INDEMNITÉS HORS BRUT ──────────────────────────────────────── */}
          {indemnitesHorsBrut.length > 0 && sectionHead('Indemnités (hors brut — non soumises ITS ni CNSS)', '#b45309')}
          {indemnitesHorsBrut.map(i => {
            const sub = getBonusSub(i);
            const enriched = (payroll.bonuses ?? []).find((b: any) => b.id === i.id || b.bonusType === cleanLabel(i.label));
            const hasQty = enriched?.quantityMode && enriched?.unitAmount;
            return (
              <DataRow key={i.id}
                num={n()}
                label={cleanLabel(i.label)}
                sub={sub}
                nombre={hasQty && enriched?.quantityMode === 'AUTO_DAYS' ? fmt(payroll.workedDays ?? 26) : undefined}
                base={hasQty ? fmt(enriched.unitAmount) : undefined}
                gain={i.amount}
                gainColor="#b45309"
              />
            );
          })}

          {/* ── PRÊTS & AVANCES ───────────────────────────────────────────── */}
          {(loanItems.length > 0 || advItems.length > 0) && sectionHead('Retenues diverses', '#7c3aed')}
          {loanItems.map(i => (
            <DataRow key={i.id} num="702" label="Prêt" retSal={i.amount} />
          ))}
          {advItems.map(i => (
            <DataRow key={i.id} num="703" label="Avance sur salaire" retSal={i.amount} />
          ))}

          {/* ── TOTAUX FINAUX ──────────────────────────────────────────────── */}
          <tr>
            <td colSpan={9} style={{ padding: 0, borderTop: '2px solid #e5e7eb' }} />
          </tr>

          {/* TOTAL GAINS */}
          <tr>
            <td style={{ background: '#f8fafc', padding: '6px 8px', fontWeight: 900, fontSize: fs - 1, color: '#94a3b8', textAlign: 'center' }}>989</td>
            <td style={{ background: '#f8fafc', padding: '6px 10px', fontWeight: 800, fontSize: fs, color: '#15803d', textTransform: 'uppercase' }}>Total Gains</td>
            <td colSpan={3} style={{ background: '#f8fafc' }} />
            <td style={{ background: '#f8fafc', padding: '6px 8px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 900, fontSize: fs + 2, color: '#15803d' }}>
              {fmt(totalGains)}
            </td>
            <td style={{ background: '#f8fafc', padding: '6px 8px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 900, fontSize: fs + 2, color: '#b91c1c' }}>
              {fmt(totalRet)}
            </td>
            <td colSpan={2} style={{ background: '#f8fafc' }} />
          </tr>

          {/* TOTAL RETENUES */}
          <tr>
            <td style={{ background: '#fef2f2', padding: '6px 8px', fontWeight: 900, fontSize: fs - 1, color: '#94a3b8', textAlign: 'center' }}>995</td>
            <td style={{ background: '#fef2f2', padding: '6px 10px', fontWeight: 800, fontSize: fs, color: '#b91c1c', textTransform: 'uppercase' }}>Total Retenues</td>
            <td colSpan={3} style={{ background: '#fef2f2' }} />
            <td style={{ background: '#fef2f2' }} />
            <td style={{ background: '#fef2f2', padding: '6px 8px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 900, fontSize: fs + 2, color: '#b91c1c' }}>
              {fmt(totalRet)}
            </td>
            <td colSpan={2} style={{ background: '#fef2f2' }} />
          </tr>

        </tbody>
      </table>
    );
  };

  // ── NET À PAYER ────────────────────────────────────────────────────────────

  const renderNet = () => (
    <div style={{ background: tc, padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div>
        <div style={{ fontSize: fs - 1, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.2em', color: '#9ca3af' }}>Net à Payer</div>
        <div style={{ fontSize: fs - 2, color: '#6b7280', marginTop: 2 }}>Montant net versé à l'employé</div>
      </div>
      <div style={{ textAlign: 'right' }}>
        <span style={{ fontSize: 32, fontWeight: 900, fontFamily: 'monospace', color: '#fff' }}>{fmt(netSalary)}</span>
        <span style={{ marginLeft: 8, fontSize: fs, color: '#6b7280', fontWeight: 700 }}>FCFA</span>
      </div>
    </div>
  );

  // ── CUMULS ANNUELS (style IESM) ────────────────────────────────────────────

  const renderCumuls = () => {
    const cumulCols = [
      { label: 'Salaire brut',        val: payroll.grossSalary },
      { label: 'Charges salariales',  val: payroll.cnssSalarial },
      { label: 'Charges patronales',  val: payroll.cnssEmployer },
      { label: 'Avantages en nature', val: 0 },
      { label: 'Net imposable',        val: grossSalary - cnssAmt },
      { label: 'Heures travaillées',  val: payroll.workedDays ? payroll.workedDays * 8 : null, unit: 'h' },
      { label: 'Heures suppl.',        val: (payroll.overtimeHours10 ?? 0) + (payroll.overtimeHours25 ?? 0) + (payroll.overtimeHours50 ?? 0) + (payroll.overtimeHours100 ?? 0), unit: 'h' },
      { label: 'Base Congés',          val: payroll.baseSalary },
    ];

    return (
      <div style={{ borderTop: '2px solid #e5e7eb', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ ...thStyle('left'), background: '#374151', padding: '5px 10px', width: '8%' }} />
              {cumulCols.map(c => (
                <th key={c.label} style={{ ...thStyle(), background: '#374151', padding: '5px 8px', fontSize: fs - 2, fontWeight: 700 }}>
                  {c.label}
                </th>
              ))}
              <th style={{ ...thStyle(), background: '#374151', padding: '5px 8px', fontSize: fs - 2, fontWeight: 700, minWidth: 90 }}>NET À PAYER</th>
            </tr>
          </thead>
          <tbody>
            {/* Ligne période */}
            <tr>
              <td style={{ ...tdStyle('#fff', 'left'), fontSize: fs - 1.5, fontWeight: 700, color: '#64748b', paddingLeft: 10 }}>Période</td>
              {cumulCols.map(c => (
                <td key={c.label} style={tdStyle('#fff')}>
                  <span style={{ fontFamily: 'monospace', fontSize: fs, fontWeight: 600, color: tc }}>
                    {c.val != null && Number(c.val) !== 0 ? fmt(c.val) + (c.unit ? ' ' + c.unit : '') : '0'}
                  </span>
                </td>
              ))}
              <td style={{ ...tdStyle('#f0fdf4'), fontFamily: 'monospace', fontWeight: 900, fontSize: fs + 1, color: '#15803d' }}>
                {fmt(netSalary)}
              </td>
            </tr>
            {/* Ligne année — si données disponibles */}
            <tr>
              <td style={{ ...tdStyle('#f8fafc', 'left'), fontSize: fs - 1.5, fontWeight: 700, color: '#64748b', paddingLeft: 10 }}>Année</td>
              {cumulCols.map(c => (
                <td key={c.label} style={tdStyle('#f8fafc')}>
                  <span style={{ fontFamily: 'monospace', fontSize: fs, fontWeight: 600, color: '#64748b' }}>
                    {c.val != null && Number(c.val) !== 0 ? fmt(Number(c.val) * payroll.month) + (c.unit ? ' ' + c.unit : '') : '0'}
                  </span>
                </td>
              ))}
              <td style={{ ...tdStyle('#e8fdf0'), fontFamily: 'monospace', fontWeight: 900, fontSize: fs + 1, color: '#15803d' }}>
                {fmt(netSalary * payroll.month)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  };

  // ── SIGNATURES ─────────────────────────────────────────────────────────────

  const renderSignatures = () => {
    const hPad = '14px 18px';
    return (
      <div style={{ padding: hPad, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 60 }}>
        {[
          { label: "Signature de l'Employé(e)",        sub: 'Lu et approuvé' },
          { label: "Signature et cachet de l'Employeur", sub: 'Cachet & signature obligatoire' },
        ].map(s => (
          <div key={s.label} style={{ textAlign: 'center' }}>
            <div style={{ fontSize: fs - 1, fontWeight: 700, color: '#4b5563', marginBottom: 2 }}>{s.label}</div>
            <div style={{ fontSize: fs - 2, color: '#94a3b8', marginBottom: 10 }}>{s.sub}</div>
            <div style={{ height: 48, borderBottom: '2px dashed #d1d5db' }} />
          </div>
        ))}
      </div>
    );
  };

  // ── Message personnalisé ───────────────────────────────────────────────────

  const renderMessage = () => {
    if (!st.footerMessage) return null;
    return (
      <div style={{ padding: '8px 18px 0', borderTop: '1px solid #e5e7eb' }}>
        <div style={{ fontSize: fs - 2, color: '#475569', fontStyle: 'italic', textAlign: 'center' }}>{st.footerMessage}</div>
      </div>
    );
  };

  // ── Mentions légales ───────────────────────────────────────────────────────

  const renderLegal = () => (
    <div style={{ padding: '10px 18px', borderTop: '1px solid #e5e7eb' }} className="bulletin-legal">
      <div style={{ borderRadius: r, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
        <div style={{ background: '#f8fafc', padding: '5px 12px', borderBottom: '1px solid #e5e7eb', fontSize: fs - 3, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.1em', color: '#475569' }}>
          ⚖️ Réglementation — République du Congo (Brazzaville)
        </div>
        <div style={{ background: '#fff', padding: '8px 12px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3px 20px' }}>
          {[
            'Code du Travail — Loi n°45-75 du 15 mars 1975',
            'ITS 2026 — Barème progressif — Abattement 20%',
            'CNSS salarié : 4% — Plafond pension : 1 200 000 FCFA',
            'CNSS patronale : pensions 8% · famille 10% · AT 2,25%',
            'SMIG Congo : 70 400 FCFA/mois (2026)',
            'TUS : 7,5% sur brut total (DGI 2,025% + CNSS 5,475%)',
            'HS — Décret n°78-360 : +10% · +25% · +50% · +100%',
            "ITS — 1er palier : 1 200 FCFA/an — 615k à 1,5M : 10%",
          ].map((item, i) => (
            <div key={i} style={{ display: 'flex', gap: 4 }}>
              <span style={{ color: '#cbd5e1', fontSize: fs - 3, flexShrink: 0 }}>•</span>
              <span style={{ fontSize: fs - 3, color: '#64748b', lineHeight: 1.5 }}>{item}</span>
            </div>
          ))}
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, paddingTop: 8, borderTop: '1px solid #f1f5f9', marginTop: 8 }}>
        <span style={{ fontSize: fs - 1.5, fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '.15em' }}>KonzaRH</span>
        <span style={{ fontSize: fs - 2, color: '#94a3b8' }}>· Généré le {today}</span>
      </div>
    </div>
  );

  // ── Assemblage ─────────────────────────────────────────────────────────────

  return (
    <>
      <style>{`
        @media print {
          .bulletin-legal { display: none !important; }
          #bulletin-root  { width: 210mm !important; font-size: ${fs}px !important; }
          .no-break       { page-break-inside: avoid !important; break-inside: avoid !important; }
          @page           { size: A4 landscape; margin: 8mm 10mm; }
          *               { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        }
      `}</style>

      <div id="bulletin-root" style={{ fontFamily: font, fontSize: fs, background: '#fff', color: tc, width: previewMode ? '100%' : 'auto', boxSizing: 'border-box' }}>

        {/* En-tête */}
        <div className="no-break">{vis.has('header') && renderHeader()}</div>

        {/* Fiche employé */}
        {(vis.has('employee') || vis.has('time')) && (
          <div className="no-break">{renderEmployee()}</div>
        )}

        {/* Tableau principal */}
        <div className="no-break" style={{ padding: '0', overflowX: 'auto' }}>
          {renderTable()}
        </div>

        {/* Net à payer */}
        <div className="no-break">{renderNet()}</div>

        {/* Cumuls annuels */}
        {renderCumuls()}

        {/* Message */}
        {vis.has('message') && renderMessage()}

        {/* Signatures */}
        {vis.has('signatures') && <div className="no-break">{renderSignatures()}</div>}

        {/* Mentions légales — APP ONLY */}
        {vis.has('legal') && renderLegal()}
      </div>
    </>
  );
}