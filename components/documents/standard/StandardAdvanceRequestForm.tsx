'use client';

// ============================================================================
// 📁 components/documents/standard/StandardAdvanceRequestForm.tsx
// ✅ Modèle "FORMULAIRE DE DEMANDE D'AVANCE SUR SALAIRE" (STANDARD) — calé sur
//    le PDF Arkia : une seule page A4, filets dorés, titres de section dorés,
//    en-tête du tableau gris, adresse en pied de page ("Siège Social : …").
// ✅ Une seule page : hauteur fixe 296 mm ; les <Spacer /> se compriment si le
//    contenu grandit (Matricule, Mois de rattachement, motif long…) et le pied
//    de page reste ancré en bas.
// ✅ Mise en page ET police posées par le <style> scopé (!important) : elles
//    survivent à un `clone.style.cssText = …` (export PDF) qui effacerait le
//    style inline de la racine.
// ✅ Les éléments de classe "std-adv-*" gardent leurs couleurs et fonds : voir
//    l'exception à ajouter dans lib/loan-print.ts (sinon impression/export les
//    aplatissent en noir sur fond transparent).
// ✅ Même simplification hiérarchique que le prêt : seule la ligne RH reflète
//    une vraie décision ; Responsable direct / Direction Générale restent des
//    cases à signer à la main.
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
const MONTH_LABELS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];

export interface StandardAdvanceRequestFormData {
  reference?: string;
  company: StandardCompany;
  employee: {
    firstName: string;
    lastName: string;
    employeeNumber?: string | null;
    position?: string;
    phone?: string;
  };
  amount: number | string;
  /** Mois/année auquel se rattache l'avance — affiché seulement si fourni (cas Axis). */
  month?: number | null;
  year?: number | null;
  recoverViaPayroll?: boolean | null;
  reason?: string | null;
  requestedAt?: string | Date;
  status: string; // PENDING | APPROVED | REJECTED | PAID | DEDUCTED | CANCELLED
  // ✅ LOT D — avis/signatures personnelles (optionnel : sans avis, rendu identique à avant)
  signatures?: DocumentSignature[];
}

const FONT = `'Baskerville Old Face', Baskerville, Garamond, Georgia, 'Times New Roman', serif`;
const SANS = `'Helvetica Neue', Helvetica, Arial, 'Liberation Sans', sans-serif`;
const GOLD = '#b8860b';
const GOLD_SOFT = '#c9a227';
const RULE = '#d1d5db';

const fmtDate = (d?: string | Date | null) => {
  if (!d) return '';
  const date = typeof d === 'string' ? new Date(d) : d;
  if (isNaN(date.getTime())) return '';
  return date.toLocaleDateString('fr-FR');
};
const fmtMoney = (n: number | string) => Number(n).toLocaleString('fr-FR');

const cellBase = {
  border: `1px solid ${RULE}`,
  padding: '8px 8px 0',
  verticalAlign: 'top',
  fontSize: 10.5,
  lineHeight: '14px',
} as const;

