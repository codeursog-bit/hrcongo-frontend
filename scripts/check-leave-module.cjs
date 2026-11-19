const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),Module=require('node:module'),ts=require('typescript');
const root=path.resolve(__dirname,'..'),dir='app/(dashboard)/conges';
function walk(dir){return fs.readdirSync(path.join(root,dir),{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(dir+'/'+e.name):e.name==='page.tsx'?[dir+'/'+e.name]:[]);}
const files=walk(dir),print=ts.createPrinter({removeComments:true});
function normalized(text){return text.replaceAll('\r\n','\n').replace(/\s*setUiLoadError\('[^']*'\);/g,'').replace(/\s*setTimeout\(\(\) => router.push\(bp\('\/conges\/mon-espace'\)\), 2500\);/g,'');}
function inspect(text){const sf=ts.createSourceFile('test.tsx',normalized(text),99,true,4),out={api:[],vars:[],docs:[],actions:[]};
 const emit=n=>print.printNode(ts.EmitHint.Unspecified,n,sf);
 function hasJsx(n){let found=false;function v(x){if(ts.isJsxElement(x)||ts.isJsxSelfClosingElement(x))found=true;else ts.forEachChild(x,v);}v(n);return found;}
 function v(n){
  if(ts.isCallExpression(n)&&/^(api\.(get|post|put|patch|delete)|fetch|useApprovalDecision|useDocSignatures|useBasePath|useParams|useRouter)$/.test(n.expression.getText(sf)))out.api.push(emit(n));
  if(ts.isVariableDeclaration(n)&&n.initializer&&!(/ui[A-Z]/.test(n.name.getText(sf))||n.name.getText(sf)==='yearColor')&&!hasJsx(n.initializer))out.vars.push(emit(n));
  if(ts.isJsxAttribute(n)&&/^(onClick|onChange|onSubmit|onConfirm|onSave|onDecision|onOpinion)$/.test(n.name.getText(sf)))out.actions.push(emit(n.initializer));
  if(ts.isJsxElement(n)||ts.isJsxSelfClosingElement(n)){const name=(ts.isJsxElement(n)?n.openingElement:n).tagName.getText(sf);if(/Printable|Document$|PrintAuthorizationModal|^style$/.test(name)){out.docs.push(emit(n));return;}}
  ts.forEachChild(n,v);
 }v(sf);out.actions.sort();return out;
}
require('./check-leave-review.cjs');
// Keep the independent HEAD guard for the unchanged cash-payment component.
for(const file of ['components/loans/CashPaymentModal.tsx']){
 const before=inspect(cp.execFileSync('git',['-c','safe.directory='+root.replaceAll('\\','/'),'show','HEAD:'+file],{cwd:root,encoding:'utf8'})),after=inspect(fs.readFileSync(path.join(root,file),'utf8'));
 assert.deepEqual(after.api,before.api,file+': API/hooks métier');assert.deepEqual(after.vars,before.vars,file+': états/calculs/validations/permissions/handlers');assert.deepEqual(after.docs,before.docs,file+': documents et styles imprimables');
 const remaining=[...after.actions];for(const action of before.actions){const i=remaining.indexOf(action);assert.ok(i>=0,file+': callback perdu '+action);remaining.splice(i,1);}
}
const resolve=Module._resolveFilename,load=Module._load;
Module._resolveFilename=function(name,parent,...args){return resolve.call(this,name.startsWith('@/')?path.join(root,name.slice(2)):name,parent,...args);};
for(const ext of ['.ts','.tsx'])require.extensions[ext]=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{fileName:f,compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText,f);require.extensions['.css']=()=>{};
const React=require('react'),{renderToStaticMarkup}=require('react-dom/server');let currentFile,names,index,overrides,formProps,requestPayload;
Module._load=function(name,parent,...args){
 if(name==='react')return {...React,useLayoutEffect(){},...(parent?.filename===currentFile?{useEffect(){},useState(initial){const key=names[index++];return [key in overrides?overrides[key]:typeof initial==='function'?initial():initial,()=>{}];}}:{})};
 if(name==='next/navigation')return {useParams:()=>({id:'demo-leave-1'}),useRouter:()=>({push(){},back(){},replace(){}}),usePathname:()=>'/conges',useSearchParams:()=>new URLSearchParams()};
 if(name==='@/hooks/useBasePath')return {useBasePath:()=>({bp:p=>p})};
 if(name==='@/hooks/useApprovalDecision')return {useApprovalDecision:()=>({decide(){},dialog:null})};
 if(name==='@/hooks/useDocSignatures')return {useDocSignatures:()=>[]};
 if(name==='@/components/CongeSubNav')return {__esModule:true,default:()=>null};
 if(name==='@/components/design-system/feedback'&&parent?.filename===currentFile){const actual=load.call(this,name,parent,...args);return {...actual,useToast:()=>()=>{}};}
 if(name==='@/services/api'&&parent?.filename===currentFile)return {api:{post:async(url,body)=>{requestPayload={url,body};return {};},get:async()=>[],patch:async()=>({}),delete:async()=>({})}};
 if(name==='@/components/requests'&&parent?.filename===currentFile){const actual=load.call(this,name,parent,...args);return {...actual,RequestForm:p=>{formProps=p;return React.createElement(actual.RequestForm,p);}};}
 return load.call(this,name,parent,...args);
};
const {createDemoStore}=require('../lib/demo/transport.ts'),store=createDemoStore();
function render(file,extra={}){currentFile=path.join(root,file);names=[...fs.readFileSync(currentFile,'utf8').matchAll(/const \[([^,\]]+),[^\]]+\]\s*=\s*useState/g)].map(m=>m[1]);index=0;formProps=null;overrides={isLoading:false,loading:false,isLoadingEmployees:false,userRole:'ADMIN',currentUser:{role:'ADMIN'},employees:store.employees,leaves:[],myLeaves:[],formData:{employeeId:'demo-laure',type:'ANNUAL',startDate:'2026-11-16',endDate:'2026-11-20',reason:'Repos familial'},...extra};return renderToStaticMarkup(React.createElement(require(currentFile).default));}
for(const file of files){assert.doesNotThrow(()=>render(file),file+': rendu vide');}
const form=dir+'/nouveau/page.tsx';for(let uiStep=0;uiStep<4;uiStep++){const html=render(form,{uiStep});assert.equal(formProps.step,uiStep);assert.equal(formProps.onSubmit.name,'handleSubmit');assert.ok(html.includes('Récapitulatif'));assert.ok(html.includes('Quoi'));}
assert.ok(render(form,{showConfirmation:true}).includes('Voir ma demande'));
assert.ok(render(form,{submitError:'Serveur indisponible'}).includes('role="alert"'));
assert.ok(render(form,{currentUser:{role:'EMPLOYEE'},formData:{employeeId:'demo-laure',type:'ANNUAL_ANTICIPATED',startDate:'2026-11-16',endDate:'2026-11-20',reason:''}}).includes('Congé Annuel Anticipé'));
for(const status of ['PENDING','APPROVED','REJECTED','CANCELLED'])assert.doesNotThrow(()=>render(dir+'/mon-espace/page.tsx',{uiStatus:'all',myLeaves:[{...store.leaves[0],status}]}));
assert.ok(render(dir+'/page.tsx',{isLoading:true}).includes('role="status"'));
assert.ok(render(dir+'/gestion/page.tsx',{uiLoadError:'Serveur indisponible'}).includes('role="alert"'));
const {demoResponse}=require('../lib/demo/transport.ts');
const response=(url,role='ADMIN')=>demoResponse(new URL('https://example.test'+url),'GET',{},store,role);
(async()=>{
 for(const p of ['/leaves/me/balance','/leaves/me/balance-explained','/leaves/balance/demo-laure','/leaves/balances','/leaves/provision','/leaves/carryover/demo-laure','/leaves/visual-overview?year=2026','/leaves/management-overview?month=10&year=2026','/leaves/departure-history?year=2026','/leaves/requests-history?year=2026','/leaves/planning?month=10&year=2026','/leaves/departure-program?month=10&year=2026','/leaves/yearly-trend?year=2026','/leaves/employee-history/demo-laure','/leaves/departure-history/employee/demo-laure','/leaves/pending-remainders','/absence-tracking/dashboard?scope=leave','/absence-tracking/grid?scope=leave','/absence-tracking/month-journal?scope=leave','/absence-tracking/compare?scope=leave&years=2025,2026','/absence-tracking/yearly-overview?scope=leave'])assert.equal(response(p).status,200,p);
 assert.equal(response('/leaves/me','EMPLOYEE').status,200);assert.equal(response('/leaves/balances','EMPLOYEE').status,403);assert.equal(response('/leaves/balance/demo-patrick','EMPLOYEE').status,404);assert.equal(response('/leaves/calculate-return-date?days=10').status,501);
 const read=async p=>response(p).json(),balances=await read('/leaves/balances'),ex=await read('/leaves/me/balance-explained'),overview=await read('/leaves/management-overview?month=10&year=2026'),departures=await read('/leaves/departure-history?year=2026'),visual=await read('/leaves/visual-overview?year=2026');
 assert.equal(departures.stats.totalDays,24);assert.equal(ex.totals.remaining,18);assert.equal(balances[0].annualTaken,8);
 assert.doesNotThrow(()=>render(dir+'/mon-espace/page.tsx',{balance:balances[0],ex,uiStatus:'all',myLeaves:store.leaves.filter(x=>x.employeeId==='demo-laure')}));
 assert.doesNotThrow(()=>render(dir+'/gestion/page.tsx',{overview}));assert.doesNotThrow(()=>render(dir+'/historique/page.tsx',{data:departures,dataTab:'departures'}));assert.doesNotThrow(()=>render(dir+'/diagrammes/page.tsx',{data:visual}));assert.doesNotThrow(()=>render(dir+'/soldes/page.tsx',{balances}));
 assert.doesNotThrow(()=>render(dir+'/[id]/page.tsx',{leave:store.leaves[0]}));
 render(form,{uiStep:3});await formProps.onSubmit();assert.deepEqual(requestPayload,{url:'/leaves',body:{employeeId:'demo-laure',type:'ANNUAL',startDate:'2026-11-16',endDate:'2026-11-20',reason:'Repos familial'}});
 console.log('Congés : 13 routes, API/calculs/droits/actions/documents et remboursement conservés ; états, quatre étapes, payload, fixtures et droits démo vérifiés.');
})().catch(e=>{console.error(e);process.exitCode=1;});
