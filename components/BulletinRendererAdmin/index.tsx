'use client';

// ============================================================================
// components/BulletinRendererAdmin/index.tsx
//
// ✅ Toutes corrections 2026-06 :
//  1. Base/Taux transparents (paie manuelle incluse) — taux=1 masqué
//  2. Salaire Brut = ligne SEULE pleine largeur, sans colonnes vides
//  3. ABS_DEDUCT masqué du tableau (info dans l'en-tête si absenceDays > 0)
//  4. CNSS patronale : Pension 8% + Famille 10,03% + AT 2,25% — 3 lignes séparées
//  5. TOL auto depuis employee.tolZone (VILLE=1000 / PERIPHERIE=5000)
//  6. Absences : n'apparaît dans l'en-tête que si absenceDays > 0
//  7. H.suppl en-tête : sanity check ≤ 300h (> 300 = bug données → '—')
//  8. Total Cotisations = taxes/impôts uniquement (CNSS + ITS + custom)
//  9. Total Retenues    = Total Cotisations + Prêts/Avances (= totalDeductions)
// 10. Total Gains       = Brut + Indemnités hors brut
// 11. LOAN/ADVANCE visibles dans section 4 si présents dans les items
// 12. Bug opérateur priorité fmt(cnssSalarial ?? 0 + its ?? 0) corrigé
// ============================================================================

import React, { useMemo } from 'react';
import type { BulletinPayroll, BulletinTemplateConfig, PayrollItem } from '@/types/bulletin-template';
import { getBaseTemplate } from '@/lib/bulletin-templates';
import { classifyItems, getTusDgi, getTusCnss, getCtaxEmpItems } from '@/lib/bulletin-items-classifier';

export interface BulletinRendererAdminProps {
  payroll:      BulletinPayroll;
  template?:    BulletinTemplateConfig;
  previewMode?: boolean;
}

const MONTHS = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
const MARITAL: Record<string,string> = { SINGLE:'Célibataire', MARRIED:'Marié(e)', DIVORCED:'Divorcé(e)', WIDOWED:'Veuf/Veuve', COHABITING:'Concubinage' };
const PAYMENT: Record<string,string> = { BANK_TRANSFER:'Virement bancaire', CASH:'Espèces', MOBILE_MONEY:'Mobile Money', CHECK:'Chèque' };
const CONTRACT: Record<string,string> = { CDI:'CDI', CDD:'CDD', STAGE:'Stage', CONSULTANT:'Consultant', PRESTATAIRE:'Prestataire', INTERIM:'Intérimaire', FREELANCE:'Freelance' };

const fmt = (v: any) => {
  const n = Math.round(Number(v) || 0);
  if (!isFinite(n) || Math.abs(n) > 999_999_999_999) return '—';
  return n.toLocaleString('fr-FR');
};

function formatDate(d?: string) { return d ? new Date(d).toLocaleDateString('fr-FR') : '—'; }

function seniority(hireDate?: string) {
  if (!hireDate) return '—';
  const h = new Date(hireDate), n = new Date();
  let y = n.getFullYear()-h.getFullYear(), m = n.getMonth()-h.getMonth();
  if (m < 0) { y--; m += 12; }
  return `${y} an${y>1?'s':''} · ${m} mois`;
}

// ─── fmtBase / fmtTaux stricts ─────────────────────────────────────────────
function fmtBase(item: any): string {
  if (item.base == null || Number(item.base) === 0) return '—';
  return Math.round(Number(item.base)).toLocaleString('fr-FR');
}

function fmtTaux(item: any): string {
  const qty = item.quantity;
  if (qty != null && Number(qty) !== 0) return String(qty);
  if (item.rate == null || Number(item.rate) === 0) return '—';
  const r = Number(item.rate);
  // taux=1 → montant fixe direct, on n'affiche pas le multiplicateur
  if (r === 1) return '—';
  // Multiplicateur HS : ×1,10 / ×1,25 / ×1,50 / ×2,00
  if (r > 1 && r <= 3) return `×${r.toFixed(2).replace('.', ',')}`;
  // Pourcentage : 0.04 → 4%, 0.02025 → 2,025%
  if (r > 0 && r < 1) {
    const pct = r * 100;
    const str = pct % 1 === 0 ? pct.toFixed(0) : pct.toFixed(3).replace(/0+$/, '');
    return `${str}%`;
  }
  return String(r);
}

// ─── Couleurs ───────────────────────────────────────────────────────────────
const PRIMARY     = '#0f2544';
const ACCENT      = '#b8860b';
const SEC_GAIN    = '#0a3d1f';
const SEC_COTIS   = '#5a1a1a';
const SEC_INDEM   = '#1a3a1a';
const SEC_RETENUE = '#3a2800';

// ─── Styles ─────────────────────────────────────────────────────────────────
const C = (extra?: React.CSSProperties): React.CSSProperties => ({
  borderBottom: '0.5px solid #bbb', padding: '3.5px 6px', fontSize: 9,
  verticalAlign: 'middle', color: '#000', ...extra,
});
const CR = (extra?: React.CSSProperties): React.CSSProperties => ({
  ...C(), textAlign: 'right', fontFamily: 'Courier New, monospace', ...extra,
});
const CC = (extra?: React.CSSProperties): React.CSSProperties => ({
  ...C(), textAlign: 'center', ...extra,
});

