import type { BulletinPayroll } from '@/types/bulletin-template';

export const bulletinGalleryExample: BulletinPayroll = {
  id:'preview', month: new Date().getMonth()+1, year: new Date().getFullYear(),
  status:'VALIDATED', workDays:26, workedDays:24, absenceDays:2, daysOnLeave:0, daysRemote:2,
  overtimeHours10:4, overtimeHours25:2, baseSalary:450000, grossSalary:512000,
  netSalary:438750, totalDeductions:73250, totalBonuses:62000, totalEmployerCost:625400,
  absenceDeduction:34615, cnssSalarial:18000, cnssEmployer:72000,
  cnssEmployerPension:36000, cnssEmployerFamily:25000, cnssEmployerAccident:11000,
  its:55250, tusDgiAmount:10375, tusCnssAmount:28012, tusTotal:38387,
  items:[
    {id:'1',code:'SAL_BASE',label:'Salaire de base',type:'GAIN',amount:450000,base:17307.69,quantity:26,isTaxable:true,isCnss:true,order:1},
    {id:'1b',code:'ABS_DEDUCT',label:'Déduction absences',type:'DEDUCTION',amount:34615,base:17307.69,quantity:2,isTaxable:false,isCnss:false,order:1},
    {id:'2',code:'HS_10',label:'Heures sup. (+10%)',type:'GAIN',amount:12000,rate:1.10,isTaxable:true,isCnss:true,order:2},
    {id:'3',code:'HS_25',label:'Heures sup. (+25%)',type:'GAIN',amount:8000,rate:1.25,isTaxable:true,isCnss:true,order:3},
    {id:'4',code:'AUTO_BONUS_001',label:'Prime de transport',type:'GAIN',amount:30000,isTaxable:false,isCnss:false,order:4},
    {id:'5',code:'AUTO_BONUS_002',label:'Indemnité de repas',type:'GAIN',amount:24000,isTaxable:false,isCnss:false,order:5},
    {id:'6',code:'CNSS_SAL',label:'CNSS Salariale',type:'DEDUCTION',amount:18000,base:450000,rate:0.04,isTaxable:false,isCnss:true,order:1},
    {id:'7',code:'ITS',label:'ITS',type:'DEDUCTION',amount:55250,base:512000,isTaxable:false,isCnss:false,order:2},
    {id:'8',code:'CNSS_EMP',label:'CNSS Patronale',type:'EMPLOYER_COST',amount:72000,isTaxable:false,isCnss:false,order:1},
    {id:'9',code:'TUS_DGI',label:'TUS FISC',type:'EMPLOYER_COST',amount:10375,rate:0.02025,isTaxable:false,isCnss:false,order:2},
    {id:'10',code:'TUS_CNSS',label:'TUS Part CNSS',type:'EMPLOYER_COST',amount:28012,rate:0.05475,isTaxable:false,isCnss:false,order:3},
  ],
  bonuses:[],
  employee:{
    id:'emp1',firstName:'Camille',lastName:'Exemple',employeeNumber:'EMP-2024-042',
    position:'Responsable Comptable',cnssNumber:'CN-4892-76',nationalIdNumber:'CG-19882-B',
    paymentMethod:'BANK_TRANSFER',maritalStatus:'MARRIED',numberOfChildren:2,
    contractType:'CDI',hireDate:'2021-03-15',professionalCategory:'III',echelon:'B',
    department:{name:'Finance & Comptabilité'},
  },
  company:{
    legalName:'Entreprise Exemple',tradeName:'Entreprise Exemple',
    address:'34, Avenue Amilcar Cabral',city:'Brazzaville',phone:'+242 06 000 0000',
    rccmNumber:'CG/BZV/24/B/0042',cnssNumber:'CNSS-0042-BZV',
  },
};

// ─── Données démo — preview FACTURE (prestataire/consultant/intérim/stagiaire) ──
// Mêmes codes items que le moteur de paie réel (SAL_BASE, BNC_SOURCE,
// ADVANCE, INDEM_CONGE) — seul le contractType change le routage vers
// FactureRenderer* au lieu de BulletinRenderer*.

export const invoiceGalleryExample: BulletinPayroll = {
  id:'preview-facture', month: new Date().getMonth()+1, year: new Date().getFullYear(),
  status:'VALIDATED', workDays:26, workedDays:26, absenceDays:0,
  baseSalary:250000, grossSalary:265000, netSalary:212500, totalDeductions:52500,
  totalBonuses:0, totalEmployerCost:0, its:25000,
  items:[
    {id:'f1',code:'SAL_BASE',label:'Forfait mensuel',type:'GAIN',amount:250000,base:250000,isTaxable:true,isCnss:false,order:1},
    {id:'f2',code:'INDEM_CONGE',label:'Indemnité de congé',type:'GAIN',amount:15000,isTaxable:true,isCnss:false,order:2},
    {id:'f3',code:'BNC_SOURCE',label:'BNC 10% retenu à la source',type:'DEDUCTION',amount:25000,base:265000,rate:0.10,isTaxable:false,isCnss:false,order:1},
    {id:'f4',code:'ADVANCE',label:'Avance sur salaire',type:'DEDUCTION',amount:27500,isTaxable:false,isCnss:false,order:2},
  ],
  bonuses:[],
  employee:{
    id:'emp-presta',firstName:'Jean',lastName:'Exemple',
    position:'Prestataire',paymentMethod:'CASH',
    contractType:'PRESTATAIRE',hireDate:'2025-01-10',
  },
  company: bulletinGalleryExample.company,
};

// Démo du modèle « Facture professionnelle » : coordonnées et compte bancaire renseignés
// pour que l'aperçu montre le rendu complet (même données que le moteur : champs Company / Employee).
export const detailedInvoiceGalleryExample: BulletinPayroll = {
  ...invoiceGalleryExample,
  paymentDate: new Date().toISOString(),
  employee: {
    ...invoiceGalleryExample.employee,
    address:'Rue Mpila, Talangaï', city:'Brazzaville', phone:'+242 05 987 65 43', email:'contact@example.test',
    paymentMethod:'BANK_TRANSFER', bankName:'BGFIBank', bankAccountNumber:'CG39 3000 1000 1100 0123 4567',
  },
  company: { ...bulletinGalleryExample.company, industry:'Services financiers', email:'contact@example.test', website:'example.test' },
} as any;
