'use client';

// ============================================================================
// components/BulletinRendererInf/index.tsx
//
// Gabarit "Bulletin de paie — modèle INF" — reproduit à l'identique le
// modèle Excel fourni par le client (MODEL_BULLETIN_INF.xlsx / logo ARKIA) :
//   - En-tête : logo entreprise à gauche, titre "BULLETIN DE PAIE" +
//     période / mode de paiement / mois-année à droite.
//   - Bloc identité bicolonne encadré : à gauche les infos "entreprise ↔
//     salarié" (conv. collective, embauche, ancienneté, emploi,
//     département, catégorie, banque), à droite matricule / nom / n°CNSS /
//     situation familiale / enfants / parts ITS, avec un encart "Localité"
//     qui occupe toute la hauteur du bloc à l'extrême droite (fidèle au
//     fichier source).
//   - Tableau principal numéroté (N° / Désignation / Nombre / Base /
//     Part salariale [Taux, Gain, Retenue] / Part patronale [Taux,
//     Retenue]) — même classification d'items que les 3 autres gabarits
//     (classifyItems), pour rester cohérent quels que soient les items
//     réellement présents sur la paie (CTAX_*, prêts, avances, TUS…).
//   - Bloc "Cumuls" (Mensuel/Annuel) + encart "NET A PAYER" à droite.
//   - Signatures + mention légale.
//
// Même architecture "canevas A4 fixe" que BulletinRendererClassique/
// BulletinRendererDefault : page 210mm × 297mm, overflow hidden, colonne
// flex, tableau principal en flex:1 pour occuper l'espace restant sans
// déborder ni couper de page à l'impression.
// ============================================================================

import React, { useMemo } from 'react';
import type { BulletinPayroll, BulletinTemplateConfig, PayrollItem } from '@/types/bulletin-template';
import { classifyItems } from '@/lib/bulletin-items-classifier';
import { getBaseTemplate } from '@/lib/bulletin-templates';

export interface BulletinRendererInfProps {
  payroll:      BulletinPayroll;
  template?:    BulletinTemplateConfig;
  previewMode?: boolean;
}

const MARITAL: Record<string,string> = {
  SINGLE:'Célibataire', MARRIED:'Marié', DIVORCED:'Divorcé(e)',
  WIDOWED:'Veuf/Veuve', COHABITING:'Union libre',
};
const PAYMENT: Record<string,string> = {
  BANK_TRANSFER:'Virement', CASH:'Espèces', MOBILE_MONEY:'Mobile Money', CHECK:'Chèque',
};
const MOIS: { name: string; elide: boolean }[] = [
  { name: 'JANVIER',   elide: false }, { name: 'FÉVRIER',  elide: false },
  { name: 'MARS',      elide: false }, { name: 'AVRIL',    elide: true  },
  { name: 'MAI',       elide: false }, { name: 'JUIN',     elide: false },
  { name: 'JUILLET',   elide: false }, { name: 'AOÛT',     elide: true  },
  { name: 'SEPTEMBRE', elide: false }, { name: 'OCTOBRE',  elide: true  },
  { name: 'NOVEMBRE',  elide: false }, { name: 'DÉCEMBRE', elide: false },
];

const nv    = (v: any): number => { const x = Number(v); return isFinite(x) ? x : 0; };
const fmt   = (v: any): string  => { const x = Math.round(nv(v)); return x === 0 ? '' : x.toLocaleString('fr-FR'); };
const fmtZ  = (v: any): string  => Math.round(nv(v)).toLocaleString('fr-FR');
const fmtDate = (d?: string)    => d ? new Date(d).toLocaleDateString('fr-FR') : '—';
// ── Affiche une valeur optionnelle telle que fournie par le back, ou une
// cellule vide si le back ne l'a pas renvoyée (jamais de valeur devinée).
const fmtOpt = (v: number | null | undefined): string => v == null ? '' : fmtZ(v);

// ── "Mois de : D'AOUT" — libellé mois en majuscules avec élision ───────────
function moisLabel(month?: number): string {
  const m = MOIS[(nv(month) - 1 + 12) % 12];
  if (!m) return '—';
  return (m.elide ? "D'" : 'DE ') + m.name;
}