const SectionRow = ({ num, color, bg, children }: { num: string; color: string; bg: string; children: React.ReactNode }) => (
  <tr>
    <td colSpan={8} style={{
      background: bg, padding: '4px 6px', fontSize: 8, fontWeight: 700,
      textTransform: 'uppercase' as const, letterSpacing: '1.5px',
      color, borderTop: '1px solid #000', borderBottom: '1px solid #000',
    }}>
      {num} · {children}
    </td>
  </tr>
);

// ── Ligne total pleine largeur — SEULE sans colonnes vides ──────────────────
// col='gain'    → montant dans col gain  (colSpan 4 label / 4 montant)
// col='retenue' → montant dans col ret   (colSpan 5 label / 3 montant)
const TotalRow = ({ label, amount, col }: { label: string; amount: string; col: 'gain' | 'retenue' }) => (
  <tr style={{ background:'#e8e8e8', borderTop:`2px solid ${PRIMARY}`, borderBottom:`2px solid ${PRIMARY}` }}>
    <td colSpan={col === 'gain' ? 4 : 5} style={{
      padding:'5px 8px', fontSize:10, fontWeight:900,
      textTransform:'uppercase' as const, letterSpacing:'.5px',
      color:'#000', border:'0.5px solid #888',
    }}>
      {label}
    </td>
    <td colSpan={col === 'gain' ? 4 : 3} style={{
      padding:'5px 8px', textAlign:'right',
      fontFamily:'Courier New, monospace', fontSize:13, fontWeight:900,
      color:'#000', border:'0.5px solid #888',
    }}>
      {amount}
    </td>
  </tr>
);

