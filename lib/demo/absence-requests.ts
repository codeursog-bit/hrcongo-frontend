import type {createDemoStore} from './transport';
import {employees,company,departments} from './employees';
type Store=ReturnType<typeof createDemoStore>;
const json=(data:unknown,status=200)=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json'}});
/** The single supported date window is a fixed illustration, never a replacement for the statutory engine. */
export function demoAbsenceRequests(url:URL,method:string,body:Record<string,unknown>,store:Store,role:'ADMIN'|'EMPLOYEE'):Response|null{
 const p=url.pathname,q=url.searchParams,own=employees[0].id,year=Number(q.get('year')||2026),month=Number(q.get('month')||11);
 const collection:Record<string,any>[]=store.absences,visible=collection.filter(x=>store.employees.some(e=>e.id===x.employeeId&&e.companyId===company.id)&&(role==='ADMIN'||x.employeeId===own));
 if(p==='/absence-requests'||p.startsWith('/absence-requests/')){
  if(method==='GET'&&(p==='/absence-requests'||p==='/absence-requests/me'))return json(p.endsWith('/me')?visible.filter(x=>x.employeeId===own):visible);
  if(method==='GET'&&p==='/absence-requests/motifs')return json([{key:'DEMO_FAMILY',label:'Événement familial (exemple fictif)',days:1}]);
  if(method==='GET'&&p==='/absence-requests/ceiling-balance'){
   const employeeId=q.get('employeeId')||own;if(!store.employees.some(e=>e.id===employeeId&&e.companyId===company.id)||(role!=='ADMIN'&&employeeId!==own))return json({message:'Employé inaccessible.'},404);
   return json({employeeId,year,ceiling:null,used:0,remaining:null,exceeded:false,viewerExempt:role==='ADMIN'});
  }
  if(method==='GET'&&(p==='/absence-requests/coverage-preview'||p==='/absence-requests/calculate-return-date')){
   if(q.get('startDate')!=='2026-11-16'||(p.endsWith('coverage-preview')?q.get('returnDate')!=='2026-11-17':q.get('days')!=='1'))return json({message:'Exemple démo : départ le 16/11/2026 et reprise le 17/11/2026. Les autres calculs réglementaires nécessitent le backend.'},501);
   if(q.get('employeeId')&&role!=='ADMIN'&&q.get('employeeId')!==own)return json({message:'Employé inaccessible.'},404);
   return json({startDate:'2026-11-16',startAdjusted:false,returnDate:'2026-11-17',workingDays:1,coveredDays:1,uncoveredDays:0,entitledDays:null,lastCoveredDate:'2026-11-16',excludedHolidays:[],sundaysSkipped:0});
  }
  if(method==='POST'&&p==='/absence-requests'){
   if(body.employeeId&&role!=='ADMIN')return json({message:'Création pour autrui réservée aux RH.'},403);
   const employee=store.employees.find(e=>e.id===(body.employeeId||own)&&e.companyId===company.id);if(!employee)return json({message:'Employé inaccessible.'},404);
   if(body.startDate!=='2026-11-16'||body.returnDate!=='2026-11-17')return json({message:'Seule la période fictive du 16 au 17 novembre 2026 est simulée.'},501);
   if(!body.motifKey&&(typeof body.reason!=='string'||body.reason.trim().length<3))return json({message:'Motif obligatoire.'},400);
   if(body.motifKey&&body.motifKey!=='DEMO_FAMILY')return json({message:'Motif hors démonstration.'},501);
   const record={...body,id:`demo-absence-${crypto.randomUUID()}`,employeeId:employee.id,employee,type:body.type||'EXCEPTIONNELLE',subType:body.subType||'AUTRE',reason:body.reason||'Événement familial (exemple fictif)',status:'PENDING',startDate:'2026-11-16',endDate:'2026-11-16',returnDate:'2026-11-17',workingDays:1,daysCount:1,printAuthorized:false,createdAt:new Date().toISOString()};collection.push(record);return json(record,201);
  }
  const match=p.match(/^\/absence-requests\/([^/]+)(?:\/(cancel|status))?$/);if(!match)return null;const item=visible.find(x=>x.id===match[1]);if(!item)return json({message:'Demande inaccessible.'},404);
  if(method==='GET'&&!match[2])return json(item);
  if(method==='PATCH'&&match[2]==='cancel'){
   if(item.employeeId!==own||item.status!=='PENDING')return json({message:'Seule votre demande en attente peut être annulée.'},400);item.status='CANCELLED';return json(item);
  }
  // Decisions alter entitlement and pay treatment: do not imitate that backend behavior.
  return json({message:'Cette décision ou modification métier nécessite le backend.'},501);
 }
 if(!p.startsWith('/absence-tracking/')||q.get('scope')==='leave')return null;
 if(role!=='ADMIN')return json({message:'Suivi réservé aux RH.'},403);
 const approved=collection.filter(x=>x.status==='APPROVED'&&String(x.startDate).startsWith(`${year}-${String(month).padStart(2,'0')}`)),days=approved.reduce((n,x)=>n+Number(x.workingDays),0);
 const months=Array.from({length:12},(_,i)=>({month:i+1,totalDays:collection.filter(x=>x.status==='APPROVED'&&String(x.startDate).startsWith(`${year}-${String(i+1).padStart(2,'0')}`)).reduce((n,x)=>n+Number(x.workingDays),0)}));
 if(p.endsWith('/dashboard'))return json({employeeCount:3,absentToday:{EXCEPTIONNELLE:0},byType:days?[{code:'AUTRE',label:'Autre absence',colorKey:'neutral',family:'EXCEPTIONNELLE',days,trackable:true}]:[],byDepartment:departments.map(d=>({departmentId:d.id,name:d.name,days:approved.filter(x=>x.employee.departmentId===d.id).reduce((n,x)=>n+Number(x.workingDays),0),byFamily:[],absenteeismRatePercent:0})),absenteeismRatePercent:0,workingDaysInMonth:24,alerts:{employeeAlerts:[],departmentAlerts:[]},leaderboards:{maladie:[],conventionnelle:[],exceptionnelle:[],injustifiee:[]},departmentLeaderboards:{maladie:[],conventionnelle:[],exceptionnelle:[],injustifiee:[]},top20Month:approved.map(x=>({id:x.employeeId,name:`${x.employee.firstName} ${x.employee.lastName}`,departmentName:x.employee.department.name,days:x.workingDays}))});
 if(p.endsWith('/yearly-overview'))return json({months});
 if(p.endsWith('/grid'))return json({daysInMonth:new Date(year,month,0).getDate(),holidays:[],legend:[],employees:employees.map(e=>({id:e.id,name:`${e.firstName} ${e.lastName}`,departmentName:e.department.name,cells:{}}))});
 if(p.endsWith('/month-journal'))return json({summary:`${days} jour(s) dans les exemples d’absence approuvée.`,journal:approved.map(x=>({...x,employeeName:`${x.employee.firstName} ${x.employee.lastName}`,departmentName:x.employee.department.name,label:'Autre absence',familyLabel:'Exceptionnelle',paid:x.isPaid,days:x.workingDays}))});
 if(p.endsWith('/compare'))return json({years:(q.get('years')||String(year)).split(',').map(y=>({year:Number(y),totalDays:Number(y)===2026?1:0,employeeCount:3,avgDaysPerEmployee:Number(y)===2026?1/3:0,trackableDays:Number(y)===2026?1:0,byFamily:Number(y)===2026?{Exceptionnelle:1}:{},byDepartment:Number(y)===2026?{Administration:1}:{}})),trend:[]});
 if(p.includes('/employee/')){const employee=employees.find(e=>e.id===p.split('/').at(-1));if(!employee)return json({message:'Employé inaccessible.'},404);return json({employee:{id:employee.id,name:`${employee.firstName} ${employee.lastName}`,departmentName:employee.department.name},recurrence:{alertSickRecurrence:false,alertSickDays:false,alertTrackableDays:false},pieByType:[],yearOverview:months,journal:[]});}
 return null;
}
