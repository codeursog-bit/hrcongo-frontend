// ============================================================================
// lib/bulletin-variables.ts
// Mapping complet variables backend ↔ labels humains
// ============================================================================

export interface VariableInfo {
  key: string;           // chemin dans BulletinPayroll (ex: "employee.firstName")
  label: string;         // label humain
  group: string;         // groupe d'appartenance
  format: 'text' | 'money' | 'number' | 'date' | 'percent';
  required?: boolean;    // obligatoire dans tout bulletin
}

export const BACKEND_VARIABLES: VariableInfo[] = [
  // ── Salarié ──────────────────────────────────────────────────────────────
  { key:'employee.firstName',       label:'Prénom',                    group:'Salarié',       format:'text',   required:true  },
  { key:'employee.lastName',        label:'Nom de famille',            group:'Salarié',       format:'text',   required:true  },
  { key:'employee.employeeNumber',  label:'Matricule',                 group:'Salarié',       format:'text'   },
  { key:'employee.position',        label:'Poste',                     group:'Salarié',       format:'text'   },
  { key:'employee.cnssNumber',      label:'N° CNSS salarié',           group:'Salarié',       format:'text'   },
  { key:'employee.nationalIdNumber',label:'N° CNI',                    group:'Salarié',       format:'text'   },
  { key:'employee.paymentMethod',   label:'Mode de paiement',          group:'Salarié',       format:'text'   },
  { key:'employee.contractType',    label:'Type de contrat',           group:'Salarié',       format:'text'   },
  { key:'employee.maritalStatus',   label:'Situation familiale',       group:'Salarié',       format:'text'   },
  { key:'employee.numberOfChildren',label:'Nombre d\'enfants',         group:'Salarié',       format:'number' },
  { key:'employee.hireDate',        label:'Date d\'embauche',          group:'Salarié',       format:'date'   },
  { key:'employee.professionalCategory', label:'Catégorie pro.',       group:'Salarié',       format:'text'   },
  { key:'employee.echelon',         label:'Échelon',                   group:'Salarié',       format:'text'   },
  { key:'employee.department.name', label:'Département',               group:'Salarié',       format:'text'   },

  // ── Entreprise ───────────────────────────────────────────────────────────
  { key:'company.legalName',        label:'Raison sociale',            group:'Entreprise',    format:'text',   required:true  },
  { key:'company.tradeName',        label:'Nom commercial',            group:'Entreprise',    format:'text'   },
  { key:'company.logo',             label:'Logo',                      group:'Entreprise',    format:'text'   },
  { key:'company.address',          label:'Adresse',                   group:'Entreprise',    format:'text'   },
  { key:'company.city',             label:'Ville',                     group:'Entreprise',    format:'text'   },
  { key:'company.phone',            label:'Téléphone',                 group:'Entreprise',    format:'text'   },
  { key:'company.rccmNumber',       label:'N° RCCM',                   group:'Entreprise',    format:'text'   },
  { key:'company.cnssNumber',       label:'N° CNSS employeur',         group:'Entreprise',    format:'text'   },
  { key:'company.taxNumber',        label:'N° Fiscal',                 group:'Entreprise',    format:'text'   },

  // ── Période ───────────────────────────────────────────────────────────────
  { key:'month',                    label:'Mois de paie',              group:'Période',       format:'text',   required:true  },
  { key:'year',                     label:'Année',                     group:'Période',       format:'number', required:true  },
  { key:'workDays',                 label:'Jours ouvrables',           group:'Période',       format:'number' },
  { key:'workedDays',               label:'Jours travaillés',          group:'Période',       format:'number' },
  { key:'absenceDays',              label:'Absences non payées',       group:'Période',       format:'number' },
  { key:'daysOnLeave',              label:'Jours de congés',           group:'Période',       format:'number' },
  { key:'daysRemote',               label:'Jours télétravail',         group:'Période',       format:'number' },

  // ── Rémunération ──────────────────────────────────────────────────────────
  { key:'baseSalary',               label:'Salaire de base',           group:'Rémunération',  format:'money',  required:true  },
  { key:'adjustedBaseSalary',       label:'Salaire ajusté',            group:'Rémunération',  format:'money'  },
  { key:'absenceDeduction',         label:'Déduction absences',        group:'Rémunération',  format:'money'  },
  { key:'totalBonuses',             label:'Total primes',              group:'Rémunération',  format:'money'  },
  { key:'grossSalary',              label:'Salaire brut',              group:'Rémunération',  format:'money',  required:true  },

  // ── Heures sup ────────────────────────────────────────────────────────────
  { key:'overtimeHours10',          label:'HS +10% (heures)',          group:'Heures sup.',   format:'number' },
  { key:'overtimeHours25',          label:'HS +25% (heures)',          group:'Heures sup.',   format:'number' },
  { key:'overtimeHours50',          label:'HS +50% (heures)',          group:'Heures sup.',   format:'number' },
  { key:'overtimeHours100',         label:'HS +100% (heures)',         group:'Heures sup.',   format:'number' },
  { key:'totalOvertimeAmount',      label:'Montant total HS',          group:'Heures sup.',   format:'money'  },

  // ── Cotisations ───────────────────────────────────────────────────────────
  { key:'cnssSalarial',             label:'CNSS salariale (4%)',       group:'Cotisations',   format:'money',  required:true  },
  { key:'its',                      label:'ITS / IRPP',                group:'Cotisations',   format:'money',  required:true  },
  { key:'irppEffectiveRate',        label:'Taux effectif IRPP',        group:'Cotisations',   format:'percent' },
  { key:'tusDgiAmount',             label:'TUS Part DGI',              group:'Cotisations',   format:'money'  },
  { key:'tusCnssAmount',            label:'TUS Part CNSS',             group:'Cotisations',   format:'money'  },
  { key:'tusTotal',                 label:'TUS Total',                 group:'Cotisations',   format:'money'  },

  // ── Résultat ──────────────────────────────────────────────────────────────
  { key:'netSalary',                label:'Net à payer',               group:'Résultat',      format:'money',  required:true  },
  { key:'totalDeductions',          label:'Total retenues',            group:'Résultat',      format:'money',  required:true  },
  { key:'totalEmployerCost',        label:'Coût total employeur',      group:'Résultat',      format:'money'  },
  { key:'cnssEmployerPension',      label:'CNSS patronale pensions',   group:'Résultat',      format:'money'  },
  { key:'cnssEmployerFamily',       label:'CNSS patronale famille',    group:'Résultat',      format:'money'  },
  { key:'cnssEmployerAccident',     label:'CNSS patronale accidents',  group:'Résultat',      format:'money'  },
];

export const VARIABLE_GROUPS = BACKEND_VARIABLES.map(v => v.group).filter((g, i, arr) => arr.indexOf(g) === i);

export const REQUIRED_BLOCK_IDS = ['header','employee','salary','deductions','net'];
