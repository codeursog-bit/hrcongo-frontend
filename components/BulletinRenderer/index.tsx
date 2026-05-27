'use client';

// ============================================================================
// components/BulletinRenderer/index.tsx
//
// Template DEFAULT — Reproduction fidèle du bulletin IESM Congo
// ✅ Format A4 portrait (210mm × 297mm) — impression optimisée
// ✅ Très lisible en noir & blanc : bordures solides, gras marqué, pas de couleur fonctionnelle
// ✅ 9 colonnes identiques au PDF IESM : N°, Désignation, Nombre, Base, Taux sal., Gain, Retenue sal., Taux pat., Retenue pat.
// ✅ En-tête entreprise (logo + adresse) | bandeau BULLETIN DE PAIE + mois
// ✅ Infos employé / contrat en grille double colonne
// ✅ Bloc cumuls période/année identique IESM
// ✅ Signatures deux colonnes
// ✅ Pied de page : coordonnées entreprise
// ✅ Utilisé comme template 'default' dans useBulletinConfig
// ============================================================================

import React, { useMemo } from 'react';
import type { BulletinPayroll, BulletinTemplateConfig } from '@/types/bulletin-template';
import { getBaseTemplate } from '@/lib/bulletin-templates';
import { classifyItems, getCnssEmpTotal, getTusDgi, getTusCnss, getCtaxEmpItems, getTotalCotisSal, getTotalCotisPat, getEmpColsForItem } from '@/lib/bulletin-items-classifier';
import BulletinRendererCorporate from '@/components/BulletinRendererCorporate';
import BulletinRendererAdmin     from '@/components/BulletinRendererAdmin';

export interface BulletinRendererProps {
  payroll:     BulletinPayroll;
  template?:   BulletinTemplateConfig;
  previewMode?: boolean;
}

// ─── Dispatcher : route vers le bon renderer selon templateId ─────────────────
// Ajouter ici les prochains templates sans toucher au code ci-dessous.

export default function BulletinRendererDispatcher(props: BulletinRendererProps) {
  const templateId = (props.template ?? getBaseTemplate('default')).templateId;
  if (templateId === 'corporate') return <BulletinRendererCorporate {...props} />;
  if (templateId === 'admin')     return <BulletinRendererAdmin     {...props} />;
  // 'moderne' | 'compact' | 'premium' → à venir
  return <BulletinRendererDefault {...props} />;
}

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

const fmt = (v: any) => Math.round(Number(v) || 0).toLocaleString('fr-FR');

function seniority(hireDate?: string): { years: number; months: number } {
  if (!hireDate) return { years: 0, months: 0 };
  const hire = new Date(hireDate);
  const now  = new Date();
  let y = now.getFullYear() - hire.getFullYear();
  let m = now.getMonth() - hire.getMonth();
  if (m < 0) { y--; m += 12; }
  return { years: y, months: m };
}

function formatDate(d?: string): string {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('fr-FR');
}

// ─── Styles de cellule communs ────────────────────────────────────────────────

const CELL: React.CSSProperties = {
  border: '1px solid #000',
  padding: '3px 5px',
  fontSize: 10,
  verticalAlign: 'middle',
};

const CELL_RIGHT: React.CSSProperties = { ...CELL, textAlign: 'right' };
const CELL_CENTER: React.CSSProperties = { ...CELL, textAlign: 'center' };

const TH: React.CSSProperties = {
  ...CELL,
  background: '#d0d0d0',
  fontWeight: 700,
  textAlign: 'center',
  fontSize: 9,
  padding: '4px 5px',
};

// ─── Composant principal ──────────────────────────────────────────────────────

