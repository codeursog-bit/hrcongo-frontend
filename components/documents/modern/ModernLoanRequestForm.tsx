'use client';

// ============================================================================
// 📁 components/documents/modern/ModernLoanRequestForm.tsx — MODÈLE 3
// Même contrat de données que StandardLoanRequestForm (drop-in), plus deux
// champs facultatifs : `status` (statut réel du prêt) et `monthlyRepayment`.
// Sans `status`, il est déduit des avis : refus DRH/DG → Refusé ; DG « OUI »
// → Accordé ; DRH « OUI » seul → En attente de la Direction Générale.
// ============================================================================

import type { StandardLoanRequestFormData } from '../standard/StandardLoanRequestForm';
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

export type ModernLoanRequestFormData = StandardLoanRequestFormData & {
  status?: string | null;
  monthlyRepayment?: number | string | null;
};

const NATURE_LABELS: Record<string, string> = {
  SOCIAL: 'Social',
  SCOLARITE: 'Scolarité',
  LOGEMENT: 'Logement',
  EXCEPTIONNEL: 'Exceptionnel',
  AUTRE: 'Autre',
};

export function deriveLoanStatus(d: Pick<ModernLoanRequestFormData, 'status' | 'drhDecision' | 'dgDecision'>): string {
  if (d.status) return d.status;
  if (d.drhDecision === 'NON' || d.dgDecision === 'NON') return 'REJECTED';
  if (d.dgDecision === 'OUI') return 'ACTIVE';
  if (d.drhDecision === 'OUI') return 'PENDING_DG';
  return 'PENDING';
}

const toOpinion = (v?: 'OUI' | 'NON' | null) => (v === 'OUI' ? 'FAVORABLE' : v === 'NON' ? 'UNFAVORABLE' : null);

export default function ModernLoanRequestForm({ data, id }: { data: ModernLoanRequestFormData; id?: string }) {
  const status = deriveLoanStatus(data);
  const granted = isApprovedStatus(status);
  const refused = status === 'REJECTED';
  const duration = Number(data.durationMonths);
  const hasDuration = data.durationMonths !== null && data.durationMonths !== undefined && data.durationMonths !== '' && duration > 0;
  const [h1, h2, h3] = fillHeights([{ min: 24, grow: 0.6 }, { min: 34, grow: 1.1 }, { min: 50, grow: 1.2 }]);
  const natureRowH = 9;
  const reasonH = h2 - natureRowH - TEXT_LABEL_H - 6;

  const boxes: SignatureBox[] = [
    { label: 'Le Responsable Comptable', code: 'ACCOUNTANT' },
    {
      label: 'La Direction des Ressources Humaines',
      code: 'HR',
      cachetUrl: cachetIf(data.drhDecision === 'OUI', data.company),
      decision: toOpinion(data.drhDecision),
    },
    { label: 'La Direction Générale', code: 'DG', decision: toOpinion(data.dgDecision) },
  ];

  return (
    <ModernSheet
      id={id}
      company={data.company}
      reference={data.reference}
      issuedAt={data.requestedAt}
      title="Demande de prêt"
      subtitle="Prêt au personnel"
      status={status}
      gender="m"
    >
      <Section n={1} title="Renseignements du demandeur" mt={G.firstSectionTop} h={h1}>
        <InfoGrid items={employeeItems(data.employee)} rowH={Math.min(9, Math.max(6.9, (h1 - 3) / 3))} />
      </Section>

      <Section n={2} title="Objet de la demande" h={h2}>
        <InfoGrid cols={1} items={[{ label: 'Nature du prêt', value: data.nature ? NATURE_LABELS[data.nature] || data.nature : '' }]} rowH={natureRowH} />
        <TextBlock label="Motif de la demande" text={data.reason} h={reasonH} />
      </Section>

      <Section n={3} title="Conditions de remboursement" h={h3}>
        <InfoGrid
          labelWidth="34mm"
          rowH={Math.min(9, Math.max(7, (h3 - G.signedH - 4) / 3))}
          items={[
            { label: 'Montant sollicité', value: fmtMoney(data.amount) },
            { label: 'Durée', value: hasDuration ? `${duration} mois` : '' },
            { label: 'Mensualité', value: fmtMoney(data.monthlyRepayment) },
            { label: 'Remboursement', value: data.recoverViaPayroll == null ? '' : data.recoverViaPayroll ? 'Retenue sur salaire' : 'Autre' },
            { label: 'Pièce jointe', value: data.attachmentUrl ? 'Oui, jointe au dossier' : 'Aucune', wide: true },
          ]}
        />
        <div style={{ marginTop: '2mm' }}>
          <SignedLine company={data.company} date={data.requestedAt} who="demandeur" />
        </div>
      </Section>

      <DecisionSection n={4} title="Avis et décision" boxes={boxes} signatures={data.signatures} granted={granted} refused={refused} />
    </ModernSheet>
  );
}