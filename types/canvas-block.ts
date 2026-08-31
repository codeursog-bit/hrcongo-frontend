// ============================================================================
// types/canvas-block.ts
// Types pour l'éditeur visuel type Canva — indépendant des templates fixes
// ============================================================================

export type CanvasBlockType =
  | 'header'      // Bandeau en-tête entreprise
  | 'value-card'  // Carte grande valeur (net à payer, brut...)
  | 'info-grid'   // Grille clé-valeur (infos employé)
  | 'table'       // Tableau de lignes items[]
  | 'divider'     // Séparateur
  | 'text'        // Texte libre / message
  | 'signatures'; // Zone signatures

// Variables assignables — chaque variable = un champ réel de l'API payroll
export type CanvasVariable =
  | 'employee.fullName'       | 'employee.firstName'      | 'employee.lastName'
  | 'employee.employeeNumber' | 'employee.position'       | 'employee.department'
  | 'employee.cnssNumber'     | 'employee.contractType'   | 'employee.hireDate'
  | 'employee.seniority'      | 'employee.maritalStatus'  | 'employee.paymentMethod'
  | 'employee.category'
  | 'company.name'            | 'company.logo'            | 'company.address'
  | 'company.rccm'            | 'company.cnss'            | 'company.phone'
  | 'period.monthYear'        | 'period.workDays'         | 'period.workedDays'
  | 'period.absenceDays'      | 'period.leaveDays'        | 'period.overtimeTotal'
  | 'pay.baseSalary'          | 'pay.grossSalary'         | 'pay.netSalary'
  | 'pay.totalDeductions'     | 'pay.totalEmployerCost'   | 'pay.totalBonuses'
  | 'pay.cnssSalarial'        | 'pay.its'                 | 'pay.tusTotal'
  | 'pay.cnssEmployerTotal'   | 'pay.absenceDeduction'
  | 'items.gains'             | 'items.deductions'        | 'items.employer'
  | 'items.overtime'          | 'items.bonuses'           | 'items.all'
  | 'static.text'             | 'static.pageTitle'        | 'static.legalMentions'
  // Variables scalaires manquantes — lacunes corrigées
  | 'pay.leaveIndemnity'       | 'pay.advanceDeduction'    | 'pay.loanDeduction'
  | 'pay.customTaxEmployee'    | 'pay.customTaxEmployer'
  | 'pay.cnssEmployerPension'  | 'pay.cnssEmployerFamily'  | 'pay.cnssEmployerAccident'
  | 'pay.tusDgi'               | 'pay.tusCnss'
  | 'items.loans'              | 'items.advances'          | 'items.customTaxEmp'
  | 'items.customTaxEmployer'  | 'items.congé';

export const VARIABLE_LABELS: Record<CanvasVariable, string> = {
  'employee.fullName':       'Nom complet',
  'employee.firstName':      'Prénom',
  'employee.lastName':       'Nom de famille',
  'employee.employeeNumber': 'Matricule',
  'employee.position':       'Poste',
  'employee.department':     'Département',
  'employee.cnssNumber':     'N° CNSS salarié',
  'employee.contractType':   'Type de contrat',
  'employee.hireDate':       'Date d\'embauche',
  'employee.seniority':      'Ancienneté',
  'employee.maritalStatus':  'Situation familiale',
  'employee.paymentMethod':  'Mode de paiement',
  'employee.category':       'Catégorie / Échelon',
  'company.name':            'Nom de l\'entreprise',
  'company.logo':            'Logo entreprise',
  'company.address':         'Adresse',
  'company.rccm':            'N° RCCM',
  'company.cnss':            'N° CNSS employeur',
  'company.phone':           'Téléphone',
  'period.monthYear':        'Mois et année de paie',
  'period.workDays':         'Jours ouvrables',
  'period.workedDays':       'Jours travaillés',
  'period.absenceDays':      'Jours d\'absence',
  'period.leaveDays':        'Jours de congé',
  'period.overtimeTotal':    'Heures supplémentaires',
  'pay.baseSalary':          'Salaire de base',
  'pay.grossSalary':         'Salaire brut',
  'pay.netSalary':           'Net à payer',
  'pay.totalDeductions':     'Total retenues',
  'pay.totalEmployerCost':   'Coût total employeur',
  'pay.totalBonuses':        'Total primes',
  'pay.cnssSalarial':        'CNSS salariale',
  'pay.its':                 'ITS / IRPP',
  'pay.tusTotal':            'TUS total',
  'pay.cnssEmployerTotal':   'CNSS patronale total',
  'pay.absenceDeduction':    'Déduction absences',
  'items.gains':             'Tableau — Rémunérations',
  'items.deductions':        'Tableau — Cotisations salariales',
  'items.employer':          'Tableau — Charges patronales',
  'items.overtime':          'Tableau — Heures supplémentaires',
  'items.bonuses':           'Tableau — Primes & avantages',
  'items.all':               'Tableau — Tous les éléments',
  'static.text':             'Texte libre',
  'static.pageTitle':        'Titre "Bulletin de Paie"',
  'static.legalMentions':    'Mentions légales Congo 2026',
  // Scalaires manquants
  'pay.leaveIndemnity':       'Indemnité de congé payé',
  'pay.advanceDeduction':     'Récupération d\'avance',
  'pay.loanDeduction':        'Remboursement prêt',
  'pay.customTaxEmployee':    'Taxes custom salarié (total)',
  'pay.customTaxEmployer':    'Taxes custom employeur (total)',
  'pay.cnssEmployerPension':  'CNSS patronale — Pensions (8%)',
  'pay.cnssEmployerFamily':   'CNSS patronale — Famille (10,03%)',
  'pay.cnssEmployerAccident': 'CNSS patronale — Accidents (2,25%)',
  'pay.tusDgi':               'TUS Part DGI (2,025%)',
  'pay.tusCnss':              'TUS Part CNSS (5,475%)',
  'items.loans':              'Tableau — Prêts & remboursements',
  'items.advances':           'Tableau — Avances sur salaire',
  'items.customTaxEmp':       'Tableau — Taxes custom salarié',
  'items.customTaxEmployer':  'Tableau — Taxes custom patronales',
  "items.congé":              'Tableau — Congés & absences',
};