// ─── Composant principal ────────────────────────────────────────────────────
export default function BulletinRendererAdmin({ payroll, template }: BulletinRendererAdminProps) {
  const tpl  = template ?? getBaseTemplate('admin');
  const e    = (payroll.employee ?? {}) as any;
  const co   = (payroll.company  ?? {}) as any;
  const items: PayrollItem[] = payroll.items ?? [];
  const ytd  = (payroll as any).ytd;

  const { gainItems, cotisItems, indemItems, retenueItems, empItems } = useMemo(
    () => classifyItems(items), [items]
  );

  // Filtrer ABS hors tableau — info déjà dans l'en-tête
  const gainFiltered  = gainItems.filter((i: any) => i.code !== 'ABS_DEDUCT' && i.code !== 'ABS_CONGE');
  const cotisFiltered = cotisItems.filter((i: any) => i.code !== 'ABS_DEDUCT' && i.code !== 'ABS_CONGE');

  // Prêts & avances = items DEDUCTION avec code LOAN ou ADVANCE
  const loanAdvItems  = retenueItems.filter((i: any) => i.code === 'LOAN' || i.code === 'ADVANCE');
  // Autres retenues diverses (hors loans/avances)
  const otherRetItems = retenueItems.filter((i: any) => i.code !== 'LOAN' && i.code !== 'ADVANCE');

  // Totaux — source de vérité = API
  const totalBrut  = payroll.grossSalary     ?? 0;
  const totalDed   = payroll.totalDeductions ?? 0;   // = cotis + prêts + avances
  const netSalary  = payroll.netSalary       ?? 0;

  // Total cotisations salariales (= totalDeductions - montant prêts/avances)
  const totalLoanAdv   = loanAdvItems.reduce((s: number, i: any) => s + Number(i.amount || 0), 0);
  const totalCotisOnly = totalDed - totalLoanAdv;

  // Total Gains = brut + indemnités hors brut
  const totalIndem = indemItems.reduce((s: number, i: any) => s + Number(i.amount || 0), 0);
  const totalGains = totalBrut + totalIndem;

  // CNSS Patronale détaillée
  const cnssEmpPension  = Number(payroll.cnssEmployerPension  ?? 0);
  const cnssEmpFamily   = Number(payroll.cnssEmployerFamily   ?? 0);
  const cnssEmpAccident = Number(payroll.cnssEmployerAccident ?? 0);

  const tusDgi       = getTusDgi(empItems, payroll);
  const tusCnss      = getTusCnss(empItems, payroll);
  const ctaxEmpItems = getCtaxEmpItems(empItems);

  // TOL auto depuis l'employé (affichage uniquement si pas déjà dans les items)
  const tolZone      = e.tolZone ?? 'VILLE';
  const tolAmount    = tolZone === 'PERIPHERIE' ? 5000 : 1000;
  const tolLabel     = `TOL ${tolZone === 'PERIPHERIE' ? 'Périphérie' : 'Ville'} (Taxe d'occupation des locaux)`;
  const hasTolInItems = items.some((i: any) => i.code?.includes('TOL') || i.label?.toLowerCase().includes('tol'));

  // H.suppl : sanity check — > 300h/mois = données corrompues
  const rawOT    = Number(payroll.overtimeHours10??0) + Number(payroll.overtimeHours25??0)
                 + Number(payroll.overtimeHours50??0) + Number(payroll.overtimeHours100??0);
  const overTime = rawOT > 0 && rawOT <= 300 ? rawOT : null;

  // Numérotation
  let ref1 = 99, ref2 = 200, ref3 = 300, ref4 = 400;

  const fullName = [e.firstName, e.lastName].filter(Boolean).join(' ');
  const cat      = [e.professionalCategory, e.echelon ? `Ech. ${e.echelon}` : ''].filter(Boolean).join(' / ');

  const TH = (extra?: React.CSSProperties): React.CSSProperties => ({
    background: PRIMARY, color: '#fff', fontWeight: 700, fontSize: 8,
    textTransform: 'uppercase' as const, letterSpacing: '.5px',
    padding: '6px 6px', textAlign: 'center' as const,
    border: '0.5px solid #000', ...extra,
  });

  const InfoRow = ({ label, value }: { label: string; value: string }) => (
    <div style={{ display:'grid', gridTemplateColumns:'110px 1fr', marginBottom:2 }}>
      <span style={{ fontSize:8.5, color:'#444' }}>{label}</span>
      <span style={{ fontSize:8.5, fontWeight:700, color:'#000' }}>{value}</span>
    </div>
  );

  const ytdNetImp = ytd ? (ytd.grossSalary - ytd.cnssSalarial) : null;
  const cumCols = [
    { label:'Sal. brut',  period: payroll.grossSalary,   year: ytd?.grossSalary       ?? null },
    { label:'Ch. sal.',   period: payroll.cnssSalarial,  year: ytd?.cnssSalarial      ?? null },
    { label:'Ch. pat.',   period: payroll.cnssEmployer ?? 0, year: ytd?.cnssEmployer  ?? null },
    { label:'Avt. nat.',  period: 0,                    year: 0 },
    { label:'Net impos.', period: (payroll.grossSalary??0)-(payroll.cnssSalarial??0), year: ytdNetImp },
    { label:'H. trav.',   period: (payroll.workedDays??0)*8, year: ytd ? (ytd.workedDays*8) : null },
    // H.suppl : nb heures réelles saisies (pas un montant)
    { label:'H. suppl.',  period: overTime,              year: null },
    // Base congés : tirets — calculé lors de la génération congés, pas ici
    { label:'Base cong.', period: null,                  year: null },
  ];

  return (
    <>
      <style>{`
        @media print {
          @page { size: A4 portrait; margin: 8mm; }
          html, body { margin: 0 !important; padding: 0 !important; background: #fff !important; }
          .no-print, nav, header, aside, footer,
          [class*="sidebar"],[class*="Sidebar"],
          [class*="navbar"],[class*="Navbar"] { display: none !important; }
          .payslip-sheet-wrap { display: block !important; position: static !important; }
          #bul-admin-root {
            width: 194mm !important;
            padding: 0 !important; margin: 0 !important;
            box-shadow: none !important; border: none !important;
          }
          .adm-no-break { page-break-inside: avoid !important; break-inside: avoid !important; }
          .adm-legal { display: none !important; }
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        }
      `}</style>

      <div id="bul-admin-root" style={{
        fontFamily: '"Segoe UI","Helvetica Neue",Arial,sans-serif',
        fontSize: 10, background: '#fff', color: '#000',
        width: '210mm', boxSizing: 'border-box' as const,
        padding: '28px 34px', margin: '0 auto',
      }}>

        {/* ── EN-TÊTE ENTREPRISE ─────────────────────────────────────────── */}
        <div className="adm-no-break" style={{
          background: PRIMARY, color: '#fff', padding: '14px 18px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
          borderBottom: `4px solid ${ACCENT}`,
        }}>
          <div style={{ display:'flex', alignItems:'flex-start', gap:12 }}>
            {co.logo
              ? <img src={co.logo} alt="Logo" style={{ width:48, height:48, objectFit:'contain', background:'#fff', borderRadius:4, padding:3, flexShrink:0 }} />
              : <div style={{ width:48, height:48, background:'#fff', borderRadius:4, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:10, color:PRIMARY, flexShrink:0 }}>
                  {(co.tradeName||co.legalName||'ENT').slice(0,4).toUpperCase()}
                </div>
            }
            <div>
              <div style={{ fontSize:13, fontWeight:700, letterSpacing:.5 }}>{(co.tradeName||co.legalName||'ENTREPRISE').toUpperCase()}</div>
              {co.address && <div style={{ fontSize:8, opacity:.75, marginTop:3 }}>{co.address}{co.city?`, ${co.city}`:''}{co.phone?` · Tél : ${co.phone}`:''}{co.email?` · ${co.email}`:''}</div>}
              <div style={{ fontSize:8, opacity:.55, marginTop:2 }}>
                {[co.rccmNumber&&`RCCM : ${co.rccmNumber}`, co.cnssNumber&&`CNSS Emp : ${co.cnssNumber}`, co.nif&&`NIU : ${co.nif}`].filter(Boolean).join(' · ')}
              </div>
            </div>
          </div>
          <div style={{ textAlign:'right', flexShrink:0 }}>
            <div style={{ fontSize:8, letterSpacing:3, opacity:.55, textTransform:'uppercase' }}>Bulletin de paie</div>
            <div style={{ fontSize:22, fontWeight:700, letterSpacing:2, lineHeight:1.1 }}>{MONTHS[(payroll.month??1)-1].toUpperCase()}</div>
            <div style={{ fontSize:12, opacity:.75 }}>{payroll.year}</div>
            <div style={{ marginTop:6, display:'inline-block', background:'rgba(184,134,11,.3)', border:`1px solid ${ACCENT}`, borderRadius:3, padding:'2px 10px', fontSize:8, letterSpacing:1 }}>
              {(payroll as any).paymentDate?`Paie : ${formatDate((payroll as any).paymentDate)} · `:''}{PAYMENT[e.paymentMethod??'']??'Virement bancaire'}
            </div>
          </div>
        </div>

        {/* ── INFOS SALARIÉ — 3 colonnes ─────────────────────────────────── */}
        <div className="adm-no-break" style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', border:`1px solid #000`, borderTop:'none', marginBottom:10 }}>
          {/* Col 1 — Identité */}
          <div style={{ padding:'10px 12px', borderRight:'1px solid #000' }}>
            <div style={{ fontSize:8.5, fontWeight:700, letterSpacing:2, color:'#444', textTransform:'uppercase', marginBottom:6 }}>Salarié</div>
            <div style={{ fontSize:12, fontWeight:700, color:'#000', marginBottom:2 }}>{fullName||'—'}</div>
            <div style={{ fontSize:9, color:'#333', marginBottom:7 }}>{e.position||'—'}</div>
            <div style={{ display:'flex', gap:5, flexWrap:'wrap' }}>
              {CONTRACT[e.contractType??''] && <span style={{ background:PRIMARY, color:'#fff', fontSize:8.5, padding:'2px 6px', border:`1px solid ${PRIMARY}`, fontWeight:700 }}>{CONTRACT[e.contractType]}</span>}
              {cat && <span style={{ background:'#eee', color:'#222', fontSize:8.5, padding:'2px 6px', border:'1px solid #999' }}>{cat}</span>}
              {e.employeeNumber && <span style={{ background:'#eee', color:'#222', fontSize:8.5, padding:'2px 6px', border:'1px solid #999' }}>Mat. {e.employeeNumber}</span>}
            </div>
          </div>
          {/* Col 2 — Contrat */}
          <div style={{ padding:'10px 12px', borderRight:'1px solid #000' }}>
            <div style={{ fontSize:8.5, fontWeight:700, letterSpacing:2, color:'#444', textTransform:'uppercase', marginBottom:6 }}>Contrat &amp; situation</div>
            <InfoRow label="Date d'embauche" value={formatDate(e.hireDate)} />
            <InfoRow label="Ancienneté" value={seniority(e.hireDate)} />
            <InfoRow label="Etat civil" value={MARITAL[e.maritalStatus??'']??'—'} />
            <InfoRow label="Nb. enfants / parts" value={`${e.numberOfChildren??0} / ${(e.numberOfChildren??0)+1}`} />
            <InfoRow label="N° CNSS salarié" value={e.cnssNumber||'—'} />
            <InfoRow label="Convention" value={co.collectiveAgreement||'Commerce'} />
          </div>
          {/* Col 3 — Période */}
          <div style={{ padding:'10px 12px' }}>
            <div style={{ fontSize:8.5, fontWeight:700, letterSpacing:2, color:'#444', textTransform:'uppercase', marginBottom:6 }}>Période de travail</div>
            <InfoRow label="Compte bancaire" value={e.bankAccount ? `…${String(e.bankAccount).slice(-4)}` : '—'} />
            <InfoRow label="Jours ouvrables" value={`${payroll.workDays??26} j`} />
            <InfoRow label="Jours travaillés" value={payroll.workedDays != null ? `${payroll.workedDays} j` : '—'} />
            {/* Absences : affichées UNIQUEMENT si > 0 */}
            {Number(payroll.absenceDays??0) > 0 && <InfoRow label="Absences" value={`${payroll.absenceDays} j`} />}
            {/* H.suppl : affichées UNIQUEMENT si > 0 et ≤ 300 */}
            {overTime != null && <InfoRow label="Heures suppl." value={`${overTime} h`} />}
            <InfoRow label="Site" value={co.city||co.address||'Administration'} />
          </div>
        </div>

        {/* ── TABLEAU PRINCIPAL ───────────────────────────────────────────── */}
        <div className="adm-no-break">
          <table style={{ width:'100%', borderCollapse:'collapse', tableLayout:'fixed', border:'1px solid #000' }}>
            <colgroup>
              <col style={{ width:'5.5%'  }} />
              <col style={{ width:'35%'   }} />
              <col style={{ width:'10%'   }} />
              <col style={{ width:'7%'    }} />
              <col style={{ width:'13%'   }} />
              <col style={{ width:'12%'   }} />
              <col style={{ width:'7%'    }} />
              <col style={{ width:'10.5%' }} />
            </colgroup>
            <thead>
              <tr>
                <th style={TH()}>Réf.</th>
                <th style={TH({ textAlign:'left', paddingLeft:8 })}>Désignation</th>
                <th style={TH()}>Base</th>
                <th style={TH()}>Taux</th>
                <th style={TH({ background:'#1a3a1a' })}>Gain salarié</th>
                <th style={TH({ background:'#5a1a1a' })}>Retenue sal.</th>
                <th style={TH({ background:'#3a2800' })}>T.%</th>
                <th style={TH({ background:'#3a2800' })}>Ret. pat.</th>
              </tr>
            </thead>
            <tbody>

              {/* ══ SECTION 1 — GAINS & PRIMES ═══════════════════════════════ */}
              <SectionRow num="1" color="#fff" bg={SEC_GAIN}>Rémunérations &amp; Primes</SectionRow>

              {gainFiltered.map((item: any) => {
                ref1++;
                const isBase = item.code === 'SAL_BASE';
                return (
                  <tr key={item.id||item.code} style={{ borderBottom:'0.5px solid #999' }}>
                    <td style={CC({ color:'#444', fontSize:8.5, border:'0.5px solid #ddd' })}>{ref1}</td>
                    <td style={C({ fontWeight: isBase ? 700 : 400, border:'0.5px solid #ddd', paddingLeft:8 })}>{item.label}</td>
                    <td style={CR({ border:'0.5px solid #ddd' })}>{fmtBase(item)}</td>
                    <td style={CC({ fontSize:8.5, fontWeight:600, border:'0.5px solid #ddd' })}>{fmtTaux(item)}</td>
                    <td style={CR({ fontWeight:700, border:'0.5px solid #ddd' })}>{fmt(item.amount)}</td>
                    <td style={{ ...C({ border:'0.5px solid #ddd' }), background:'#f9f9f9' }} />
                    <td style={{ ...C({ border:'0.5px solid #ddd' }), background:'#f5f0e8' }} />
                    <td style={{ ...C({ border:'0.5px solid #ddd' }), background:'#f5f0e8' }} />
                  </tr>
                );
              })}

              {/* SALAIRE BRUT — seul sur sa ligne pleine largeur */}
              <tr style={{ background:'#dedede', borderTop:`2px solid #000`, borderBottom:`2px solid #000` }}>
                <td colSpan={8} style={{
                  padding:'6px 10px', fontSize:11, fontWeight:900,
                  textTransform:'uppercase', letterSpacing:1.5, color:'#000',
                  border:'0.5px solid #888', textAlign:'center',
                }}>
                  Salaire brut &nbsp;&mdash;&nbsp; {fmt(totalBrut)} F
                </td>
              </tr>

              {/* ══ SECTION 2 — COTISATIONS SALARIALES & PATRONALES ══════════ */}
              <SectionRow num="2" color="#fff" bg={SEC_COTIS}>Cotisations obligatoires (salariales &amp; patronales)</SectionRow>

              {/* Cotisations salariales */}
              {cotisFiltered.map((item: any) => {
                ref2++;
                const taux = item.rate
                  ? `${(Number(item.rate)*100).toFixed(Number(item.rate)<0.1?3:2).replace('.',',')}%`
                  : (item.code==='ITS'||item.code==='BNC_SOURCE' ? 'Barème' : '—');
                return (
                  <tr key={item.id||item.code} style={{ borderBottom:'0.5px solid #999', background: ref2%2===0?'#fdf8f0':'#fff' }}>
                    <td style={CC({ color:'#444', fontSize:8.5, border:'0.5px solid #ddd' })}>{ref2}</td>
                    <td style={C({ border:'0.5px solid #ddd', paddingLeft:8 })}>{item.label}</td>
                    <td style={CR({ border:'0.5px solid #ddd' })}>{item.base ? fmt(item.base) : '—'}</td>
                    <td style={CC({ fontWeight:600, fontSize:8.5, border:'0.5px solid #ddd' })}>{taux}</td>
                    <td style={{ ...C({ border:'0.5px solid #ddd' }), background:'#f9f9f9' }} />
                    <td style={CR({ fontWeight:700, border:'0.5px solid #ddd' })}>{fmt(item.amount)}</td>
                    <td style={CC({ border:'0.5px solid #ddd', background:'#f5f0e8' })} />
                    <td style={CR({ border:'0.5px solid #ddd', background:'#f5f0e8' })} />
                  </tr>
                );
              })}

              {/* CNSS Patronale — 3 branches séparées, chacune sur sa propre ligne */}
              {cnssEmpPension > 0 && (() => { ref2++; return (
                <tr key="cnss_pat_pen" style={{ borderBottom:'0.5px solid #999', background: ref2%2===0?'#fdf8f0':'#fff' }}>
                  <td style={CC({ color:'#444', fontSize:8.5, border:'0.5px solid #ddd' })}>{ref2}</td>
                  <td style={C({ border:'0.5px solid #ddd', paddingLeft:8 })}>CNSS patronale — Pension vieillesse</td>
                  <td style={CR({ border:'0.5px solid #ddd' })}>{fmt(payroll.grossSalary)}</td>
                  <td style={CC({ fontWeight:600, fontSize:8.5, border:'0.5px solid #ddd' })}>8%</td>
                  <td style={{ ...C({ border:'0.5px solid #ddd' }), background:'#f9f9f9' }} />
                  <td style={{ ...C({ border:'0.5px solid #ddd' }), background:'#f9f9f9' }} />
                  <td style={CC({ fontWeight:700, fontSize:8.5, border:'0.5px solid #ddd', background:'#f5f0e8' })}>8%</td>
                  <td style={CR({ fontWeight:700, border:'0.5px solid #ddd', background:'#f5f0e8' })}>{fmt(cnssEmpPension)}</td>
                </tr>
              ); })()}
              {cnssEmpFamily > 0 && (() => { ref2++; return (
                <tr key="cnss_pat_fam" style={{ borderBottom:'0.5px solid #999', background: ref2%2===0?'#fdf8f0':'#fff' }}>
                  <td style={CC({ color:'#444', fontSize:8.5, border:'0.5px solid #ddd' })}>{ref2}</td>
                  <td style={C({ border:'0.5px solid #ddd', paddingLeft:8 })}>CNSS patronale — Prestations familiales</td>
                  <td style={CR({ border:'0.5px solid #ddd' })}>{fmt(payroll.grossSalary)}</td>
                  <td style={CC({ fontWeight:600, fontSize:8.5, border:'0.5px solid #ddd' })}>10,03%</td>
                  <td style={{ ...C({ border:'0.5px solid #ddd' }), background:'#f9f9f9' }} />
                  <td style={{ ...C({ border:'0.5px solid #ddd' }), background:'#f9f9f9' }} />
                  <td style={CC({ fontWeight:700, fontSize:8.5, border:'0.5px solid #ddd', background:'#f5f0e8' })}>10,03%</td>
                  <td style={CR({ fontWeight:700, border:'0.5px solid #ddd', background:'#f5f0e8' })}>{fmt(cnssEmpFamily)}</td>
                </tr>
              ); })()}
              {cnssEmpAccident > 0 && (() => { ref2++; return (
                <tr key="cnss_pat_at" style={{ borderBottom:'0.5px solid #999', background: ref2%2===0?'#fdf8f0':'#fff' }}>
                  <td style={CC({ color:'#444', fontSize:8.5, border:'0.5px solid #ddd' })}>{ref2}</td>
                  <td style={C({ border:'0.5px solid #ddd', paddingLeft:8 })}>CNSS patronale — Accidents du travail</td>
                  <td style={CR({ border:'0.5px solid #ddd' })}>{fmt(payroll.grossSalary)}</td>
                  <td style={CC({ fontWeight:600, fontSize:8.5, border:'0.5px solid #ddd' })}>2,25%</td>
                  <td style={{ ...C({ border:'0.5px solid #ddd' }), background:'#f9f9f9' }} />
                  <td style={{ ...C({ border:'0.5px solid #ddd' }), background:'#f9f9f9' }} />
                  <td style={CC({ fontWeight:700, fontSize:8.5, border:'0.5px solid #ddd', background:'#f5f0e8' })}>2,25%</td>
                  <td style={CR({ fontWeight:700, border:'0.5px solid #ddd', background:'#f5f0e8' })}>{fmt(cnssEmpAccident)}</td>
                </tr>
              ); })()}

              {/* TUS DGI */}
              {tusDgi > 0 && (() => { ref2++; return (
                <tr key="tus_dgi" style={{ borderBottom:'0.5px solid #999', background: ref2%2===0?'#fdf8f0':'#fff' }}>
                  <td style={CC({ color:'#444', fontSize:8.5, border:'0.5px solid #ddd' })}>{ref2}</td>
                  <td style={C({ border:'0.5px solid #ddd', paddingLeft:8 })}>TUS — Part DGI (2,025%)</td>
                  <td style={CR({ border:'0.5px solid #ddd' })}>{fmt(payroll.grossSalary)}</td>
                  <td style={CC({ fontWeight:600, fontSize:8.5, border:'0.5px solid #ddd' })}>2,025%</td>
                  <td style={{ ...C({ border:'0.5px solid #ddd' }), background:'#f9f9f9' }} />
                  <td style={{ ...C({ border:'0.5px solid #ddd' }), background:'#f9f9f9' }} />
                  <td style={CC({ fontWeight:700, fontSize:8.5, border:'0.5px solid #ddd', background:'#f5f0e8' })}>—</td>
                  <td style={CR({ fontWeight:700, border:'0.5px solid #ddd', background:'#f5f0e8' })}>{fmt(tusDgi)}</td>
                </tr>
              ); })()}

              {/* TUS CNSS */}
              {tusCnss > 0 && (() => { ref2++; return (
                <tr key="tus_cnss" style={{ borderBottom:'0.5px solid #999', background: ref2%2===0?'#fdf8f0':'#fff' }}>
                  <td style={CC({ color:'#444', fontSize:8.5, border:'0.5px solid #ddd' })}>{ref2}</td>
                  <td style={C({ border:'0.5px solid #ddd', paddingLeft:8 })}>TUS — Part CNSS (5,475%)</td>
                  <td style={CR({ border:'0.5px solid #ddd' })}>{fmt(payroll.grossSalary)}</td>
                  <td style={CC({ fontWeight:600, fontSize:8.5, border:'0.5px solid #ddd' })}>5,475%</td>
                  <td style={{ ...C({ border:'0.5px solid #ddd' }), background:'#f9f9f9' }} />
                  <td style={{ ...C({ border:'0.5px solid #ddd' }), background:'#f9f9f9' }} />
                  <td style={CC({ fontWeight:700, fontSize:8.5, border:'0.5px solid #ddd', background:'#f5f0e8' })}>—</td>
                  <td style={CR({ fontWeight:700, border:'0.5px solid #ddd', background:'#f5f0e8' })}>{fmt(tusCnss)}</td>
                </tr>
              ); })()}

              {/* TOL — si absent des items, on l'affiche depuis employee.tolZone */}
              {!hasTolInItems && tolAmount > 0 && (() => { ref2++; return (
                <tr key="tol_auto" style={{ borderBottom:'0.5px solid #999', background: ref2%2===0?'#fdf8f0':'#fff' }}>
                  <td style={CC({ color:'#444', fontSize:8.5, border:'0.5px solid #ddd' })}>{ref2}</td>
                  <td style={C({ border:'0.5px solid #ddd', paddingLeft:8 })}>{tolLabel}</td>
                  <td style={CR({ border:'0.5px solid #ddd' })}>—</td>
                  <td style={CC({ fontWeight:600, fontSize:8.5, border:'0.5px solid #ddd' })}>Fixe</td>
                  <td style={{ ...C({ border:'0.5px solid #ddd' }), background:'#f9f9f9' }} />
                  <td style={CR({ fontWeight:700, border:'0.5px solid #ddd' })}>{fmt(tolAmount)}</td>
                  <td style={{ ...C({ border:'0.5px solid #ddd' }), background:'#f5f0e8' }} />
                  <td style={{ ...C({ border:'0.5px solid #ddd' }), background:'#f5f0e8' }} />
                </tr>
              ); })()}

              {/* CTAX_EMP_* — charges patronales custom */}
              {ctaxEmpItems.map((item: any) => { ref2++; return (
                <tr key={item.id||item.code} style={{ borderBottom:'0.5px solid #999', background: ref2%2===0?'#fdf8f0':'#fff' }}>
                  <td style={CC({ color:'#444', fontSize:8.5, border:'0.5px solid #ddd' })}>{ref2}</td>
                  <td style={C({ border:'0.5px solid #ddd', paddingLeft:8 })}>{item.label}</td>
                  <td style={CR({ border:'0.5px solid #ddd' })}>{item.base ? fmt(item.base) : '—'}</td>
                  <td style={CC({ fontSize:8.5, border:'0.5px solid #ddd' })}>—</td>
                  <td style={{ ...C({ border:'0.5px solid #ddd' }), background:'#f9f9f9' }} />
                  <td style={{ ...C({ border:'0.5px solid #ddd' }), background:'#f9f9f9' }} />
                  <td style={CC({ border:'0.5px solid #ddd', background:'#f5f0e8' })}>—</td>
                  <td style={CR({ fontWeight:700, border:'0.5px solid #ddd', background:'#f5f0e8' })}>{fmt(item.amount)}</td>
                </tr>
              ); })}

              {/* TOTAL COTISATIONS — taxes/impôts uniquement, seul sur sa ligne */}
              <TotalRow
                label="Total cotisations  (CNSS + ITS + Taxes)"
                amount={fmt(totalCotisOnly)}
                col="retenue"
              />

              {/* ══ SECTION 3 — INDEMNITÉS HORS BRUT ════════════════════════ */}
              {indemItems.length > 0 && <>
                <SectionRow num="3" color="#fff" bg={SEC_INDEM}>Indemnités &amp; Avantages (non soumis à cotisations)</SectionRow>
                {indemItems.map((item: any) => { ref3++; return (
                  <tr key={item.id||item.code} style={{ borderBottom:'0.5px solid #999', background: ref3%2===0?'#f5faf5':'#fff' }}>
                    <td style={CC({ color:'#444', fontSize:8.5, border:'0.5px solid #ddd' })}>{ref3}</td>
                    <td style={C({ border:'0.5px solid #ddd', paddingLeft:8 })}>{item.label}</td>
                    <td style={CR({ border:'0.5px solid #ddd' })}>{fmtBase(item)}</td>
                    <td style={CC({ fontSize:8.5, border:'0.5px solid #ddd' })}>{fmtTaux(item)}</td>
                    <td style={CR({ fontWeight:700, border:'0.5px solid #ddd' })}>{fmt(item.amount)}</td>
                    <td style={{ ...C({ border:'0.5px solid #ddd' }), background:'#f9f9f9' }} />
                    <td style={{ ...C({ border:'0.5px solid #ddd' }), background:'#f5f0e8' }} />
                    <td style={{ ...C({ border:'0.5px solid #ddd' }), background:'#f5f0e8' }} />
                  </tr>
                ); })}
              </>}

              {/* ══ SECTION 4 — PRÊTS & AVANCES ══════════════════════════════ */}
              {loanAdvItems.length > 0 && <>
                <SectionRow num="4" color="#fff" bg={SEC_RETENUE}>Prêts &amp; Avances sur salaire</SectionRow>
                {loanAdvItems.map((item: any) => { ref4++; return (
                  <tr key={item.id||item.code} style={{ borderBottom:'0.5px solid #999', background: ref4%2===0?'#fdf5ec':'#fff' }}>
                    <td style={CC({ color:'#444', fontSize:8.5, border:'0.5px solid #ddd' })}>{ref4}</td>
                    <td style={C({ border:'0.5px solid #ddd', paddingLeft:8 })}>{item.label}</td>
                    <td style={CR({ border:'0.5px solid #ddd' })}>—</td>
                    <td style={CC({ fontSize:8.5, border:'0.5px solid #ddd' })}>—</td>
                    <td style={{ ...C({ border:'0.5px solid #ddd' }), background:'#f9f9f9' }} />
                    <td style={CR({ fontWeight:700, border:'0.5px solid #ddd' })}>{fmt(item.amount)}</td>
                    <td style={{ ...C({ border:'0.5px solid #ddd' }), background:'#f5f0e8' }} />
                    <td style={{ ...C({ border:'0.5px solid #ddd' }), background:'#f5f0e8' }} />
                  </tr>
                ); })}
              </>}

              {/* Autres retenues diverses (hors loans/avances) */}
              {otherRetItems.length > 0 && <>
                {loanAdvItems.length === 0 && <SectionRow num="4" color="#fff" bg={SEC_RETENUE}>Retenues diverses</SectionRow>}
                {otherRetItems.map((item: any) => { ref4++; return (
                  <tr key={item.id||item.code} style={{ borderBottom:'0.5px solid #999', background: ref4%2===0?'#fdf8f0':'#fff' }}>
                    <td style={CC({ color:'#444', fontSize:8.5, border:'0.5px solid #ddd' })}>{ref4}</td>
                    <td style={C({ border:'0.5px solid #ddd', paddingLeft:8 })}>{item.label}</td>
                    <td style={CR({ border:'0.5px solid #ddd' })}>{fmtBase(item)}</td>
                    <td style={CC({ fontSize:8.5, border:'0.5px solid #ddd' })}>{fmtTaux(item)}</td>
                    <td style={{ ...C({ border:'0.5px solid #ddd' }), background:'#f9f9f9' }} />
                    <td style={CR({ fontWeight:700, border:'0.5px solid #ddd' })}>{fmt(item.amount)}</td>
                    <td style={{ ...C({ border:'0.5px solid #ddd' }), background:'#f5f0e8' }} />
                    <td style={{ ...C({ border:'0.5px solid #ddd' }), background:'#f5f0e8' }} />
                  </tr>
                ); })}
              </>}

              {/* ══ TOTAUX FINAUX ════════════════════════════════════════════ */}
              {/* Total Gains = Brut + Indemnités */}
              <TotalRow
                label={`Total gains${totalIndem > 0 ? `  (Brut ${fmt(totalBrut)} + Indemnités ${fmt(totalIndem)})` : ''}`}
                amount={fmt(totalGains)}
                col="gain"
              />
              {/* Total Retenues = Cotisations + Prêts + Avances = totalDeductions */}
              <TotalRow
                label={`Total retenues  (Cotisations${totalLoanAdv > 0 ? ` + Prêts/Avances ${fmt(totalLoanAdv)}` : ''})`}
                amount={fmt(totalDed)}
                col="retenue"
              />

            </tbody>
          </table>
        </div>

        {/* ── CUMULS + NET À PAYER ────────────────────────────────────────── */}
        <div className="adm-no-break" style={{ marginTop:8 }}>
          <div style={{ display:'flex', alignItems:'stretch', border:`1px solid #000`, borderTop:`2px solid ${PRIMARY}` }}>
            <table style={{ flex:1, borderCollapse:'collapse' }}>
              <thead>
                <tr style={{ background:'#1e2e44' }}>
                  <th style={{ padding:'4px 8px', fontSize:8, fontWeight:700, color:'#fff', textAlign:'left', width:52, border:'0.5px solid #000' }} />
                  {cumCols.map(c => (
                    <th key={c.label} style={{ padding:'4px 5px', fontSize:8.5, fontWeight:700, color:'#fff', textAlign:'center', whiteSpace:'nowrap', border:'0.5px solid #000' }}>
                      {c.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ padding:'4px 8px', fontSize:8, fontWeight:700, background:'#eee', color:'#000', border:'0.5px solid #000' }}>Période</td>
                  {cumCols.map(c => (
                    <td key={c.label} style={{ padding:'4px 5px', textAlign:'center', fontFamily:'Courier New, monospace', fontSize:8.5, fontWeight:600, color:'#000', border:'0.5px solid #999' }}>
                      {c.period != null ? fmt(c.period) : '—'}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td style={{ padding:'4px 8px', fontSize:8, fontWeight:700, background:'#eee', color:'#000', border:'0.5px solid #000' }}>Année</td>
                  {cumCols.map(c => (
                    <td key={c.label} style={{ padding:'4px 5px', textAlign:'center', fontFamily:'Courier New, monospace', fontSize:8.5, color:'#444', border:'0.5px solid #999' }}>
                      {c.year != null ? fmt(c.year) : '—'}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>

            {/* NET À PAYER */}
            <div style={{
              background: PRIMARY, color:'#fff',
              display:'flex', flexDirection:'column', justifyContent:'center', alignItems:'center',
              minWidth:130, padding:'10px 16px', flexShrink:0,
              borderLeft:`4px solid ${ACCENT}`,
            }}>
              <div style={{ fontSize:8.5, fontWeight:700, textTransform:'uppercase', letterSpacing:2, opacity:.65, marginBottom:4, whiteSpace:'nowrap' }}>Net à payer</div>
              <div style={{ fontSize:20, fontWeight:700, fontFamily:'Courier New, monospace', letterSpacing:1, whiteSpace:'nowrap' }}>{fmt(netSalary)}</div>
              <div style={{ fontSize:8, opacity:.55, marginTop:2, letterSpacing:1 }}>FCFA</div>
            </div>
          </div>
        </div>

        {/* ── MESSAGE EMPLOYEUR ───────────────────────────────────────────── */}
        {tpl.style.footerMessage && (
          <div style={{ border:`1px solid ${ACCENT}`, padding:'6px 12px', marginTop:8, fontSize:9, fontStyle:'italic', color:'#333', background:'#fffdf0' }}>
            {tpl.style.footerMessage}
          </div>
        )}

        {/* ── SIGNATURES ──────────────────────────────────────────────────── */}
        <div className="adm-no-break" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:24, padding:'12px 0 8px', borderTop:`1px solid #bbb`, marginTop:10 }}>
          {[
            { label:"Signature de l'Employé(e)", sub:"Lu et approuvé" },
            { label:"Signature et cachet de l'Employeur", sub:"Cachet & signature obligatoire" },
          ].map(s => (
            <div key={s.label} style={{ textAlign:'center' }}>
              <div style={{ fontSize:9, fontWeight:700, color:'#000', marginBottom:8, textTransform:'uppercase', letterSpacing:.5 }}>{s.label}</div>
              <div style={{ height:44, borderBottom:`1.5px solid #000` }} />
              <div style={{ fontSize:8.5, color:'#333', marginTop:4 }}>{s.sub}</div>
            </div>
          ))}
        </div>

        {/* ── PIED DE PAGE ────────────────────────────────────────────────── */}
        <div style={{ borderTop:`2px solid ${ACCENT}`, padding:'6px 0', marginTop:6, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div style={{ fontSize:8.5, color:'#444' }}>
            Code du Travail — Loi n°45-75 · CNSS 4% sal. · ITS barème 2026 · SMIG 70 400 FCFA · Décret 78-360 HS
          </div>
          <div style={{ fontSize:8.5, fontWeight:700, color:'#000', letterSpacing:1 }}>KONZARH</div>
        </div>

        <div className="adm-legal" style={{ textAlign:'center', fontSize:8.5, color:'#aaa', marginTop:4 }}>
          Généré automatiquement — KonzaRH · ITS 2026 · CNSS 4% · SMIG 70 400 FCFA
        </div>

      </div>
    </>
  );
}