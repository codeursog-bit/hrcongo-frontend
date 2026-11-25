import references from '@/docs/modeles-documents/reference-documents.json';
import skins from '@/docs/modeles-documents/skins.json';
import type { Block, DocLayout, DocumentContext, FontId } from '@/types/document-layout';
import type { ModernAbsenceRequestFormData } from '@/components/documents/modern/ModernAbsenceRequestForm';
import type { ModernAdvanceRequestFormData } from '@/components/documents/modern/ModernAdvanceRequestForm';
import type { ModernLeaveRequestFormData } from '@/components/documents/modern/ModernLeaveRequestForm';
import type { ModernLoanRequestFormData } from '@/components/documents/modern/ModernLoanRequestForm';
import type { PermissionTicketData } from '@/components/PermissionTicketPrintable';

export const administrativeTypes = ['LEAVE', 'ABSENCE', 'EXIT_PERMISSION', 'LOAN', 'ADVANCE'] as const;
export type AdministrativeType = typeof administrativeTypes[number];
export const administrativeNames: Record<AdministrativeType, string> = {
  LEAVE: 'Congé', ABSENCE: 'Absence', EXIT_PERMISSION: 'Permission de sortie', LOAN: 'Prêt', ADVANCE: 'Avance sur salaire',
};
const designs = skins.documentsAdministratifs;
export type AdministrativePreset = keyof typeof designs.skins;
export const administrativePresets = Object.entries(designs.skins).map(([id, { nom }]) => ({
  id: id as AdministrativePreset, name: nom,
}));
export const defaultAdministrativePreset: AdministrativePreset = 'A_CLASSIQUE';
export const isAdministrativePreset = (value: unknown): value is AdministrativePreset =>
  administrativePresets.some(preset => preset.id === value);

export const historicAdministrativePresets = [
  { id: 'HIST_ORCA', name: 'Modèle 1 · Orca', template: 'ORCA', skin: 'A_CLASSIQUE' },
  { id: 'HIST_STANDARD', name: 'Modèle 2 · Standard', template: 'STANDARD', skin: 'A_CLASSIQUE' },
  { id: 'HIST_MODERN', name: 'Modèle 3 · Moderne', template: 'MODERN', skin: 'B_MODERNE' },
  { id: 'HIST_TICKET', name: 'Ticket historique', template: 'DEFAULT', skin: 'A_CLASSIQUE' },
] as const;
export const historicAdministrativePreset = (id?: string | null) =>
  historicAdministrativePresets.find(model => model.id === id);
export const administrativeBlockOptional = (block: Block) => block.type === 'note' || block.type === 'divider';

export function administrativeOtherDesigns(type: AdministrativeType, companyTemplate?: string | null) {
  if (type === 'EXIT_PERMISSION') return [
    historicAdministrativePresets[3], { id: 'STANDARD_TICKET_A4', name: 'Fiche Standard A4' },
  ];
  return companyTemplate === 'ORCA'
    ? [historicAdministrativePresets[0], historicAdministrativePresets[1]]
    : [historicAdministrativePresets[1], historicAdministrativePresets[2]];
}

export type AdministrativeInput =
  | { docType: 'LEAVE'; input: ModernLeaveRequestFormData }
  | { docType: 'ABSENCE'; input: ModernAbsenceRequestFormData }
  | { docType: 'EXIT_PERMISSION'; input: PermissionTicketData }
  | { docType: 'LOAN'; input: ModernLoanRequestFormData }
  | { docType: 'ADVANCE'; input: ModernAdvanceRequestFormData };

export type AdministrativeBlock = {
  type: Block['type'] | 'motifTable' | 'invoiceTable';
  titre?: string;
  colonnes?: number | string[];
  champs?: string[][];
  label?: string;
  lignes?: number | string[] | { key: string; label: string; jours: number | null }[];
  options?: string[];
  items?: string[];
  texte?: string;
  date?: string;
  signature?: string;
  commentaire?: string;
  ligneFinale?: string;
  hauteurRelative?: string;
  valueKey?: string;
  optionKeys?: string[];
};
type Reference = {
  titre: string; sousTitre?: string; intro?: string; blocs: AdministrativeBlock[];
};

