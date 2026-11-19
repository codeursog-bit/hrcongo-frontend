import type { WfView } from '@/lib/workforce';
import type { createDemoStore } from './transport';
import { company } from './employees';
/** A current fictional snapshot only. Historical and official exports are not simulated. */
export function demoWorkforce(url:URL,method:string,store:ReturnType<typeof createDemoStore>,role:'ADMIN'|'EMPLOYEE'):Response|null {
 if(url.pathname!=='/workforce-dashboard'||method!=='GET')return null;
 const json=(data:unknown,status=200)=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json'}}),q=url.searchParams;
 if(role!=='ADMIN')return json({message:'Accès réservé aux RH.'},403);
 if(q.has('companyId')&&q.get('companyId')!==company.id)return json({message:'Entreprise inaccessible.'},404);
 if(q.get('model')!=='ORCA'||q.get('mode')!=='MOIS'||q.get('month')!=='11'||q.get('year')!=='2026')return json({message:'Le tableau de bord fictif est disponible pour novembre 2026. Les autres périodes nécessitent le backend.'},501);
 const rows=store.employees.filter(e=>e.companyId===company.id&&e.status==='ACTIVE'),M=rows.filter(e=>e.gender==='MALE').length,F=rows.filter(e=>e.gender==='FEMALE').length,total=rows.length;
 const national=rows.filter(e=>e.nationality==='Congolaise'),natM=national.filter(e=>e.gender==='MALE').length,natF=national.filter(e=>e.gender==='FEMALE').length;
 const contract={PERMANENT:0,EXPATRIE:0,STAGIAIRE:0,PRESTATAIRE:0};
 for(const e of rows){const key=e.contractType==='STAGE'?'STAGIAIRE':['PRESTATAIRE','CONSULTANT','INTERIM'].includes(e.contractType)?'PRESTATAIRE':e.contractType==='CDD'&&e.nationality!=='Congolaise'?'EXPATRIE':'PERMANENT';contract[key]++;}
 const functions=Array.from(new Set(rows.map(e=>e.position))).map(label=>({label,count:rows.filter(e=>e.position===label).length}));
 const month={month:11,year:2026,label:'Novembre 2026',short:'Nov.'};
 const view:WfView={model:'ORCA',companyName:company.legalName,city:company.city,multi:false,companies:[],canSeeNet:false,warnings:['Démonstration : instantané des dossiers fictifs, sans historique.'],period:{mode:'MOIS',label:month.label,months:[month]},current:{month,total,gender:{M,F,O:total-M-F},contract,nationality:{nat:national.length,etr:total-national.length,natM,natF,etrM:M-natM,etrF:F-natF},functions,departments:[],csp:[],contractPowerman:[],cities:[],ageBuckets:[],hires:0,departures:0,indicators:{hasAttendance:false,absenceDays:0,theoreticalDays:0,absenceCount:0,absenteeismRate:0,avgAbsenceDuration:0,presenceRate:0,departuresYtd:0,avgHeadcountYtd:total,turnover:0}},evolution:[{...month,total,M,F,hires:0,departures:0}]};
 return json(view);
}
