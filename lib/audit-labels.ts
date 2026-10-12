// ============================================================================
// 📁 lib/audit-labels.ts — libellés FR + formatage des valeurs affichées
// Un code inconnu s'affiche tel quel (jamais masqué) : un nouvel événement du
// back reste visible même avant qu'on lui ajoute un libellé ici.
// ============================================================================

export const KIND_LABEL: Record<string, string> = {
  INITIAL: 'Contrat initial',
  RENEWAL: 'Renouvellement',
  CONVERSION_CDI: 'Conversion en CDI',
};

export const STATUS_LABEL: Record<string, string> = {
  ACTIVE: 'En cours',
  TRIAL: "En période d'essai",
  EXPIRED: 'Arrivé à terme',
  TERMINATED: 'Rompu',
  TRIAL_FAILED: 'Essai non concluant',
  CONVERTED: 'Converti en CDI',
  SUSPENDED: 'Suspendu',
};

export const CONTRACT_TYPE_LABEL: Record<string, string> = {
  CDI: 'CDI', CDD: 'CDD', STAGE: 'Stage', CONSULTANT: 'Consultant',
  PRESTATAIRE: 'Prestataire', INTERIM: 'Intérim',
};

export const MOTIF_LABEL: Record<string, string> = {
  OUVRAGE_CHANTIER: 'Ouvrage ou chantier',
  SURCROIT_OU_URGENCE: 'Surcroît temporaire / urgence',
  REMPLACEMENT: "Remplacement d'un salarié absent",
  AUTRE: 'Autre',
};

export const ENTITY_LABEL: Record<string, string> = {
  EMPLOYEE_CONTRACT: 'Contrat',
  EMPLOYEE: 'Employé',
  PAYROLL: 'Bulletin de paie',
  AUDIT_RUN: 'Contrôle de paie',
  AUDIT_FINDING: 'Écart de contrôle',
  AUDIT_CHECKPOINT: 'Point de contrôle',
  CONTRACT_CHAIN: 'Chaîne de contrats',
  COMPANY: 'Entreprise',
};

export const ACTION_LABEL: Record<string, string> = {
  CONTRACT_RENEWED: 'CDD renouvelé',
  CONTRACT_CLOSED_BY_RENEWAL: 'Contrat clos par renouvellement',
  EMPLOYEE_SYNCED_BY_RENEWAL: 'Fiche employé mise à jour (renouvellement)',
  CONTRACT_CONVERTED_CDI: 'CDD converti en CDI',
  CONTRACT_CLOSED_BY_CONVERSION: 'Contrat clos par conversion',
  EMPLOYEE_SYNCED_BY_CONVERSION: 'Fiche employé mise à jour (conversion)',
  EMPLOYEE_CREATED: 'Employé créé',
  EMPLOYEE_UPDATED: 'Fiche employé modifiée',
  CONTRACT_CREATED: 'Contrat initial enregistré',
  CONTRACT_CREATED_BY_SYNC: 'Contrat recréé depuis la fiche',
  CONTRACT_CLOSED_BY_TERMINATION: 'Contrat clos (fin de relation)',
  CONTRACT_TYPE_CHANGED: 'Type de contrat modifié',
  CONTRACT_CLOSED_BY_TYPE_CHANGE: 'Contrat clos (changement de type)',
  CONTRACT_DATES_EDITED: 'Dates du contrat modifiées',
  CONTRACT_TERMS_SYNCED: 'Conditions du contrat mises à jour',
  CONTRACT_CLOSED_BY_TRIAL_FAILURE: 'Contrat clos (essai non concluant)',
  CONTRACT_TRIAL_CONFIRMED: 'Essai confirmé',
  AUDIT_RUN_COMPLETED: 'Contrôle de paie effectué',
  AUDIT_FINDING_JUSTIFIED: 'Écart justifié',
  AUDIT_FINDING_WAIVED: 'Écart bloquant passé outre',
  AUDIT_FINDING_REOPENED: 'Écart rouvert',
  AUDIT_CHECKPOINT_ATTESTED: 'Point de contrôle attesté',
  PAYROLL_DRAFT: 'Bulletin remis en brouillon',
  PAYROLL_VALIDATED: 'Bulletin validé',
  PAYROLL_PAID: 'Bulletin payé',
  PAYROLL_CANCELLED: 'Bulletin annulé',
  PAYROLL_DELETED: 'Bulletin supprimé',
  PAYROLL_VALIDATED_WITH_OPEN_FINDINGS: 'Bulletin validé malgré des écarts',
};

export const FIELD_LABEL: Record<string, string> = {
  contractType: 'Type de contrat', status: 'Statut', startDate: 'Début', endDate: 'Fin',
  duration: 'Durée (mois)', position: 'Poste', baseSalary: 'Salaire de base',
  departmentId: 'Département', trialPeriodDays: "Période d'essai (jours)",
  trialEndDate: "Fin de l'essai", signedAt: 'Date de signature',
  signedByEmp: "Signé par l'employé", chainId: 'Chaîne de contrats', rank: 'Rang',
  kind: 'Nature', previousContractId: 'Contrat précédent', cddMotif: 'Motif du CDD',
  renewalReason: 'Raison du renouvellement', contractEndDate: 'Fin de contrat',
  hireDate: "Date d'embauche", tolZone: 'Zone TOL', isSubjectToCnss: 'Soumis CNSS',
  isSubjectToIrpp: 'Soumis ITS', isSubjectToTus: 'Soumis TUS',
  trialStatus: "Statut de l'essai", terminationDate: 'Date de fin de relation',
  terminationReason: 'Motif de fin', maritalStatus: 'Situation familiale',
  numberOfChildren: "Nombre d'enfants",
  validated: 'Validé', paid: 'Payé', paymentReference: 'Référence de paiement',
  month: 'Mois', year: 'Année', grossSalary: 'Salaire brut', netSalary: 'Net à payer',
  totalDeductions: 'Total des retenues', cnssSalarial: 'CNSS salariale', its: 'ITS',
  severity: 'Gravité', blocking: 'Bloquant', ruleCode: 'Règle', resolutionNote: 'Motif', evidenceRef: 'Preuve', note: 'Note',
};

