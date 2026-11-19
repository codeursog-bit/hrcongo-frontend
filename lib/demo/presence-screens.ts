import { company } from './employees';
import type { createDemoStore } from './transport';
import type { AdView } from '@/lib/attendance-dashboard';

type Store = ReturnType<typeof createDemoStore>;
const json=(data:unknown,status=200)=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json'}});
const unavailable=()=>json({message:'Cette opération nécessite le backend ou une vraie tablette. Aucun pointage réel n’est enregistré en démonstration.'},501);
const shifts=[{id:'demo-shift-day',name:'Journée administrative',startHour:8,startMinute:0,endHour:16,endMinute:0,durationHours:8,crossesMidnight:false,isNightShift:false,nightPremiumRate:0,color:'#2FBF8F',isDefault:true,isActive:true},{id:'demo-shift-night',name:'Équipe de nuit',startHour:22,startMinute:0,endHour:6,endMinute:0,durationHours:8,crossesMidnight:true,isNightShift:true,nightPremiumRate:0,color:'#E8B23A',isDefault:false,isActive:true}];

/** Closed, read-only snapshot of 12–13 November. No payroll or device engine. */
export function demoPresenceScreens(url:URL,method:string,store:Store,role:'ADMIN'|'EMPLOYEE'):Response|null {
  const p=url.pathname,q=url.searchParams;
  if(p==='/payroll-settings'&&method==='GET')return q.has('companyId')&&q.get('companyId')!==company.id?json({message:'Entreprise inaccessible.'},404):json({officialStartHour:8,officialStartMinute:0,officialEndHour:16,workHoursPerDay:8,lateToleranceMinutes:0,workDays:[1,2,3,4,5],overtimeEnabled:false});
  const managed=p==='/attendance-dashboard'||p.startsWith('/attendance/')||p==='/attendance'||p.startsWith('/checkin-devices/')||p.startsWith('/device-sync/')||p.startsWith('/pointage-qr/')||p.startsWith('/admin/display-screens')||p.startsWith('/display/');
  if(!managed)return null;
  if(q.has('companyId')&&q.get('companyId')!==company.id)return json({message:'Entreprise inaccessible.'},404);
  const privateScreen=p==='/attendance-dashboard'||p==='/attendance/employees-for-manual'||p.startsWith('/attendance/shifts')||p.startsWith('/attendance/shift-assignments')||p.startsWith('/device-sync/')||p.startsWith('/checkin-devices/')||p.startsWith('/admin/display-screens')||p.startsWith('/pointage-qr/secret/');
  if(privateScreen&&role!=='ADMIN')return json({message:'Accès réservé aux RH.'},403);
  if(p==='/display/pairing/start'&&method==='POST')return json({pairingCode:'DEMO42',pollToken:'demo-pairing',expiresAt:Date.now()+600000});
  if(p==='/display/pairing/poll'&&method==='POST')return json({status:'PENDING'});
  if(method!=='GET')return unavailable();
  const active=store.employees.filter(e=>e.companyId===company.id&&e.status==='ACTIVE');
  const own=active.filter(e=>e.id==='demo-laure');
  const visible=role==='ADMIN'?active:own;
  const attendances=visible.filter(e=>e.id!=='demo-patrick').flatMap(employee=>[12,13].map(day=>({id:`demo-presence-${employee.id}-${day}`,employeeId:employee.id,employee,date:`2026-11-${day}`,status:'PRESENT',checkIn:`2026-11-${day}T08:00:00+01:00`,checkOut:day===12?'2026-11-12T16:00:00+01:00':null,totalHours:day===12?8:0,normalHours:day===12?8:0,overtime10:0,overtime25:0,overtime50:0,overtime100:0,extraHoursInfo:0,breakMinutes:0,checkInMethod:'MANUAL',checkOutMethod:day===12?'MANUAL':null,checkInSiteName:'Brazzaville',isRemote:false})));
  const snapshotMonth=(!q.has('month')||Number(q.get('month'))===11)&&(!q.has('year')||Number(q.get('year'))===2026);
  const monthResult=()=>({employees:visible,attendances,dayStatuses:visible.map(employee=>Array.from({length:30},(_,i)=>{
    const day=i+1,date=`2026-11-${String(day).padStart(2,'0')}`,record=attendances.find(a=>a.employeeId===employee.id&&a.date===date);
    return record?{...record,date}: {date,status:day===12||day===13?'ABSENT_UNPAID':'FUTURE',checkIn:null,checkOut:null,totalHours:0,overtime10:0,overtime25:0,overtime50:0,overtime100:0};
  }))});
  if(p==='/attendance/today')return json(store.attendance.filter(a=>role==='ADMIN'||a.employeeId==='demo-laure'));
  if(p==='/attendance/my-today')return json(attendances.filter(a=>a.employeeId==='demo-laure'&&a.date==='2026-11-13'));
  if(p==='/attendance')return snapshotMonth?json(monthResult()):json({message:'Le jeu fictif couvre novembre 2026. Choisissez cette période.'},501);
  const employeeMatch=p.match(/^\/attendance\/employee\/([^/]+)$/);
  if(employeeMatch){if(!visible.some(e=>e.id===employeeMatch[1]))return json({message:'Employé inaccessible.'},404);return snapshotMonth?json(attendances.filter(a=>a.employeeId===employeeMatch[1])):json([]);}
  if(p==='/attendance/report'){
    if(!snapshotMonth)return json({message:'Le résumé fictif couvre novembre 2026.'},501);
    return json(visible.map(e=>({id:e.id,employeeId:e.id,name:`${e.firstName} ${e.lastName}`,matricule:e.employeeNumber,avatar:e.photoUrl,department:e.department.name,daysPresent:e.id==='demo-patrick'?0:2,daysWorked:e.id==='demo-patrick'?0:2,daysWorkedOnRest:0,daysWorkedDuringLeave:0,daysLate:0,daysRemote:0,daysOnLeave:0,daysHoliday:0,daysOffDay:0,daysAbsentUnpaid:e.id==='demo-patrick'?2:0,daysAbsentPaid:0,normalHours:e.id==='demo-patrick'?0:8,overtime10:0,overtime25:0,overtime50:0,overtime100:0,extraHoursInfo:0,overtimeEnabled:false,totalHours:e.id==='demo-patrick'?0:8,status:e.id==='demo-patrick'?'critical':'perfect',trend:'stable',details:[12,13].map(day=>({date:`2026-11-${day}`,status:e.id==='demo-patrick'?'ABSENT_UNPAID':'PRESENT',in:e.id==='demo-patrick'?'—':'08:00',out:e.id!=='demo-patrick'&&day===12?'16:00':'—',total:e.id!=='demo-patrick'&&day===12?'8h':'0h',type:e.id==='demo-patrick'?'ABSENT_UNPAID':'PRESENT'}))})));
  }
  if(p==='/attendance/employees-for-manual')return json(active);
  if(p==='/attendance/shifts')return json(shifts);
  if(p==='/attendance/logs')return json({logs:[]});
  if(p==='/attendance/overtime-pending')return json([]);
  if(p==='/attendance/shift-assignments')return json(active.map(e=>({id:`demo-assignment-${e.id}`,employeeId:e.id,employee:e,shiftId:shifts[0].id,shift:shifts[0],dayOfWeek:5,validFrom:'2026-11-01',validUntil:null})));
  if(p==='/pointage-qr/config')return json({enabled:true,defaultMode:'SCAN'});
  if(p==='/pointage-qr/secret/list')return json([]);
  if(/^\/pointage-qr\/secret\/employee\//.test(p))return active.some(e=>p.endsWith('/'+e.id))?json({hasSecret:false,updatedAt:null}):json({message:'Employé inaccessible.'},404);
  if(p==='/admin/display-screens')return json([{id:'demo-screen',name:'Accueil Brazzaville',status:'APPROVED',scope:'COMPANY',companyLabel:company.legalName,lastSeenAt:'2026-11-13T08:00:00+01:00',approvedAt:'2026-11-12T08:00:00+01:00'}]);
  if(p==='/checkin-devices/devices')return json([{id:'demo-tablet',name:'Accueil Brazzaville',isActive:true,createdAt:'2026-11-12T08:00:00+01:00',lastSeenAt:'2026-11-13T08:00:00+01:00',companyId:company.id}]);
  if(p==='/checkin-devices/credentials')return json([]);
  if(p==='/device-sync/connectors')return json([{id:'demo-connector',name:'Pointeuse accueil — exemple hors ligne',kind:'ZKTECO_NETWORK',isActive:true,autoSyncEnabled:false,online:false,lastSeenAt:null,lastAgentVersion:null,lastSyncAt:null,lastPunchAt:null,agentKeyHint:'DEMO',issues:{incomplete:0,conflict:0,unmapped:0},lastJob:null}]);
  if(p==='/device-sync/issues')return q.get('connectorId')==='demo-connector'?json({incomplete:[],conflicts:[],unmapped:[]}):json({message:'Pointeuse inaccessible.'},404);
  if(p==='/device-sync/connectors/demo-connector/mappings')return json({items:[],employees:active});
  if(p==='/device-sync/connectors/demo-connector/jobs')return json([]);
  if(p==='/attendance-dashboard'){
    if(!snapshotMonth||(q.has('mode')&&q.get('mode')!=='MOIS'))return json({message:'Le dashboard fictif couvre novembre 2026 uniquement.'},501);
    const present=active.filter(e=>e.id!=='demo-patrick').length*2,absent=active.some(e=>e.id==='demo-patrick')?2:0,total=present+absent;
    const view:AdView={companyName:company.legalName,city:company.city,multi:false,companies:[],warnings:['Instantané fictif des 12 et 13 novembre uniquement ; les autres journées ne sont pas renseignées. Aucun calcul de paie.'],period:{mode:'MOIS',label:'Novembre 2026',months:[{month:11,year:2026,label:'Novembre 2026',short:'Nov.'}]},headcount:active.length,totals:{present,remote:0,late:0,leave:0,absPaid:0,absUnpaid:absent,holiday:0,offDay:0,workedDays:present,absenceDays:absent,absJustified:0,absUnjustified:absent,theoreticalDays:total,absentEmployees:absent?1:0,presenceRate:total?present/total:0,absenteeismRate:total?absent/total:0,lateRate:0,remoteRate:0,avgAbsenceDuration:absent,leaveRate:0,leaveEmployees:0},absences:{total:2,approved:1,pending:1,rejected:0,cancelled:0,approvedDays:1,paidDays:0,unpaidDays:1,byType:[{label:'Exceptionnelle',count:1},{label:'Conventionnelle',count:1}],bySubType:[{label:'Maladie',count:1},{label:'Autre',count:1}],byStatus:[{label:'Approuvée',count:1},{label:'En attente',count:1}]},permissions:{total:3,approved:2,pending:1,rejected:0,cancelled:0,totalHours:4,avgHours:2,lateReturns:0,notReturned:0,byType:[{label:'Mission',count:1},{label:'Urgence',count:1},{label:'Autre',count:1}],byMission:[{label:'Prospection client',count:1}],byStatus:[{label:'Approuvée',count:2},{label:'En attente',count:1}]},leaves:{total:0,approved:0,pending:0,rejected:0,cancelled:0,approvedDays:0,byType:[],byStatus:[]},departments:active.map(e=>({label:e.department.name,headcount:1,workedDays:e.id==='demo-patrick'?0:2,absenceDays:e.id==='demo-patrick'?2:0,lateDays:0,presenceRate:e.id==='demo-patrick'?0:1,absenteeismRate:e.id==='demo-patrick'?1:0})),topAbsent:active.filter(e=>e.id==='demo-patrick').map(e=>({id:e.id,fullName:`${e.firstName} ${e.lastName}`,department:e.department.name,companyName:company.legalName,value:2,extra:1})),topLate:[],absenceBreakdown:{total:absent,justified:0,unjustified:absent,justifiedEmployees:0,unjustifiedEmployees:absent?1:0,motifs:[]},topPermissions:[],topLeave:[],evolution:[{month:11,year:2026,label:'Novembre 2026',short:'Nov.',key:'2026-11',hasAttendance:true,workedDays:present,absenceDays:absent,lateDays:0,presenceRate:total?present/total:0,absenteeismRate:total?absent/total:0,absenceRequests:2,permissions:3,leaveDays:0,leaveRequests:0}]};
    const leaves=store.leaves.filter(l=>l.startDate.startsWith('2026-11')&&active.some(e=>e.id===l.employeeId));
    view.leaves={total:leaves.length,approved:leaves.filter(l=>l.status==='APPROVED').length,pending:leaves.filter(l=>l.status==='PENDING').length,rejected:leaves.filter(l=>l.status==='REJECTED').length,cancelled:leaves.filter(l=>l.status==='CANCELLED').length,approvedDays:0,byType:leaves.length?[{label:'Congé annuel',count:leaves.length}]:[],byStatus:leaves.length?[{label:'En attente',count:leaves.filter(l=>l.status==='PENDING').length}]:[]};
    view.evolution[0].leaveRequests=leaves.length;
    return json(view);
  }
  return unavailable();
}