function BulletinRendererDefault({ payroll, template, previewMode = false }: BulletinRendererProps) {
  const tpl = template ?? getBaseTemplate('default');
  const st  = tpl.style;

  // Résolution des données
  const e  = (payroll.employee  ?? {}) as any;
  const co = (payroll.company   ?? {}) as any;
  const items = payroll.items ?? [];

  const monthLabel = MONTHS[(payroll.month ?? 1) - 1];
  const sen        = seniority(e.hireDate);

  // ── Classification unifiée (bulletin-items-classifier.ts) ───────────────────
  const { gainItems: gainLines, cotisItems: cotisLines, indemItems: indemLines, retenueItems, empItems } = useMemo(
    () => classifyItems(items), [items]
  );

  const cnssEmpTotal  = getCnssEmpTotal(empItems, payroll);
  const tusEmpTotal   = getTusDgi(empItems, payroll) + getTusCnss(empItems, payroll);

  // Totaux (source de vérité = champs calculés API)
  const totalBrut  = payroll.grossSalary ?? 0;
  const totalGains = gainLines.reduce((s, i) => s + Number(i.amount), 0)
                   + indemLines.reduce((s, i) => s + Number(i.amount), 0);
  const totalRet   = getTotalCotisSal(cotisLines)
                   + retenueItems.reduce((s, i) => s + Number(i.amount), 0);
  const netSalary  = payroll.netSalary ?? 0;

  // Cumuls (estimation si pas de données annuelles)
  const month = payroll.month ?? 1;

  // ── Rendu : En-tête ─────────────────────────────────────────────────────────

  const renderHeader = () => (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 8,
      paddingBottom: 6,
      borderBottom: '2px solid #000',
    }}>
      {/* Logo + infos entreprise */}
      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', flex: 1 }}>
        {co.logo && (
          <div style={{ flexShrink: 0 }}>
            <img
              src={co.logo}
              alt="Logo"
              style={{ width: 60, height: 60, objectFit: 'contain', border: '1.5px solid #000', padding: 3 }}
            />
          </div>
        )}
        {!co.logo && (
          <div style={{
            border: '2px solid #000',
            padding: '6px 10px',
            fontWeight: 700,
            fontSize: 15,
            letterSpacing: 2,
            minWidth: 100,
            textAlign: 'center',
          }}>
            {(co.tradeName || co.legalName || 'ENTREPRISE').toUpperCase()}
            <div style={{ fontSize: 8.5, fontWeight: 400, marginTop: 2 }}>{co.address || ''}</div>
          </div>
        )}
        <div style={{ fontSize: 9, lineHeight: 1.7 }}>
          {co.address && <div>{co.address}{co.city ? `, ${co.city}` : ''}</div>}
          {co.phone   && <div>Tél : {co.phone}</div>}
          {co.email   && <div>Email : {co.email}</div>}
          {co.rccmNumber && <div>RCCM : {co.rccmNumber}</div>}
          {co.cnssNumber && <div>N° CNSS Employeur : {co.cnssNumber}</div>}
          {co.nif        && <div>NIU : {co.nif}</div>}
        </div>
      </div>

      {/* Titre bulletin */}
      <div style={{ textAlign: 'center', flexShrink: 0, marginLeft: 20 }}>
        <div style={{
          fontSize: 18,
          fontWeight: 900,
          letterSpacing: 4,
          textTransform: 'uppercase',
          border: '2px solid #000',
          padding: '6px 14px',
          background: '#000',
          color: '#fff',
        }}>
          BULLETIN DE PAIE
        </div>
        <div style={{ marginTop: 6, fontSize: 13, fontWeight: 700 }}>
          {monthLabel} &nbsp; {payroll.year}
        </div>
        {payroll.paymentDate && (
          <div style={{ fontSize: 9, marginTop: 3 }}>
            Paiement le : {formatDate(payroll.paymentDate)} &nbsp;—&nbsp; {PAYMENT[e.paymentMethod ?? ''] ?? 'Virement'}
          </div>
        )}
        {!payroll.paymentDate && (
          <div style={{ fontSize: 9, marginTop: 3 }}>
            par {PAYMENT[e.paymentMethod ?? ''] ?? 'Virement'}
          </div>
        )}
      </div>
    </div>
  );

  // ── Rendu : Infos employé ────────────────────────────────────────────────────

  const renderEmployeeInfo = () => {
    const fullName = [e.firstName, e.lastName].filter(Boolean).join(' ');
    const cat      = [e.professionalCategory, e.echelon ? `Echelon ${e.echelon}` : ''].filter(Boolean).join(' ');

    const leftRows: [string, string][] = [
      ['Matricule', e.employeeNumber || '—'],
      ['Etat civil', MARITAL[e.maritalStatus ?? ''] ?? '—'],
      ['Site', co.city || '—'],
      ['N° CNSS', e.cnssNumber || '—'],
      ['Compte auxiliaire', e.nationalIdNumber || ''],
      ['Convention', co.collectiveAgreement || 'Commerce'],
    ];
    const rightRows: [string, string][] = [
      ['N° Compte', `${co.bankCode || '30005'} ${co.bankBranch || '00363'} ${e.bankAccount || '—'}`],
      [`Ancienneté`, `${sen.years} an(s) et ${sen.months} mois`],
      ['Fonction', e.position || '—'],
      ['Nature de contrat', CONTRACT[e.contractType ?? ''] ?? '—'],
      ['Catégorie / Echelon', cat || '—'],
      ['Nombre d\'enfants', String(e.numberOfChildren ?? 0)],
      ['Date d\'embauche', formatDate(e.hireDate)],
      ['Nombre de parts', String((e.numberOfChildren ?? 0) + 1)],
    ];

    return (
      <div style={{ border: '1px solid #000', marginBottom: 6 }}>
        {/* Nom complet */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          borderBottom: '1px solid #000',
        }}>
          <div style={{ padding: '3px 6px', borderRight: '1px solid #000' }}>
            <span style={{ fontWeight: 700, fontSize: 10 }}>M &nbsp;</span>
            <span style={{ fontWeight: 900, fontSize: 11, textTransform: 'uppercase' }}>{fullName}</span>
          </div>
          <div style={{ padding: '3px 6px', fontSize: 10 }}>
            <strong>Site :</strong> {co.city || co.address || 'ADMINISTRATION'}
          </div>
        </div>

        {/* Grille infos : 2 colonnes interleaved */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
          {/* Colonne gauche */}
          <div style={{ borderRight: '1px solid #000' }}>
            {leftRows.map(([label, val]) => (
              <div key={label} style={{
                display: 'grid',
                gridTemplateColumns: '110px 1fr',
                borderBottom: '1px solid #aaa',
                fontSize: 9,
              }}>
                <div style={{ padding: '2px 6px', fontWeight: 700, borderRight: '1px solid #aaa', background: '#f5f5f5' }}>{label}</div>
                <div style={{ padding: '2px 6px' }}>{val}</div>
              </div>
            ))}
          </div>
          {/* Colonne droite */}
          <div>
            {rightRows.map(([label, val]) => (
              <div key={label} style={{
                display: 'grid',
                gridTemplateColumns: '130px 1fr',
                borderBottom: '1px solid #aaa',
                fontSize: 9,
              }}>
                <div style={{ padding: '2px 6px', fontWeight: 700, borderRight: '1px solid #aaa', background: '#f5f5f5' }}>{label}</div>
                <div style={{ padding: '2px 6px' }}>{val}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // ── Rendu : Tableau des lignes de paie (style IESM 9 colonnes) ──────────────

  const renderPayTable = () => {
    const brutGains     = gainLines.reduce((s, i) => s + Number(i.amount), 0);
    const totalCotisSal = getTotalCotisSal(cotisLines);
    const totalCotisPat = getTotalCotisPat(empItems, payroll);
    const totalGainsRow = brutGains
                        + indemLines.reduce((s, i) => s + Number(i.amount), 0)
                        + retenueItems.reduce((s, i) => s + Number(i.amount), 0);
    const totalRetenues = totalCotisSal + retenueItems.reduce((s, i) => s + Number(i.amount), 0);

    return (
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 10, marginBottom: 0 }}>
        <thead>
          <tr>
            <th style={{ ...TH, width: '4%' }}>N°</th>
            <th style={{ ...TH, width: '28%', textAlign: 'left' }}>Désignation</th>
            <th style={{ ...TH, width: '7%' }}>Nombre</th>
            <th style={{ ...TH, width: '9%' }}>Base</th>
            <th colSpan={3} style={{ ...TH, borderBottom: '1px solid #000' }}>Part salariale</th>
            <th colSpan={2} style={{ ...TH, borderBottom: '1px solid #000' }}>Part patronale</th>
          </tr>
          <tr>
            <th style={TH} />
            <th style={{ ...TH, textAlign: 'left' }} />
            <th style={TH} />
            <th style={TH} />
            <th style={{ ...TH, width: '6%' }}>Taux</th>
            <th style={{ ...TH, width: '12%' }}>Gain</th>
            <th style={{ ...TH, width: '11%' }}>Retenue</th>
            <th style={{ ...TH, width: '6%' }}>Taux</th>
            <th style={{ ...TH, width: '13%' }}>Retenue</th>
          </tr>
        </thead>
        <tbody>

          {/* ── GAINS (soumis brut) ── */}
          {gainLines.map((item: any, idx: number) => (
            <tr key={item.id ?? idx} style={{ background: idx % 2 === 0 ? '#fff' : '#fafafa' }}>
              <td style={{ ...CELL_CENTER, fontSize: 9 }}>{item.code?.replace('SAL_BASE','10').replace('HS_10','HS').replace('BONUS_','') || idx + 10}</td>
              <td style={{ ...CELL, fontWeight: item.code === 'SAL_BASE' ? 700 : 400 }}>{item.label}</td>
              <td style={CELL_RIGHT}>{item.code === 'SAL_BASE' ? fmt(payroll.workedDays ?? 26) : ''}</td>
              <td style={CELL_RIGHT}>{item.base ? fmt(item.base) : ''}</td>
              <td style={CELL_CENTER}>{item.rate && item.rate !== 1 ? `${Number(item.rate * 100).toFixed(0)}%` : ''}</td>
              <td style={{ ...CELL_RIGHT, fontWeight: 700 }}>{fmt(item.amount)}</td>
              <td style={CELL} />
              <td style={CELL} />
              <td style={CELL} />
            </tr>
          ))}

          {/* ── TOTAL BRUT ── */}
          <tr>
            <td colSpan={4} style={{ ...CELL, fontWeight: 900, textAlign: 'center', background: '#e0e0e0', fontSize: 10 }}>
              Total Brut
            </td>
            <td style={{ ...CELL, background: '#e0e0e0' }} />
            <td style={{ ...CELL_RIGHT, fontWeight: 900, background: '#e0e0e0', fontSize: 11 }}>{fmt(brutGains)}</td>
            <td style={{ ...CELL, background: '#e0e0e0' }} />
            <td style={{ ...CELL, background: '#e0e0e0' }} />
            <td style={{ ...CELL, background: '#e0e0e0' }} />
          </tr>

          {/* ── COTISATIONS SALARIALES avec colonnes patronales ── */}
          {cotisLines.map((item: any, idx: number) => {
            // Sur la ligne CNSS salariale : afficher aussi la colonne patronale
            const { tauxPat: empRate, retPat: empRetenue } = getEmpColsForItem(item, empItems, payroll);

            return (
              <tr key={item.id ?? idx} style={{ background: '#fff8f8' }}>
                <td style={{ ...CELL_CENTER, fontSize: 9 }}>{300 + idx}</td>
                <td style={CELL}>{item.label}</td>
                <td style={CELL} />
                <td style={CELL_RIGHT}>{item.base ? fmt(item.base) : ''}</td>
                <td style={CELL_CENTER}>{item.rate ? `${(Number(item.rate) * 100).toFixed(3)}` : ''}</td>
                <td style={CELL} />
                <td style={{ ...CELL_RIGHT, fontWeight: 700, color: '#000' }}>{fmt(item.amount)}</td>
                <td style={CELL_CENTER}>{empRate}</td>
                <td style={{ ...CELL_RIGHT, fontWeight: 700 }}>{empRetenue}</td>
              </tr>
            );
          })}

          {/* ── TOTAL COTISATIONS ── */}
          <tr>
            <td colSpan={4} style={{ ...CELL, fontWeight: 900, textAlign: 'center', background: '#e8e8e8', fontSize: 10 }}>
              Total Cotisations
            </td>
            <td style={{ ...CELL, background: '#e8e8e8' }} />
            <td style={{ ...CELL, background: '#e8e8e8' }} />
            <td style={{ ...CELL_RIGHT, fontWeight: 900, background: '#e8e8e8', fontSize: 11 }}>{fmt(totalCotisSal)}</td>
            <td style={{ ...CELL, background: '#e8e8e8' }} />
            <td style={{ ...CELL_RIGHT, fontWeight: 900, background: '#e8e8e8', fontSize: 11 }}>{fmt(totalCotisPat)}</td>
          </tr>

          {/* ── INDEMNITÉS HORS BRUT (transport, panier…) ── */}
          {indemLines.map((item: any, idx: number) => (
            <tr key={item.id ?? idx} style={{ background: '#fffff8' }}>
              <td style={{ ...CELL_CENTER, fontSize: 9 }}>{400 + idx}</td>
              <td style={CELL}>{item.label}</td>
              <td style={CELL_RIGHT}>{payroll.workedDays ? fmt(payroll.workedDays) : ''}</td>
              <td style={CELL_RIGHT}>{item.base ? fmt(item.base) : ''}</td>
              <td style={CELL} />
              <td style={{ ...CELL_RIGHT, fontWeight: 700 }}>{fmt(item.amount)}</td>
              <td style={CELL} />
              <td style={CELL} />
              <td style={CELL} />
            </tr>
          ))}

          {/* Ligne retenues diverses si présentes */}
          {payroll.absenceDeduction ? (
            <tr style={{ background: '#fff8f8' }}>
              <td style={{ ...CELL_CENTER, fontSize: 9 }}>ABS</td>
              <td style={CELL}>Retenue absence</td>
              <td style={CELL_RIGHT}>{payroll.absenceDays ?? 0}</td>
              <td style={CELL} />
              <td style={CELL} />
              <td style={CELL} />
              <td style={{ ...CELL_RIGHT, fontWeight: 700 }}>{fmt(payroll.absenceDeduction)}</td>
              <td style={CELL} />
              <td style={CELL} />
            </tr>
          ) : null}

          {/* Séparateur */}
          <tr><td colSpan={9} style={{ borderTop: '1px dashed #999', borderLeft: '1px solid #000', borderRight: '1px solid #000', padding: 0, height: 2 }} /></tr>

          {/* ── TOTAL GAINS ── */}
          <tr>
            <td style={{ ...CELL_CENTER, fontSize: 9 }}>990</td>
            <td style={{ ...CELL, fontWeight: 900 }}>TOTAL GAINS</td>
            <td style={CELL} />
            <td style={CELL} />
            <td style={CELL} />
            <td style={{ ...CELL_RIGHT, fontWeight: 900, fontSize: 11 }}>{fmt(totalGainsRow)}</td>
            <td style={CELL} />
            <td style={CELL} />
            <td style={CELL} />
          </tr>

          {/* ── TOTAL RETENUES ── */}
          <tr>
            <td style={{ ...CELL_CENTER, fontSize: 9 }}>995</td>
            <td style={{ ...CELL, fontWeight: 900 }}>TOTAL RETENUES</td>
            <td style={CELL} />
            <td style={CELL} />
            <td style={CELL} />
            <td style={CELL} />
            <td style={{ ...CELL_RIGHT, fontWeight: 900, fontSize: 11 }}>{fmt(totalRetenues)}</td>
            <td style={CELL} />
            <td style={CELL} />
          </tr>

        </tbody>
      </table>
    );
  };

  // ── Rendu : Cumuls + NET À PAYER ──────────────────────────────────────────

  const renderCumuls = () => {
    const cols = [
      { label: 'Salaire brut',       period: payroll.grossSalary,                   year: (payroll.grossSalary ?? 0) * month },
      { label: 'Charges salariales', period: payroll.cnssSalarial,                  year: (payroll.cnssSalarial ?? 0) * month },
      { label: 'Charges patronales', period: cnssEmpTotal,                           year: cnssEmpTotal * month },
      { label: 'Avantages en nature',period: 0,                                      year: 0 },
      { label: 'Net imposable',       period: (payroll.grossSalary ?? 0) - (payroll.cnssSalarial ?? 0), year: ((payroll.grossSalary ?? 0) - (payroll.cnssSalarial ?? 0)) * month },
      { label: 'Heures travaillées', period: (payroll.workedDays ?? 0) * 8,          year: (payroll.workedDays ?? 0) * 8 * month, unit: '' },
      { label: 'Heures suppl.',       period: (payroll.overtimeHours10 ?? 0) + (payroll.overtimeHours25 ?? 0) + (payroll.overtimeHours50 ?? 0) + (payroll.overtimeHours100 ?? 0), year: 0, unit: '' },
      { label: 'Base Congés',         period: payroll.baseSalary,                    year: (payroll.baseSalary ?? 0) * month },
    ];

    const thC: React.CSSProperties = {
      border: '1px solid #000',
      background: '#555',
      color: '#fff',
      fontWeight: 700,
      fontSize: 8,
      padding: '3px 5px',
      textAlign: 'center',
      whiteSpace: 'nowrap',
    };
    const tdC: React.CSSProperties = {
      border: '1px solid #aaa',
      fontSize: 9,
      textAlign: 'center',
      padding: '3px 4px',
    };

    return (
      <div style={{ display: 'flex', alignItems: 'stretch', borderTop: '2px solid #000', marginTop: 0 }}>
        <table style={{ flex: 1, borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ ...thC, width: 55 }}></th>
              {cols.map(c => (
                <th key={c.label} style={thC}>{c.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ ...tdC, fontWeight: 700, background: '#f0f0f0' }}>Période</td>
              {cols.map(c => (
                <td key={c.label} style={{ ...tdC, fontFamily: 'monospace', fontWeight: 600 }}>
                  {c.period != null ? fmt(c.period) : '0'}
                </td>
              ))}
            </tr>
            <tr>
              <td style={{ ...tdC, fontWeight: 700, background: '#f0f0f0' }}>Année</td>
              {cols.map(c => (
                <td key={c.label} style={{ ...tdC, fontFamily: 'monospace' }}>
                  {c.year != null ? fmt(c.year) : '0'}
                </td>
              ))}
            </tr>
          </tbody>
        </table>

        {/* NET À PAYER — bloc noir imposant */}
        <div style={{
          border: '2px solid #000',
          background: '#000',
          color: '#fff',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          minWidth: 120,
          padding: '8px 12px',
          flexShrink: 0,
        }}>
          <div style={{ fontSize: 8, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4, whiteSpace: 'nowrap' }}>
            NET A PAYER
          </div>
          <div style={{ fontSize: 18, fontWeight: 900, fontFamily: 'monospace', whiteSpace: 'nowrap' }}>
            {fmt(netSalary)}
          </div>
        </div>
      </div>
    );
  };

  // ── Rendu : Signatures ────────────────────────────────────────────────────

  const renderSignatures = () => (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 30,
      padding: '12px 0 8px',
      borderTop: '1px solid #aaa',
      marginTop: 8,
    }}>
      {[
        { label: "Signature de l'Employé(e)", sub: '' },
        { label: "Signature et cachet de l'Employeur", sub: '' },
      ].map(s => (
        <div key={s.label} style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 10, fontWeight: 700, marginBottom: 4 }}>{s.label}</div>
          <div style={{ height: 55, borderBottom: '1.5px solid #000' }} />
        </div>
      ))}
    </div>
  );

  // ── Rendu : Pied de page ───────────────────────────────────────────────────

  const renderFooter = () => (
    <div style={{
      borderTop: '1.5px solid #000',
      paddingTop: 4,
      textAlign: 'center',
      fontSize: 8,
      color: '#333',
      marginTop: 6,
    }}>
      {[
        co.phone      ? `Tél. : ${co.phone}`              : null,
        co.address    ? `${co.address}${co.city ? ', ' + co.city : ''}` : null,
        co.email      ? `Email : ${co.email}`              : null,
        co.rccmNumber ? `RCCM : ${co.rccmNumber}`          : null,
        co.nif        ? `NIU : ${co.nif}`                  : null,
      ].filter(Boolean).join(' · ')}
    </div>
  );

  // ── Assemblage final ────────────────────────────────────────────────────────

  return (
    <>
      <style>{`
        @media print {
          #bulletin-root {
            width: 210mm !important;
            min-height: 297mm !important;
            font-size: 10px !important;
            padding: 10mm 12mm !important;
            margin: 0 !important;
          }
          .no-break { page-break-inside: avoid !important; break-inside: avoid !important; }
          .bulletin-legal { display: none !important; }
          @page { size: A4 portrait; margin: 0; }
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        }
      `}</style>

      <div
        id="bulletin-root"
        style={{
          fontFamily: '"Arial", "Helvetica Neue", sans-serif',
          fontSize: 10,
          background: '#fff',
          color: '#000',
          width: previewMode ? '100%' : '210mm',
          minHeight: previewMode ? 'auto' : '297mm',
          boxSizing: 'border-box',
          padding: previewMode ? 16 : '10mm 12mm',
          margin: '0 auto',
          position: 'relative',
        }}
      >
        {/* En-tête */}
        <div className="no-break">{renderHeader()}</div>

        {/* Infos employé */}
        <div className="no-break">{renderEmployeeInfo()}</div>

        {/* Tableau principal */}
        <div className="no-break" style={{ marginBottom: 0 }}>
          {renderPayTable()}
        </div>

        {/* Cumuls + NET À PAYER */}
        <div className="no-break">
          {renderCumuls()}
        </div>

        {/* Message employeur */}
        {st.footerMessage && (
          <div style={{ borderTop: '1px solid #aaa', paddingTop: 6, marginTop: 6, fontSize: 9, fontStyle: 'italic', textAlign: 'center', color: '#444' }}>
            {st.footerMessage}
          </div>
        )}

        {/* Signatures */}
        <div className="no-break">{renderSignatures()}</div>

        {/* Pied de page entreprise */}
        {renderFooter()}

        {/* Mentions légales — masquées à l'impression */}
        <div className="bulletin-legal" style={{ marginTop: 10, borderTop: '1px dashed #ccc', paddingTop: 6 }}>
          <div style={{ fontSize: 8, color: '#444', textAlign: 'center' }}>
            Code du Travail — Loi n°45-75 · ITS 2026 barème progressif · CNSS 4% · SMIG 70 400 FCFA · KonzaRH
          </div>
        </div>
      </div>
    </>
  );
}