export const FINDING_STATUS_LABEL: Record<string, string> = {
  OPEN: 'À traiter', JUSTIFIED: 'Justifié', WAIVED: 'Passé outre', RESOLVED: 'Résolu',
};

export const CATEGORY_LABEL: Record<string, string> = {
  CONTRATS: 'Contrats', PAIE: 'Paie', CNSS: 'CNSS', FISCAL: 'Fiscal', DOSSIER: 'Dossier', DECLARATIONS: 'Déclarations', AUTRE: 'Autre',
};

export const TRIGGER_LABEL: Record<string, string> = {
  MANUAL: 'Manuel', GATE: 'À la validation', CRON: 'Automatique (nuit)',
};

export const CHECKPOINT_STATUS_LABEL: Record<string, string> = {
  DONE: 'Fait', NOT_APPLICABLE: 'Sans objet', PENDING: 'À attester', NOT_DUE: "Rien d'exigible",
};

export const MONTHS_FR = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];

export const ROLE_LABEL: Record<string, string> = {
  SUPER_ADMIN: 'Super admin', ADMIN: 'Administrateur', HR_MANAGER: 'RH',
  MANAGER: 'Manager', EMPLOYEE: 'Employé', CABINET_ADMIN: 'Cabinet',
  CABINET_GESTIONNAIRE: 'Gestionnaire cabinet',
};

export const VERIFY_REASON_LABEL: Record<string, string> = {
  SEQ_GAP: "Un événement manque dans la séquence (suppression détectée).",
  PREV_HASH_MISMATCH: 'Le chaînage avec l’événement précédent est rompu.',
  HASH_MISMATCH: 'Le contenu d’un événement a été modifié après son enregistrement.',
};

const DATE_FIELDS = new Set([
  'startDate', 'endDate', 'trialEndDate', 'signedAt', 'contractEndDate', 'hireDate', 'terminationDate',
]);
const ID_FIELDS = new Set(['chainId', 'previousContractId', 'departmentId']);

export const fmtMoney = (n: number | string | null | undefined) =>
  new Intl.NumberFormat('fr-FR').format(Math.round(Number(n) || 0)) + ' FCFA';

/** Date seule (« 2026-07-01 ») : lue en UTC pour ne jamais décaler d'un jour. */
export function fmtDate(d: string | null | undefined): string {
  if (!d) return '—';
  const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(d) || d.endsWith('T00:00:00.000Z');
  return new Date(d).toLocaleDateString('fr-FR', {
    day: '2-digit', month: 'short', year: 'numeric',
    ...(dateOnly ? { timeZone: 'UTC' } : {}),
  });
}

export const fmtDateTime = (d: string | null | undefined) =>
  d
    ? new Date(d).toLocaleString('fr-FR', {
        day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
      })
    : '—';

export function fmtValue(field: string, v: unknown): string {
  if (v === null || v === undefined || v === '') return '—';
  if (typeof v === 'boolean') return v ? 'Oui' : 'Non';
  const s = String(v);
  if (field === 'baseSalary') return fmtMoney(s);
  if (DATE_FIELDS.has(field)) return fmtDate(s);
  if (field === 'status') return STATUS_LABEL[s] ?? s;
  if (field === 'contractType') return CONTRACT_TYPE_LABEL[s] ?? s;
  if (field === 'kind') return KIND_LABEL[s] ?? s;
  if (field === 'cddMotif') return MOTIF_LABEL[s] ?? s;
  if (field === 'tolZone') return s === 'VILLE' ? 'Ville' : s === 'PERIPHERIE' ? 'Périphérie' : s;
  if (ID_FIELDS.has(field)) return s.slice(0, 8) + '…';
  return s;
}

export const fieldLabel = (f: string) => FIELD_LABEL[f] ?? f;
export const actionLabel = (a: string) => ACTION_LABEL[a] ?? a;
export const entityLabel = (e: string) => ENTITY_LABEL[e] ?? e;

export const MONTHS_SHORT_FR = ['Janv','Févr','Mars','Avr','Mai','Juin','Juil','Août','Sept','Oct','Nov','Déc'];

export const SEVERITY_LABEL: Record<string, string> = { INFO: 'Information', WARN: 'Important', CRITICAL: 'Critique' };

/** Couleurs des graphiques (gris à la place de l'ambre, rouge réservé au critique). */
export const CHART_COLORS = {
  critical: '#dc2626',
  blocking: '#7f1d1d',
  warn: '#6b7280',
  info: '#d1d5db',
  ok: '#059669',
  brand: 'var(--brand)',
  grid: 'var(--border)',
  text: 'var(--text-muted)',
} as const;