'use client';

// ============================================================================
// 📁 components/documents/modern/ModernAdvanceRequestForm.tsx — MODÈLE 3
// Même contrat de données que StandardAdvanceRequestForm (drop-in).
// ============================================================================

import type { StandardAdvanceRequestFormData } from '../standard/StandardAdvanceRequestForm';
import {
  DecisionSection,
  G,
  InfoGrid,
  ModernSheet,
  Section,
  SignedLine,
  TEXT_LABEL_H,
  TextBlock,
  cachetIf,
  employeeItems,
  fillHeights,
  fmtMoney,
  isApprovedStatus,
  type SignatureBox,
} from './ModernDocumentKit';

export type ModernAdvanceRequestFormData = StandardAdvanceRequestFormData;

const MONTH_LABELS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];

export default function ModernAdvanceRequestForm({ data, id }: { data: ModernAdvanceRequestFormData; id?: string }) {
  const approved = isApprovedStatus(data.status);
  const rejected = data.status === 'REJECTED';
  const monthLabel =
    data.month && data.year ? `${(MONTH_LABELS[data.month - 1] || String(data.month)).replace(/^./, (c) => c.toUpperCase())} ${data.year}` : '';
  const [h1, h2, h3] = fillHeights([{ min: 24, grow: 0.6 }, { min: 28, grow: 1 }, { min: 50, grow: 1.4 }]);
  const reasonH = h3 - TEXT_LABEL_H - G.signedH - 8;

  const boxes: SignatureBox[] = [
    { label: 'Le Responsable Comptable', code: 'ACCOUNTANT' },
    {
      label: 'La Direction des Ressources Humaines',
      code: 'HR',
      cachetUrl: cachetIf(approved, data.company),
      decision: approved ? 'FAVORABLE' : rejected ? 'UNFAVORABLE' : null,
    },
    { label: 'La Direction Générale', code: 'DG' },
  ];

  return (
    <ModernSheet
      id={id}
      company={data.company}
      reference={data.reference}
      issuedAt={data.requestedAt}
      title="Demande d’avance sur salaire"
      subtitle="Avance à récupérer sur les prochaines paies"
      status={data.status}
    >
      <Section n={1} title="Renseignements du demandeur" mt={G.firstSectionTop} h={h1}>
        <InfoGrid items={employeeItems(data.employee)} rowH={Math.min(9, Math.max(6.9, (h1 - 3) / 3))} />
      </Section>

      <Section n={2} title="Objet de la demande" h={h2}>
        <InfoGrid
          labelWidth="38mm"
          rowH={Math.min(10, Math.max(7, (h2 - 3) / 2))}
          items={[
            { label: 'Montant sollicité', value: fmtMoney(data.amount) },
            { label: 'Mois de rattachement', value: monthLabel },
            { label: 'Mode de récupération', value: data.recoverViaPayroll == null ? '' : data.recoverViaPayroll ? 'Prélèvement sur salaire' : 'Autre', wide: true },
          ]}
        />
      </Section>

      <Section n={3} title="Motif et engagement" h={h3}>
        <TextBlock label="Motif de la demande" text={data.reason} h={reasonH} />
        <div style={{ marginTop: '2mm' }}>
          <SignedLine company={data.company} date={data.requestedAt} who="demandeur" />
        </div>
      </Section>

      <DecisionSection
        n={4}
        boxes={boxes}
        signatures={data.signatures}
        granted={approved}
        refused={rejected}
        extra={
          approved && fmtMoney(data.amount) ? (
            <span className="std-mod-navy" style={{ fontSize: 13 }}>
              Montant approuvé : <strong>{fmtMoney(data.amount)}</strong>
            </span>
          ) : undefined
        }
      />
    </ModernSheet>
  );
}