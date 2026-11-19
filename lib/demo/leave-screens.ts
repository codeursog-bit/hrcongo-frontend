import { employees, departments } from './employees';
import { leaveBalance } from './leaves';
import type { createDemoStore } from './transport';

type Store=ReturnType<typeof createDemoStore>;
const json=(data:unknown,status=200)=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json'}});
/** Read-only presentation fixtures. No entitlement, holiday or payroll engine is simulated. */
export function demoLeaveScreen(url:URL,method:string,store:Store,role:'ADMIN'|'EMPLOYEE'):Response|null{
 const p=url.pathname,q=url.searchParams,year=Number(q.get('year')||2026),month=Number(q.get('month')||11);
 if(!p.startsWith('/leaves/')&&!p.startsWith('/absence-tracking/'))return null;
 if(method!=='GET')return null;
 if(p==='/leaves/me'||store.leaves.some(leave=>p===`/leaves/${leave.id}`))return null;
 const isPersonal=p.startsWith('/leaves/me/')||p.startsWith('/leaves/balance/')||p.startsWith('/leaves/carryover/');
 if(role!=='ADMIN'&&!isPersonal)return json({message:'Cette vue est réservée aux RH.'},403);
 const balances=store.employees.map(employee=>({...leaveBalance,employeeId:employee.id,employeeName:`${employee.firstName} ${employee.lastName}`,employee,departmentName:employee.department.name,position:employee.position,hireDate:employee.hireDate,year:2026,annualEntitled:26,carriedForward:0,seniorityDays:0,monthsWorked:12,monthsUntilEligible:0,canTakeAnnualLeave:true,cycleEndDate:'2026-11-12'}));
 const targetId=p.startsWith('/leaves/me/')?employees[0].id:p.split('/').at(-1),balance=balances.find(x=>x.employeeId===targetId);
 if(p==='/leaves/me/balance'||p.startsWith('/leaves/balance/')){
  if(!balance||(role!=='ADMIN'&&balance.employeeId!==employees[0].id))return json({message:'Employé inaccessible.'},404);
  return json(balance);
 }
 if(p==='/leaves/me/balance-explained')return json({employee:{...employees[0],seniority:{label:'2 ans'}},base:{acquired:26,max:26,perMonth:26/12,missing:0,daysUntilNextAccrual:null},seniority:{applies:false,days:0,currentBonus:0,next:null,conventionName:null},totals:{entitled:26,taken:8,remaining:18},anticipated:{days:0,leaves:[]},cycle:{canTakeLeave:true,eligibleDate:'2026-11-12',monthsUntilEligible:0,monthsElapsedFull:12,monthsWorked:12,startDate:'2025-11-12',endDate:'2026-11-12',progressPct:100},projection:{cycleEndDate:'2026-11-12',remainingAtCycleEnd:18},nextDeparture:{kind:'PROBABLE',reason:'AVAILABLE_NOW',startDate:'2026-11-16'}});
 if(p==='/leaves/balances')return json(balances);
 if(p.startsWith('/leaves/carryover/')){
  if(!balance||(role!=='ADMIN'&&targetId!==employees[0].id))return json({message:'Employé inaccessible.'},404);
  return json([]);
 }
 if(p==='/leaves/provision')return json({currency:'FCFA',totalProvision:828000,details:balances.map((b,i)=>({employeeId:b.employeeId,employeeName:b.employeeName,remainingDays:18,dailyRate:[12000,20000,14000][i],provision:[216000,360000,252000][i],alertLevel:'OK',yearsWithoutLeave:0,maxCumulYears:3}))});
 const all=store.leaves.filter(x=>new Date(x.startDate).getFullYear()===year).map(x=>({...x,kind:'LEAVE',employee:{...x.employee,seniorityAtDeparture:{label:'2 ans'}},employeeName:`${x.employee.firstName} ${x.employee.lastName}`,departmentId:x.employee.departmentId,departmentName:x.employee.department.name,requestedAt:x.createdAt,phase:x.status==='PENDING'?'PENDING':x.startDate>'2026-11-12'?'UPCOMING':x.endDate<'2026-11-12'?'COMPLETED':'IN_PROGRESS',isPaid:true,isTheoretical:false,isCarryover:false,forfeitedDays:0,processingDays:null}));
 const filtered=all.filter(x=>(!q.get('month')||new Date(x.startDate).getMonth()+1===month)&&(!q.get('type')||x.type===q.get('type'))&&(!q.get('status')||x.status===q.get('status'))&&(!q.get('departmentId')||x.departmentId===q.get('departmentId'))&&(!q.get('search')||x.employeeName.toLocaleLowerCase('fr').includes(q.get('search')!.toLocaleLowerCase('fr')))&&(!q.get('from')||x.startDate>=q.get('from')!)&&(!q.get('to')||x.startDate<=q.get('to')!));
 const approved=filtered.filter(x=>x.status==='APPROVED'),days=approved.reduce((sum,x)=>sum+x.daysCount,0);
 if(p==='/leaves/visual-overview')return json({year,today:'2026-11-12',leaves:all,totalHeadcount:3,departments:departments.map(d=>({...d,headcount:1}))});
 if(p==='/leaves/yearly-trend')return json(Array.from({length:12},(_,i)=>({month:i+1,count:all.filter(x=>x.status==='APPROVED'&&new Date(x.startDate).getMonth()===i).length,totalDays:all.filter(x=>x.status==='APPROVED'&&new Date(x.startDate).getMonth()===i).reduce((sum,x)=>sum+x.daysCount,0)})));
 if(p==='/leaves/planning')return json(approved);
 if(p==='/leaves/departure-program')return json({rows:approved});
 if(p==='/leaves/pending-remainders')return json({rows:[]});
 if(p==='/leaves/management-overview')return json({period:{month,year},kpis:{onLeaveToday:0,onAbsenceToday:0,absencePaidToday:0,absenceUnpaidToday:0,pendingRequests:filtered.filter(x=>x.status==='PENDING').length,daysApprovedThisPeriod:days},events:filtered,earlyReturns:[]});
 if(p==='/leaves/departure-history')return json({rows:approved,truncated:false,stats:{count:approved.length,totalDays:days,employees:new Set(approved.map(x=>x.employeeId)).size,uniqueEmployees:new Set(approved.map(x=>x.employeeId)).size,averageDays:approved.length?days/approved.length:0,inProgress:0,byType:days?[{type:'ANNUAL',totalDays:days}]:[],byDepartment:departments.map(d=>({name:d.name,totalDays:approved.filter(x=>x.departmentId===d.id).reduce((sum,x)=>sum+x.daysCount,0)}))}});
 if(p==='/leaves/requests-history')return json({rows:filtered,truncated:false,stats:{total:filtered.length,byStatus:{PENDING:filtered.filter(x=>x.status==='PENDING').length,APPROVED:approved.length,REJECTED:0,CANCELLED:0},averageProcessingDays:null,approvalRate:null}});
 if(p.startsWith('/leaves/employee-history/')||p.startsWith('/leaves/departure-history/employee/')){
  const employee=employees.find(x=>x.id===targetId);if(!employee)return json({message:'Employé inaccessible.'},404);
  const mine=all.filter(x=>x.employeeId===targetId),taken=mine.filter(x=>x.status==='APPROVED');
  return json({employee:{...employee,seniority:{label:'2 ans'}},balance:balances.find(x=>x.employeeId===targetId),history:mine,departures:taken,upcoming:[],totals:{departures:taken.length,totalDaysTaken:taken.reduce((sum,x)=>sum+x.daysCount,0),totalForfeited:0,lastAnnualDeparture:taken[0]?.startDate||null,nextDeparture:null}});
 }
 if(p.startsWith('/leaves/calculate-return-date')||p.startsWith('/leaves/planning-preview'))return json({message:'Le calcul des jours ouvrables et de la reprise nécessite le backend. En démo, saisissez directement les deux dates.'},501);
 // Analysis fixtures intentionally contain no invented medical events or recurrence alerts.
 if(p.startsWith('/absence-tracking/')&&q.get('scope')==='leave'){
  if(p.endsWith('/dashboard'))return json({employeeCount:3,absentToday:{ANNUAL:0},byType:days?[{code:'ANNUAL',label:'Congé annuel',colorKey:'emerald',days,trackable:false}]:[],byDepartment:departments.map(d=>({departmentId:d.id,name:d.name,days:approved.filter(x=>x.departmentId===d.id).reduce((sum,x)=>sum+x.daysCount,0),absenteeismRatePercent:0})),absenteeismRatePercent:0,workingDaysInMonth:24,alerts:{employeeAlerts:[],departmentAlerts:[]},leaderboards:{maladie:[],conventionnelle:[],exceptionnelle:[],injustifiee:[]},departmentLeaderboards:{maladie:[],conventionnelle:[],exceptionnelle:[],injustifiee:[]},top20Month:[]});
  if(p.endsWith('/grid'))return json({daysInMonth:new Date(year,month,0).getDate(),holidays:[],legend:[],employees:employees.map(e=>({id:e.id,name:`${e.firstName} ${e.lastName}`,departmentName:e.department.name,cells:{}}))});
  if(p.endsWith('/month-journal'))return json({summary:`${days} jours de congé annuel approuvés dans les exemples de cette période.`,journal:approved.map(x=>({...x,label:'Congé annuel',familyLabel:'Congés',paid:true,days:x.daysCount}))});
  if(p.endsWith('/yearly-overview'))return json({months:Array.from({length:12},(_,i)=>({month:i+1,totalDays:all.filter(x=>x.status==='APPROVED'&&new Date(x.startDate).getMonth()===i).reduce((sum,x)=>sum+x.daysCount,0)}))});
  if(p.endsWith('/compare'))return json({years:(q.get('years')||String(year)).split(',').map(y=>({year:Number(y),byFamily:Number(y)===2026?{Congés:24}:{},byDepartment:Number(y)===2026?{Administration:8,Finance:8,Commercial:8}:{},totalDays:Number(y)===2026?24:0,employeeCount:3,avgDaysPerEmployee:Number(y)===2026?8:0,trackableDays:0})),trend:[]});
 }
 return null;
}
