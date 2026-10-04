'use client';

// ============================================================================
// 📁 components/documents/standard/StandardLoanRequestForm.tsx
// ✅ Modèle "FORMULAIRE DE DEMANDE DE PRÊT" (STANDARD) — calé sur le PDF
//    Infinitium : filet doré épais, titre, filet doré fin, sous-titre, ligne
//    "Nature du prêt" avec 5 cases sur une ligne, "Motif de la demande" en
//    pointillés, ligne "Pièces jointes" avec 4 cases, tableau "AVIS ET
//    DÉCISION" à en-tête bleu-nuit, pied de page en italique centré.
// ✅ Une seule page A4 : hauteur fixe 296 mm ; les <Spacer /> se compriment si
//    le contenu grandit (Matricule, motif long, durée…) et le pied de page
//    reste ancré en bas.
// ✅ Mise en page ET police posées par le <style> scopé (!important) : elles
//    survivent à un `clone.style.cssText = …` (export PDF) qui effacerait le
//    style inline de la racine.
// ✅ Les éléments de classe "std-loan-*" gardent leurs couleurs et fonds : voir
//    l'exception à ajouter dans lib/loan-print.ts (sinon impression/export les
//    aplatissent en noir sur fond transparent, comme pour std-adv-*).
// ✅ Même simplification hiérarchique que le papier d'origine : seule la
//    ligne "Direction des Ressources Humaines" reflète une vraie décision
//    (drhDecision/dgDecision — la validation est déjà PARALLÈLE dans l'app,
//    RH ou Admin tranche seul). "Responsable Comptable" et "Direction
//    Générale" restent des cases à signer à la main — pas de rôle
//    "Responsable Comptable" dans le workflow.
// ============================================================================

import type { ReactNode } from 'react';
import { SigVisa, OtherOpinions, sigFor, type DocumentSignature } from '../docSignatures';

interface StandardCompany {
  legalName: string;
  tradeName?: string | null;
  logo?: string | null;
  address?: string | null;
  city?: string | null;
  country?: string | null;
  phone?: string | null;
  email?: string | null;
  cachetUrl?: string | null;
  documentFooterText?: string | null;
}

const COUNTRY_LABELS: Record<string, string> = { CG: 'République du Congo' };

const NATURE_LABELS: Record<string, string> = {
  SOCIAL: 'Social',
  SCOLARITE: 'Scolarité',
  LOGEMENT: 'Logement',
  EXCEPTIONNEL: 'Exceptionnel',
  AUTRE: 'Autre',
};
const NATURE_ORDER = ['SOCIAL', 'SCOLARITE', 'LOGEMENT', 'EXCEPTIONNEL', 'AUTRE'];

export interface StandardLoanRequestFormData {
  reference?: string;
  company: StandardCompany;
  employee: {
    firstName: string;
    lastName: string;
    employeeNumber?: string | null;
    position?: string;
    phone?: string;
  };
  nature?: string | null; // SOCIAL | SCOLARITE | LOGEMENT | EXCEPTIONNEL | AUTRE
  amount: number | string;
  durationMonths?: number | string | null; // dérivé de startDate/endDate côté page
  recoverViaPayroll?: boolean | null;
  reason?: string | null;
  attachmentUrl?: string | null;
  requestedAt?: string | Date;
  drhDecision?: 'OUI' | 'NON' | null;
  dgDecision?: 'OUI' | 'NON' | null;
  // ✅ LOT D — avis/signatures personnelles (optionnel : sans avis, rendu identique à avant)
  signatures?: DocumentSignature[];
}

const FONT = `'Baskerville Old Face', Baskerville, Garamond, Georgia, 'Times New Roman', serif`;
const GOLD = '#b8860b';
const GOLD_SOFT = '#c9a227';
const RULE = '#d1d5db';
const NAVY = '#2c3e50';

const fmtDate = (d?: string | Date | null) => {
  if (!d) return '';
  const date = typeof d === 'string' ? new Date(d) : d;
  if (isNaN(date.getTime())) return '';
  return date.toLocaleDateString('fr-FR');
};
const fmtMoney = (n: number | string) => Number(n).toLocaleString('fr-FR');

const cellBase = {
  border: `1px solid ${RULE}`,
  padding: '8px 10px 0',
  verticalAlign: 'top',
  fontSize: 10.5,
  lineHeight: '14px',
} as const;

function Checkbox({ checked }: { checked: boolean }) {
  return (
    <span
      className="std-loan-black"
      style={{
        display: 'inline-block',
        width: 10,
        height: 10,
        boxSizing: 'border-box',
        border: '1px solid #4b5563',
        overflow: 'hidden', // baseline identique case cochée / vide
        textAlign: 'center',
        fontSize: 8,
        fontWeight: 700,
        lineHeight: '8px',
        verticalAlign: '-1px',
      }}
    >
      {checked ? '✕' : ''}
    </span>
  );
}

