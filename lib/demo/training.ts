import { company, employees, departments } from './employees';
import type { createDemoStore } from './transport';
export const trainingCourses=[
 {id:'demo-training-1',title:'Accueil et suivi des collaborateurs',description:'Préparer un dossier et accompagner les nouveaux collègues.',category:'Ressources humaines',durationHours:8,cost:150000,format:'IN_PERSON',providerType:'INTERNAL',providerName:'Équipe RH',location:'Brazzaville — salle de réunion',dateSchedule:'2026-11-20T08:00:00+01:00',status:'IN_PROGRESS'},
 {id:'demo-training-2',title:'Organiser le suivi client',description:'Partager une méthode de suivi avec l’équipe commerciale.',category:'Relation client',durationHours:4,cost:75000,format:'IN_PERSON',providerType:'INTERNAL',providerName:'Équipe commerciale',location:'Brazzaville',dateSchedule:'2026-11-24T09:00:00+01:00',status:'PLANNED'},
];
export const trainingRequests=[{id:'demo-training-request',status:'REQUESTED',reason:'Structurer le suivi des nouveaux clients.',createdAt:'2026-11-12T08:00:00+01:00',employee:employees[2],course:trainingCourses[1]}];
export function demoTraining(url:URL,method:string,body:Record<string,unknown>,store:ReturnType<typeof createDemoStore>,role:'ADMIN'|'EMPLOYEE'):Response|null {
 if(!url.pathname.startsWith('/training/'))return null;
 const json=(data:unknown,status=200)=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json'}});
 if(url.searchParams.has('companyId')&&url.searchParams.get('companyId')!==company.id)return json({message:'Entreprise inaccessible.'},404);
 const p=url.pathname;
 if(method==='GET'){
  if(p==='/training/courses')return json(trainingCourses);
  if(p==='/training/my')return json({assigned:[{id:'demo-session-assigned',status:'PLANNED',course:trainingCourses[1]}],inProgress:[{id:'demo-session-in-progress',status:'IN_PROGRESS',course:trainingCourses[0]}],completionRequested:[],completed:[],requested:store.trainingRequests.filter(r=>r.employee.id===employees[0].id)});
  if(role!=='ADMIN')return json({message:'Vue réservée aux RH.'},403);
  const deptBudgets=departments.map(d=>({departmentId:d.id,name:d.name,color:d.color,allocated:200000,consumed:0,remaining:200000,employeeCount:1,completedTrainings:0,inProgressTrainings:d.id==='demo-rh'?1:0,progressPct:0}));
  if(p==='/training/requests')return json(store.trainingRequests);
  if(p==='/training/dashboard')return json({totalCourses:2,activeTrainings:1,pendingRequests:store.trainingRequests.length,completionRate:0,certifiedEmployees:0,totalBudget:600000,consumed:0,deptBudgets});
  if(p==='/training/pfa')return json({year:2026,totalAllocated:600000,totalConsumed:0,totalRemaining:600000,globalProgress:0,totalTrainings:1,departments:deptBudgets});
 }
 if(p==='/training/requests'&&method==='POST'){
  const course=trainingCourses.find(c=>c.id===body.courseId);if(!course)return json({message:'Cours inaccessible.'},404);
  const request={id:`demo-training-${crypto.randomUUID()}`,status:'REQUESTED',reason:String(body.reason||''),createdAt:new Date().toISOString(),employee:store.employees[0],course};store.trainingRequests.push(request);return json(request,201);
 }
 // Budget updates, enrollments, decisions and certificates require the existing backend.
 return json({message:'Cette action de formation nécessite le backend ; aucun certificat officiel n’est simulé.'},501);
}
