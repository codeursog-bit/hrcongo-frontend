'use client';

// ============================================================================
// 📁 components/documents/standard/StandardLeaveRequestForm.tsx
// ✅ Modèle "FORMULAIRE DE DEPART EN CONGE" (STANDARD) — calé sur le PDF
//    Geolane : un seul filet fin au-dessus du titre, un filet fin en dessous,
//    titre noir centré, sections "IDENTITÉ DU SALARIÉ" / "OBJET DE LA
//    DEMANDE" en bleu-nuit soulignées d'un filet pleine largeur, section
//    "Signature" en noir avec un simple soulignement de texte, 4 tableaux à
//    bordures noires fines (colonne libellé ~38 %), pied de page en gras
//    centré (adresse du site).
// ✅ Reste valable pour Arkia / Axis Oil / Petrodys (même gabarit chez les 4,
//    seuls logo/raison sociale/pied de page changent) — rien n'est en dur,
//    tout vient de `company`.
// ✅ Une seule page A4 : hauteur fixe 296 mm ; les <Spacer /> se compriment si
//    le contenu grandit (Matricule long, Service/Direction long…) et le pied
//    de page reste ancré en bas.
// ✅ Mise en page ET police posées par le <style> scopé (!important) : elles
//    survivent à un `clone.style.cssText = …` (export PDF) qui effacerait le
//    style inline de la racine.
// ✅ Les éléments de classe "std-leave-*" gardent leurs couleurs et fonds :
//    voir l'exception à ajouter dans lib/loan-print.ts, même mécanisme que
//    std-adv-*/std-loan-* (sinon impression/export les aplatissent en noir
//    sur fond transparent).
// ✅ Hiérarchie du papier d'origine conservée : "Le Salarié" et "Le
//    Responsable Hiérarchique" restent des cases à signer à la main ; seule
//    la ligne "Les Ressources Humaines" reflète une vraie décision (cachet
//    si validé) ; "Signature de la Direction Générale" reste à signer à la
//    main, comme sur le papier — pas de rôle DG dans le workflow congés.
// ============================================================================

import type { ReactNode } from 'react';
import { SigVisa, OtherOpinions, sigFor, type DocumentSignature } from '../docSignatures';

// Congo (République du) est la valeur par défaut du champ `country` en base
// (@default("CG")) — les autres codes s'affichent tels quels si un client
// est un jour basé ailleurs.
const COUNTRY_LABELS: Record<string, string> = {
  CG: 'République du Congo',
};

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

export interface StandardLeaveRequestFormData {
  // ✅ LOT E — avis/signatures personnelles (optionnel : sans avis, rendu identique à avant)
  signatures?: DocumentSignature[];
  id?: string;
  /** Code d'en-tête du document (ex. "GLN-AMC-DRH-010"). Optionnel — à défaut,
   *  la référence de la demande elle-même est affichée (plus utile : elle
   *  identifie CE dossier précis, pas seulement le modèle). */
  documentReferenceCode?: string;
  reference?: string;
  company: StandardCompany;
  employee: {
    firstName: string;
    lastName: string;
    employeeNumber?: string | null;
    position?: string;
    departmentName?: string;
    hireDate?: string | Date | null;
  };
  startDate: string | Date;
  endDate: string | Date;
  daysCount: number | string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED' | string;
  requestedAt?: string | Date;
}

const FONT = `'Baskerville Old Face', Baskerville, Garamond, Georgia, 'Times New Roman', serif`;
const RULE = '#9ca3af';
const TEAL = '#1b4f4f';

const fmtDate = (d?: string | Date | null) => {
  if (!d) return '';
  const date = typeof d === 'string' ? new Date(d) : d;
  if (isNaN(date.getTime())) return '';
  return date.toLocaleDateString('fr-FR');
};
const PLACEHOLDER_DATE = '……/……./……';

function Heading({ children, underline = true }: { children: ReactNode; underline?: boolean }) {
  return (
    <h2
      className="std-leave-teal"
      style={{
        margin: 0,
        paddingBottom: underline ? 5 : 0,
        borderBottom: underline ? `1px solid ${TEAL}` : 'none',
        fontSize: 13.5,
        fontWeight: 700,
        letterSpacing: 0.2,
        lineHeight: '17px',
      }}
    >
      {children}
    </h2>
  );
}

