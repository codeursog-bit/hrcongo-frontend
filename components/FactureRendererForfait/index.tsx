'use client';

// ============================================================================
// components/FactureRendererForfait/index.tsx
//
// Gabarit "Facture forfait simple" — reproduit fidèlement la disposition du
// modèle papier "Pharmacie Banque de Vie" fourni par le client :
//   - En-tête (nom société + ville/date) aligné à GAUCHE, pas centré
//   - Bandeau nom+qualité surligné, cadré au texte (pas pleine largeur)
//   - Liste libellé/valeur resserrée (colonne étroite, pas étalée sur
//     toute la largeur de la page)
//   - 2 blocs de signature groupés à gauche, pas étalés bord à bord
//
// Destiné aux contrats PRESTATAIRE / CONSULTANT / INTERIM / STAGE payés au
// forfait DIRECTEMENT par leur employeur (reçu interne employeur↔employé,
// signé par les deux parties — pas de client externe facturé).
// → voir components/FactureRendererClient pour la facture adressée à un
//   client externe ("Doit :" + numéro de facture).
//
// Aucune donnée nouvelle : mêmes PayrollItem[] que les bulletins
// (classifyItems), on n'affiche que ce qui existe réellement (montant > 0).
// ============================================================================

import React, { useMemo } from 'react';
import type { BulletinPayroll, BulletinTemplateConfig, PayrollItem } from '@/types/bulletin-template';
import { classifyItems } from '@/lib/bulletin-items-classifier';
import { getBaseTemplate } from '@/lib/bulletin-templates';

export interface FactureRendererForfaitProps {
  payroll:      BulletinPayroll;
  template?:    BulletinTemplateConfig;
  previewMode?: boolean;
}

const CONTRACT: Record<string, string> = {
  CDI: 'CDI', CDD: 'CDD', STAGE: 'Stagiaire', CONSULTANT: 'Consultant',
  PRESTATAIRE: 'Prestataire', INTERIM: 'Intérimaire', FREELANCE: 'Freelance',
};

const MOIS = [
  'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
  'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre',
];

const nv  = (v: any): number => { const x = Number(v); return isFinite(x) ? x : 0; };
const fmt = (v: any): string  => Math.round(nv(v)).toLocaleString('fr-FR');

const SANS = 'Arial,Helvetica,sans-serif';
const K    = '#000';
const BD   = '1px solid #000';

// ── Ligne "LIBELLÉ :" / valeur — colonne resserrée, pas étalée ────────────
const Row = ({ label, value, bold = false, divider = false }: { label: string; value: string; bold?: boolean; divider?: boolean }) => (
  <tr>
    <td style={{
      padding: bold ? '5px 18px 5px 0' : '2.5px 18px 2.5px 0', fontSize: bold ? 12.5 : 11,
      fontWeight: bold ? 800 : 600, borderTop: divider ? BD : 'none',
      textTransform: 'uppercase' as const, maxWidth: '78mm',
    }}>{label} :</td>
    <td style={{
      padding: bold ? '5px 0' : '2.5px 0', fontSize: bold ? 13 : 11,
      fontWeight: bold ? 800 : 500, borderTop: divider ? BD : 'none',
      textAlign: 'right', fontVariantNumeric: 'tabular-nums',
    }}>{value}</td>
  </tr>
);

