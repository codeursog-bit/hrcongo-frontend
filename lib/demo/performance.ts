import { employees } from './employees';
import type { Sheet } from '@/components/performance/sheet-types';
import type { CareerData, PlansData } from '@/components/performance/career-types';
import type { EmployeeCompetencies, TeamOverview } from '@/components/performance/competency-types';

const employee=employees[0];
export const demoPerformanceCycle={id:'demo-cycle',name:'Bilan T3 2026',type:'QUARTERLY',startDate:'2026-07-01',endDate:'2026-09-30',status:'CLOSED' as const,objectivesWeight:80,launchedAt:'2026-09-15',_count:{reviews:1},template:null};
export const demoPerformanceReview={id:'demo-review-laure',employeeId:employee.id,period:'T3 2026',reviewType:'QUARTERLY',cycleId:demoPerformanceCycle.id,date:'2026-10-02',status:'ACKNOWLEDGED' as const,rating:4,overallScore:4,scoreLabel:'Très bien',verdict:'Très bien',feedback:'Un suivi régulier des dossiers et une bonne coordination de l’équipe.',strengths:'Fiabilité et organisation',improvements:'Continuer à simplifier les procédures.',nextGoals:'',createdAt:'2026-09-15',submittedAt:'2026-10-02',acknowledgedAt:'2026-10-03',employee:{...employee},reviewer:{id:'demo-reviewer',firstName:'Responsable',lastName:'RH'}};
export const demoPerformanceGoal={id:'demo-goal',employeeId:employee.id,employee:{...employee},title:'Mettre à jour les dossiers administratifs',description:'Exemple de démonstration.',progress:100,status:'COMPLETED',startDate:'2026-07-01',endDate:'2026-09-30',weight:100,keyResults:[{id:'demo-kr',title:'Dossiers vérifiés',targetValue:100,currentValue:100,unit:'%'}],evaluatedInReview:{id:demoPerformanceReview.id,period:demoPerformanceReview.period,status:demoPerformanceReview.status}};
export const demoPerformanceSheet:Sheet={review:{...demoPerformanceReview,employee:{...employee,department:employee.department.name},cycle:demoPerformanceCycle,objectivesScore:4,competenciesScore:4,overallScore:4,employeeComment:'Merci pour ce retour.',employeeCommentAt:'2026-10-03'},goals:[{id:demoPerformanceGoal.id,title:demoPerformanceGoal.title,weight:100,score:4,progress:100,status:'COMPLETED',endDate:'2026-09-30'}],criteria:[{id:'demo-criterion',label:'Qualité du travail',weight:100,score:4,comment:'Travail fiable.'}],nextGoals:[],scoreLevels:{'1':'Insuffisant','2':'À améliorer','3':'Conforme','4':'Très bien','5':'Exceptionnel'},permissions:{isSelf:true,canEdit:false,canSubmit:false,canAcknowledge:false}};
export const demoPerformanceTeam:TeamOverview={employees:employees.map(e=>({...e,hasProfile:false,summary:null})),topNeeds:[],withoutProfile:employees.length};
export const demoPerformanceCompetencies:EmployeeCompetencies={employee:{...employee},profile:null,rows:[],summary:null,canAssess:false};
export const demoPerformanceCareer:CareerData={employee:{...employee,department:employee.department.name},items:[{id:'demo-career-hire',kind:'HIRE',date:employee.hireDate,title:'Arrivée dans l’entreprise',deletable:false}],canEdit:false,canPropose:false};
export const demoPerformancePlans:PlansData={employeeId:employee.id,canEdit:false,plans:[]};
export const demoPerformanceTemplates={custom:[],builtin:[{id:'builtin:general',name:'Grille générale',criteria:[{id:'demo-criterion',label:'Qualité du travail',weight:100}],objectives:[]}]};

/** Exemples figés, uniquement en mode démo : aucune notation ni décision simulée. */
export function demoPerformance(url:URL,method:string,role:'ADMIN'|'EMPLOYEE'):Response|null {
  const p=url.pathname;if(!p.startsWith('/performance/'))return null;
  const json=(value:unknown,status=200)=>new Response(JSON.stringify(value),{status,headers:{'Content-Type':'application/json'}});
  if(method!=='GET'||/export|print|pdf/.test(p))return json({message:'Les évaluations, décisions et exports ne sont pas simulés en démonstration.'},501);
  const ownPaths=['/performance/me','/performance/goals','/performance/reviews','/performance/competencies/me','/performance/career/me','/performance/development/me',`/performance/reviews/${demoPerformanceReview.id}/sheet`];
  if(role==='EMPLOYEE'&&!ownPaths.includes(p))return json({message:'Ce réglage de démonstration est réservé aux RH.'},403);
  if(p==='/performance/reviews')return json([demoPerformanceReview]);
  if(p==='/performance/goals')return json([demoPerformanceGoal]);
  if(p==='/performance/me')return json({employeeId:employee.id,reviews:[demoPerformanceReview],goals:[demoPerformanceGoal]});
  if(p===`/performance/reviews/${demoPerformanceReview.id}/sheet`)return json(demoPerformanceSheet);
  if(p==='/performance/stats')return json({total:1,drafts:0,submitted:0,acknowledged:1,avgScore:'4.0',avgScoreLabel:'Très bien',thisYearCount:1,topEmployees:[{employeeId:employee.id,avgScore:4,scoreLabel:'Très bien',employee:{...employee}}]});
  if(p==='/performance/cycles')return json([demoPerformanceCycle]);
  if(p===`/performance/cycles/${demoPerformanceCycle.id}`)return json({cycle:demoPerformanceCycle,progress:{total:1,draft:0,submitted:0,acknowledged:1},reviews:[demoPerformanceReview]});
  if(p==='/performance/templates')return json(demoPerformanceTemplates);
  if(p.startsWith('/performance/criteria/templates/'))return json(demoPerformanceTemplates.builtin[0].criteria);
  if(p==='/performance/competencies/team')return json(demoPerformanceTeam);
  if(p==='/performance/competencies')return json([]);
  if(p==='/performance/job-profiles')return json({profiles:[],uncoveredPositions:employees.map(e=>e.position)});
  if(p==='/performance/career/proposals')return json([]);
  if(p==='/performance/competencies/me'||p===`/performance/competencies/employee/${employee.id}`)return json(demoPerformanceCompetencies);
  if(p==='/performance/career/me'||p===`/performance/career/employee/${employee.id}`)return json(demoPerformanceCareer);
  if(p==='/performance/development/me'||p===`/performance/development/employee/${employee.id}`)return json(demoPerformancePlans);
  return json({message:'Exemple de performance introuvable.'},404);
}
