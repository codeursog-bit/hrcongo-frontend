import type { createDemoStore } from './transport';
import { company } from './employees';
import { payrolls } from './payroll';
export function demoEmployeeManagement(url:URL,method:string,body:Record<string,unknown>,store:ReturnType<typeof createDemoStore>,role:'ADMIN'|'EMPLOYEE'):Response|null {
 const p=url.pathname,json=(data:unknown,status=200)=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json'}});
 if(!/^\/employees(?:\/|$)/.test(p)||p==='/employees/me'||p==='/employees/simple')return null;
 if(url.searchParams.has('companyId')&&url.searchParams.get('companyId')!==company.id)return json({message:'Entreprise inaccessible.'},404);
 const collection:Record<string,any>[]=store.employees;
 if(role!=='ADMIN')return json({message:'Gestion des employés réservée aux RH.'},403);
 const active=collection.filter(e=>e.companyId===company.id&&e.status==='ACTIVE');
 const filtered=active.filter(e=>{
  const q=(url.searchParams.get('search')||'').trim().toLocaleLowerCase('fr');
  return (!q||[e.firstName,e.lastName,e.position,e.employeeNumber,e.email].some(v=>String(v||'').toLocaleLowerCase('fr').includes(q)))&&(!url.searchParams.get('department')||url.searchParams.get('department')==='Tous'||url.searchParams.get('department')===e.department?.name)&&(!url.searchParams.get('contractType')||url.searchParams.get('contractType')==='Tous'||url.searchParams.get('contractType')===e.contractType)&&(!url.searchParams.get('nationality')||url.searchParams.get('nationality')==='Tous'||(url.searchParams.get('nationality')==='Non renseigné'?!e.nationality:url.searchParams.get('nationality')===e.nationality));
 });
 if(p==='/employees/summary'&&method==='GET'){
  const group=(key:(e:Record<string,any>)=>string)=>{const counts=new Map<string,number>();for(const e of filtered){const k=key(e);counts.set(k,(counts.get(k)||0)+1);}return Array.from(counts).map(([name,count])=>({name,count})).sort((a,b)=>b.count-a.count);};
  const labels:Record<string,string>={CDI:'CDI',CDD:'CDD',STAGE:'Stage',INTERIM:'Intérim',CONSULTANT:'Consultant',PRESTATAIRE:'Prestataire'};
  return json({total:filtered.length,totalEmployees:filtered.length,active:filtered.length,activeEmployees:filtered.length,inactive:0,totalSalary:filtered.reduce((s,e)=>s+Number(e.baseSalary||0),0),male:filtered.filter(e=>e.gender==='MALE').length,female:filtered.filter(e=>e.gender==='FEMALE').length,
   byDepartment:group(e=>e.department?.name||'Sans département'),byContractType:group(e=>e.contractType).map(g=>({type:g.name,label:labels[g.name]||g.name,count:g.count})),byGender:[{gender:'MALE',label:'Hommes',count:filtered.filter(e=>e.gender==='MALE').length},{gender:'FEMALE',label:'Femmes',count:filtered.filter(e=>e.gender==='FEMALE').length}],byCategory:[],byNationality:group(e=>e.nationality||'Non renseigné').map(g=>({label:g.name,count:g.count})),hasConvention:false,agePyramid:[],seniorityPyramid:[],
   registrationSummary:{cnss:{declared:filtered.filter(e=>e.cnssEmployeeDeclared===true).length,notDeclared:filtered.filter(e=>e.cnssEmployeeDeclared===false).length,unverified:filtered.filter(e=>e.cnssEmployeeDeclared==null).length,numberRecorded:filtered.filter(e=>e.cnssNumber?.trim()).length,numberMissing:filtered.filter(e=>!e.cnssNumber?.trim()).length,contributionEnabled:filtered.filter(e=>e.isSubjectToCnss).length,contributionDisabled:filtered.filter(e=>!e.isSubjectToCnss).length,contributionEnabledWithoutNumber:filtered.filter(e=>e.isSubjectToCnss&&!e.cnssNumber?.trim()).length},incomeTax:{withholdingEnabled:filtered.filter(e=>e.isSubjectToIrpp).length,withholdingDisabled:filtered.filter(e=>!e.isSubjectToIrpp).length}}});
 }
 if(p==='/employees'&&method==='GET'){const page=Math.max(1,Number(url.searchParams.get('page'))||1),limit=Math.max(1,Number(url.searchParams.get('limit'))||12);return json({data:filtered.slice((page-1)*limit,page*limit),total:filtered.length,page,limit,totalPages:Math.ceil(filtered.length/limit)});}
 if(p==='/employees'&&method==='POST'){
  if(body.companyId&&body.companyId!==company.id)return json({message:'Entreprise inaccessible.'},404);
  if(!body.firstName||!body.lastName||!body.email)return json({message:'Identité et email requis.'},400);
  if(collection.some(e=>e.email===body.email))return json({message:'Email déjà utilisé.'},409);
  const department=store.employees.find(e=>e.departmentId===body.departmentId)?.department;if(!department)return json({message:'Département inaccessible.'},404);
  const record={...store.employees[0],...body,id:`demo-employee-${crypto.randomUUID()}`,employeeNumber:body.employeeNumber||`DEMO-${collection.length+1}`,department,companyId:company.id,company,status:'ACTIVE',selfServiceEnabled:false};collection.push(record);return json(record,201);
 }
 const match=p.match(/^\/employees\/([^/]+)(?:\/(self-service|salary-estimate))?$/);if(!match)return null;
 const employee=collection.find(e=>e.id===match[1]&&e.companyId===company.id);if(!employee)return json({message:'Employé inaccessible.'},404);
 if(match[2]==='salary-estimate'){
  // Reuse frozen demo amounts, never reproduce the payroll engine in the browser.
  const fixture=payrolls.find(p=>p.employeeId===employee.id&&p.baseSalary===employee.baseSalary);
  if(method==='GET'&&fixture&&!url.searchParams.has('previewAmount'))return json({...fixture,gains:[],deductions:[],nonTaxableBonuses:0});
  return json({message:'Le calcul contractuel nécessite le backend.'},501);
 }
 if(method==='GET'&&!match[2])return json(employee);
 if(method==='PATCH'&&match[2]==='self-service'){employee.selfServiceEnabled=body.enabled===true;return json(employee);}
 if(method==='PATCH'&&!match[2]){
  if(Object.keys(body).length===1&&'cnssEmployeeDeclared'in body&&[true,false,null].includes(body.cnssEmployeeDeclared as boolean|null)){employee.cnssEmployeeDeclared=body.cnssEmployeeDeclared;return json(employee);}
  return json({message:'La modification du contrat et des réglages de paie nécessite le backend.'},501);
 }
 if(method==='DELETE'&&!match[2]){employee.status='TERMINATED';return json({success:true});}
 return null;
}
