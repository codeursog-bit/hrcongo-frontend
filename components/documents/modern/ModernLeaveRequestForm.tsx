'use client';

// ============================================================================
// 📁 components/documents/modern/ModernLeaveRequestForm.tsx — MODÈLE 3
// Même contrat de données que StandardLeaveRequestForm (drop-in), plus des
// champs facultatifs : `returnDate` (jour de reprise), `leaveTypeLabel`
// (ex. « Congé payé ») et `reason`.
// ℹ️ `endDate` = DERNIER jour de congé (inclus), comme en base. Le modèle 2
//    l'étiquette « Date de retour » ; ici on affiche « au (inclus) » et la
//    vraie reprise séparément, seulement si elle est fournie.
// ============================================================================

import type { StandardLeaveRequestFormData } from '../standard/StandardLeaveRequestForm';
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
  isApprovedStatus,
  periodRows,
  type SignatureBox,
} from './ModernDocumentKit';

export type ModernLeaveRequestFormData = StandardLeaveRequestFormData & {
  returnDate?: string | Date | null;
  leaveTypeLabel?: string | null;
  reason?: string | null;
};

export default function ModernLeaveRequestForm({ data, id }: { data: ModernLeaveRequestFormData; id?: string }) {
  const approved = isApprovedStatus(data.status);
  const rejected = data.status === 'REJECTED';
  const [h1, h2, h3] = fillHeights([{ min: 24, grow: 0.6 }, { min: 30, grow: 1 }, { min: 40, grow: 1.6 }]);
  const typeRowH = data.leaveTypeLabel ? 9 : 0;
  const reasonH = h3 - typeRowH - TEXT_LABEL_H - G.signedH - 9;

  const boxes: SignatureBox[] = [
    { label: 'Le Supérieur hiérarchique', code: 'HIERARCHY_HEAD' },
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
      reference={data.documentReferenceCode || data.reference}
      issuedAt={data.requestedAt}
      title="Formulaire de départ en congé"
      subtitle="Demande de congé du salarié"
      status={data.status}
    >
      <Section n={1} title="Renseignements du salarié" mt={G.firstSectionTop} h={h1}>
        <InfoGrid items={employeeItems(data.employee)} rowH={Math.min(9, Math.max(6.9, (h1 - 3) / 3))} />
      </Section>

      <Section n={2} title="Période de congé" h={h2}>
        <InfoGrid
          items={periodRows({ startDate: data.startDate, endDate: data.endDate, days: data.daysCount, daysLabel: 'décomptés', returnDate: data.returnDate })}
          rowH={Math.min(10, Math.max(7, (h2 - 4) / 2))}
        />
      </Section>

      <Section n={3} title="Objet de la demande" h={h3}>
        {data.leaveTypeLabel && <InfoGrid cols={1} items={[{ label: 'Type de congé', value: data.leaveTypeLabel }]} rowH={9} />}
        <TextBlock label="Motif" text={data.reason} h={reasonH} />
        <div style={{ marginTop: '2mm' }}>
          <SignedLine company={data.company} date={data.requestedAt} who="salarié" />
        </div>
      </Section>

      <DecisionSection n={4} boxes={boxes} signatures={data.signatures} granted={approved} refused={rejected} />
    </ModernSheet>
  );
}