// ── Ancienneté au format compact du modèle source ("0ans 12 mois") ─────────
function seniority(hireDate?: string, asOf?: Date): string {
  if (!hireDate) return '—';
  const hire = new Date(hireDate);
  const now  = asOf ?? new Date();
  if (isNaN(hire.getTime())) return '—';

  let months = (now.getFullYear() - hire.getFullYear()) * 12 + (now.getMonth() - hire.getMonth());
  if (now.getDate() < hire.getDate()) months--;
  if (months < 0 || !isFinite(months)) months = 0;

  const y = Math.floor(months / 12);
  const m = months % 12;
  return `${y}ans ${m} mois`;
}

// ── Catégorie au format "Cat 11/ 1" du modèle source ────────────────────────
function formatCategorie(code: string | null | undefined): string {
  if (!code) return '—';
  const m = code.match(/^[A-Z]+(\d+)-E(\d+)$/i);
  if (m) return `Cat ${m[1]}/ ${m[2]}`;
  const m2 = code.match(/^E(\d+)-(\d+)$/i);
  if (m2) return `Cat ${m2[1]}/ ${m2[2]}`;
  return code;
}

function cleanLabel(label: string): string {
  if (!label) return label;
  if (/taxe.{0,10}occupation.{0,10}locaux/i.test(label)) return 'TOL';
  // ✅ On retire tout justificatif entre parenthèses ("(26h)", "(8%)",
  // "(part patronale)", "(2 jours)"…) ainsi que toute précision après un
  // tiret cadratin ("— 5 premières heures") : le taux/la base figurent déjà
  // dans leurs propres colonnes sur la ligne, pas besoin de les répéter
  // dans le libellé.
  return label
    .replace(/\s*\([^)]*\)/g, '')
    .replace(/\s*—\s*.*$/, '')
    .replace(/\s+/g, ' ')
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
  if (r > 0 && r < 1) return (r * 100).toFixed(3).replace('.', ',').replace(/,?0+$/, '') + '%';
  return (Number.isInteger(r) ? String(r) : r.toFixed(2).replace('.', ',')) + '%';
}

// ── Tokens visuels — fidèles au fichier Excel source ────────────────────────
const SANS   = 'Arial,Helvetica,sans-serif';
const BD     = '0.5px solid #000';
const BDB    = '1px solid #000';
const HDR_BG = '#A6CAEC'; // bleu clair des en-têtes (Excel: 166,202,236)
const K      = '#000';

const ROW_H  = 16.5;
const HEAD_H = 18;
const FS     = 9;

const th = (o?: React.CSSProperties): React.CSSProperties => ({
  border: BD, padding: '1px 3px', fontSize: 8.3, fontWeight: 700,
  textAlign: 'center', background: HDR_BG, fontFamily: SANS,
  verticalAlign: 'middle', color: K, height: HEAD_H, lineHeight: `${HEAD_H}px`,
  overflow: 'hidden', ...o,
});
const td = (o?: React.CSSProperties): React.CSSProperties => ({
  borderLeft: BD, borderRight: 'none', borderTop: 'none', borderBottom: 'none',
  padding: '0 4px', height: ROW_H, lineHeight: `${ROW_H}px`, fontSize: FS,
  verticalAlign: 'middle', color: K, fontFamily: SANS, background: '#fff',
  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', ...o,
});
const tdR = (o?: React.CSSProperties) => td({ textAlign: 'right', ...o });
const tdC = (o?: React.CSSProperties) => td({ textAlign: 'center', ...o });

const Row = ({ n, label, nombre = '', base = '', tauxS = '', gain = '', ret = '', tauxP = '', retP = '', bold = false }:
  { n?: number | string; label: string; nombre?: string; base?: string; tauxS?: string; gain?: string; ret?: string; tauxP?: string; retP?: string; bold?: boolean }) => (
  <tr style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}>
    <td style={tdC({ fontSize: 8.3 })}>{n ?? ''}</td>
    <td style={td({ paddingLeft: 5, fontWeight: bold ? 700 : 400 })}>{cleanLabel(label)}</td>
    <td style={tdR()}>{nombre}</td>
    <td style={tdR()}>{base}</td>
    <td style={tdC({ fontSize: 8 })}>{tauxS}</td>
    <td style={tdR({ fontWeight: gain ? 600 : 400 })}>{gain}</td>
    <td style={tdR({ fontWeight: ret ? 600 : 400 })}>{ret}</td>
    <td style={tdC({ fontSize: 8 })}>{tauxP}</td>
    <td style={tdR({ fontWeight: retP ? 600 : 400, borderRight: BD })}>{retP}</td>
  </tr>
);

