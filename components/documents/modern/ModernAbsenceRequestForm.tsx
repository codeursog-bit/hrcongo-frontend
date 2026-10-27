'use client';

// ============================================================================
// 📁 components/documents/modern/ModernAbsenceRequestForm.tsx — MODÈLE 3
// Même contrat de données que StandardAbsenceRequestForm (drop-in), plus deux
// champs facultatifs : `workingDays` (jours ouvrables comptés, dates incluses)
// et `returnDate` (jour de reprise) pour une période lisible sans ambiguïté.
// Mise en page : proportions de la fiche Axis Oil (voir ModernDocumentKit).
// ============================================================================

import type { StandardAbsenceRequestFormData } from '../standard/StandardAbsenceRequestForm';
import {
  DecisionSection,
  G,
  InfoGrid,
  ModernSheet,
  Section,
  SignedLine,
  Tick,
  cachetIf,
  employeeItems,
  fillHeights,
  isApprovedStatus,
  periodRows,
  plural,
  type SignatureBox,
} from './ModernDocumentKit';

export type ModernAbsenceRequestFormData = StandardAbsenceRequestFormData & {
  workingDays?: number | string | null;
  returnDate?: string | Date | null;
};

const HEAD_H = 7.9; // en-tête vert du tableau (mm)
const TABLE_H = 70.5; // hauteur cible du tableau (mm) : les lignes s'adaptent au nombre de motifs
const BORDER = '#cfe2de';
const GREEN_DARK = '#0b4d3f';

export default function ModernAbsenceRequestForm({ data, id }: { data: ModernAbsenceRequestFormData; id?: string }) {
  const approved = isApprovedStatus(data.status);
  const rejected = data.status === 'REJECTED';

  const rowsCount = data.catalog.length + 1; // + « Autres »
  // Un libellé long passe sur 2 lignes : on le prévoit pour que le tableau garde sa hauteur cible.
  const wrapped = data.catalog.filter((m) => m.label.length > 56).length + ((data.otherReason || '').length > 38 ? 1 : 0);
  const rowH = Math.max(6, Math.min(9.5, (TABLE_H - HEAD_H - wrapped * 3.6) / rowsCount));
  const tableH = HEAD_H + rowsCount * rowH + wrapped * 3.6;
  const [h1, h3] = fillHeights([{ min: 24 }, { min: 32 }], G.barH + G.detachedGap + tableH + G.gap);

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

  const th = { height: `${HEAD_H}mm`, padding: '0 4mm', fontSize: 13.5, fontWeight: 700 as const, textAlign: 'center' as const };
  const td = { height: `${rowH}mm`, padding: '0 4mm', borderTop: `1px solid ${BORDER}`, fontSize: 13, verticalAlign: 'middle' as const };

  return (
    <ModernSheet
      id={id}
      company={data.company}
      reference={data.reference}
      issuedAt={data.requestedAt}
      title="Demande d’autorisation d’absence"
      subtitle="Absence pour événement familial ou motif conventionnel"
      status={data.status}
    >
      <Section n={1} title="Renseignements du collaborateur" mt={G.firstSectionTop} h={h1}>
        <InfoGrid items={employeeItems(data.employee)} rowH={6.9} />
      </Section>

      <Section n={2} title="Motif de l’absence" hint="cocher la case correspondante" detached>
        <div className="std-mod-bg-white" style={{ border: `1.2px solid ${GREEN_DARK}`, borderRadius: 7, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
            <colgroup>
              <col style={{ width: '50.7%' }} />
              <col style={{ width: '28%' }} />
              <col />
            </colgroup>
            <thead>
              <tr>
                <th className="std-mod-th" style={th}>Motif</th>
                <th className="std-mod-th" style={{ ...th, borderLeft: '1px solid rgba(255,255,255,.35)' }}>Durée</th>
                <th className="std-mod-th" style={{ ...th, borderLeft: '1px solid rgba(255,255,255,.35)' }}>Choix</th>
              </tr>
            </thead>
            <tbody>
              {data.catalog.map((m) => {
                const chosen = data.motifKey === m.key;
                return (
                  <tr key={m.key} className={chosen ? 'std-mod-row-on' : undefined}>
                    <td className="std-mod-ink" style={{ ...td, fontWeight: chosen ? 700 : 400, lineHeight: 1.2 }}>{m.label}</td>
                    <td className="std-mod-ink" style={{ ...td, textAlign: 'center', borderLeft: `1px solid ${BORDER}`, fontSize: 12.5 }}>
                      {m.days > 0 ? `${m.days} ${plural(m.days, 'jour', 'jours')} conventionnel${m.days > 1 ? 's' : ''}` : '—'}
                    </td>
                    <td style={{ ...td, textAlign: 'center', borderLeft: `1px solid ${BORDER}` }}>
                      <Tick checked={chosen} size={16} />
                    </td>
                  </tr>
                );
              })}
              <tr className={data.otherReason ? 'std-mod-row-on' : undefined}>
                <td className="std-mod-ink" style={{ ...td, fontWeight: data.otherReason ? 700 : 400 }}>
                  Autres (à préciser){data.otherReason ? ` : ${data.otherReason}` : ''}
                </td>
                <td className="std-mod-muted" style={{ ...td, padding: '0 2mm', textAlign: 'center', borderLeft: `1px solid ${BORDER}`, fontSize: 9.5, lineHeight: 1.15 }}>
                  Durée et paiement décidés par la RH
                </td>
                <td style={{ ...td, textAlign: 'center', borderLeft: `1px solid ${BORDER}` }}>
                  <Tick checked={!!data.otherReason} size={16} />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </Section>

      <Section n={3} title="Période d’absence" h={h3}>
        <InfoGrid
          items={periodRows({ startDate: data.startDate, endDate: data.endDate, days: data.workingDays, daysLabel: 'ouvrables', returnDate: data.returnDate })}
          rowH={6.6}
        />
        <SignedLine company={data.company} date={data.requestedAt} who="collaborateur" />
      </Section>

      <DecisionSection n={4} boxes={boxes} signatures={data.signatures} granted={approved} refused={rejected} />
    </ModernSheet>
  );
}