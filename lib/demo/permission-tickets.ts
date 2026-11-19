import type {createDemoStore} from './transport';
import {company,employees,demoUser} from './employees';
type Store=ReturnType<typeof createDemoStore>;
const json=(data:unknown,status=200)=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json'}});
/** Demo-only state transitions; administrative returns and time corrections stay unsupported. */
export function demoPermissionTickets(url:URL,method:string,body:Record<string,unknown>,store:Store,role:'ADMIN'|'EMPLOYEE'):Response|null{
 const p=url.pathname;if(p!=='/permission-tickets'&&!p.startsWith('/permission-tickets/'))return null;
 const own=employees[0].id,collection:Record<string,any>[]=store.permissions;
 const visible=collection.filter(t=>store.employees.some(e=>e.id===t.employeeId&&e.companyId===company.id)&&(role==='ADMIN'||t.employeeId===own));
 if(method==='GET'&&(p==='/permission-tickets'||p==='/permission-tickets/me'))return json(p.endsWith('/me')?visible.filter(t=>t.employeeId===own):visible);
 if(method==='POST'&&p==='/permission-tickets'){
  if(body.employeeId&&role!=='ADMIN')return json({message:'La création pour autrui est réservée aux RH.'},403);
  const employee=store.employees.find(e=>e.id===(body.employeeId||own)&&e.companyId===company.id);
  if(!employee)return json({message:'Employé inaccessible.'},404);
  if(!['URGENCE','MISSION','AUTRE'].includes(String(body.type))||typeof body.reason!=='string'||body.reason.trim().length<3||!Number.isFinite(Date.parse(String(body.departureTime)))||!Number.isFinite(Date.parse(String(body.expectedReturnTime)))||new Date(String(body.expectedReturnTime))<=new Date(String(body.departureTime)))return json({message:'Vérifiez le motif et les horaires.'},400);
  const record={...body,id:`demo-ticket-${crypto.randomUUID()}`,employeeId:employee.id,employee,status:role==='ADMIN'?'APPROVED':'PENDING',returnStatus:'NOT_RETURNED',createdAt:new Date().toISOString()};collection.push(record);return json(record,201);
 }
 const match=p.match(/^\/permission-tickets\/([^/]+)(?:\/(events|status|cancel|return|times))?$/);if(!match)return json({message:'Action non simulée.'},501);
 const item=visible.find(t=>t.id===match[1]);if(!item)return json({message:'Ticket inaccessible.'},404);const action=match[2];
 if(method==='GET'&&action==='events')return json([
  {id:`${item.id}-created`,type:'CREATED',createdAt:item.createdAt,actorRole:'EMPLOYEE',actor:item.employee},
  ...(item.reviewedAt?[{id:`${item.id}-reviewed`,type:item.status==='REJECTED'?'REJECTED':'APPROVED',createdAt:item.reviewedAt,actorRole:'ADMIN',actor:demoUser('ADMIN')}]:[]),
  ...(item.returnDeclaredAt?[{id:`${item.id}-declared`,type:'RETURN_DECLARED',createdAt:item.returnDeclaredAt,actorRole:'EMPLOYEE',actor:item.employee,data:{declaredAt:item.returnDeclaredAt}}]:[]),
  ...(item.returnConfirmedAt?[{id:`${item.id}-confirmed`,type:'RETURN_CONFIRMED',createdAt:item.returnConfirmedAt,actorRole:'ADMIN',actor:demoUser('ADMIN'),data:{departureTime:item.departureTime,returnTime:item.actualReturnTime}}]:[]),
 ]);
 if(method==='GET'&&!action)return json(item);
 if(method==='PATCH'&&action==='status'){
  if(role!=='ADMIN')return json({message:'Décision réservée aux RH.'},403);
  if(item.status!=='PENDING'||!['APPROVED','REJECTED'].includes(String(body.status)))return json({message:'Décision impossible.'},400);
  if(body.status==='REJECTED'&&(typeof body.rejectionReason!=='string'||!body.rejectionReason.trim()))return json({message:'Le motif du refus est obligatoire.'},400);
  Object.assign(item,{status:body.status,rejectionReason:body.rejectionReason,reviewedAt:new Date().toISOString()});return json(item);
 }
 if(method==='PATCH'&&action==='cancel'){
  if(item.employeeId!==own||item.status!=='PENDING')return json({message:'Seule votre demande en attente peut être annulée.'},400);
  item.status='CANCELLED';return json(item);
 }
 return json({message:'Cette action de retour, correction ou suppression nécessite le backend et reste indisponible en démo.'},501);
}
