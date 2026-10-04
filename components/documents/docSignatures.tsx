// ============================================================================
// 📁 components/documents/docSignatures.tsx — LOT D
// Briques communes pour afficher les signatures personnelles (avis) dans les
// cases EXISTANTES des documents imprimables, sans toucher à leur mise en page :
//   - sigFor(signatures, code)        → l'avis d'une fonction (ou undefined)
//   - <SigVisa sig extra />           → image de signature + nom + date
//   - <OtherOpinions .../>            → petit bandeau pour les fonctions qui
//                                       n'ont pas de case sur ce modèle
// Aucun avis → rien ne s'affiche → le document reste identique à avant.
// ============================================================================

import React from 'react';
import type { DocumentSignature } from '@/services/approvals';

export type { DocumentSignature };

// Correspondance case du document → fonction de validation
export const FN = {
  ACCOUNTANT: 'ACCOUNTANT',
  HR: 'HR',
  DG: 'DG',
  HIERARCHY_HEAD: 'HIERARCHY_HEAD',
  TEAM_LEAD: 'TEAM_LEAD',
} as const;

export const sigFor = (
  signatures: DocumentSignature[] | undefined | null,
  code: string,
): DocumentSignature | undefined => signatures?.find((s) => s.functionCode === code);

const fmtDate = (d?: string | Date | null) => {
  if (!d) return '';
  const date = typeof d === 'string' ? new Date(d) : d;
  return isNaN(date.getTime()) ? '' : date.toLocaleDateString('fr-FR');
};

/** Image de signature (si fournie) + nom + date, compacte. `extra` = ex. cachet, affiché à côté. */
export function SigVisa({
  sig,
  height = 22,
  extra,
  align = 'left',
  nameSize = 7.5,
}: {
  sig?: DocumentSignature;
  height?: number;
  extra?: React.ReactNode;
  align?: 'left' | 'center';
  nameSize?: number;
}) {
  if (!sig && !extra) return null;
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: align === 'center' ? 'center' : 'flex-start',
        gap: 1,
        lineHeight: 1.1,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        {extra}
        {sig?.signatureUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={sig.signatureUrl}
            alt={`Signature ${sig.authorName}`}
            style={{ height, maxWidth: 110, objectFit: 'contain' }}
          />
        ) : null}
      </div>
      {sig && (
        <div style={{ fontSize: nameSize, color: '#374151', whiteSpace: 'nowrap' }}>
          {sig.authorName} · {fmtDate(sig.date)}
        </div>
      )}
    </div>
  );
}

/**
 * Bandeau « Autres avis » : uniquement pour les fonctions qui n'ont PAS de case sur
 * ce modèle (ex. chef d'équipe, comptable sur une absence). Rien si aucun avis.
 */
export function OtherOpinions({
  signatures,
  boxCodes,
  fontSize = 9,
  color = '#111',
}: {
  signatures?: DocumentSignature[] | null;
  boxCodes: string[];
  fontSize?: number;
  color?: string;
}) {
  const others = (signatures ?? []).filter((s) => !boxCodes.includes(s.functionCode));
  if (others.length === 0) return null;
  return (
    <div style={{ marginTop: 10, fontSize, color, lineHeight: 1.3 }}>
      <div style={{ fontWeight: 700, marginBottom: 3 }}>Autres avis recueillis</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 18px' }}>
        {others.map((s) => (
          <div key={s.functionCode} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span>
              <strong>{s.label}</strong> — {s.opinion === 'FAVORABLE' ? 'Favorable' : 'Défavorable'}
              {' · '}
              {s.authorName} · {fmtDate(s.date)}
            </span>
            {s.signatureUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={s.signatureUrl} alt={`Signature ${s.authorName}`} style={{ height: 22, maxWidth: 90, objectFit: 'contain' }} />
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