const exitPermission: Reference = {
  titre: 'TICKET DE PERMISSION DE SORTIE',
  blocs: [
    { type: 'fieldGroup', titre: 'Identité du salarié', colonnes: 2, champs: [
      ['employee.fullName', 'Nom et prénom'], ['employee.employeeNumber', 'Matricule'],
      ['employee.department', 'Département'], ['employee.position', 'Poste occupé'],
    ] },
    { type: 'fieldGroup', titre: 'Objet de la sortie', colonnes: 3, champs: [
      ['exit.type', 'Type de permission'], ['exit.missionType', 'Type de mission'], ['exit.destination', 'Destination'],
    ] },
    { type: 'textLines', label: 'Motif de la sortie', valueKey: 'request.reason', lignes: 2 },
    { type: 'fieldGroup', titre: 'Horaires', colonnes: 3, champs: [
      ['exit.departureTime', 'Sortie'], ['exit.expectedReturnTime', 'Retour prévu'], ['exit.actualReturnTime', 'Retour constaté'],
    ] },
    { type: 'fieldGroup', titre: 'Décision et suivi du retour', colonnes: 2, champs: [
      ['request.status', 'Statut'], ['exit.reviewedBy', 'Décision par'], ['exit.reviewedAt', 'Date de décision'],
      ['exit.returnConfirmedBy', 'Retour validé par'], ['exit.rejectionReason', 'Motif du refus'],
    ] },
  ],
};
export const administrativeSpecs: Record<AdministrativeType, Reference> = {
  LEAVE: references.LEAVE as Reference, ABSENCE: references.ABSENCE as Reference,
  EXIT_PERMISSION: exitPermission, LOAN: references.LOAN as Reference, ADVANCE: references.ADVANCE as Reference,
};

const fontIds: Record<string, FontId> = { Calibri: 'carlito', Cambria: 'caladea', Arial: 'liberation-sans' };
const color = (value: string | undefined, fallback: string) => `#${value ?? fallback}`;

export function createAdministrativeLayout(docType: AdministrativeType, preset = defaultAdministrativePreset): DocLayout {
  const design = designs.skins[preset];
  const palette: Record<string, string> = design.colors;
  const source = administrativeSpecs[docType];
  const margins = designs.page.margesMm;
  const blocks: Block[] = [
    { id: 'header', type: 'header', row: 1, col: 1, span: 12, visible: true, locked: true,
      config: { title: source.titre, subtitle: source.sousTitre, intro: source.intro } },
    ...source.blocs.map((spec, index): Block => {
      const type = (spec.type === 'motifTable' || spec.type === 'invoiceTable') ? 'table' : spec.type;
      const config: AdministrativeBlock = { ...spec };
      if (docType === 'LOAN' && type === 'checklist') {
        config.valueKey = spec.titre ? 'loan.attachment' : 'loan.nature';
        config.optionKeys = spec.titre ? ['', '', '', 'ATTACHED'] : ['SOCIAL', 'SCOLARITE', 'LOGEMENT', 'EXCEPTIONNEL', 'AUTRE'];
      }
      return { id: `${type}-${index}`, type, row: index + 2, col: 1, span: 12, visible: true, locked: type !== 'note', config };
    }),
  ];
  return {
    schemaVersion: 2, docType, basePreset: preset,
    page: { size: 'A4', orientation: 'portrait', marginsMm: {
      top: margins.haut, right: margins.droite, bottom: margins.bas, left: margins.gauche,
    } },
    tokens: {
      fonts: { title: fontIds[design.fonts.titre], body: fontIds[design.fonts.corps] },
      sizeBasePt: 9, lineWidthPt: 0.5,
      colors: {
        ink: color(palette.ink, '222222'), muted: color(palette.muted, '555555'),
        main: color(palette.main, '222222'), accent: color(palette.accent ?? palette.main, '222222'),
        line: color(palette.hair ?? palette.border, 'CFC6C3'),
        soft: color(palette.paper ?? palette.soft ?? palette.pale, 'FFFFFF'),
        headFill: color(palette.band ?? palette.pale ?? palette.paper, 'FFFFFF'),
      },
    },
    variants: design.variants,
    blocks, labels: {}, footer: { showPageNumber: false },
  };
}

