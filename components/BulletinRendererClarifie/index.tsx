'use client';

// ============================================================================
// components/BulletinRendererClarifie/index.tsx
//
// Gabarit "Bulletin de salaire clarifié" — reproduit la mise en page du
// modèle papier fourni par le client (bulletin AIRCAM / EBP) :
//   • en-tête entreprise encadré + bloc infos période/contrat à droite
//   • bloc salarié grisé (nom + adresse)
//   • ligne Convention / Emploi / Qualification / Service / Catégorie
//   • tableau à COLONNE UNIQUE "Montant" par partie (salariale / patronale) —
//     les gains sont positifs, toutes les cotisations sont négatives (signe
//     "-"), regroupées par bandeaux de section en gras
//   • pied de page : mode de règlement + Net à payer, cumuls Mois / Année,
//     congés (Acquis/Pris/Solde), signatures, mentions légales
//
// ✅ Calculs : mêmes sources de données que BulletinRenderer (Default) — le
//    front ne recalcule rien, tout vient de payroll / payroll.items / ytd.
// ✅ Les catégories "Santé/Retraite/Famille/Chômage" du modèle papier sont
//    spécifiques au régime URSSAF français et n'existent pas dans le régime
//    CNSS/ITS du Congo utilisé par l'app — les sections ci-dessous reprennent
//    donc les catégories réelles du système (CNSS, ITS/TUS, Autres
//    cotisations) plutôt que d'inventer des rubriques françaises fictives.
// ============================================================================

import React, { useMemo } from 'react';
import type { BulletinPayroll, BulletinTemplateConfig, PayrollItem } from '@/types/bulletin-template';
import { classifyItems } from '@/lib/bulletin-items-classifier';
import { getBaseTemplate } from '@/lib/bulletin-templates';

export interface BulletinRendererClarifieProps {
  payroll:      BulletinPayroll;
  template?:    BulletinTemplateConfig;
  previewMode?: boolean;
}

const MONTHS = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet',
                'Août','Septembre','Octobre','Novembre','Décembre'];
const MARITAL: Record<string,string> = {
  SINGLE:'Célibataire', MARRIED:'Marié(e)', DIVORCED:'Divorcé(e)',
  WIDOWED:'Veuf/Veuve', COHABITING:'Union libre',
};
const PAYMENT: Record<string,string> = {
  BANK_TRANSFER:'Virement', CASH:'Espèces', MOBILE_MONEY:'Mobile Money', CHECK:'Chèque',
};
const CONTRACT: Record<string,string> = {
  CDI:'CDI', CDD:'CDD', STAGE:'Stage', CONSULTANT:'Consultant',
  PRESTATAIRE:'Prestataire', INTERIM:'Intérimaire', FREELANCE:'Freelance',
};

// ── Utilitaires numériques (identiques BulletinRenderer Default) ───────────
const nv     = (v: any): number => { const x = Number(v); return isFinite(x) ? x : 0; };
const fmt    = (v: any): string  => { const x = Math.round(nv(v)); return x === 0 ? '' : x.toLocaleString('fr-FR'); };
const fmtZ   = (v: any): string  => Math.round(nv(v)).toLocaleString('fr-FR');
const fmtD   = (v: any): string  => { const x = Math.round(nv(v)); return x === 0 ? '—' : x.toLocaleString('fr-FR'); };
const fmtNeg = (v: any): string  => { const x = Math.round(nv(v)); return x === 0 ? '' : `-${Math.abs(x).toLocaleString('fr-FR')}`; };
const fmtDate = (d?: string)     => d ? new Date(d).toLocaleDateString('fr-FR') : '—';

function seniority(hireDate?: string, asOf?: Date): string {
  if (!hireDate) return '—';
  const hire = new Date(hireDate), now = asOf ?? new Date();
  let y = now.getFullYear() - hire.getFullYear();
  let m = now.getMonth()    - hire.getMonth();
  if (m < 0) { y--; m += 12; }
  return `${y} an${y !== 1 ? 's' : ''}`;
}

