'use client';

// ============================================================================
// components/BulletinRendererClassique/index.tsx  (v2)
//
// Gabarit "Bulletin de paie classique numéroté" — reproduit la mise en page
// du modèle papier fourni par le client (bulletin "Informatique & Industrie").
//
// ✅ v2 :
//    - Calendrier journalier (Date / Hres trav. / Congés payés / Autres
//      absences) SUPPRIMÉ à la demande du client — pas de source de données
//      par-jour dans le modèle actuel, et il grignotait la largeur du
//      tableau principal.
//    - Même architecture "canevas A4 fixe" que BulletinRendererDefault :
//      page de taille FIXE (210mm × 297mm, overflow: hidden, flex column),
//      tableau principal dans un conteneur flex:1 / height:100%. Les lignes
//      et colonnes sont pré-dimensionnées, le contenu vient s'y placer —
//      plus de colonnes qui débordent ou se coupent.
// ============================================================================

import React, { useMemo } from 'react';
import type { BulletinPayroll, BulletinTemplateConfig, PayrollItem } from '@/types/bulletin-template';
import { classifyItems } from '@/lib/bulletin-items-classifier';
import { getBaseTemplate } from '@/lib/bulletin-templates';

export interface BulletinRendererClassiqueProps {
  payroll:      BulletinPayroll;
  template?:    BulletinTemplateConfig;
  previewMode?: boolean;
}

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

const nv    = (v: any): number => { const x = Number(v); return isFinite(x) ? x : 0; };
const fmt   = (v: any): string  => { const x = Math.round(nv(v)); return x === 0 ? '' : x.toLocaleString('fr-FR'); };
const fmtZ  = (v: any): string  => Math.round(nv(v)).toLocaleString('fr-FR');
const fmtD  = (v: any): string  => { const x = Math.round(nv(v)); return x === 0 ? '—' : x.toLocaleString('fr-FR'); };
const fmtDate = (d?: string)    => d ? new Date(d).toLocaleDateString('fr-FR') : '—';

function seniority(hireDate?: string, asOf?: Date): string {
  if (!hireDate) return '—';
  const hire = new Date(hireDate), now = asOf ?? new Date();
  let y = now.getFullYear() - hire.getFullYear();
  let m = now.getMonth()    - hire.getMonth();
  if (m < 0) { y--; m += 12; }
  return `${y} an${y !== 1 ? 's' : ''} et ${String(m).padStart(2,'0')} mois`;
}
function formatCategorie(code: string | null | undefined): string {
  if (!code) return '—';
  const m = code.match(/^[A-Z]+(\d+)-E(\d+)$/i);
  if (m) return `Cat.${m[1]} Éch.${m[2]}`;
  const m2 = code.match(/^E(\d+)-(\d+)$/i);
  if (m2) return `Cat.${m2[1]} Éch.${m2[2]}`;
  return code;
}
// ✅ Raccourcit les libellés longs (même logique que le Default)
function cleanLabel(label: string): string {
  if (!label) return label;
  if (/taxe.{0,10}occupation.{0,10}locaux/i.test(label)) return 'T.O.L.';
  return label
    .replace(/\s*\(\d+h\)\s*—[^%]*/i, '')
    .replace(/\s*—\s*(5\s*premières?|heures?\s+suivantes?|nuit[^)]*|dimanche[^)]*)[^)]*$/i, '')
    .replace(/\s*\(\d+h\)/i, '')
    .replace(/\s*—\s*$/, '')
    .replace(' (part patronale)', '')
    .trim();
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

// ── Tokens visuels — canevas A4 fixe, même logique que le Default ──────────
const SANS  = 'Arial,Helvetica,sans-serif';
const FONT  = '"Courier New",Courier,monospace';
const BD    = '0.5px solid #000';
const BDB   = '1px solid #000';
const TH_BG = '#d8d8d8';
const K     = '#000';

const ROW_H  = 16;
const HEAD_H = 17;
const FS     = 8.8;

