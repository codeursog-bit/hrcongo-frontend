import type { BonusTemplate } from '@/app/(dashboard)/parametres/primes/page';
import { company } from './employees';
import type { createDemoStore } from './transport';

/** Read-only presentation examples. Payroll calculations and mutations require the backend. */
export const demoBonusTemplates: BonusTemplate[] = [
  {id:'demo-bonus-transport',name:'Transport',description:'Exemple de prime mensuelle pour le parcours de démonstration.',defaultAmount:26000,defaultPercentage:null,baseCalculation:null,isRecurring:true,isTaxable:false,isCnss:false,fiscalType:'NON_TAXABLE',isActive:true},
  {id:'demo-bonus-performance',name:'Prime de performance',description:'Exemple à montant libre pour choisir les mois de versement.',defaultAmount:null,defaultPercentage:null,baseCalculation:null,isRecurring:false,isTaxable:true,isCnss:true,fiscalType:'TAXABLE_CNSS',isActive:true},
  {id:'demo-bonus-units',name:'Prime à quantité variable',description:'Exemple avec quantité mensuelle à renseigner avant la paie.',defaultAmount:null,defaultPercentage:null,baseCalculation:null,unitAmount:2000,defaultQuantity:0,quantityMode:'FREE',isRecurring:true,isTaxable:true,isCnss:false,fiscalType:'TAXABLE_NO_CNSS',isActive:true},
  {id:'demo-bonus-annual',name:'Prime annuelle',description:'Exemple pour visualiser un versement annuel.',defaultAmount:null,defaultPercentage:100,baseCalculation:'BASE_SALARY',isRecurring:false,isTaxable:true,isCnss:true,fiscalType:'TAXABLE_CNSS',isProratized:true,isActive:true},
];

export function demoBonusCatalog(url: URL, method: string, store: ReturnType<typeof createDemoStore>, role: 'ADMIN' | 'EMPLOYEE'): Response | null {
  if (!['/bonus-templates','/employee-bonuses'].includes(url.pathname)) return null;
  const json=(data:unknown,status=200)=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json'}});
  if(url.searchParams.has('companyId')&&url.searchParams.get('companyId')!==company.id)return json({message:'Entreprise inaccessible.'},404);
  if(role!=='ADMIN')return json({message:'Accès réservé aux RH.'},403);
  if(method!=='GET')return json({message:'L’attribution et les calculs de primes nécessitent le backend. Aucune prime n’a été créée en démonstration.'},501);
  if(url.pathname==='/bonus-templates')return json(demoBonusTemplates);
  const employeeId=url.searchParams.get('employeeId');
  if(!store.employees.some(employee=>employee.id===employeeId&&employee.companyId===company.id))return json({message:'Employé inaccessible.'},404);
  return json([]);
}
