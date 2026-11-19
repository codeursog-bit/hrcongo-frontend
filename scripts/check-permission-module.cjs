const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),Module=require('node:module'),ts=require('typescript');
const root=path.resolve(__dirname,'..'),dir='app/(dashboard)/presences/permissions';
function walk(dir){return fs.readdirSync(path.join(root,dir),{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(dir+'/'+e.name):e.name==='page.tsx'?[dir+'/'+e.name]:[]);}
const files=walk(dir);
// Frozen baseline covers all routes before the review, independently of HEAD.
require('./check-presences-review.cjs');
const resolve=Module._resolveFilename,load=Module._load;Module._resolveFilename=function(name,parent,...args){return resolve.call(this,name.startsWith('@/')?path.join(root,name.slice(2)):name,parent,...args);};
for(const ext of ['.ts','.tsx'])require.extensions[ext]=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{fileName:f,compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText,f);require.extensions['.css']=()=>{};
const React=require('react'),{renderToStaticMarkup}=require('react-dom/server');let currentFile,names,index,overrides,formProps,payload;
Module._load=function(name,parent,...args){
 if(name==='react')return {...React,useLayoutEffect(){},...(parent?.filename===currentFile?{useEffect(){},useState(initial){const key=names[index++];return [key in overrides?overrides[key]:typeof initial==='function'?initial():initial,()=>{}];}}:{})};
 if(name==='next/navigation')return {useParams:()=>({employeeId:'demo-laure'}),useRouter:()=>({push(){},replace(){}}),usePathname:()=>'/presences/permissions',useSearchParams:()=>new URLSearchParams()};
 if(name==='@/hooks/useBasePath')return {useBasePath:()=>({bp:p=>p})};
 if(name==='@/components/PresenceModuleSwitcher'||name==='@/components/PermissionsSubNav')return {__esModule:true,default:()=>null};
 if(name==='@/services/api'&&parent?.filename===currentFile)return {api:{get:async()=>[],post:async(url,body)=>{payload={url,body};return {};}}};
 if(name==='@/components/design-system/feedback'&&parent?.filename===currentFile){const actual=load.call(this,name,parent,...args);return {...actual,useToast:()=>()=>{}};}
 if(name==='@/components/requests'&&parent?.filename===currentFile){const actual=load.call(this,name,parent,...args);return {...actual,RequestForm:p=>{formProps=p;return React.createElement(actual.RequestForm,p);}};}
 return load.call(this,name,parent,...args);
};
const {createDemoStore,demoResponse}=require('../lib/demo/transport.ts'),store=createDemoStore();
function render(rel,extra={}){currentFile=path.join(root,dir,rel);names=[...fs.readFileSync(currentFile,'utf8').matchAll(/const \[([^,\]]+),[^\]]+\]\s*=\s*useState/g)].map(m=>m[1]);index=0;formProps=null;overrides={isLoading:false,userRole:'ADMIN',employee:store.employees[0],company:store.employees[0].company,tickets:store.permissions,reason:'Visite client',departureTime:'2026-11-13T10:00',expectedReturnTime:'2026-11-13T12:00',...extra};return renderToStaticMarkup(React.createElement(require(currentFile).default));}
for(const file of files){const rel=path.relative(path.join(root,dir),path.join(root,file));assert.doesNotThrow(()=>render(rel));assert.doesNotThrow(()=>render(rel,{tickets:[]}));}
for(const uiStep of [0,1,2,3]){assert.ok(render('nouveau/page.tsx',{uiStep}).includes('Récapitulatif'));assert.equal(formProps.step,uiStep);assert.equal(formProps.onSubmit.name,'handleSubmit');}
assert.ok(render('nouveau/page.tsx',{isDone:true}).includes('Voir ma demande'));
assert.ok(render('nouveau/page.tsx',{error:'Serveur indisponible'}).includes('role="alert"'));
for(const item of store.permissions){assert.doesNotThrow(()=>render('mon-espace/page.tsx',{selectedId:item.id}));assert.doesNotThrow(()=>render('validations/page.tsx',{selected:item}));assert.doesNotThrow(()=>render('page.tsx',{tab:'tickets',selectedId:item.id}));}
for(const uiStatus of ['all','pending','approved','rejected','cancelled'])assert.doesNotThrow(()=>render('mon-espace/page.tsx',{uiStatus}));
const many=Array.from({length:20},(_,i)=>({...store.permissions[1],id:'approved-'+i}));
many.push({...store.permissions[0],id:'pending-last',departureTime:'2026-12-25T10:00:00Z'});
const filteredPage=render('mon-espace/page.tsx',{tickets:many,uiStatus:'pending',page:1,selectedId:null});assert.ok(filteredPage.includes('25/12'),'Filtrer avant de paginer');assert.ok(!filteredPage.includes('Suivant'),'Une seule demande filtrée = une page');
assert.ok(render('page.tsx',{isLoading:true}).includes('Chargement des permissions'));
assert.ok(render('suivi/page.tsx',{uiLoadError:'Erreur de lecture'}).includes('role="alert"'));
const response=(url,method='GET',body={},role='ADMIN')=>demoResponse(new URL('https://example.test'+url),method,body,store,role);
(async()=>{
 assert.equal(response('/permission-tickets/me','GET',{},'EMPLOYEE').status,200);
 const own=await response('/permission-tickets/me','GET',{},'EMPLOYEE').json();assert.ok(own.every(t=>t.employeeId==='demo-laure'));
 assert.equal(response('/permission-tickets/demo-permission-completed/events','GET',{},'EMPLOYEE').status,404);
 assert.equal((await response('/permission-tickets/demo-permission-return/events').json()).at(-1).type,'RETURN_DECLARED');
 assert.equal(response('/permission-tickets/demo-permission-1/status','PATCH',{status:'REJECTED'}).status,400);
 assert.equal(response('/permission-tickets/demo-permission-1/status','PATCH',{status:'APPROVED'},'EMPLOYEE').status,403);
 assert.equal(response('/permission-tickets/demo-permission-1/status','PATCH',{status:'REJECTED',rejectionReason:'Effectif requis'}).status,200);
 assert.equal(response('/permission-tickets/demo-permission-return/return','PATCH',{}).status,501);
 const body={type:'AUTRE',reason:'Démarche administrative',departureTime:'2026-11-13T10:00:00Z',expectedReturnTime:'2026-11-13T12:00:00Z'};
 const created=await response('/permission-tickets','POST',body,'EMPLOYEE').json();assert.equal(created.status,'PENDING');assert.equal(response('/permission-tickets/'+created.id+'/cancel','PATCH',{},'EMPLOYEE').status,200);
 assert.equal(response('/permission-tickets','POST',{...body,employeeId:'demo-patrick'},'EMPLOYEE').status,403);
 render('nouveau/page.tsx',{uiStep:3});await formProps.onSubmit();assert.equal(payload.url,'/permission-tickets');assert.equal(payload.body.reason,'Visite client');assert.equal(payload.body.type,'URGENCE');assert.equal(payload.body.employeeId,undefined);assert.ok(Date.parse(payload.body.expectedReturnTime)>Date.parse(payload.body.departureTime));
 render('nouveau/page.tsx',{uiStep:3,onBehalf:true,selectedEmployeeId:'demo-sandrine',employeesList:store.employees,type:'MISSION',missionType:'SAV'});await formProps.onSubmit();assert.equal(payload.body.employeeId,'demo-sandrine');assert.equal(payload.body.missionType,'SAV');
 payload=undefined;render('nouveau/page.tsx',{uiStep:3,reason:'ab'});await formProps.onSubmit();assert.equal(payload,undefined,'Motif trop court : aucun envoi');
 console.log('Permissions : 8 routes, API/droits/calculs/actions/documents conservés ; formulaire, états, statuts, retours et démo mutable vérifiés.');
})().catch(e=>{console.error(e);process.exitCode=1;});