const th = (bg = TH_BG, o?: React.CSSProperties): React.CSSProperties => ({
  border: BD, padding: '1px 3px', fontSize: 7.5, fontWeight: 700,
  textAlign: 'center', background: bg, fontFamily: SANS,
  verticalAlign: 'middle', color: K, height: HEAD_H, lineHeight: `${HEAD_H}px`,
  overflow: 'hidden', ...o,
});
const td = (o?: React.CSSProperties): React.CSSProperties => ({
  borderLeft: BD, borderRight: 'none', borderTop: 'none', borderBottom: 'none',
  padding: '0 4px', height: ROW_H, lineHeight: `${ROW_H}px`, fontSize: FS,
  verticalAlign: 'middle', color: K, fontFamily: SANS, background: '#fff',
  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', ...o,
});
const tdR = (o?: React.CSSProperties) => td({ textAlign: 'right', fontFamily: FONT, ...o });
const tdC = (o?: React.CSSProperties) => td({ textAlign: 'center', ...o });

const Row = ({ n, label, nombre = '', base = '', tauxS = '', gain = '', ret = '', tauxP = '', retP = '', bold = false }:
  { n: number | string; label: string; nombre?: string; base?: string; tauxS?: string; gain?: string; ret?: string; tauxP?: string; retP?: string; bold?: boolean }) => (
  <tr style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}>
    <td style={tdC({ fontFamily: FONT, fontSize: 7.5 })}>{n}</td>
    <td style={td({ paddingLeft: 5, fontWeight: bold ? 700 : 400 })}>{cleanLabel(label)}</td>
    <td style={tdR()}>{nombre}</td>
    <td style={tdR()}>{base}</td>
    <td style={tdC({ fontSize: 7 })}>{tauxS}</td>
    <td style={tdR({ fontWeight: gain ? 600 : 400 })}>{gain}</td>
    <td style={tdR({ fontWeight: ret ? 600 : 400 })}>{ret}</td>
    <td style={tdC({ fontSize: 7 })}>{tauxP}</td>
    <td style={tdR({ fontWeight: retP ? 600 : 400, borderRight: BD })}>{retP}</td>
  </tr>
);

const TotalRow = ({ label, gain = '', ret = '', retP = '' }: { label: string; gain?: string; ret?: string; retP?: string }) => (
  <tr style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}>
    <td colSpan={4} style={{ ...td({ fontWeight: 800, fontSize: 9, textAlign: 'right', borderTop: BDB, borderBottom: BDB }) }}>{label}</td>
    <td style={{ ...td({ borderTop: BDB, borderBottom: BDB }) }} />
    <td style={{ ...tdR({ fontWeight: 800, fontSize: 9.5, borderTop: BDB, borderBottom: BDB }) }}>{gain}</td>
    <td style={{ ...tdR({ fontWeight: 800, fontSize: 9.5, borderTop: BDB, borderBottom: BDB }) }}>{ret}</td>
    <td style={{ ...td({ borderTop: BDB, borderBottom: BDB }) }} />
    <td style={{ ...tdR({ fontWeight: 800, fontSize: 9.5, borderTop: BDB, borderBottom: BDB, borderRight: BD }) }}>{retP}</td>
  </tr>
);