function Checkbox({ checked }: { checked: boolean }) {
  return (
    <span
      className="std-adv-black"
      style={{
        display: 'inline-block',
        width: 10,
        height: 10,
        boxSizing: 'border-box',
        border: '1px solid #9ca3af',
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
    <span className="std-adv-pale" style={{ fontStyle: 'italic' }}>
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
      className="std-adv-gold"
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
      <span className="std-adv-black" style={{ width: 180, flexShrink: 0, fontWeight: 700 }}>{label}</span>
      <span className="std-adv-body" style={{ flex: 1, minWidth: 0 }}>{value ?? ''}</span>
    </div>
  );
}

// Espace vertical compressible : taille nominale h, minimum 10 px.
const Spacer = ({ h }: { h: number }) => (
  <div aria-hidden style={{ flex: `0 1 ${h}px`, minHeight: 10 }} />
);

export default function StandardAdvanceRequestForm({ data, id }: { data: StandardAdvanceRequestFormData; id?: string }) {
  const companyName = data.company.tradeName || data.company.legalName || 'Entreprise';
  const validated = data.status === 'APPROVED' || data.status === 'PAID' || data.status === 'DEDUCTED';
  const rejected = data.status === 'REJECTED';
  const hasAmount = data.amount != null && data.amount !== '';
  const requestedDate = fmtDate(data.requestedAt);

  const addressLine = [
    data.company.address,
    data.company.city,
    data.company.country ? COUNTRY_LABELS[data.company.country] || data.company.country : null,
  ].filter(Boolean).join(', ');

  const approvers = [
    { fn: 'Responsable direct', code: 'HIERARCHY_HEAD', h: 33, fav: false, unf: false, cachet: false },
    { fn: 'Direction des Ressources Humaines', code: 'HR', h: 33, fav: validated, unf: rejected, cachet: true },
    { fn: 'Direction Générale', code: 'DG', h: 48, fav: false, unf: false, cachet: false },
  ];

  return (
    <div id={id} className="std-adv-doc">
      <style>{`
        .std-adv-doc {
          width: 210mm !important; height: 296mm !important; min-height: 0 !important; /* 296 et non 297 : évite une 2e page blanche */
          margin: 0 auto !important; padding: 6mm 18.5mm 4.4mm !important; box-sizing: border-box !important;
          display: flex !important; flex-direction: column !important; overflow: hidden !important;
          background: #fff !important; color: #111827 !important;
          font-family: ${FONT} !important; line-height: 1.2 !important;
          break-inside: avoid; page-break-inside: avoid;
        }
        .std-adv-doc, .std-adv-doc * { color-scheme: light !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        .std-adv-doc > *:not([aria-hidden]) { flex-shrink: 0; }
        .std-adv-doc td, .std-adv-doc th { background-color: transparent !important; }
        .std-adv-doc th.std-adv-th { background-color: #a6a6a6 !important; }
        .std-adv-doc .std-adv-black { color: #111827 !important; }
        .std-adv-doc .std-adv-body  { color: #374151 !important; }
        .std-adv-doc .std-adv-gray  { color: #4b5563 !important; }
        .std-adv-doc .std-adv-light { color: #6b7280 !important; }
        .std-adv-doc .std-adv-pale  { color: #8b9098 !important; }
        .std-adv-doc .std-adv-gold  { color: #a1781a !important; }
        .std-adv-doc .std-adv-title { font-family: ${SANS} !important; }
      `}</style>

      {/* ── En-tête : logo à gauche, référence à droite (hauteur fixe → filet doré à ~39 mm) ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', height: '32.9mm' }}>
        <div>
          {data.company.logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={data.company.logo} alt={companyName} style={{ height: 88, maxWidth: 240, objectFit: 'contain' }} />
          ) : (
            <div className="std-adv-black" style={{ fontWeight: 700, fontSize: 20 }}>{companyName}</div>
          )}
        </div>
        {/* Retrait à droite mesuré sur le modèle Arkia */}
        <div style={{ paddingTop: 50, paddingRight: 58, textAlign: 'right' }}>
          <div className="std-adv-black" style={{ fontSize: 11, fontWeight: 700, lineHeight: '16px' }}>Réf. : {data.reference || '—'}</div>
          <div className="std-adv-gray" style={{ fontSize: 11.5, lineHeight: '16px' }}>Direction des Ressources Humaines</div>
        </div>
      </div>

      {/* ── Filets dorés, titre, sous-titre ── */}
      <div style={{ borderTop: `2px solid ${GOLD}` }} />
      <div style={{ marginTop: 20, borderTop: `1px solid ${GOLD_SOFT}` }} />

      <h1
        className="std-adv-title std-adv-black"
        style={{
          margin: '16px 0 0', height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center',
          textAlign: 'center', fontSize: 20, lineHeight: '24px', fontWeight: 700, letterSpacing: 1.6,
        }}
      >
        <span>{"FORMULAIRE DE DEMANDE D'AVANCE SUR SALAIRE"}</span>
      </h1>

      <div style={{ marginTop: 17, borderTop: `1px solid ${GOLD_SOFT}` }} />

      <p className="std-adv-light" style={{ margin: '4px 0 0', textAlign: 'center', fontStyle: 'italic', fontSize: 10.5, lineHeight: '13px' }}>
        Avance sur salaire — à usage interne
      </p>

      <p className="std-adv-body" style={{ margin: '13px 0 0', fontSize: 12.5, lineHeight: '19px', textAlign: 'justify' }}>
        À compléter par le/la salarié(e) demandeur(se) et à remettre à la Direction des Ressources Humaines, accompagné
        des pièces justificatives requises.
      </p>

      {/* ── Identité ── */}
      <Heading mt={17}>IDENTITÉ DU DEMANDEUR</Heading>
      <Row mt={5} label="Nom et prénom" value={`${data.employee.lastName} ${data.employee.firstName}`.trim()} />
      {data.employee.employeeNumber && <Row label="Matricule" value={data.employee.employeeNumber} />}
      <Row label="Poste occupé" value={data.employee.position} />
      <Row label="Téléphone" value={data.employee.phone} />

      {/* ── Objet de la demande ── */}
      <Spacer h={31} />
      <Heading mt={0}>OBJET DE LA DEMANDE</Heading>
      <Row mt={5} label="Montant de l'avance sollicitée" value={hasAmount ? `${fmtMoney(data.amount)} FCFA` : ''} />
      {data.month && data.year && (
        <Row label="Mois de rattachement" value={`${MONTH_LABELS[data.month - 1] || data.month} ${data.year}`} />
      )}
      <Row
        mt={12}
        label="Mode de récupération"
        value={data.recoverViaPayroll == null ? '' : data.recoverViaPayroll ? 'Prélèvement sur salaire' : 'Autre'}
      />

      <div style={{ marginTop: 10, display: 'flex', alignItems: 'baseline', fontSize: 12.5, lineHeight: '16px' }}>
        <span className="std-adv-body" style={{ flexShrink: 0, marginRight: 6 }}>Motif de la demande :</span>
        {data.reason ? (
          <span className="std-adv-black" style={{ flex: 1, minWidth: 0 }}>{data.reason}</span>
        ) : (
          <span className="std-adv-black" aria-hidden style={{ flex: 1, minWidth: 0, overflow: 'hidden', whiteSpace: 'nowrap' }}>
            {'…'.repeat(160)}
          </span>
        )}
      </div>

      <p className="std-adv-body" style={{ margin: '16px 0 0', fontSize: 12.5, lineHeight: '19px', textAlign: 'justify' }}>
        Je reconnais que cette avance sera déduite de mon salaire selon les modalités approuvées par la Direction,
        conformément au règlement intérieur en vigueur.
      </p>

      <Spacer h={26} />
      <div className="std-adv-body" style={{ fontSize: 12.5, lineHeight: '16px' }}>
        Fait à {data.company.city || 'Pointe-Noire'}, le{' '}
        {requestedDate ? (
          <span className="std-adv-black">{requestedDate}</span>
        ) : (
          <span className="std-adv-pale" style={{ fontStyle: 'italic' }}>……/……../{new Date().getFullYear()}</span>
        )}
      </div>

      <Spacer h={36} />
      <div className="std-adv-black" style={{ fontSize: 12.5, lineHeight: '16px', fontWeight: 700 }}>
        Signature du demandeur : <span style={{ fontWeight: 400 }}>{'_'.repeat(32)}</span>
      </div>

      {/* ── Avis hiérarchique et décision ── */}
      <Spacer h={41} />
      <Heading mt={0}>AVIS HIÉRARCHIQUE ET DÉCISION</Heading>

      <table style={{ width: '100%', marginTop: 25, borderCollapse: 'collapse', tableLayout: 'fixed' }}>
        <colgroup>
          <col style={{ width: '32%' }} />
          <col style={{ width: '30.5%' }} />
          <col style={{ width: '37.5%' }} />
        </colgroup>
        <thead>
          <tr style={{ height: 23 }}>
            {['Fonction', 'Nom et visa', 'Décision'].map((t) => (
              <th
                key={t}
                className="std-adv-th std-adv-black"
                style={{ border: `1px solid ${RULE}`, padding: '4px 8px', textAlign: 'left', fontSize: 11, fontWeight: 700, lineHeight: '14px' }}
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
                <td className="std-adv-gray" style={cellBase}>{r.fn}</td>
                <td className="std-adv-gray" style={hasVisa ? { ...cellBase, padding: '3px 8px', verticalAlign: 'middle' } : cellBase}>
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

      {/* ✅ LOT D — fonctions sans case sur ce modèle (comptable, chef d'équipe…) */}
      <OtherOpinions signatures={data.signatures} boxCodes={['HIERARCHY_HEAD', 'HR', 'DG']} fontSize={9} />

      <Spacer h={48} />
      <div className="std-adv-body" style={{ fontSize: 12.5, lineHeight: '16px' }}>
        Montant approuvé :{' '}
        {validated && hasAmount ? (
          <span className="std-adv-black">{fmtMoney(data.amount)} FCFA</span>
        ) : (
          <span className="std-adv-pale">{'…'.repeat(21)}</span>
        )}
      </div>

      {/* ── Pied de page ancré en bas : adresse du siège, puis filet ── */}
      <div style={{ marginTop: 'auto' }}>
        {data.company.documentFooterText ? (
          <div className="std-adv-gray" style={{ marginBottom: 3, textAlign: 'center', fontSize: 8, lineHeight: '11px', whiteSpace: 'pre-line' }}>
            {data.company.documentFooterText}
          </div>
        ) : addressLine ? (
          <div className="std-adv-gray" style={{ marginBottom: 3, textAlign: 'center', fontSize: 8, lineHeight: '11px' }}>
            <strong>Siège Social :</strong> {addressLine}
          </div>
        ) : null}
        <div style={{ borderTop: `1px solid ${RULE}` }} />
      </div>
    </div>
  );
}