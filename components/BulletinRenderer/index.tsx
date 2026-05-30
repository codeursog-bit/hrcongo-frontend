'use client';

// ============================================================================
// components/BulletinRenderer/index.tsx  — Template DEFAULT
//
// ✅ Design IESM : reproduction exacte du bulletin bul_ben_nov.pdf
//    • En-tête : logo encadré + coords à gauche | "BULLETIN DE PAIE" border noir à droite
//    • Infos employé : grille structurée avec labels gras sur fond gris clair
//    • Tableau 9 colonnes : N°, Désignation, Nombre, Base, Taux, Gain, Retenue, T.pat, Ret.pat
//    • Total Brut / Total Cotisations sur lignes grises
//    • Cumuls Période/Année en tableau dark header
//    • NET À PAYER encadré noir, chiffre blanc sur fond noir
//    • Signatures 2 colonnes + pied de page coords
//
// ✅ FIXED width: 210mm fixe (était 100%)
// ✅ FIXED @media print sans position:fixed → preview navigateur OK
// ✅ FIXED @page margin: 8mm pour ne pas couper les bords
// ============================================================================

import React, { useMemo } from 'react';
import type { BulletinPayroll, BulletinTemplateConfig } from '@/types/bulletin-template';
import { getBaseTemplate } from '@/lib/bulletin-templates';
import {
  classifyItems, getCnssEmpTotal,
  getTotalCotisSal, getTotalCotisPat, getEmpColsForItem,
} from '@/lib/bulletin-items-classifier';
import BulletinRendererCorporate from '@/components/BulletinRendererCorporate';
import BulletinRendererAdmin     from '@/components/BulletinRendererAdmin';

export interface BulletinRendererProps {
  payroll:      BulletinPayroll;
  template?:   BulletinTemplateConfig;
  previewMode?: boolean;
}

export default function BulletinRendererDispatcher(props: BulletinRendererProps) {
  const templateId = (props.template ?? getBaseTemplate('default')).templateId;
  if (templateId === 'corporate') return <BulletinRendererCorporate {...props} />;
  if (templateId === 'admin')     return <BulletinRendererAdmin     {...props} />;
  return <BulletinRendererDefault {...props} />;
}

// ─── Constantes ───────────────────────────────────────────────────────────────
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
  if (Math.abs(n) > 999_999_999_999) return '—';
  return n.toLocaleString('fr-FR');
};

function seniority(hireDate?: string) {
  if (!hireDate) return { years: 0, months: 0 };
  const h = new Date(hireDate), n = new Date();
  let y = n.getFullYear() - h.getFullYear();
  let m = n.getMonth()    - h.getMonth();
  if (m < 0) { y--; m += 12; }
  return { years: y, months: m };
}

function formatDate(d?: string) {
  return d ? new Date(d).toLocaleDateString('fr-FR') : '—';
}

// ─── Styles cellule — identiques au PDF IESM ─────────────────────────────────
const BD = '1px solid #000'; // bordure principale
const BL = '1px solid #ccc'; // bordure légère

const cell = (extra?: React.CSSProperties): React.CSSProperties => ({
  border: BD, padding: '2px 4px', fontSize: 9, verticalAlign: 'middle', ...extra,
});
const cellR = (extra?: React.CSSProperties): React.CSSProperties => ({
  ...cell(), textAlign: 'right', fontFamily: 'Courier New, monospace', ...extra,
});
const cellC = (extra?: React.CSSProperties): React.CSSProperties => ({
  ...cell(), textAlign: 'center', ...extra,
});
const th = (extra?: React.CSSProperties): React.CSSProperties => ({
  ...cell(), background: '#d0d0d0', fontWeight: 700, textAlign: 'center', fontSize: 8.5, padding: '3px 4px', ...extra,
});