const TotalRow = ({ n, label, gain = '', ret = '' }: { n?: number | string; label: string; gain?: string; ret?: string }) => (
  <tr style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}>
    <td style={tdC({ fontSize: 8.3, fontWeight: 800 })}>{n ?? ''}</td>
    <td colSpan={3} style={{ ...td({ fontWeight: 800, fontSize: 10.5, borderTop: BDB, borderBottom: BDB }) }}>{label}</td>
    <td style={{ ...td({ borderTop: BDB, borderBottom: BDB }) }} />
    <td style={{ ...tdR({ fontWeight: 800, fontSize: 10.5, borderTop: BDB, borderBottom: BDB }) }}>{gain}</td>
    <td style={{ ...tdR({ fontWeight: 800, fontSize: 10.5, borderTop: BDB, borderBottom: BDB }) }}>{ret}</td>
    <td style={{ ...td({ borderTop: BDB, borderBottom: BDB }) }} />
    <td style={{ ...td({ borderTop: BDB, borderBottom: BDB, borderRight: BD }) }} />
  </tr>
);

const DashRow = () => (
  <tr>
    <td colSpan={9} style={{ borderLeft: BD, borderRight: BD, borderBottom: '1px dashed #000', height: 2, padding: 0 }} />
  </tr>
);