export const VARIABLE_GROUPS: { label: string; vars: CanvasVariable[] }[] = [
  { label:'Employé',         vars:['employee.fullName','employee.employeeNumber','employee.position','employee.department','employee.cnssNumber','employee.contractType','employee.hireDate','employee.seniority','employee.maritalStatus','employee.paymentMethod','employee.category'] },
  { label:'Entreprise',      vars:['company.name','company.logo','company.address','company.rccm','company.cnss','company.phone'] },
  { label:'Période & temps', vars:['period.monthYear','period.workDays','period.workedDays','period.absenceDays','period.leaveDays','period.overtimeTotal'] },
  { label:'Montants clés',   vars:['pay.baseSalary','pay.grossSalary','pay.netSalary','pay.totalDeductions','pay.totalEmployerCost','pay.totalBonuses','pay.absenceDeduction','pay.cnssSalarial','pay.its','pay.tusTotal','pay.cnssEmployerTotal','pay.leaveIndemnity','pay.advanceDeduction','pay.loanDeduction','pay.customTaxEmployee','pay.customTaxEmployer','pay.cnssEmployerPension','pay.cnssEmployerFamily','pay.cnssEmployerAccident','pay.tusDgi','pay.tusCnss'] },
  { label:'Tableaux détail', vars:['items.gains','items.deductions','items.employer','items.overtime','items.bonuses','items.all','items.loans','items.advances','items.customTaxEmp','items.customTaxEmployer',"items.congé"] },
  { label:'Éléments fixes',  vars:['static.text','static.pageTitle','static.legalMentions'] },
];

export interface CanvasBlockStyle {
  backgroundColor: string;
  textColor:       string;
  accentColor:     string;
  fontSize:        'sm' | 'md' | 'lg';
  padding:         'compact' | 'normal' | 'airy';
  borderRadius:    0 | 4 | 8 | 16;
  showBorder:      boolean;
  bold:            boolean;
}

export interface CanvasBlock {
  id:          string;
  type:        CanvasBlockType;
  order:       number;
  variable?:   CanvasVariable;
  staticText?: string;
  label?:      string;
  required?:   boolean;
  style:       CanvasBlockStyle;
}

export interface CanvasLayout {
  primaryColor:   string;
  secondaryColor: string;
  fontFamily:     'sans' | 'serif' | 'mono';
  blocks:         CanvasBlock[];
}

export interface PaletteItem {
  type:               CanvasBlockType;
  label:              string;
  description:        string;
  icon:               string;
  defaultVariable?:   CanvasVariable;
}

export const PALETTE_ITEMS: PaletteItem[] = [
  { type:'header',     label:'En-tête entreprise', description:'Logo, nom, adresse, période',           icon:'🏢', defaultVariable:'company.name'    },
  { type:'value-card', label:'Carte valeur',        description:'Grande valeur mise en avant',           icon:'💵', defaultVariable:'pay.netSalary'    },
  { type:'info-grid',  label:'Fiche employé',       description:'Grille nom, poste, contrat, CNSS…',    icon:'👤', defaultVariable:'employee.fullName' },
  { type:'table',      label:'Tableau de paie',     description:'Lignes rémunérations / cotisations',   icon:'📋', defaultVariable:'items.gains'       },
  { type:'divider',    label:'Séparateur',           description:'Ligne de séparation',                  icon:'➖'                                      },
  { type:'text',       label:'Texte / Message',      description:'Message libre, mentions légales',      icon:'💬', defaultVariable:'static.text'       },
  { type:'signatures', label:'Zone signatures',      description:'Signature employeur + employé',        icon:'✍️'                                      },
];

// Variables obligatoires pour qu'un bulletin soit valide
export const REQUIRED_VARIABLES: CanvasVariable[] = [
  'pay.netSalary', 'pay.grossSalary', 'employee.fullName', 'items.deductions',
];

export const DEFAULT_BLOCK_STYLE: CanvasBlockStyle = {
  backgroundColor: '#ffffff',
  textColor:       '#111827',
  accentColor:     '#0EA5E9',
  fontSize:        'md',
  padding:         'normal',
  borderRadius:    8,
  showBorder:      true,
  bold:            false,
};

export const EMPTY_CANVAS: CanvasLayout = {
  primaryColor:   '#0EA5E9',
  secondaryColor: '#10B981',
  fontFamily:     'sans',
  blocks:         [],
};
