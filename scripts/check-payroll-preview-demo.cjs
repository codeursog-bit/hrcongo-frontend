const fs=require('fs'),path=require('path'),Module=require('module'),ts=require('typescript'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),resolve=Module._resolveFilename;
Module._resolveFilename=function(name,parent,...args){return resolve.call(this,name.startsWith('@/')?path.join(root,name.slice(2)):name,parent,...args);};
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:1,target:9,esModuleInterop:true}}).outputText,f);
async function run(){
 const {demoResponse,createDemoStore}=require('../lib/demo/transport.ts');const store=createDemoStore();
 const get=(p,role='ADMIN',method='GET')=>demoResponse(new URL('http://demo.test'+p),method,{},store,role);
 const response=get('/payrolls/demo-payroll-0'),payroll=await response.json();assert.equal(response.status,200);assert.equal(payroll.employee.firstName,'Laure');assert.ok(payroll.company.tradeName);assert.equal(payroll.items.filter(i=>i.type!=='EMPLOYER_COST').length,3);assert.equal(payroll.grossSalary,380000);assert.equal(payroll.netSalary,340000);assert.equal(payroll.items.filter(i=>i.type==='DEDUCTION').reduce((a,i)=>a+i.amount,0),payroll.totalDeductions);
 for(const id of ['demo-payroll-0','demo-payroll-1','demo-payroll-2']){const p=await get('/payrolls/'+id).json();assert.equal(p.grossSalary+p.items.filter(i=>i.type==='EMPLOYER_COST').reduce((a,i)=>a+i.amount,0),p.totalEmployerCost);assert.ok(p.totalEmployerCost>p.grossSalary);}
 const contracts=get('/contracts/generation/employee/demo-patrick');assert.equal(contracts.status,200);assert.deepEqual(await contracts.json(),[]);assert.equal(get('/contracts/generation/employee/missing').status,404);assert.equal(get('/contracts/generation/employee/demo-patrick','EMPLOYEE').status,404);assert.equal(get('/contracts/generation/employee/demo-laure','EMPLOYEE').status,200);assert.equal(get('/contracts/generation/employee/demo-patrick','ADMIN','POST').status,501);
 assert.equal(get('/payrolls/demo-payroll-0','EMPLOYEE').status,200);assert.equal(get('/payrolls/demo-payroll-1','EMPLOYEE').status,404);assert.equal(get('/payrolls/demo-payroll-99').status,404);
 const config=await get('/companies/bulletin-template').json();assert.equal(config.config.templateId,'default');
 assert.equal(get('/payrolls/demo-payroll-0','ADMIN','PATCH').status,501);assert.equal(get('/payrolls/demo-payroll-0/pdf').status,501);assert.equal(get('/companies/bulletin-template','ADMIN','POST').status,501);
 console.log('Démo bulletin : détail et configuration lisibles, montants figés cohérents, isolation employé et refus des mutations/exports vérifiés.');
}
run().catch(e=>{console.error(e);process.exitCode=1;});
