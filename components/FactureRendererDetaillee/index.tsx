'use client';

// ============================================================================
// components/FactureRendererDetaillee/index.tsx
//
// Gabarit "Facture détaillée" — reproduit fidèlement le modèle papier fourni
// par le client (facture manuscrite type "MBAYE Modou / ORCA DECO") :
//   - Expéditeur = le prestataire (employé) en haut à gauche (nom + ville)
//   - Date d'émission alignée à droite, sous l'expéditeur
//   - Encadré "Doit :" = payroll.company (même société que pour un bulletin
//     normal — le prestataire lui adresse une facture au lieu de recevoir
//     un bulletin, mais c'est le même employeur)
//   - Titre "FACTURE N° <séquence>/<mois>/<année>/<abrégé-qualité>" centré
//   - Paragraphe de motif qui s'adapte automatiquement au type de paiement
//     dominant (forfait/honoraires vs indemnité de congé vs générique)
//   - Tableau : chaque item de gain avec SON PROPRE libellé → TOTAL BRUT
//     (souligné, gras) → chaque item de retenue avec SON PROPRE libellé →
//     MONTANT NET A PAYER (souligné, gras)
//
// Choisi via config.factureTemplateId === 'detaillee' dans FactureDisplay
// (l'autre option étant 'forfait' → FactureRendererForfait, le reçu compact
// modèle "Pharmacie Banque de Vie").
//
// Aucune donnée nouvelle : mêmes PayrollItem[] que les bulletins
// (classifyItems), on n'affiche que ce qui existe réellement (montant > 0)
// et on utilise toujours le label réel de l'item — jamais un libellé codé
// en dur (ex: un item ADVANCE affiche "Avance sur salaire", pas "Quinzaine").
// ============================================================================

import React, { useMemo } from 'react';
import type { BulletinPayroll, BulletinTemplateConfig, PayrollItem } from '@/types/bulletin-template';
import { classifyItems } from '@/lib/bulletin-items-classifier';
import { getBaseTemplate } from '@/lib/bulletin-templates';

export interface FactureRendererDetailleeProps {
  payroll:      BulletinPayroll;
  template?:    BulletinTemplateConfig;
  previewMode?: boolean;
  /** Numéro séquentiel de la facture pour la période (1, 2, 3...). Par défaut 1. */
  invoiceSequence?: number;
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
const fmt = (v: any): string  => {
  const n = nv(v);
  return n === 0 ? '-' : Math.round(n).toLocaleString('fr-FR');
};
const fmtDate = (d?: string | Date) => {
  const x = d ? new Date(d) : new Date();
  return isNaN(x.getTime()) ? '—' : x.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
};

// Abrège une qualité/fonction sur le modèle "Menuisier" → "Men"
const abbrevQualite = (q: string): string => {
  const word = (q || '').trim().split(/\s+/)[0] || '';
  if (!word) return '—';
  return word.charAt(0).toUpperCase() + word.slice(1, 3).toLowerCase();
};

const SANS = 'Arial,Helvetica,sans-serif';
const K    = '#000';
const BD   = '1px solid #000';

// ── Ligne libellé / valeur — colonne resserrée, pas étalée ────────────────
const Row = ({ label, value, bold = false }: { label: string; value: string; bold?: boolean }) => (
  <tr>
    <td style={{
      padding: bold ? '5px 18px 5px 0' : '2.5px 18px 2.5px 0', fontSize: bold ? 12.5 : 11,
      fontWeight: bold ? 800 : 600, textDecoration: 'none',
      textTransform: 'uppercase' as const, whiteSpace: 'nowrap',
    }}>{label}</td>
    <td style={{
      padding: bold ? '5px 0' : '2.5px 0', fontSize: bold ? 13 : 11,
      fontWeight: bold ? 800 : 500, borderTop: bold ? BD : 'none', textDecoration: 'none',
      textAlign: 'right', fontVariantNumeric: 'tabular-nums', minWidth: 70,
    }}>{value}</td>
  </tr>
);

export default function FactureRendererDetaillee({ payroll, template, previewMode, invoiceSequence = 1 }: FactureRendererDetailleeProps) {
  const tpl = template ?? getBaseTemplate('classique');
  const e   = (payroll.employee ?? {}) as any;
  const co  = (payroll.company  ?? {}) as any; // même société que pour un bulletin — c'est elle qui "doit" le paiement
  const items: PayrollItem[] = payroll.items ?? [];

  const { gainItems, cotisItems, retenueItems } = useMemo(() => classifyItems(items), [items]);

  const gains = gainItems.filter((i: any) => nv(i.amount) > 0);
  const totalBrut = gains.reduce((s: number, i: any) => s + nv(i.amount), 0) || nv(payroll.grossSalary);

  // Toutes les retenues (BNC/ITS + diverses), dans leur ordre naturel, avec leur propre label
  const deductions = [...cotisItems, ...retenueItems].filter((i: any) => nv(i.amount) > 0);
  const totalRetenues = deductions.reduce((s: number, i: any) => s + nv(i.amount), 0);

  const netAPayer = nv(payroll.netSalary) || (totalBrut - totalRetenues);

  const fullName = [e.firstName, e.lastName?.toUpperCase()].filter(Boolean).join(' ') || '—';
  const qualite  = e.position || CONTRACT[e.contractType ?? ''] || '—';
  const emetteurVille = e.city || co.city || '—';
  const dateEmission = fmtDate((payroll as any).paymentDate ?? new Date(payroll.year, (payroll.month ?? 1) - 1, new Date().getDate()));
  const lieuEmission = (payroll as any).issueCity || co.headquartersCity || co.city || emetteurVille;

  const moisIdx  = Math.max(0, Math.min(11, (payroll.month ?? 1) - 1));
  const moisNom  = MOIS[moisIdx];
  const anneeCourte = String(payroll.year ?? new Date().getFullYear()).slice(-2);
  const numeroFacture = `${invoiceSequence}/${payroll.month}/${payroll.year}/${abbrevQualite(qualite)}`;

  // ── Motif de la facture — s'adapte au type de paiement dominant ─────────
  const forfaitItem = gainItems.find((i: any) => i.code === 'SAL_BASE' && nv(i.amount) > 0);
  const congeItem   = gainItems.find((i: any) => i.code === 'INDEM_CONGE' && nv(i.amount) > 0);
  const motifLabel = forfaitItem
    ? 'Mes honoraires au titre du mois de'
    : (congeItem && !forfaitItem)
      ? 'Mes indemnités de congé au cours du mois de'
      : 'Ma rémunération au titre du mois de';

  return (
    <>
      <style>{`
        @media print {
          @page { size: A5 portrait; margin: 0; }
          body { visibility: hidden !important; background: #fff !important; margin: 0 !important; padding: 0 !important; }
          #fac-detaillee-wrap, #fac-detaillee-wrap * { visibility: visible !important; }
          #fac-detaillee-wrap { position: absolute !important; top: 0 !important; left: 0 !important; width: 100% !important; }
          #fac-detaillee { box-shadow: none !important; border: none !important; }
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        }
      `}</style>

      <div id="fac-detaillee-wrap" data-bulletin-root="true" style={{ background: '#fff' }}>
        <div id="fac-detaillee" style={{
          fontFamily: SANS, color: K, background: '#fff',
          width: '148mm', minHeight: '210mm', boxSizing: 'border-box', padding: '18mm 16mm',
          margin: '0 auto', boxShadow: '0 2px 16px rgba(0,0,0,0.10)',
          display: 'flex', flexDirection: 'column', justifyContent: 'center', fontSize: 11.5,
        }}>

          {/* ── Expéditeur (le prestataire) — aligné à gauche ───────────── */}
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontSize: 13, fontWeight: 800, textDecoration: 'none' }}>{fullName}</div>
            <div style={{ fontSize: 12, fontWeight: 800, textDecoration: 'none' }}>{emetteurVille}</div>
          </div>