function Decision({ favorable, unfavorable }: { favorable: boolean; unfavorable: boolean }) {
  return (
    <span className="std-loan-pale" style={{ fontStyle: 'italic' }}>
      <Checkbox checked={favorable} /> Favorable
      <span style={{ marginLeft: 10 }}>
        <Checkbox checked={unfavorable} /> Défavorable
      </span>
    </span>
  );
}

function Heading({ children, mt }: { children: ReactNode; mt: number }) {
  return (
    <h2
      className="std-loan-gold"
      style={{ margin: `${mt}px 0 0`, fontSize: 12.5, fontWeight: 700, letterSpacing: 0.3, lineHeight: '15px' }}
    >
      {children}
    </h2>
  );
}

// Ligne "libellé gras + valeur" soulignée d'un filet gris (27 px de haut).
function Row({ label, value, mt = 0 }: { label: string; value?: ReactNode; mt?: number }) {
  return (
    <div
      style={{
        marginTop: mt,
        display: 'flex',
        alignItems: 'baseline',
        padding: '5px 0',
        borderBottom: `1px solid ${RULE}`,
        fontSize: 12.5,
        lineHeight: '16px',
      }}
    >
      <span className="std-loan-black" style={{ width: 210, flexShrink: 0, fontWeight: 700 }}>{label}</span>
      <span className="std-loan-body" style={{ flex: 1, minWidth: 0 }}>{value ?? ''}</span>
    </div>
  );
}

// Espace vertical compressible : taille nominale h, minimum 10 px.
const Spacer = ({ h }: { h: number }) => (
  <div aria-hidden style={{ flex: `0 1 ${h}px`, minHeight: 10 }} />
);

