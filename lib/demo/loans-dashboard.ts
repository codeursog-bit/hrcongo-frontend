import type { LdView } from '@/lib/loans-dashboard';
import type { createDemoStore } from './transport';
import { company } from './employees';

/** Demo-only projection of the in-memory fixture, never used by the real API. */
export function demoLoansDashboard(query: URLSearchParams, store: ReturnType<typeof createDemoStore>): LdView {
  const mode=query.get('mode')||'MOIS',year=Number(query.get('year')||2026),month=Number(query.get('month')||11);
  const start=mode==='PLAGE'?new Date(Number(query.get('fromYear')),Number(query.get('fromMonth'))-1,1):new Date(year,mode==='ANNEE'?0:month-1,1);
  const end=mode==='PLAGE'?new Date(Number(query.get('toYear')),Number(query.get('toMonth')),0):new Date(year,mode==='ANNEE'?12:month,0);
  end.setHours(23,59,59,999);
  const inside=(date:Date)=>date>=start&&date<=end;
  const requested=store.loans.filter(x=>inside(new Date(x.startDate))),askedAdvances=store.advances.filter(x=>inside(new Date(x.createdAt)));
  const granted=store.loans.filter(x=>['ACTIVE','PAID'].includes(x.status)&&inside(new Date(x.startDate))),approved=store.advances.filter(x=>['APPROVED','DEDUCTED','PAID'].includes(x.status)&&inside(new Date(x.year,x.month-1,1)));
  const stock=store.loans.filter(x=>x.status==='ACTIVE'),stockAdvances=store.advances.filter(x=>x.status==='APPROVED');
  const sum=(items:{amount:number}[])=>items.reduce((n,x)=>n+Number(x.amount),0);
  const grantedAmount=sum(granted)+sum(approved),outstandingLoans=stock.reduce((n,x)=>n+Number(x.remainingBalance),0),outstandingAdvances=sum(stockAdvances);
  const logs=store.loans.flatMap(x=>(x as typeof x & {repaymentLogs?:{amount:number;month:number;year:number}[]}).repaymentLogs||[]);
  const repaidInPeriod=sum(logs.filter(x=>inside(new Date(x.year,x.month-1,1)))),recoveredAmount=sum(logs.filter(x=>granted.some(g=>g.id===(x as {loanId?:string}).loanId)));
  const indebted=store.employees.filter(e=>stock.some(x=>x.employeeId===e.id)||stockAdvances.some(x=>x.employeeId===e.id));
  const groups=(items:{amount:number}[],label:(item:any)=>string)=>Array.from(new Set(items.map(label))).map(name=>({label:name,count:items.filter(x=>label(x)===name).length,amount:sum(items.filter(x=>label(x)===name))}));
  const statusGroups=(items:{amount:number;status:string}[],labels:Record<string,string>)=>Object.entries(labels).map(([status,label])=>({label,count:items.filter(x=>x.status===status).length,amount:sum(items.filter(x=>x.status===status))}));
  const evolution=[];
  for(let date=new Date(start);date<=end&&evolution.length<120;date.setMonth(date.getMonth()+1)){
    const m=date.getMonth()+1,y=date.getFullYear(),short=date.toLocaleDateString('fr-FR',{month:'short'}),label=date.toLocaleDateString('fr-FR',{month:'long',year:'numeric'});
    const l=granted.filter(x=>new Date(x.startDate).getMonth()+1===m&&new Date(x.startDate).getFullYear()===y),a=approved.filter(x=>x.month===m&&x.year===y);
    evolution.push({month:m,year:y,label,short,key:`${y}-${m}`,loansGrantedAmount:sum(l),advancesGrantedAmount:sum(a),repaidAmount:sum(logs.filter(x=>x.month===m&&x.year===y)),loansGranted:l.length,advancesGranted:a.length});
  }
  return {companyName:company.legalName,city:'Brazzaville',multi:false,companies:[{id:company.id,name:company.legalName}],warnings:['Données fictives ; les remboursements et exports officiels ne sont pas simulés.'],period:{mode,label:mode==='MOIS'?start.toLocaleDateString('fr-FR',{month:'long',year:'numeric'}):`${start.toLocaleDateString('fr-FR')} → ${end.toLocaleDateString('fr-FR')}`,months:evolution},
    totals:{loansRequested:requested.length,loansGranted:granted.length,loansGrantedAmount:sum(granted),loansPending:requested.filter(x=>['PENDING','PENDING_DG'].includes(x.status)).length,loansRejected:requested.filter(x=>x.status==='REJECTED').length,loanAcceptanceRate:granted.length?1:0,
      advancesRequested:askedAdvances.length,advancesGranted:approved.length,advancesGrantedAmount:sum(approved),advancesPending:askedAdvances.filter(x=>x.status==='PENDING').length,advancesRejected:askedAdvances.filter(x=>x.status==='REJECTED').length,advanceAcceptanceRate:approved.length?1:0,
      grantedAmount,borrowers:new Set([...granted,...approved].map(x=>x.employeeId)).size,avgGrantedAmount:granted.length+approved.length?grantedAmount/(granted.length+approved.length):0,recoveredAmount,recoveryRate:grantedAmount?recoveredAmount/grantedAmount:0,repaidInPeriod,repaidPayroll:repaidInPeriod,repaidCash:0,
      outstandingLoans,outstandingAdvances,outstandingTotal:outstandingLoans+outstandingAdvances,indebtedEmployees:indebted.length,loansInProgress:stock.length,advancesToRecover:stockAdvances.length},
    loansByStatus:statusGroups(requested,{PENDING:'En attente DRH',PENDING_DG:'En attente DG',ACTIVE:'En cours',PAID:'Soldé',REJECTED:'Refusé',CANCELLED:'Annulé'}),loansByNature:groups(granted,x=>({SOCIAL:'Social',SCOLARITE:'Scolarité',LOGEMENT:'Logement',EXCEPTIONNEL:'Exceptionnel',AUTRE:'Autre'}[x.nature as string]||'Non précisée')),loansByType:groups(granted,x=>({ARGENT:'Argent',MARCHANDISE:'Marchandise',AUTRE:'Autre'}[x.type as string]||'Autre')),advancesByStatus:statusGroups(askedAdvances,{PENDING:'En attente',APPROVED:'À récupérer',DEDUCTED:'Déduite',PAID:'Soldée',REJECTED:'Refusée',CANCELLED:'Annulée'}),repaymentsByMethod:repaidInPeriod?[{label:'Retenue sur paie',count:logs.filter(x=>inside(new Date(x.year,x.month-1,1))).length,amount:repaidInPeriod}]:[],
    departments:indebted.map(e=>({label:e.department.name,indebted:1,outstandingLoans:stock.filter(x=>x.employeeId===e.id).reduce((n,x)=>n+Number(x.remainingBalance),0),outstandingAdvances:sum(stockAdvances.filter(x=>x.employeeId===e.id)),outstandingTotal:stock.filter(x=>x.employeeId===e.id).reduce((n,x)=>n+Number(x.remainingBalance),0)+sum(stockAdvances.filter(x=>x.employeeId===e.id))})),
    topIndebted:indebted.map(e=>({id:e.id,fullName:`${e.firstName} ${e.lastName}`,department:e.department.name,companyName:company.legalName,value:stock.filter(x=>x.employeeId===e.id).reduce((n,x)=>n+Number(x.remainingBalance),0)+sum(stockAdvances.filter(x=>x.employeeId===e.id)),extra:stock.filter(x=>x.employeeId===e.id).reduce((n,x)=>n+Number(x.remainingBalance),0)})),evolution};
}