function formatCategorie(code: string | null | undefined): string {
  if (!code) return '—';
  const m = code.match(/^[A-Z]+(\d+)-E(\d+)$/i);
  if (m) return `Cat.${m[1]} Éch.${m[2]}`;
  const m2 = code.match(/^E(\d+)-(\d+)$/i);
  if (m2) return `Cat.${m2[1]} Éch.${m2[2]}`;
  return code;
}

function itemBase(item: any): string {
  if (item.base == null || nv(item.base) === 0) return '';
  return Math.round(nv(item.base)).toLocaleString('fr-FR');
}
function itemTaux(item: any): string {
  if (item.quantity != null && nv(item.quantity) !== 0) return String(nv(item.quantity));
  if (item.rate == null) return '';
  const r = nv(item.rate);
  if (r === 0) return '';
  if (r > 0 && r < 1) return (r * 100).toFixed(3).replace('.', ',').replace(/,?0+$/, '');
  return Number.isInteger(r) ? String(r) : r.toFixed(2).replace('.', ',');
}

// ── Tokens visuels — noir & blanc, colonne "Montant" unique signée ─────────
const SANS  = 'Arial,Helvetica,sans-serif';
const FONT  = '"Courier New",Courier,monospace';
const BD    = '0.5px solid #000';
const BDB   = '1px solid #000';
const TH_BG = '#dcdcdc';
const K     = '#000';
const ROW_H = 18;

const th = (bg = TH_BG, o?: React.CSSProperties): React.CSSProperties => ({
  border: BD, padding: '2px 4px', fontSize: 8.5, fontWeight: 700,
  textAlign: 'center', background: bg, textTransform: 'uppercase',
  fontFamily: SANS, verticalAlign: 'middle', color: K, ...o,
});
const td = (o?: React.CSSProperties): React.CSSProperties => ({
  border: BD, borderTop: 'none', borderBottom: 'none', padding: '0 5px',
  height: ROW_H, lineHeight: `${ROW_H}px`, fontSize: 9.5, verticalAlign: 'middle',
  color: K, fontFamily: SANS, background: '#fff', ...o,
});
const tdR = (o?: React.CSSProperties) => td({ textAlign: 'right', fontFamily: FONT, whiteSpace: 'nowrap', ...o });
const tdC = (o?: React.CSSProperties) => td({ textAlign: 'center', ...o });

const SectionHeader = ({ children }: { children: React.ReactNode }) => (
  <tr>
    <td colSpan={6} style={{ ...td({ fontWeight: 800, fontSize: 10, textTransform: 'uppercase' as const, letterSpacing: .4, paddingTop: 6 }), border: 'none' }}>
      {children}
    </td>
  </tr>
);

const DataRow = ({ label, base = '', tauxS = '', mtS = '', tauxP = '', mtP = '', indent = true, bold = false }:
  { label: string; base?: string; tauxS?: string; mtS?: string; tauxP?: string; mtP?: string; indent?: boolean; bold?: boolean }) => (
  <tr>
    <td style={{ ...td({ paddingLeft: indent ? 14 : 5, fontWeight: bold ? 700 : 400 }), borderLeft: BD }}>{label}</td>
    <td style={{ ...tdR(), borderLeft: BD }}>{base}</td>
    <td style={{ ...tdC({ fontSize: 8.5, padding: '0 2px' }), borderLeft: BD }}>{tauxS}</td>
    <td style={{ ...tdR({ fontWeight: mtS ? 600 : 400 }), borderLeft: BD }}>{mtS}</td>
    <td style={{ ...tdC({ fontSize: 8.5, padding: '0 2px' }), borderLeft: BD }}>{tauxP}</td>
    <td style={{ ...tdR({ fontWeight: mtP ? 600 : 400 }), borderLeft: BD, borderRight: BD }}>{mtP}</td>
  </tr>
);