const InfoField = ({ label, value, labelWidth = 108 }: { label: string; value: React.ReactNode; labelWidth?: number }) => (
  <div style={{ display: 'flex', gap: 4, fontSize: 9, padding: '2.5px 0' }}>
    <span style={{ fontWeight: 700, minWidth: labelWidth, flexShrink: 0, color: K }}>{label}</span>
    <span style={{ color: K, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{value}</span>
  </div>
);

export default function BulletinRendererInf({ payroll, template, previewMode }: BulletinRendererInfProps) {
  const tpl = template ?? getBaseTemplate('classique');
  const e   = (payroll.employee ?? {}) as any;
  const co  = (payroll.company  ?? {}) as any;
  const items: PayrollItem[] = payroll.items ?? [];
  const ytd = (payroll as any).ytd ?? {};

  // ✅ Le classifier ne sert plus qu'au tri gains/indemnités (isTaxable/
  // isCnss) — pour les cotisations/charges, on lit directement les items
  // tels que produits par payroll-items.service.ts (source de vérité
  // unique : chaque ligne du bulletin = un item réel du back, jamais une
  // valeur recalculée côté front).
  const { gainItems, indemItems } = useMemo(
    () => classifyItems(items), [items],
  );

  const findItem = (code: string) => items.find((i: any) => i.code === code);

  // ── Cotisations salariales ────────────────────────────────────────────
  const cnssSalItem   = findItem('CNSS_SAL');
  const itsItem       = findItem('ITS') ?? findItem('BNC_SOURCE');
  const absCongeItem  = findItem('ABS_CONGE');
  const ctaxSalItems  = items.filter((i: any) => typeof i.code === 'string' && i.code.startsWith('CTAX_') && !i.code.startsWith('CTAX_EMP_'));
  const loanItemsList     = items.filter((i: any) => i.code === 'LOAN');
  const advanceItemsList  = items.filter((i: any) => i.code === 'ADVANCE');
  const companyDeductions = items.filter((i: any) => i.code === 'COMPANY_DEDUCTION');

  // ── Charges patronales — CNSS en 3 lignes distinctes + TUS DGI/CNSS ────
  // (mêmes codes que payroll-items.service.ts §10-11 : CNSS_EMP_PENSION,
  // CNSS_EMP_FAM, CNSS_EMP_AT, TUS_DGI, TUS_CNSS)
  const cnssEmpPensionItem = findItem('CNSS_EMP_PENSION');
  const cnssEmpFamItem     = findItem('CNSS_EMP_FAM');
  const cnssEmpAtItem      = findItem('CNSS_EMP_AT');
  const tusDgiItem         = findItem('TUS_DGI');
  const tusCnssItem        = findItem('TUS_CNSS');
  const ctaxPatItems       = items.filter((i: any) => typeof i.code === 'string' && i.code.startsWith('CTAX_EMP_'));

  const cnssSal    = nv(cnssSalItem?.amount ?? payroll.cnssSalarial);
  const itsAmount  = nv(itsItem?.amount ?? payroll.its);
  const itsLabel   = itsItem?.label || 'ITS Mensuel';
  const totalBrut  = nv(payroll.grossSalary);
  const netSalary  = nv(payroll.netSalary);
  const cnssEmpPension  = nv(cnssEmpPensionItem?.amount ?? payroll.cnssEmployerPension);
  const cnssEmpFamily   = nv(cnssEmpFamItem?.amount     ?? payroll.cnssEmployerFamily);
  const cnssEmpAccident = nv(cnssEmpAtItem?.amount      ?? payroll.cnssEmployerAccident);
  const tusDgi  = nv(tusDgiItem?.amount  ?? (payroll as any).tusDgiAmount);
  const tusCnss = nv(tusCnssItem?.amount ?? (payroll as any).tusCnssAmount);

  const absDeductItem = gainItems.find((i: any) => i.code === 'ABS_DEDUCT') ?? null;
  const gains = gainItems.filter((i: any) => !['ABS_DEDUCT','ABS_CONGE'].includes(i.code));

  // ✅ AUCUN recalcul de paie ici — "Total Cotisations" / "TOTAL RETENUES" /
  // "Charges patronales" sont les totaux DÉJÀ calculés et stockés par le
  // moteur de paie sur le bulletin lui-même (payroll.totalDeductions,
  // payroll.totalEmployerCost). Le composant les affiche tels quels, il ne
  // les reconstruit jamais en additionnant les items un par un — ça
  // éviterait tout écart d'arrondi ou d'item non prévu par rapport au vrai
  // moteur de calcul.
  const totalPat       = nv(payroll.totalEmployerCost);
  const totalCotisSal  = nv(payroll.totalDeductions);

  // ✅ "TOTAL GAINS" (rubrique 9900) n'existe pas comme champ unique côté
  // back : c'est, comme sur le fichier Excel source, la somme visuelle du
  // Total Brut + des indemnités hors brut affichées juste au-dessus
  // (transport, salissure…) — un sous-total d'affichage, pas un calcul de
  // paie. indemItems.amount vient lui aussi intégralement du back.
  const indemTotal = indemItems.reduce((s: number, i: any) => s + nv(i.amount), 0);
  const totalGains = totalBrut + indemTotal;

  // ── Cumuls annuels — uniquement si le back les fournit réellement ──────
  // (aucune estimation "mensuel × 12" ni repli sur le mois en cours : si
  // l'objet ytd est absent, les cellules "Annuel" restent vides).
  const hasYtd     = (payroll as any).ytd != null;
  const ytdGross     = hasYtd ? nv(ytd.grossSalary)   : null;
  const ytdCnss       = hasYtd ? nv(ytd.cnssSalarial)   : null;
  const ytdCnssEmp   = hasYtd ? nv(ytd.cnssEmployer)   : null;
  const ytdIts         = hasYtd ? nv(ytd.its)             : null;
  const ytdBaseConge = hasYtd ? nv(ytd.baseConge)   : null;

  // ✅ "Net Imposable" / "Base Congé" / "Jrs Congé" — champs optionnels
  // renvoyés par le back s'il les calcule ; sinon on laisse la cellule
  // vide plutôt que de deviner une formule côté rendu.
  const netImposable   = (payroll as any).netImposable ?? null;
  const baseConge       = (payroll as any).baseConge ?? null;
  const joursCongeMois = (payroll as any).congesAcquisMois ?? null;

  const periodStart = `01/${String(payroll.month ?? 1).padStart(2,'0')}/${payroll.year}`;
  const periodEnd   = `${new Date(payroll.year, payroll.month, 0).getDate()}/${String(payroll.month ?? 1).padStart(2,'0')}/${payroll.year}`;
  const fullName    = [e.civility === 'FEMALE' ? 'Mme' : 'M', e.firstName, e.lastName?.toUpperCase()].filter(Boolean).join(' ');
  const cat = formatCategorie(e.professionalCategory);
  const rawDept  = e.department?.name ?? '';
  const deptName = /no.dep/i.test(rawDept) || rawDept.trim() === '' ? '—' : rawDept;

  let rubGain  = 100;
  let rubIndem = 4100;

  return (
    <>
      <style>{`
        @media print {
          @page { size: A4 portrait; margin: 8mm 6mm; }
          body { visibility: hidden !important; background: #fff !important; margin: 0 !important; padding: 0 !important; }
          #bul-wrap, #bul-wrap * { visibility: visible !important; }
          #bul-wrap { position: absolute !important; top: 0 !important; left: 0 !important; width: 100% !important; }
          #bul-inf {
            width: 195mm !important; height: 277mm !important; min-height: unset !important;
            padding: 6mm 7mm !important; margin: 0 auto !important;
            box-shadow: none !important; border: none !important; overflow: hidden !important;
          }
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          .nobreak, tr { page-break-inside: avoid !important; break-inside: avoid !important; }
        }
        #main-grid-inf {
          width: 100%; table-layout: fixed; border-collapse: collapse;
          border: ${BD}; height: 100%;
        }
        #main-grid-inf td, #main-grid-inf th { color: #000 !important; }
      `}</style>

      <div id="bul-wrap" data-bulletin-root="true" style={{ background: '#fff' }}>
      <div id="bul-inf" style={{
        fontFamily: SANS, fontSize: 9, lineHeight: 1.25, background: '#fff', color: K,
        width: '210mm', height: '297mm', boxSizing: 'border-box', padding: '6mm 7mm',
        margin: '0 auto', boxShadow: '0 2px 16px rgba(0,0,0,0.10)',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
      }}>

        {/* ══ EN-TÊTE : logo + titre/période ═══════════════════════════ */}
        <table className="nobreak" style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 6, flexShrink: 0 }}>
          <tbody>
            <tr>
              <td style={{ width: '38%', verticalAlign: 'top', padding: '0 10px 0 0' }}>
                {tpl.style.showLogo !== false && co.logo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={co.logo} alt="" crossOrigin="anonymous" style={{ maxHeight: 62, maxWidth: '100%', objectFit: 'contain' }} />
                ) : (
                  <div style={{ fontWeight: 800, fontSize: 15, overflow: 'hidden' }}>{co.tradeName || co.legalName || '—'}</div>
                )}
              </td>
              <td style={{ width: '62%', verticalAlign: 'top' }}>
                <div style={{ textAlign: 'right', fontSize: 23, fontWeight: 900, letterSpacing: .5, textTransform: 'uppercase' as const, fontFamily: SANS }}>
                  Bulletin de paie
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 4 }}>
                  <tbody>
                    <tr>
                      <td style={{ fontSize: 9, padding: '1px 0' }}><strong>Période du :</strong> {periodStart} au {periodEnd}</td>
                      <td style={{ fontSize: 9, padding: '1px 0', width: '18%' }}><strong>Mois de :</strong></td>
                      <td style={{ fontSize: 9, padding: '1px 0', width: '18%' }}><strong>Année :</strong></td>
                    </tr>
                    <tr>
                      <td style={{ fontSize: 9, padding: '1px 0' }}>
                        <strong>Paie :</strong> Le 5 du mois suivant &nbsp; par <strong>{PAYMENT[e.paymentMethod ?? ''] || 'Virement'}</strong>
                      </td>
                      <td style={{ fontSize: 9, padding: '1px 0', fontWeight: 700 }}>{moisLabel(payroll.month)}</td>
                      <td style={{ fontSize: 9, padding: '1px 0', fontWeight: 700 }}>{payroll.year}</td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>
          </tbody>
        </table>

        {/* ══ BLOC IDENTITÉ — encadré bicolonne + encart Localité ══════ */}
        <table className="nobreak" style={{ width: '100%', borderCollapse: 'collapse', border: BDB, marginBottom: 6, tableLayout: 'fixed', flexShrink: 0 }}>
          <tbody>
            <tr>
              <td style={{ width: '46%', verticalAlign: 'top', padding: '4px 8px', borderRight: BDB }}>
                <InfoField label="Conv. Coll:"        value={co.collectiveAgreement || '—'} labelWidth={98} />
                <InfoField label="Date d'embauche:"   value={fmtDate(e.hireDate)} labelWidth={98} />
                <InfoField label="Ancienneté:"        value={seniority(e.hireDate, new Date(payroll.year, payroll.month, 0))} labelWidth={98} />
                <InfoField label="Emploi:"             value={e.position || '—'} labelWidth={98} />
                <InfoField label="Département:"       value={deptName} labelWidth={98} />
                <InfoField label="Catégorie:"          value={cat} labelWidth={98} />
                <InfoField label="Code Banque:"        value={e.bankCode || ''} labelWidth={98} />
                <InfoField label="Nom Banque:"         value={e.bankName || ''} labelWidth={98} />
              </td>
              <td style={{ width: '39%', verticalAlign: 'top', padding: '4px 8px' }}>
                <InfoField label="Matricule:"              value={e.employeeNumber || '—'} labelWidth={116} />
                <InfoField label="M:"                      value={fullName || '—'} labelWidth={116} />
                <InfoField label="N° CNSS :"                value={e.cnssNumber || '—'} labelWidth={116} />
                <InfoField label="Situation Familiale :"    value={MARITAL[e.maritalStatus ?? ''] || '—'} labelWidth={116} />
                <InfoField label="Nbre d'enfants :"         value={e.numberOfChildren ?? '—'} labelWidth={116} />
                <InfoField label="Nbre parts ITS :"         value={(payroll as any).irppFiscalParts ?? '—'} labelWidth={116} />
              </td>
              <td style={{ width: '15%', verticalAlign: 'top', padding: '4px 8px', borderLeft: BDB }}>
                <div style={{ fontSize: 9, fontWeight: 700 }}>Localité:</div>
                <div style={{ fontSize: 9, marginTop: 2 }}>{co.city || '—'}</div>
              </td>
            </tr>
          </tbody>
        </table>

        {/* ══ TABLEAU PRINCIPAL — canevas fixe, remplit l'espace restant ═ */}
        <div style={{ flex: 1, minHeight: 0, position: 'relative' }}>
          <table id="main-grid-inf">
            <colgroup>
              <col style={{ width: '5%'  }} /><col style={{ width: '26%' }} />
              <col style={{ width: '9%'  }} /><col style={{ width: '9%'  }} />
              <col style={{ width: '6%'  }} /><col style={{ width: '13%' }} />
              <col style={{ width: '13%' }} /><col style={{ width: '6%'  }} />
              <col style={{ width: '13%' }} />
            </colgroup>
            <thead>
              <tr>
                <th rowSpan={2} style={th()}>N°</th>
                <th rowSpan={2} style={th({ textAlign: 'left', paddingLeft: 5 })}>Désignation</th>
                <th rowSpan={2} style={th()}>Nombre</th>
                <th rowSpan={2} style={th()}>Base</th>
                <th colSpan={3} style={th()}>Part salariale</th>
                <th colSpan={2} style={th()}>Part patronale</th>
              </tr>
              <tr>
                <th style={th({ fontSize: 7.5 })}>Taux</th>
                <th style={th({ fontSize: 7.5 })}>Gain</th>
                <th style={th({ fontSize: 7.5 })}>Retenue</th>
                <th style={th({ fontSize: 7.5 })}>Taux</th>
                <th style={th({ fontSize: 7.5 })}>Retenue</th>
              </tr>
            </thead>
            <tbody>
              {/* ── Gains soumis au brut ──────────────────────────────── */}
              {gains.map((item: any, idx: number) => { const n = rubGain; rubGain += 100; return (
                <Row key={item.id || item.code || idx} n={n} label={item.label}
                  nombre={item.quantity != null && nv(item.quantity) !== 0 ? String(nv(item.quantity)) : (payroll.workedDays ? String(payroll.workedDays) + '.00' : '')}
                  base={itemBase(item)} gain={fmt(item.amount)} bold={item.code === 'SAL_BASE'} />
              ); })}
              {absDeductItem && (
                <Row label={absDeductItem.label}
                  base={absDeductItem.base ? Math.round(Number(absDeductItem.base)).toLocaleString('fr-FR') : ''}
                  ret={fmt(absDeductItem.amount)} />
              )}

              <TotalRow label="Total Brut" gain={fmtZ(totalBrut)} />

              {/* ── Cotisations obligatoires — pas de N° de rubrique ────
                   Chaque ligne = un item réel renvoyé par
                   payroll-items.service.ts (label, taux, montant lus
                   directement dessus — jamais recalculés ici). ─────────── */}
              <Row label={cnssSalItem?.label || 'Cotisation CNSS'}
                base={itemBase(cnssSalItem) || fmtZ(totalBrut)}
                tauxS={itemTaux(cnssSalItem) || '4%'} ret={fmt(cnssSal)} />

              {/* CNSS patronale — 3 branches distinctes (ou 1 seule pour un
                  stagiaire, cf. §10 du service : accidents du travail
                  uniquement). Libellés courts, sans le taux entre
                  parenthèses — le taux est déjà visible dans la colonne
                  "Taux" juste à côté. */}
              {cnssEmpPension  > 0 && (
                <Row label="CNSS Pension" tauxP={itemTaux(cnssEmpPensionItem) || '8%'} retP={fmt(cnssEmpPension)} />
              )}
              {cnssEmpFamily   > 0 && (
                <Row label="CNSS Famille" tauxP={itemTaux(cnssEmpFamItem) || '10,03%'} retP={fmt(cnssEmpFamily)} />
              )}
              {cnssEmpAccident > 0 && (
                <Row label="CNSS Accidents" tauxP={itemTaux(cnssEmpAtItem) || '2,25%'} retP={fmt(cnssEmpAccident)} />
              )}

              <Row label={itsLabel} ret={fmt(itsAmount)} />

              {absCongeItem && (
                <Row label={absCongeItem.label} ret={fmt(absCongeItem.amount)} />
              )}

              {/* Taxes custom (CompanyTax) — part salariale (CTAX_*) puis
                  part patronale (CTAX_EMP_*), une ligne par taxe */}
              {ctaxSalItems.map((item: any) => (
                <Row key={item.id || item.code} label={item.label} base={itemBase(item)} tauxS={itemTaux(item)} ret={fmt(item.amount)} />
              ))}
              {ctaxPatItems.map((item: any) => (
                <Row key={item.id || item.code} label={item.label} base={itemBase(item)} tauxP={itemTaux(item)} retP={fmt(item.amount)} />
              ))}

              {/* TUS — 2 lignes distinctes DGI + CNSS (part patronale) —
                  libellés courts, taux affiché dans la colonne dédiée */}
              {tusDgi  > 0 && (
                <Row label="TUS DGI" tauxP={itemTaux(tusDgiItem) || '2,025%'} retP={fmt(tusDgi)} />
              )}
              {tusCnss > 0 && (
                <Row label="TUS CNSS" tauxP={itemTaux(tusCnssItem) || '5,475%'} retP={fmt(tusCnss)} />
              )}

              {/* Prêts, avances, retenues diverses (pharmacie, cantine…) */}
              {loanItemsList.map((item: any) => (
                <Row key={item.id || item.code} label={item.label} ret={fmt(item.amount)} />
              ))}
              {advanceItemsList.map((item: any) => (
                <Row key={item.id || item.code} label={item.label} ret={fmt(item.amount)} />
              ))}
              {companyDeductions.map((item: any, idx: number) => (
                <Row key={item.id || item.code || idx} label={item.label} ret={fmt(item.amount)} />
              ))}

              <TotalRow label="Total Cotisations" ret={fmtZ(totalCotisSal)} />

              {/* ── Indemnités hors brut (numérotées 4100, 4120…) ─────── */}
              {indemItems.map((item: any) => { const n = rubIndem; rubIndem += 20; return (
                <Row key={item.id || item.code} n={n} label={item.label} base={itemBase(item)} gain={fmt(item.amount)} />
              ); })}

              <DashRow />
              <TotalRow n={9900} label="TOTAL GAINS" gain={fmtZ(totalGains)} />
              <TotalRow n={9950} label="TOTAL RETENUES" ret={fmtZ(totalCotisSal)} />
              <DashRow />

              {/* ── Spacer — absorbe l'espace restant du canevas A4 fixe ─ */}
              <tr id="grid-spacer-inf" style={{ background: '#fff' }}>
                <td style={{ borderLeft: BD, background: '#fff' }} />
                <td style={{ borderLeft: BD, background: '#fff' }} />
                <td style={{ borderLeft: BD, background: '#fff' }} />
                <td style={{ borderLeft: BD, background: '#fff' }} />
                <td style={{ borderLeft: BD, background: '#fff' }} />
                <td style={{ borderLeft: BD, background: '#fff' }} />
                <td style={{ borderLeft: BD, background: '#fff' }} />
                <td style={{ borderLeft: BD, background: '#fff' }} />
                <td style={{ borderLeft: BD, borderRight: BD, background: '#fff' }} />
              </tr>
            </tbody>
          </table>
        </div>

        {/* ══ CUMULS + NET A PAYER ══════════════════════════════════════ */}
        <table className="nobreak" style={{ width: '100%', borderCollapse: 'collapse', marginTop: 5, flexShrink: 0 }}>
          <tbody>
            <tr>
              <td style={{ width: '78%', verticalAlign: 'top' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', border: BDB, tableLayout: 'fixed' }}>
                  <thead>
                    <tr>
                      <th style={th({ width: '9%' })}>Cumuls</th>
                      <th style={th()}>Salaire brut</th>
                      <th style={th()}>Charges salariales</th>
                      <th style={th()}>Charges patronales</th>
                      <th style={th()}>ITS</th>
                      <th style={th()}>Net Imposable</th>
                      <th style={th()}>Base Congé</th>
                      <th style={th()}>Jrs Congé</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style={tdC({ fontWeight: 800, borderRight: BD })}>Mensuel</td>
                      <td style={tdR()}>{fmtZ(totalBrut)}</td>
                      <td style={tdR()}>{fmtZ(totalCotisSal)}</td>
                      <td style={tdR()}>{fmtZ(totalPat)}</td>
                      <td style={tdR()}>{fmtZ(itsAmount)}</td>
                      <td style={tdR()}>{fmtOpt(netImposable)}</td>
                      <td style={tdR()}>{fmtOpt(baseConge)}</td>
                      <td style={{ ...tdR({ borderRight: BD }) }}>{joursCongeMois == null ? '' : Number(joursCongeMois).toFixed(2)}</td>
                    </tr>
                    <tr>
                      <td style={{ ...tdC({ fontWeight: 800, borderTop: BD, borderRight: BD }) }}>Annuel</td>
                      <td style={{ ...tdR({ borderTop: BD }) }}>{fmtOpt(ytdGross)}</td>
                      <td style={{ ...tdR({ borderTop: BD }) }}>{fmtOpt(ytdCnss)}</td>
                      <td style={{ ...tdR({ borderTop: BD }) }}>{fmtOpt(ytdCnssEmp)}</td>
                      <td style={{ ...tdR({ borderTop: BD }) }}>{fmtOpt(ytdIts)}</td>
                      <td style={{ ...tdR({ borderTop: BD }) }}></td>
                      <td style={{ ...tdR({ borderTop: BD }) }}>{fmtOpt(ytdBaseConge)}</td>
                      <td style={{ ...tdR({ borderTop: BD, borderRight: BD }) }}></td>
                    </tr>
                  </tbody>
                </table>
              </td>
              <td style={{ width: '22%', verticalAlign: 'top', paddingLeft: 6 }}>
                <div style={{ border: BDB, height: '100%' }}>
                  <div style={{ ...th(), height: HEAD_H, lineHeight: `${HEAD_H}px`, fontSize: 9.5 }}>NET A PAYER</div>
                  <div style={{ textAlign: 'right', padding: '10px 10px 0', fontFamily: SANS, fontSize: 16, fontWeight: 900 }}>{fmtZ(netSalary)}</div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        {/* ══ SIGNATURES ═════════════════════════════════════════════════ */}
        <table className="nobreak" style={{ width: '100%', borderCollapse: 'collapse', marginTop: 10, flexShrink: 0 }}>
          <tbody>
            <tr>
              <td style={{ width: '50%', textAlign: 'center', verticalAlign: 'top' }}>
                <div style={{ fontWeight: 700, fontSize: 9, marginBottom: 4 }}>Signature Employé</div>
                <div style={{ border: BD, height: 46, width: '70%', margin: '0 auto' }} />
              </td>
              <td style={{ width: '50%', textAlign: 'center', verticalAlign: 'top' }}>
                <div style={{ fontWeight: 700, fontSize: 9, marginBottom: 4 }}>Signature Employeur &amp; Cachet</div>
                <div style={{ border: BD, height: 46, width: '70%', margin: '0 auto' }} />
              </td>
            </tr>
          </tbody>
        </table>

        {tpl.style.footerMessage && (
          <div style={{ textAlign: 'center', fontSize: 8.5, fontStyle: 'italic', marginTop: 3, flexShrink: 0 }}>{tpl.style.footerMessage}</div>
        )}

        <div style={{ fontSize: 8, color: '#000', marginTop: 6, textAlign: 'center', flexShrink: 0 }}>
          Pour vous aider à faire valoir vos droits, conservez ce bulletin de paie sans limitation de durée.
        </div>

      </div>
      </div>
    </>
  );
}