const InfoRow = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div style={{ display: 'flex', gap: 4, fontSize: 7.5, marginBottom: 1 }}>
    <span style={{ color: '#555', minWidth: 70, flexShrink: 0 }}>{label}</span>
    <strong style={{ color: K, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{value}</strong>
  </div>
);

export default function BulletinRendererClassique({ payroll, template, previewMode }: BulletinRendererClassiqueProps) {
  const tpl = template ?? getBaseTemplate('classique');
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
  const gains = gainItems.filter((i: any) => !['ABS_DEDUCT','ABS_CONGE'].includes(i.code));

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
  const totalCotisSal = cnssSal + itsAmount
    + ctaxEmp.reduce((s: number, i: any) => s + nv(i.amount), 0)
    + loanItems.reduce((s: number, i: any) => s + nv(i.amount), 0)
    + manualDeductions.reduce((s: number, i: any) => s + nv(i.amount), 0)
    + (absDeductItem ? nv(absDeductItem.amount) : 0);

  const congesDroits = nv(ytd.droitsConge ?? (payroll as any).congesDroits ?? 0);
  const congesPris   = nv(ytd.priseConge  ?? (payroll as any).congesPris   ?? 0);
  const _soldeRaw    = nv(ytd.soldeConge  ?? (payroll as any).congesSolde  ?? 0);
  const congesSolde  = _soldeRaw > 0 ? _soldeRaw : Math.max(0, congesDroits - congesPris);

  const ytdGross   = nv(ytd.grossSalary);
  const ytdCnss    = nv(ytd.cnssSalarial);
  const ytdCnssEmp = nv(ytd.cnssEmployer);
  const ytdNetImp  = nv(ytd.netImposable) || (ytdGross - ytdCnss);

  const periodStart = `01/${String(payroll.month ?? 1).padStart(2,'0')}/${payroll.year}`;
  const periodEnd   = `${new Date(payroll.year, payroll.month, 0).getDate()}/${String(payroll.month ?? 1).padStart(2,'0')}/${payroll.year}`;
  const fullName    = [e.civility === 'FEMALE' ? 'Mme' : 'M', e.firstName, e.lastName?.toUpperCase()].filter(Boolean).join(' ');
  const cat = formatCategorie(e.professionalCategory);
  const rawDept  = e.department?.name ?? '';
  const deptName = /no.dep/i.test(rawDept) || rawDept.trim() === '' ? '—' : rawDept;

  let rub = 10;

  return (
    <>
      <style>{`
        @media print {
          @page { size: A4 portrait; margin: 8mm 6mm; }
          body { visibility: hidden !important; background: #fff !important; margin: 0 !important; padding: 0 !important; }
          #bul-wrap, #bul-wrap * { visibility: visible !important; }
          #bul-wrap { position: absolute !important; top: 0 !important; left: 0 !important; width: 100% !important; }
          #bul-classique {
            width: 195mm !important; height: 277mm !important; min-height: unset !important;
            padding: 6mm 7mm !important; margin: 0 auto !important;
            box-shadow: none !important; border: none !important; overflow: hidden !important;
          }
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          .nobreak, tr { page-break-inside: avoid !important; break-inside: avoid !important; }
        }
        #main-grid-classique {
          width: 100%; table-layout: fixed; border-collapse: collapse;
          border: ${BD}; height: 100%;
        }
        #main-grid-classique td, #main-grid-classique th { color: #000 !important; }
      `}</style>

      <div id="bul-wrap" data-bulletin-root="true" style={{ background: '#fff' }}>
      <div id="bul-classique" style={{
        fontFamily: SANS, fontSize: 8.8, lineHeight: 1.25, background: '#fff', color: K,
        width: '210mm', height: '297mm', boxSizing: 'border-box', padding: '6mm 7mm',
        margin: '0 auto', boxShadow: '0 2px 16px rgba(0,0,0,0.10)',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
      }}>

        {/* ══ EN-TÊTE : entreprise + titre/période ═════════════════════ */}
        <table className="nobreak" style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 4, flexShrink: 0 }}>
          <tbody>
            <tr>
              <td style={{ width: '48%', border: BDB, padding: '6px 8px', verticalAlign: 'top' }}>
                {tpl.style.showLogo !== false && co.logo && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={co.logo} alt="" crossOrigin="anonymous" style={{ height: 20, objectFit: 'contain', marginBottom: 3 }} />
                )}
                <div style={{ fontWeight: 800, fontSize: 10, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{co.tradeName || co.legalName || '—'}</div>
                {tpl.style.showAddress !== false && (
                  <div style={{ fontSize: 8, marginTop: 3, overflow: 'hidden' }}>
                    {co.address || '—'}<br/>{[co.postalCode, co.city].filter(Boolean).join(' ')}
                  </div>
                )}
                {tpl.style.showFiscalNumbers !== false && (
                  <div style={{ fontSize: 7.5, marginTop: 4, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                    SIRET&nbsp;<strong>{co.rccmNumber || '—'}</strong>&nbsp;&nbsp;APE/NAF&nbsp;<strong>{co.nif || '—'}</strong>
                  </div>
                )}
                <div style={{ fontSize: 7.5, marginTop: 2, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                  Conv. coll.&nbsp;<strong>{co.collectiveAgreement || '—'}</strong>
                </div>
              </td>
              <td style={{ width: '52%', padding: '3px 0 3px 14px', verticalAlign: 'top' }}>
                <div style={{ textAlign: 'right', fontSize: 17, fontWeight: 800, letterSpacing: .4, textTransform: 'uppercase' as const }}>
                  Bulletin de paie
                </div>
                <div style={{ textAlign: 'right', fontSize: 8.5, marginTop: 5 }}>
                  Période du <strong>{periodStart}</strong> au <strong>{periodEnd}</strong>
                </div>
                <div style={{ textAlign: 'right', fontSize: 8.5, marginTop: 2 }}>
                  Paiement le <strong>{fmtDate((payroll as any).paymentDate)}</strong> par <strong>{PAYMENT[e.paymentMethod ?? ''] || 'Virement'}</strong>
                </div>

                <div style={{ border: BDB, padding: '6px 8px', marginTop: 8, overflow: 'hidden' }}>
                  <div style={{ fontWeight: 800, fontSize: 10, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{fullName || '—'}</div>
                  {e.address && <div style={{ fontSize: 8, marginTop: 2, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{e.address}</div>}
                  {(e.postalCode || e.city) && <div style={{ fontSize: 8, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{[e.postalCode, e.city].filter(Boolean).join(' ')}</div>}
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        {/* ══ INFOS SALARIÉ ═════════════════════════════════════════════ */}
        <table className="nobreak" style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 4, tableLayout: 'fixed', flexShrink: 0 }}>
          <tbody>
            <tr>
              <td style={{ width: '25%', padding: '1px 4px 1px 0' }}><InfoRow label="N° Séc.Soc." value={e.cnssNumber || '—'} /></td>
              <td style={{ width: '25%', padding: '1px 4px 1px 0' }}><InfoRow label="Matricule"   value={e.employeeNumber || '—'} /></td>
              <td style={{ width: '25%', padding: '1px 4px 1px 0' }}><InfoRow label="Ancienneté"  value={seniority(e.hireDate, new Date(payroll.year, payroll.month, 0))} /></td>
              <td style={{ width: '25%', padding: '1px 0' }}><InfoRow label="Contrat"     value={CONTRACT[e.contractType ?? ''] || e.contractType || '—'} /></td>
            </tr>
            <tr>
              <td style={{ padding: '1px 4px 1px 0' }}><InfoRow label="Emploi"       value={e.position || '—'} /></td>
              <td style={{ padding: '1px 4px 1px 0' }}><InfoRow label="Qualification" value={cat} /></td>
              <td style={{ padding: '1px 4px 1px 0' }}><InfoRow label="Département"  value={deptName} /></td>
              <td style={{ padding: '1px 0' }}><InfoRow label="Horaire"      value="151,67 h" /></td>
            </tr>
          </tbody>
        </table>

        {/* ══ TABLEAU PRINCIPAL — canevas fixe, remplit l'espace restant ═ */}
        <div style={{ flex: 1, minHeight: 0, position: 'relative' }}>
          <table id="main-grid-classique">
            <colgroup>
              <col style={{ width: '4%'  }} /><col style={{ width: '27%' }} />
              <col style={{ width: '9%'  }} /><col style={{ width: '9%'  }} />
              <col style={{ width: '6%'  }} /><col style={{ width: '13%' }} />
              <col style={{ width: '13%' }} /><col style={{ width: '6%'  }} />
              <col style={{ width: '13%' }} />
            </colgroup>
            <thead>
              <tr>
                <th rowSpan={2} style={th()}>N°</th>
                <th rowSpan={2} style={th(TH_BG, { textAlign: 'left', paddingLeft: 5 })}>Désignation</th>
                <th rowSpan={2} style={th()}>Nombre</th>
                <th rowSpan={2} style={th()}>Base</th>
                <th colSpan={3} style={th('#c4c4c4')}>Part salariale</th>
                <th colSpan={2} style={th('#b0b0b0')}>Part patronale</th>
              </tr>
              <tr>
                <th style={th('#c4c4c4', { fontSize: 6.5 })}>Taux</th>
                <th style={th('#c4c4c4', { fontSize: 6.5 })}>Gain</th>
                <th style={th('#c4c4c4', { fontSize: 6.5 })}>Retenue</th>
                <th style={th('#b0b0b0', { fontSize: 6.5 })}>Taux</th>
                <th style={th('#b0b0b0', { fontSize: 6.5 })}>Retenue</th>
              </tr>
            </thead>
            <tbody>
              {gains.map((item: any, idx: number) => { rub++; return (
                <Row key={item.id || item.code || idx} n={rub} label={item.label}
                  base={itemBase(item)} tauxS={itemTaux(item)} gain={fmt(item.amount)} bold={item.code === 'SAL_BASE'} />
              ); })}
              {absDeductItem && (()=>{ rub++; return (
                <Row n={rub} label={absDeductItem.label}
                  base={absDeductItem.base ? Math.round(Number(absDeductItem.base)).toLocaleString('fr-FR') : ''}
                  ret={fmt(absDeductItem.amount)} />
              ); })()}

              <TotalRow label="Total Brut" gain={fmtZ(totalBrut)} />

              <Row n={2100} label="CNSS salariale (plafond 1 200 000)" base={fmtZ(Math.min(totalBrut,1_200_000))} tauxS="4,00" ret={fmt(cnssSal)} />
              {cnssEmpPension  > 0 && <Row n={2101} label="CNSS Pension"  base={fmtZ(Math.min(totalBrut,1_200_000))} tauxP="8,00"  retP={fmt(cnssEmpPension)} />}
              {cnssEmpFamily   > 0 && <Row n={2102} label="CNSS Famille"  base={fmtZ(Math.min(totalBrut,600_000))}   tauxP="10,03" retP={fmt(cnssEmpFamily)} />}
              {cnssEmpAccident > 0 && <Row n={2103} label="CNSS Accident du travail" base={fmtZ(Math.min(totalBrut,600_000))} tauxP="2,25" retP={fmt(cnssEmpAccident)} />}
              {tusCnss > 0 && <Row n={2104} label="Taxe unique/salaire (CNSS)" base={fmtZ(totalBrut)} tauxP="5,475" retP={fmt(tusCnss)} />}
              {tusDgi  > 0 && <Row n={2105} label="Taxe unique/salaire (DGI)"  base={fmtZ(totalBrut)} tauxP="2,025" retP={fmt(tusDgi)} />}

              {itsAmount > 0 && <Row n={4520} label="ITS mois" base={fmt(totalBrut - cnssSal)} ret={fmt(itsAmount)} />}

              {(()=>{
                let r = 5700;
                return ctaxEmp.map((item: any) => { r++; return (
                  <Row key={item.id || item.code} n={r} label={item.label} base={itemBase(item)} tauxS={itemTaux(item)} ret={fmt(item.amount)} />
                ); });
              })()}
              {(()=>{
                let r = 5800;
                return ctaxPat.map((item: any) => { r++; return (
                  <Row key={item.id || item.code} n={r} label={item.label} tauxP={itemTaux(item)} retP={fmt(item.amount)} />
                ); });
              })()}
              {(()=>{
                let r = 6600;
                return loanItems.map((item: any) => { r++; return (
                  <Row key={item.id || item.code} n={r} label={item.label} base={itemBase(item)} tauxS={itemTaux(item)} ret={fmt(item.amount)} />
                ); });
              })()}
              {manualDeductions.map((item: any, idx: number) => (
                <Row key={item.id || item.code || idx} n={6800 + idx} label={item.label} ret={fmt(item.amount)} />
              ))}
              {indemItems.map((item: any) => { rub += 10; return (
                <Row key={item.id || item.code} n={rub} label={item.label} base={itemBase(item)} tauxS={itemTaux(item)} gain={fmt(item.amount)} />
              ); })}

              <TotalRow label="Total Cotisations" ret={fmtZ(totalCotisSal)} retP={fmtZ(totalPat)} />
            </tbody>
          </table>
        </div>

        {/* ══ CUMULS PÉRIODE / ANNÉE + NET À PAYER ═════════════════════ */}
        <table className="nobreak" style={{ width: '100%', borderCollapse: 'collapse', marginTop: 4, flexShrink: 0 }}>
          <tbody>
            <tr>
              <td style={{ width: '78%', verticalAlign: 'top' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', border: BDB, tableLayout: 'fixed' }}>
                  <thead>
                    <tr>
                      <th style={th(TH_BG, { width: '9%' })}></th>
                      <th style={th(TH_BG)}>Salaire brut</th>
                      <th style={th(TH_BG)}>Charges sal.</th>
                      <th style={th(TH_BG)}>Charges pat.</th>
                      <th style={th(TH_BG)}>Net imposable</th>
                      <th style={th(TH_BG)}>Heures trav.</th>
                      <th style={th(TH_BG)}>Heures suppl.</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style={tdC({ fontWeight: 800 })}>Période</td>
                      <td style={tdR()}>{fmtZ(totalBrut)}</td>
                      <td style={tdR()}>{fmtD(cnssSal + itsAmount)}</td>
                      <td style={tdR()}>{fmtD(totalPat)}</td>
                      <td style={tdR()}>{fmtZ(totalBrut - cnssSal)}</td>
                      <td style={tdR()}>{fmt((payroll.workedDays ?? 0) * 8) || '—'}</td>
                      <td style={{ ...tdR({ borderRight: BD }) }}>{fmt(nv(payroll.overtimeHours10) + nv(payroll.overtimeHours25)) || '—'}</td>
                    </tr>
                    <tr>
                      <td style={{ ...tdC({ fontWeight: 800, borderTop: BD }) }}>Année</td>
                      <td style={{ ...tdR({ borderTop: BD }) }}>{fmtD(ytdGross)}</td>
                      <td style={{ ...tdR({ borderTop: BD }) }}>{fmtD(ytdCnss)}</td>
                      <td style={{ ...tdR({ borderTop: BD }) }}>{fmtD(ytdCnssEmp)}</td>
                      <td style={{ ...tdR({ borderTop: BD }) }}>{fmtD(ytdNetImp)}</td>
                      <td style={{ ...tdR({ borderTop: BD }) }}>{fmtD(nv(ytd.workedDays) * 8)}</td>
                      <td style={{ ...tdR({ borderRight: BD, borderTop: BD }) }}>—</td>
                    </tr>
                  </tbody>
                </table>

                <table style={{ width: '100%', borderCollapse: 'collapse', border: BDB, borderTop: 'none', tableLayout: 'fixed' }}>
                  <thead>
                    <tr>
                      <th style={th('#eee', { width: '20%', textAlign: 'left', paddingLeft: 5 })}>Compteurs</th>
                      <th style={th('#eee')}>Pris</th>
                      <th style={th('#eee')}>Restant</th>
                      <th style={th('#eee')}>Acquis</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style={td({ paddingLeft: 5 })}>Congés</td>
                      <td style={tdR()}>{congesPris > 0 ? fmtD(congesPris) : '0,0000'}</td>
                      <td style={tdR()}>{congesSolde > 0 ? fmtD(congesSolde) : '0,0000'}</td>
                      <td style={{ ...tdR({ borderRight: BD }) }}>{congesDroits > 0 ? fmtD(congesDroits) : '0,0000'}</td>
                    </tr>
                    <tr>
                      <td style={{ ...td({ borderTop: BD, paddingLeft: 5 }) }}>Repos compensateur</td>
                      <td style={{ ...tdR({ borderTop: BD }) }}>0,0000</td>
                      <td style={{ ...tdR({ borderTop: BD }) }}>0,0000</td>
                      <td style={{ ...tdR({ borderTop: BD, borderRight: BD }) }}>0,0000</td>
                    </tr>
                  </tbody>
                </table>
              </td>
              <td style={{ width: '22%', verticalAlign: 'top', paddingLeft: 6 }}>
                <div style={{ border: BDB, height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '8px 5px' }}>
                  <div style={{ fontSize: 8, fontWeight: 800, textTransform: 'uppercase' as const, letterSpacing: 1, whiteSpace: 'nowrap' }}>Net à payer</div>
                  <div style={{ fontFamily: FONT, fontSize: 16, fontWeight: 900, marginTop: 5 }}>{fmtZ(netSalary)}</div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        {tpl.style.footerMessage && (
          <div style={{ textAlign: 'center', fontSize: 7.5, fontStyle: 'italic', marginTop: 3, flexShrink: 0 }}>{tpl.style.footerMessage}</div>
        )}

        <div style={{ fontSize: 6.8, color: '#333', marginTop: 4, borderTop: '0.5px solid #999', paddingTop: 3, display: 'flex', justifyContent: 'space-between', flexShrink: 0 }}>
          <span>Pour vous aider à faire valoir vos droits, conservez ce bulletin sans limitation de durée · CNSS 4% sal. · ITS barème 2026 · SMIG 70 400 FCFA</span>
          <strong style={{ color: K }}>KONZARH</strong>
        </div>

      </div>
      </div>
    </>
  );
}