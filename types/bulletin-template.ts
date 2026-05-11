// ============================================================================
// types/bulletin-template.ts
// Tous les types TypeScript du système de personnalisation des bulletins
// ============================================================================

// ─── Données Payroll (inchangées depuis l'API) ───────────────────────────────

export interface PayrollItem {
  id: string;
  code: string;
  label: string;
  type: 'GAIN' | 'DEDUCTION' | 'EMPLOYER_COST';
  base?: number;
  rate?: number;
  amount: number;
  isTaxable: boolean;
  isCnss: boolean;
  order: number;
}

export interface PayrollEmployee {
  id: string;
  firstName?: string;
  lastName?: string;
  employeeNumber?: string;
  position?: string;
  cnssNumber?: string;
  nationalIdNumber?: string;
  paymentMethod?: string;
  maritalStatus?: string;
  numberOfChildren?: number;
  contractType?: string;
  hireDate?: string;
  professionalCategory?: string;
  echelon?: string;
  isSubjectToCnss?: boolean;
  isSubjectToIrpp?: boolean;
  department?: { name?: string };
}

export interface PayrollCompany {
  legalName?: string;
  tradeName?: string;
  logo?: string;
  address?: string;
  city?: string;
  phone?: string;
  email?: string;
  rccmNumber?: string;
  cnssNumber?: string;
  taxNumber?: string;
  nif?: string;
  primaryColor?: string;
  secondaryColor?: string;
  collectiveAgreement?: string;
}

export interface BulletinPayroll {
  id: string;
  month: number;
  year: number;
  status: string;
  periodStart?: string;
  periodEnd?: string;
  paymentDate?: string;
  workDays: number;
  workedDays: number;
  absenceDays: number;
  daysOnLeave?: number;
  daysRemote?: number;
  daysHoliday?: number;
  overtimeHours10?: number;
  overtimeHours25?: number;
  overtimeHours50?: number;
  overtimeHours100?: number;
  overtimeAmount10?: number;
  overtimeAmount25?: number;
  overtimeAmount50?: number;
  overtimeAmount100?: number;
  totalOvertimeAmount?: number;
  baseSalary: number;
  adjustedBaseSalary?: number;
  absenceDeduction?: number;
  totalBonuses?: number;
  grossSalary: number;
  netSalary: number;
  totalDeductions: number;
  totalEmployerCost: number;
  cnssSalarial?: number;
  cnssEmployer?: number;
  cnssEmployerPension?: number;
  cnssEmployerFamily?: number;
  cnssEmployerAccident?: number;
  its?: number;
  irppFiscalParts?: number;
  irppEffectiveRate?: number;
  irppAbattement?: number;
  tusDgiAmount?: number;
  tusCnssAmount?: number;
  tusTotal?: number;
  items: PayrollItem[];
  bonuses?: any[];
  employee: PayrollEmployee;
  company: PayrollCompany;
}

// ─── Template config ─────────────────────────────────────────────────────────

export type TemplateId = 'default' | 'corporate' | 'moderne' | 'compact' | 'premium';

export type BlockStyleDisplay = 'table' | 'card' | 'line' | 'subtle';
export type LayoutMode = '1col' | '2col';
export type FontFamily = 'sans' | 'serif' | 'mono';
export type FontSize = 'sm' | 'md' | 'lg';
export type Density = 'compact' | 'normal' | 'airy';
export type LogoPosition = 'left' | 'center' | 'right';
export type HeaderStyle = 'gradient' | 'dark' | 'line' | 'minimal';
export type BorderRadius = 0 | 2 | 4 | 8 | 16;

// Identifiants des blocs disponibles
export type BlockId =
  | 'header'        // En-tête entreprise
  | 'employee'      // Infos salarié
  | 'time'          // Temps de travail
  | 'salary'        // Rémunérations
  | 'overtime'      // Heures sup
  | 'bonuses'       // Primes
  | 'deductions'    // Cotisations salariales
  | 'employer'      // Charges patronales
  | 'net'           // Net à payer (barre)
  | 'recap'         // Récapitulatif
  | 'signatures'    // Signatures
  | 'legal'         // Mentions légales (app only)
  | 'message';      // Message employeur

// Portée d'affichage : print = A4, app = écran seulement, both = partout
export type BlockScope = 'print' | 'app' | 'both';

export interface BlockConfig {
  id: string;
  // Titre affiché dans le bulletin (renommable par l'utilisateur)
  label: string;
  // Style d'affichage du bloc
  display: BlockStyleDisplay;
  // Visible dans le bulletin
  visible: boolean;
  // Portée (print / app / both)
  scope: BlockScope;
  // Position dans l'ordre (0 = premier)
  order: number;
}

export interface StyleConfig {
  // Couleurs
  primaryColor: string;
  secondaryColor: string;
  textColor: string;
  // Typographie
  fontFamily: FontFamily;
  fontSize: FontSize;
  // Mise en page
  density: Density;
  layout: LayoutMode;
  borderRadius: BorderRadius;
  headerStyle: HeaderStyle;
  // Logo
  showLogo: boolean;
  logoPosition: LogoPosition;
  showAddress: boolean;
  showFiscalNumbers: boolean;
  // Pied de page
  showPageNumber: boolean;
  showGeneratedDate: boolean;
  showHrSignature: boolean;
  // Message personnalisé
  footerMessage: string;
}

export interface BulletinTemplateConfig {
  // ID du template de base
  templateId: TemplateId;
  // Nom affiché dans l'éditeur
  name: string;
  // Style global
  style: StyleConfig;
  // Blocs dans leur ordre
  blocks: BlockConfig[];
  // Timestamp de dernière modification
  updatedAt?: string;
}

// ─── Réponse API ─────────────────────────────────────────────────────────────

export interface BulletinTemplateApiResponse {
  config: BulletinTemplateConfig;
  isDefault: boolean;
}

// ─── Props du renderer ────────────────────────────────────────────────────────

export interface BulletinRendererProps {
  payroll: BulletinPayroll;
  template: BulletinTemplateConfig;
  // Mode preview dans l'éditeur (taille réduite)
  previewMode?: boolean;
  // Force le rendu print (pour window.print())
  printMode?: boolean;
}