          {/* ── Date d'émission — alignée à droite ──────────────────────── */}
          <div style={{ textAlign: 'right', marginTop: 22, fontSize: 11.5 }}>
            {lieuEmission}, le {dateEmission}
          </div>

          {/* ── Encadré "Doit :" — société débitrice (payroll.company) ──── */}
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 10 }}>
            <div style={{ border: BD, padding: '8px 14px', display: 'flex', gap: 8 }}>
              <div style={{ fontWeight: 800, fontSize: 11.5, textDecoration: 'none' }}>Doit :</div>
              <div>
                <div style={{ fontWeight: 800, fontSize: 12.5, textDecoration: 'none' }}>{co.tradeName || co.legalName || '—'}</div>
                {co.district && <div style={{ fontSize: 11.5, fontWeight: 700, textDecoration: 'none' }}>{co.district}</div>}
                <div style={{ fontSize: 11.5, fontWeight: 700, textDecoration: 'none' }}>{co.city || '—'}</div>
              </div>
            </div>
          </div>

          {/* ── Titre de la facture — centré, souligné ──────────────────── */}
          <div style={{ textAlign: 'center', fontWeight: 800, fontSize: 13, textDecoration: 'underline', marginTop: 30 }}>
            FACTURE N° {numeroFacture}
          </div>

          {/* ── Motif — s'adapte automatiquement au type de paiement ────── */}
          <div style={{ marginTop: 14, fontSize: 11.5 }}>
            <div>{motifLabel} <span style={{ fontWeight: 800, textDecoration: 'none' }}>{moisNom}-{anneeCourte}</span></div>
            <div>en qualité de : <span style={{ fontWeight: 800, textDecoration: 'none' }}>{qualite}</span></div>
          </div>

          {/* ── Corps : chaque item avec son propre label ───────────────── */}
          <div style={{ marginTop: 20 }}>
            <table style={{ borderCollapse: 'collapse', margin: '0 auto' }}>
              <tbody>
                {gains.map((item: any) => (
                  <Row key={item.id || item.code} label={item.label} value={fmt(item.amount)} />
                ))}

                <Row label="Total brut" value={fmt(totalBrut)} bold />

                {deductions.map((item: any) => (
                  <Row key={item.id || item.code} label={item.label} value={fmt(item.amount)} />
                ))}

                <Row label="Montant net à payer" value={fmt(netAPayer)} bold />
              </tbody>
            </table>
          </div>

          {/* ── Pied de page : signataire, mention, signature ───────────── */}
          <div style={{ marginTop: 30 }}>
            <div style={{ fontWeight: 800, fontSize: 12.5, textDecoration: 'none' }}>{fullName}</div>

            <div style={{ textAlign: 'center', fontStyle: 'italic', fontSize: 10.5, margin: '18px 0' }}>
              Valeur en votre règlement à réception de la présente facture
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', minHeight: 70 }}>
              <div style={{ flex: 1 }} />
              {e.signatureImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={e.signatureImage} alt="" crossOrigin="anonymous" style={{ height: 60, objectFit: 'contain' }} />
              ) : (
                <div style={{ width: 140, borderTop: BD, fontSize: 10, textAlign: 'center', paddingTop: 3 }}>
                  Signature
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </>
  );
}