'use client';
// ============================================================================
// BulletinRenderer — Dispatcher vers Corporate / Admin / Default
// ============================================================================

import React, { useMemo } from 'react';
import type { BulletinPayroll, BulletinTemplateConfig, PayrollItem } from '@/types/bulletin-template';
import { getBaseTemplate } from '@/lib/bulletin-templates';
import { classifyItems } from '@/lib/bulletin-items-classifier';
import BulletinRendererCorporate from '@/components/BulletinRendererCorporate';
import BulletinRendererAdmin     from '@/components/BulletinRendererAdmin';

export interface BulletinRendererProps {
  payroll:      BulletinPayroll;
  template?:    BulletinTemplateConfig;
  previewMode?: boolean;
}

export default function BulletinRenderer(props: BulletinRendererProps) {
  const templateId = (props.template ?? getBaseTemplate('default')).templateId;
  if (templateId === 'corporate') return <BulletinRendererCorporate {...props} />;
  if (templateId === 'admin')     return <BulletinRendererAdmin     {...props} />;
  return <BulletinRendererDefault {...props} />;
}

// ============================================================================
// BulletinRendererDefault — Modèle classique Congo (photo bulletin référence)
// A4 Portrait — N&B safe — Fidèle au bulletin papier
// ============================================================================

export interface BulletinRendererDefaultProps {
  payroll:      BulletinPayroll;
  template?:    BulletinTemplateConfig;
  previewMode?: boolean;
}

// ── Constantes ───────────────────────────────────────────────────────────────
const MONTHS = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet',
                'Août','Septembre','Octobre','Novembre','Décembre'];

const MARITAL: Record<string,string> = {
  SINGLE:'Célibataire', MARRIED:'Marié(e)', DIVORCED:'Divorcé(e)',
  WIDOWED:'Veuf/Veuve', COHABITING:'Union libre',
};
const CONTRACT: Record<string,string> = {
  CDI:'CDI Temps Plein', CDD:'CDD', STAGE:'Stage',
  CONSULTANT:'Consultant', INTERIM:'Intérimaire', FREELANCE:'Freelance',
};
const PAYMENT: Record<string,string> = {
  BANK_TRANSFER:'Virement', CASH:'Espèces',
  MOBILE_MONEY:'Mobile Money', CHECK:'Chèque',
};

// ── Utilitaires ───────────────────────────────────────────────────────────────
const nv = (v: any): number => { const x = Number(v); return isFinite(x) ? x : 0; };

const fmt = (v: any): string => {
  const x = Math.round(nv(v));
  if (x === 0) return '';
  return x.toLocaleString('fr-FR');
};
const fmtZ = (v: any): string => {
  const x = Math.round(nv(v));
  return x.toLocaleString('fr-FR');
};
const fmtDash = (v: any): string => {
  const x = Math.round(nv(v));
  if (x === 0) return '—';
  return x.toLocaleString('fr-FR');
};
const fmtDate = (d?: string) => d ? new Date(d).toLocaleDateString('fr-FR') : '—';

function seniority(hireDate?: string): string {
  if (!hireDate) return '—';
  const h = new Date(hireDate), now = new Date();
  let y = now.getFullYear() - h.getFullYear();
  let m = now.getMonth() - h.getMonth();
  if (m < 0) { y--; m += 12; }
  return `${y} an${y !== 1 ? 's' : ''} et ${String(m).padStart(2,'0')} mois`;
}

function itemBase(item: any): string {
  if (item.base == null || nv(item.base) === 0) return '';
  const base = nv(item.base);
  const rate = nv(item.rate);
  // H.sup : base affichee = taux_horaire x (1 + majoration)
  // ex: rate=0.25 (25%) => base affichee = taux_horaire x 1.25
  const isOT = /OT|OVER|HSUP|H_SUP|HEURE/i.test(item.code ?? '');
  if (isOT && rate > 0 && rate <= 1) {
    return Math.round(base * (1 + rate)).toLocaleString('fr-FR');
  }
  return Math.round(base).toLocaleString('fr-FR');
}