export function makeAdministrativeDesign(type: AdministrativeType, preset?: string | null, asOriginal = false): DocLayout {
  const historic = historicAdministrativePreset(preset);
  const layout = createAdministrativeLayout(type, historic?.skin ?? (isAdministrativePreset(preset) ? preset : undefined));
  if (historic) {
    layout.basePreset = historic.id;
    if (asOriginal) layout.useOriginal = true;
  }
  if (preset === 'STANDARD_TICKET_A4') {
    layout.basePreset = preset;
    layout.variants = { ...layout.variants, title: 'left-bold-sans', field: 'stacked-label-over-line', section: 'number-left-bar' };
    layout.tokens.colors = { ...layout.tokens.colors, main: '#1b4f4f', accent: '#b8860b' };
    layout.tokens.fonts.title = 'caladea';
  }
  if (preset === 'BLANK') {
    layout.basePreset = preset;
    layout.blocks = layout.blocks.filter(block => !administrativeBlockOptional(block))
      .map((block, index) => ({ ...block, row: index + 1,
        config: { ...block.config, titre: undefined, ...(block.type === 'header' ? { intro: undefined, subtitle: undefined } : {}) } }));
    layout.footer = { text: '', showPageNumber: false };
    layout.tokens.colors = { ink: '#202020', main: '#202020', line: '#808080', muted: '#404040' };
  }
  return layout;
}

const statuses: Record<string, string> = {
  PENDING: 'En attente', PENDING_DG: 'En attente de la direction générale', APPROVED: 'Accordé',
  VALIDATED: 'Validé', ACTIVE: 'Accordé', PAID: 'Payé', DEDUCTED: 'Déduit',
  REJECTED: 'Refusé', CANCELLED: 'Annulé', COMPLETED: 'Terminé',
};
const exitTypes: Record<string, string> = { URGENCE: 'Urgence', MISSION: 'Mission d’entreprise', AUTRE: 'Autre' };
const missions: Record<string, string> = {
  PROSPECTION_CLIENT: 'Prospection client', RECOUVREMENT: 'Recouvrement', SAV: 'Service après-vente',
  REPARATION_EXTERNE: 'Réparation externe', AUTRE: 'Autre mission',
};
const dateFormat = new Intl.DateTimeFormat('fr-FR', { timeZone: 'Africa/Brazzaville' });
const dateTimeFormat = new Intl.DateTimeFormat('fr-FR', {
  timeZone: 'Africa/Brazzaville', dateStyle: 'short', timeStyle: 'short',
});
const numbers = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 6 });
function formatDate(value?: string | Date | null, withTime = false) {
  if (!value) return '';
  const date = new Date(value);
  return Number.isFinite(date.valueOf()) ? (withTime ? dateTimeFormat : dateFormat).format(date) : '';
}
function amount(value: string | number) {
  if (value === '') return '';
  return Number.isFinite(Number(value)) ? `${numbers.format(Number(value)).replace(/\u202f/g, '\u00a0')} FCFA` : value;
}
const repayment = (via?: boolean | null) => via == null ? '' : via ? 'Retenue sur salaire' : 'Remboursement direct';

