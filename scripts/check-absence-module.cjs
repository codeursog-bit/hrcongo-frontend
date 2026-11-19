const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),Module=require('node:module'),ts=require('typescript');
const root=path.resolve(__dirname,'..'),dir='app/(dashboard)/presences/absences';
function walk(dir){return fs.readdirSync(path.join(root,dir),{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(dir+'/'+e.name):e.name==='page.tsx'?[dir+'/'+e.name]:[]);}
const files=walk(dir);
// Frozen baseline covers all routes before the review, independently of HEAD.
require('./check-presences-review.cjs');
const resolve=Module._resolveFilename,load=Module._load;Module._resolveFilename=function(name,parent,...args){return resolve.call(this,name.startsWith('@/')?path.join(root,name.slice(2)):name,parent,...args);};
for(const ext of ['.ts','.tsx'])require.extensions[ext]=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{fileName:f,compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText,f);require.extensions['.css']=()=>{};
const React=require('react'),{renderToStaticMarkup}=require('react-dom/server');let currentFile,names,index,overrides,formProps,payload;
Module._load=function(name,parent,...args){
 if(name==='react')return {...React,useLayoutEffect(){},...(parent?.filename===currentFile?{useEffect(){},useState(initial){const key=names[index++];return [key in overrides?overrides[key]:typeof initial==='function'?initial():initial,()=>{}];}}:{})};
 if(name==='next/navigation')return {useParams:()=>({}),useRouter:()=>({push(){},replace(){}}),usePathname:()=>'/presences/absences',useSearchParams:()=>new URLSearchParams()};
 if(name==='@/hooks/useBasePath')return {useBasePath:()=>({bp:p=>p})};
 if(name==='@/hooks/useDocSignatures')return {useDocSignatures:()=>[]};
 if(name==='@/hooks/useImageUpload')return {useImageUpload:()=>({uploadedUrl:'https://example.test/certificate.pdf',uploading:false,preview:null,handleFileSelect(){}})};
 if(name==='@/components/PresenceModuleSwitcher'||name==='@/components/AbsenceSubNav')return {__esModule:true,default:()=>null};
 if(name==='@/services/api'&&parent?.filename===currentFile)return {api:{get:async()=>[],post:async(url,body)=>{payload={url,body};return {};}}};
 if(name==='@/components/design-system/feedback'&&parent?.filename===currentFile){const actual=load.call(this,name,parent,...args);return {...actual,useToast:()=>()=>{}};}
 if(name==='@/components/requests'&&parent?.filename===currentFile){const actual=load.call(this,name,parent,...args);return {...actual,RequestForm:p=>{formProps=p;return React.createElement(actual.RequestForm,p);}};}
 return load.call(this,name,parent,...args);
};
const {createDemoStore,demoResponse}=require('../lib/demo/transport.ts'),store=createDemoStore();
function render(rel,extra={}){currentFile=path.join(root,dir,rel);names=[...fs.readFileSync(currentFile,'utf8').matchAll(/const \[([^,\]]+),[^\]]+\]\s*=\s*useState/g)].map(m=>m[1]);index=0;formProps=null;overrides={isLoading:false,allowed:true,userRole:'ADMIN',employee:store.employees[0],company:{...store.employees[0].company,documentTemplate:'DEFAULT'},requests:store.absences,reason:'Démarche familiale',startDate:'2026-11-16',returnDate:'2026-11-17',coverage:{workingDays:1,coveredDays:1,uncoveredDays:0},...extra};return renderToStaticMarkup(React.createElement(require(currentFile).default));}
for(const file of files){const rel=path.relative(path.join(root,dir),path.join(root,file));assert.doesNotThrow(()=>render(rel));assert.doesNotThrow(()=>render(rel,{requests:[]}));}
for(const uiStep of [0,1,2,3]){assert.ok(render('nouveau/page.tsx',{uiStep}).includes('Récapitulatif'));assert.equal(formProps.step,uiStep);assert.equal(formProps.onSubmit.name,'handleSubmit');}
assert.ok(render('nouveau/page.tsx',{isDone:true}).includes('Voir ma demande'));
assert.ok(render('nouveau/page.tsx',{error:'Serveur indisponible'}).includes('role="alert"'));
for(const item of store.absences){assert.doesNotThrow(()=>render('mon-espace/page.tsx',{selectedId:item.id}));assert.doesNotThrow(()=>render('page.tsx',{tab:'demandes',selectedId:item.id}));}
const response=(url,method='GET',body={},role='ADMIN')=>demoResponse(new URL('https://example.test'+url),method,body,store,role);
(async()=>{
 render('nouveau/page.tsx',{uiStep:3});await formProps.onSubmit();assert.equal(payload.url,'/absence-requests');assert.equal(payload.body.type,'CONVENTIONNELLE');assert.equal(payload.body.reason,'Démarche familiale');assert.equal(payload.body.attachmentUrl,'https://example.test/certificate.pdf');assert.equal(payload.body.returnDate,'2026-11-17');assert.equal(payload.body.employeeId,undefined);
 const standard={company:{...store.employees[0].company,documentTemplate:'STANDARD'},motifCatalog:[{key:'DEMO_FAMILY',label:'Familial',days:1}],selectedMotifKey:'DEMO_FAMILY'};
 render('nouveau/page.tsx',{...standard,uiStep:3});await formProps.onSubmit();assert.equal(payload.body.motifKey,'DEMO_FAMILY');assert.ok(!('reason'in payload.body));
 payload=undefined;render('nouveau/page.tsx',{...standard,userRole:'EMPLOYEE',ceilingBalance:{remaining:0},uiStep:3});assert.equal(formProps.submitDisabled,true);await formProps.onSubmit();assert.equal(payload,undefined,'Plafond employé bloquant');
 render('nouveau/page.tsx',{...standard,userRole:'ADMIN',ceilingBalance:{remaining:0},uiStep:3});assert.equal(formProps.submitDisabled,false);
 render('nouveau/page.tsx',{...standard,selectedMotifKey:'__AUTRE__',onBehalf:true,selectedEmployeeId:'demo-sandrine',employeesList:store.employees,paidChoice:false,uiStep:3});await formProps.onSubmit();assert.equal(payload.body.subType,'AUTRE');assert.equal(payload.body.isPaid,false);assert.equal(payload.body.employeeId,'demo-sandrine');
 payload=undefined;render('nouveau/page.tsx',{...standard,selectedMotifKey:'__AUTRE__',onBehalf:true,selectedEmployeeId:'demo-sandrine',paidChoice:null,uiStep:3});await formProps.onSubmit();assert.equal(payload,undefined,'Choix payé/non payé obligatoire pour Autre par RH');
 assert.equal(response('/absence-requests/ceiling-balance?employeeId=demo-sandrine','GET',{},'EMPLOYEE').status,404);
 const own=await response('/absence-requests/me','GET',{},'EMPLOYEE').json();assert.ok(own.every(x=>x.employeeId==='demo-laure'));
 assert.equal(response('/absence-tracking/dashboard','GET',{},'EMPLOYEE').status,403);
 assert.equal(response('/absence-requests/coverage-preview?startDate=2026-11-16&returnDate=2026-11-17').status,200);assert.equal(response('/absence-requests/coverage-preview?startDate=2026-11-16&returnDate=2026-11-20').status,501);
 const body={type:'EXCEPTIONNELLE',subType:'AUTRE',reason:'Démarche familiale',startDate:'2026-11-16',returnDate:'2026-11-17'};const created=await response('/absence-requests','POST',body,'EMPLOYEE').json();assert.equal(created.status,'PENDING');assert.equal(response('/absence-requests/'+created.id+'/cancel','PATCH',{},'EMPLOYEE').status,200);assert.equal(response('/absence-requests/'+created.id+'/status','PATCH',{status:'APPROVED'}).status,501);
 for(const endpoint of ['dashboard','yearly-overview','grid','month-journal','compare','employee/demo-laure'])assert.equal(response('/absence-tracking/'+endpoint+'?year=2026&month=11').status,200);
 console.log('Absences : 6 routes, API/calculs/droits/justificatifs/documents conservés ; 4 étapes, STANDARD/classique/Autre/plafond, payloads et démo vérifiés.');
})().catch(e=>{console.error(e);process.exitCode=1;});