function itemTaux(item: any): string {
  const qty = item.quantity;
  if (qty != null && nv(qty) !== 0) return String(nv(qty));
  const r = nv(item.rate);
  if (!r || r === 1) return '';
  if (r > 1 && r <= 3) return r.toFixed(2).replace('.', ',');
  if (r > 0 && r < 1) {
    const p = r * 100;
    return p % 1 === 0 ? p.toFixed(0) : p.toFixed(3).replace(/0+$/, '');
  }
  return String(r);
}

// ── Styles ────────────────────────────────────────────────────────────────────
const FONT = '"Courier New",Courier,monospace';
const SANS = 'Arial,Helvetica,sans-serif';
const BD   = '0.5px solid #000';

const cell = (extra?: React.CSSProperties): React.CSSProperties => ({
  border: BD, padding: '2px 4px', fontSize: 8,
  verticalAlign: 'middle', color: '#000', fontFamily: SANS, ...extra,
});
const cellR = (extra?: React.CSSProperties): React.CSSProperties => ({
  ...cell(), textAlign: 'right', fontFamily: FONT, ...extra,
});
const cellC = (extra?: React.CSSProperties): React.CSSProperties => ({
  ...cell(), textAlign: 'center', ...extra,
});
const th = (extra?: React.CSSProperties): React.CSSProperties => ({
  border: BD, padding: '3px 4px', fontSize: 7.5, fontWeight: 700,
  textAlign: 'center', background: '#000', color: '#fff',
  textTransform: 'uppercase' as const, fontFamily: SANS, ...extra,
});
const thLight = (extra?: React.CSSProperties): React.CSSProperties => ({
  ...th(), background: '#444', ...extra,
});

// Ligne séparatrice section
const SepRow = ({ label }: { label: string }) => (
  <tr>
    <td colSpan={8} style={{
      background: '#000', color: '#fff', padding: '2px 6px',
      fontSize: 7.5, fontWeight: 700, letterSpacing: '0.5px',
      border: BD, textTransform: 'uppercase', fontFamily: SANS,
    }}>
      {label}
    </td>
  </tr>
);

// Ligne total
const TotalRow = ({
  label, gain = '', ret = '', patTaux = '', patMt = '',
}: { label: string; gain?: string; ret?: string; patTaux?: string; patMt?: string }) => (
  <tr style={{ background: '#e8e8e8' }}>
    <td colSpan={4} style={{
      ...cell({ fontWeight: 900, fontSize: 8.5, borderTop: '1.5px solid #000', borderBottom: '1.5px solid #000' }),
      textTransform: 'uppercase',
    }}>
      {label}
    </td>
    <td style={{ ...cellR({ fontWeight: 900, fontSize: 9, borderTop: '1.5px solid #000', borderBottom: '1.5px solid #000' }) }}>{gain}</td>
    <td style={{ ...cellR({ fontWeight: 900, fontSize: 9, borderTop: '1.5px solid #000', borderBottom: '1.5px solid #000' }) }}>{ret}</td>
    <td style={{ ...cellC({ fontWeight: 700, borderTop: '1.5px solid #000', borderBottom: '1.5px solid #000' }) }}>{patTaux}</td>
    <td style={{ ...cellR({ fontWeight: 900, fontSize: 9, borderTop: '1.5px solid #000', borderBottom: '1.5px solid #000' }) }}>{patMt}</td>
  </tr>
);