// ─── Composant ────────────────────────────────────────────────────────────────
function BulletinRendererDefault({ payroll, template }: BulletinRendererProps) {
  const tpl = template ?? getBaseTemplate('default');
  const e  = (payroll.employee ?? {}) as any;
  const co = (payroll.company  ?? {}) as any;

  const monthLabel = MONTHS[(payroll.month ?? 1) - 1];
  const sen        = seniority(e.hireDate);
  const fullName   = [e.firstName, e.lastName].filter(Boolean).join(' ');
  const cat        = [e.professionalCategory, e.echelon ? `Cat ${e.echelon}` : ''].filter(Boolean).join(' ');
  const month      = payroll.month ?? 1;

  const { gainItems, cotisItems, indemItems, retenueItems, empItems } = useMemo(
    () => classifyItems(payroll.items ?? []), [payroll.items]
  );

  const cnssEmpTotal  = getCnssEmpTotal(empItems, payroll);
  const brutGains     = gainItems.reduce((s: number, i: any) => s + Number(i.amount), 0);
  const totalCotisSal = getTotalCotisSal(cotisItems);
  const totalCotisPat = getTotalCotisPat(empItems, payroll);
  const totalGains    = brutGains
                      + indemItems.reduce((s: number, i: any) => s + Number(i.amount), 0)
                      + retenueItems.reduce((s: number, i: any) => s + Number(i.amount), 0);
  const totalRetenues = totalCotisSal
                      + retenueItems.reduce((s: number, i: any) => s + Number(i.amount), 0)
                      + (payroll.absenceDeduction ?? 0);
  const netSalary     = payroll.netSalary ?? 0;

  // ── EN-TÊTE ─────────────────────────────────────────────────────────────────
  const Header = () => (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
      borderBottom: '2px solid #000', paddingBottom: 8, marginBottom: 7,
    }}>
      {/* GAUCHE : Logo + coordonnées */}
      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', flex: 1 }}>
        {co.logo ? (
          <img src={co.logo} alt="Logo"
            style={{ width: 70, height: 70, objectFit: 'contain', border: '1.5px solid #000', padding: 3, flexShrink: 0 }}
          />
        ) : (
          /* Encadré texte si pas de logo — fidèle au PDF IESM */
          <div style={{
            border: '2px solid #000', padding: '5px 8px',
            fontWeight: 900, fontSize: 13, letterSpacing: 3,
            minWidth: 90, textAlign: 'center', flexShrink: 0, lineHeight: 1.3,
          }}>
            {(co.tradeName || co.legalName || 'ENTREPRISE').toUpperCase()}
            {co.rccmNumber && (
              <div style={{ fontSize: 7, fontWeight: 400, marginTop: 3, letterSpacing: 0 }}>
                {co.rccmNumber}
              </div>
            )}
          </div>
        )}
        <div style={{ fontSize: 8.5, lineHeight: 1.7 }}>
          {co.address    && <div>{co.address}{co.city ? `, ${co.city}` : ''}</div>}
          {co.phone      && <div>Tél. / Fax: {co.phone}</div>}
          {co.email      && <div>Email : {co.email}</div>}
          {co.rccmNumber && <div>RCCM : {co.rccmNumber}</div>}
          {co.nif        && <div>NIU : {co.nif}</div>}
        </div>
      </div>

      {/* DROITE : Titre + mois */}
      <div style={{ textAlign: 'center', flexShrink: 0, marginLeft: 20 }}>
        <div style={{
          fontSize: 17, fontWeight: 900, letterSpacing: 5,
          textTransform: 'uppercase', border: '2px solid #000',
          padding: '5px 14px',
        }}>
          BULLETIN DE PAIE
        </div>
        <div style={{ marginTop: 5, fontSize: 14, fontWeight: 700 }}>
          {monthLabel} &nbsp;&nbsp; {payroll.year}
        </div>
        {(payroll as any).paymentDate ? (
          <div style={{ fontSize: 8.5, marginTop: 2 }}>
            Paiement le &nbsp;{formatDate((payroll as any).paymentDate)}&nbsp; par &nbsp;{PAYMENT[e.paymentMethod ?? ''] ?? 'Virement'}
          </div>
        ) : (
          <div style={{ fontSize: 8.5, marginTop: 2 }}>
            par {PAYMENT[e.paymentMethod ?? ''] ?? 'Virement'}
          </div>
        )}
      </div>
    </div>
  );

  // ── INFOS EMPLOYÉ — fidèle à la grille du PDF IESM ────────────────────────
  const EmployeeInfo = () => {
    const Row = ({ label, val, cols = '110px 1fr', border = BL }: { label: string; val: string; cols?: string; border?: string }) => (
      <div style={{ display: 'grid', gridTemplateColumns: cols, borderBottom: border, fontSize: 9 }}>
        <div style={{ padding: '2px 5px', fontWeight: 700, borderRight: border, background: '#f0f0f0' }}>{label}</div>
        <div style={{ padding: '2px 5px' }}>{val || '—'}</div>
      </div>
    );

    return (
      <div style={{ border: BD, marginBottom: 6 }}>

        {/* Ligne 1 : Matricule + Etat civil | Site */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderBottom: BD }}>
          <div style={{ padding: '2.5px 6px', borderRight: BD, fontSize: 9, display: 'flex', gap: 18 }}>
            <span><strong>Matricule :</strong> {e.employeeNumber || '—'}</span>
            <span><strong>Etat civil :</strong> {MARITAL[e.maritalStatus ?? ''] ?? '—'}</span>
          </div>
          <div style={{ padding: '2.5px 6px', fontSize: 9 }}>
            <strong>Site :</strong> {co.city || co.address || 'ADMINISTRATION'}
          </div>
        </div>

        {/* Ligne 2 : Nom complet */}
        <div style={{ padding: '3px 6px', borderBottom: BD }}>
          <span style={{ fontWeight: 700, fontSize: 9 }}>M &nbsp;</span>
          <span style={{ fontWeight: 900, fontSize: 12, textTransform: 'uppercase' }}>{fullName}</span>
        </div>

        {/* Ligne 3 : N° Compte | Ancienneté */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderBottom: BD }}>
          <div style={{ padding: '2.5px 6px', borderRight: BD, fontSize: 9 }}>
            <strong>N° Compte :</strong>&nbsp;
            {[co.bankCode || '30005', co.bankBranch || '00363', e.bankAccount || ''].filter(Boolean).join('  &nbsp;')}
          </div>
          <div style={{ padding: '2.5px 6px', fontSize: 9 }}>
            <strong>Ancienneté :</strong> &nbsp;{sen.years}&nbsp; an(s) et &nbsp;{sen.months}&nbsp; mois
          </div>
        </div>

        {/* Grille principale 2 colonnes */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
          <div style={{ borderRight: BD }}>
            <Row label="N° CNSS"            val={e.cnssNumber || '—'} />
            <Row label="Compte auxiliaire"  val={e.nationalIdNumber || ''} />
            <Row label="Convention"         val={co.collectiveAgreement || 'Commerce'} />
          </div>
          <div>
            <Row label="Fonction"           val={e.position || '—'} cols="120px 1fr" />
            <Row label="Nature de contrat"  val={CONTRACT[e.contractType ?? ''] ?? '—'} cols="120px 1fr" />
            <Row label="Catégorie / Echelon" val={cat || '—'} cols="120px 1fr" />
          </div>
        </div>

        {/* Ligne bas : Date embauche | Nb enfants | Nb parts */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', borderTop: BD }}>
          <div style={{ padding: '2.5px 6px', borderRight: BD, fontSize: 9 }}>
            <strong>Date d'embauche :</strong> {formatDate(e.hireDate)}
          </div>
          <div style={{ padding: '2.5px 6px', borderRight: BD, fontSize: 9 }}>
            <strong>Nombre d'enfants :</strong> {e.numberOfChildren ?? 0}
          </div>
          <div style={{ padding: '2.5px 6px', fontSize: 9 }}>
            <strong>Nombre de parts :</strong> {(e.numberOfChildren ?? 0) + 1}
          </div>
        </div>
      </div>
    );
  };

  // ── TABLEAU DE PAIE — 9 colonnes identiques au PDF IESM ──────────────────
  const PayTable = () => (
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 9 }}>
      <thead>
        <tr>
          <th style={th({ width: '4.5%' })}>N°</th>
          <th style={th({ width: '30%', textAlign: 'left', paddingLeft: 5 })}>Désignation</th>
          <th style={th({ width: '7%' })}>Nombre</th>
          <th style={th({ width: '9%' })}>Base</th>
          <th colSpan={3} style={th()}>Part salariale</th>
          <th colSpan={2} style={th()}>Part patronale</th>
        </tr>
        <tr>
          {['','','','','Taux','Gain','Retenue','Taux','Retenue'].map((h, i) => (
            <th key={i} style={th({ ...(i < 4 ? { borderTop: 0 } : {}), width: i===4||i===7 ? '6%' : i===5 ? '12%' : i===6 ? '11%' : i===8 ? '14%' : undefined })}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>

        {/* ── GAINS ── */}
        {gainItems.map((item: any, idx: number) => (
          <tr key={item.id ?? idx}>
            <td style={cellC({ fontSize: 8.5 })}>
              {item.code === 'SAL_BASE' ? '10' : String(idx + 10)}
            </td>
            <td style={cell({ paddingLeft: 5, fontWeight: item.code === 'SAL_BASE' ? 700 : 400 })}>
              {item.label}
            </td>
            <td style={cellR()}>
              {item.code === 'SAL_BASE' ? fmt(payroll.workedDays ?? 26) : ''}
            </td>
            <td style={cellR()}>{item.base ? fmt(item.base) : ''}</td>
            <td style={cellC()}>
              {item.rate && Number(item.rate) !== 1 ? `${(Number(item.rate) * 100).toFixed(0)}%` : ''}
            </td>
            <td style={cellR({ fontWeight: 700 })}>{fmt(item.amount)}</td>
            <td style={cell()} /><td style={cell()} /><td style={cell()} />
          </tr>
        ))}

        {/* TOTAL BRUT — fond gris moyen */}
        <tr>
          <td colSpan={4} style={cell({ fontWeight: 900, textAlign: 'center', background: '#dedede', fontSize: 10 })}>
            <strong>Total Brut</strong>
          </td>
          <td style={cell({ background: '#dedede' })} />
          <td style={cellR({ fontWeight: 900, background: '#dedede', fontSize: 11 })}>{fmt(brutGains)}</td>
          <td style={cell({ background: '#dedede' })} />
          <td style={cell({ background: '#dedede' })} />
          <td style={cell({ background: '#dedede' })} />
        </tr>

        {/* ── COTISATIONS SALARIALES ── */}
        {cotisItems.map((item: any, idx: number) => {
          const { tauxPat, retPat } = getEmpColsForItem(item, empItems, payroll);
          return (
            <tr key={item.id ?? idx}>
              <td style={cellC({ fontSize: 8.5 })}>{300 + idx}</td>
              <td style={cell({ paddingLeft: 5 })}>{item.label}</td>
              <td style={cell()} />
              <td style={cellR()}>{item.base ? fmt(item.base) : ''}</td>
              <td style={cellC()}>
                {item.rate ? Number(item.rate * 100).toFixed(3).replace(/0+$/, '').replace(/\.$/, '') : ''}
              </td>
              <td style={cell()} />
              <td style={cellR({ fontWeight: 700 })}>{fmt(item.amount)}</td>
              <td style={cellC()}>{tauxPat}</td>
              <td style={cellR({ fontWeight: 700 })}>{retPat}</td>
            </tr>
          );
        })}

        {/* TOTAL COTISATIONS */}
        <tr>
          <td colSpan={4} style={cell({ fontWeight: 900, textAlign: 'center', background: '#e8e8e8', fontSize: 10 })}>
            <strong>Total Cotisations</strong>
          </td>
          <td style={cell({ background: '#e8e8e8' })} />
          <td style={cell({ background: '#e8e8e8' })} />
          <td style={cellR({ fontWeight: 900, background: '#e8e8e8', fontSize: 11 })}>{fmt(totalCotisSal)}</td>
          <td style={cell({ background: '#e8e8e8' })} />
          <td style={cellR({ fontWeight: 900, background: '#e8e8e8', fontSize: 11 })}>
            {totalCotisPat > 0 ? fmt(totalCotisPat) : '—'}
          </td>
        </tr>

        {/* ── INDEMNITÉS (transport, salissure…) ── */}
        {indemItems.map((item: any, idx: number) => (
          <tr key={item.id ?? idx}>
            <td style={cellC({ fontSize: 8.5 })}>{400 + idx}</td>
            <td style={cell({ paddingLeft: 5 })}>{item.label}</td>
            <td style={cellR()}>{payroll.workedDays ? fmt(payroll.workedDays) : ''}</td>
            <td style={cellR()}>{item.base ? fmt(item.base) : ''}</td>
            <td style={cell()} />
            <td style={cellR({ fontWeight: 700 })}>{fmt(item.amount)}</td>
            <td style={cell()} /><td style={cell()} /><td style={cell()} />
          </tr>
        ))}

        {/* ── RETENUES DIVERSES ── */}
        {retenueItems.map((item: any, idx: number) => (
          <tr key={item.id ?? idx}>
            <td style={cellC({ fontSize: 8.5 })}>{700 + idx}</td>
            <td style={cell({ paddingLeft: 5 })}>{item.label}</td>
            <td style={cell()} /><td style={cell()} /><td style={cell()} />
            <td style={cell()} />
            <td style={cellR({ fontWeight: 700 })}>{fmt(item.amount)}</td>
            <td style={cell()} /><td style={cell()} />
          </tr>
        ))}

        {/* Absence */}
        {(payroll.absenceDeduction ?? 0) > 0 && (
          <tr>
            <td style={cellC({ fontSize: 8.5 })}>ABS</td>
            <td style={cell({ paddingLeft: 5 })}>Retenue absence</td>
            <td style={cellR()}>{payroll.absenceDays ?? 0}</td>
            <td style={cell()} /><td style={cell()} />
            <td style={cell()} />
            <td style={cellR({ fontWeight: 700 })}>{fmt(payroll.absenceDeduction)}</td>
            <td style={cell()} /><td style={cell()} />
          </tr>
        )}

        {/* Séparateur pointillé */}
        <tr>
          <td colSpan={9} style={{
            borderLeft: BD, borderRight: BD, padding: 0, height: 4,
            borderTop: '1px dashed #888', borderBottom: 'none',
          }} />
        </tr>

        {/* TOTAL GAINS */}
        <tr>
          <td style={cellC({ fontSize: 8.5 })}>990</td>
          <td style={cell({ fontWeight: 900, paddingLeft: 5 })}>TOTAL GAINS</td>
          <td style={cell()} /><td style={cell()} /><td style={cell()} />
          <td style={cellR({ fontWeight: 900, fontSize: 10.5 })}>{fmt(totalGains)}</td>
          <td style={cell()} /><td style={cell()} /><td style={cell()} />
        </tr>

        {/* Séparateur */}
        <tr>
          <td colSpan={9} style={{
            borderLeft: BD, borderRight: BD, padding: 0, height: 4,
            borderTop: '1px dashed #888', borderBottom: 'none',
          }} />
        </tr>

        {/* TOTAL RETENUES */}
        <tr>
          <td style={cellC({ fontSize: 8.5 })}>995</td>
          <td style={cell({ fontWeight: 900, paddingLeft: 5 })}>TOTAL RETENUES</td>
          <td style={cell()} /><td style={cell()} /><td style={cell()} />
          <td style={cell()} />
          <td style={cellR({ fontWeight: 900, fontSize: 10.5 })}>{fmt(totalRetenues)}</td>
          <td style={cell()} /><td style={cell()} />
        </tr>

      </tbody>
    </table>
  );

  // ── CUMULS + NET À PAYER — identique au PDF IESM ────────────────────────
  const Cumuls = () => {
    const overTime = (payroll.overtimeHours10??0)+(payroll.overtimeHours25??0)
                   +(payroll.overtimeHours50??0)+(payroll.overtimeHours100??0);
    const cols = [
      { label: 'Salaire brut',        p: payroll.grossSalary,   a: (payroll.grossSalary ?? 0) * month },
      { label: 'Charges salariales',  p: payroll.cnssSalarial,  a: (payroll.cnssSalarial ?? 0) * month },
      { label: 'Charges patronales',  p: cnssEmpTotal,          a: cnssEmpTotal * month },
      { label: 'Avantages en nature', p: 0,                     a: 0 },
      { label: 'Net imposable',       p: (payroll.grossSalary??0)-(payroll.cnssSalarial??0), a: ((payroll.grossSalary??0)-(payroll.cnssSalarial??0))*month },
      { label: 'Heures travaillées',  p: (payroll.workedDays??0)*8, a: (payroll.workedDays??0)*8*month },
      { label: 'Heures suppl.',       p: overTime,              a: 0 },
      { label: 'Base Congés',         p: payroll.baseSalary,    a: (payroll.baseSalary??0)*month },
    ];

    const thC: React.CSSProperties = {
      background: '#555', color: '#fff', fontWeight: 700,
      fontSize: 7.5, padding: '3px 4px', textAlign: 'center',
      whiteSpace: 'nowrap', border: '1px solid #000',
    };
    const tdLabel: React.CSSProperties = {
      fontSize: 8.5, fontWeight: 700, background: '#efefef',
      border: '1px solid #aaa', padding: '2.5px 5px', textAlign: 'center',
    };
    const tdVal: React.CSSProperties = {
      fontSize: 8.5, fontFamily: 'Courier New, monospace',
      border: '1px solid #ccc', padding: '2.5px 4px', textAlign: 'right',
      whiteSpace: 'nowrap',
    };

    return (
      <div style={{ display: 'flex', alignItems: 'stretch', borderTop: '2px solid #000' }}>
        <table style={{ flex: 1, borderCollapse: 'collapse', tableLayout: 'fixed' }}>
          <thead>
            <tr>
              <th style={{ ...thC, width: 55 }}>Cumuls</th>
              {cols.map(c => <th key={c.label} style={thC}>{c.label}</th>)}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={tdLabel}>Période</td>
              {cols.map(c => <td key={c.label} style={tdVal}>{c.p != null ? fmt(c.p) : '0'}</td>)}
            </tr>
            <tr>
              <td style={tdLabel}>Année</td>
              {cols.map(c => <td key={c.label} style={tdVal}>{c.a != null ? fmt(c.a) : '0'}</td>)}
            </tr>
          </tbody>
        </table>

        {/* NET À PAYER — encadré noir, fidèle au PDF IESM */}
        <div style={{
          border: '2px solid #000',
          background: '#fff',
          display: 'flex', flexDirection: 'column',
          justifyContent: 'center', alignItems: 'center',
          minWidth: 115, padding: '6px 10px', flexShrink: 0,
        }}>
          <div style={{
            fontSize: 8, fontWeight: 900, textTransform: 'uppercase',
            letterSpacing: 1.5, marginBottom: 4, whiteSpace: 'nowrap',
          }}>
            NET A PAYER
          </div>
          <div style={{
            fontSize: 17, fontWeight: 900, fontFamily: 'Courier New, monospace',
            whiteSpace: 'nowrap', letterSpacing: 1,
          }}>
            {fmt(netSalary)}
          </div>
        </div>
      </div>
    );
  };

  // ── SIGNATURES ─────────────────────────────────────────────────────────────
  const Signatures = () => (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 30, padding: '12px 0 8px', borderTop: '1px solid #ccc', marginTop: 10 }}>
      {["Signature de l'Employé(e)", "Signature et cachet de l'Employeur"].map(label => (
        <div key={label} style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 9.5, fontWeight: 700, marginBottom: 4 }}>{label}</div>
          <div style={{ height: 52, borderBottom: '1.5px solid #000' }} />
        </div>
      ))}
    </div>
  );

  // ── PIED DE PAGE ────────────────────────────────────────────────────────────
  const Footer = () => {
    const parts = [
      co.phone      ? `Tél. : ${co.phone}` : null,
      co.address    ? `${co.address}${co.city ? ', ' + co.city : ''}` : null,
      co.email      ? `Email : ${co.email}` : null,
      co.rccmNumber ? `RCCM : ${co.rccmNumber}` : null,
      co.nif        ? `NIU : ${co.nif}` : null,
    ].filter(Boolean);
    if (!parts.length) return null;
    return (
      <div style={{ borderTop: '1.5px solid #000', paddingTop: 4, textAlign: 'center', fontSize: 8, color: '#333', marginTop: 6 }}>
        {parts.join(' · ')}
      </div>
    );
  };

  // ── ASSEMBLAGE ──────────────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        @media print {
          @page { size: A4 portrait; margin: 8mm; }
          html, body { margin: 0 !important; padding: 0 !important; background: #fff !important; }
          .no-print,
          nav, header, aside, footer,
          [class*="sidebar"],[class*="Sidebar"],
          [class*="navbar"],[class*="Navbar"] { display: none !important; }
          .payslip-sheet-wrap { display: block !important; position: static !important; }
          #bulletin-root {
            width: 194mm !important;
            min-height: 281mm !important;
            padding: 0 !important;
            margin: 0 !important;
            box-shadow: none !important;
            border: none !important;
          }
          .bul-no-break { page-break-inside: avoid !important; break-inside: avoid !important; }
          .bul-legal { display: none !important; }
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        }
      `}</style>

      <div id="bulletin-root" style={{
        fontFamily: '"Helvetica Neue", Arial, sans-serif',
        fontSize: 9, background: '#fff', color: '#000',
        width: '210mm',           /* ✅ FIXÉ : fixe, pas 100% */
        minHeight: '297mm',
        boxSizing: 'border-box',
        padding: '10mm 12mm',
        margin: '0 auto',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08), 0 8px 32px rgba(0,0,0,0.1)',
      }}>
        <div className="bul-no-break"><Header /></div>
        <div className="bul-no-break"><EmployeeInfo /></div>
        <div className="bul-no-break"><PayTable /></div>
        <div className="bul-no-break"><Cumuls /></div>

        {tpl.style.footerMessage && (
          <div style={{ borderTop: '1px solid #ccc', paddingTop: 5, marginTop: 6, fontSize: 8.5, fontStyle: 'italic', textAlign: 'center', color: '#444' }}>
            {tpl.style.footerMessage}
          </div>
        )}

        <div className="bul-no-break"><Signatures /></div>
        <Footer />

        <div className="bul-legal" style={{ marginTop: 8, borderTop: '1px dashed #ddd', paddingTop: 5 }}>
          <div style={{ fontSize: 7.5, color: '#666', textAlign: 'center' }}>
            Code du Travail — Loi n°45-75 · ITS 2026 barème progressif · CNSS 4% · SMIG 70 400 FCFA · KonzaRH
          </div>
        </div>
      </div>
    </>
  );
}