export default function StandardLoanRequestForm({ data, id }: { data: StandardLoanRequestFormData; id?: string }) {
  const companyName = data.company.tradeName || data.company.legalName || 'Entreprise';
  const validated = data.drhDecision === 'OUI';
  const rejected = data.drhDecision === 'NON';
  const requestedDate = fmtDate(data.requestedAt);

  const approvers = [
    { fn: 'Responsable Comptable', code: 'ACCOUNTANT', h: 32, fav: false, unf: false, cachet: false },
    { fn: 'Direction des Ressources Humaines', code: 'HR', h: 32, fav: validated, unf: rejected, cachet: true },
    { fn: 'Direction Générale', code: 'DG', h: 32, fav: false, unf: false, cachet: false },
  ];

  return (
    <div id={id} className="std-loan-doc">
      <style>{`
        .std-loan-doc {
          width: 210mm !important; height: 296mm !important; min-height: 0 !important; /* 296 et non 297 : évite une 2e page blanche */
          margin: 0 auto !important; padding: 6mm 18.5mm 4.4mm !important; box-sizing: border-box !important;
          display: flex !important; flex-direction: column !important; overflow: hidden !important;
          background: #fff !important; color: #111827 !important;
          font-family: ${FONT} !important; line-height: 1.2 !important;
          break-inside: avoid; page-break-inside: avoid;
        }
        .std-loan-doc, .std-loan-doc * { color-scheme: light !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        .std-loan-doc > *:not([aria-hidden]) { flex-shrink: 0; }
        .std-loan-doc td, .std-loan-doc th { background-color: transparent !important; }
        .std-loan-doc th.std-loan-th { background-color: ${NAVY} !important; }
        .std-loan-doc th.std-loan-th, .std-loan-doc th.std-loan-th * { color: #fff !important; }
        .std-loan-doc .std-loan-black { color: #111827 !important; }
        .std-loan-doc .std-loan-body  { color: #374151 !important; }
        .std-loan-doc .std-loan-gray  { color: #4b5563 !important; }
        .std-loan-doc .std-loan-light { color: #6b7280 !important; }
        .std-loan-doc .std-loan-pale  { color: #8b9098 !important; }
        .std-loan-doc .std-loan-gold  { color: #a1781a !important; }
      `}</style>

      {/* ── En-tête : logo + raison sociale + coordonnées à gauche, référence à droite ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', height: '33.7mm' }}>
        <div>
          {data.company.logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={data.company.logo} alt={companyName} style={{ height: 56, objectFit: 'contain' }} />
          ) : null}
          <div className="std-loan-black" style={{ marginTop: 4, fontSize: 13, fontWeight: 700 }}>{companyName}</div>
          <div className="std-loan-gray" style={{ marginTop: 3, fontSize: 9, lineHeight: '13px' }}>
            {data.company.address && <div>{data.company.address}</div>}
            {(data.company.city || data.company.country) && (
              <div>
                {data.company.city}{data.company.city && data.company.country ? ', ' : ''}
                {data.company.country ? (COUNTRY_LABELS[data.company.country] || data.company.country) : ''}
              </div>
            )}
            {(data.company.phone || data.company.email) && (
              <div>
                {data.company.phone && <>Tél. : {data.company.phone}</>}
                {data.company.phone && data.company.email ? ' · ' : ''}
                {data.company.email && <>Email : {data.company.email}</>}
              </div>
            )}
          </div>
        </div>
        <div style={{ paddingTop: 4, textAlign: 'right' }}>
          <div className="std-loan-black" style={{ fontSize: 11, fontWeight: 700, lineHeight: '16px' }}>Réf. : {data.reference || '—'}</div>
          <div className="std-loan-light" style={{ fontSize: 10, fontStyle: 'italic', lineHeight: '16px' }}>Direction des Ressources Humaines</div>
        </div>
      </div>

      {/* ── Filet doré, titre, filet doré, sous-titre ── */}
      <div style={{ borderTop: `2px solid ${GOLD}` }} />

      <h1
        className="std-loan-black"
        style={{ margin: '16px 0 0', textAlign: 'center', fontSize: 19, fontWeight: 700, letterSpacing: 0.6, lineHeight: 1.2 }}
      >
        FORMULAIRE DE DEMANDE DE PRÊT
      </h1>

      <div style={{ marginTop: 13, borderTop: `1px solid ${GOLD_SOFT}` }} />

      <p className="std-loan-light" style={{ margin: '5px 0 0', textAlign: 'center', fontStyle: 'italic', fontSize: 10.5, lineHeight: '13px' }}>
        Prêt au personnel — à usage interne
      </p>

      <p className="std-loan-body" style={{ margin: '13px 0 0', fontSize: 12, lineHeight: '18px' }}>
        À compléter par le/la salarié(e) demandeur(se) et à remettre à la DRH, accompagné des pièces justificatives requises.
      </p>

      {/* ── Identité ── */}
      <Heading mt={16}>IDENTITÉ DU DEMANDEUR</Heading>
      <Row mt={5} label="Nom et prénom" value={`${data.employee.lastName} ${data.employee.firstName}`.trim()} />
      {data.employee.employeeNumber && <Row label="Matricule" value={data.employee.employeeNumber} />}
      <Row label="Poste occupé" value={data.employee.position} />
      <Row label="N° de Téléphone" value={data.employee.phone} />

      {/* ── Objet de la demande ── */}
      <Heading mt={14}>OBJET DE LA DEMANDE</Heading>
      <div style={{ marginTop: 9, display: 'flex', alignItems: 'baseline', flexWrap: 'wrap', gap: '4px 16px', fontSize: 12, lineHeight: '15px' }}>
        <span className="std-loan-black" style={{ fontWeight: 700, flexShrink: 0 }}>Nature du prêt :</span>
        {NATURE_ORDER.map((key) => (
          <span key={key} className="std-loan-body" style={{ display: 'inline-flex', alignItems: 'baseline', gap: 4 }}>
            <Checkbox checked={data.nature === key} /> {NATURE_LABELS[key]}
          </span>
        ))}
      </div>

      <Row mt={10} label="Montant sollicité" value={data.amount != null && data.amount !== '' ? `${fmtMoney(data.amount)} FCFA` : ''} />
      <Row label="Durée de remboursement souhaitée" value={data.durationMonths ? `${data.durationMonths} mois` : ''} />
      <Row
        label="Mode de remboursement"
        value={data.recoverViaPayroll == null ? '' : data.recoverViaPayroll ? 'Prélèvement sur salaire' : 'Autre'}
      />

      <div style={{ marginTop: 10, display: 'flex', alignItems: 'baseline', fontSize: 12, lineHeight: '15px' }}>
        <span className="std-loan-body" style={{ flexShrink: 0, marginRight: 6 }}>Motif de la demande :</span>
        {data.reason ? (
          <span className="std-loan-black" style={{ flex: 1, minWidth: 0 }}>{data.reason}</span>
        ) : (
          <span className="std-loan-black" aria-hidden style={{ flex: 1, minWidth: 0, overflow: 'hidden', whiteSpace: 'nowrap' }}>
            {'…'.repeat(140)}
          </span>
        )}
      </div>

      <div style={{ marginTop: 8, display: 'flex', alignItems: 'baseline', flexWrap: 'wrap', gap: '4px 14px', fontSize: 12, lineHeight: '15px' }}>
        <span className="std-loan-black" style={{ fontWeight: 700, flexShrink: 0 }}>Pièces jointes :</span>
        {[
          ['DEVIS', 'Devis/facture'],
          ['SCOLARITE', 'Justif. Scolarité'],
          ['MEDICAL', 'Justif. Médical'],
          ['AUTRE', 'Autre'],
        ].map(([key, label]) => (
          <span key={key} className="std-loan-body" style={{ display: 'inline-flex', alignItems: 'baseline', gap: 4 }}>
            <Checkbox checked={key === 'AUTRE' ? !!data.attachmentUrl : false} /> {label}
          </span>
        ))}
      </div>

      <p className="std-loan-body" style={{ margin: '13px 0 0', fontSize: 12, lineHeight: '18px', textAlign: 'justify' }}>
        Je certifie l'exactitude des informations ci-dessus et m'engage, en cas d'accord, à respecter les modalités de
        remboursement fixées par la société.
      </p>

      <Spacer h={22} />
      <div className="std-loan-body" style={{ fontSize: 12.5, lineHeight: '16px' }}>
        Fait à {data.company.city || 'Pointe-Noire'}, le{' '}
        {requestedDate ? (
          <span className="std-loan-black">{requestedDate}</span>
        ) : (
          <span className="std-loan-pale" style={{ fontStyle: 'italic' }}>………/…………/{new Date().getFullYear()}</span>
        )}
      </div>

      <Spacer h={30} />
      <div className="std-loan-black" style={{ fontSize: 12.5, lineHeight: '16px', fontWeight: 700 }}>
        Signature du demandeur : <span style={{ fontWeight: 400 }}>{'_'.repeat(22)}</span>
      </div>

      {/* ── Avis hiérarchique et décision ── */}
      <Spacer h={30} />
      <Heading mt={0}>AVIS HIÉRARCHIQUE ET DÉCISION</Heading>

      <table style={{ width: '100%', marginTop: 12, borderCollapse: 'collapse', tableLayout: 'fixed' }}>
        <colgroup>
          <col style={{ width: '29%' }} />
          <col style={{ width: '31%' }} />
          <col style={{ width: '40%' }} />
        </colgroup>
        <thead>
          <tr style={{ height: 23 }}>
            {['Fonction', 'Nom et visa', 'Décision'].map((t) => (
              <th
                key={t}
                className="std-loan-th"
                style={{ border: `1px solid ${RULE}`, padding: '4px 10px', textAlign: 'left', fontSize: 11, fontWeight: 700, lineHeight: '14px' }}
              >
                {t}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {approvers.map((r) => {
            const showCachet = r.cachet && validated && !!data.company.cachetUrl;
            // ✅ LOT D — signature personnelle de la fonction (si un avis signé existe)
            const sig = sigFor(data.signatures, r.code);
            const hasVisa = showCachet || !!sig;
            const fav = r.cachet ? r.fav : sig ? sig.opinion === 'FAVORABLE' : r.fav;
            const unf = r.cachet ? r.unf : sig ? sig.opinion === 'UNFAVORABLE' : r.unf;
            return (
              <tr key={r.fn} style={{ height: r.h }}>
                <td className="std-loan-gray" style={cellBase}>{r.fn}</td>
                <td className="std-loan-gray" style={hasVisa ? { ...cellBase, padding: '3px 10px', verticalAlign: 'middle' } : cellBase}>
                  {showCachet && !sig ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={data.company.cachetUrl as string} alt="Cachet" style={{ height: 26, objectFit: 'contain' }} />
                  ) : hasVisa ? (
                    <SigVisa
                      sig={sig}
                      height={20}
                      extra={showCachet ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={data.company.cachetUrl as string} alt="Cachet" style={{ height: 22, objectFit: 'contain' }} />
                      ) : undefined}
                    />
                  ) : null}
                </td>
                <td style={cellBase}>
                  <Decision favorable={fav} unfavorable={unf} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* ✅ LOT D — fonctions sans case sur ce modèle (chef d'équipe, hiérarchie…) */}
      <OtherOpinions signatures={data.signatures} boxCodes={['ACCOUNTANT', 'HR', 'DG']} fontSize={8.5} />

      <Spacer h={22} />
      <div className="std-loan-body" style={{ fontSize: 12, lineHeight: '15px' }}>
        Montant approuvé :{' '}
        {validated && data.amount != null && data.amount !== '' ? (
          <span className="std-loan-black">{fmtMoney(data.amount)} FCFA</span>
        ) : (
          <span className="std-loan-pale">{'…'.repeat(23)}</span>
        )}
      </div>

      {/* ── Pied de page ancré en bas : mention confidentielle en italique ── */}
      <div style={{ marginTop: 'auto' }}>
        {data.company.documentFooterText ? (
          <div className="std-loan-light" style={{ textAlign: 'center', fontStyle: 'italic', fontSize: 8.5, lineHeight: '12px', whiteSpace: 'pre-line' }}>
            {data.company.documentFooterText}
          </div>
        ) : (
          <div className="std-loan-light" style={{ textAlign: 'center', fontStyle: 'italic', fontSize: 8.5, lineHeight: '12px' }}>
            {companyName} — Document confidentiel à usage exclusif du destinataire
          </div>
        )}
      </div>
    </div>
  );
}