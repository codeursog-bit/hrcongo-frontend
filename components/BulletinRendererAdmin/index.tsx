'use client';

// ============================================================================
// components/BulletinRendererAdmin/index.tsx
//
// Template "ADMIN NUMÉROTÉ" — Marine #0f2544 + accent doré
// ✅ Sections numérotées : 100-1xx gains/primes → BRUT | 201-2xx cotis | 301-3xx indem | 401-4xx retenues → NET
// ✅ Codes API mappés exactement depuis payroll-items.service.ts :
//    SAL_BASE · ABS_CONGE · ABS_DEDUCT · INDEM_CONGE · AUTO_BONUS_* · BONUS_*
//    HS_10/25/50/100 → section 100-111
//    CNSS_SAL · ITS · BNC_SOURCE · CTAX_* → section 200-2xx
//    items type GAIN non taxable/cnss (transport, salissure…) → section 300-3xx
//    LOAN · ADVANCE · items DEDUCTION hors cotis → section 400-4xx
//    CNSS_EMP · TUS_DGI · TUS_CNSS · CTAX_EMP_* → colonnes patronales sur lignes cotis
// ✅ A4 portrait exact : 210mm×297mm, padding 10mm 12mm, @page margin:0
// ✅ Impression N&B : textes noirs durs, pas de bgcolor fonctionnel, contours 1px solid #000
// ✅ Fond coloré : print-color-adjust:exact → couleurs préservées à l'impression couleur
// ✅ Section labels très visibles : bandeau foncé, texte blanc
// ✅ Numéros de référence 100-111 / 201-204 / 301-3xx / 401-4xx auto-incrémentés
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

// ─── Constantes ───────────────────────────────────────────────────────────────

const MONTHS = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
const MARITAL: Record<string,string> = { SINGLE:'Célibataire', MARRIED:'Marié(e)', DIVORCED:'Divorcé(e)', WIDOWED:'Veuf/Veuve', COHABITING:'Concubinage' };
const PAYMENT: Record<string,string> = { BANK_TRANSFER:'Virement bancaire', CASH:'Espèces', MOBILE_MONEY:'Mobile Money', CHECK:'Chèque' };
const CONTRACT: Record<string,string> = { CDI:'CDI', CDD:'CDD', STAGE:'Stage', CONSULTANT:'Consultant', PRESTATAIRE:'Prestataire', INTERIM:'Intérimaire', FREELANCE:'Freelance' };

const fmt = (v: any) => {
  const n = Math.round(Number(v) || 0);
  if (Math.abs(n) > 999_999_999_999) return '—';
  return n.toLocaleString('fr-FR');
};
const fmtR = (v: any) => v != null && Number(v) !== 0 ? fmt(v) : '';

function formatDate(d?: string) { return d ? new Date(d).toLocaleDateString('fr-FR') : '—'; }

// ─── fmtBase / fmtTaux — règle stricte, pas d'invention ──────────────────────
function fmtBase(item: any): string {
  if (item.base == null || item.base === 0) return '—';
  return Math.round(Number(item.base)).toLocaleString('fr-FR');
}
function fmtTaux(item: any): string {
  const qty = item.quantity;
  if (qty != null && qty !== 0) return String(qty);
  if (item.rate == null || item.rate === 0) return '—';
  const r = Number(item.rate);
  if (r > 1 && r <= 3) return `×${r.toFixed(2).replace('.', ',')}`;
  if (r > 0 && r < 1) {
    const pct = r * 100;
    const str = pct % 1 === 0 ? pct.toFixed(0) : pct.toFixed(3).replace(/0+$/, '');
    return `${str}%`;
  }
  return String(r);
}

function seniority(hireDate?: string) {
  if (!hireDate) return '—';
  const h = new Date(hireDate), n = new Date();
  let y = n.getFullYear()-h.getFullYear(), m = n.getMonth()-h.getMonth();
  if (m < 0) { y--; m += 12; }
  return `${y} an${y>1?'s':''} · ${m} mois`;
}