export function buildAdministrativeContext(request: AdministrativeInput): DocumentContext {
  const { docType, input } = request;
  const company = input.company;
  const employee = input.employee;
  const status = 'status' in input ? input.status : undefined;
  const values: DocumentContext['values'] = {
    'request.reference': input.reference,
    'request.status': status ? statuses[status] ?? status : undefined,
    'request.date': 'requestedAt' in input ? formatDate(input.requestedAt) : '',
    'request.reason': 'reason' in input ? input.reason : undefined,
    'company.city': 'city' in company && typeof company.city === 'string' ? company.city : '',
    'employee.fullName': [employee.firstName, employee.lastName].filter(Boolean).join(' '),
    'employee.employeeNumber': employee.employeeNumber,
    'employee.position': employee.position,
    'employee.phone': 'phone' in employee ? employee.phone : undefined,
  };
  const address = ['address' in company ? company.address : '', values['company.city'],
    'country' in company ? company.country : ''].filter(Boolean).join(', ');
  const footer = 'documentFooterText' in company ? company.documentFooterText : undefined;
  const administrative: NonNullable<DocumentContext['administrative']> = {
    footer: footer || [address, company.phone ? `Tél. ${company.phone}` : ''].filter(Boolean).join(' · '),
    approvals: 'signatures' in input ? input.signatures?.map(signature => ({
      code: signature.functionCode, label: signature.label, name: signature.authorName,
      decision: signature.opinion === 'FAVORABLE' ? 'Favorable' : 'Défavorable',
      image: signature.signatureUrl ?? undefined, date: formatDate(signature.date),
    })) : undefined,
    stamp: status && ['APPROVED', 'VALIDATED', 'ACTIVE', 'PAID', 'DEDUCTED'].includes(status) && 'cachetUrl' in company
      ? company.cachetUrl ?? undefined : undefined,
  };
  if (docType === 'LEAVE') Object.assign(values, {
    'request.reference': input.documentReferenceCode || input.reference,
    'employee.department': input.employee.departmentName, 'employee.hireDate': formatDate(input.employee.hireDate),
    'leave.startDate': formatDate(input.startDate), 'leave.endDate': formatDate(input.returnDate ?? input.endDate),
    'leave.days': input.daysCount, 'leave.type': input.leaveTypeLabel,
  });
  if (docType === 'ABSENCE') {
    Object.assign(values, {
      'absence.startDate': formatDate(input.startDate), 'absence.endDate': formatDate(input.endDate),
      'absence.returnDate': formatDate(input.returnDate), 'absence.days': input.workingDays,
    });
    const catalog = input.catalog ?? [];
    administrative.motifs = catalog.filter(row => row.key !== 'AUTRE').map(row => ({
      ...row, checked: row.key === input.motifKey,
    }));
    const missing = input.motifKey && !catalog.some(row => row.key === input.motifKey);
    const other = input.motifKey === 'AUTRE' || missing || !!input.otherReason;
    administrative.motifs.push({ key: 'AUTRE', label: input.otherReason || catalog.find(row => row.key === 'AUTRE')?.label
      || (other && input.motifKey !== 'AUTRE' ? String(input.motifKey) : 'Autres (à préciser)'), checked: !!other });
  }
  if (docType === 'LOAN') {
    Object.assign(values, {
      'loan.amount': amount(input.amount), 'loan.duration': input.durationMonths == null ? '' : `${input.durationMonths} mois`,
      'loan.repaymentMode': repayment(input.recoverViaPayroll), 'loan.nature': input.nature,
      'loan.monthlyRepayment': input.monthlyRepayment == null ? '' : amount(input.monthlyRepayment),
      'loan.attachment': input.attachmentUrl ? 'ATTACHED' : '',
      'request.status': values['request.status'] || (input.dgDecision === 'OUI' ? 'Accordé'
        : input.drhDecision === 'NON' || input.dgDecision === 'NON' ? 'Refusé' : undefined),
    });
    for (const [code, decision] of [['HR', input.drhDecision], ['DG', input.dgDecision]] as const) {
      if (decision && !administrative.approvals?.some(item => item.code === code)) {
        (administrative.approvals ??= []).push({ code, label: code === 'HR' ? 'Direction des ressources humaines' : 'Direction générale',
          name: '', decision: decision === 'OUI' ? 'Favorable' : 'Défavorable' });
      }
    }
  }
  if (docType === 'ADVANCE') Object.assign(values, {
    'advance.amount': amount(input.amount), 'advance.repaymentMode': repayment(input.recoverViaPayroll),
    'advance.approvedAmount': ['APPROVED', 'PAID', 'DEDUCTED'].includes(input.status) ? amount(input.amount) : '',
    'advance.period': input.month && input.year ? `${String(input.month).padStart(2, '0')}/${input.year}` : '',
  });
  if (docType === 'EXIT_PERMISSION') Object.assign(values, {
    'employee.department': input.employee.department, 'exit.type': exitTypes[input.type] ?? input.type,
    'exit.missionType': input.missionType ? missions[input.missionType] ?? input.missionType : '',
    'exit.destination': input.destination, 'exit.departureTime': formatDate(input.departureTime, true),
    'exit.expectedReturnTime': formatDate(input.expectedReturnTime, true),
    'exit.actualReturnTime': formatDate(input.actualReturnTime, true), 'exit.reviewedBy': input.reviewedByName,
    'exit.reviewedAt': formatDate(input.reviewedAt, true), 'exit.returnConfirmedBy': input.returnConfirmedByName,
    'exit.rejectionReason': input.rejectionReason,
  });
  return { values, company: { name: company.tradeName || company.legalName || 'Entreprise', logo: company.logo ?? undefined },
    items: [], administrative };
}

export function administrativeExample(docType: AdministrativeType): DocumentContext {
  const codes: Record<AdministrativeType, string> = {
    LEAVE: 'FDC', ABSENCE: 'DDA', EXIT_PERMISSION: 'TPS', LOAN: 'FDP', ADVANCE: 'FDA',
  };
  return {
    company: { name: 'KONZA TECH S.A.' }, items: [],
    values: { 'request.reference': `KT-001-2026/${codes[docType]}/DRH`, 'company.city': 'Pointe-Noire' },
    administrative: { footer: 'Avenue de l’Indépendance, Pointe-Noire · Document confidentiel à usage exclusif du destinataire' },
  };
}
