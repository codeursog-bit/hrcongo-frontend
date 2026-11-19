import { employees } from './employees';

export const demoSettingsUsers = employees.map((employee,index) => ({ id:index===0?'demo-user':`demo-settings-user-${index}`,firstName:employee.firstName,lastName:employee.lastName,email:employee.email,role:['ADMIN','HR_MANAGER','EMPLOYEE'][index],isActive:true,avatar:null,lastLoginAt:'2026-11-18T08:00:00Z',departmentId:employee.departmentId,canRecordAttendanceForAll:false }));
export const demoCircuits = {circuits:{LOAN:{isActive:false,steps:[]},ADVANCE:{isActive:false,steps:[]},ABSENCE:{isActive:false,steps:[]},LEAVE:{isActive:false,steps:[]}},catalog:[],holdersByCode:{},canEdit:true};

/** Read-only settings examples. No user invitation, security change or payment is simulated. */
export function demoSettings(url:URL,method:string,role:'ADMIN'|'EMPLOYEE'):Response|null {
  const p=url.pathname;
  const paths=['/users','/company-taxes','/echelon-suggestions','/approvals/functions','/approvals/circuits','/audit/logs','/audit/stats','/subscriptions/invoices'];
  const trusted=/^\/companies\/demo-company\/trusted-ips(?:\/(?:my-ip|learned))?$/.test(p);
  if(!paths.includes(p)&&!trusted)return null;
  const json=(data:unknown,status=200)=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json'}});
  if(role!=='ADMIN')return json({message:'Ces réglages de démonstration sont réservés à l’administration.'},403);
  if(method!=='GET')return json({message:'La modification des paramètres n’est pas simulée en démonstration.'},501);
  if(p==='/users')return json(demoSettingsUsers);
  if(p==='/company-taxes'||p==='/echelon-suggestions')return json([]);
  if(p==='/approvals/functions')return json({catalog:[],assignments:{}});
  if(p==='/approvals/circuits')return json(demoCircuits);
  if(p==='/audit/logs')return json({data:[],meta:{total:0,page:1,limit:20,totalPages:1}});
  if(p==='/audit/stats')return json({period:'7 jours',total7d:0,critical:0,byAction:[],byEntity:[]});
  if(p==='/subscriptions/invoices')return json({invoices:[]});
  if(p.endsWith('/my-ip'))return json({ip:null,usable:false,recognized:false});
  return json([]);
}