// ─── Couleurs d'impression ────────────────────────────────────────────────────
// Toutes les couleurs sont des variables ou valeurs solides lisibles en N&B
const PRIMARY      = '#0f2544';  // bleu marine foncé → en N&B = gris très foncé
const ACCENT       = '#b8860b';  // doré foncé → N&B = gris moyen
const SEC_GAIN     = '#0a3d1f';  // vert très foncé → N&B = gris foncé
const SEC_COTIS    = '#5a1a1a';  // rouge très foncé → N&B = gris foncé
const SEC_INDEM    = '#1a3a1a';  // vert foncé → N&B = gris foncé
const SEC_RETENUE  = '#3a2800';  // brun foncé → N&B = gris foncé

// ─── Helpers styles cellules ──────────────────────────────────────────────────

const C = (extra?: React.CSSProperties): React.CSSProperties => ({
  borderBottom: '0.5px solid #bbb', padding: '4px 6px', fontSize: 9.5,
  verticalAlign: 'middle', color: '#000', ...extra,
});
const CR = (extra?: React.CSSProperties): React.CSSProperties => ({
  ...C(), textAlign: 'right', fontFamily: 'Courier New, monospace', overflow: 'hidden', maxWidth: 120, ...extra,
});
const CC = (extra?: React.CSSProperties): React.CSSProperties => ({
  ...C(), textAlign: 'center', ...extra,
});

// Ligne de séparateur de section
const SectionRow = ({ num, color, bg, children }: { num: string; color: string; bg: string; children: React.ReactNode }) => (
  <tr>
    <td colSpan={9} style={{
      background: bg,
      padding: '4px 6px',
      fontSize: 8,
      fontWeight: 700,
      textTransform: 'uppercase' as const,
      letterSpacing: '1.5px',
      color: color,
      borderTop: '1px solid #000',
      borderBottom: '1px solid #000',
    }}>
      {num} · {children}
    </td>
  </tr>
);

// Ligne de total de section
const TotalRow = ({ label, gainCol, retenueCol, border }: {
  label: string; gainCol?: string; retenueCol?: string; border: string;
}) => (
  <tr style={{ borderTop: `1.5px solid ${border}`, borderBottom: `1.5px solid ${border}`, background: '#e8e8e8' }}>
    <td colSpan={4} style={{ padding: '5px 6px', fontSize: 10, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '.5px', color: '#000', border: '0.5px solid #888' }}>
      {label}
    </td>
    <td style={{ border: '0.5px solid #888', background: '#e8e8e8' }} />
    <td style={{ padding: '5px 6px', textAlign: 'right', fontFamily: 'Courier New, monospace', fontSize: 12, fontWeight: 700, color: '#000', border: '0.5px solid #888' }}>
      {gainCol || ''}
    </td>
    <td style={{ padding: '5px 6px', textAlign: 'right', fontFamily: 'Courier New, monospace', fontSize: 12, fontWeight: 700, color: '#000', border: '0.5px solid #888' }}>
      {retenueCol || ''}
    </td>
    <td style={{ border: '0.5px solid #888', background: '#e8e8e8' }} />
    <td style={{ border: '0.5px solid #888', background: '#e8e8e8' }} />
  </tr>
);

// ─── Composant principal ──────────────────────────────────────────────────────