// ── Composant principal ───────────────────────────────────────────────────────
function BulletinRendererDefault({ payroll }: BulletinRendererDefaultProps) {
  const e   = (payroll.employee ?? {}) as any;
  const co  = (payroll.company  ?? {}) as any;
  const items: PayrollItem[] = payroll.items ?? [];
  const ytd  = (payroll as any).ytd ?? {};

  const { gainItems, cotisItems, indemItems, retenueItems, empItems } = useMemo(
    () => classifyItems(items), [items],
  );

  // Gains : tout sauf absences
  const gains = gainItems.filter((i: any) => !['ABS_DEDUCT','ABS_CONGE'].includes(i.code));

  // CNSS salariale
  const cnssSal   = nv(payroll.cnssSalarial);
  const itsAmount = nv(payroll.its);
  const itsBase   = nv(payroll.grossSalary) - cnssSal;

  // Taxes salarié custom (TOL, CAMU, etc.)
  const ctaxEmpItems = cotisItems.filter((i: any) =>
    !['CNSS_SAL','CNSS','ITS','IRPP','BNC_SOURCE'].includes(i.code) &&
    !['LOAN','ADVANCE'].includes(i.code),
  ).concat(retenueItems.filter((i: any) => !['LOAN','ADVANCE'].includes(i.code)));

  // Prêts / avances
  const loanItems = retenueItems.filter((i: any) => ['LOAN','ADVANCE'].includes(i.code));

  // Indemnités
  const indems = indemItems;

  // Part patronale
  const patRows = [
    { code: 'CNSS_PEN', label: 'CNSS (plafond 1.200.000)', base: Math.min(nv(payroll.grossSalary), 1_200_000), taux: '8,00',  amt: nv(payroll.cnssEmployerPension)  },
    { code: 'CNSS_FAM', label: 'CNSS (plafond 600.000)',   base: Math.min(nv(payroll.grossSalary),   600_000), taux: '10,03', amt: nv(payroll.cnssEmployerFamily)   },
    { code: 'CNSS_AT',  label: 'CNSS (plafond 600.000)',   base: Math.min(nv(payroll.grossSalary),   600_000), taux: '2,25',  amt: nv(payroll.cnssEmployerAccident) },
    { code: 'TUS',      label: 'Taxe unique sur salaire',  base: nv(payroll.grossSalary),                      taux: '2,50',  amt: nv((payroll as any).tusDgiAmount) + nv((payroll as any).tusCnssAmount) },
  ].filter(r => r.amt > 0);

  const ctaxPatItems = (empItems ?? []) as any[];

  // Totaux
  const totalBrut     = nv(payroll.grossSalary);
  const totalIndem    = indems.reduce((s: number, i: any) => s + nv(i.amount), 0);
  const totalPat      = patRows.reduce((s, r) => s + r.amt, 0)
    + ctaxPatItems.reduce((s: number, i: any) => s + nv(i.amount), 0);
  const netSalary     = nv(payroll.netSalary);
  const fiscalParts   = nv((payroll as any).irppFiscalParts) || 1;

  // Infos salarié
  const fullName  = [e.lastName?.toUpperCase(), e.firstName].filter(Boolean).join(' ');
  const cat       = [e.professionalCategory, e.echelon ? `Ech.${e.echelon}` : null].filter(Boolean).join('/');
  const deptName  = e.department?.name ?? '';
  // Si département = PARAFIFI (insensible à la casse) → affectation vide
  const affectation = /parafifi/i.test(deptName) ? '' : deptName;

  const ytdNetImp = nv(ytd.grossSalary) - nv(ytd.cnssSalarial);

  // ── RENDER ─────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        @media print {
          @page { size: A4 portrait; margin: 8mm; }
          html,body { margin:0!important;padding:0!important;background:#fff!important; }
          .no-print,nav,header,aside,footer,
          [class*="sidebar"],[class*="Sidebar"],
          [class*="navbar"],[class*="Navbar"] { display:none!important; }
          #bul-default {
            width:194mm!important;padding:0!important;margin:0!important;
            box-shadow:none!important;border:none!important;
          }
          .nb { page-break-inside:avoid!important;break-inside:avoid!important; }
          * { -webkit-print-color-adjust:exact!important;print-color-adjust:exact!important; }
        }
      `}</style>

      <div id="bul-default" style={{
        fontFamily: SANS, fontSize: 8, background: '#fff', color: '#000',
        width: '210mm', boxSizing: 'border-box', padding: '8mm 10mm',
        margin: '0 auto', boxShadow: '0 2px 12px rgba(0,0,0,0.10)',
      }}>

        {/* ══ EN-TÊTE ══════════════════════════════════════════════════════ */}
        <table className="nb" style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 5, border: '1px solid #000' }}>
          <tbody>
            <tr>
              {/* Logo */}
              <td rowSpan={3} style={{ width: 56, padding: 4, border: BD, textAlign: 'center', verticalAlign: 'middle' }}>
                {co.logo
                  ? <img src={co.logo} alt="" style={{ width: 50, height: 50, objectFit: 'contain' }} />
                  : <div style={{ width: 50, height: 50, background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 900, fontSize: 10, fontFamily: SANS, letterSpacing: 1 }}>
                      {(co.tradeName || co.legalName || '').slice(0, 4).toUpperCase()}
                    </div>
                }
              </td>

              {/* Nom société */}
              <td colSpan={3} style={{ padding: '3px 8px', border: BD, fontWeight: 900, fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5, fontFamily: SANS }}>
                {co.tradeName || co.legalName || '—'}
                {co.tradeName && co.legalName && co.tradeName !== co.legalName &&
                  <span style={{ fontWeight: 400, fontSize: 8, marginLeft: 8 }}>({co.legalName})</span>
                }
              </td>

              {/* Titre Bulletin */}
              <td rowSpan={3} style={{ width: 110, padding: '6px 8px', border: '1px solid #000', textAlign: 'center', verticalAlign: 'middle', background: '#000', color: '#fff' }}>
                <div style={{ fontSize: 6.5, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', fontFamily: SANS }}>
                  BULLETIN DE PAIE
                </div>
                <div style={{ fontSize: 18, fontWeight: 900, fontFamily: FONT, marginTop: 3, letterSpacing: 1 }}>
                  {MONTHS[(payroll.month ?? 1) - 1].slice(0, 4).toUpperCase()}
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, fontFamily: FONT }}>
                  {payroll.year}
                </div>
              </td>
            </tr>

            <tr>
              {/* Adresse */}
              <td style={{ padding: '2px 8px', border: BD, fontSize: 7.5 }}>
                {[co.address, co.city, co.country === 'CG' ? 'Congo-Brazzaville' : co.country].filter(Boolean).join(', ')}
              </td>
              {/* Téléphone */}
              <td style={{ padding: '2px 8px', border: BD, fontSize: 7.5 }}>
                {co.phone && <span>Tel : {co.phone}</span>}
                {co.phone && co.email && <span> · </span>}
                {co.email && <span>{co.email}</span>}
              </td>
              {/* Convention */}
              <td style={{ padding: '2px 8px', border: BD, fontSize: 7.5 }}>
                Conv. : <strong>{co.collectiveAgreement || '—'}</strong>
              </td>
            </tr>

            <tr>
              {/* RCCM */}
              <td style={{ padding: '2px 8px', border: BD, fontSize: 7.5 }}>
                RCCM : <strong>{co.rccmNumber || '—'}</strong>
              </td>
              {/* CNSS Entreprise */}
              <td style={{ padding: '2px 8px', border: BD, fontSize: 7.5 }}>
                CNSS : <strong>{co.cnssNumber || '—'}</strong>
                {co.cnssAffiliationNumber && <span> / Affil. <strong>{co.cnssAffiliationNumber}</strong></span>}
              </td>
              {/* Lieu + Année */}
              <td style={{ padding: '2px 8px', border: BD, fontSize: 7.5 }}>
                Lieu : <strong>{co.city || '—'}</strong>  Année : <strong>{payroll.year}</strong>
              </td>
            </tr>
          </tbody>
        </table>

        {/* ══ INFOS SALARIÉ (ligne compacte) ══════════════════════════════ */}
        <table className="nb" style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 3 }}>
          <tbody>
            <tr>
              <td style={cell({ fontWeight: 700, fontSize: 9, width: '28%' })}>{fullName || '—'}</td>
              {affectation
                ? <td style={cell({ width: '18%', fontSize: 7.5 })}>Affectation : <strong>{affectation}</strong></td>
                : <td style={cell({ width: '18%', fontSize: 7.5 })} />
              }
              <td style={cell({ width: '18%', fontSize: 7.5 })}>Poste : <strong>{e.position || '—'}</strong></td>
              <td style={cell({ width: '18%', fontSize: 7.5 })}>Cat/Ech : <strong>{cat || '—'}</strong></td>
              <td style={cell({ width: '18%', fontSize: 7.5 })}>
                Paiement : <strong>{PAYMENT[e.paymentMethod ?? ''] || 'Virement'}</strong>
              </td>
            </tr>
          </tbody>
        </table>

        {/* ══ TABLEAU INFO SALARIÉ ════════════════════════════════════════ */}
        <table className="nb" style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 5 }}>
          <thead>
            <tr>
              {['Date embauche','N° CNSS/CRF','Sit. familiale','Nbr enfants','Ancienneté','Nbr part IRPP','Type contrat'].map(h => (
                <th key={h} style={th({ fontSize: 7, padding: '2px 3px' })}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={cellC({ fontSize: 8 })}>{fmtDate(e.hireDate)}</td>
              <td style={cellC({ fontSize: 8 })}>{e.cnssNumber || '—'}</td>
              <td style={cellC({ fontSize: 8 })}>{MARITAL[e.maritalStatus ?? ''] || '—'}</td>
              <td style={cellC({ fontSize: 8 })}>{nv(e.numberOfChildren) || '—'}</td>
              <td style={cellC({ fontSize: 8 })}>{seniority(e.hireDate)}</td>
              <td style={cellC({ fontSize: 8, fontWeight: 700 })}>{fiscalParts}</td>
              <td style={cellC({ fontSize: 8 })}>{CONTRACT[e.contractType ?? ''] || e.contractType || '—'}</td>
            </tr>
          </tbody>
        </table>

        {/* ══ TABLEAU PRINCIPAL ═══════════════════════════════════════════ */}
        <table className="nb" style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
          <colgroup>
            <col style={{ width: '7%'  }} />{/* Rubrique */}
            <col style={{ width: '29%' }} />{/* Libellé */}
            <col style={{ width: '10%' }} />{/* Nbre/Base */}
            <col style={{ width: '5%'  }} />{/* Taux */}
            <col style={{ width: '12%' }} />{/* Gains */}
            <col style={{ width: '12%' }} />{/* Retenues */}
            <col style={{ width: '5%'  }} />{/* T.pat */}
            <col style={{ width: '10%' }} />{/* Montant pat */}
          </colgroup>

          <thead>
            <tr>
              <th rowSpan={2} style={th()}>Rubrique</th>
              <th rowSpan={2} style={th({ textAlign: 'left', paddingLeft: 5 })}>Libellé</th>
              <th rowSpan={2} style={th()}>Nbre / Base</th>
              <th rowSpan={2} style={th()}>Taux</th>
              <th colSpan={2} style={th({ background: '#222', fontSize: 8 })}>Part Salariale</th>
              <th colSpan={2} style={th({ background: '#444', fontSize: 8 })}>Part Patronale</th>
            </tr>
            <tr>
              <th style={th({ background: '#222' })}>Gains</th>
              <th style={th({ background: '#222' })}>Retenues</th>
              <th style={th({ background: '#444' })}>Taux</th>
              <th style={th({ background: '#444' })}>Montant</th>
            </tr>
          </thead>

          <tbody>

            {/* ── GAINS ──────────────────────────────────────────── */}
            {gains.map((item: any, idx: number) => (
              <tr key={item.id || item.code || idx} style={{ background: idx % 2 === 0 ? '#fff' : '#f9f9f9' }}>
                <td style={cellC({ fontFamily: FONT, fontSize: 7 })}>{item.code?.replace(/[^0-9]/g,'') || String(1000 + idx)}</td>
                <td style={cell({ paddingLeft: 5, fontWeight: item.code === 'SAL_BASE' ? 700 : 400 })}>{item.label}</td>
                <td style={cellR()}>{itemBase(item)}</td>
                <td style={cellC()}>{itemTaux(item)}</td>
                <td style={cellR({ fontWeight: 600 })}>{fmt(item.amount)}</td>
                <td style={cell()} />
                <td style={cell()} />
                <td style={cell()} />
              </tr>
            ))}

            {/* TOTAL BRUT */}
            <TotalRow label="Total Brut" gain={fmtZ(totalBrut)} />

            {/* ── CNSS SALARIALE ─────────────────────────────────── */}
            <tr style={{ background: '#fff' }}>
              <td style={cellC({ fontFamily: FONT, fontSize: 7 })}>2505</td>
              <td style={cell({ paddingLeft: 5 })}>CNSS (plafond 1.200.000)</td>
              <td style={cellR()}>{fmtZ(Math.min(nv(payroll.grossSalary), 1_200_000))}</td>
              <td style={cellC()}>4,00</td>
              <td style={cell()} />
              <td style={cellR({ fontWeight: 600 })}>{fmt(cnssSal)}</td>
              <td style={cell()} />
              <td style={cell()} />
            </tr>

            {/* ── PART PATRONALE CNSS + TUS ──────────────────────── */}
            {patRows.map((r, idx) => (
              <tr key={r.code} style={{ background: idx % 2 === 0 ? '#f9f9f9' : '#fff' }}>
                <td style={cellC({ fontFamily: FONT, fontSize: 7 })}>{3510 + idx * 10}</td>
                <td style={cell({ paddingLeft: 5 })}>{r.label}</td>
                <td style={cellR()}>{r.base > 0 ? r.base.toLocaleString('fr-FR') : ''}</td>
                <td style={cell()} />
                <td style={cell()} />
                <td style={cell()} />
                <td style={cellC({ fontWeight: 600 })}>{r.taux}</td>
                <td style={cellR({ fontWeight: 600 })}>{fmt(r.amt)}</td>
              </tr>
            ))}

            {/* Taxes patronales custom */}
            {ctaxPatItems.map((item: any, idx: number) => (
              <tr key={item.id || item.code} style={{ background: (patRows.length + idx) % 2 === 0 ? '#f9f9f9' : '#fff' }}>
                <td style={cellC({ fontFamily: FONT, fontSize: 7 })}>{item.code?.replace(/[^0-9]/g,'') || String(3900 + idx)}</td>
                <td style={cell({ paddingLeft: 5 })}>{item.label}</td>
                <td style={cellR()}>{itemBase(item)}</td>
                <td style={cell()} />
                <td style={cell()} />
                <td style={cell()} />
                <td style={cellC({ fontWeight: 600 })}>{itemTaux(item)}</td>
                <td style={cellR({ fontWeight: 600 })}>{fmt(item.amount)}</td>
              </tr>
            ))}

            {/* TOTAL COTISATIONS */}
            <TotalRow
              label="Total cotisations"
              ret={fmtZ(cnssSal)}
              patMt={fmtZ(totalPat)}
            />

            {/* ── ITS / IRPP ─────────────────────────────────────── */}
            {itsAmount > 0 && (
              <tr style={{ background: '#fff' }}>
                <td style={cellC({ fontFamily: FONT, fontSize: 7 })}>4520</td>
                <td style={cell({ paddingLeft: 5 })}>ITS / IRPP Mois</td>
                <td style={cellR()}>{fmt(itsBase)}</td>
                <td style={cellC()}>Barème</td>
                <td style={cell()} />
                <td style={cellR({ fontWeight: 600 })}>{fmt(itsAmount)}</td>
                <td style={cell()} />
                <td style={cell()} />
              </tr>
            )}

            {/* ── TAXES SALARIÉ CUSTOM ───────────────────────────── */}
            {ctaxEmpItems.map((item: any, idx: number) => (
              <tr key={item.id || item.code} style={{ background: idx % 2 === 0 ? '#f9f9f9' : '#fff' }}>
                <td style={cellC({ fontFamily: FONT, fontSize: 7 })}>{item.code?.replace(/[^0-9]/g,'') || String(4600 + idx)}</td>
                <td style={cell({ paddingLeft: 5 })}>{item.label}</td>
                <td style={cellR()}>{itemBase(item)}</td>
                <td style={cellC()}>{itemTaux(item)}</td>
                <td style={cell()} />
                <td style={cellR({ fontWeight: 600 })}>{fmt(item.amount)}</td>
                <td style={cell()} />
                <td style={cell()} />
              </tr>
            ))}

            {/* ── PRÊTS & AVANCES ────────────────────────────────── */}
            {loanItems.map((item: any, idx: number) => (
              <tr key={item.id || item.code} style={{ background: idx % 2 === 0 ? '#f9f9f9' : '#fff' }}>
                <td style={cellC({ fontFamily: FONT, fontSize: 7 })}>{item.code === 'LOAN' ? '6700' : '6800'}</td>
                <td style={cell({ paddingLeft: 5 })}>{item.label}</td>
                <td style={cellR()}>{itemBase(item)}</td>
                <td style={cellC()}>{itemTaux(item)}</td>
                <td style={cell()} />
                <td style={cellR({ fontWeight: 600 })}>{fmt(item.amount)}</td>
                <td style={cell()} />
                <td style={cell()} />
              </tr>
            ))}

            {/* ── INDEMNITÉS & AVANTAGES ─────────────────────────── */}
            {indems.map((item: any, idx: number) => (
              <tr key={item.id || item.code} style={{ background: idx % 2 === 0 ? '#fff' : '#f9f9f9' }}>
                <td style={cellC({ fontFamily: FONT, fontSize: 7 })}>{item.code?.replace(/[^0-9]/g,'') || String(5400 + idx)}</td>
                <td style={cell({ paddingLeft: 5 })}>{item.label}</td>
                <td style={cellR()}>{itemBase(item)}</td>
                <td style={cellC()}>{itemTaux(item)}</td>
                <td style={cellR({ fontWeight: 600 })}>{fmt(item.amount)}</td>
                <td style={cell()} />
                <td style={cell()} />
                <td style={cell()} />
              </tr>
            ))}

          </tbody>
        </table>

        {/* ══ BAS DU BULLETIN — Mode règlement + NET À PAYER ══════════════ */}
        <table className="nb" style={{ width: '100%', borderCollapse: 'collapse', marginTop: 4, border: BD }}>
          <tbody>
            <tr>
              {/* Mode règlement — titre */}
              <td style={cell({ background: '#000', color: '#fff', fontWeight: 700, textAlign: 'center', fontSize: 8, width: '13%' })}>
                Mode règlement
              </td>
              {/* Banque + N° compte */}
              <td colSpan={2} style={cell({ fontSize: 8, width: '35%' })}>
                <div>Banque : <strong>{e.bankName || '—'}</strong></div>
                {e.bankAccountNumber && (
                  <div style={{ fontSize: 7 }}>N° de compte : <strong>{e.bankAccountNumber}</strong></div>
                )}
              </td>
              {/* Virement */}
              <td style={cell({ fontSize: 8, width: '12%' })}>
                {PAYMENT[e.paymentMethod ?? ''] || 'Virement'}
              </td>
              {/* NET À PAYER — titre */}
              <td style={cell({ background: '#000', color: '#fff', fontWeight: 700, textAlign: 'center', fontSize: 8, width: '12%' })}>
                Net à payer
              </td>
              {/* NET À PAYER — montant */}
              <td style={cellR({ fontWeight: 900, fontSize: 13, fontFamily: FONT, background: '#f0f0f0', border: '1.5px solid #000', width: '14%' })}>
                {fmtZ(netSalary)}
              </td>
              {/* 2ème banque */}
              <td style={cell({ textAlign: 'center', fontSize: 7.5, width: '7%' })}>2eme banque</td>
              {/* Solde */}
              <td style={cellR({ fontWeight: 700, width: '7%' })}></td>
            </tr>
          </tbody>
        </table>

        {/* ══ CUMULS ══════════════════════════════════════════════════════ */}
        <table className="nb" style={{ width: '100%', borderCollapse: 'collapse', marginTop: 0, tableLayout: 'fixed' }}>
          <colgroup>
            <col style={{ width: '10%' }} />{/* Label Mois/Année */}
            <col style={{ width: '16%' }} />{/* Brut */}
            <col style={{ width: '16%' }} />{/* Net imposable */}
            <col style={{ width: '13%' }} />{/* Charges Sal */}
            <col style={{ width: '13%' }} />{/* Charges Pat */}
            <col style={{ width: '13%' }} />{/* Droits annuels */}
            <col style={{ width: '10%' }} />{/* Solde */}
            <col style={{ width: '9%'  }} />{/* vide */}
          </colgroup>
          <thead>
            <tr>
              <th style={th({ textAlign: 'center' })}>Cumuls</th>
              <th style={th()}>Brut</th>
              <th style={th()}>Net imposable</th>
              <th style={th()}>Charges Sal.</th>
              <th style={th()}>Charges Pat.</th>
              <th style={th()}>Droits annuels</th>
              <th style={th()}>Solde</th>
              <th style={th()}>—</th>
            </tr>
          </thead>
          <tbody>
            {/* Ligne Mois */}
            <tr style={{ background: '#f8f8f8' }}>
              <td style={cell({ fontWeight: 700, textAlign: 'center' })}>Mois</td>
              <td style={cellR({ fontWeight: 700 })}>{fmtZ(totalBrut)}</td>
              <td style={cellR()}>{fmtZ(nv(payroll.grossSalary) - cnssSal)}</td>
              <td style={cellR()}>{fmtDash(cnssSal)}</td>
              <td style={cellR()}>{fmtDash(totalPat)}</td>
              <td style={cell()} />
              <td style={cell()} />
              <td style={cell()} />
            </tr>
            {/* Ligne Année */}
            <tr style={{ background: '#fff' }}>
              <td style={cell({ fontWeight: 700, textAlign: 'center' })}>Année</td>
              <td style={cellR({ fontWeight: 700 })}>{fmtDash(ytd.grossSalary)}</td>
              <td style={cellR()}>{fmtDash(ytdNetImp)}</td>
              <td style={cellR()}>{fmtDash(ytd.cnssSalarial)}</td>
              <td style={cellR()}>{fmtDash(ytd.cnssEmployer)}</td>
              <td style={cell()} />
              <td style={cell()} />
              <td style={cell()} />
            </tr>
          </tbody>
        </table>

        {/* ══ SIGNATURES ══════════════════════════════════════════════════ */}
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 12 }}>
          <tbody>
            <tr>
              {/* Signature employé */}
              <td style={{ width: '50%', padding: '4px 8px', borderTop: '1.5px solid #000', fontSize: 8, fontWeight: 700, textTransform: 'uppercase' }}>
                Signature de l'Employ&eacute;(e)
                <div style={{ height: 32, borderBottom: '1px solid #000', marginTop: 20 }} />
              </td>
              {/* Signature employeur */}
              <td style={{ width: '50%', padding: '4px 8px', borderTop: '1.5px solid #000', fontSize: 8, fontWeight: 700, textTransform: 'uppercase', textAlign: 'right' }}>
                Signature et cachet de l'Employeur
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                  <span style={{ fontSize: 7, fontWeight: 400 }}>Chef Département</span>
                  <span style={{ fontSize: 7, fontWeight: 400 }}>DRH / Direction</span>
                </div>
                <div style={{ height: 24, marginTop: 8 }} />
              </td>
            </tr>
          </tbody>
        </table>

        {/* ══ PIED DE PAGE ════════════════════════════════════════════════ */}
        <div style={{ borderTop: '1px solid #999', marginTop: 6, paddingTop: 3, display: 'flex', justifyContent: 'space-between', fontSize: 7, color: '#444' }}>
          <span>CNSS sal. 4% · ITS barème 2026 · SMIG 70 400 FCFA · Décret N°78-360</span>
          <span style={{ fontWeight: 700, color: '#000' }}>KONZARH</span>
        </div>

      </div>
    </>
  );
}