// Ligne "libellé | valeur" d'un tableau à bordures noires fines.
function Row({ label, value, h = 30 }: { label: string; value: ReactNode; h?: number }) {
  return (
    <tr style={{ height: h }}>
      <td
        className="std-leave-black"
        style={{ border: '1px solid #1f2937', padding: '6px 10px', width: '38%', fontWeight: 700, fontSize: 12, verticalAlign: h > 30 ? 'top' : 'middle' }}
      >
        {label}
      </td>
      <td
        className="std-leave-black"
        style={{ border: '1px solid #1f2937', padding: '6px 10px', fontSize: 12, verticalAlign: h > 30 ? 'top' : 'middle' }}
      >
        {value}
      </td>
    </tr>
  );
}

const tableStyle = { width: '100%', borderCollapse: 'collapse' as const };

// Espace vertical compressible : taille nominale h, minimum 8 px.
const Spacer = ({ h }: { h: number }) => (
  <div aria-hidden style={{ flex: `0 1 ${h}px`, minHeight: 8 }} />
);

export default function StandardLeaveRequestForm({ data, id }: { data: StandardLeaveRequestFormData; id?: string }) {
  const companyName = data.company.tradeName || data.company.legalName || 'Entreprise';
  const validated = data.status === 'APPROVED';
  const requestedDate = fmtDate(data.requestedAt);

  return (
    <div id={id} className="std-leave-doc">
      <style>{`
        .std-leave-doc {
          width: 210mm !important; height: 296mm !important; min-height: 0 !important; /* 296 et non 297 : évite une 2e page blanche */
          margin: 0 auto !important; padding: 8mm 18mm 5mm !important; box-sizing: border-box !important;
          display: flex !important; flex-direction: column !important; overflow: hidden !important;
          background: #fff !important; color: #111827 !important;
          font-family: ${FONT} !important; line-height: 1.2 !important;
          break-inside: avoid; page-break-inside: avoid;
        }
        .std-leave-doc, .std-leave-doc * { color-scheme: light !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        .std-leave-doc > *:not([aria-hidden]) { flex-shrink: 0; }
        .std-leave-doc td, .std-leave-doc th { background-color: transparent !important; }
        .std-leave-doc .std-leave-black { color: #111827 !important; }
        .std-leave-doc .std-leave-gray  { color: #4b5563 !important; }
        .std-leave-doc .std-leave-teal  { color: ${TEAL} !important; }
      `}</style>

      {/* ── En-tête : logo + raison sociale + coordonnées à gauche, référence à droite ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', height: '25.5mm' }}>
        <div>
          {data.company.logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={data.company.logo} alt={companyName} style={{ height: 52, objectFit: 'contain' }} />
          ) : (
            <div className="std-leave-black" style={{ fontWeight: 700, fontSize: 20 }}>{companyName}</div>
          )}
          <div className="std-leave-gray" style={{ marginTop: 5, fontSize: 9, lineHeight: '13px' }}>
            {data.company.address && <div>{data.company.address}</div>}
            {(data.company.city || data.company.country) && (
              <div>
                {data.company.city}
                {data.company.city && data.company.country ? ', ' : ''}
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
        <div style={{ textAlign: 'right' }}>
          <div className="std-leave-black" style={{ fontWeight: 700, fontSize: 11 }}>
            Réf. : {data.documentReferenceCode || data.reference || '—'}
          </div>
          <div className="std-leave-gray" style={{ marginTop: 3, fontStyle: 'italic', fontSize: 10 }}>Direction des Ressources Humaines</div>
        </div>
      </div>

      {/* ── Filet, titre, filet ── */}
      <div style={{ borderTop: `1px solid ${RULE}` }} />
      <h1
        className="std-leave-black"
        style={{ margin: '14px 0 0', textAlign: 'center', fontSize: 20, fontWeight: 700, letterSpacing: 0.8, lineHeight: 1.2 }}
      >
        FORMULAIRE DE DEPART EN CONGE
      </h1>
      <div style={{ marginTop: 12, borderTop: `1px solid ${RULE}` }} />

      {/* ── Identité du salarié ── */}
      <Spacer h={30} />
      <Heading>IDENTITÉ DU SALARIÉ</Heading>
      <table style={{ ...tableStyle, marginTop: 10, fontSize: 12 }}>
        <tbody>
          <Row label="Nom et prénom" value={`${data.employee.lastName} ${data.employee.firstName}`.trim()} />
          {data.employee.employeeNumber && <Row label="Matricule" value={data.employee.employeeNumber} />}
          <Row label="Poste occupé" value={data.employee.position || ''} />
          <Row label="Service / Direction" value={data.employee.departmentName || ''} />
          <Row label="Date d'embauche" value={fmtDate(data.employee.hireDate) || PLACEHOLDER_DATE} />
        </tbody>
      </table>

      {/* ── Objet de la demande ── */}
      <Spacer h={26} />
      <Heading>OBJET DE LA DEMANDE</Heading>
      <table style={{ ...tableStyle, marginTop: 10, fontSize: 12 }}>
        <tbody>
          <Row label="Date de départ" value={fmtDate(data.startDate) || PLACEHOLDER_DATE} />
          <Row label="Date de retour" value={fmtDate(data.endDate) || PLACEHOLDER_DATE} />
          <Row label="Nombre de jours" value={String(data.daysCount)} />
        </tbody>
      </table>

      {/* ── Signature ── */}
      <Spacer h={26} />
      <Heading underline={false}>
        <span style={{ textDecoration: 'underline' }}>Signature</span>
      </Heading>
      <table style={{ ...tableStyle, marginTop: 10, fontSize: 12 }}>
        <tbody>
          <Row label="Le Salarié" value=" " h={44} />
          <Row
            label="Le Responsable Hiérarchique"
            h={44}
            value={sigFor(data.signatures, 'HIERARCHY_HEAD') ? <SigVisa sig={sigFor(data.signatures, 'HIERARCHY_HEAD')} height={30} /> : ' '}
          />
          <Row
            label="Les Ressources Humaines"
            h={44}
            value={
              validated && data.company.cachetUrl && !sigFor(data.signatures, 'HR') ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={data.company.cachetUrl} alt="Cachet" style={{ height: 36, objectFit: 'contain' }} />
              ) : sigFor(data.signatures, 'HR') ? (
                <SigVisa
                  sig={sigFor(data.signatures, 'HR')}
                  height={30}
                  extra={validated && data.company.cachetUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={data.company.cachetUrl} alt="Cachet" style={{ height: 30, objectFit: 'contain' }} />
                  ) : undefined}
                />
              ) : (
                ' '
              )
            }
          />
          <Row
            label="Signature de la Direction Générale"
            h={44}
            value={sigFor(data.signatures, 'DG') ? <SigVisa sig={sigFor(data.signatures, 'DG')} height={30} /> : ' '}
          />
        </tbody>
      </table>

      {/* ✅ LOT E — fonctions sans case sur ce modèle (comptable, chef d'équipe) */}
      <OtherOpinions signatures={data.signatures} boxCodes={['HIERARCHY_HEAD', 'HR', 'DG']} fontSize={8.5} />

      <p className="std-leave-black" style={{ margin: '18px 0 0', fontSize: 11.5, lineHeight: '17px' }}>
        Le présent formulaire, une fois complété et validé, est transmis au service des Ressources Humaines pour
        établissement de l'attestation de mise en congé et mise à jour du dossier administratif du salarié.
      </p>

      <Spacer h={32} />
      <div className="std-leave-black" style={{ textAlign: 'right', fontSize: 11.5 }}>
        Fait à {data.company.city || 'Pointe-Noire'}, le {requestedDate || PLACEHOLDER_DATE}
      </div>

      {/* ── Pied de page ancré en bas : adresse en gras centrée, petites capitales ── */}
      <div style={{ marginTop: 'auto' }}>
        <div
          className="std-leave-black"
          style={{ textAlign: 'center', fontSize: 8.5, fontWeight: 700, textTransform: 'uppercase', lineHeight: '12px', whiteSpace: 'pre-line' }}
        >
          {data.company.documentFooterText || data.company.address || `${companyName} — Document confidentiel à usage exclusif du destinataire`}
        </div>
      </div>
    </div>
  );
}