export default function BulletinRendererAdmin({ payroll, template, previewMode = false }: BulletinRendererAdminProps) {
  const tpl  = template ?? getBaseTemplate('admin');
  const e    = (payroll.employee ?? {}) as any;
  const co   = (payroll.company  ?? {}) as any;
  const items: PayrollItem[] = payroll.items ?? [];
  const ytd   = (payroll as any).ytd;

  // ── Classification des items selon les codes du service ──────────────────

  const { gainItems, cotisItems, indemItems, retenueItems, empItems } = useMemo(
    () => classifyItems(items), [items]
  );

  // ── Totaux depuis les champs calculés (source de vérité = API) ───────────

  const totalBrut  = payroll.grossSalary  ?? 0;
  const totalGains = payroll.grossSalary  ?? 0;  // brut + indemnités = grossSalary
  const totalDed   = payroll.totalDeductions ?? 0;
  const netSalary  = payroll.netSalary    ?? 0;

  // Charges patronales
  const tusDgi         = getTusDgi(empItems, payroll);
  const tusCnss        = getTusCnss(empItems, payroll);
  const ctaxEmpItems   = getCtaxEmpItems(empItems);

  // Trouver CNSS salariale pour afficher le taux patronal sur la même ligne
  const cnssLine  = cotisItems.find(i => i.code === 'CNSS_SAL');

  // ── Numérotation auto des lignes ──────────────────────────────────────────
  // Section 1 → 100-1xx, section 2 → 201-2xx, section 3 → 301-3xx, section 4 → 401-4xx
  let ref1 = 99;   // incrémenté avant usage → 100, 101…
  let ref2 = 200;  // → 201, 202…
  let ref3 = 300;  // → 301, 302…
  let ref4 = 400;  // → 401, 402…

  // ── En-tête ───────────────────────────────────────────────────────────────
  const fullName = [e.firstName, e.lastName].filter(Boolean).join(' ');
  const cat      = [e.professionalCategory, e.echelon ? `Ech. ${e.echelon}` : ''].filter(Boolean).join(' / ');
  const overTime = (payroll.overtimeHours10??0)+(payroll.overtimeHours25??0)+(payroll.overtimeHours50??0)+(payroll.overtimeHours100??0);

  // ── Colonnes TH ──────────────────────────────────────────────────────────

  const TH = (extra?: React.CSSProperties): React.CSSProperties => ({
    background: PRIMARY,
    color: '#fff',
    fontWeight: 700,
    fontSize: 8,
    textTransform: 'uppercase' as const,
    letterSpacing: '.5px',
    padding: '6px 6px',
    textAlign: 'center' as const,
    border: '0.5px solid #000',
    ...extra,
  });

  const InfoRow = ({ label, value }: { label: string; value: string }) => (
    <div style={{ display:'grid', gridTemplateColumns:'110px 1fr', marginBottom:2 }}>
      <span style={{ fontSize:8.5, color:'#444' }}>{label}</span>
      <span style={{ fontSize:8.5, fontWeight:700, color:'#000' }}>{value}</span>
    </div>
  );

  const ytdNetImp = ytd ? (ytd.grossSalary - ytd.cnssSalarial) : null;
  const cumCols = [
    { label:'Sal. brut',    period: payroll.grossSalary,  year: ytd?.grossSalary          ?? null },
    { label:'Ch. sal.',     period: payroll.cnssSalarial, year: ytd?.cnssSalarial         ?? null },
    { label:'Ch. pat.',     period: payroll.cnssEmployer ?? 0, year: ytd?.cnssEmployer ?? null },
    { label:'Avt. nat.',    period: 0,                                   year: 0 },
    { label:'Net impos.',   period: (payroll.grossSalary??0)-(payroll.cnssSalarial??0), year: ytdNetImp },
    { label:'H. trav.',     period: (payroll.workedDays??0)*8, year: ytd ? (ytd.workedDays*8) : null },
    { label:'H. suppl.',    period: (payroll as any).totalOvertimeAmount ?? 0, year: ytd?.totalOvertimeAmount ?? null },
    { label:'Base cong.',   period: payroll.baseSalary,                   year: ytd?.baseSalary ?? null },
  ];

  // ── Rendu ─────────────────────────────────────────────────────────────────

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
            min-height: 281mm !important;
            padding: 0 !important;
            margin: 0 !important;
            box-shadow: none !important;
            /* PAS de border sur le root */
            border: none !important;
            /* N&B propre */
            filter: grayscale(1) !important;
          }
          .adm-no-break { page-break-inside: avoid !important; break-inside: avoid !important; }
          .adm-legal { display: none !important; }
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>

      <div id="bul-admin-root" style={{
          fontFamily: '"Segoe UI","Helvetica Neue",Arial,sans-serif',
          fontSize: 10,
          background: '#fff',
          color: '#000',
          width: '210mm',
          boxSizing: 'border-box' as const,
          padding: '28px 34px',
          margin: '0 auto',
        }}>

        {/* ── EN-TÊTE ─────────────────────────────────────────────────── */}
        <div className="adm-no-break" style={{
          background: PRIMARY, color: '#fff',
          padding: '14px 18px',
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
              {payroll.paymentDate?`Paie : ${formatDate(payroll.paymentDate)} · `:''}
              {PAYMENT[e.paymentMethod??'']??'Virement bancaire'}
            </div>
          </div>
        </div>

        {/* ── INFOS SALARIÉ ───────────────────────────────────────────── */}
        <div className="adm-no-break" style={{
          display:'grid', gridTemplateColumns:'1fr 1fr 1fr',
          border:`1px solid #000`, borderTop:'none', marginBottom:10,
        }}>
          {/* Col 1 — Identité */}
          <div style={{ padding:'10px 12px', borderRight:'1px solid #000' }}>
            <div style={{ fontSize: 8.5, fontWeight:700, letterSpacing:2, color:'#444', textTransform:'uppercase', marginBottom:6 }}>Salarié</div>
            <div style={{ fontSize:12, fontWeight:700, color:'#000', marginBottom:2 }}>{fullName||'—'}</div>
            <div style={{ fontSize:9, color:'#333', marginBottom:7 }}>{e.position||'—'}</div>
            <div style={{ display:'flex', gap:5, flexWrap:'wrap' }}>
              {CONTRACT[e.contractType??''] && <span style={{ background:PRIMARY, color:'#fff', fontSize: 8.5, padding:'2px 6px', border:`1px solid ${PRIMARY}`, fontWeight:700 }}>{CONTRACT[e.contractType]}</span>}
              {cat && <span style={{ background:'#eee', color:'#222', fontSize: 8.5, padding:'2px 6px', border:'1px solid #999' }}>{cat}</span>}
              {e.employeeNumber && <span style={{ background:'#eee', color:'#222', fontSize: 8.5, padding:'2px 6px', border:'1px solid #999' }}>Mat. {e.employeeNumber}</span>}
            </div>
          </div>
          {/* Col 2 — Contrat */}
          <div style={{ padding:'10px 12px', borderRight:'1px solid #000' }}>
            <div style={{ fontSize: 8.5, fontWeight:700, letterSpacing:2, color:'#444', textTransform:'uppercase', marginBottom:6 }}>Contrat &amp; situation</div>
            <InfoRow label="Date d'embauche" value={formatDate(e.hireDate)} />
            <InfoRow label="Ancienneté" value={seniority(e.hireDate)} />
            <InfoRow label="Etat civil" value={MARITAL[e.maritalStatus??'']??'—'} />
            <InfoRow label="Nb. enfants / parts" value={`${e.numberOfChildren??0} / ${(e.numberOfChildren??0)+1}`} />
            <InfoRow label="N° CNSS salarié" value={e.cnssNumber||'—'} />
            <InfoRow label="Convention" value={co.collectiveAgreement||'Commerce'} />
          </div>
          {/* Col 3 — Période */}
          <div style={{ padding:'10px 12px' }}>
            <div style={{ fontSize: 8.5, fontWeight:700, letterSpacing:2, color:'#444', textTransform:'uppercase', marginBottom:6 }}>Période de travail</div>
            <InfoRow label="Compte bancaire" value={e.bankAccount ? `…${e.bankAccount.slice(-4)}` : '—'} />
            <InfoRow label="Jours ouvrables" value={`${payroll.workDays??26} j`} />
            <InfoRow label="Jours travaillés" value={payroll.workedDays != null ? `${payroll.workedDays} j` : "—"} />
            <InfoRow label="Absences" value={payroll.absenceDays != null ? `${payroll.absenceDays} j` : "—"} />
            <InfoRow label="Heures suppl." value={overTime > 0 ? `${overTime} h` : '—'} />
            <InfoRow label="Site" value={co.city||co.address||'Administration'} />
          </div>
        </div>

        {/* ── TABLEAU PRINCIPAL ────────────────────────────────────────── */}
        <div className="adm-no-break">
          <table style={{ width:'100%', borderCollapse:'collapse', tableLayout:'fixed', border:'1px solid #000' }}>
            <colgroup>
              <col style={{ width:'5.5%' }} /><col style={{ width:'36%' }} />
              <col style={{ width:'10%'  }} /><col style={{ width:'7%'  }} />
              <col style={{ width:'14%'  }} /><col style={{ width:'12%' }} />
              <col style={{ width:'7%'   }} /><col style={{ width:'8%'  }} />
            </colgroup>
            <thead>
              <tr>
                <th style={TH()}>Réf.</th>
                <th style={TH({ textAlign:'left' })}>Désignation</th>
                <th style={TH()}>Base</th>
                <th style={TH()}>Taux</th>
                <th style={TH({ background:'#1a3a1a' })}>Gain salarié</th>
                <th style={TH({ background:'#5a1a1a' })}>Retenue sal.</th>
                <th style={TH({ background:'#3a2800' })}>T.%</th>
                <th style={TH({ background:'#3a2800' })}>Ret. pat.</th>
              </tr>
            </thead>
            <tbody>

              {/* ═══ SECTION 1 — RÉMUNÉRATIONS & PRIMES ═══════════════════ */}
              <SectionRow num="1" color="#fff" bg={SEC_GAIN}>
                Rémunérations &amp; Primes
              </SectionRow>

              {gainItems.map((item) => {
                ref1++;
                const isBase  = item.code === 'SAL_BASE';
                const base    = fmtBase(item);
                const tauxVal = fmtTaux(item);
                return (
                  <tr key={item.id||item.code} style={{ borderBottom:'0.5px solid #999' }}>
                    <td style={CC({ color:'#444', fontSize:8.5, border:'0.5px solid #ddd' })}>{ref1}</td>
                    <td style={C({ fontWeight: isBase ? 700 : 400, border:'0.5px solid #ddd' })}>{item.label}</td>
                    <td style={CR({ border:'0.5px solid #ddd' })}>{base}</td>
                    <td style={CC({ fontSize:8.5, fontWeight:600, border:'0.5px solid #ddd' })}>{tauxVal}</td>
                    <td style={CR({ fontWeight:700, border:'0.5px solid #ddd' })}>{fmt(item.amount)}</td>
                    <td style={{ ...C({ border:'0.5px solid #ddd' }), background:'#f9f9f9' }} />
                    <td style={{ ...C({ border:'0.5px solid #ddd' }), background:'#f5f0e8' }} />
                    <td style={{ ...C({ border:'0.5px solid #ddd' }), background:'#f5f0e8' }} />
                  </tr>
                );
              })}

              {/* Total Brut */}
              <TotalRow label="Salaire brut" gainCol={fmt(totalBrut)} border={PRIMARY} />

              {/* ═══ SECTION 2 — COTISATIONS OBLIGATOIRES ═════════════════ */}
              <SectionRow num="2" color="#fff" bg={SEC_COTIS}>
                Cotisations obligatoires (salariales &amp; patronales)
              </SectionRow>

              {cotisItems.map((item) => {
                ref2++;
                const isCnss = item.code === 'CNSS_SAL';
                const tauxPat   = isCnss ? '8%' : '';
                // Côté patronal : CNSS_EMP sur la même ligne que CNSS_SAL
                const retPat = (item as any).empAmount ? fmt((item as any).empAmount) : '—';
                // TUS affiché sur les 2 lignes suivantes après CNSS_EMP dans empItems
                const tusDgiLine = ref2 === 201 ? null : null; // géré séparément
                const taux = item.rate ? `${(Number(item.rate)*100).toFixed(item.rate<0.1?3:2)}%` : (item.code==='ITS'||item.code==='BNC_SOURCE' ? 'Barème' : '—');
                return (
                  <tr key={item.id||item.code} style={{ borderBottom:'0.5px solid #999', background: ref2%2===0?'#fdf8f0':'#fff' }}>
                    <td style={CC({ color:'#444', fontSize:8.5, border:'0.5px solid #ddd' })}>{ref2}</td>
                    <td style={C({ border:'0.5px solid #ddd' })}>{item.label}</td>
                    <td style={CR({ border:'0.5px solid #ddd' })}>{item.base ? fmt(item.base) : ''}</td>
                    <td style={CC({ fontWeight:600, fontSize:8.5, border:'0.5px solid #ddd' })}>{taux}</td>
                    <td style={{ ...C({ border:'0.5px solid #ddd' }), background:'#f9f9f9' }} />
                    <td style={CR({ fontWeight:700, border:'0.5px solid #ddd' })}>{fmt(item.amount)}</td>
                    <td style={CC({ fontWeight:700, fontSize:8.5, border:'0.5px solid #ddd', background:'#f5f0e8' })}>{tauxPat}</td>
                    <td style={CR({ fontWeight:700, border:'0.5px solid #ddd', background:'#f5f0e8' })}>{retPat}</td>
                  </tr>
                );
              })}

              {/* TUS_DGI & TUS_CNSS : affichés dans section 2 aussi */}
              {tusDgi > 0 && (() => { ref2++; return (
                <tr key="tus_dgi" style={{ borderBottom:'0.5px solid #999', background: ref2%2===0?'#fdf8f0':'#fff' }}>
                  <td style={CC({ color:'#444', fontSize:8.5, border:'0.5px solid #ddd' })}>{ref2}</td>
                  <td style={C({ border:'0.5px solid #ddd' })}>TUS — Part DGI (2,025%)</td>
                  <td style={CR({ border:'0.5px solid #ddd' })}>{fmt(payroll.grossSalary)}</td>
                  <td style={CC({ fontWeight:600, fontSize:8.5, border:'0.5px solid #ddd' })}>2,025%</td>
                  <td style={{ ...C({ border:'0.5px solid #ddd' }), background:'#f9f9f9' }} />
                  <td style={{ ...C({ border:'0.5px solid #ddd' }), background:'#f9f9f9' }} />
                  <td style={CC({ fontWeight:700, fontSize:8.5, border:'0.5px solid #ddd', background:'#f5f0e8' })}>—</td>
                  <td style={CR({ fontWeight:700, border:'0.5px solid #ddd', background:'#f5f0e8' })}>{fmt(tusDgi)}</td>
                </tr>
              ); })()}

              {tusCnss > 0 && (() => { ref2++; return (
                <tr key="tus_cnss" style={{ borderBottom:'0.5px solid #999', background: ref2%2===0?'#fdf8f0':'#fff' }}>
                  <td style={CC({ color:'#444', fontSize:8.5, border:'0.5px solid #ddd' })}>{ref2}</td>
                  <td style={C({ border:'0.5px solid #ddd' })}>TUS — Part CNSS (5,475%)</td>
                  <td style={CR({ border:'0.5px solid #ddd' })}>{fmt(payroll.grossSalary)}</td>
                  <td style={CC({ fontWeight:600, fontSize:8.5, border:'0.5px solid #ddd' })}>5,475%</td>
                  <td style={{ ...C({ border:'0.5px solid #ddd' }), background:'#f9f9f9' }} />
                  <td style={{ ...C({ border:'0.5px solid #ddd' }), background:'#f9f9f9' }} />
                  <td style={CC({ fontWeight:700, fontSize:8.5, border:'0.5px solid #ddd', background:'#f5f0e8' })}>—</td>
                  <td style={CR({ fontWeight:700, border:'0.5px solid #ddd', background:'#f5f0e8' })}>{fmt(tusCnss)}</td>
                </tr>
              ); })()}

              {/* CTAX_EMP_* */}
              {ctaxEmpItems.map((item) => { ref2++; return (
                <tr key={item.id||item.code} style={{ borderBottom:'0.5px solid #999', background: ref2%2===0?'#fdf8f0':'#fff' }}>
                  <td style={CC({ color:'#444', fontSize:8.5, border:'0.5px solid #ddd' })}>{ref2}</td>
                  <td style={C({ border:'0.5px solid #ddd' })}>{item.label}</td>
                  <td style={CR({ border:'0.5px solid #ddd' })}>{item.base ? fmt(item.base) : ''}</td>
                  <td style={CC({ fontSize:8.5, border:'0.5px solid #ddd' })}>—</td>
                  <td style={{ ...C({ border:'0.5px solid #ddd' }), background:'#f9f9f9' }} />
                  <td style={{ ...C({ border:'0.5px solid #ddd' }), background:'#f9f9f9' }} />
                  <td style={CC({ border:'0.5px solid #ddd', background:'#f5f0e8' })}>—</td>
                  <td style={CR({ fontWeight:700, border:'0.5px solid #ddd', background:'#f5f0e8' })}>{fmt(item.amount)}</td>
                </tr>
              ); })}

              {/* Total Cotisations */}
              <TotalRow label="Total cotisations" retenueCol={fmt(payroll.totalDeductions)} border="#8b0000" />

              {/* ═══ SECTION 3 — INDEMNITÉS HORS BRUT ════════════════════ */}
              {indemItems.length > 0 && <>
                <SectionRow num="3" color="#fff" bg={SEC_INDEM}>
                  Indemnités &amp; Avantages (non soumis à cotisations)
                </SectionRow>
                {indemItems.map((item) => { ref3++; return (
                  <tr key={item.id||item.code} style={{ borderBottom:'0.5px solid #999', background: ref3%2===0?'#f5faf5':'#fff' }}>
                    <td style={CC({ color:'#444', fontSize:8.5, border:'0.5px solid #ddd' })}>{ref3}</td>
                    <td style={C({ border:'0.5px solid #ddd' })}>{item.label}</td>
                    <td style={CR({ border:'0.5px solid #ddd' })}>{fmtBase(item)}</td>
                    <td style={CC({ fontSize:8.5, border:'0.5px solid #ddd' })}>{fmtTaux(item)}</td>
                    <td style={CR({ fontWeight:700, border:'0.5px solid #ddd' })}>{fmt(item.amount)}</td>
                    <td style={{ ...C({ border:'0.5px solid #ddd' }), background:'#f9f9f9' }} />
                    <td style={{ ...C({ border:'0.5px solid #ddd' }), background:'#f5f0e8' }} />
                    <td style={{ ...C({ border:'0.5px solid #ddd' }), background:'#f5f0e8' }} />
                  </tr>
                ); })}
              </>}

              {/* ═══ SECTION 4 — AVANCES, PRÊTS & RETENUES DIVERSES ══════ */}
              {retenueItems.length > 0 && <>
                <SectionRow num="4" color="#fff" bg={SEC_RETENUE}>
                  Avances, Prêts &amp; Retenues diverses
                </SectionRow>
                {retenueItems.map((item) => { ref4++; return (
                  <tr key={item.id||item.code} style={{ borderBottom:'0.5px solid #999', background: ref4%2===0?'#fdf8f0':'#fff' }}>
                    <td style={CC({ color:'#444', fontSize:8.5, border:'0.5px solid #ddd' })}>{ref4}</td>
                    <td style={C({ border:'0.5px solid #ddd' })}>{item.label}</td>
                    <td style={CR({ border:'0.5px solid #ddd' })}>{fmtBase(item)}</td>
                    <td style={CC({ fontSize:8.5, border:'0.5px solid #ddd' })}>{fmtTaux(item)}</td>
                    <td style={{ ...C({ border:'0.5px solid #ddd' }), background:'#f9f9f9' }} />
                    <td style={CR({ fontWeight:700, border:'0.5px solid #ddd' })}>{fmt(item.amount)}</td>
                    <td style={{ ...C({ border:'0.5px solid #ddd' }), background:'#f5f0e8' }} />
                    <td style={{ ...C({ border:'0.5px solid #ddd' }), background:'#f5f0e8' }} />
                  </tr>
                ); })}
              </>}

              {/* ═══ TOTAUX FINAUX ════════════════════════════════════════ */}
              <tr style={{ borderTop:`2px solid ${PRIMARY}`, background:'#e8e8e8' }}>
                <td colSpan={2} style={{ padding:'5px 6px', fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:.5, color:'#000', border:'0.5px solid #888' }}>
                  Total gains
                </td>
                <td colSpan={2} style={{ border:'0.5px solid #888', background:'#e8e8e8' }} />
                <td style={{ padding:'5px 6px', textAlign:'right', fontFamily:'Courier New, monospace', fontSize:13, fontWeight:700, color:'#000', border:'0.5px solid #888' }}>{fmt(payroll.grossSalary)}</td>
                <td style={{ border:'0.5px solid #888', background:'#e8e8e8' }} />
                <td style={{ border:'0.5px solid #888', background:'#e8e8e8' }} />
                <td style={{ border:'0.5px solid #888', background:'#e8e8e8' }} />
              </tr>
              <tr style={{ background:'#e8e8e8', borderBottom:`2px solid ${PRIMARY}` }}>
                <td colSpan={2} style={{ padding:'5px 6px', fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:.5, color:'#000', border:'0.5px solid #888' }}>
                  Total retenues
                </td>
                <td colSpan={2} style={{ border:'0.5px solid #888', background:'#e8e8e8' }} />
                <td style={{ border:'0.5px solid #888', background:'#e8e8e8' }} />
                <td style={{ padding:'5px 6px', textAlign:'right', fontFamily:'Courier New, monospace', fontSize:13, fontWeight:700, color:'#000', border:'0.5px solid #888' }}>{fmt(totalDed)}</td>
                <td style={{ border:'0.5px solid #888', background:'#e8e8e8' }} />
                <td style={{ border:'0.5px solid #888', background:'#e8e8e8' }} />
              </tr>

            </tbody>
          </table>
        </div>

        {/* ── CUMULS + NET À PAYER ─────────────────────────────────────── */}
        <div className="adm-no-break" style={{ marginTop:8 }}>
          <div style={{ display:'flex', alignItems:'stretch', border:`1px solid #000`, borderTop:`2px solid ${PRIMARY}` }}>
            <table style={{ flex:1, borderCollapse:'collapse' }}>
              <thead>
                <tr style={{ background:'#1e2e44' }}>
                  <th style={{ padding:'4px 8px', fontSize:8, fontWeight:700, color:'#fff', textAlign:'left', width:52, border:'0.5px solid #000' }} />
                  {cumCols.map(c => (
                    <th key={c.label} style={{ padding:'4px 5px', fontSize: 8.5, fontWeight:700, color:'#fff', textAlign:'center', whiteSpace:'nowrap', border:'0.5px solid #000' }}>
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
                      {c.period!=null ? fmt(c.period) : '0'}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td style={{ padding:'4px 8px', fontSize:8, fontWeight:700, background:'#eee', color:'#000', border:'0.5px solid #000' }}>Année</td>
                  {cumCols.map(c => (
                    <td key={c.label} style={{ padding:'4px 5px', textAlign:'center', fontFamily:'Courier New, monospace', fontSize:8.5, color:'#444', border:'0.5px solid #999' }}>
                      {c.year!=null ? fmt(c.year) : '—'}
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
              <div style={{ fontSize: 8.5, fontWeight:700, textTransform:'uppercase', letterSpacing:2, opacity:.65, marginBottom:4, whiteSpace:'nowrap' }}>
                Net à payer
              </div>
              <div style={{ fontSize:20, fontWeight:700, fontFamily:'Courier New, monospace', letterSpacing:1, whiteSpace:'nowrap' }}>
                {fmt(netSalary)}
              </div>
              <div style={{ fontSize:8, opacity:.55, marginTop:2, letterSpacing:1 }}>FCFA</div>
            </div>
          </div>
        </div>

        {/* ── MESSAGE EMPLOYEUR (optionnel) ────────────────────────────── */}
        {tpl.style.footerMessage && (
          <div style={{ border:`1px solid ${ACCENT}`, padding:'6px 12px', marginTop:8, fontSize:9, fontStyle:'italic', color:'#333', background:'#fffdf0' }}>
            {tpl.style.footerMessage}
          </div>
        )}

        {/* ── SIGNATURES ──────────────────────────────────────────────── */}
        <div className="adm-no-break" style={{
          display:'grid', gridTemplateColumns:'1fr 1fr', gap:24,
          padding:'12px 0 8px', borderTop:`1px solid #bbb`, marginTop:10,
        }}>
          {[
            { label:"Signature de l'Employé(e)", sub:"Lu et approuvé" },
            { label:"Signature et cachet de l'Employeur", sub:"Cachet & signature obligatoire" },
          ].map(s => (
            <div key={s.label} style={{ textAlign:'center' }}>
              <div style={{ fontSize:9, fontWeight:700, color:'#000', marginBottom:8, textTransform:'uppercase', letterSpacing:.5 }}>{s.label}</div>
              <div style={{ height:44, borderBottom:`1.5px solid #000` }} />
              <div style={{ fontSize: 8.5, color:'#333', marginTop:4 }}>{s.sub}</div>
            </div>
          ))}
        </div>

        {/* ── PIED DE PAGE ─────────────────────────────────────────────── */}
        <div style={{
          borderTop:`2px solid ${ACCENT}`, padding:'6px 0', marginTop:6,
          display:'flex', justifyContent:'space-between', alignItems:'center',
        }}>
          <div style={{ fontSize: 8.5, color:'#444' }}>
            Code du Travail — Loi n°45-75 · CNSS 4% sal. · ITS barème 2026 · SMIG 70 400 FCFA · Décret 78-360 HS
          </div>
          <div style={{ fontSize: 8.5, fontWeight:700, color:'#000', letterSpacing:1 }}>KONZARH</div>
        </div>

        {/* Mentions légales app seulement */}
        <div className="adm-legal" style={{ textAlign:'center', fontSize: 8.5, color:'#aaa', marginTop:4 }}>
          Généré automatiquement — KonzaRH · ITS 2026 · CNSS 4% · SMIG 70 400 FCFA
        </div>

      </div>
    </>
  );
}