const InfoLine = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div style={{ display: 'flex', gap: 5, fontSize: 8.5, marginBottom: 1.5 }}>
    <span style={{ color: '#555', minWidth: 90 }}>{label}</span>
    <strong style={{ color: K }}>{value}</strong>
  </div>
);

export default function BulletinRendererClarifie({ payroll, template, previewMode }: BulletinRendererClarifieProps) {
  const tpl = template ?? getBaseTemplate('clarifie');
  const e   = (payroll.employee ?? {}) as any;
  const co  = (payroll.company  ?? {}) as any;
  const items: PayrollItem[] = payroll.items ?? [];
  const ytd = (payroll as any).ytd ?? {};

  const { gainItems, cotisItems, indemItems, retenueItems, empItems } = useMemo(
    () => classifyItems(items), [items],
  );

  const cnssSal    = nv(payroll.cnssSalarial);
  const itsAmount  = nv(payroll.its);
  const totalBrut  = nv(payroll.grossSalary);
  const netSalary  = nv(payroll.netSalary);
  const cnssEmpPension  = nv(payroll.cnssEmployerPension);
  const cnssEmpFamily   = nv(payroll.cnssEmployerFamily);
  const cnssEmpAccident = nv(payroll.cnssEmployerAccident);
  const tusDgi  = nv((payroll as any).tusDgiAmount);
  const tusCnss = nv((payroll as any).tusCnssAmount);

  const absDeductItem = gainItems.find((i: any) => i.code === 'ABS_DEDUCT') ?? null;
  const gains  = gainItems.filter((i: any) => !['ABS_DEDUCT','ABS_CONGE'].includes(i.code));

  const CNSS_PAT_INDIVIDUAL = ['CNSS_EMP_PENSION','CNSS_EMP_FAMILY','CNSS_EMP_ACCIDENT',
    'CNSS_PENSION','CNSS_FAMILY','CNSS_ACCIDENT','CNSS_VIEILLESSE','CNSS_FAMILLE','CNSS_AT'];
  const isCnssPatSummary = (item: any) => {
    const lbl = (item.label ?? '').toLowerCase();
    if (CNSS_PAT_INDIVIDUAL.some(c => (item.code ?? '').toLowerCase().includes(c.toLowerCase()))) return true;
    return lbl.includes('pension') || lbl.includes('prestations familiales') || lbl.includes('accidents du travail');
  };

  const manualDeductions = retenueItems.filter((i: any) => i.code === 'MANUAL_DEDUCTION');
  const loanItems        = retenueItems.filter((i: any) => ['LOAN','ADVANCE'].includes(i.code));
  const ctaxEmp = cotisItems.filter((i: any) =>
    !['CNSS_SAL','CNSS','ITS','IRPP','BNC_SOURCE'].includes(i.code) && !isCnssPatSummary(i));
  const ctaxPat = ((empItems ?? []) as any[]).filter((i: any) =>
    !['TUS_DGI','TUS_CNSS'].includes(i.code) && !isCnssPatSummary(i));

  const totalPat = cnssEmpPension + cnssEmpFamily + cnssEmpAccident + tusDgi + tusCnss
    + ctaxPat.reduce((s: number, i: any) => s + nv(i.amount), 0);

  const congesDroits = nv(ytd.droitsConge ?? (payroll as any).congesDroits ?? 0);
  const congesPris   = nv(ytd.priseConge  ?? (payroll as any).congesPris   ?? 0);
  const _soldeRaw    = nv(ytd.soldeConge  ?? (payroll as any).congesSolde  ?? 0);
  const congesSolde  = _soldeRaw > 0 ? _soldeRaw : Math.max(0, congesDroits - congesPris);

  const ytdGross  = nv(ytd.grossSalary);
  const ytdCnss   = nv(ytd.cnssSalarial);
  const ytdCnssEmp = nv(ytd.cnssEmployer);
  const ytdNetImp = nv(ytd.netImposable) || (ytdGross - ytdCnss);

  const monthLabel = MONTHS[(payroll.month ?? 1) - 1];
  const periodStart = `01/${String(payroll.month ?? 1).padStart(2,'0')}/${payroll.year}`;
  const periodEnd   = `${new Date(payroll.year, payroll.month, 0).getDate()}/${String(payroll.month ?? 1).padStart(2,'0')}/${payroll.year}`;
  const fullName = [e.civility === 'FEMALE' ? 'Mme' : e.civility === 'MALE' ? 'M.' : '', e.firstName, e.lastName?.toUpperCase()]
    .filter(Boolean).join(' ');
  const cat = formatCategorie(e.professionalCategory);
  const rawDept  = e.department?.name ?? '';
  const deptName = /no.dep/i.test(rawDept) || rawDept.trim() === '' ? '—' : rawDept;

  return (
    <>
      <style>{`
        @media print {
          @page { size: A4 portrait; margin: 8mm 6mm; }
          body { visibility: hidden !important; background: #fff !important; margin: 0 !important; padding: 0 !important; }
          #bul-wrap, #bul-wrap * { visibility: visible !important; }
          #bul-wrap { position: absolute !important; top: 0 !important; left: 0 !important; width: 100% !important; }
          #bul-clarifie { width: 195mm !important; min-height: unset !important; padding: 6mm 7mm !important; margin: 0 auto !important; box-shadow: none !important; border: none !important; }
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          .nobreak, tr { page-break-inside: avoid !important; break-inside: avoid !important; }
        }
      `}</style>

      <div id="bul-wrap" data-bulletin-root="true" style={{ background: '#fff' }}>
      <div id="bul-clarifie" style={{
        fontFamily: SANS, fontSize: 10, lineHeight: 1.35, background: '#fff', color: K,
        width: '210mm', boxSizing: 'border-box', padding: '8mm 9mm', margin: '0 auto',
        boxShadow: '0 2px 16px rgba(0,0,0,0.10)',
      }}>

        {/* ══ TITRE ══════════════════════════════════════════════════ */}
        <div style={{ textAlign: 'center', fontSize: 17, fontWeight: 800, letterSpacing: .8, textTransform: 'uppercase', marginBottom: 8 }}>
          Bulletin de salaire clarifié
        </div>

        {/* ══ EN-TÊTE : entreprise (encadré) + méta période/contrat ═══ */}
        <table className="nobreak" style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 6 }}>
          <tbody>
            <tr>
              <td style={{ width: '46%', border: BDB, padding: '8px 10px', verticalAlign: 'top' }}>
                {tpl.style.showLogo !== false && co.logo && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={co.logo} alt="" crossOrigin="anonymous" style={{ height: 26, objectFit: 'contain', marginBottom: 4 }} />
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: 12 }}>
                  <span>{co.tradeName || co.legalName || '—'}</span>
                  <span>{co.legalForm || ''}</span>
                </div>
                {tpl.style.showAddress !== false && (
                  <div style={{ fontSize: 9, marginTop: 4 }}>
                    {co.address || '—'}<br/>
                    {[co.postalCode, co.city].filter(Boolean).join(' ')}
                  </div>
                )}
                {deptName !== '—' && (
                  <div style={{ fontSize: 8.5, marginTop: 6 }}>
                    Ets de rattachement&nbsp;&nbsp;<strong>{deptName}</strong>
                  </div>
                )}
                {tpl.style.showFiscalNumbers !== false && (
                  <div style={{ fontSize: 8.5, marginTop: 3 }}>
                    Siret&nbsp;&nbsp;<strong>{co.rccmNumber || '—'}</strong>
                    &nbsp;&nbsp;&nbsp;APE/NAF&nbsp;&nbsp;<strong>{co.nif || '—'}</strong>
                  </div>
                )}
              </td>
              <td style={{ width: '54%', padding: '8px 0 8px 16px', verticalAlign: 'top' }}>
                <div style={{ display: 'flex', gap: 6, fontSize: 9.5, marginBottom: 4 }}>
                  <span>Période du</span><strong>{periodStart}</strong><span>au</span><strong>{periodEnd}</strong>
                </div>
                <InfoLine label="Matricule"    value={e.employeeNumber || '—'} />
                <InfoLine label="N° contrat"   value={e.contractNumber || '—'} />
                <InfoLine label="Ancienneté"   value={seniority(e.hireDate)} />
                <InfoLine label="Entrée"       value={fmtDate(e.hireDate)} />
                <InfoLine label="N° Sécu"      value={e.cnssNumber || '—'} />
                <InfoLine label="Horaires"     value="151,67" />

                {/* ── Bloc salarié grisé ── */}
                <div style={{ background: '#eee', border: '0.5px solid #ccc', padding: '8px 10px', marginTop: 8 }}>
                  <div style={{ fontWeight: 800, fontSize: 11 }}>{fullName || '—'}</div>
                  {e.address && <div style={{ fontSize: 9, marginTop: 3 }}>{e.address}</div>}
                  {(e.postalCode || e.city) && (
                    <div style={{ fontSize: 9 }}>{[e.postalCode, e.city].filter(Boolean).join(' ')}</div>
                  )}
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        {/* ══ CONV. / EMPLOI / QUALIFICATION / SERVICE / CATÉGORIE ═══ */}
        <table className="nobreak" style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 6 }}>
          <tbody>
            <tr>
              <td style={{ width: '20%', fontSize: 8.5, color: '#555', padding: '1px 0' }}>Conv. collective</td>
              <td style={{ width: '30%', fontSize: 9, fontWeight: 700, padding: '1px 0' }}>{co.collectiveAgreement || '—'}</td>
              <td style={{ width: '20%', fontSize: 8.5, color: '#555', padding: '1px 0' }}>Qualification</td>
              <td style={{ width: '30%', fontSize: 9, fontWeight: 700, padding: '1px 0' }}>{cat}</td>
            </tr>
            <tr>
              <td style={{ fontSize: 8.5, color: '#555', padding: '1px 0' }}>Emploi</td>
              <td style={{ fontSize: 9, fontWeight: 700, padding: '1px 0' }}>{e.position || '—'}</td>
              <td style={{ fontSize: 8.5, color: '#555', padding: '1px 0' }}>Service</td>
              <td style={{ fontSize: 9, fontWeight: 700, padding: '1px 0', textTransform: 'uppercase' as const }}>{deptName}</td>
            </tr>
            <tr>
              <td style={{ fontSize: 8.5, color: '#555', padding: '1px 0' }}>Type de contrat</td>
              <td style={{ fontSize: 9, fontWeight: 700, padding: '1px 0' }}>{CONTRACT[e.contractType ?? ''] || e.contractType || '—'}</td>
              <td style={{ fontSize: 8.5, color: '#555', padding: '1px 0' }}>Sit. familiale</td>
              <td style={{ fontSize: 9, fontWeight: 700, padding: '1px 0' }}>{MARITAL[e.maritalStatus ?? ''] || '—'}</td>
            </tr>
            <tr>
              <td colSpan={4} style={{ fontSize: 8.5, color: '#555', padding: '6px 0 1px' }}>
                Paiement le <strong style={{ color: K }}>{fmtDate((payroll as any).paymentDate)}</strong>
                &nbsp;&nbsp;par&nbsp;&nbsp;<strong style={{ color: K }}>{PAYMENT[e.paymentMethod ?? ''] || 'Virement'}</strong>
              </td>
            </tr>
          </tbody>
        </table>

        {/* ══ TABLEAU PRINCIPAL — colonne Montant unique, signée ══════ */}
        <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed', border: BDB }}>
          <colgroup>
            <col style={{ width: '32%' }} /><col style={{ width: '13%' }} />
            <col style={{ width: '10%' }} /><col style={{ width: '15%' }} />
            <col style={{ width: '10%' }} /><col style={{ width: '20%' }} />
          </colgroup>
          <thead>
            <tr>
              <th rowSpan={2} style={th(TH_BG, { textAlign: 'left', paddingLeft: 5 })}>Désignation</th>
              <th rowSpan={2} style={th()}>Base ou nombre</th>
              <th colSpan={2} style={th('#c9c9c9')}>Gains et cotisations salariales</th>
              <th colSpan={2} style={th('#b6b6b6')}>Cotisations patronales</th>
            </tr>
            <tr>
              <th style={th('#c9c9c9', { fontSize: 7.5 })}>Taux</th>
              <th style={th('#c9c9c9', { fontSize: 7.5 })}>Montant</th>
              <th style={th('#b6b6b6', { fontSize: 7.5 })}>Taux</th>
              <th style={th('#b6b6b6', { fontSize: 7.5 })}>Montant</th>
            </tr>
          </thead>
          <tbody>

            {/* ── Gains ─────────────────────────────────────────────── */}
            {gains.map((item: any, idx: number) => (
              <DataRow key={item.id || item.code || idx} indent={false} bold={item.code === 'SAL_BASE'}
                label={item.label} base={itemBase(item)} tauxS={itemTaux(item)} mtS={fmt(item.amount)} />
            ))}
            {absDeductItem && (
              <DataRow indent={false} label={absDeductItem.label}
                base={absDeductItem.base ? Math.round(Number(absDeductItem.base)).toLocaleString('fr-FR') : ''}
                mtS={fmtNeg(absDeductItem.amount)} />
            )}
            <tr>
              <td colSpan={3} style={{ ...td({ fontWeight: 800, textTransform: 'uppercase' as const, borderTop: BDB, borderBottom: BDB }), borderLeft: BD }}>Total brut</td>
              <td style={{ ...tdR({ fontWeight: 800, borderTop: BDB, borderBottom: BDB }), borderLeft: BD }}>{fmtZ(totalBrut)}</td>
              <td style={{ ...td({ borderTop: BDB, borderBottom: BDB }), borderLeft: BD }} />
              <td style={{ ...td({ borderTop: BDB, borderBottom: BDB }), borderLeft: BD, borderRight: BD }} />
            </tr>

            {/* ── Sécurité sociale (CNSS) ─────────────────────────────── */}
            <SectionHeader>Sécurité sociale (CNSS)</SectionHeader>
            <DataRow label="CNSS salariale (plafond 1 200 000)" base={fmtZ(Math.min(totalBrut,1_200_000))} tauxS="4,00%" mtS={fmtNeg(cnssSal)} />
            {cnssEmpPension  > 0 && <DataRow label="CNSS Pension"  base={fmtZ(Math.min(totalBrut,1_200_000))} tauxP="8,00%"  mtP={fmtNeg(cnssEmpPension)} />}
            {cnssEmpFamily   > 0 && <DataRow label="CNSS Famille"  base={fmtZ(Math.min(totalBrut,600_000))}   tauxP="10,03%" mtP={fmtNeg(cnssEmpFamily)} />}
            {cnssEmpAccident > 0 && <DataRow label="CNSS Accident du travail" base={fmtZ(Math.min(totalBrut,600_000))} tauxP="2,25%" mtP={fmtNeg(cnssEmpAccident)} />}

            {/* ── Impôts sur salaires (ITS / TUS) ─────────────────────── */}
            {(itsAmount > 0 || tusDgi > 0 || tusCnss > 0) && <>
              <SectionHeader>Impôts sur salaires (ITS / TUS)</SectionHeader>
              {itsAmount > 0 && <DataRow label="ITS mois" base={fmt(totalBrut - cnssSal)} mtS={fmtNeg(itsAmount)} />}
              {tusCnss   > 0 && <DataRow label="Taxe unique sur salaire (CNSS)" base={fmtZ(totalBrut)} tauxP="5,475%" mtP={fmtNeg(tusCnss)} />}
              {tusDgi    > 0 && <DataRow label="Taxe unique sur salaire (DGI)"  base={fmtZ(totalBrut)} tauxP="2,025%" mtP={fmtNeg(tusDgi)} />}
            </>}

            {/* ── Autres cotisations et taxes ─────────────────────────── */}
            {(ctaxEmp.length > 0 || ctaxPat.length > 0 || loanItems.length > 0 || manualDeductions.length > 0) && <>
              <SectionHeader>Autres cotisations et retenues</SectionHeader>
              {ctaxEmp.map((item: any) => (
                <DataRow key={item.id || item.code} label={item.label} base={itemBase(item)} tauxS={itemTaux(item)} mtS={fmtNeg(item.amount)} />
              ))}
              {ctaxPat.map((item: any) => (
                <DataRow key={item.id || item.code} label={item.label.replace(' (part patronale)','')} base={itemBase(item)} tauxP={itemTaux(item)} mtP={fmtNeg(item.amount)} />
              ))}
              {loanItems.map((item: any) => (
                <DataRow key={item.id || item.code} label={item.label} base={itemBase(item)} tauxS={itemTaux(item)} mtS={fmtNeg(item.amount)} />
              ))}
              {manualDeductions.map((item: any, idx: number) => (
                <DataRow key={item.id || item.code || idx} label={item.label} mtS={fmtNeg(item.amount)} />
              ))}
            </>}

            {/* ── Indemnités hors cotisation ───────────────────────────── */}
            {indemItems.length > 0 && <>
              <SectionHeader>Indemnités et avantages</SectionHeader>
              {indemItems.map((item: any) => (
                <DataRow key={item.id || item.code} indent={false} label={item.label} base={itemBase(item)} tauxS={itemTaux(item)} mtS={fmt(item.amount)} />
              ))}
            </>}

            {/* ── Salaire net ──────────────────────────────────────────── */}
            <tr>
              <td colSpan={3} style={{ ...td({ fontWeight: 900, fontSize: 12, textTransform: 'uppercase' as const, borderTop: BDB, borderBottom: BDB }), borderLeft: BD, background: '#eee' }}>Salaire net</td>
              <td style={{ ...tdR({ fontWeight: 900, fontSize: 13, borderTop: BDB, borderBottom: BDB }), borderLeft: BD, background: '#eee' }}>{fmtZ(netSalary)}</td>
              <td style={{ ...td({ borderTop: BDB, borderBottom: BDB }), borderLeft: BD, background: '#eee' }} />
              <td style={{ ...td({ borderTop: BDB, borderBottom: BDB }), borderLeft: BD, borderRight: BD, background: '#eee' }} />
            </tr>
          </tbody>
        </table>

        {/* ══ CUMULS MOIS / ANNÉE + NET À PAYER ═══════════════════════ */}
        <table className="nobreak" style={{ width: '100%', borderCollapse: 'collapse', marginTop: 8, border: BDB }}>
          <thead>
            <tr>
              <th style={th(TH_BG, { width: 60 })}></th>
              <th style={th(TH_BG)}>Salaire brut</th>
              <th style={th(TH_BG)}>Chg. salariales</th>
              <th style={th(TH_BG)}>Chg. patronales</th>
              <th style={th(TH_BG)}>Net imposable</th>
              <th style={th(TH_BG)}>Heures</th>
              <th rowSpan={3} style={{ ...th('#eee', { width: 130 }), textTransform: 'none' as const }}>
                <div style={{ fontSize: 8, letterSpacing: 1 }}>NET À PAYER</div>
                <div style={{ fontFamily: FONT, fontSize: 17, fontWeight: 900, marginTop: 3 }}>{fmtZ(netSalary)}</div>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ ...tdC({ fontWeight: 800, borderLeft: BD }) }}>Mois</td>
              <td style={{ ...tdR({ borderLeft: BD }) }}>{fmtZ(totalBrut)}</td>
              <td style={{ ...tdR({ borderLeft: BD }) }}>{fmtD(cnssSal + itsAmount)}</td>
              <td style={{ ...tdR({ borderLeft: BD }) }}>{fmtD(totalPat)}</td>
              <td style={{ ...tdR({ borderLeft: BD }) }}>{fmtZ(totalBrut - cnssSal)}</td>
              <td style={{ ...tdR({ borderLeft: BD, borderRight: BD }) }}>{fmt((payroll.workedDays ?? 0) * 8) || '—'}</td>
            </tr>
            <tr>
              <td style={{ ...tdC({ fontWeight: 800, borderLeft: BD, borderTop: BD }) }}>Année</td>
              <td style={{ ...tdR({ borderLeft: BD, borderTop: BD }) }}>{fmtD(ytdGross)}</td>
              <td style={{ ...tdR({ borderLeft: BD, borderTop: BD }) }}>{fmtD(ytdCnss)}</td>
              <td style={{ ...tdR({ borderLeft: BD, borderTop: BD }) }}>{fmtD(ytdCnssEmp)}</td>
              <td style={{ ...tdR({ borderLeft: BD, borderTop: BD }) }}>{fmtD(ytdNetImp)}</td>
              <td style={{ ...tdR({ borderLeft: BD, borderRight: BD, borderTop: BD }) }}>—</td>
            </tr>
          </tbody>
        </table>

        {/* ══ CONGÉS ANNUELS — Acquis / Pris / Solde ═══════════════════ */}
        <table className="nobreak" style={{ width: '100%', borderCollapse: 'collapse', marginTop: 4, border: BDB, borderTop: 'none' }}>
          <thead>
            <tr>
              <th style={th('#eee', { width: 60 })}>Congés</th>
              <th style={th('#eee')}>Acquis</th>
              <th style={th('#eee')}>Pris</th>
              <th style={th('#eee')}>Solde</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ ...tdC({ fontWeight: 800, borderLeft: BD }) }}>Jours</td>
              <td style={{ ...tdR({ borderLeft: BD }) }}>{congesDroits > 0 ? fmtD(congesDroits) : '—'}</td>
              <td style={{ ...tdR({ borderLeft: BD }) }}>{congesPris > 0 ? fmtD(congesPris) : '—'}</td>
              <td style={{ ...tdR({ borderLeft: BD, borderRight: BD }) }}>{congesSolde > 0 ? fmtD(congesSolde) : '—'}</td>
            </tr>
          </tbody>
        </table>

        {/* ══ SIGNATURES ══════════════════════════════════════════════ */}
        <table className="nobreak" style={{ width: '100%', borderCollapse: 'collapse', border: BDB, borderTop: 'none', marginTop: 0 }}>
          <tbody>
            <tr>
              <td style={{ padding: '6px 10px', borderRight: BD, verticalAlign: 'top', height: 44 }}>
                <div style={{ fontSize: 8, fontWeight: 700, textTransform: 'uppercase' as const }}>Signature de l&apos;Employé(e)</div>
              </td>
              <td style={{ padding: '6px 10px', verticalAlign: 'top', textAlign: 'center', height: 44 }}>
                <div style={{ fontSize: 8, fontWeight: 700, textTransform: 'uppercase' as const }}>Direction Générale</div>
              </td>
            </tr>
          </tbody>
        </table>

        {tpl.style.footerMessage && (
          <div style={{ textAlign: 'center', fontSize: 8, fontStyle: 'italic', marginTop: 4 }}>{tpl.style.footerMessage}</div>
        )}

        {/* ══ MENTIONS LÉGALES ══════════════════════════════════════════ */}
        <div style={{ fontSize: 7.5, color: '#333', marginTop: 6, borderTop: '0.5px solid #999', paddingTop: 4 }}>
          Pour vous aider à faire valoir vos droits, conservez ce bulletin de paie sans limitation de durée.<br/>
          <span style={{ display: 'flex', justifyContent: 'space-between', marginTop: 2 }}>
            <span>CNSS sal. 4% · ITS barème 2026 · SMIG 70 400 FCFA</span>
            <strong style={{ color: K }}>KONZARH</strong>
          </span>
        </div>

      </div>
      </div>
    </>
  );
}