export default function FactureRendererForfait({ payroll, template, previewMode }: FactureRendererForfaitProps) {
  const tpl = template ?? getBaseTemplate('classique');
  const e   = (payroll.employee ?? {}) as any;
  const co  = (payroll.company  ?? {}) as any;
  const items: PayrollItem[] = payroll.items ?? [];

  const { gainItems, cotisItems, retenueItems, indemItems } = useMemo(() => classifyItems(items), [items]);

  // ── Forfait / salaire de base (toujours affiché — c'est la ligne pivot) ─
  const forfaitItem = gainItems.find((i: any) => i.code === 'SAL_BASE');
  const forfaitMontant = nv(forfaitItem?.amount ?? payroll.baseSalary);

  // ── Indemnité de congé (si applicable) ──────────────────────────────────
  const congeItem = gainItems.find((i: any) => i.code === 'INDEM_CONGE');
  const congeMontant = nv(congeItem?.amount);

  // ── Absence déduite sur la période (si applicable) ──────────────────────
  const absItem = gainItems.find((i: any) => i.code === 'ABS_DEDUCT');
  const absMontant = nv(absItem?.amount);

  // ── Autres gains (primes, HSup, indemnités diverses…) — génériques, on
  //    affiche tout ce qui a un montant > 0 et n'est pas déjà géré ci-dessus
  const autresGains = gainItems.filter((i: any) =>
    i !== forfaitItem && i !== congeItem && i !== absItem && nv(i.amount) > 0
  );

  // ── Indemnités hors brut (transport, panier, salissure…) — non soumises
  //    ITS/CNSS, classées à part par classifyItems, mais bien payées donc
  //    incluses dans payroll.netSalary. On les affiche comme BulletinRenderer.
  const indems = indemItems.filter((i: any) => nv(i.amount) > 0);

  // ── Retenue BNC (remplace CNSS + ITS pour ce profil) — affichée seulement
  //    si l'employé y est effectivement soumis et qu'un montant existe.
  //    ✅ Le taux (10%/20%, résidence, article CGI) est déjà dans item.label
  //    tel que produit par payroll-calculator.service.ts (calc.bncLabel) —
  //    ne PAS reconstruire un libellé à partir de item.rate (toujours null).
  const bncItem = cotisItems.find((i: any) => i.code === 'BNC_SOURCE' || i.code === 'ITS');
  const bncMontant = nv(bncItem?.amount ?? payroll.its);

  // ── Retenues diverses (avance sur salaire, prêt, retenue libre…) ────────
  const retenues = retenueItems.filter((i: any) => nv(i.amount) > 0);

  // ✅ Net à payer = strictement payroll.netSalary tel que le back l'a calculé.
  // Aucun recalcul front à partir des items — si le back ne l'a pas rempli,
  // ça affiche 0/- tel quel plutôt que de masquer un écart avec un chiffre
  // recalculé qui pourrait diverger du back.
  const netAPayer = nv(payroll.netSalary);

  const fullName = [e.firstName, e.lastName?.toUpperCase()].filter(Boolean).join(' ') || '—';
  const qualite  = e.position || CONTRACT[e.contractType ?? ''] || '—';
  const moisIdx  = Math.max(0, Math.min(11, (payroll.month ?? 1) - 1));
  const moisNom  = MOIS[moisIdx];
  const anneeComplete = payroll.year ?? new Date().getFullYear();
  const moisPrefix = /^[aeiouéèêô]/i.test(moisNom) ? "d'" : 'de ';
  const ville    = co.city || '—';

  return (
    <>
      <style>{`
        @media print {
          @page { size: A5 portrait; margin: 0; }
          body { visibility: hidden !important; background: #fff !important; margin: 0 !important; padding: 0 !important; }
          #fac-forfait-wrap, #fac-forfait-wrap * { visibility: visible !important; }
          #fac-forfait-wrap { position: absolute !important; top: 0 !important; left: 0 !important; width: 100% !important; }
          #fac-forfait { box-shadow: none !important; border: none !important; }
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        }
      `}</style>

      <div id="fac-forfait-wrap" data-bulletin-root="true" style={{ background: '#fff' }}>
        <div id="fac-forfait" style={{
          fontFamily: SANS, color: K, background: '#fff',
          width: '148mm', height: '210mm', boxSizing: 'border-box', padding: '20mm 16mm',
          margin: '0 auto', boxShadow: '0 2px 16px rgba(0,0,0,0.10)',
          display: 'flex', flexDirection: 'column',
        }}>

          {/* ── En-tête entreprise — nom centré, logo centré ────────────── */}
          <div style={{ textAlign: 'center' }}>
            {tpl.style.showLogo !== false && co.logo && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={co.logo} alt="" crossOrigin="anonymous" style={{ height: 36, marginBottom: 6, display: 'block', marginLeft: 'auto', marginRight: 'auto' }} />
            )}
            <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: 0.6, color: tpl.style.primaryColor || '#0a7a3d', textTransform: 'uppercase' as const }}>
              {co.tradeName || co.legalName || '—'}
            </div>
          </div>

          {/* ── Ville / date — alignées à droite ─────────────────────────── */}
          <div style={{ fontSize: 10.5, marginTop: 8, width: '100%', textAlign: 'right' }}>
            {ville} — Paie du mois {moisPrefix}{moisNom} {anneeComplete}
          </div>

          {/* ── Bandeau prestataire (nom + qualité) — centré sur la page ── */}
          <div style={{ textAlign: 'center', marginTop: 26, marginBottom: 24 }}>
            <div style={{
              display: 'inline-block', background: '#e4f1e8', border: '1px solid #0a7a3d',
              padding: '4px 10px', fontSize: 12, fontWeight: 800,
            }}>
              {fullName} {qualite}
            </div>
          </div>

          {/* ── Corps : lignes conditionnelles, colonne resserrée, centrée ─ */}
          <div style={{ flex: 1 }}>
            <table style={{ borderCollapse: 'collapse' }}>
              <tbody>
                <Row label="Forfait" value={fmt(forfaitMontant)} bold />

                {congeMontant > 0 && <Row label="Indemnité de congé" value={fmt(congeMontant)} />}
                {autresGains.map((item: any) => (
                  <Row key={item.id || item.code} label={item.label} value={fmt(item.amount)} />
                ))}
                {indems.map((item: any) => (
                  <Row key={item.id || item.code} label={item.label} value={fmt(item.amount)} />
                ))}
                {absMontant > 0 && <Row label={absItem?.label || 'Retenue absence'} value={fmt(absMontant)} />}
                {bncMontant > 0 && <Row label={bncItem?.label || 'Retenue impôt'} value={fmt(bncMontant)} />}
                {retenues.map((item: any) => (
                  <Row key={item.id || item.code} label={item.label} value={fmt(item.amount)} />
                ))}

                <Row label="Net à payer" value={fmt(netAPayer)} bold divider />
              </tbody>
            </table>
          </div>

          {/* ── Signatures — employé à gauche (sous le tableau), patron
                collé au bord droit du contenu (même bord que la date) ──── */}
          <div style={{ position: 'relative', marginTop: 40, height: 70 }}>
            <div style={{ position: 'absolute', left: 0, textAlign: 'center', whiteSpace: 'nowrap' }}>
              <div style={{ height: 44 }} />
              <div style={{ borderTop: BD, fontSize: 10, fontWeight: 700, textTransform: 'uppercase' as const, paddingTop: 3 }}>
                {qualite}
              </div>
            </div>
            <div style={{ position: 'absolute', right: 0, textAlign: 'center', whiteSpace: 'nowrap' }}>
              <div style={{ height: 44 }} />
              <div style={{ borderTop: BD, fontSize: 10, fontWeight: 700, textTransform: 'uppercase' as const, paddingTop: 3 }}>
                {(co as any).signatoryTitle || 'Directeur'}
              </div>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}